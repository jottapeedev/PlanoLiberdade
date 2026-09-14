import { useCallback, useEffect, useMemo, useState } from "react";
import confetti from "canvas-confetti";
import {
  ArrowDown,
  ArrowUp,
  Brain,
  CheckCircle2,
  Circle,
  Coffee,
  Flame,
  ListTodo,
  Maximize2,
  StickyNote,
  Pause,
  Play,
  Plus,
  RefreshCw,
  RotateCcw,
  Sparkles,
  Timer,
  Trash2,
  Undo2,
  Zap,
} from "lucide-react";
import {
  Badge,
  Button,
  ConfirmDialog,
  EmptyState,
  Field,
  Panel,
  Progress,
  Ring,
  SectionHeader,
  SegmentedControl,
  Select,
  Textarea,
} from "../components/ui";
import { BarsGroup } from "../components/charts";
import { useApp } from "../lib/store";
import { useMetrics } from "../lib/metrics";
import {
  brl,
  cn,
  fmtDate,
  greeting,
  num,
  priorityMeta,
  sum,
  today,
} from "../lib/utils";
import type { Priority, Task } from "../lib/types";

const PRIORITIES: Priority[] = ["urgente", "alta", "media", "baixa"];

export default function MyDay() {
  const { data, settings, add, update, remove, notify, patchSettings } = useApp();
  const metrics = useMetrics();

  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState<Priority>("media");
  const [estimate, setEstimate] = useState("30");
  const [area, setArea] = useState("Geral");
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [focusMode, setFocusMode] = useState<"foco" | "pausa">("foco");
  const [running, setRunning] = useState(false);
  const [blocks, setBlocks] = useState(0);

  const areas = useMemo(
    () => Array.from(new Set(data.tasks.map((task) => task.area))).sort(),
    [data.tasks],
  );

  const dayTasks = useMemo(
    () =>
      data.tasks
        .filter((task) => task.today || task.due === today())
        .sort((a, b) => {
          if (a.done !== b.done) return a.done ? 1 : -1;
          const weight = priorityMeta(b.priority).weight - priorityMeta(a.priority).weight;
          return weight !== 0 ? weight : a.order - b.order;
        }),
    [data.tasks],
  );

  const backlog = useMemo(
    () =>
      data.tasks
        .filter((task) => !task.today && !task.done && task.due !== today())
        .sort((a, b) => {
          const weight = priorityMeta(b.priority).weight - priorityMeta(a.priority).weight;
          if (weight !== 0) return weight;
          return (a.due ?? "9999") < (b.due ?? "9999") ? -1 : 1;
        }),
    [data.tasks],
  );

  const done = dayTasks.filter((task) => task.done);
  const open = dayTasks.filter((task) => !task.done);
  const totalMinutes = sum(open.map((task) => task.estimateMin ?? 0));
  const capacity = settings.dailyFocusTarget;
  const overload = totalMinutes > capacity;

  /* ---------------------------- timer ---------------------------- */
  const totalSeconds =
    (focusMode === "foco" ? settings.focusMinutes : settings.breakMinutes) * 60;
  const [remaining, setRemaining] = useState(totalSeconds);

  useEffect(() => {
    setRemaining(totalSeconds);
  }, [totalSeconds]);

  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => {
      setRemaining((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => window.clearInterval(id);
  }, [running]);

  const complete = useCallback(() => {
    setRunning(false);
    if (focusMode === "foco") {
      const minutes = settings.focusMinutes;
      add("studySessions", {
        id: `study_${Date.now().toString(36)}`,
        minutes,
        date: today(),
      });
      setBlocks((prev) => prev + 1);
      confetti({
        particleCount: 90,
        spread: 70,
        origin: { y: 0.7 },
        colors: ["#8b5cf6", "#22d3ee"],
      });
      notify({
        title: `${minutes} minutos de foco!`,
        description: "Hora de uma pausa curta.",
        tone: "success",
      });
      setFocusMode("pausa");
    } else {
      notify({ title: "Pausa concluída", description: "Volte ao foco quando estiver pronto." });
      setFocusMode("foco");
    }
  }, [add, focusMode, notify, settings.focusMinutes]);

  useEffect(() => {
    if (running && remaining === 0) complete();
  }, [complete, remaining, running]);

  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;
  const elapsedPercent = 100 - (remaining / totalSeconds) * 100;

  /* ---------------------------- notas ---------------------------- */
  const noteKey = `liberdade.daynote.${today()}`;
  const [note, setNote] = useState(() => localStorage.getItem(noteKey) ?? "");
  useEffect(() => {
    const timer = window.setTimeout(() => localStorage.setItem(noteKey, note), 350);
    return () => window.clearTimeout(timer);
  }, [note, noteKey]);

  /* --------------------------- handlers --------------------------- */
  const createTask = () => {
    const value = title.trim();
    if (!value) return;
    add("tasks", {
      id: `task_${Date.now().toString(36)}`,
      title: value,
      done: false,
      priority,
      area,
      today: true,
      due: today(),
      order: dayTasks.length,
      estimateMin: Number(estimate) || undefined,
      tags: [],
      createdAt: today(),
    });
    setTitle("");
  };

  const toggle = (task: Task) => {
    const willComplete = !task.done;
    update("tasks", task.id, {
      done: willComplete,
      completedAt: willComplete ? today() : undefined,
    });
    if (willComplete && open.length === 1) {
      confetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.7 },
        colors: ["#8b5cf6", "#22d3ee", "#34d399"],
      });
      notify({ title: "Dia concluído! 🎉", description: "Todas as tarefas de hoje foram feitas.", tone: "success" });
    }
  };

  const move = (task: Task, direction: -1 | 1) => {
    const index = dayTasks.findIndex((entry) => entry.id === task.id);
    const swapWith = dayTasks[index + direction];
    if (!swapWith) return;
    update("tasks", task.id, { order: swapWith.order });
    update("tasks", swapWith.id, { order: task.order });
  };

  const areaSeries = useMemo(() => {
    const map = new Map<string, number>();
    dayTasks.forEach((task) => {
      map.set(task.area, (map.get(task.area) ?? 0) + (task.done ? 1 : 0.35));
    });
    return Array.from(map.entries())
      .map(([label, value]) => ({ label, valor: Number(value.toFixed(1)) }))
      .sort((a, b) => b.valor - a.valor)
      .slice(0, 6);
  }, [dayTasks]);

  return (
    <div className="space-y-6">
      {/* ---------------------------- HERO ---------------------------- */}
      <section className="panel relative overflow-hidden p-5 sm:p-7">
        <div className="pointer-events-none absolute -top-24 right-0 h-64 w-64 rounded-full accent-grad opacity-15 blur-3xl" />
        <div className="relative grid gap-6 lg:grid-cols-[1.6fr_auto] lg:items-center">
          <div>
            <Badge className="accent-soft" dot>
              <ListTodo className="h-3 w-3" /> Planejador diário
            </Badge>
            <h1 className="mt-4 font-display text-[26px] leading-tight font-extrabold tracking-tight sm:text-[34px]">
              {greeting()}. Hoje é {fmtDate(new Date(), "EEEE, d 'de' MMMM")}
            </h1>
            <p className="mt-3 max-w-xl text-[13.5px] leading-relaxed text-muted">
              {open.length === 0
                ? "Nada pendente por aqui. Aproveite para puxar algo do backlog ou descansar."
                : `${open.length} ${open.length === 1 ? "tarefa" : "tarefas"} em aberto somando ${totalMinutes}min estimados (${Math.round((totalMinutes / capacity) * 100)}% da sua capacidade de ${Math.floor(capacity / 60)}h).`}
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <Button
                size="md"
                icon={running ? Pause : Play}
                onClick={() => {
                  if (!running) setFocusMode("foco");
                  setRunning((prev) => !prev);
                }}
              >
                {running ? "Pausar timer" : "Iniciar foco"}
              </Button>
              <Button
                size="md"
                variant="secondary"
                icon={RefreshCw}
                onClick={() => {
                  setRunning(false);
                  setFocusMode("foco");
                  setRemaining(settings.focusMinutes * 60);
                }}
              >
                Reiniciar bloco
              </Button>
              <Button
                size="md"
                variant="ghost"
                icon={Sparkles}
                onClick={() => {
                  const suggestions = backlog.slice(0, 3);
                  suggestions.forEach((task) =>
                    update("tasks", task.id, { today: true, due: today() }),
                  );
                  notify({
                    title: "Prioridades sugeridas",
                    description: `${suggestions.length} tarefa(s) do backlog entraram no dia.`,
                    tone: "success",
                  });
                }}
                disabled={backlog.length === 0}
              >
                Sugerir prioridades
              </Button>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <Ring
              value={done.length}
              max={Math.max(dayTasks.length, 1)}
              size={148}
              thickness={12}
              label={
                <span className="num">
                  {done.length}
                  <span className="text-sm font-semibold text-muted">/{dayTasks.length}</span>
                </span>
              }
              sub="do dia concluído"
            />
          </div>
        </div>
      </section>

      <div className="grid gap-5 xl:grid-cols-[1.7fr_1fr]">
        <div className="space-y-5">
          {/* ------------------------- prioridades ------------------------- */}
          <Panel>
            <SectionHeader
              icon={Zap}
              title="Prioridades do dia"
              description={`${done.length} concluídas · ${open.length} em aberto`}
              action={
                <Badge color={overload ? "var(--warning)" : "var(--positive)"} dot>
                  {overload ? "Dia sobrecarregado" : "Carga saudável"}
                </Badge>
              }
            />
            <Progress value={done.length} max={Math.max(dayTasks.length, 1)} className="mt-4" height={7} />

            <div className="mt-4 grid gap-2 sm:grid-cols-[1.6fr_auto_auto_auto]">
              <input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                onKeyDown={(event) => event.key === "Enter" && createTask()}
                placeholder="Adicionar tarefa para hoje…"
                className="h-10 rounded-xl border border-line bg-surface-2/70 px-3 text-[13.5px] outline-none focus:border-accent/60 focus:ring-4 focus:ring-accent/10"
              />
              <Select
                value={priority}
                onChange={(event) => setPriority(event.target.value as Priority)}
                className="sm:w-[130px]"
              >
                {PRIORITIES.map((item) => (
                  <option key={item} value={item}>
                    {priorityMeta(item).label}
                  </option>
                ))}
              </Select>
              <Select
                value={area}
                onChange={(event) => setArea(event.target.value)}
                className="sm:w-[140px]"
              >
                {["Geral", ...areas].map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </Select>
              <div className="flex gap-2">
                <input
                  value={estimate}
                  onChange={(event) => setEstimate(event.target.value.replace(/\D/g, "").slice(0, 4))}
                  placeholder="min"
                  className="h-10 w-[76px] rounded-xl border border-line bg-surface-2/70 px-3 text-[13.5px] outline-none focus:border-accent/60"
                />
                <Button icon={Plus} onClick={createTask} disabled={!title.trim()}>
                  Add
                </Button>
              </div>
            </div>

            <ul className="mt-4 space-y-2">
              {open.map((task, index) => {
                const meta = priorityMeta(task.priority);
                return (
                  <li
                    key={task.id}
                    className="group flex items-center gap-3 rounded-2xl border border-line bg-surface-2/40 px-3.5 py-3 transition-colors hover:border-accent/40"
                  >
                    <button type="button" onClick={() => toggle(task)} className="shrink-0">
                      <Circle className="h-[18px] w-[18px] text-faint transition-colors hover:text-accent" />
                    </button>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13.5px] font-medium">{task.title}</p>
                      <p className="mt-0.5 flex items-center gap-2 text-[11px] text-faint">
                        <span>{task.area}</span>
                        {task.estimateMin ? <span>· {task.estimateMin}min</span> : null}
                        {task.due && task.due !== today() ? (
                          <span>· vence {fmtDate(task.due)}</span>
                        ) : null}
                      </p>
                    </div>
                    <Badge color={meta.color}>{meta.label}</Badge>
                    <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100 max-sm:opacity-100">
                      <Button
                        size="xs"
                        variant="ghost"
                        icon={ArrowUp}
                        onClick={() => move(task, -1)}
                        disabled={index === 0}
                        title="Subir"
                      />
                      <Button
                        size="xs"
                        variant="ghost"
                        icon={ArrowDown}
                        onClick={() => move(task, 1)}
                        disabled={index === open.length - 1}
                        title="Descer"
                      />
                      <Button
                        size="xs"
                        variant="ghost"
                        icon={Undo2}
                        onClick={() => update("tasks", task.id, { today: false, due: undefined })}
                        title="Devolver ao backlog"
                      />
                      <Button
                        size="xs"
                        variant="ghost"
                        icon={Trash2}
                        onClick={() => setConfirmId(task.id)}
                        className="text-danger"
                        title="Excluir"
                      />
                    </div>
                  </li>
                );
              })}
              {open.length === 0 && (
                <EmptyState
                  icon={CheckCircle2}
                  title="Tudo concluído!"
                  description="Você fechou o dia de trabalho. Registre aprendizados nas notas e descanse."
                />
              )}
            </ul>

            {done.length > 0 && (
              <details className="mt-4 rounded-2xl border border-line bg-surface-2/30 p-3.5">
                <summary className="cursor-pointer text-[12.5px] font-semibold text-muted">
                  Concluídas hoje ({done.length})
                </summary>
                <ul className="mt-3 space-y-2">
                  {done.map((task) => (
                    <li key={task.id} className="flex items-center gap-3 px-1">
                      <button type="button" onClick={() => toggle(task)}>
                        <CheckCircle2 className="h-[18px] w-[18px] text-positive" />
                      </button>
                      <span className="min-w-0 flex-1 truncate text-[12.5px] text-muted line-through">
                        {task.title}
                      </span>
                      <span className="text-[10.5px] text-faint">{task.area}</span>
                    </li>
                  ))}
                </ul>
              </details>
            )}
          </Panel>

          {/* --------------------------- backlog --------------------------- */}
          <Panel>
            <SectionHeader
              icon={ListTodo}
              title="Backlog"
              description="Tarefas fora do dia, prontas para serem puxadas"
              action={<Badge>{backlog.length} itens</Badge>}
            />
            <ul className="mt-4 grid gap-2 sm:grid-cols-2">
              {backlog.slice(0, 10).map((task) => {
                const meta = priorityMeta(task.priority);
                return (
                  <li
                    key={task.id}
                    className="flex items-start justify-between gap-3 rounded-2xl border border-line bg-surface-2/40 p-3.5 transition-colors hover:border-accent/40"
                  >
                    <div className="min-w-0">
                      <p className="text-[13px] font-medium">{task.title}</p>
                      <p className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-faint">
                        <span>{task.area}</span>
                        <Badge color={meta.color} className="px-2 py-0.5 text-[10px]">
                          {meta.label}
                        </Badge>
                        {task.due && <span>vence {fmtDate(task.due)}</span>}
                      </p>
                    </div>
                    <Button
                      size="xs"
                      variant="subtle"
                      icon={Plus}
                      onClick={() =>
                        update("tasks", task.id, { today: true, due: today(), order: 0 })
                      }
                      className="shrink-0"
                    >
                      Hoje
                    </Button>
                  </li>
                );
              })}
              {backlog.length === 0 && (
                <li className="sm:col-span-2">
                  <EmptyState
                    icon={Sparkles}
                    title="Backlog vazio"
                    description="Capture novas tarefas pela caixa de entrada ou pelo botão de captura rápida."
                  />
                </li>
              )}
            </ul>
          </Panel>

          <Panel>
            <SectionHeader icon={Brain} title="Carga por área" description="Tarefas de hoje por frente" />
            <div className="mt-4">
              <BarsGroup
                data={areaSeries}
                series={[{ key: "valor", label: "Tarefas", color: "var(--accent)" }]}
                height={200}
              />
            </div>
          </Panel>
        </div>

        {/* ---------------------------- lateral ---------------------------- */}
        <div className="space-y-5">
          <Panel className="relative overflow-hidden">
            <div className="pointer-events-none absolute -top-20 -right-16 h-56 w-56 rounded-full accent-grad opacity-15 blur-3xl" />
            <div className="relative flex flex-col items-center">
              <div className="flex w-full items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="grid h-9 w-9 place-items-center rounded-xl accent-soft">
                    {focusMode === "foco" ? (
                      <Timer className="h-4 w-4" />
                    ) : (
                      <Coffee className="h-4 w-4" />
                    )}
                  </span>
                  <div>
                    <p className="text-[13.5px] font-semibold">
                      {focusMode === "foco" ? "Modo foco" : "Pausa"}
                    </p>
                    <p className="text-[11px] text-faint">
                      {blocks} bloco(s) concluído(s) hoje
                    </p>
                  </div>
                </div>
                <SegmentedControl
                  value={focusMode}
                  onChange={(value) => {
                    setFocusMode(value);
                    setRunning(false);
                  }}
                  options={[
                    { value: "foco", label: "Foco" },
                    { value: "pausa", label: "Pausa" },
                  ]}
                />
              </div>

              <div className="mt-6">
                <Ring
                  value={elapsedPercent}
                  size={210}
                  thickness={14}
                  color={focusMode === "foco" ? "var(--accent)" : "var(--accent-2)"}
                  label={
                    <span className="num text-3xl">
                      {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
                    </span>
                  }
                  sub={focusMode === "foco" ? "tempo restante" : "descanso"}
                />
              </div>

              <div className="mt-6 flex w-full items-center gap-2">
                <Button
                  size="lg"
                  className="flex-1"
                  icon={running ? Pause : Play}
                  onClick={() => setRunning((prev) => !prev)}
                >
                  {running ? "Pausar" : remaining === totalSeconds ? "Iniciar" : "Continuar"}
                </Button>
                <Button
                  size="lg"
                  variant="secondary"
                  icon={RotateCcw}
                  onClick={() => {
                    setRunning(false);
                    setRemaining(totalSeconds);
                  }}
                  title="Zerar"
                />
                <Button
                  size="lg"
                  variant="secondary"
                  icon={Maximize2}
                  onClick={() => {
                    document.documentElement.requestFullscreen?.().catch(() => undefined);
                    setRunning(true);
                    setFocusMode("foco");
                    notify({ title: "Modo foco", description: "Tela cheia ativada. Foco total!" });
                  }}
                  title="Foco total"
                />
              </div>

              <div className="mt-5 grid w-full grid-cols-2 gap-3">
                <Field label="Bloco de foco (min)">
                  <input
                    type="number"
                    min={5}
                    max={180}
                    value={settings.focusMinutes}
                    onChange={(event) =>
                      patchSettings({ focusMinutes: Number(event.target.value) || 25 })
                    }
                    className="h-10 w-full rounded-xl border border-line bg-surface-2/70 px-3 text-[13.5px] outline-none focus:border-accent/60"
                  />
                </Field>
                <Field label="Pausa (min)">
                  <input
                    type="number"
                    min={1}
                    max={60}
                    value={settings.breakMinutes}
                    onChange={(event) =>
                      patchSettings({ breakMinutes: Number(event.target.value) || 5 })
                    }
                    className="h-10 w-full rounded-xl border border-line bg-surface-2/70 px-3 text-[13.5px] outline-none focus:border-accent/60"
                  />
                </Field>
              </div>
            </div>
          </Panel>

          <Panel>
            <SectionHeader icon={StickyNote} title="Notas do dia" description="Registro livre, salvo automaticamente" />
            <Textarea
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="O que funcionou hoje? O que travou? Próximos passos…"
              className="mt-4 min-h-[160px]"
            />
          </Panel>

          <Panel>
            <SectionHeader icon={Flame} title="Resumo de hoje" description="Indicadores que alimentam o score" />
            <div className="mt-4 space-y-3">
              {[
                { label: "Tarefas concluídas", value: `${done.length}/${dayTasks.length}` },
                { label: "Tempo em foco", value: `${metrics.studies.todayMinutes}min` },
                { label: "Hábitos cumpridos", value: `${metrics.habits.todayDone}/${metrics.habits.total}` },
                { label: "Blocos de foco", value: num(blocks) },
                {
                  label: "Receita do mês",
                  value: brl(metrics.finance.income),
                },
              ].map((item) => (
                <div
                  key={item.label}
                  className="flex items-center justify-between rounded-xl border border-line bg-surface-2/40 px-3.5 py-2.5"
                >
                  <span className="text-[12.5px] text-muted">{item.label}</span>
                  <span className="num text-[13px] font-semibold">{item.value}</span>
                </div>
              ))}
            </div>
          </Panel>

          <Panel>
            <SectionHeader icon={Sparkles} title="Sequência de rotina" description="Consistência dos últimos dias" />
            <div className="mt-4 flex items-center gap-4">
              <span className="num font-display text-4xl font-extrabold accent-text">
                {metrics.habits.currentStreak}
              </span>
              <p className="text-[12.5px] leading-relaxed text-muted">
                dias consecutivos cumprindo pelo menos metade dos hábitos.
                {metrics.habits.bestStreak > metrics.habits.currentStreak &&
                  ` Seu recorde é ${metrics.habits.bestStreak} dias.`}
              </p>
            </div>
            <div className="mt-4 grid grid-cols-7 gap-1.5">
              {metrics.habits.byDay.slice(-14).map((day) => (
                <span
                  key={day.key}
                  title={day.label}
                  className={cn(
                    "aspect-square rounded-lg border border-line",
                    day.value === 0 ? "bg-surface-3" : "accent-grad",
                  )}
                  style={{ opacity: day.value === 0 ? 1 : 0.4 + (day.value / Math.max(metrics.habits.total, 1)) * 0.6 }}
                />
              ))}
            </div>
          </Panel>
        </div>
      </div>

      <ConfirmDialog
        open={Boolean(confirmId)}
        title="Excluir tarefa"
        description="A tarefa será removida da sua lista."
        confirmLabel="Excluir"
        onCancel={() => setConfirmId(null)}
        onConfirm={() => {
          if (confirmId) remove("tasks", confirmId);
          notify({ title: "Tarefa excluída" });
        }}
      />
    </div>
  );
}
