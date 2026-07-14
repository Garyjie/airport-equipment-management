@echo off
setlocal EnableExtensions DisableDelayedExpansion
title Stop Airport Equipment Management

set "PROJECT_DIR=%~dp0"
cd /d "%PROJECT_DIR%"
if errorlevel 1 goto :FATAL_CD

echo ==========================================
echo     Stop Airport Equipment Management
echo ==========================================
echo.

echo [1/2] Stopping Node processes...
taskkill /F /IM node.exe /T >nul 2>&1

echo [2/2] Stopping Electron processes...
taskkill /F /IM electron.exe /T >nul 2>&1

timeout /t 1 /nobreak >nul

echo.
echo ==========================================
echo  All services stopped!
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
