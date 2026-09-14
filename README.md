# 🚀 LIBERDADE — Central de Vida, Renda e Produtividade

> Organize hoje. Construa sua liberdade amanhã.

LIBERDADE é uma aplicação web completa de produtividade pessoal e gestão de negócios digitais. Funciona como central de comando para organizar projetos, leads, estudos, finanças, conteúdos e metas — tudo em um único lugar.

---

## 📋 Funcionalidades

### Core
- **Dashboard** — Visão geral com score de produtividade, renda, metas e foco do dia
- **Inbox** — Captura rápida de ideias, tarefas e pendências
- **Meu Dia** — Planejamento diário com prioridades, timer e modo foco
- **Command Palette** — Busca global e atalhos (Ctrl+K)

### Negócios
- **Sites (CRM)** — Kanban de leads com pipeline editável
- **TikTok Shop** — Produtos, conteúdos, pipeline e métricas
- **Srta Doçura** — Gestão de delivery (arquitetura pronta)
- **Srta das Massas** — Gestão de delivery (arquitetura pronta)

### Produtividade
- **Estudos** — Cursos, sessões com timer, progresso e heatmap
- **Metas** — Sistema genérico de metas por período
- **Hábitos** — Rastreamento com streaks
- **Finanças** — Consolidado de todas as fontes de renda

### Configuração
- **Tudo editável** — Status, categorias, prioridades, módulos
- **Dark/Light mode** — Com cor de destaque personalizável
- **Módulos ativáveis** — Oculte o que não usa

---

## 🛠 Stack

| Tecnologia | Uso |
|-----------|-----|
| React 18 | UI |
| TypeScript | Tipagem |
| Vite | Build tool |
| Tailwind CSS 4 | Estilização |
| Framer Motion | Animações |
| Recharts | Gráficos |
| React Router | Navegação |
| Lucide React | Ícones |
| date-fns | Datas |
| Supabase | Auth + DB + Storage |
| Zod | Validação |
| React Hook Form | Formulários |

---

## 📦 Instalação

```bash
# Clone o repositório
git clone https://github.com/seu-usuario/liberdade.git
cd liberdade

# Instale dependências
npm install

# Configure variáveis de ambiente
cp .env.example .env.local
```

---

## 🔑 Variáveis de Ambiente

Crie um arquivo `.env.local` na raiz do projeto:

```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anonima
```

> ⚠️ Nunca commite chaves privadas. Use apenas a chave anon/public.

---

## 🗄 Supabase

### Setup

1. Crie um projeto em [supabase.com](https://supabase.com)
2. Vá em SQL Editor
3. Execute o arquivo `supabase/migrations/001_initial_schema.sql`
4. Configure as variáveis de ambiente

### Estrutura do Banco

O banco possui ~45 tabelas organizadas por módulo:
- `workspaces` / `profiles` — Multi-tenancy
- `tasks` / `inbox_items` — Produtividade
- `leads` / `lead_statuses` — CRM Sites
- `tiktok_products` / `tiktok_contents` — TikTok Shop
- `study_courses` / `study_sessions` — Estudos
- `businesses` / `business_orders` — Negócios genéricos
- `transactions` / `income_sources` — Finanças
- `goals` / `habits` — Metas e hábitos

### RLS (Row Level Security)

Todas as tabelas possuem RLS ativado. Políticas garantem que usuários só acessem dados do seu workspace.

---

## 🚀 Execução Local

```bash
# Desenvolvimento
npm run dev

# Build de produção
npm run build

# Preview do build
npm run preview

# Typecheck
npm run typecheck
```

---

## 🌐 Deploy (Vercel)

### Via GitHub

1. Push para o GitHub
2. Importe o projeto na [Vercel](https://vercel.com)
3. Configure as variáveis de ambiente no painel da Vercel
4. Deploy automático a cada push

### Variáveis na Vercel

Adicione no painel da Vercel:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

---

## 📁 Estrutura do Projeto

```
liberdade/
├── index.html
├── package.json
├── vite.config.js
├── tsconfig.json
├── supabase/
│   └── migrations/
│       └── 001_initial_schema.sql
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── index.css
│   ├── lib/
│   │   ├── types.ts          # Tipos TypeScript
│   │   └── store.ts          # Estado + helpers
│   ├── components/
│   │   ├── Sidebar.tsx       # Navegação lateral
│   │   └── CommandPalette.tsx # Busca global
│   └── pages/
│       ├── Dashboard.tsx     # Página principal
│       ├── Inbox.tsx         # Captura rápida
│       ├── MyDay.tsx         # Planejamento diário
│       ├── Sites.tsx         # CRM de sites
│       ├── TikTok.tsx        # TikTok Shop
│       ├── Studies.tsx       # Estudos
│       ├── Finance.tsx       # Finanças
│       ├── Goals.tsx         # Metas
│       └── Settings.tsx      # Configurações
└── README.md
```

---

## 🎨 Design System

- **Dark mode** como padrão
- **Glassmorphism** moderado
- **Gradientes** discretos (purple → indigo)
- **Animações** com Framer Motion
- **Tipografia** Inter
- **Ícones** Lucide
- **Responsivo** mobile-first

---

## 🔮 Próximas Fases

### Fase 2
- [ ] Calendário completo
- [ ] Relatórios avançados
- [ ] Srta Doçura (módulo delivery)
- [ ] Srta das Massas (módulo delivery)
- [ ] Faculdade

### Fase 3
- [ ] Gamificação (XP, níveis, conquistas)
- [ ] Notificações push (PWA)
- [ ] Integração WhatsApp
- [ ] Integração TikTok API
- [ ] Assistente IA
- [ ] Exportação CSV/PDF

---

## 📄 Licença

Projeto pessoal — uso livre.

---

<p align="center">
  <strong>LIBERDADE</strong><br>
  <em>Organize hoje. Construa sua liberdade amanhã.</em>
</p>
