import { useRef, useState } from "react";
import {
  BadgeCheck,
  Check,
  Database,
  Download,
  Info,
  Keyboard,
  Monitor,
  Moon,
  Palette,
  Save,
  Settings as SettingsIcon,
  Sparkles,
  Sun,
  Timer,
  ToggleLeft,
  Trash2,
  Upload,
  User,
} from "lucide-react";
import {
  Badge,
  Button,
  ConfirmDialog,
  Field,
  Input,
  Kbd,
  PageHeader,
  Panel,
  Progress,
  SectionHeader,
  SegmentedControl,
  Switch,
} from "../components/ui";
import { useApp } from "../lib/store";
import { MODULES, SECTION_ORDER } from "../lib/modules";
import { ACCENTS } from "../lib/theme";
import { cn, num } from "../lib/utils";
import type { AppData } from "../lib/types";

export default function SettingsPage() {
  const { data, settings, patchSettings, replaceData, notify, resetDemo, startEmpty } = useApp();
  const fileRef = useRef<HTMLInputElement>(null);
  const [confirmReset, setConfirmReset] = useState<"demo" | "empty" | null>(null);
  const [name, setName] = useState(settings.name);

  const storageSize = (() => {
    try {
      const raw = localStorage.getItem("liberdade.workspace.v1") ?? "";
      return `${(raw.length / 1024).toFixed(1)} KB`;
    } catch {
      return "—";
    }
  })();

  const exportData = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `liberdade-backup-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
    notify({ title: "Backup exportado", description: "Arquivo JSON baixado.", tone: "success" });
  };

  const importData = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result)) as AppData;
        if (!parsed || typeof parsed !== "object" || !("tasks" in parsed)) {
          throw new Error("formato inválido");
        }
        replaceData({ ...parsed, version: 1 });
        notify({ title: "Dados importados", description: "Workspace restaurado com sucesso.", tone: "success" });
      } catch {
        notify({ title: "Falha ao importar", description: "Arquivo JSON inválido.", tone: "error" });
      }
    };
    reader.readAsText(file);
  };

  const enabledModules = MODULES.filter(
    (module) => module.id === "dashboard" || settings.modules[module.id] !== false,
  ).length;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Preferências"
        icon={SettingsIcon}
        title="Configurações"
        description="Personalize aparência, foco, módulos visíveis e faça backup dos seus dados. Tudo fica salvo localmente no navegador."
      >
        <Badge dot>v1.0 · workspace local</Badge>
      </PageHeader>

      <div className="grid gap-5 lg:grid-cols-2">
        {/* perfil + aparência */}
        <Panel>
          <SectionHeader icon={User} title="Perfil" description="Como o sistema se refere a você" />
          <div className="mt-4 space-y-4">
            <Field label="Seu nome">
              <Input value={name} onChange={(event) => setName(event.target.value)} />
            </Field>
            <div className="flex items-center gap-2">
              <Button
                icon={Save}
                onClick={() => {
                  patchSettings({ name: name.trim() || "Você" });
                  notify({ title: "Perfil atualizado", tone: "success" });
                }}
              >
                Salvar nome
              </Button>
              <Button
                variant="ghost"
                onClick={() => setName(settings.name)}
                disabled={name === settings.name}
              >
                Desfazer
              </Button>
            </div>
            <div className="rounded-2xl border border-line bg-surface-2/40 p-3.5 text-[12px] text-muted">
              Perfil atual: <span className="font-semibold text-ink">{settings.name}</span> · idioma
              pt-BR · moeda <span className="font-semibold text-ink">{settings.currency}</span>
            </div>
          </div>
        </Panel>

        <Panel>
          <SectionHeader icon={Palette} title="Aparência" description="Tema e cor de destaque" />
          <div className="mt-4 space-y-5">
            <div>
              <span className="label-xs mb-2 block">Tema</span>
              <SegmentedControl
                value={settings.theme}
                onChange={(value) => patchSettings({ theme: value })}
                options={[
                  { value: "dark", label: "Escuro", icon: Moon },
                  { value: "light", label: "Claro", icon: Sun },
                  { value: "system", label: "Sistema", icon: Monitor },
                ]}
              />
            </div>
            <div>
              <span className="label-xs mb-2 block">Cor de destaque</span>
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
                {ACCENTS.map((accent) => (
                  <button
                    key={accent.key}
                    type="button"
                    onClick={() => patchSettings({ accent: accent.key })}
                    className={cn(
                      "group relative flex flex-col items-center gap-2 rounded-2xl border p-2.5 transition-all hover:-translate-y-0.5",
                      settings.accent === accent.key
                        ? "border-accent/60 bg-surface-2"
                        : "border-line bg-surface-2/40",
                    )}
                  >
                    <span
                      className="h-7 w-full rounded-lg"
                      style={{
                        background: `linear-gradient(120deg, ${accent.accent}, ${accent.accent2})`,
                      }}
                    />
                    <span className="text-[10.5px] font-medium text-muted">{accent.label}</span>
                    {settings.accent === accent.key && (
                      <Check className="absolute top-1.5 right-1.5 h-3.5 w-3.5 text-accent" />
                    )}
                  </button>
                ))}
              </div>
            </div>
            <div className="rounded-2xl border border-line bg-surface-2/40 p-3.5">
              <p className="text-[11.5px] text-muted">
                A cor de destaque é aplicada em gradientes, gráficos, indicadores e no anel de
                progresso em todo o sistema.
              </p>
            </div>
          </div>
        </Panel>

        {/* foco */}
        <Panel>
          <SectionHeader icon={Timer} title="Foco e produtividade" description="Blocos de trabalho e metas diárias" />
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <Field label="Meta diária (min)">
              <Input
                type="number"
                value={settings.dailyFocusTarget}
                onChange={(event) =>
                  patchSettings({ dailyFocusTarget: Number(event.target.value) || 240 })
                }
              />
            </Field>
            <Field label="Bloco de foco (min)">
              <Input
                type="number"
                value={settings.focusMinutes}
                onChange={(event) =>
                  patchSettings({ focusMinutes: Number(event.target.value) || 50 })
                }
              />
            </Field>
            <Field label="Pausa (min)">
              <Input
                type="number"
                value={settings.breakMinutes}
                onChange={(event) =>
                  patchSettings({ breakMinutes: Number(event.target.value) || 10 })
                }
              />
            </Field>
          </div>
          <div className="mt-4 space-y-3">
            <div className="flex items-center justify-between text-[12px]">
              <span className="text-muted">Distribuição sugerida do dia</span>
              <span className="num font-semibold">
                {Math.round((settings.dailyFocusTarget / settings.focusMinutes) * 10) / 10} blocos
              </span>
            </div>
            <Progress
              value={settings.focusMinutes}
              max={settings.dailyFocusTarget}
              height={7}
            />
            <p className="text-[11.5px] text-faint">
              {settings.dailyFocusTarget}min de foco distribuídos em blocos de {settings.focusMinutes}min
              com pausas de {settings.breakMinutes}min.
            </p>
          </div>
        </Panel>

        {/* módulos */}
        <Panel>
          <SectionHeader
            icon={ToggleLeft}
            title="Módulos visíveis"
            description={`${enabledModules} de ${MODULES.length} ativos na navegação`}
          />
          <div className="mt-4 space-y-2.5">
            {SECTION_ORDER.filter((section) => section !== "Sistema").map((section) => (
              <div key={section}>
                <p className="label-xs mb-2">{section}</p>
                <div className="space-y-2">
                  {MODULES.filter(
                    (module) => module.section === section && module.id !== "settings",
                  ).map((module) => {
                    const active = settings.modules[module.id] !== false;
                    const Icon = module.icon;
                    return (
                      <div
                        key={module.id}
                        className="flex items-center gap-3 rounded-xl border border-line bg-surface-2/40 px-3.5 py-2.5"
                      >
                        <span
                          className="grid h-8 w-8 shrink-0 place-items-center rounded-xl border"
                          style={{
                            background: `color-mix(in oklab, ${module.accent ?? "var(--accent)"} 12%, transparent)`,
                            borderColor: `color-mix(in oklab, ${module.accent ?? "var(--accent)"} 24%, transparent)`,
                            color: module.accent ?? "var(--accent)",
                          }}
                        >
                          <Icon className="h-3.5 w-3.5" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-[12.5px] font-medium">{module.label}</span>
                          <span className="block truncate text-[10.5px] text-faint">
                            {module.description}
                          </span>
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            patchSettings({
                              modules: { ...settings.modules, [module.id]: !active },
                            })
                          }
                          className={cn(
                            "relative h-6 w-11 shrink-0 rounded-full border transition-colors",
                            active ? "border-transparent accent-grad" : "border-line bg-surface-3",
                          )}
                          aria-label={`Alternar ${module.label}`}
                        >
                          <span
                            className={cn(
                              "absolute top-0.5 h-[18px] w-[18px] rounded-full bg-white shadow-sm transition-all",
                              active ? "left-[26px]" : "left-0.5",
                            )}
                          />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      {/* dados */}
      <Panel>
        <SectionHeader
          icon={Database}
          title="Dados e backup"
          description={`Workspace salvo localmente · ${storageSize} · ${num(data.tasks.length)} tarefas, ${num(data.transactions.length)} lançamentos`}
        />
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <button
            type="button"
            onClick={exportData}
            className="flex items-center gap-3 rounded-2xl border border-line bg-surface-2/40 p-4 text-left transition-all hover:-translate-y-0.5 hover:border-accent/40"
          >
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl accent-soft">
              <Download className="h-4 w-4" />
            </span>
            <span>
              <span className="block text-[13px] font-semibold">Exportar backup</span>
              <span className="block text-[11px] text-faint">Baixar JSON completo</span>
            </span>
          </button>

          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="flex items-center gap-3 rounded-2xl border border-line bg-surface-2/40 p-4 text-left transition-all hover:-translate-y-0.5 hover:border-accent/40"
          >
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl accent-soft">
              <Upload className="h-4 w-4" />
            </span>
            <span>
              <span className="block text-[13px] font-semibold">Importar dados</span>
              <span className="block text-[11px] text-faint">Restaurar de um JSON</span>
            </span>
          </button>

          <button
            type="button"
            onClick={() => setConfirmReset("demo")}
            className="flex items-center gap-3 rounded-2xl border border-line bg-surface-2/40 p-4 text-left transition-all hover:-translate-y-0.5 hover:border-accent/40"
          >
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl accent-soft">
              <Sparkles className="h-4 w-4" />
            </span>
            <span>
              <span className="block text-[13px] font-semibold">Recarregar demo</span>
              <span className="block text-[11px] text-faint">Voltar aos dados de exemplo</span>
            </span>
          </button>

          <button
            type="button"
            onClick={() => setConfirmReset("empty")}
            className="flex items-center gap-3 rounded-2xl border border-danger/30 bg-danger/10 p-4 text-left transition-all hover:-translate-y-0.5"
          >
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl border border-danger/30 text-danger">
              <Trash2 className="h-4 w-4" />
            </span>
            <span>
              <span className="block text-[13px] font-semibold">Começar do zero</span>
              <span className="block text-[11px] text-muted">Esvaziar workspace</span>
            </span>
          </button>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="application/json"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) importData(file);
            event.target.value = "";
          }}
        />
      </Panel>

      <div className="grid gap-5 lg:grid-cols-2">
        <Panel>
          <SectionHeader icon={Keyboard} title="Atalhos de teclado" description="Acelere o uso diário" />
          <ul className="mt-4 space-y-2.5">
            {[
              { keys: ["⌘", "K"], label: "Abrir busca global" },
              { keys: ["N"], label: "Captura rápida" },
              { keys: ["Esc"], label: "Fechar janelas e menus" },
              { keys: ["↑", "↓"], label: "Navegar na busca" },
              { keys: ["↵"], label: "Confirmar ação na busca" },
              { keys: ["Ctrl", "Enter"], label: "Salvar captura" },
            ].map((shortcut) => (
              <li
                key={shortcut.label}
                className="flex items-center justify-between rounded-xl border border-line bg-surface-2/40 px-3.5 py-2.5"
              >
                <span className="text-[12.5px] text-muted">{shortcut.label}</span>
                <span className="flex items-center gap-1">
                  {shortcut.keys.map((key) => (
                    <Kbd key={key}>{key}</Kbd>
                  ))}
                </span>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel>
          <SectionHeader icon={Info} title="Sobre o LIBERDADE" description="Central de vida, renda e produtividade" />
          <div className="mt-4 space-y-3 text-[12.5px] text-muted">
            <p>
              Um único lugar para projetos, leads, estudos, treinos, finanças, metas e deliveries.
              Construído para quem precisa manter várias frentes de renda organizadas sem perder o
              foco.
            </p>
            <div className="flex flex-wrap gap-2">
              {["React 18", "TypeScript", "Vite", "Tailwind 4", "Framer Motion", "Recharts", "dnd-kit"].map(
                (tech) => (
                  <Badge key={tech} className="px-2.5 py-1">
                    {tech}
                  </Badge>
                ),
              )}
            </div>
            <div className="rounded-2xl border border-positive/25 bg-positive/10 p-3.5">
              <p className="flex items-center gap-2 text-[12px] text-positive">
                <BadgeCheck className="h-4 w-4" />
                Persistência local ativa — seus dados não saem deste navegador.
              </p>
            </div>
          </div>
        </Panel>
      </div>

      <ConfirmDialog
        open={confirmReset !== null}
        title={confirmReset === "demo" ? "Recarregar dados de demonstração" : "Esvaziar workspace"}
        description={
          confirmReset === "demo"
            ? "Os dados atuais serão substituídos pelo conteúdo de exemplo."
            : "Tarefas, leads, pedidos e lançamentos serão apagados."
        }
        confirmLabel={confirmReset === "demo" ? "Recarregar demo" : "Esvaziar"}
        onCancel={() => setConfirmReset(null)}
        onConfirm={() => {
          if (confirmReset === "demo") {
            resetDemo();
            notify({ title: "Dados de demonstração carregados", tone: "success" });
          } else {
            startEmpty();
            notify({ title: "Workspace vazio", description: "Comece cadastrando suas metas e tarefas." });
          }
        }}
      />
    </div>
  );
}
