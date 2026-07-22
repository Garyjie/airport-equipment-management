@echo off
setlocal EnableExtensions DisableDelayedExpansion
title Airport Equipment Management - One-Click Deploy

echo ============================================
echo   Airport Equipment Management System
echo   One-Click Deployment Script
echo ============================================
echo.

set "NODE_VERSION=20.11.0"
set "NODE_URL=https://mirrors.huaweicloud.com/nodejs/v%NODE_VERSION%/node-v%NODE_VERSION%-x64.msi"
set "NODE_INSTALLER=%TEMP%\node-v%NODE_VERSION%-x64.msi"

set "PROJECT_DIR=%~dp0"
cd /d "%PROJECT_DIR%"
if errorlevel 1 goto :FATAL_CD

:CHECK_NODE
echo [1/4] Checking Node.js environment...
where node >nul 2>&1
if not errorlevel 1 goto :NODE_OK
goto :NODE_MISSING

:NODE_OK
for /f "tokens=*" %%i in ('node --version 2^>nul') do set "NODE_VER=%%i"
echo       [OK] Node.js installed: %NODE_VER%

where npm >nul 2>&1
if not errorlevel 1 goto :NPM_OK
goto :NPM_MISSING

:NPM_OK
for /f "tokens=*" %%i in ('npm --version 2^>nul') do set "NPM_VER=%%i"
echo       [OK] npm installed: %NPM_VER%
goto :NODE_DONE

:NPM_MISSING
echo       [FAIL] npm not found, trying to fix...
call :FIX_NPM
goto :NODE_DONE

:NODE_MISSING
echo       [FAIL] Node.js not installed
echo       Downloading Node.js v%NODE_VERSION%...
call :INSTALL_NODE
goto :NODE_DONE

:NODE_DONE
echo.
echo [1.5/4] Configuring npm mirror sources...
set "MIRROR1=https://registry.npmmirror.com"
set "MIRROR2=https://mirrors.huaweicloud.com/repository/npm/"
set "MIRROR3=https://mirrors.cloud.tencent.com/npm/"

set "NPM_CMD_TO_USE=npm"
if defined NPM_CMD set "NPM_CMD_TO_USE=%NPM_CMD%"

call :TRY_MIRROR "%MIRROR1%" "Taobao"
if not errorlevel 1 goto MIRROR_OK
call :TRY_MIRROR "%MIRROR2%" "Huawei"
if not errorlevel 1 goto MIRROR_OK
call :TRY_MIRROR "%MIRROR3%" "Tencent"
if not errorlevel 1 goto MIRROR_OK

echo       [WARN] All mirror sources failed, resetting to official npm registry
"%NPM_CMD_TO_USE%" config set registry https://registry.npmjs.org >nul 2>&1
goto MIRROR_OK

:TRY_MIRROR
echo       Trying %2 mirror...
"%NPM_CMD_TO_USE%" config set registry %1 >nul 2>&1
if errorlevel 1 exit /b 1
"%NPM_CMD_TO_USE%" info npm version >nul 2>&1
if not errorlevel 1 (
    echo       [OK] Using %2 mirror: %1
    exit /b 0
)
exit /b 1

:MIRROR_OK
echo.
goto CHECK_DEPENDENCIES

:INSTALL_NODE
set "LOCAL_INSTALLER=%PROJECT_DIR%node-v%NODE_VERSION%-x64.msi"

if exist "%LOCAL_INSTALLER%" (
    echo       [OK] Found local installer, installing directly...
    msiexec /i "%LOCAL_INSTALLER%" /qn /norestart
) else (
    echo       [WARN] Local installer not found, downloading from mirror...
    powershell -Command "Invoke-WebRequest -Uri '%NODE_URL%' -OutFile '%NODE_INSTALLER%'"
    if errorlevel 1 (
        echo       [FAIL] Download failed, please install Node.js manually
        echo       Download URL: %NODE_URL%
        goto :PAUSE_EXIT
    )
    echo       [OK] Download finished, installing...
    msiexec /i "%NODE_INSTALLER%" /qn /norestart
    if exist "%NODE_INSTALLER%" del "%NODE_INSTALLER%" >nul 2>&1
)

if errorlevel 1 (
    echo       [FAIL] Install failed, please install Node.js manually
    goto :PAUSE_EXIT
)
echo       [OK] Node.js installed successfully

echo       Refreshing system PATH...
set "NODE_PATH=C:\Program Files\nodejs"
set "PATH=%NODE_PATH%;%PATH%"
where node >nul 2>&1
if errorlevel 1 (
    echo       [WARN] PATH not effective immediately, trying absolute path...
    set "NODE_EXE=%NODE_PATH%\node.exe"
    set "NPM_CMD=%NODE_PATH%\npm.cmd"
)
echo.
goto CHECK_NODE

:FIX_NPM
set "NPM_DIR=%USERPROFILE%\AppData\Roaming\npm"
if not exist "%NPM_DIR%" (
    mkdir "%NPM_DIR%" >nul 2>&1
)
set "PATH=%NPM_DIR%;%PATH%"
where npm >nul 2>&1
if not errorlevel 1 (
    echo       [OK] npm fix succeeded
    goto :EOF
)
echo       [FAIL] npm fix failed, please reinstall Node.js
goto :PAUSE_EXIT

:CHECK_DEPENDENCIES
echo [2/4] Checking project dependencies...
if exist "node_modules" (
    echo       [OK] Dependencies already installed
) else (
    echo       [FAIL] Dependencies missing, installing...
    call :INSTALL_DEPENDENCIES
)

echo.
goto CHECK_DATABASE

:INSTALL_DEPENDENCIES
if defined NPM_CMD (
    "%NPM_CMD%" install
) else (
    npm install
)
if errorlevel 1 (
    echo       [FAIL] Dependency installation failed
    echo       Error code: %errorlevel%
    goto :PAUSE_EXIT
)
echo       [OK] Dependencies installed successfully
goto :EOF

:CHECK_DATABASE
echo [3/4] Checking database...
if exist "prisma\dev.db" (
    echo       [OK] Database file exists
) else (
    echo       [FAIL] Database missing, initializing...
    call :INIT_DATABASE
)

echo [3.5/4] Ensuring Prisma Client generated...
if defined NPM_CMD (
    "%NPM_CMD%" run prisma:generate
    if errorlevel 1 goto :PRISMA_GEN_FAIL
) else (
    npm run prisma:generate
    if errorlevel 1 goto :PRISMA_GEN_FAIL
)
echo       [OK] Prisma Client ready

echo.
goto START_APP

:INIT_DATABASE
if defined NPM_CMD (
    "%NPM_CMD%" run prisma:migrate
    if errorlevel 1 goto :DB_FAIL
    "%NPM_CMD%" run prisma:seed
    if errorlevel 1 goto :DB_FAIL
) else (
    npm run prisma:migrate
    if errorlevel 1 goto :DB_FAIL
    npm run prisma:seed
    if errorlevel 1 goto :DB_FAIL
)
echo       [OK] Database initialized successfully
goto :EOF

:DB_FAIL
echo       [FAIL] Database initialization failed
goto :PAUSE_EXIT

:PRISMA_GEN_FAIL
echo       [FAIL] Prisma Client generation failed
echo       Tip: Try running "npm run prisma:generate" manually
goto :PAUSE_EXIT

:START_APP
echo [4/4] Starting application...
echo       Backend API: http://localhost:5000
echo       Frontend URL: http://localhost:3000
echo.
echo       Press Ctrl+C to stop services
echo ============================================
echo.

start "Backend Server" cmd /k "cd /d ""%PROJECT_DIR%"" && npm run server:dev"
timeout /t 3 /nobreak >nul
start "Frontend Server" cmd /k "cd /d ""%PROJECT_DIR%"" && npm run dev"

start "" "http://localhost:3000"
echo       [OK] Application started!
echo.
goto :END_PAUSE

:FATAL_CD
echo [FATAL] Cannot switch to project directory: %PROJECT_DIR%
goto :PAUSE_EXIT

:PAUSE_EXIT
echo.
pause
exit /b 1

:END_PAUSE
echo.
echo ============================================
echo   创作者：原靖杰
echo   时间：2026.7.22
echo   版本：v1.0
echo ============================================
echo.
pause
endlocal
exit /b 0
