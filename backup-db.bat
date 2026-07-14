@echo off
setlocal EnableExtensions DisableDelayedExpansion
title Database Backup Tool

set "PROJECT_DIR=%~dp0"
cd /d "%PROJECT_DIR%"
if errorlevel 1 goto :FATAL_CD

node backup-db.js

pause
endlocal
goto :EOF

:FATAL_CD
echo.
echo [FAIL] Failed to switch to project directory: %PROJECT_DIR%
echo.
pause
exit /b 1
