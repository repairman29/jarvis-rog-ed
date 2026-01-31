@echo off
setlocal

REM Run JARVIS Safety Net from repo root
set SCRIPT_DIR=%~dp0
pushd "%SCRIPT_DIR%\.."

node "scripts\jarvis-safety-net.js" --repair

popd
endlocal
