import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

/* ------------------------------ classes ------------------------------ */
export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

/* -------------------------------- ids -------------------------------- */
export function uid(prefix = "id"): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}${Date.now()
    .toString(36)
    .slice(-4)}`;
}

/* ------------------------------ números ------------------------------ */
export function brl(value: number, currency = "BRL"): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency,
    minimumFractionDigits: value % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(Number.isFinite(value) ? value : 0);
}

export function compact(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(Number.isFinite(value) ? value : 0);
}

export function num(value: number, digits = 0): string {
  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(Number.isFinite(value) ? value : 0);
}

export function pct(value: number, digits = 0): string {
  return `${num(clamp(value, 0, 999), digits)}%`;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(Number.isFinite(value) ? value : 0, min), max);
}

export function sum(values: number[]): number {
  return values.reduce((acc, v) => acc + (Number.isFinite(v) ? v : 0), 0);
}

export function pctChange(current: number, previous: number): number {
  if (!previous) return current > 0 ? 100 : 0;
  return ((current - previous) / Math.abs(previous)) * 100;
}

/* -------------------------------- datas ------------------------------- */
export const iso = (date: Date): string => format(date, "yyyy-MM-dd");
export const today = (): string => iso(new Date());
export const monthKey = (value: string | Date): string =>
  typeof value === "string" ? value.slice(0, 7) : format(value, "yyyy-MM");
export const currentMonth = (): string => monthKey(new Date());

export function fmtDate(value?: string | Date, pattern = "dd/MM"): string {
  if (!value) return "—";
  const date = typeof value === "string" ? parseISO(value) : value;
  if (Number.isNaN(date.getTime())) return "—";
  return format(date, pattern, { locale: ptBR });
}

export function fmtLongDate(value: Date = new Date()): string {
  return format(value, "EEEE, d 'de' MMMM", { locale: ptBR });
}

export function daysLeft(deadline?: string): number | null {
  if (!deadline) return null;
  const diff = parseISO(deadline).getTime() - new Date().setHours(0, 0, 0, 0);
  return Math.round(diff / 86400000);
}

export function relative(value: string): string {
  const date = parseISO(value.length > 10 ? value.slice(0, 10) : value);
  const diff = Math.round((Date.now() - date.getTime()) / 86400000);
  if (diff <= 0) return "hoje";
  if (diff === 1) return "ontem";
  if (diff < 7) return `há ${diff} dias`;
  if (diff < 30) return `há ${Math.floor(diff / 7)} sem`;
  return `há ${Math.floor(diff / 30)} meses`;
}

export function weekdayShort(index: number): string {
  return ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"][index] ?? "";
}

export function lastNDays(n: number, from: Date = new Date()): string[] {
  const out: string[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(from);
    d.setDate(d.getDate() - i);
    out.push(iso(d));
  }
  return out;
}

export function lastNMonths(n: number): string[] {
  const out: string[] = [];
  const base = new Date();
  base.setDate(1);
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(base);
    d.setMonth(d.getMonth() - i);
    out.push(monthKey(d));
  }
  return out;
}

export function monthLabel(key: string, short = true): string {
  const [y, m] = key.split("-").map(Number);
  const date = new Date(y, (m ?? 1) - 1, 1);
  const label = format(date, short ? "MMM" : "MMMM", { locale: ptBR });
  return label.charAt(0).toUpperCase() + label.slice(1).replace(".", "");
}

export function addDaysISO(dateISO: string, days: number): string {
  const d = parseISO(dateISO);
  d.setDate(d.getDate() + days);
  return iso(d);
}

/* -------------------------------- misc -------------------------------- */
export function groupBy<T>(items: T[], key: (item: T) => string): Record<string, T[]> {
  return items.reduce<Record<string, T[]>>((acc, item) => {
    const k = key(item);
    (acc[k] ||= []).push(item);
    return acc;
  }, {});
}

export function uniq<T>(items: T[]): T[] {
  return Array.from(new Set(items));
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase() ?? "").join("") || "L";
}

export function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 6) return "Boa madrugada";
  if (hour < 12) return "Bom dia";
  if (hour < 18) return "Boa tarde";
  return "Boa noite";
}

export function priorityMeta(priority: string): {
  label: string;
  color: string;
  weight: number;
} {
  switch (priority) {
    case "urgente":
      return { label: "Urgente", color: "var(--danger)", weight: 4 };
    case "alta":
      return { label: "Alta", color: "var(--warning)", weight: 3 };
    case "media":
      return { label: "Média", color: "var(--info)", weight: 2 };
    default:
      return { label: "Baixa", color: "var(--faint)", weight: 1 };
  }
}

/** PRNG determinístico para dados de demonstração estáveis. */
export function seededRandom(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  };
}
