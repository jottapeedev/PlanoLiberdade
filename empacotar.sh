#!/bin/bash
# Script para empacotar o projeto LIBERDADE
# Execute este arquivo no Linux/Mac para criar um ZIP do projeto

echo "========================================"
echo "  LIBERDADE - Empacotador de Projeto"
echo "========================================"
echo ""

# Verificar se o zip esta instalado
if ! command -v zip &> /dev/null; then
    echo "[ERRO] zip nao encontrado. Instale com: sudo apt-get install zip"
    exit 1
fi

echo "[INFO] Criando arquivo ZIP..."
zip -r liberdade-projeto.zip . -x "node_modules/*" -x ".git/*" -x "dist/*" -x "*.log"

if [ $? -eq 0 ]; then
    echo ""
    echo "[SUCESSO] Arquivo criado: liberdade-projeto.zip"
    echo ""
    echo "Proximos passos:"
    echo "1. Extraia o arquivo ZIP"
    echo "2. Entre na pasta: cd liberdade"
    echo "3. Instale dependencias: npm install"
    echo "4. Execute o projeto: npm run dev"
else
    echo "[ERRO] Falha ao criar o arquivo ZIP"
fi

echo ""
