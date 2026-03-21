@echo off
title BJ Trainer
cd /d "%~dp0"
echo.
echo   BJ Trainer - Starting...
echo   Close this window to stop the server.
echo.
npx next dev --hostname 0.0.0.0 --port 3000
