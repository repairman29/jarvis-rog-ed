@echo off
setlocal

REM Run Jarvis repo indexer from repo root
set SCRIPT_DIR=%~dp0
pushd "%SCRIPT_DIR%\.."

node "scripts\index-repos.js"

popd
endlocal
