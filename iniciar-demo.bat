@echo off
chcp 65001 >nul
title MARTELA — Servidor Local de Demo (SDOP Módulos Core Joyeros)
echo ============================================================================
echo   💎 MARTELA JOYERÍA FINA — Iniciando Demo Interactiva (Puerto 8090)
echo ============================================================================
echo.
echo   URL Local: http://localhost:8090/index.html
echo   Usuario Demo: admin / compras / recepcion / boveda / finanzas / chofer
echo   Contraseña:   martela123
echo.
start "" "http://localhost:8090/index.html"
python -m http.server 8090 --directory "%~dp0workspace\demo"
pause

