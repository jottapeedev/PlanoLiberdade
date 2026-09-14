# 📦 GUIA DE IMPLANTAÇÃO — LIBERDADE

O projeto está **completo neste repositório**: código-fonte, design system, documentação e
configuração de deploy. Não é mais necessário copiar arquivos manualmente.

---

## 1. Rodando localmente

```bash
git clone https://github.com/jottapeedev/PlanoLiberdade.git
cd PlanoLiberdade
npm install
npm run dev
```

Abra **http://localhost:3000**.

### Verificações úteis

```bash
npm run typecheck   # tipos TypeScript (strict)
npm run build       # build de produção
npm run preview     # servir o build localmente
```

---

## 2. Estrutura do projeto

```
PlanoLiberdade/
├── index.html
├── package.json
├── package-lock.json
├── tsconfig.json
├── vite.config.js
├── vercel.json                 # reescritas de SPA + cache
├── README.md
├── GUIA_IMPLANTACAO.md
├── COMO_BAIXAR.md
├── .env.example
├── empacotar.sh / empacotar.bat
└── src/
    ├── main.tsx
    ├── App.tsx                 # shell, rotas, error boundary
    ├── index.css               # tokens, temas e utilitários
    ├── lib/                    # types, store, seed, metrics, modules, theme, utils
    ├── components/              # ui, charts, Kanban, Sidebar, TopBar, CommandPalette
    └── pages/                  # 12 módulos (Dashboard, Inbox, MyDay, Sites, TikTok,
                                #   Business, Studies, Training, Habits, Goals,
                                #   Finance, Settings)
```

---

## 3. Deploy na Vercel

1. Faça push do projeto para o GitHub
2. Em [vercel.com](https://vercel.com) → **New Project** → importe o repositório
3. Configuração detectada automaticamente (`vercel.json`):
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Framework**: Vite
4. Clique em **Deploy**

> As rotas do SPA (`/financas`, `/metas`, …) funcionam em acesso direto graças ao `rewrite`
> para `index.html` definido em `vercel.json`.

Outras opções de hospedagem estática (Netlify, Cloudflare Pages, GitHub Pages) funcionam do
mesmo jeito, desde que exista um fallback de SPA para `index.html`.

---

## 4. Variáveis de ambiente (fase 2 — Supabase)

A versão atual é **local-first** (dados no `localStorage`) e não exige nenhuma variável de
ambiente para rodar. A integração com Supabase está no roadmap:

```bash
cp .env.example .env.local
```

```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anonima
```

> ⚠️ Nunca commite chaves privadas. Use apenas a chave `anon`/public.

---

## 5. Backup e restauração dos dados

Com o app aberto em **Configurações → Dados e backup**:

- **Exportar backup** — baixa um JSON com todo o workspace
- **Importar dados** — restaura um JSON exportado anteriormente
- **Recarregar demo** — volta ao conjunto de dados de exemplo
- **Começar do zero** — esvazia o workspace para uso real

Os dados ficam na chave `liberdade.workspace.v1` do `localStorage` do navegador. Limpar os
dados do site apaga o workspace — faça backup antes.

---

## 6. Checklist de implantação

- [ ] Clonar o repositório
- [ ] `npm install`
- [ ] `npm run typecheck` sem erros
- [ ] `npm run dev` e navegar pelos 12 módulos
- [ ] Ajustar nome, tema e cor de destaque em Configurações
- [ ] Criar repositório no GitHub e fazer push
- [ ] Importar na Vercel e publicar
- [ ] Testar o app publicado (incluindo acesso direto a rotas internas)
- [ ] Exportar o primeiro backup

---

## 7. Problemas comuns

| Sintoma | Solução |
|---------|---------|
| `Module not found` | `rm -rf node_modules package-lock.json && npm install` |
| Erro de tipos | `npm run typecheck` e corrija os arquivos listados |
| Porta 3000 ocupada | `strictPort` está ativo: encerre o processo antigo ou ajuste `vite.config.js` |
| Página em branco após deploy | Confirme o `rewrite` de SPA em `vercel.json` |
| Dados sumiram | Restaure o JSON exportado em Configurações → Importar dados |

---

**Projeto LIBERDADE v1.0** — Organize hoje. Construa sua liberdade amanhã. 🚀
