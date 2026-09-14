import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  CornerDownLeft,
  Moon,
  Plus,
  Search,
  Sun,
  Target,
  Wand2,
} from "lucide-react";
import { MODULES } from "../lib/modules";
import { ACCENTS, accentByKey } from "../lib/theme";
import { useApp } from "../lib/store";
import { cn, today } from "../lib/utils";
import { Kbd } from "./ui";

interface Command {
  id: string;
  label: string;
  hint?: string;
  group: string;
  icon?: typeof Search;
  run: () => void;
}

export function CommandPalette({
  open,
  onClose,
  onQuickCapture,
}: {
  open: boolean;
  onClose: () => void;
  onQuickCapture: () => void;
}) {
  const navigate = useNavigate();
  const { data, settings, patchSettings, add, notify } = useApp();
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      setQuery("");
      setActive(0);
      window.setTimeout(() => inputRef.current?.focus(), 40);
    }
  }, [open]);

  const commands = useMemo<Command[]>(() => {
    const nav: Command[] = MODULES.filter(
      (m) => m.id === "dashboard" || m.id === "settings" || settings.modules[m.id] !== false,
    ).map((module) => ({
      id: `nav-${module.id}`,
      label: module.label,
      hint: module.description,
      group: "Navegar",
      icon: module.icon,
      run: () => navigate(module.path),
    }));

    const actions: Command[] = [
      {
        id: "action-capture",
        label: "Captura rápida",
        hint: "Salvar item na caixa de entrada",
        group: "Ações",
        icon: Plus,
        run: onQuickCapture,
      },
      {
        id: "action-task",
        label: "Nova tarefa para hoje",
        hint: "Cria tarefa no Meu dia",
        group: "Ações",
        icon: Plus,
        run: () => {
          const title = window.prompt("Título da tarefa:");
          if (!title?.trim()) return;
          add("tasks", {
            id: `task_${Date.now().toString(36)}`,
            title: title.trim(),
            done: false,
            priority: "media",
            area: "Geral",
            due: today(),
            today: true,
            order: 0,
            tags: [],
            createdAt: today(),
          });
          notify({ title: "Tarefa criada em Meu dia", tone: "success" });
          navigate("/meu-dia");
        },
      },
      {
        id: "action-theme",
        label: settings.theme === "dark" ? "Mudar para tema claro" : "Mudar para tema escuro",
        group: "Ações",
        icon: settings.theme === "dark" ? Sun : Moon,
        run: () => patchSettings({ theme: settings.theme === "dark" ? "light" : "dark" }),
      },
      {
        id: "action-accent",
        label: "Trocar cor de destaque",
        hint: `Atual: ${accentByKey(settings.accent).label}`,
        group: "Ações",
        icon: Wand2,
        run: () => {
          const index = ACCENTS.findIndex((a) => a.key === settings.accent);
          const next = ACCENTS[(index + 1) % ACCENTS.length];
          patchSettings({ accent: next.key });
          notify({ title: `Acento: ${next.label}`, tone: "success" });
        },
      },
    ];

    const records: Command[] = [
      ...data.tasks
        .filter((task) => !task.done)
        .slice(0, 40)
        .map((task) => ({
          id: `task-${task.id}`,
          label: task.title,
          hint: `Tarefa • ${task.area}`,
          group: "Tarefas",
          icon: Target,
          run: () => navigate("/meu-dia"),
        })),
      ...data.leads.map((lead) => ({
        id: `lead-${lead.id}`,
        label: lead.name,
        hint: `Lead • ${lead.source}`,
        group: "Leads",
        icon: Wand2,
        run: () => navigate("/sites"),
      })),
      ...data.goals.map((goal) => ({
        id: `goal-${goal.id}`,
        label: goal.title,
        hint: `Meta • ${goal.area}`,
        group: "Metas",
        icon: Target,
        run: () => navigate("/metas"),
      })),
      ...data.courses.map((course) => ({
        id: `course-${course.id}`,
        label: course.name,
        hint: `Curso • ${course.platform}`,
        group: "Estudos",
        icon: Wand2,
        run: () => navigate("/estudos"),
      })),
    ];

    return [...nav, ...actions, ...records];
  }, [add, data, navigate, notify, onQuickCapture, patchSettings, settings.modules, settings.theme]);

  const results = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return commands.slice(0, 9);
    return commands
      .filter((command) =>
        `${command.label} ${command.hint ?? ""} ${command.group}`.toLowerCase().includes(term),
      )
      .slice(0, 12);
  }, [commands, query]);

  useEffect(() => setActive(0), [query]);

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActive((prev) => Math.min(prev + 1, results.length - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((prev) => Math.max(prev - 1, 0));
    } else if (event.key === "Enter") {
      event.preventDefault();
      const command = results[active];
      if (command) {
        command.run();
        onClose();
      }
    } else if (event.key === "Escape") {
      onClose();
    }
  };

  const grouped = useMemo(() => {
    const map = new Map<string, Command[]>();
    results.forEach((command) => {
      const list = map.get(command.group) ?? [];
      list.push(command);
      map.set(command.group, list);
    });
    return Array.from(map.entries());
  }, [results]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[80] flex items-start justify-center p-4 pt-[12vh]">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/65 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, y: -14, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 340, damping: 30 }}
            onKeyDown={handleKeyDown}
            className="relative w-full max-w-xl overflow-hidden rounded-3xl border border-line bg-surface/95 shadow-[var(--shadow-pop)] backdrop-blur-2xl"
          >
            <div className="flex items-center gap-3 border-b border-line px-4 py-3.5">
              <Search className="h-4 w-4 text-faint" />
              <input
                ref={inputRef}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Buscar páginas, tarefas, leads, metas…"
                className="h-6 flex-1 bg-transparent text-[14px] outline-none placeholder:text-faint"
              />
              <Kbd>Esc</Kbd>
            </div>

            <div ref={listRef} className="max-h-[52vh] overflow-y-auto p-2">
              {grouped.length === 0 && (
                <p className="px-4 py-8 text-center text-[13px] text-muted">
                  Nada encontrado para “{query}”.
                </p>
              )}
              {grouped.map(([group, items]) => (
                <div key={group} className="mb-1">
                  <p className="label-xs px-3 py-2">{group}</p>
                  {items.map((command) => {
                    const index = results.indexOf(command);
                    const Icon = command.icon;
                    return (
                      <button
                        key={command.id}
                        type="button"
                        onMouseEnter={() => setActive(index)}
                        onClick={() => {
                          command.run();
                          onClose();
                        }}
                        className={cn(
                          "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors",
                          index === active ? "bg-surface-3" : "hover:bg-surface-2",
                        )}
                      >
                        {Icon ? (
                          <Icon className="h-4 w-4 shrink-0 text-accent" />
                        ) : (
                          <ArrowRight className="h-4 w-4 shrink-0 text-faint" />
                        )}
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[13.5px] font-medium">
                            {command.label}
                          </span>
                          {command.hint && (
                            <span className="block truncate text-[11.5px] text-faint">
                              {command.hint}
                            </span>
                          )}
                        </span>
                        {index === active && <CornerDownLeft className="h-3.5 w-3.5 text-faint" />}
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between gap-4 border-t border-line px-4 py-2.5 text-[11px] text-faint">
              <span className="flex items-center gap-2">
                <Kbd>↑</Kbd>
                <Kbd>↓</Kbd> navegar
              </span>
              <span className="flex items-center gap-2">
                <Kbd>↵</Kbd> abrir
              </span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
