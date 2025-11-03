@echo off
echo ====================================
echo Cube Evolution - Lancement
echo ====================================
echo.

echo Verification de Docker...
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERREUR] Docker n'est pas installe ou n'est pas dans le PATH.
    echo Veuillez installer Docker Desktop depuis: https://www.docker.com/products/docker-desktop
    pause
    exit /b 1
)

echo Docker trouve!
echo.

echo Lancement des conteneurs...
docker compose up -d

if %errorlevel% equ 0 (
    echo.
    echo ====================================
    echo Cube Evolution est maintenant en ligne!
    echo ====================================
    echo.
    echo Acces local: http://localhost
    echo.
    echo Pour voir les logs: docker compose logs -f
    echo Pour arreter: docker compose down
    echo.
) else (
    echo.
    echo [ERREUR] Le lancement a echoue.
    echo Verifiez les logs avec: docker compose logs
    echo.
)

pause
