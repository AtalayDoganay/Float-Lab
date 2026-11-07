# Rebuilds the app and points the Desktop (and Start Menu) shortcut at the
# fresh build, so double-clicking "Roseflow PC Mac Training" always opens the
# newest version. Progress is untouched: every build uses the same folder,
# %APPDATA%\Roseflow PC Mac Training.
#
#   npm run desktop
$ErrorActionPreference = 'Stop'
$repo = Split-Path -Parent $PSScriptRoot
$exe = Join-Path $repo 'out\Roseflow PC Mac Training-win32-x64\RoseflowPCMacTraining.exe'

# A running copy locks its files and the rebuild would fail half-way.
if (Get-Process -Name RoseflowPCMacTraining -ErrorAction SilentlyContinue) {
  Write-Host 'Roseflow is open. Close it, then run "npm run desktop" again.'
  exit 1
}

Push-Location $repo
try {
  & npx electron-forge package
  if ($LASTEXITCODE -ne 0) { throw "electron-forge package failed (exit $LASTEXITCODE)" }
} finally {
  Pop-Location
}
if (-not (Test-Path $exe)) { throw "The build did not produce $exe" }

$shell = New-Object -ComObject WScript.Shell
$links = @(
  (Join-Path ([Environment]::GetFolderPath('Desktop')) 'Roseflow PC Mac Training.lnk'),
  (Join-Path ([Environment]::GetFolderPath('Programs')) 'Atalay Doganay\Roseflow PC Mac Training.lnk')
)
foreach ($link in $links) {
  # The Desktop shortcut is always written; the Start Menu one only where it already exists.
  if ($link -notlike '*Desktop*' -and -not (Test-Path $link)) { continue }
  $s = $shell.CreateShortcut($link)
  $s.TargetPath = $exe
  $s.WorkingDirectory = Split-Path -Parent $exe
  $s.IconLocation = "$exe,0"
  $s.Description = 'Roseflow PC Mac Training (latest build)'
  $s.Save()
  Write-Host "Shortcut -> latest build: $link"
}
Write-Host "Built: $((Get-Item $exe).LastWriteTime)"
