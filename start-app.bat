@echo off
setlocal EnableExtensions DisableDelayedExpansion
title Airport Equipment Management System

set "PROJECT_DIR=%~dp0"
cd /d "%PROJECT_DIR%"
if errorlevel 1 goto :FATAL_CD

echo ==========================================
echo     Airport Equipment Management v2.2.0
echo ==========================================
echo.

echo [1/3] Cleaning old processes...
taskkill /F /IM node.exe /T >nul 2>&1
timeout /t 2 /nobreak >nul

echo [2/3] Starting backend server (port 5000)...
start "Backend Server" cmd /k "cd /d ""%PROJECT_DIR%"" && npm run server"

timeout /t 3 /nobreak >nul

echo [3/3] Starting frontend server (port 3000)...
start "Frontend Server" cmd /k "cd /d ""%PROJECT_DIR%"" && npm run dev"

timeout /t 5 /nobreak >nul

echo ==========================================
echo  Started Successfully!
echo  Frontend: http://localhost:3000
echo  Backend: http://localhost:5000
echo  Username: admin
echo  Password: admin123
echo ==========================================
echo.
echo Press any key to open browser...
pause >nul

start "" "http://localhost:3000"

endlocal
goto :EOF

:FATAL_CD
echo.
echo [FAIL] Failed to switch to project directory: %PROJECT_DIR%
echo.
pause
exit /b 1
