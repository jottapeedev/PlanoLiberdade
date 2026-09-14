import { useMemo, useState } from "react";
import confetti from "canvas-confetti";
import {
  Check,
  CheckCircle2,
  Flag,
  Pause,
  Pencil,
  Play,
  Plus,
  Sparkles,
  Target,
  Trash2,
  TrendingUp,
  Trophy,
} from "lucide-react";
import {
  Badge,
  Button,
  ConfirmDialog,
  EmptyState,
  Field,
  Input,
  Modal,
  PageHeader,
  Panel,
  Progress,
  Ring,
  SectionHeader,
  SegmentedControl,
  Select,
  StatCard,
} from "../components/ui";
import { useApp } from "../lib/store";
import { addDaysISO, cn, daysLeft, fmtDate, num, sum, today } from "../lib/utils";
import type { Goal } from "../lib/types";

const AREAS = ["Finanças", "Sites", "TikTok", "Estudos", "Saúde", "Pessoal", "Delivery"];
const UNITS = ["R$", "clientes", "vídeos", "h", "km", "un", "pedidos", "%"];

const emptyGoal = (): Goal => ({
  id: `goal_${Date.now().toString(36)}`,
  title: "",
  area: "Finanças",
  unit: "R$",
  target: 1000,
  current: 0,
  deadline: addDaysISO(today(), 60),
  status: "ativa",
  milestones: [],
});

export default function Goals() {
  const { data, add, update, remove, notify } = useApp();
  const [filter, setFilter] = useState<"ativa" | "concluida" | "pausada" | "todas">("ativa");
  const [areaFilter, setAreaFilter] = useState("todas");
  const [editing, setEditing] = useState<Goal | null>(null);
  const [milestoneDraft, setMilestoneDraft] = useState("");
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const goals = useMemo(
    () =>
      [...data.goals]
        .filter((goal) => (filter === "todas" ? true : goal.status === filter))
        .filter((goal) => (areaFilter === "todas" ? true : goal.area === areaFilter))
        .sort((a, b) => {
          const percentA = a.target ? a.current / a.target : 0;
          const percentB = b.target ? b.current / b.target : 0;
          return percentB - percentA;
        }),
    [areaFilter, data.goals, filter],
  );

  const stats = useMemo(() => {
    const active = data.goals.filter((goal) => goal.status === "ativa");
    const average = active.length
      ? sum(active.map((goal) => (goal.target ? (goal.current / goal.target) * 100 : 0))) /
        active.length
      : 0;
    const upcoming = [...active]
      .filter((goal) => goal.deadline)
      .sort((a, b) => ((a.deadline ?? "") < (b.deadline ?? "") ? -1 : 1))[0];
    const financeGoal = data.goals.find((goal) => goal.unit === "R$" && goal.status === "ativa");
    return {
      active: active.length,
      completed: data.goals.filter((goal) => goal.status === "concluida").length,
      average,
      upcoming,
      financeProgress: financeGoal?.target
        ? (financeGoal.current / financeGoal.target) * 100
        : 0,
    };
  }, [data.goals]);

  const saveGoal = () => {
    if (!editing) return;
    if (!editing.title.trim()) {
      notify({ title: "Informe o título da meta", tone: "error" });
      return;
    }
    if (data.goals.some((goal) => goal.id === editing.id)) {
      update("goals", editing.id, editing);
      notify({ title: "Meta atualizada", tone: "success" });
    } else {
      add("goals", editing);
      notify({ title: "Meta criada", tone: "success" });
    }
    setEditing(null);
  };

  const toggleMilestone = (goal: Goal, milestoneId: string) => {
    const milestones = goal.milestones.map((milestone) =>
      milestone.id === milestoneId ? { ...milestone, done: !milestone.done } : milestone,
    );
    const doneCount = milestones.filter((milestone) => milestone.done).length;
    const nextCurrent =
      goal.milestones.length > 0 && goal.unit !== "R$"
        ? Math.max(goal.current, (doneCount / milestones.length) * goal.target)
        : goal.current;
    const completed = doneCount === milestones.length && milestones.length > 0;
    update("goals", goal.id, {
      milestones,
      current: nextCurrent,
      status: completed ? "concluida" : goal.status,
    });
    if (completed) {
      confetti({ particleCount: 120, spread: 75, origin: { y: 0.7 } });
      notify({ title: "Meta concluída! 🏆", description: goal.title, tone: "success" });
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Direção e propósito"
        icon={Target}
        title="Metas"
        description="Objetivos com prazo, marcos e progresso mensurável. Transforme intenção em plano executável."
      >
        <Button icon={Plus} onClick={() => setEditing(emptyGoal())}>
          Nova meta
        </Button>
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Metas ativas"
          value={num(stats.active)}
          icon={Target}
          hint={`${stats.completed} concluídas`}
          tone="var(--accent)"
        />
        <StatCard
          label="Progresso médio"
          value={`${stats.average.toFixed(0)}%`}
          icon={TrendingUp}
          hint="das metas em andamento"
          tone="var(--accent-2)"
        />
        <StatCard
          label="Meta financeira"
          value={`${stats.financeProgress.toFixed(0)}%`}
          icon={Trophy}
          hint="da meta de faturamento"
          tone="var(--positive)"
        />
        <StatCard
          label="Prazo mais próximo"
          value={
            stats.upcoming?.deadline
              ? `${num(Math.max(daysLeft(stats.upcoming.deadline) ?? 0, 0))} dias`
              : "—"
          }
          icon={Flag}
          hint={stats.upcoming?.title ?? "nenhuma meta com prazo"}
          tone="var(--warning)"
        />
      </div>

      <Panel>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <SectionHeader
            icon={Sparkles}
            title="Painel de metas"
            description={`${goals.length} ${goals.length === 1 ? "meta" : "metas"} neste filtro`}
          />
          <div className="flex flex-wrap items-center gap-2">
            <Select
              value={areaFilter}
              onChange={(event) => setAreaFilter(event.target.value)}
              className="w-[150px]"
            >
              <option value="todas">Todas as áreas</option>
              {AREAS.map((area) => (
                <option key={area} value={area}>
                  {area}
                </option>
              ))}
            </Select>
            <SegmentedControl
              value={filter}
              onChange={setFilter}
              options={[
                { value: "ativa", label: "Ativas" },
                { value: "concluida", label: "Concluídas" },
                { value: "pausada", label: "Pausadas" },
                { value: "todas", label: "Todas" },
              ]}
            />
          </div>
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          {goals.map((goal) => {
            const percent = goal.target ? (goal.current / goal.target) * 100 : 0;
            const left = daysLeft(goal.deadline);
            const doneMilestones = goal.milestones.filter((milestone) => milestone.done).length;
            const overdue = left !== null && left < 0 && goal.status === "ativa";
            return (
              <div
                key={goal.id}
                className={cn(
                  "group flex gap-4 rounded-2xl border bg-surface-2/40 p-4 transition-colors hover:border-accent/40",
                  overdue ? "border-danger/40" : "border-line",
                )}
              >
                <Ring
                  value={percent}
                  size={96}
                  thickness={8}
                  color={goal.status === "concluida" ? "var(--positive)" : "var(--accent)"}
                  label={<span className="text-[13px] font-bold">{percent.toFixed(0)}%</span>}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-[13.5px] leading-tight font-semibold">{goal.title}</p>
                      <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                        <Badge className="px-2 py-0.5 text-[10px]">{goal.area}</Badge>
                        <Badge
                          color={
                            goal.status === "concluida"
                              ? "var(--positive)"
                              : goal.status === "pausada"
                                ? "var(--warning)"
                                : "var(--accent)"
                          }
                          className="px-2 py-0.5 text-[10px]"
                        >
                          {goal.status}
                        </Badge>
                        {goal.deadline && (
                          <Badge
                            color={overdue ? "var(--danger)" : left !== null && left <= 7 ? "var(--warning)" : undefined}
                            className="px-2 py-0.5 text-[10px]"
                          >
                            {overdue
                              ? `${Math.abs(left ?? 0)} dias em atraso`
                              : `${left} dias · ${fmtDate(goal.deadline)}`}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100 max-sm:opacity-100">
                      <Button
                        size="xs"
                        variant="ghost"
                        icon={goal.status === "pausada" ? Play : Pause}
                        onClick={() =>
                          update("goals", goal.id, {
                            status: goal.status === "pausada" ? "ativa" : "pausada",
                          })
                        }
                        title={goal.status === "pausada" ? "Retomar" : "Pausar"}
                      />
                      <Button size="xs" variant="ghost" icon={Pencil} onClick={() => setEditing(goal)} />
                      <Button
                        size="xs"
                        variant="ghost"
                        icon={Trash2}
                        className="text-danger"
                        onClick={() => setConfirmId(goal.id)}
                      />
                    </div>
                  </div>

                  <div className="mt-3">
                    <div className="flex items-center justify-between text-[11.5px] text-muted">
                      <span className="num">
                        {goal.unit === "R$" ? `R$ ${num(goal.current)}` : `${num(goal.current)} ${goal.unit}`}{" "}
                        de{" "}
                        {goal.unit === "R$" ? `R$ ${num(goal.target)}` : `${num(goal.target)} ${goal.unit}`}
                      </span>
                      {goal.milestones.length > 0 && (
                        <span className="num">
                          {doneMilestones}/{goal.milestones.length} marcos
                        </span>
                      )}
                    </div>
                    <Progress
                      value={percent}
                      height={7}
                      className="mt-2"
                      color={goal.status === "concluida" ? "var(--positive)" : "var(--accent)"}
                    />
                  </div>

                  {goal.milestones.length > 0 && (
                    <ul className="mt-3 space-y-1">
                      {goal.milestones.map((milestone) => (
                        <li key={milestone.id}>
                          <button
                            type="button"
                            onClick={() => toggleMilestone(goal, milestone.id)}
                            className="flex w-full items-center gap-2.5 rounded-lg px-1.5 py-1.5 text-left transition-colors hover:bg-surface-2/70"
                          >
                            <span
                              className={cn(
                                "grid h-4 w-4 shrink-0 place-items-center rounded-md border transition-colors",
                                milestone.done
                                  ? "border-transparent bg-positive text-white"
                                  : "border-line-strong",
                              )}
                            >
                              {milestone.done && <Check className="h-3 w-3" />}
                            </span>
                            <span
                              className={cn(
                                "text-[12px]",
                                milestone.done ? "text-faint line-through" : "text-muted",
                              )}
                            >
                              {milestone.title}
                            </span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {goals.length === 0 && (
          <EmptyState
            className="mt-5"
            icon={Target}
            title="Nenhuma meta neste filtro"
            description="Metas dão direção às tarefas do dia. Comece com 3 objetivos de 30 dias."
            action={<Button icon={Plus} onClick={() => setEditing(emptyGoal())}>Criar meta</Button>}
          />
        )}
      </Panel>

      <Modal
        open={Boolean(editing)}
        onClose={() => setEditing(null)}
        title={data.goals.some((goal) => goal.id === editing?.id) ? "Editar meta" : "Nova meta"}
        size="lg"
        footer={
          <>
            <Button variant="ghost" onClick={() => setEditing(null)}>
              Cancelar
            </Button>
            <Button onClick={saveGoal}>Salvar meta</Button>
          </>
        }
      >
        {editing && (
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Título da meta" className="sm:col-span-2">
              <Input
                value={editing.title}
                onChange={(event) => setEditing({ ...editing, title: event.target.value })}
                placeholder="Ex: Faturar R$ 12.000 por mês"
              />
            </Field>
            <Field label="Área">
              <Select
                value={editing.area}
                onChange={(event) => setEditing({ ...editing, area: event.target.value })}
              >
                {AREAS.map((area) => (
                  <option key={area} value={area}>
                    {area}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Unidade de medida">
              <Select
                value={editing.unit}
                onChange={(event) => setEditing({ ...editing, unit: event.target.value })}
              >
                {UNITS.map((unit) => (
                  <option key={unit} value={unit}>
                    {unit}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Valor atual">
              <Input
                type="number"
                value={editing.current}
                onChange={(event) => setEditing({ ...editing, current: Number(event.target.value) })}
              />
            </Field>
            <Field label="Valor alvo">
              <Input
                type="number"
                value={editing.target}
                onChange={(event) => setEditing({ ...editing, target: Number(event.target.value) })}
              />
            </Field>
            <Field label="Prazo">
              <Input
                type="date"
                value={editing.deadline ?? ""}
                onChange={(event) => setEditing({ ...editing, deadline: event.target.value })}
              />
            </Field>
            <Field label="Status">
              <Select
                value={editing.status}
                onChange={(event) =>
                  setEditing({ ...editing, status: event.target.value as Goal["status"] })
                }
              >
                <option value="ativa">Ativa</option>
                <option value="pausada">Pausada</option>
                <option value="concluida">Concluída</option>
              </Select>
            </Field>

            <div className="sm:col-span-2">
              <span className="label-xs mb-2 block">Marcos da meta</span>
              <ul className="space-y-2">
                {editing.milestones.map((milestone) => (
                  <li key={milestone.id} className="flex items-center gap-2">
                    <Input
                      value={milestone.title}
                      onChange={(event) =>
                        setEditing({
                          ...editing,
                          milestones: editing.milestones.map((item) =>
                            item.id === milestone.id ? { ...item, title: event.target.value } : item,
                          ),
                        })
                      }
                    />
                    <Button
                      size="icon"
                      variant="ghost"
                      className="text-danger"
                      onClick={() =>
                        setEditing({
                          ...editing,
                          milestones: editing.milestones.filter((item) => item.id !== milestone.id),
                        })
                      }
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </li>
                ))}
              </ul>
              <div className="mt-2 flex items-center gap-2">
                <Input
                  value={milestoneDraft}
                  onChange={(event) => setMilestoneDraft(event.target.value)}
                  placeholder="Adicionar marco intermediário…"
                />
                <Button
                  variant="secondary"
                  icon={Plus}
                  onClick={() => {
                    if (!milestoneDraft.trim()) return;
                    setEditing({
                      ...editing,
                      milestones: [
                        ...editing.milestones,
                        { id: `m_${Date.now().toString(36)}`, title: milestoneDraft.trim(), done: false },
                      ],
                    });
                    setMilestoneDraft("");
                  }}
                >
                  Add
                </Button>
              </div>
            </div>

            <div className="sm:col-span-2 flex flex-wrap items-center gap-3 rounded-2xl border border-line bg-surface-2/40 p-3.5 text-[12px] text-muted">
              <CheckCircle2 className="h-4 w-4 text-positive" />
              Progresso calculado:{" "}
              <span className="num font-semibold text-ink">
                {editing.target ? ((editing.current / editing.target) * 100).toFixed(0) : 0}%
              </span>
              {editing.deadline && (
                <>
                  · prazo em{" "}
                  <span className="num font-semibold text-ink">{daysLeft(editing.deadline)} dias</span>
                </>
              )}
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={Boolean(confirmId)}
        title="Excluir meta"
        description="A meta e seus marcos serão removidos."
        confirmLabel="Excluir"
        onCancel={() => setConfirmId(null)}
        onConfirm={() => {
          if (confirmId) remove("goals", confirmId);
          notify({ title: "Meta excluída" });
        }}
      />
    </div>
  );
}
