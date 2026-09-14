import { useMemo } from "react";
import { NavLink } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ChevronsLeft,
  ChevronsRight,
  Flame,
  Moon,
  PanelLeft,
  Search,
  Sparkles,
  Sun,
  X,
} from "lucide-react";
import { MODULES, SECTION_ORDER, type ModuleDef } from "../lib/modules";
import { useApp } from "../lib/store";
import { cn, initials, today } from "../lib/utils";
import { Kbd } from "./ui";

interface SidebarProps {
  open: boolean;
  onClose: () => void;
  onOpenPalette: () => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

function useCounts() {
  const { data } = useApp();
  return useMemo(() => {
    const openOrders = (id: string) =>
      data.orders.filter(
        (o) => o.businessId === id && ["novo", "producao", "entrega"].includes(o.status),
      ).length;
    return {
      inbox: data.inbox.filter((i) => !i.processed).length,
      myday: data.tasks.filter((t) => t.today && !t.done).length,
      sites: data.leads.filter((l) => {
        const status = data.leadStatuses.find((s) => s.id === l.statusId);
        return !status || status.kind === "aberto";
      }).length,
      tiktok: data.products.filter((p) => p.active).length,
      docura: openOrders("biz_docura"),
      massas: openOrders("biz_massas"),
      studies: data.courses.filter((c) => c.status === "ativo").length,
      training: data.trainingSessions.filter((s) => s.date >= today()).length,
      habits: data.habits.filter((h) => !h.logs.includes(today())).length,
      goals: data.goals.filter((g) => g.status === "ativa").length,
    } as Record<string, number | undefined>;
  }, [data]);
}

export function Sidebar({
  open,
  onClose,
  onOpenPalette,
  collapsed,
  onToggleCollapse,
}: SidebarProps) {
  const { data, settings, patchSettings } = useApp();
  const counts = useCounts();

  const visible = useMemo(
    () => MODULES.filter((m) => m.id === "dashboard" || m.id === "settings" || settings.modules[m.id] !== false),
    [settings.modules],
  );

  const streak = useMemo(() => {
    let count = 0;
    const cursor = new Date();
    for (let i = 0; i < 60; i++) {
      const key = cursor.toISOString().slice(0, 10);
      const hits = data.habits.filter((h) => h.logs.includes(key)).length;
      if (hits >= Math.max(1, Math.ceil(data.habits.length * 0.5))) count += 1;
      else if (i > 0) break;
      cursor.setDate(cursor.getDate() - 1);
    }
    return count;
  }, [data.habits]);

  const isDark = settings.theme === "dark";

  return (
    <>
      {/* backdrop mobile */}
      <div
        onClick={onClose}
        className={cn(
          "fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity lg:hidden",
          open ? "opacity-100" : "pointer-events-none opacity-0",
        )}
      />

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex flex-col border-r border-line bg-surface/85 backdrop-blur-2xl transition-[width,transform] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] lg:z-30 lg:translate-x-0",
          collapsed ? "w-[268px] lg:w-[78px]" : "w-[268px]",
          open ? "translate-x-0 shadow-[var(--shadow-pop)]" : "-translate-x-full",
        )}
      >
        {/* brand */}
        <div className="flex items-center gap-3 px-4 pt-5 pb-4">
          <span
            className={cn(
              "relative grid h-10 w-10 shrink-0 place-items-center rounded-2xl accent-grad text-white shadow-[0_10px_26px_-10px_var(--accent)]",
              collapsed && "lg:mx-auto",
            )}
          >
            <Sparkles className="h-5 w-5" />
          </span>
          <div className={cn("min-w-0 flex-1 lg:transition-opacity", collapsed && "lg:hidden")}>
            <p className="font-display text-[15px] leading-none font-extrabold tracking-tight">
              LIBERDADE
            </p>
            <p className="mt-1 truncate text-[11px] text-faint">
              Organize hoje. Construa amanhã.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-lg text-muted transition-colors hover:bg-surface-3 hover:text-ink lg:hidden"
            aria-label="Fechar menu"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* busca */}
        <div className={cn("px-4 pb-3", collapsed && "lg:px-3")}>
          <button
            type="button"
            onClick={onOpenPalette}
            className={cn(
              "group flex w-full items-center gap-2.5 rounded-xl border border-line bg-surface-2/70 px-3 py-2.5 text-[13px] text-faint transition-colors hover:border-accent/40 hover:text-muted",
              collapsed && "lg:justify-center lg:px-0",
            )}
          >
            <Search className="h-4 w-4 shrink-0" />
            <span className={cn("flex-1 text-left", collapsed && "lg:hidden")}>Buscar…</span>
            <Kbd>⌘K</Kbd>
          </button>
        </div>

        {/* navegação */}
        <nav className="hide-scroll flex-1 overflow-y-auto px-3 pb-4">
          {SECTION_ORDER.map((section) => {
            const items = visible.filter((m) => m.section === section);
            if (!items.length) return null;
            return (
              <div key={section} className="mb-4">
                <p
                  className={cn(
                    "label-xs px-3 pb-2",
                    collapsed && "lg:hidden",
                  )}
                >
                  {section}
                </p>
                <div className={cn("space-y-1", collapsed && "lg:border-t lg:border-line lg:pt-2")}>
                  {items.map((item) => (
                    <NavItem
                      key={item.id}
                      item={item}
                      count={counts[item.id]}
                      collapsed={collapsed}
                      onClick={onClose}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </nav>

        {/* rodapé */}
        <div className={cn("border-t border-line p-3", collapsed && "lg:px-2")}>
          <div
            className={cn(
              "mb-3 flex items-center gap-3 rounded-xl border border-line bg-surface-2/60 px-3 py-2.5",
              collapsed && "lg:justify-center lg:px-0",
            )}
          >
            <span className="accent-soft grid h-8 w-8 shrink-0 place-items-center rounded-lg">
              <Flame className="h-4 w-4" />
            </span>
            <div className={cn("min-w-0", collapsed && "lg:hidden")}>
              <p className="num text-[13px] leading-none font-bold">
                {streak} {streak === 1 ? "dia" : "dias"}
              </p>
              <p className="mt-1 text-[10.5px] text-faint">sequência de rotina</p>
            </div>
          </div>

          <div className={cn("flex items-center gap-2.5", collapsed && "lg:justify-center")}>
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-line-strong bg-surface-3 text-[12px] font-bold">
              {initials(settings.name)}
            </span>
            <div className={cn("min-w-0 flex-1", collapsed && "lg:hidden")}>
              <p className="truncate text-[12.5px] font-semibold">{settings.name}</p>
              <p className="truncate text-[10.5px] text-faint">Workspace pessoal</p>
            </div>
            <button
              type="button"
              onClick={() => patchSettings({ theme: isDark ? "light" : "dark" })}
              className={cn(
                "grid h-8 w-8 shrink-0 place-items-center rounded-lg text-muted transition-colors hover:bg-surface-3 hover:text-ink",
                collapsed && "lg:hidden",
              )}
              aria-label="Alternar tema"
            >
              {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
            <button
              type="button"
              onClick={onToggleCollapse}
              title={collapsed ? "Expandir menu" : "Recolher menu"}
              className="hidden h-8 w-8 shrink-0 place-items-center rounded-lg border border-line text-muted transition-colors hover:bg-surface-3 hover:text-ink lg:grid"
              aria-label={collapsed ? "Expandir menu" : "Recolher menu"}
            >
              {collapsed ? <ChevronsRight className="h-4 w-4" /> : <ChevronsLeft className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}

function NavItem({
  item,
  count,
  collapsed,
  onClick,
}: {
  item: ModuleDef;
  count?: number;
  collapsed: boolean;
  onClick: () => void;
}) {
  const Icon = item.icon;
  return (
    <NavLink
      to={item.path}
      end={item.path === "/"}
      onClick={onClick}
      title={collapsed ? item.label : undefined}
      className={({ isActive }) =>
        cn(
          "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium transition-colors",
          collapsed && "lg:justify-center lg:px-0",
          isActive ? "text-ink" : "text-muted hover:bg-surface-2/70 hover:text-ink",
        )
      }
    >
      {({ isActive }) => (
        <>
          {isActive && (
            <motion.span
              layoutId="nav-active"
              transition={{ type: "spring", stiffness: 420, damping: 34 }}
              className="absolute inset-0 rounded-xl border border-line-strong bg-surface-3"
            />
          )}
          {isActive && (
            <span className="absolute top-1/2 -left-3 h-6 w-1 -translate-y-1/2 rounded-r-full accent-grad" />
          )}
          <Icon
            className={cn(
              "relative h-4.5 w-4.5 shrink-0 transition-colors",
              isActive && "text-accent",
            )}
            style={{ color: isActive ? item.accent : undefined }}
          />
          <span className={cn("relative flex-1 truncate", collapsed && "lg:hidden")}>
            {item.label}
          </span>
          {typeof count === "number" && count > 0 && (
            <span
              className={cn(
                "num relative rounded-md bg-surface text-[10.5px] font-bold text-muted px-1.5 py-0.5 border border-line",
                collapsed && "lg:absolute lg:top-1 lg:right-1.5 lg:px-1 lg:text-[9px]",
              )}
            >
              {count}
            </span>
          )}
        </>
      )}
    </NavLink>
  );
}

export function MobileTopBarTrigger({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="grid h-9 w-9 place-items-center rounded-xl border border-line bg-surface-2/70 text-muted transition-colors hover:text-ink lg:hidden"
      aria-label="Abrir menu"
    >
      <PanelLeft className="h-4 w-4" />
    </button>
  );
}
