; Script generated for Inno Setup - Cash Management System Windows Installer
#define MyAppName "نظام إدارة التحويلات الذكي"
#define MyAppEnglishName "CashManagementSystem"
#define MyAppVersion "1.0.0"
#define MyAppPublisher "مؤسسة التيسير للخدمات المالية"
#define MyAppExeName "CashManagementSystem.exe"

[Setup]
; NOTE: The value of AppId uniquely identifies this application.
AppId={{E6F7A912-3D4C-4F8A-9A1B-5E7C8D9E0F1A}
AppName={#MyAppName}
AppVersion={#MyAppVersion}
AppPublisher={#MyAppPublisher}
DefaultDirName={autopf}\{#MyAppEnglishName}
DefaultGroupName={#MyAppName}
; Allow user to choose any installation folder
DisableDirPage=no
DirExistsWarning=yes
AlwaysShowDirOnReadyPage=yes
OutputBaseFilename=CashManagementSystem_Setup_v1.0
Compression=lzma2/ultra64
SolidCompression=yes
WizardStyle=modern
ArchitecturesInstallIn64BitMode=x64

[Languages]
Name: "english"; MessagesFile: "compiler:Default.isl"

[Tasks]
Name: "desktopicon"; Description: "{cm:CreateDesktopIcon}"; GroupDescription: "{cm:AdditionalIcons}"; Flags: unchecked

[Files]
; Copy all application build files and portable node runtime into the chosen installation directory
Source: "dist\*"; DestDir: "{app}\dist"; Flags: ignoreversion recursesubdirs createallsubdirs
Source: "server.js"; DestDir: "{app}"; Flags: ignoreversion
Source: "package.json"; DestDir: "{app}"; Flags: ignoreversion
; App data will be stored inside {app}\data
Source: "README.md"; DestDir: "{app}"; Flags: isreadme

[Dirs]
; Ensure app_data directory is created inside the user chosen folder
Name: "{app}\app_data"; Permissions: users-full

[Icons]
Name: "{group}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"
Name: "{group}\{cm:UninstallProgram,{#MyAppName}}"; Filename: "{uninstallexe}"
Name: "{autodesktop}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"; Tasks: desktopicon

[Run]
Filename: "{app}\{#MyAppExeName}"; Description: "{cm:LaunchProgram,{#MyAppName}}"; Flags: nowait postinstall skipifsilent
