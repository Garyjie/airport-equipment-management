@echo off
chcp 65001 >nul
title Stop Airport Equipment Management

echo ==========================================
echo     Stop Airport Equipment Management
echo ==========================================
echo.

echo [1/2] Stopping Node processes...
taskkill /F /IM node.exe /T >nul 2>&1

echo [2/2] Stopping Electron processes...
taskkill /F /IM electron.exe /T >nul 2>&1

timeout /t 1 >nul

echo.
echo ==========================================
echo  All services stopped!
echo ==========================================
echo.

pause
