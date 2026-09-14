import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useState,
} from "react";
import { createSeedData, emptyData } from "./seed";
import { applyTheme } from "./theme";
import type { AppData, Collection, Settings } from "./types";
import { uid } from "./utils";

const STORAGE_KEY = "liberdade.workspace.v1";

/* ============================== reducer ============================== */

type Action =
  | { type: "add"; collection: Collection; item: unknown }
  | { type: "addMany"; collection: Collection; items: unknown[] }
  | { type: "update"; collection: Collection; id: string; patch: Record<string, unknown> }
  | { type: "remove"; collection: Collection; id: string }
  | { type: "setCollection"; collection: Collection; items: unknown[] }
  | { type: "settings"; patch: Partial<Settings> }
  | { type: "replace"; data: AppData };

function reducer(state: AppData, action: Action): AppData {
  switch (action.type) {
    case "add": {
      const list = state[action.collection] as unknown as Array<{ id: string }>;
      return { ...state, [action.collection]: [action.item, ...list] };
    }
    case "addMany": {
      const list = state[action.collection] as unknown as Array<{ id: string }>;
      return { ...state, [action.collection]: [...action.items, ...list] };
    }
    case "update": {
      const list = state[action.collection] as unknown as Array<Record<string, unknown>>;
      return {
        ...state,
        [action.collection]: list.map((item) =>
          item.id === action.id ? { ...item, ...action.patch } : item,
        ),
      };
    }
    case "remove": {
      const list = state[action.collection] as unknown as Array<{ id: string }>;
      return { ...state, [action.collection]: list.filter((item) => item.id !== action.id) };
    }
    case "setCollection":
      return { ...state, [action.collection]: action.items };
    case "settings":
      return { ...state, settings: { ...state.settings, ...action.patch } };
    case "replace":
      return action.data;
    default:
      return state;
  }
}

/* ============================== storage ============================== */

function loadData(): AppData {
  if (typeof window === "undefined") return createSeedData();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return createSeedData();
    const parsed = JSON.parse(raw) as Partial<AppData>;
    const seed = createSeedData();
    const merged: AppData = {
      ...seed,
      ...parsed,
      settings: { ...seed.settings, ...(parsed.settings ?? {}), modules: { ...seed.settings.modules, ...(parsed.settings?.modules ?? {}) } },
      version: 1,
    } as AppData;
    return merged;
  } catch {
    return createSeedData();
  }
}

function saveData(data: AppData): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    /* storage cheio ou indisponível — segue em memória */
  }
}

/* ================================ toasts ============================== */

export interface Toast {
  id: string;
  title: string;
  description?: string;
  tone?: "default" | "success" | "error";
  action?: { label: string; onClick: () => void };
}

/* =============================== context ============================== */

interface AppContextValue {
  data: AppData;
  settings: Settings;
  add: <K extends Collection>(collection: K, item: AppData[K][number]) => void;
  update: <K extends Collection>(
    collection: K,
    id: string,
    patch: Partial<AppData[K][number]>,
  ) => void;
  remove: <K extends Collection>(collection: K, id: string) => void;
  setCollection: <K extends Collection>(collection: K, items: AppData[K]) => void;
  patchSettings: (patch: Partial<Settings>) => void;
  replaceData: (data: AppData) => void;
  notify: (toast: Omit<Toast, "id">) => void;
  dismiss: (id: string) => void;
  toasts: Toast[];
  resetDemo: () => void;
  startEmpty: () => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [data, dispatch] = useReducer(reducer, undefined, loadData);
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    saveData(data);
  }, [data]);

  useEffect(() => {
    applyTheme(data.settings);
    const mq = window.matchMedia?.("(prefers-color-scheme: light)");
    if (!mq || data.settings.theme !== "system") return;
    const handler = () => applyTheme(data.settings);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [data.settings]);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const notify = useCallback(
    (toast: Omit<Toast, "id">) => {
      const id = uid("toast");
      setToasts((prev) => [...prev.slice(-3), { ...toast, id }]);
      window.setTimeout(() => dismiss(id), toast.action ? 7000 : 4200);
    },
    [dismiss],
  );

  const value = useMemo<AppContextValue>(
    () => ({
      data,
      settings: data.settings,
      add: (collection, item) => dispatch({ type: "add", collection, item }),
      update: (collection, id, patch) =>
        dispatch({ type: "update", collection, id, patch: patch as Record<string, unknown> }),
      remove: (collection, id) => dispatch({ type: "remove", collection, id }),
      setCollection: (collection, items) => dispatch({ type: "setCollection", collection, items }),
      patchSettings: (patch) => dispatch({ type: "settings", patch }),
      replaceData: (next) => dispatch({ type: "replace", data: next }),
      notify,
      dismiss,
      toasts,
      resetDemo: () => dispatch({ type: "replace", data: createSeedData() }),
      startEmpty: () => dispatch({ type: "replace", data: emptyData() }),
    }),
    [data, notify, dismiss, toasts],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp deve ser usado dentro de <AppProvider>");
  return ctx;
}
