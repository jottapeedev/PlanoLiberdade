# 🚀 LIBERDADE — Central de Vida, Renda e Produtividade

> Organize hoje. Construa sua liberdade amanhã.

Aplicação web completa de produtividade pessoal e gestão de negócios digitais. Funciona como **central de comando** para organizar projetos, leads, estudos, treinos, hábitos, finanças, metas e deliveries — tudo em um único lugar, com visual moderno e interações fluidas.

---

## ✨ Destaques da interface

- **Design system próprio** com tokens semânticos (superfícies, linhas, tinta, estados) em dark **e** light
- **Cor de destaque personalizável** (6 paletas) aplicada em gradientes, gráficos e anéis de progresso
- **Layout responsivo** com sidebar colapsável, topbar moderno e navegação por seções
- **Command palette** (⌘K) com busca em páginas, tarefas, leads, metas e cursos
- **Kanban com arrastar e soltar** (dnd-kit) em CRM, TikTok Shop e deliveries
- **Gráficos** (Recharts) estilizados com gradientes, donuts, heatmaps e sparklines
- **Animações** com Framer Motion, micro-interações e feedback por toasts
- **Captura rápida** (tecla `N`) para jogar ideias na caixa de entrada sem sair da tela
- **Timer de foco** estilo pomodoro que registra minutos estudados automaticamente

---

## 📋 Módulos

### Principal
| Módulo | O que faz |
|--------|-----------|
| **Visão geral** | Score de produtividade do dia, renda do mês, pipeline, metas, hábitos, prazos e atalhos |
| **Caixa de entrada** | Captura rápida de ideias/tarefas/notas/links e processamento em um clique |
| **Meu dia** | Planejador diário com prioridades, estimativas de tempo, backlog e timer de foco |

### Negócios
| Módulo | O que faz |
|--------|-----------|
| **CRM de Sites** | Pipeline de leads com kanban, etapas editáveis, KPIs (pipeline, conversão, ticket médio) e visão em lista |
| **TikTok Shop** | Catálogo com margem e giro, funil de conteúdo (ideia → publicado), desempenho por vídeo e alertas de estoque |
| **Srta Doçura** | Painel de delivery: pedidos no kanban, cardápio com custos, clientes, canais e faturamento diário |
| **Srta das Massas** | Mesma arquitetura de delivery, com identidade própria |

### Crescimento
| Módulo | O que faz |
|--------|-----------|
| **Estudos** | Cursos com progresso, registro rápido de sessões, heatmap de 12 semanas e meta semanal |
| **Treinos** | Planilha semanal de treinos, execução dos exercícios, histórico, intensidade e carga |
| **Hábitos** | Rotina diária com marcação dos últimos 7 dias, streaks, taxa de conclusão e mapa de consistência |
| **Metas** | Objetivos por período com marcos, progresso, prazos e celebração ao concluir |
| **Finanças** | Receitas/despesas por fonte, comparação de 6 meses, metas por fonte e distribuição de lucro |

### Sistema
| Módulo | O que faz |
|--------|-----------|
| **Configurações** | Perfil, tema, cor de destaque, parâmetros de foco, liga/desliga de módulos, backup e restauração |

---

## 🛠 Stack

| Tecnologia | Uso |
|-----------|-----|
| React 18 | UI |
| TypeScript (strict) | Tipagem |
| Vite 6 | Build tool |
| Tailwind CSS 4 | Design system e utilitários |
| Framer Motion | Animações |
| Recharts | Gráficos |
| dnd-kit | Kanban com arrastar e soltar |
| React Router 6 | Navegação |
| Lucide React | Ícones |
| date-fns | Datas |
| canvas-confetti | Celebrações |
| Supabase (previsto) | Auth + DB + Storage — fase 2 |

---

## 📦 Instalação

```bash
git clone https://github.com/jottapeedev/PlanoLiberdade.git
cd PlanoLiberdade
npm install
npm run dev
```

Acesse **http://localhost:3000**.

### Scripts

```bash
npm run dev         # ambiente de desenvolvimento (porta 3000)
npm run build        # build de produção em dist/
npm run preview      # pré-visualiza o build
npm run typecheck    # verificação de tipos TypeScript
```

---

## 💾 Persistência de dados

A versão atual é **local-first**: o workspace é salvo automaticamente no `localStorage` do
navegador, com um conjunto de **dados de demonstração** já populado no primeiro acesso
(tarefas, leads, produtos, pedidos, cursos, treinos, transações, metas e hábitos).

- **Exportar backup** → JSON completo em *Configurações*
- **Importar dados** → restaura um backup anterior
- **Recarregar demo** / **Começar do zero** → troca o conjunto de dados

> A integração com Supabase (auth multi-usuário e sincronização na nuvem) está preparada no
> roadmap — os tipos de domínio em `src/lib/types.ts` já espelham o schema proposto.

---

## 🌐 Deploy na Vercel

1. Faça push do repositório no GitHub
2. Importe o projeto na [Vercel](https://vercel.com)
3. Build: `npm run build` · Output: `dist` (já configurado em `vercel.json`)
4. Deploy — as rotas do SPA são reescritas para `index.html` automaticamente

---

## 📁 Estrutura do projeto

```
PlanoLiberdade/
├── index.html
├── package.json
├── vite.config.js
├── tsconfig.json
├── vercel.json
├── src/
│   ├── main.tsx
│   ├── App.tsx                 # shell, rotas e guarda de módulos
│   ├── index.css               # design system (tokens, temas, utilitários)
│   ├── lib/
│   │   ├── types.ts            # modelo de domínio
│   │   ├── store.tsx           # contexto, persistência e toasts
│   │   ├── seed.ts             # dados de demonstração
│   │   ├── metrics.ts          # indicadores e score de produtividade
│   │   ├── modules.ts          # registro de módulos e navegação
│   │   ├── theme.ts            # temas e paletas de destaque
│   │   └── utils.ts            # formatadores e helpers
│   ├── components/
│   │   ├── ui.tsx              # kit de componentes (panels, modais, ring, heatmap…)
│   │   ├── charts.tsx          # wrappers de gráficos
│   │   ├── Kanban.tsx          # kanban genérico com dnd-kit
│   │   ├── Sidebar.tsx
│   │   ├── TopBar.tsx          # topbar + captura rápida
│   │   └── CommandPalette.tsx
│   └── pages/
│       ├── Dashboard.tsx
│       ├── Inbox.tsx
│       ├── MyDay.tsx
│       ├── Sites.tsx
│       ├── TikTok.tsx
│       ├── Business.tsx        # Srta Doçura e Srta das Massas
│       ├── Studies.tsx
│       ├── Training.tsx
│       ├── Habits.tsx
│       ├── Goals.tsx
│       ├── Finance.tsx
│       └── Settings.tsx
└── README.md
```

---

## 🎨 Design System

- **Tokens semânticos**: `--canvas`, `--surface`, `--line`, `--ink`, `--muted`, `--accent`, estados (`positive`, `warning`, `danger`, `info`)
- **Temas**: dark (padrão) e light, com detecção de preferência do sistema
- **Acentos**: violeta, oceano, esmeralda, âmbar, rosa e grafite
- **Utilitários próprios**: `panel`, `accent-grad`, `accent-text`, `accent-soft`, `label-xs`, `num`, `heatmap`, `hover-lift`
- **Tipografia**: Inter (texto) + Sora (display numérico)
- **Movimento**: transições de 200–300 ms, easing `cubic-bezier(.22,1,.36,1)`

---

## 🔮 Próximas fases

- [ ] Supabase: auth, sincronização em nuvem e RLS
- [ ] Calendário completo e visão de semana
- [ ] Relatórios avançados e exportação CSV/PDF
- [ ] PWA com notificações e uso offline
- [ ] Integração WhatsApp (pedidos) e TikTok API
- [ ] Assistente de IA para priorização
- [ ] Gamificação (XP, níveis, conquistas)

---

## 📄 Licença

Projeto pessoal — uso livre.

---

<p align="center">
  <strong>LIBERDADE</strong><br>
  <em>Organize hoje. Construa sua liberdade amanhã.</em>
</p>
