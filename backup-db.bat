@echo off
setlocal EnableExtensions DisableDelayedExpansion
title Database Backup Tool

set "PROJECT_DIR=%~dp0"
cd /d "%PROJECT_DIR%"
if errorlevel 1 goto :FATAL_CD

node backup-db.js

echo.
echo ==========================================
echo   创作者：原靖杰
echo   时间：2026.7.22
echo   版本：v1.0
echo ==========================================
echo.

pause
endlocal
goto :EOF

:FATAL_CD
echo.
echo [FAIL] Failed to switch to project directory: %PROJECT_DIR%
echo.
pause
exit /b 1
