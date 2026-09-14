# 📦 COMO BAIXAR E USAR O LIBERDADE

O código está **completo no repositório** `jottapeedev/PlanoLiberdade`. Não é preciso copiar
arquivos manualmente.

---

## ✅ Opção 1 — Clonar com Git (recomendado)

```bash
git clone https://github.com/jottapeedev/PlanoLiberdade.git
cd PlanoLiberdade
npm install
npm run dev
```

Abra **http://localhost:3000** no navegador.

---

## ✅ Opção 2 — Baixar ZIP pelo GitHub

1. Abra o repositório no GitHub
2. Clique em **Code ▾ → Download ZIP**
3. Extraia a pasta e rode:

```bash
cd PlanoLiberdade
npm install
npm run dev
```

---

## ✅ Opção 3 — Empacotar localmente

```bash
./empacotar.sh        # Linux/macOS
empacotar.bat         # Windows (duplo clique)
```

Gera `liberdade-projeto.zip` com o projeto pronto para distribuir.

---

## 🚀 Primeiros passos depois de abrir o app

1. A aplicação abre com **dados de demonstração** já preenchidos
2. Vá em **Configurações** e ajuste:
   - seu nome, tema (escuro/claro/sistema) e cor de destaque
   - meta diária de foco, duração dos blocos e pausas
   - quais módulos devem aparecer na navegação
3. Use **Captura rápida** (botão na topbar ou tecla `N`) para jogar ideias na Caixa de entrada
4. Abra **⌘K** para navegar por qualquer página, tarefa, lead ou meta
5. Em **Configurações → Dados e backup**, clique em **Começar do zero** quando quiser limpar a
   demonstração e usar seus dados reais

---

## ⚠️ Importante sobre os dados

- Tudo é salvo automaticamente no **navegador** (`localStorage`, chave
  `liberdade.workspace.v1`)
- Limpar os dados do site **apaga o workspace** — exporte um backup antes
- Para usar em outro computador, exporte o JSON e importe no destino

---

## 📋 Pré-requisitos

- **Node.js 18+** (recomendado 20+)
- npm (incluído no Node)

---

## 🆘 Precisa de ajuda?

1. `npm run typecheck` — valida o código TypeScript
2. `npm run build` — garante que o build de produção funciona
3. Consulte `GUIA_IMPLANTACAO.md` para deploy na Vercel
4. Detalhes de funcionalidades em `README.md`

---

**Projeto LIBERDADE v1.0** — Organize hoje. Construa sua liberdade amanhã. 🚀
