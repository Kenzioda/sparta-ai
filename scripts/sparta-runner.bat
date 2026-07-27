@echo off
setlocal
set "SPARTA_DIR=%~dp0"
set "OPENCODE_CONFIG_DIR=%SPARTA_DIR%.opencode"
"%SPARTA_DIR%sparta.exe" %*
