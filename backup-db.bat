@echo off
chcp 65001 >nul
title Database Backup Tool

cd /d %~dp0
node backup-db.js

pause
