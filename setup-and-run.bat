@echo off
chcp 65001 >nul
title 机场设备管理系统 - 一键部署

echo ============================================
echo   机场设备管理系统 - 一键部署脚本
echo ============================================
echo.

set "NODE_VERSION=20.17.0"
set "NODE_URL=https://nodejs.org/dist/v%NODE_VERSION%/node-v%NODE_VERSION%-x64.msi"
set "NODE_INSTALLER=%TEMP%\node-v%NODE_VERSION%-x64.msi"

set "PROJECT_DIR=%~dp0"
cd /d "%PROJECT_DIR%"

:CHECK_NODE
echo [1/4] 检测 Node.js 环境...
where node >nul 2>&1
if %errorlevel% equ 0 (
    for /f "tokens=2" %%i in ('node --version') do set "NODE_VER=%%i"
    echo       ✅ Node.js 已安装: v%NODE_VER%
    
    where npm >nul 2>&1
    if %errorlevel% equ 0 (
        for /f "tokens=3" %%i in ('npm --version') do set "NPM_VER=%%i"
        echo       ✅ npm 已安装: v%NPM_VER%
    ) else (
        echo       ❌ npm 未找到，尝试修复...
        call :FIX_NPM
    )
) else (
    echo       ❌ Node.js 未安装
    echo       正在下载 Node.js v%NODE_VERSION%...
    call :INSTALL_NODE
)

echo.
goto CHECK_DEPENDENCIES

:INSTALL_NODE
powershell -Command "Invoke-WebRequest -Uri '%NODE_URL%' -OutFile '%NODE_INSTALLER%'"
if %errorlevel% neq 0 (
    echo       ❌ 下载失败，请手动安装 Node.js
    echo       下载地址: %NODE_URL%
    pause
    exit /b 1
)
echo       ✅ 下载完成，正在安装...
msiexec /i "%NODE_INSTALLER%" /qn /norestart
if %errorlevel% neq 0 (
    echo       ❌ 安装失败，请手动安装 Node.js
    pause
    exit /b 1
)
echo       ✅ Node.js 安装完成
del "%NODE_INSTALLER%"

echo       正在刷新系统 PATH...
set "NODE_PATH=C:\Program Files\nodejs"
set "PATH=%NODE_PATH%;%PATH%"
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo       ⚠️  PATH 未立即生效，尝试使用绝对路径...
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
if %errorlevel% equ 0 (
    echo       ✅ npm 修复成功
) else (
    echo       ❌ npm 修复失败，请重新安装 Node.js
    pause
    exit /b 1
)
goto :EOF

:CHECK_DEPENDENCIES
echo [2/4] 检测项目依赖...
if exist "node_modules" (
    echo       ✅ 依赖已安装
) else (
    echo       ❌ 依赖未安装，正在安装...
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
if %errorlevel% neq 0 (
    echo       ❌ 依赖安装失败
    echo       错误信息: %errorlevel%
    pause
    exit /b 1
)
echo       ✅ 依赖安装完成
goto :EOF

:CHECK_DATABASE
echo [3/4] 检测数据库...
if exist "prisma\dev.db" (
    echo       ✅ 数据库文件存在
) else (
    echo       ❌ 数据库文件不存在，正在初始化...
    call :INIT_DATABASE
)

echo.
goto START_APP

:INIT_DATABASE
if defined NPM_CMD (
    "%NPM_CMD%" run prisma:migrate
    "%NPM_CMD%" run prisma:seed
) else (
    npm run prisma:migrate
    npm run prisma:seed
)
if %errorlevel% neq 0 (
    echo       ❌ 数据库初始化失败
    pause
    exit /b 1
)
echo       ✅ 数据库初始化完成
goto :EOF

:START_APP
echo [4/4] 启动应用...
echo       后端服务: http://localhost:5000
echo       前端页面: http://localhost:3000
echo.
echo       按 Ctrl+C 停止服务
echo ============================================
echo.

start "后端服务" cmd /k "npm run server:dev"
timeout /t 3 /nobreak >nul
start "前端页面" cmd /k "npm run dev"

start http://localhost:3000
echo       ✅ 应用已启动！
echo.
pause
