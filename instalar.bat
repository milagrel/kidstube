@echo off
title KidsTube - Instalacao
cd /d "%~dp0"
echo.
echo  ============================================
echo   KidsTube - a instalar dependencias...
echo  ============================================
echo.
call npm run install-all
echo.
echo  A compilar o app...
echo.
call npm run build
echo.
echo  ============================================
echo   Instalacao concluida!
echo   Corre depois: iniciar.bat
echo  ============================================
echo.
pause
