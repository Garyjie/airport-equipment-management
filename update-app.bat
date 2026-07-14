@echo off
setlocal EnableExtensions DisableDelayedExpansion
title Update Airport Equipment Management

set "PROJECT_DIR=%~dp0"
cd /d "%PROJECT_DIR%"
if errorlevel 1 goto :FATAL_CD

echo ==========================================
echo     Update Airport Equipment Management
echo ==========================================
echo.

echo [1/6] Stopping running services...
taskkill /F /IM node.exe /T >nul 2>&1
timeout /t 2 /nobreak >nul

echo [2/6] Pulling latest code from git...
git pull origin dev
if errorlevel 1 goto :FAIL_GIT

echo [3/6] Installing dependencies...
set "NPM_CONFIG_REGISTRY=https://registry.npmmirror.com"
call npm install
if errorlevel 1 goto :FAIL_NPM

echo [4/6] Running Prisma migrations...
call npx prisma generate
if errorlevel 1 goto :FAIL_PRISMA
call npx prisma db push
if errorlevel 1 goto :FAIL_PRISMA

echo [5/6] Building project...
call npm run build
if errorlevel 1 goto :FAIL_BUILD

echo [6/6] Restarting services...
start "Backend Server" cmd /k "cd /d ""%PROJECT_DIR%"" && npm run server"
timeout /t 3 /nobreak >nul
start "Frontend Server" cmd /k "cd /d ""%PROJECT_DIR%"" && npm run dev"

timeout /t 5 /nobreak >nul

echo.
echo ==========================================
echo  Update completed successfully!
echo  Frontend: http://localhost:3000
echo  Backend: http://localhost:5000
echo ==========================================
echo.

echo Press any key to open browser...
pause >nul

start "" "http://localhost:3000"

endlocal
goto :EOF

:FAIL_GIT
echo.
echo [FAIL] Failed to pull from git (origin/dev)!
echo Please check your git connection and try again.
goto :PAUSE_EXIT

:FAIL_NPM
echo.
echo [FAIL] Failed to install dependencies!
goto :PAUSE_EXIT

:FAIL_PRISMA
echo.
echo [FAIL] Failed to run Prisma migrations!
goto :PAUSE_EXIT

:FAIL_BUILD
echo.
echo [FAIL] Failed to build project!
goto :PAUSE_EXIT

:FATAL_CD
echo.
echo [FAIL] Failed to switch to project directory: %PROJECT_DIR%
goto :PAUSE_EXIT

:PAUSE_EXIT
echo.
pause
exit /b 1
