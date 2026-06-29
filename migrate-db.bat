@echo off
chcp 65001 >nul
title 机场设备管理系统 - 数据库迁移

:menu
cls
echo ==========================================
echo     机场设备管理系统 - 数据库迁移工具
echo ==========================================
echo.
echo  当前数据库: SQLite (dev.db)
echo.
echo  请选择要迁移的数据库类型:
echo.
echo  [1] 切换到 MySQL
echo  [2] 切换到 PostgreSQL
echo  [3] 切换回 SQLite (默认)
echo  [4] 退出
echo.
echo ==========================================
echo.

set /p choice=请输入选项 (1/2/3/4):

if "%choice%"=="1" goto mysql
if "%choice%"=="2" goto postgresql
if "%choice%"=="3" goto sqlite
if "%choice%"=="4" goto end

goto menu

:mysql
cls
echo ==========================================
echo     切换到 MySQL
echo ==========================================
echo.
echo  请确保已:
echo  1. 安装并启动 MySQL 服务
echo  2. 创建了数据库
echo.
echo  请输入 MySQL 连接信息:
echo.

set /p mysql_host=MySQL 主机 (默认 localhost):
set /p mysql_port=MySQL 端口 (默认 3306):
set /p mysql_user=用户名 (默认 root):
set /p mysql_pass=密码:
set /p mysql_db=数据库名:

if "%mysql_host%"=="" set mysql_host=localhost
if "%mysql_port%"=="" set mysql_port=3306
if "%mysql_user%"=="" set mysql_user=root
if "%mysql_db%"=="" set mysql_db=airport_db

echo.
echo  正在安装 MySQL 适配器...
call npm install @prisma/adapter-mysql mysql2 --save

echo.
echo  正在更新 schema.prisma...
(
echo datasource db {
echo   provider = "mysql"
echo   url      = env("DATABASE_URL")
echo }
) > prisma\schema_temp.prisma

(
echo generator client {
echo   provider = "prisma-client-js"
echo }
) > temp_gen.txt

type temp_gen.txt prisma\schema_temp.prisma > prisma\schema_new.prisma
del prisma\schema_temp.prisma
del temp_gen.txt

move /y prisma\schema_new.prisma prisma\schema.prisma >nul

echo.
echo  正在更新 .env 文件...
(
echo DATABASE_URL="mysql://%mysql_user%:%mysql_pass%@%mysql_host%:%mysql_port%/%mysql_db%"
echo JWT_SECRET="your-secret-key-here-change-in-production"
echo JWT_EXPIRES_IN="24h"
echo API_URL=http://localhost:5000
) > .env

echo.
echo  正在更新 server\prisma.ts...
(
echo const { PrismaClient } = require('@prisma/client')
echo const ^<^<^< MySQL ADAPTER ^>^>^> = require('@prisma/adapter-mysql')
echo const mysql = require('mysql2/promise')
echo.
echo const pool = mysql.createPool({
echo   host: process.env.DB_HOST ^|^| 'localhost',
echo   port: parseInt(process.env.DB_PORT ^|^| '3306'),
echo   user: process.env.DB_USER ^|^| 'root',
echo   password: process.env.DB_PASSWORD ^|^| '',
echo   database: process.env.DB_NAME ^|^| 'airport_db',
echo })
echo.
echo const adapter = new MySQL(pool)
echo const prisma = new PrismaClient({ adapter })
echo.
echo module.exports = prisma
) > server\prisma_mysql.js

echo.
echo ==========================================
echo  MySQL 适配器代码已生成到 server\prisma_mysql.js
echo  请手动将 server\prisma.ts 中的代码替换为该文件内容
echo ==========================================

echo.
echo  正在生成客户端和推送结构...
call npx prisma generate
call npx prisma db push

echo.
echo 按任意键返回菜单...
pause >nul
goto menu

:postgresql
cls
echo ==========================================
echo     切换到 PostgreSQL
echo ==========================================
echo.
echo  请确保已:
echo  1. 安装并启动 PostgreSQL 服务
echo  2. 创建了数据库
echo.
echo  请输入 PostgreSQL 连接信息:
echo.

set /p pg_host=PostgreSQL 主机 (默认 localhost):
set /p pg_port=PostgreSQL 端口 (默认 5432):
set /p pg_user=用户名 (默认 postgres):
set /p pg_pass=密码:
set /p pg_db=数据库名:

if "%pg_host%"=="" set pg_host=localhost
if "%pg_port%"=="" set pg_port=5432
if "%pg_user%"=="" set pg_user=postgres
if "%pg_db%"=="" set pg_db=airport_db

echo.
echo  正在安装 PostgreSQL 适配器...
call npm install @prisma/adapter-pg pg --save

echo.
echo  正在更新 schema.prisma...
(
echo datasource db {
echo   provider = "postgresql"
echo   url      = env("DATABASE_URL")
echo }
) > prisma\schema_temp.prisma

(
echo generator client {
echo   provider = "prisma-client-js"
echo }
) > temp_gen.txt

type temp_gen.txt prisma\schema_temp.prisma > prisma\schema_new.prisma
del prisma\schema_temp.prisma
del temp_gen.txt

move /y prisma\schema_new.prisma prisma\schema.prisma >nul

echo.
echo  正在更新 .env 文件...
(
echo DATABASE_URL="postgresql://%pg_user%:%pg_pass%@%pg_host%:%pg_port%/%pg_db%"
echo JWT_SECRET="your-secret-key-here-change-in-production"
echo JWT_EXPIRES_IN="24h"
echo API_URL=http://localhost:5000
) > .env

echo.
echo  正在更新 server\prisma.ts...
(
echo const { PrismaClient } = require('@prisma/client')
echo const { PrismaPg } = require('@prisma/adapter-pg')
echo const { Pool } = require('pg')
echo.
echo const pool = new Pool({
echo   host: process.env.DB_HOST ^|^| 'localhost',
echo   port: parseInt(process.env.DB_PORT ^|^| '5432'),
echo   user: process.env.DB_USER ^|^| 'postgres',
echo   password: process.env.DB_PASSWORD ^|^| '',
echo   database: process.env.DB_NAME ^|^| 'airport_db',
echo })
echo.
echo const adapter = new PrismaPg(pool)
echo const prisma = new PrismaClient({ adapter })
echo.
echo module.exports = prisma
) > server\prisma_pg.js

echo.
echo ==========================================
echo  PostgreSQL 适配器代码已生成到 server\prisma_pg.js
echo  请手动将 server\prisma.ts 中的代码替换为该文件内容
echo ==========================================

echo.
echo  正在生成客户端和推送结构...
call npx prisma generate
call npx prisma db push

echo.
echo 按任意键返回菜单...
pause >nul
goto menu

:sqlite
cls
echo ==========================================
echo     切换回 SQLite
echo ==========================================
echo.

echo  正在恢复 schema.prisma...
(
echo datasource db {
echo   provider = "sqlite"
echo   url      = env("DATABASE_URL")
echo }
) > prisma\schema_temp.prisma

(
echo generator client {
echo   provider = "prisma-client-js"
echo }
) > temp_gen.txt

type temp_gen.txt prisma\schema_temp.prisma > prisma\schema_new.prisma
del prisma\schema_temp.prisma
del temp_gen.txt

move /y prisma\schema_new.prisma prisma\schema.prisma >nul

echo.
echo  正在恢复 .env 文件...
(
echo DATABASE_URL="file:./dev.db"
echo JWT_SECRET="your-secret-key-here-change-in-production"
echo JWT_EXPIRES_IN="24h"
echo API_URL=http://localhost:5000
) > .env

echo.
echo  正在恢复 server\prisma.ts...
(
echo const { PrismaClient } = require('@prisma/client')
echo.
echo const isDev = !process.env.NODE_ENV ^|^| process.env.NODE_ENV === 'development'
echo const prismaPath = isDev
echo   ? require('path').resolve(__dirname, '..', 'prisma', 'dev.db')
echo   : require('path').resolve(__dirname, '..', '..', 'prisma', 'dev.db')
echo.
echo const prisma = new PrismaClient({
echo   datasources: {
echo     db: {
echo       url: `file:${prismaPath}`
echo     }
echo   }
echo })
echo.
echo module.exports = prisma
) > server\prisma.ts

echo.
echo  正在生成客户端...
call npx prisma generate

echo.
echo ==========================================
echo  已切换回 SQLite 数据库
echo ==========================================

echo.
pause
goto menu

:end
cls
echo ==========================================
echo  感谢使用！
echo ==========================================
timeout /t 2 >nul
exit
