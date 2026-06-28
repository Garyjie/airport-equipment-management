@echo off
chcp 65001 >nul
title 机场设备管理系统 - 更新程序
echo.
echo ========================================
echo   机场设备管理系统 - 自动更新
echo ========================================
echo.

set "REPO=GaryJie/airport-equipment-management"
set "API_URL=https://api.github.com/repos/%REPO%/releases/latest"

echo [1/4] 正在检查最新版本...
echo.

powershell -Command "& { $r = Invoke-RestMethod -Uri '%API_URL%' -UseBasicParsing; $tag = $r.tag_name; $name = $r.name; Write-Host '最新版本:' $tag; Write-Host '版本名称:' $name; $asset = $r.assets | Where-Object { $_.name -like '*Setup*.exe' } | Select-Object -First 1; if ($asset) { Write-Host '文件名:' $asset.name; Write-Host '大小:' ([math]::Round($asset.size / 1MB, 2)) 'MB'; $asset.browser_download_url | Out-File -FilePath '%TEMP%\update_url.txt' -Encoding utf8 } else { Write-Host '未找到安装包文件' -ForegroundColor Red; exit 1 } }"

if %errorlevel% neq 0 (
    echo.
    echo [错误] 检查版本失败，请检查网络连接！
    echo.
    pause
    exit /b 1
)

set /p DOWNLOAD_URL=<"%TEMP%\update_url.txt"
del "%TEMP%\update_url.txt"

echo.
echo [2/4] 正在下载最新版本...
echo.
echo 下载地址: %DOWNLOAD_URL%
echo.

set "INSTALLER=%TEMP%\airport-equipment-update.exe"

powershell -Command "& { Invoke-WebRequest -Uri '%DOWNLOAD_URL%' -OutFile '%INSTALLER%' -UseBasicParsing; Write-Host '下载完成！' }"

if %errorlevel% neq 0 (
    echo.
    echo [错误] 下载失败！
    echo.
    pause
    exit /b 1
)

echo.
echo [3/4] 下载完成，正在启动安装程序...
echo.
echo 注意：安装程序启动后，请关闭当前正在运行的机场设备管理系统。
echo.

echo [4/4] 5秒后自动启动安装程序...
timeout /t 5 /nobreak >nul

start "" "%INSTALLER%"

echo.
echo 更新程序已启动，请按安装向导操作。
echo.
timeout /t 3 /nobreak >nul
exit /b 0
