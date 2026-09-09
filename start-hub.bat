@echo off
cd /d "%~dp0"
title Portal Hub Construtec - Esteira de Sistemas
color 0B
echo ========================================================
echo   INICIANDO PORTAL HUB CONSTRUTEC (ESTEIRA DE TRABALHO)
echo ========================================================
echo.
echo Iniciando servidor nativo do Hub na porta 3000...
start http://127.0.0.1:3000
node server.js
pause
