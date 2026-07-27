<p align="center">
  <a href="https://sparta.ai">
    <picture>
      <source srcset="packages/console/app/src/asset/logo-ornate-dark.svg" media="(prefers-color-scheme: dark)">
      <source srcset="packages/console/app/src/asset/logo-ornate-light.svg" media="(prefers-color-scheme: light)">
      <img src="packages/console/app/src/asset/logo-ornate-light.svg" alt="S.P.A.R.T.A logo">
    </picture>
  </a>
</p>
<p align="center">Açık kaynaklı yapay zeka kodlama asistanı.</p>
<p align="center">
  <a href="https://sparta.ai/discord"><img alt="Discord" src="https://img.shields.io/discord/1391832426048651334?style=flat-square&label=discord" /></a>
  <a href="https://www.npmjs.com/package/sparta-ai"><img alt="npm" src="https://img.shields.io/npm/v/sparta-ai?style=flat-square" /></a>
  <a href="https://github.com/anomalyco/sparta/actions/workflows/publish.yml"><img alt="Build status" src="https://img.shields.io/github/actions/workflow/status/anomalyco/sparta/publish.yml?style=flat-square&branch=dev" /></a>
</p>

<p align="center">
  <a href="README.md">English</a> |
  <a href="README.zh.md">简体中文</a> |
  <a href="README.zht.md">繁體中文</a> |
  <a href="README.ko.md">한국어</a> |
  <a href="README.de.md">Deutsch</a> |
  <a href="README.es.md">Español</a> |
  <a href="README.fr.md">Français</a> |
  <a href="README.it.md">Italiano</a> |
  <a href="README.da.md">Dansk</a> |
  <a href="README.ja.md">日本語</a> |
  <a href="README.pl.md">Polski</a> |
  <a href="README.ru.md">Русский</a> |
  <a href="README.bs.md">Bosanski</a> |
  <a href="README.ar.md">العربية</a> |
  <a href="README.no.md">Norsk</a> |
  <a href="README.br.md">Português (Brasil)</a> |
  <a href="README.th.md">ไทย</a> |
  <a href="README.tr.md">Türkçe</a> |
  <a href="README.uk.md">Українська</a> |
  <a href="README.bn.md">বাংলা</a> |
  <a href="README.gr.md">Ελληνικά</a> |
  <a href="README.vi.md">Tiếng Việt</a>
</p>

[![S.P.A.R.T.A Terminal UI](packages/web/src/assets/lander/screenshot.png)](https://sparta.ai)

---

### Kurulum

```bash
# YOLO
curl -fsSL https://sparta.ai/install | bash

# Paket yöneticileri
npm i -g sparta-ai@latest        # veya bun/pnpm/yarn
scoop install sparta             # Windows
choco install sparta             # Windows
brew install anomalyco/tap/sparta # macOS ve Linux (önerilir, her zaman güncel)
brew install sparta              # macOS ve Linux (resmi brew formülü, daha az güncellenir)
sudo pacman -S sparta            # Arch Linux (Stable)
paru -S sparta-bin               # Arch Linux (Latest from AUR)
mise use -g sparta               # Tüm işletim sistemleri
nix run nixpkgs#sparta           # veya en güncel geliştirme dalı için github:anomalyco/sparta
```

> [!TIP]
> Kurulumdan önce 0.1.x'ten eski sürümleri kaldırın.

### Masaüstü Uygulaması (BETA)

S.P.A.R.T.A ayrıca masaüstü uygulaması olarak da mevcuttur. Doğrudan [sürüm sayfasından](https://github.com/anomalyco/sparta/releases) veya [S.P.A.R.T.A.ai/download](https://sparta.ai/download) adresinden indirebilirsiniz.

| Platform              | İndirme                            |
| --------------------- | ---------------------------------- |
| macOS (Apple Silicon) | `sparta-desktop-mac-arm64.dmg`   |
| macOS (Intel)         | `sparta-desktop-mac-x64.dmg`     |
| Windows               | `sparta-desktop-windows-x64.exe` |
| Linux                 | `.deb`, `.rpm` veya AppImage       |

```bash
# macOS (Homebrew)
brew install --cask sparta-desktop
# Windows (Scoop)
scoop bucket add extras; scoop install extras/sparta-desktop
```

#### Kurulum Dizini (Installation Directory)

Kurulum betiği (install script), kurulum yolu (installation path) için aşağıdaki öncelik sırasını takip eder:

1. `$SPARTA_INSTALL_DIR` - Özel kurulum dizini
2. `$XDG_BIN_DIR` - XDG Base Directory Specification uyumlu yol
3. `$HOME/bin` - Standart kullanıcı binary dizini (varsa veya oluşturulabiliyorsa)
4. `$HOME/.sparta/bin` - Varsayılan yedek konum

```bash
# Örnekler
S.P.A.R.T.A_INSTALL_DIR=/usr/local/bin curl -fsSL https://sparta.ai/install | bash
XDG_BIN_DIR=$HOME/.local/bin curl -fsSL https://sparta.ai/install | bash
```

### Ajanlar

S.P.A.R.T.A, `Tab` tuşuyla aralarında geçiş yapabileceğiniz iki yerleşik (built-in) ajan içerir.

- **build** - Varsayılan, geliştirme çalışmaları için tam erişimli ajan
- **plan** - Analiz ve kod keşfi için salt okunur ajan
  - Varsayılan olarak dosya düzenlemelerini reddeder
  - Bash komutlarını çalıştırmadan önce izin ister
  - Tanımadığınız kod tabanlarını keşfetmek veya değişiklikleri planlamak için ideal

Ayrıca, karmaşık aramalar ve çok adımlı görevler için bir **genel** alt ajan bulunmaktadır.
Bu dahili olarak kullanılır ve mesajlarda `@general` ile çağrılabilir.

[Ajanlar](https://sparta.ai/docs/agents) hakkında daha fazla bilgi edinin.

### Dokümantasyon

S.P.A.R.T.A'u nasıl yapılandıracağınız hakkında daha fazla bilgi için [**dokümantasyonumuza göz atın**](https://sparta.ai/docs).

### Katkıda Bulunma

S.P.A.R.T.A'a katkıda bulunmak istiyorsanız, lütfen bir pull request göndermeden önce [katkıda bulunma dokümanlarımızı](./CONTRIBUTING.md) okuyun.

### S.P.A.R.T.A Üzerine Geliştirme

S.P.A.R.T.A ile ilgili bir proje üzerinde çalışıyorsanız ve projenizin adının bir parçası olarak "S.P.A.R.T.A" kullanıyorsanız (örneğin, "S.P.A.R.T.A-dashboard" veya "S.P.A.R.T.A-mobile"), lütfen README dosyanıza projenin S.P.A.R.T.A ekibi tarafından geliştirilmediğini ve bizimle hiçbir şekilde bağlantılı olmadığını belirten bir not ekleyin.

---

**Topluluğumuza katılın** [Discord](https://discord.gg/sparta) | [X.com](https://x.com/sparta)
