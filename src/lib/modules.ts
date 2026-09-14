import {
  BarChart3,
  Cake,
  CalendarCheck,
  Dumbbell,
  GraduationCap,
  Inbox,
  LayoutDashboard,
  ListTodo,
  Settings as SettingsIcon,
  ShoppingBag,
  Sparkles,
  Target,
  Wallet,
  type LucideIcon,
} from "lucide-react";

export interface ModuleDef {
  id: string;
  label: string;
  path: string;
  icon: LucideIcon;
  section: "Principal" | "Negócios" | "Crescimento" | "Sistema";
  description: string;
  accent?: string;
}

export const MODULES: ModuleDef[] = [
  {
    id: "dashboard",
    label: "Visão geral",
    path: "/",
    icon: LayoutDashboard,
    section: "Principal",
    description: "Score, renda, metas e foco do dia",
  },
  {
    id: "inbox",
    label: "Caixa de entrada",
    path: "/inbox",
    icon: Inbox,
    section: "Principal",
    description: "Captura rápida de ideias e pendências",
  },
  {
    id: "myday",
    label: "Meu dia",
    path: "/meu-dia",
    icon: ListTodo,
    section: "Principal",
    description: "Planejamento diário, timer e modo foco",
  },
  {
    id: "sites",
    label: "CRM de Sites",
    path: "/sites",
    icon: BarChart3,
    section: "Negócios",
    description: "Pipeline de leads e propostas",
  },
  {
    id: "tiktok",
    label: "TikTok Shop",
    path: "/tiktok",
    icon: ShoppingBag,
    section: "Negócios",
    description: "Produtos, conteúdos e vendas",
  },
  {
    id: "docura",
    label: "Srta Doçura",
    path: "/srta-docura",
    icon: Cake,
    section: "Negócios",
    description: "Encomendas e produção de confeitaria",
    accent: "#f43f5e",
  },
  {
    id: "massas",
    label: "Srta das Massas",
    path: "/srta-das-massas",
    icon: Sparkles,
    section: "Negócios",
    description: "Massas frescas, cardápio e entregas",
    accent: "#f59e0b",
  },
  {
    id: "studies",
    label: "Estudos",
    path: "/estudos",
    icon: GraduationCap,
    section: "Crescimento",
    description: "Cursos, sessões e heatmap",
  },
  {
    id: "training",
    label: "Treinos",
    path: "/treinos",
    icon: Dumbbell,
    section: "Crescimento",
    description: "Planilha semanal e evolução física",
  },
  {
    id: "habits",
    label: "Hábitos",
    path: "/habitos",
    icon: CalendarCheck,
    section: "Crescimento",
    description: "Rotina diária com sequências",
  },
  {
    id: "goals",
    label: "Metas",
    path: "/metas",
    icon: Target,
    section: "Crescimento",
    description: "Objetivos por período e marcos",
  },
  {
    id: "finance",
    label: "Finanças",
    path: "/financas",
    icon: Wallet,
    section: "Crescimento",
    description: "Receitas, despesas e consolidado",
  },
  {
    id: "settings",
    label: "Configurações",
    path: "/configuracoes",
    icon: SettingsIcon,
    section: "Sistema",
    description: "Tema, acento, módulos e dados",
  },
];

export const SECTION_ORDER: ModuleDef["section"][] = [
  "Principal",
  "Negócios",
  "Crescimento",
  "Sistema",
];

export function moduleByPath(path: string): ModuleDef | undefined {
  return MODULES.find((m) => m.path === path);
}
