import type { Settings } from "./types";

export interface AccentOption {
  key: string;
  label: string;
  accent: string;
  accent2: string;
}

export const ACCENTS: AccentOption[] = [
  { key: "violeta", label: "Violeta", accent: "#8b5cf6", accent2: "#22d3ee" },
  { key: "oceano", label: "Oceano", accent: "#3b82f6", accent2: "#22d3ee" },
  { key: "esmeralda", label: "Esmeralda", accent: "#10b981", accent2: "#a3e635" },
  { key: "ambar", label: "Âmbar", accent: "#f59e0b", accent2: "#fb7185" },
  { key: "rosa", label: "Rosa", accent: "#f43f5e", accent2: "#a855f7" },
  { key: "grafite", label: "Grafite", accent: "#64748b", accent2: "#94a3b8" },
];

export function accentByKey(key: string): AccentOption {
  return ACCENTS.find((a) => a.key === key) ?? ACCENTS[0];
}

/** Aplica tema + acento no <html>, respeitando preferência do sistema. */
export function applyTheme(settings: Settings): void {
  const root = document.documentElement;
  const prefersDark =
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-color-scheme: light)").matches
      ? "light"
      : "dark";
  const resolved = settings.theme === "system" ? prefersDark : settings.theme;

  root.classList.toggle("dark", resolved === "dark");
  root.classList.toggle("light", resolved === "light");
  root.style.colorScheme = resolved;

  const { accent, accent2 } = accentByKey(settings.accent);
  root.style.setProperty("--accent", accent);
  root.style.setProperty("--accent-2", accent2);

  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute("content", resolved === "dark" ? "#07070b" : "#f5f6fb");
}
