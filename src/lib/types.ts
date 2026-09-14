/* ============================================================
   LIBERDADE — Modelo de domínio
   ============================================================ */

export type ID = string;
export type ISODate = string; // yyyy-MM-dd

export type Priority = "baixa" | "media" | "alta" | "urgente";

export interface Task {
  id: ID;
  title: string;
  notes?: string;
  done: boolean;
  priority: Priority;
  area: string;
  due?: ISODate;
  today: boolean;
  order: number;
  estimateMin?: number;
  tags: string[];
  createdAt: ISODate;
  completedAt?: ISODate;
}

export type InboxKind = "ideia" | "tarefa" | "nota" | "link";

export interface InboxItem {
  id: ID;
  text: string;
  kind: InboxKind;
  tags: string[];
  processed: boolean;
  createdAt: string;
}

export interface LeadStatus {
  id: ID;
  name: string;
  color: string;
  order: number;
  kind?: "aberto" | "ganho" | "perdido";
}

export interface Lead {
  id: ID;
  name: string;
  company?: string;
  contact?: string;
  value: number;
  mrr?: number;
  statusId: ID;
  source: string;
  notes?: string;
  nextStep?: string;
  order: number;
  createdAt: ISODate;
}

export interface Product {
  id: ID;
  name: string;
  sku: string;
  businessId?: ID;
  price: number;
  cost: number;
  stock: number;
  sold: number;
  channel: "tiktok" | "shopee" | "site";
  active: boolean;
  createdAt: ISODate;
}

export type ContentStage = "ideia" | "roteiro" | "gravacao" | "edicao" | "publicado";

export interface Content {
  id: ID;
  title: string;
  hook?: string;
  stage: ContentStage;
  productId?: ID;
  views: number;
  likes: number;
  sales: number;
  scheduledAt?: ISODate;
  order: number;
}

export interface Business {
  id: ID;
  name: string;
  emoji: string;
  tagline: string;
  color: string;
  active: boolean;
}

export interface OrderItem {
  name: string;
  qty: number;
  price: number;
}

export type OrderStatus = "novo" | "producao" | "entrega" | "concluido" | "cancelado";

export interface Order {
  id: ID;
  code: string;
  businessId: ID;
  customer: string;
  phone?: string;
  items: OrderItem[];
  status: OrderStatus;
  channel: "whatsapp" | "instagram" | "ifood" | "presencial";
  createdAt: ISODate;
  deliveryAt?: ISODate;
  notes?: string;
}

export interface Course {
  id: ID;
  name: string;
  platform: string;
  category: string;
  totalLessons: number;
  doneLessons: number;
  status: "planejado" | "ativo" | "concluido" | "pausado";
  deadline?: ISODate;
  color: string;
  createdAt: ISODate;
}

export interface StudySession {
  id: ID;
  courseId?: ID;
  minutes: number;
  date: ISODate;
  note?: string;
}

export interface Exercise {
  id: ID;
  name: string;
  sets: number;
  reps: string;
  load?: string;
}

export interface Workout {
  id: ID;
  weekday: number; // 0 = domingo
  title: string;
  focus: string;
  durationMin: number;
  exercises: Exercise[];
}

export interface TrainingSession {
  id: ID;
  workoutId?: ID;
  title: string;
  date: ISODate;
  minutes: number;
  intensity: 1 | 2 | 3 | 4 | 5;
  note?: string;
}

export type TxType = "receita" | "despesa";

export interface Transaction {
  id: ID;
  type: TxType;
  amount: number;
  category: string;
  sourceId?: ID;
  date: ISODate;
  note?: string;
  recurring: boolean;
}

export interface IncomeSource {
  id: ID;
  name: string;
  kind: "site" | "tiktok" | "delivery" | "servico" | "outro";
  target: number;
  color: string;
  active: boolean;
}

export interface Milestone {
  id: ID;
  title: string;
  done: boolean;
}

export interface Goal {
  id: ID;
  title: string;
  area: string;
  unit: string;
  target: number;
  current: number;
  deadline?: ISODate;
  status: "ativa" | "concluida" | "pausada";
  milestones: Milestone[];
}

export interface Habit {
  id: ID;
  name: string;
  emoji: string;
  color: string;
  targetPerWeek: number;
  logs: ISODate[];
}

export interface Settings {
  name: string;
  theme: "dark" | "light" | "system";
  accent: string;
  currency: string;
  dailyFocusTarget: number;
  focusMinutes: number;
  breakMinutes: number;
  modules: Record<string, boolean>;
}

export interface AppData {
  version: number;
  tasks: Task[];
  inbox: InboxItem[];
  leadStatuses: LeadStatus[];
  leads: Lead[];
  products: Product[];
  contents: Content[];
  businesses: Business[];
  orders: Order[];
  courses: Course[];
  studySessions: StudySession[];
  workouts: Workout[];
  trainingSessions: TrainingSession[];
  transactions: Transaction[];
  sources: IncomeSource[];
  goals: Goal[];
  habits: Habit[];
  settings: Settings;
}

export type Collection = Exclude<keyof AppData, "version" | "settings">;
