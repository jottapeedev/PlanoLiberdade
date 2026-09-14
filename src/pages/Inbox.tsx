import { useMemo, useState } from "react";
import {
  Archive,
  Check,
  CheckCircle2,
  Filter,
  Inbox as InboxIcon,
  Lightbulb,
  Link2,
  ListTodo,
  StickyNote,
  Plus,
  Sparkles,
  Trash2,
  Zap,
} from "lucide-react";
import {
  Badge,
  Button,
  ConfirmDialog,
  EmptyState,
  Field,
  PageHeader,
  Panel,
  SegmentedControl,
  Select,
  Tabs,
  Textarea,
} from "../components/ui";
import { useApp } from "../lib/store";
import { cn, groupBy, relative, today, uniq } from "../lib/utils";
import type { InboxItem, InboxKind } from "../lib/types";

const KIND_META: Record<InboxKind, { label: string; icon: typeof Lightbulb; color: string }> = {
  ideia: { label: "Ideia", icon: Lightbulb, color: "var(--accent)" },
  tarefa: { label: "Tarefa", icon: Check, color: "var(--info)" },
  nota: { label: "Nota", icon: StickyNote, color: "var(--warning)" },
  link: { label: "Link", icon: Link2, color: "var(--accent-2)" },
};

type Filter = "pendentes" | "processados" | "todos";

export default function InboxPage() {
  const { data, add, update, remove, notify } = useApp();
  const [text, setText] = useState("");
  const [kind, setKind] = useState<InboxKind>("ideia");
  const [tags, setTags] = useState("");
  const [filter, setFilter] = useState<Filter>("pendentes");
  const [kindFilter, setKindFilter] = useState<InboxKind | "todos">("todos");
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const items = useMemo(() => {
    return [...data.inbox]
      .filter((item) =>
        filter === "todos" ? true : filter === "pendentes" ? !item.processed : item.processed,
      )
      .filter((item) => (kindFilter === "todos" ? true : item.kind === kindFilter))
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  }, [data.inbox, filter, kindFilter]);

  const grouped = useMemo(() => {
    const keys = groupBy(items, (item) => {
      const diff = Math.floor(
        (Date.now() - new Date(item.createdAt).getTime()) / 86400000,
      );
      if (diff <= 0) return "Hoje";
      if (diff === 1) return "Ontem";
      if (diff <= 7) return "Nesta semana";
      return "Anteriores";
    });
    return ["Hoje", "Ontem", "Nesta semana", "Anteriores"]
      .filter((key) => keys[key]?.length)
      .map((key) => ({ key, items: keys[key] }));
  }, [items]);

  const allTags = useMemo(() => uniq(data.inbox.flatMap((item) => item.tags)), [data.inbox]);
  const pending = data.inbox.filter((item) => !item.processed);
  const stats = (Object.keys(KIND_META) as InboxKind[]).map((key) => ({
    key,
    ...KIND_META[key],
    count: pending.filter((item) => item.kind === key).length,
  }));

  const capture = () => {
    const value = text.trim();
    if (!value) return;
    add("inbox", {
      id: `inbox_${Date.now().toString(36)}`,
      text: value,
      kind,
      tags: tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
      processed: false,
      createdAt: new Date().toISOString(),
    });
    setText("");
    setTags("");
    notify({ title: "Capturado", description: "Item adicionado à caixa de entrada.", tone: "success" });
  };

  const toTask = (item: InboxItem, forToday: boolean) => {
    add("tasks", {
      id: `task_${Date.now().toString(36)}`,
      title: item.text.slice(0, 120),
      notes: item.tags.length ? `Origem: ${item.tags.join(", ")}` : undefined,
      done: false,
      priority: forToday ? "alta" : "media",
      area: item.tags[0] ? item.tags[0] : "Geral",
      today: forToday,
      due: forToday ? today() : undefined,
      order: 0,
      tags: item.tags,
      createdAt: today(),
    });
    update("inbox", item.id, { processed: true });
    notify({
      title: forToday ? "Enviado para Meu dia" : "Tarefa criada",
      description: item.text.slice(0, 60),
      tone: "success",
    });
  };

  const archive = (item: InboxItem) => {
    update("inbox", item.id, { processed: !item.processed });
    notify({ title: item.processed ? "Reaberto na caixa" : "Arquivado" });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Captura de ideias"
        icon={InboxIcon}
        title="Caixa de entrada"
        description="Todo pensamento solto entra aqui e sai como tarefa, projeto ou arquivo. Capture primeiro, organize depois."
      >
        <Badge color="var(--accent)" dot>
          {pending.length} pendentes
        </Badge>
        <Badge>{data.inbox.length} no total</Badge>
      </PageHeader>

      <div className="grid gap-5 lg:grid-cols-[1.7fr_1fr]">
        <div className="space-y-5">
          <Panel>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="grid h-9 w-9 place-items-center rounded-xl accent-soft">
                  <Zap className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-[13.5px] font-semibold">Captura instantânea</p>
                  <p className="text-[11.5px] text-muted">
                    <kbd className="font-sans">Ctrl</kbd> + <kbd className="font-sans">Enter</kbd>{" "}
                    para salvar
                  </p>
                </div>
              </div>
              <SegmentedControl
                value={kind}
                onChange={setKind}
                options={(Object.keys(KIND_META) as InboxKind[]).map((key) => ({
                  value: key,
                  label: KIND_META[key].label,
                  icon: KIND_META[key].icon,
                }))}
              />
            </div>

            <div className="mt-4 space-y-3">
              <Textarea
                value={text}
                onChange={(event) => setText(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) capture();
                }}
                placeholder="O que passou pela sua cabeça? Escreva e siga em frente…"
              />
              <div className="flex flex-wrap items-center gap-2">
                <input
                  value={tags}
                  onChange={(event) => setTags(event.target.value)}
                  placeholder="tags: tiktok, sites, financas"
                  className="h-10 min-w-[180px] flex-1 rounded-xl border border-line bg-surface-2/70 px-3 text-[13px] outline-none focus:border-accent/60 focus:ring-4 focus:ring-accent/10"
                />
                <Button icon={Plus} onClick={capture} disabled={!text.trim()}>
                  Capturar
                </Button>
              </div>
              {allTags.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[11px] text-faint">Sugestões:</span>
                  {allTags.slice(0, 8).map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() =>
                        setTags((prev) =>
                          prev.includes(tag)
                            ? prev
                            : prev
                              ? `${prev}, ${tag}`
                              : tag,
                        )
                      }
                      className="rounded-full border border-line bg-surface-2/60 px-2.5 py-1 text-[10.5px] text-muted transition-colors hover:border-accent/40 hover:text-ink"
                    >
                      #{tag}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </Panel>

          <Panel>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <Tabs
                value={filter}
                onChange={setFilter}
                options={[
                  { value: "pendentes", label: "Pendentes", count: pending.length },
                  {
                    value: "processados",
                    label: "Arquivados",
                    count: data.inbox.length - pending.length,
                  },
                  { value: "todos", label: "Todos", count: data.inbox.length },
                ]}
              />
              <div className="flex items-center gap-2">
                <Filter className="h-3.5 w-3.5 text-faint" />
                <Select
                  value={kindFilter}
                  onChange={(event) => setKindFilter(event.target.value as InboxKind | "todos")}
                  className="h-9 w-[150px]"
                >
                  <option value="todos">Todos os tipos</option>
                  {(Object.keys(KIND_META) as InboxKind[]).map((key) => (
                    <option key={key} value={key}>
                      {KIND_META[key].label}
                    </option>
                  ))}
                </Select>
              </div>
            </div>

            <div className="mt-4 space-y-5">
              {grouped.map((group) => (
                <div key={group.key}>
                  <p className="label-xs mb-2">{group.key}</p>
                  <ul className="space-y-2">
                    {group.items.map((item) => {
                      const meta = KIND_META[item.kind];
                      const Icon = meta.icon;
                      return (
                        <li
                          key={item.id}
                          className={cn(
                            "group flex items-start gap-3 rounded-2xl border border-line bg-surface-2/40 p-3.5 transition-colors hover:border-accent/40",
                            item.processed && "opacity-60",
                          )}
                        >
                          <span
                            className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-xl border"
                            style={{
                              background: `color-mix(in oklab, ${meta.color} 14%, transparent)`,
                              borderColor: `color-mix(in oklab, ${meta.color} 28%, transparent)`,
                              color: meta.color,
                            }}
                          >
                            <Icon className="h-3.5 w-3.5" />
                          </span>
                          <div className="min-w-0 flex-1">
                            <p
                              className={cn(
                                "text-[13px] leading-snug",
                                item.processed && "line-through",
                              )}
                            >
                              {item.text}
                            </p>
                            <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[10.5px] text-faint">
                              <span>{meta.label}</span>
                              <span>·</span>
                              <span>{relative(item.createdAt)}</span>
                              {item.tags.map((tag) => (
                                <Badge key={tag} className="px-2 py-0.5 text-[10px]">
                                  #{tag}
                                </Badge>
                              ))}
                            </div>
                          </div>
                          <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100 max-sm:opacity-100">
                            <Button
                              size="xs"
                              variant="subtle"
                              icon={ListTodo}
                              onClick={() => toTask(item, true)}
                              title="Enviar para Meu dia"
                            >
                              Hoje
                            </Button>
                            <Button
                              size="xs"
                              variant="ghost"
                              icon={CheckCircle2}
                              onClick={() => toTask(item, false)}
                              title="Criar tarefa"
                            />
                            <Button
                              size="xs"
                              variant="ghost"
                              icon={Archive}
                              onClick={() => archive(item)}
                              title={item.processed ? "Reabrir" : "Arquivar"}
                            />
                            <Button
                              size="xs"
                              variant="ghost"
                              icon={Trash2}
                              onClick={() => setConfirmId(item.id)}
                              title="Excluir"
                              className="text-danger"
                            />
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
              {items.length === 0 && (
                <EmptyState
                  icon={Sparkles}
                  title={filter === "pendentes" ? "Caixa zerada!" : "Nada por aqui"}
                  description="Sua mente está livre de pendências soltas. Continue capturando o que surgir."
                />
              )}
            </div>
          </Panel>
        </div>

        <div className="space-y-5">
          <Panel>
            <p className="label-xs mb-3">Composição da caixa</p>
            <div className="space-y-3">
              {stats.map((stat) => (
                <div key={stat.key} className="flex items-center gap-3">
                  <span
                    className="grid h-8 w-8 place-items-center rounded-xl border"
                    style={{
                      background: `color-mix(in oklab, ${stat.color} 14%, transparent)`,
                      borderColor: `color-mix(in oklab, ${stat.color} 28%, transparent)`,
                      color: stat.color,
                    }}
                  >
                    <stat.icon className="h-3.5 w-3.5" />
                  </span>
                  <span className="flex-1 text-[12.5px] text-muted">{stat.label}</span>
                  <span className="num text-[13px] font-semibold">{stat.count}</span>
                </div>
              ))}
            </div>
          </Panel>

          <Panel>
            <p className="label-xs mb-2">Método de trabalho</p>
            <ol className="space-y-3 text-[12.5px] text-muted">
              {[
                "Capture tudo — sem julgar se é útil agora.",
                "Revise uma vez por dia, de cima para baixo.",
                "Transforme em tarefa, agende ou arquive.",
                "Se sobrar dúvida, adie por 7 dias, não exclua.",
              ].map((step, index) => (
                <li key={step} className="flex gap-3">
                  <span className="num grid h-6 w-6 shrink-0 place-items-center rounded-lg accent-soft text-[11px] font-bold">
                    {index + 1}
                  </span>
                  {step}
                </li>
              ))}
            </ol>
          </Panel>

          <Panel>
            <Field label="Dica">
              <p className="text-[12.5px] leading-relaxed text-muted">
                Use tags para conectar a ideia ao módulo certo (
                <span className="text-ink">tiktok</span>,{" "}
                <span className="text-ink">sites</span>,{" "}
                <span className="text-ink">financas</span>). Ao promover para tarefa, a tag vira a
                área responsável automaticamente.
              </p>
            </Field>
          </Panel>
        </div>
      </div>

      <ConfirmDialog
        open={Boolean(confirmId)}
        title="Excluir item da caixa"
        description="O item será removido definitivamente."
        confirmLabel="Excluir"
        onCancel={() => setConfirmId(null)}
        onConfirm={() => {
          if (confirmId) remove("inbox", confirmId);
          notify({ title: "Item excluído" });
        }}
      />
    </div>
  );
}
