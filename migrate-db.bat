@echo off
chcp 65001 >nul
title Database Migration Tool

cd /d %~dp0
node migrate-db.js

pause
