@echo off
chcp 65001 >nul
title Update Airport Equipment Management

echo ==========================================
echo     Update Airport Equipment Management
echo ==========================================
echo.

echo [1/6] Stopping running services...
taskkill /F /IM node.exe /T >nul 2>&1
timeout /t 2 >nul

echo [2/6] Pulling latest code from git...
cd /d %~dp0
git pull origin main

if %errorlevel% neq 0 (
    echo.
    echo ERROR: Failed to pull from git!
    echo Please check your git connection and try again.
    pause
    exit /b 1
)

echo [3/6] Installing dependencies...
set NPM_CONFIG_REGISTRY=https://registry.npmmirror.com
npm install

if %errorlevel% neq 0 (
    echo.
    echo ERROR: Failed to install dependencies!
    pause
    exit /b 1
)

echo [4/6] Running Prisma migrations...
npx prisma generate
npx prisma db push

if %errorlevel% neq 0 (
    echo.
    echo ERROR: Failed to run Prisma migrations!
    pause
    exit /b 1
)

echo [5/6] Building project...
npm run build

if %errorlevel% neq 0 (
    echo.
    echo ERROR: Failed to build project!
    pause
    exit /b 1
)

echo [6/6] Restarting services...
start "Backend Server" cmd /k "cd /d %~dp0 && npm run server"
timeout /t 3 >nul
start "Frontend Server" cmd /k "cd /d %~dp0 && npm run dev"

timeout /t 5 >nul

echo.
echo ==========================================
echo  Update completed successfully!
echo  Frontend: http://localhost:3000
echo  Backend: http://localhost:5000
echo ==========================================
echo.

echo Press any key to open browser...
pause >nul

start http://localhost:3000
