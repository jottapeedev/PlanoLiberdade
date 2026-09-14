import React, { useEffect, useState } from "react";
import { Link, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { AlertOctagon, LayoutDashboard, Power, RotateCcw } from "lucide-react";
import { Sidebar } from "./components/Sidebar";
import { TopBar, QuickCapture } from "./components/TopBar";
import { CommandPalette } from "./components/CommandPalette";
import { Button, EmptyState, ToastViewport } from "./components/ui";
import { useApp } from "./lib/store";
import { moduleByPath } from "./lib/modules";
import Dashboard from "./pages/Dashboard";
import InboxPage from "./pages/Inbox";
import MyDay from "./pages/MyDay";
import Sites from "./pages/Sites";
import TikTok from "./pages/TikTok";
import BusinessPage from "./pages/Business";
import Studies from "./pages/Studies";
import Training from "./pages/Training";
import Habits from "./pages/Habits";
import Goals from "./pages/Goals";
import Finance from "./pages/Finance";
import SettingsPage from "./pages/Settings";

const COLLAPSE_KEY = "liberdade.sidebar.collapsed";

/* ------------------------------------------------------------------ *
 *  Error boundary
 * ------------------------------------------------------------------ */

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { error: Error | null }
> {
  state = { error: null as Error | null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <div className="grid min-h-screen place-items-center app-bg p-6">
          <div className="panel max-w-lg p-6 text-center">
            <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-danger/15 text-danger">
              <AlertOctagon className="h-5 w-5" />
            </span>
            <h1 className="mt-4 font-display text-lg font-bold">Algo quebrou por aqui</h1>
            <p className="mt-2 text-[13px] text-muted">
              Um erro inesperado interrompeu a interface. Seus dados continuam salvos no
              navegador.
            </p>
            <pre className="mt-4 max-h-40 overflow-auto rounded-xl border border-line bg-surface-2/60 p-3 text-left text-[11.5px] text-muted">
              {this.state.error.message}
            </pre>
            <Button
              className="mt-5"
              icon={RotateCcw}
              onClick={() => {
                this.setState({ error: null });
                window.location.reload();
              }}
            >
              Recarregar aplicação
            </Button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

/* ------------------------------------------------------------------ *
 *  Guarda de módulo desativado
 * ------------------------------------------------------------------ */

function Guarded({ moduleId, children }: { moduleId: string; children: React.ReactNode }) {
  const { settings, patchSettings } = useApp();
  if (settings.modules[moduleId] !== false) return <>{children}</>;
  return (
    <EmptyState
      icon={Power}
      title="Módulo desativado"
      description="Este módulo está oculto nas configurações. Ative para voltar a usá-lo."
      action={
        <Button
          icon={Power}
          onClick={() => patchSettings({ modules: { ...settings.modules, [moduleId]: true } })}
        >
          Ativar módulo
        </Button>
      }
    />
  );
}

function NotFound() {
  return (
    <EmptyState
      icon={LayoutDashboard}
      title="Página não encontrada"
      description="O endereço acessado não existe nesta central."
      action={
        <Link to="/">
          <Button icon={LayoutDashboard}>Voltar para a visão geral</Button>
        </Link>
      }
    />
  );
}

/* ------------------------------------------------------------------ *
 *  Shell
 * ------------------------------------------------------------------ */

function Shell() {
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [captureOpen, setCaptureOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem(COLLAPSE_KEY) === "1");

  const current = moduleByPath(location.pathname);

  useEffect(() => {
    setMenuOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [location.pathname]);

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const typing = ["INPUT", "TEXTAREA", "SELECT"].includes(target?.tagName ?? "");
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setPaletteOpen(true);
      } else if (!typing && event.key === "n" && !event.metaKey && !event.ctrlKey) {
        event.preventDefault();
        setCaptureOpen(true);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const toggleCollapse = () => {
    setCollapsed((prev) => {
      localStorage.setItem(COLLAPSE_KEY, prev ? "0" : "1");
      return !prev;
    });
  };

  return (
    <div className="app-bg relative min-h-screen">
      <div className="pointer-events-none fixed inset-0 grid-overlay opacity-70" />

      <Sidebar
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        onOpenPalette={() => setPaletteOpen(true)}
        collapsed={collapsed}
        onToggleCollapse={toggleCollapse}
      />

      <div
        className={
          "relative transition-[padding] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] " +
          (collapsed ? "lg:pl-[78px]" : "lg:pl-[268px]")
        }
      >
        <TopBar
          onOpenMenu={() => setMenuOpen(true)}
          onOpenPalette={() => setPaletteOpen(true)}
        />

        <main className="mx-auto w-full max-w-[1680px] px-4 py-6 sm:px-6 lg:py-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              className="space-y-6"
            >
              <Routes location={location}>
  <Route
    path="/"
    element={
      <Guarded moduleId="dashboard">
        <Dashboard />
      </Guarded>
    }
  />
  <Route
    path="/inbox"
    element={
      <Guarded moduleId="inbox">
        <InboxPage />
      </Guarded>
    }
  />
  <Route
    path="/meu-dia"
    element={
      <Guarded moduleId="myday">
        <MyDay />
      </Guarded>
    }
  />
  <Route
    path="/sites"
    element={
      <Guarded moduleId="sites">
        <Sites />
      </Guarded>
    }
  />
  <Route
    path="/tiktok"
    element={
      <Guarded moduleId="tiktok">
        <TikTok />
      </Guarded>
    }
  />
  <Route
    path="/srta-docura"
    element={
      <Guarded moduleId="docura">
        <BusinessPage businessId="biz_docura" />
      </Guarded>
    }
  />
  <Route
    path="/srta-das-massas"
    element={
      <Guarded moduleId="massas">
        <BusinessPage businessId="biz_massas" />
      </Guarded>
    }
  />
  <Route
    path="/estudos"
    element={
      <Guarded moduleId="studies">
        <Studies />
      </Guarded>
    }
  />
  <Route
    path="/treinos"
    element={
      <Guarded moduleId="training">
        <Training />
      </Guarded>
    }
  />
  <Route
    path="/habitos"
    element={
      <Guarded moduleId="habits">
        <Habits />
      </Guarded>
    }
  />
  <Route
    path="/metas"
    element={
      <Guarded moduleId="goals">
        <Goals />
      </Guarded>
    }
  />
  <Route
    path="/financas"
    element={
      <Guarded moduleId="finance">
        <Finance />
      </Guarded>
    }
  />
  <Route
    path="/configuracoes"
    element={
      <Guarded moduleId="settings">
        <SettingsPage />
      </Guarded>
    }
  />
  <Route path="/dashboard" element={<Navigate to="/" replace />} />
  <Route path="*" element={<NotFound />} />
</Routes>
            </motion.div>
          </AnimatePresence>

          <footer className="mt-12 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-6 text-[11.5px] text-faint">
            <span>
              LIBERDADE · Central de vida, renda e produtividade
              {current ? ` · ${current.section}` : ""}
            </span>
            <span className="flex items-center gap-2">
              Atalhos: <kbd className="font-sans">⌘K</kbd> busca ·{" "}
              <kbd className="font-sans">N</kbd> captura
            </span>
          </footer>
        </main>
      </div>

      <QuickCapture open={captureOpen} onClose={() => setCaptureOpen(false)} />
      <CommandPalette
        open={paletteOpen}
        onClose={() => setPaletteOpen(false)}
        onQuickCapture={() => {
          setPaletteOpen(false);
          setCaptureOpen(true);
        }}
      />
      <ToastViewport />
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <Shell />
    </ErrorBoundary>
  );
}
