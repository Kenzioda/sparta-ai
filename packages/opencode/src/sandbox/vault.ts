import crypto from "crypto"
import fs from "fs"
import path from "path"
import os from "os"

const ALGORITHM = "aes-256-gcm"
const KEY_LENGTH = 32
const SALT_LENGTH = 16
const IV_LENGTH = 12
const TAG_LENGTH = 16
const VAULT_DIR = path.join(os.homedir(), ".local", "share", "sparta", "vault")
const KEY_FILE = path.join(VAULT_DIR, ".key")
const VAULT_FILE = path.join(VAULT_DIR, "secrets.json.enc")

function deriveKey(passphrase: string, salt: Buffer): Buffer {
  return crypto.pbkdf2Sync(passphrase, salt, 100000, KEY_LENGTH, "sha512")
}

function machineId(): string {
  try {
    if (process.platform === "win32") {
      return require("child_process").execSync("wmic csproduct get uuid", {
        encoding: "utf-8", timeout: 3000,
      }).split("\n")[1]?.trim() || "fallback"
    }
    const etc = fs.readFileSync("/etc/machine-id", "utf-8").trim()
    if (etc) return etc
    return fs.readFileSync("/var/lib/dbus/machine-id", "utf-8").trim()
  } catch {
    return "fallback-machine-id"
  }
}

export class Vault {
  private passphrase: string
  private secrets: Record<string, string> = {}
  private loaded: boolean = false

  constructor(passphrase?: string) {
    this.passphrase = passphrase || `sparta-vault-${machineId()}`
    if (!fs.existsSync(VAULT_DIR)) fs.mkdirSync(VAULT_DIR, { recursive: true })
  }

  private ensureKeyFile(): void {
    if (!fs.existsSync(KEY_FILE)) {
      fs.writeFileSync(KEY_FILE, Buffer.alloc(0))
    }
  }

  load(): void {
    this.ensureKeyFile()
    if (!fs.existsSync(VAULT_FILE)) {
      this.secrets = {}
      this.loaded = true
      return
    }

    try {
      const encData = fs.readFileSync(VAULT_FILE)
      const salt = encData.subarray(0, SALT_LENGTH)
      const iv = encData.subarray(SALT_LENGTH, SALT_LENGTH + IV_LENGTH)
      const tag = encData.subarray(encData.length - TAG_LENGTH)
      const ciphertext = encData.subarray(SALT_LENGTH + IV_LENGTH, encData.length - TAG_LENGTH)

      const key = deriveKey(this.passphrase, salt)
      const decipher = crypto.createDecipheriv(ALGORITHM, key, iv)
      decipher.setAuthTag(tag)
      const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()])
      this.secrets = JSON.parse(decrypted.toString("utf-8"))
    } catch {
      this.secrets = {}
    }
    this.loaded = true
  }

  save(): void {
    if (!this.loaded) this.load()
    if (!fs.existsSync(VAULT_DIR)) fs.mkdirSync(VAULT_DIR, { recursive: true })

    const salt = crypto.randomBytes(SALT_LENGTH)
    const iv = crypto.randomBytes(IV_LENGTH)
    const key = deriveKey(this.passphrase, salt)

    const cipher = crypto.createCipheriv(ALGORITHM, key, iv)
    const plaintext = Buffer.from(JSON.stringify(this.secrets), "utf-8")
    const encrypted = Buffer.concat([cipher.update(plaintext), cipher.final()])
    const tag = cipher.getAuthTag()

    const output = Buffer.concat([salt, iv, encrypted, tag])
    fs.writeFileSync(VAULT_FILE, output)
  }

  set(key: string, value: string): void {
    if (!this.loaded) this.load()
    this.secrets[key] = value
    this.save()
  }

  get(key: string): string | undefined {
    if (!this.loaded) this.load()
    return this.secrets[key]
  }

  delete(key: string): void {
    if (!this.loaded) this.load()
    delete this.secrets[key]
    this.save()
  }

  list(): string[] {
    if (!this.loaded) this.load()
    return Object.keys(this.secrets)
  }

  has(key: string): boolean {
    if (!this.loaded) this.load()
    return key in this.secrets
  }
}
