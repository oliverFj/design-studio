@echo off
cd /d "%~dp0"
if exist "%~dp0release\current\win-unpacked\Design Studio.exe" (
  start "" "%~dp0release\current\win-unpacked\Design Studio.exe" %*
  exit /b
)
if exist "%~dp0node_modules\electron\dist\electron.exe" (
  start "" "%~dp0node_modules\electron\dist\electron.exe" "%~dp0." %*
  exit /b
)
echo Design Studio er endnu ikke bygget. Koer npm install og npm run desktop:build i denne mappe.
pause
