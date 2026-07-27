; Inno Setup script for S.P.A.R.T.A Windows installer
; Compile with: iscc scripts\installer-win.iss

#define MyAppName "S.P.A.R.T.A"
#define MyAppShortName "sparta"
#define MyAppVersion "1.0.0"
#define MyAppPublisher "S.P.A.R.T.A AI"
#define MyAppURL "https://github.com/Kenzioda/sparta-ai"
#define MyAppExeName "sparta.exe"

[Setup]
AppId={{A1B2C3D4-E5F6-7890-ABCD-EF1234567890}
AppName={#MyAppName}
AppVersion={#MyAppVersion}
AppPublisher={#MyAppPublisher}
AppPublisherURL={#MyAppURL}
AppSupportURL={#MyAppURL}
AppUpdatesURL={#MyAppURL}
DefaultDirName={autopf}\{#MyAppShortName}
DefaultGroupName={#MyAppName}
AllowNoIcons=yes
OutputDir=..\dist
OutputBaseFilename=sparta-{#MyAppVersion}-win-x64-installer
Compression=lzma
SolidCompression=yes
WizardStyle=modern
PrivilegesRequired=lowest
DisableProgramGroupPage=yes

[Languages]
Name: "english"; MessagesFile: "compiler:Default.isl"

[Tasks]
Name: "desktopicon"; Description: "Create desktop shortcut"; GroupDescription: "Additional shortcuts"; Flags: checkedonce

[Files]
; Engine binary
Source: "..\sparta.exe"; DestDir: "{app}"; Flags: ignoreversion

; Sparta config
Source: "..\.opencode\*"; DestDir: "{app}\.opencode"; Flags: ignoreversion recursesubdirs createallsubdirs
Source: "..\themes\*"; DestDir: "{app}\themes"; Flags: ignoreversion recursesubdirs createallsubdirs
Source: "..\skills\*"; DestDir: "{app}\skills"; Flags: ignoreversion recursesubdirs createallsubdirs
Source: "..\specs\*"; DestDir: "{app}\specs"; Flags: ignoreversion recursesubdirs createallsubdirs
Source: "..\README.md"; DestDir: "{app}"; Flags: ignoreversion
Source: "..\LICENSE"; DestDir: "{app}"; Flags: ignoreversion

; Wrapper batch file that sets OPENCODE_CONFIG_DIR
Source: "..\scripts\sparta-runner.bat"; DestDir: "{app}"; Flags: ignoreversion

[Icons]
Name: "{autoprograms}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"; WorkingDir: "{app}"
Name: "{autodesktop}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"; WorkingDir: "{app}"; Tasks: desktopicon

[Run]
Filename: "{app}\{#MyAppExeName}"; Description: "Launch S.P.A.R.T.A"; Flags: postinstall nowait skipifsilent

[Registry]
Root: HKCU; Subkey: "Environment"; ValueType: expandsz; ValueName: "Path"; ValueData: "{olddata};{app}"; Check: NeedsAddPath(ExpandConstant('{app}'))

[Code]
function NeedsAddPath(Param: string): boolean;
var
  OrigPath: string;
begin
  if not RegQueryStringValue(HKEY_CURRENT_USER, 'Environment', 'Path', OrigPath) then
  begin
    Result := True;
    exit;
  end;
  Result := Pos(Uppercase(Param), Uppercase(OrigPath)) = 0;
end;
