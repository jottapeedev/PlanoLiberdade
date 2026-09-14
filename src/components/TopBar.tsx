import React, { useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Bell,
  Check,
  Flame,
  Lightbulb,
  Link2,
  Moon,
  StickyNote,
  Plus,
  Search,
  Sun,
  Timer,
  Zap,
} from "lucide-react";
import { useApp } from "../lib/store";
import { moduleByPath } from "../lib/modules";
import { cn, fmtLongDate, today } from "../lib/utils";
import { Button, Field, Kbd, Modal, SegmentedControl, Textarea } from "./ui";
import type { InboxKind } from "../lib/types";
import { MobileTopBarTrigger } from "./Sidebar";

export function TopBar({
  onOpenMenu,
  onOpenPalette,
}: {
  onOpenMenu: () => void;
  onOpenPalette: () => void;
}) {
  const location = useLocation();
  const { data, settings, patchSettings } = useApp();
  const [captureOpen, setCaptureOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  const current = moduleByPath(location.pathname);
  const isDark = settings.theme === "dark";

  const focusToday = useMemo(
    () =>
      data.studySessions
        .filter((s) => s.date === today())
        .reduce((acc, s) => acc + s.minutes, 0),
    [data.studySessions],
  );

  const unprocessed = data.inbox.filter((i) => !i.processed);

  const alerts = useMemo(() => {
    const urgent = data.tasks.filter((t) => !t.done && t.priority === "urgente");
    const late = data.tasks.filter(
      (t) => !t.done && t.due && t.due < today() && !t.today,
    );
    const habitsLeft = data.habits.length - data.habits.filter((h) => h.logs.includes(today())).length;
    const orders = data.orders.filter((o) => o.status === "novo").length;
    return [
      { id: "urgent", label: `${urgent.length} tarefa(s) urgente(s) em aberto`, tone: "var(--danger)", action: () => null },
      { id: "late", label: `${late.length} tarefa(s) atrasada(s)`, tone: "var(--warning)", action: () => null },
      { id: "habits", label: `${habitsLeft} hábito(s) ainda sem check hoje`, tone: "var(--accent)", action: () => null },
      { id: "orders", label: `${orders} pedido(s) novo(s) aguardando`, tone: "var(--info)", action: () => null },
    ].filter((alert) => !alert.label.startsWith("0 "));
  }, [data]);

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-line bg-canvas/70 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-[1600px] items-center gap-3 px-4 sm:px-6">
          <MobileTopBarTrigger onClick={onOpenMenu} />

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 text-[11px] text-faint">
              <span className="hidden sm:inline">{fmtLongDate()}</span>
            </div>
            <p className="truncate font-display text-[14.5px] font-semibold tracking-tight">
              {current?.label ?? "LIBERDADE"}
            </p>
          </div>

          <button
            type="button"
            onClick={onOpenPalette}
            className="hidden h-9 items-center gap-2 rounded-xl border border-line bg-surface-2/60 px-3 text-[12.5px] text-faint transition-colors hover:border-accent/40 hover:text-muted md:flex"
          >
            <Search className="h-3.5 w-3.5" />
            <span>Busca global</span>
            <Kbd>⌘K</Kbd>
          </button>

          <div className="hidden items-center gap-1.5 rounded-xl border border-line bg-surface-2/60 px-3 py-2 lg:flex">
            <Timer className="h-3.5 w-3.5 text-accent" />
            <span className="num text-[12px] font-semibold">
              {Math.floor(focusToday / 60)}h{String(focusToday % 60).padStart(2, "0")}
            </span>
            <span className="text-[11px] text-faint">foco hoje</span>
          </div>

          <div className="hidden items-center gap-1.5 rounded-xl border border-line bg-surface-2/60 px-3 py-2 xl:flex">
            <Flame className="h-3.5 w-3.5 text-warning" />
            <span className="num text-[12px] font-semibold">{unprocessed.length}</span>
            <span className="text-[11px] text-faint">na caixa</span>
          </div>

          <div className="relative">
            <button
              type="button"
              onClick={() => setNotifOpen((prev) => !prev)}
              className="relative grid h-9 w-9 place-items-center rounded-xl border border-line bg-surface-2/60 text-muted transition-colors hover:text-ink"
              aria-label="Alertas"
            >
              <Bell className="h-4 w-4" />
              {alerts.length > 0 && (
                <span className="absolute -top-1 -right-1 grid h-4 min-w-4 place-items-center rounded-full bg-danger px-1 text-[9.5px] font-bold text-white">
                  {alerts.length}
                </span>
              )}
            </button>
            {notifOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setNotifOpen(false)} />
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  className="absolute right-0 z-20 mt-2 w-72 rounded-2xl border border-line bg-surface p-3 shadow-[var(--shadow-pop)]"
                >
                  <p className="label-xs mb-2 px-1">Atenção hoje</p>
                  {alerts.length === 0 ? (
                    <p className="px-1 py-3 text-[12.5px] text-muted">
                      Tudo em ordem por aqui. 🎯
                    </p>
                  ) : (
                    <ul className="space-y-1">
                      {alerts.map((alert) => (
                        <li
                          key={alert.id}
                          className="flex items-start gap-2.5 rounded-xl px-2 py-2 text-[12.5px] text-muted transition-colors hover:bg-surface-2"
                        >
                          <span
                            className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full"
                            style={{ background: alert.tone }}
                          />
                          {alert.label}
                        </li>
                      ))}
                    </ul>
                  )}
                </motion.div>
              </>
            )}
          </div>

          <button
            type="button"
            onClick={() => patchSettings({ theme: isDark ? "light" : "dark" })}
            className="grid h-9 w-9 place-items-center rounded-xl border border-line bg-surface-2/60 text-muted transition-colors hover:text-ink"
            aria-label="Alternar tema"
          >
            {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>

          <Button icon={Plus} onClick={() => setCaptureOpen(true)} className="shrink-0">
            <span className="hidden sm:inline">Captura rápida</span>
          </Button>
        </div>
      </header>

      <QuickCapture open={captureOpen} onClose={() => setCaptureOpen(false)} />
    </>
  );
}

const KINDS: Array<{ value: InboxKind; label: string; icon: typeof Lightbulb }> = [
  { value: "ideia", label: "Ideia", icon: Lightbulb },
  { value: "tarefa", label: "Tarefa", icon: Check },
  { value: "nota", label: "Nota", icon: StickyNote },
  { value: "link", label: "Link", icon: Link2 },
];

export function QuickCapture({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { add, notify } = useApp();
  const [text, setText] = useState("");
  const [kind, setKind] = useState<InboxKind>("ideia");
  const [tags, setTags] = useState("");

  const submit = () => {
    const value = text.trim();
    if (!value) return;
    add("inbox", {
      id: `inbox_${Date.now().toString(36)}`,
      text: value,
      kind,
      tags: tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      processed: false,
      createdAt: new Date().toISOString(),
    });
    setText("");
    setTags("");
    notify({ title: "Capturado!", description: "Item salvo na caixa de entrada.", tone: "success" });
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Captura rápida"
      description="Tire da cabeça em 5 segundos. Organize depois."
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button icon={Zap} onClick={submit} disabled={!text.trim()}>
            Capturar
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <SegmentedControl value={kind} options={KINDS} onChange={setKind} className="w-full" />
        <Field label="O que você quer registrar?">
          <Textarea
            autoFocus
            value={text}
            onChange={(event) => setText(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) submit();
            }}
            placeholder="Ex: ideia de vídeo sobre organização de cozinha…"
          />
        </Field>
        <Field label="Tags" hint="Separe por vírgula — ex: tiktok, sites, financas">
          <input
            value={tags}
            onChange={(event) => setTags(event.target.value)}
            placeholder="tiktok, sites"
            className="h-10 w-full rounded-xl border border-line bg-surface-2/70 px-3 text-[13.5px] outline-none focus:border-accent/60 focus:ring-4 focus:ring-accent/10"
          />
        </Field>
        <p className={cn("text-[11.5px] text-faint")}>
          Atalho: <Kbd>Ctrl</Kbd> + <Kbd>Enter</Kbd> para salvar.
        </p>
      </div>
    </Modal>
  );
}
