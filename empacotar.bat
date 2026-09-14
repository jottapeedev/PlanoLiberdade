@echo off
REM Script para empacotar o projeto LIBERDADE
REM Execute este arquivo no Windows para criar um ZIP do projeto

echo ========================================
echo   LIBERDADE - Empacotador de Projeto
echo ========================================
echo.

REM Verificar se o 7-Zip esta instalado
where 7z >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [INFO] 7-Zip nao encontrado. Tentando com PowerShell...
    
    REM Usar PowerShell para criar ZIP
    powershell -Command "Compress-Archive -Path '.\*' -DestinationPath 'liberdade-projeto.zip' -Force"
    
    if %ERRORLEVEL% EQU 0 (
        echo.
        echo [SUCESSO] Arquivo criado: liberdade-projeto.zip
        echo.
        echo Proximos passos:
        echo 1. Extraia o arquivo ZIP
        echo 2. Entre na pasta: cd liberdade
        echo 3. Instale dependencias: npm install
        echo 4. Execute o projeto: npm run dev
    ) else (
        echo [ERRO] Falha ao criar o arquivo ZIP
    )
) else (
    echo [INFO] Criando arquivo RAR com 7-Zip...
    7z a -tzip liberdade-projeto.zip * -xr!node_modules -xr!.git -xr!dist
    
    if %ERRORLEVEL% EQU 0 (
        echo.
        echo [SUCESSO] Arquivo criado: liberdade-projeto.zip
        echo.
        echo Proximos passos:
        echo 1. Extraia o arquivo ZIP
        echo 2. Entre na pasta: cd liberdade
        echo 3. Instale dependencias: npm install
        echo 4. Execute o projeto: npm run dev
    ) else (
        echo [ERRO] Falha ao criar o arquivo RAR
    )
)

echo.
pause
