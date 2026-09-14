import { useMemo, useState } from "react";
import {
  CalendarCheck,
  Check,
  Flame,
  Pencil,
  Plus,
  Sparkles,
  Target,
  Trash2,
  TrendingUp,
} from "lucide-react";
import {
  Badge,
  Button,
  ConfirmDialog,
  EmptyState,
  Field,
  HeatGrid,
  Input,
  Modal,
  PageHeader,
  Panel,
  Progress,
  Ring,
  SectionHeader,
  Select,
  StatCard,
} from "../components/ui";
import { BarsGroup } from "../components/charts";
import { useApp } from "../lib/store";
import { useMetrics } from "../lib/metrics";
import { addDaysISO, cn, fmtDate, lastNDays, num, today, weekdayShort } from "../lib/utils";
import type { Habit } from "../lib/types";

const EMOJIS = ["🔥", "💧", "📚", "🏋️", "🧘", "🌅", "🥗", "😴", "🚶", "✍️", "🧠", "🌙"];
const COLORS = ["#8b5cf6", "#22d3ee", "#34d399", "#fbbf24", "#f43f5e", "#60a5fa"];

const emptyHabit = (): Habit => ({
  id: `habit_${Date.now().toString(36)}`,
  name: "",
  emoji: "🔥",
  color: COLORS[0],
  targetPerWeek: 5,
  logs: [],
});

export default function Habits() {
  const { data, add, update, remove, notify } = useApp();
  const metrics = useMetrics();
  const [editing, setEditing] = useState<Habit | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const week = lastNDays(7);

  const perHabit = useMemo(
    () =>
      data.habits.map((habit) => {
        const last28 = lastNDays(28);
        const hits = habit.logs.filter((log) => last28.includes(log)).length;
        let streak = 0;
        const cursor = new Date();
        for (let i = 0; i < 200; i++) {
          const key = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, "0")}-${String(cursor.getDate()).padStart(2, "0")}`;
          if (habit.logs.includes(key)) streak += 1;
          else if (i > 0) break;
          cursor.setDate(cursor.getDate() - 1);
        }
        const weekHits = habit.logs.filter((log) => week.includes(log)).length;
        return {
          habit,
          rate: (hits / 28) * 100,
          streak,
          weekHits,
          done: weekHits >= habit.targetPerWeek,
        };
      }),
    [data.habits, week],
  );

  const dailySeries = useMemo(
    () =>
      metrics.habits.byDay.map((day) => ({
        label: fmtDate(day.key, "dd/MM"),
        concluidos: day.value,
      })),
    [metrics.habits.byDay],
  );

  const rateSeries = useMemo(
    () =>
      perHabit.map((item) => ({
        label:
          item.habit.name.length > 12 ? `${item.habit.name.slice(0, 12)}…` : item.habit.name,
        taxa: Number(item.rate.toFixed(0)),
      })),
    [perHabit],
  );

  const toggle = (habit: Habit, date: string) => {
    const has = habit.logs.includes(date);
    update("habits", habit.id, {
      logs: has ? habit.logs.filter((log) => log !== date) : [...habit.logs, date].sort(),
    });
  };

  const saveHabit = () => {
    if (!editing) return;
    if (!editing.name.trim()) {
      notify({ title: "Informe o nome do hábito", tone: "error" });
      return;
    }
    if (data.habits.some((habit) => habit.id === editing.id)) {
      update("habits", editing.id, editing);
      notify({ title: "Hábito atualizado", tone: "success" });
    } else {
      add("habits", editing);
      notify({ title: "Hábito criado", tone: "success" });
    }
    setEditing(null);
  };

  const todayPercent = data.habits.length
    ? (metrics.habits.todayDone / data.habits.length) * 100
    : 0;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Rotina e consistência"
        icon={CalendarCheck}
        title="Hábitos"
        description="Pequenas ações repetidas constroem a liberdade. Marque o que já fez hoje e acompanhe suas sequências."
      >
        <Button icon={Plus} onClick={() => setEditing(emptyHabit())}>
          Novo hábito
        </Button>
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Hoje"
          value={`${metrics.habits.todayDone}/${metrics.habits.total}`}
          icon={Check}
          hint="hábitos cumpridos"
          tone="var(--accent)"
        />
        <StatCard
          label="Taxa de conclusão"
          value={`${metrics.habits.completionRate.toFixed(0)}%`}
          icon={TrendingUp}
          hint="últimos 28 dias"
          tone="var(--accent-2)"
          spark={metrics.habits.byDay.map((day) => day.value)}
        />
        <StatCard
          label="Sequência atual"
          value={`${metrics.habits.currentStreak} dias`}
          icon={Flame}
          hint="metade ou mais dos hábitos"
          tone="var(--positive)"
        />
        <StatCard
          label="Melhor sequência"
          value={`${metrics.habits.bestStreak} dias`}
          icon={Target}
          hint="recorde de um hábito"
          tone="var(--warning)"
        />
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.6fr_1fr]">
        <div className="space-y-5">
          <Panel>
            <SectionHeader
              icon={Sparkles}
              title="Meus hábitos"
              description="Marque os últimos 7 dias — clique para alternar"
              action={
                <Badge color={todayPercent === 100 ? "var(--positive)" : "var(--accent)"} dot>
                  {todayPercent.toFixed(0)}% hoje
                </Badge>
              }
            />
            <ul className="mt-5 space-y-3">
              {perHabit.map(({ habit, rate, streak, weekHits, done }) => (
                <li
                  key={habit.id}
                  className="group rounded-2xl border border-line bg-surface-2/40 p-4 transition-colors hover:border-accent/40"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <span
                        className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl border text-lg"
                        style={{
                          background: `color-mix(in oklab, ${habit.color} 14%, transparent)`,
                          borderColor: `color-mix(in oklab, ${habit.color} 30%, transparent)`,
                        }}
                      >
                        {habit.emoji}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-[13.5px] font-semibold">{habit.name}</p>
                        <p className="mt-0.5 flex flex-wrap items-center gap-2 text-[11px] text-faint">
                          <span className="num">
                            meta {habit.targetPerWeek}×/semana
                          </span>
                          <span>·</span>
                          <span className="num">{rate.toFixed(0)}% em 28 dias</span>
                          <span>·</span>
                          <span className={cn("num flex items-center gap-1", streak > 0 && "text-warning")}>
                            <Flame className="h-3 w-3" /> {streak}
                          </span>
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Badge
                        color={done ? "var(--positive)" : "var(--muted)"}
                        className="px-2 py-0.5 text-[10px]"
                      >
                        {weekHits}/{habit.targetPerWeek} na semana
                      </Badge>
                      <Button size="xs" variant="ghost" icon={Pencil} onClick={() => setEditing(habit)} />
                      <Button
                        size="xs"
                        variant="ghost"
                        icon={Trash2}
                        className="text-danger"
                        onClick={() => setConfirmId(habit.id)}
                      />
                    </div>
                  </div>

                  <div className="mt-3 flex items-center gap-2">
                    {week.map((date) => {
                      const checked = habit.logs.includes(date);
                      const isToday = date === today();
                      return (
                        <button
                          key={date}
                          type="button"
                          onClick={() => toggle(habit, date)}
                          title={fmtDate(date, "EEEE dd/MM")}
                          className={cn(
                            "flex flex-1 flex-col items-center gap-1 rounded-xl border py-2 transition-all",
                            checked
                              ? "border-transparent text-white"
                              : "border-line bg-surface-2/60 text-faint hover:border-accent/40",
                            isToday && !checked && "border-accent/50",
                          )}
                          style={
                            checked
                              ? {
                                  background: `linear-gradient(135deg, ${habit.color}, color-mix(in oklab, ${habit.color} 55%, var(--accent-2)))`,
                                }
                              : undefined
                          }
                        >
                          <span className="text-[10px] font-semibold uppercase">
                            {weekdayShort(new Date(date + "T12:00:00").getDay()).slice(0, 3)}
                          </span>
                          {checked ? (
                            <Check className="h-3.5 w-3.5" />
                          ) : (
                            <span className="num text-[10.5px]">{date.slice(8, 10)}</span>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  <Progress value={rate} color={habit.color} height={5} className="mt-3" />
                </li>
              ))}
              {data.habits.length === 0 && (
                <li>
                  <EmptyState
                    icon={CalendarCheck}
                    title="Nenhum hábito cadastrado"
                    description="Comece com 3 hábitos simples: sono, movimento e leitura. Consistência vence intensidade."
                    action={<Button icon={Plus} onClick={() => setEditing(emptyHabit())}>Criar hábito</Button>}
                  />
                </li>
              )}
            </ul>
          </Panel>

          <Panel>
            <SectionHeader
              icon={CalendarCheck}
              title="Mapa de consistência"
              description="Todos os hábitos nas últimas 12 semanas"
            />
            <div className="mt-5">
              <HeatGrid
                cells={lastNDays(84).map((date) => {
                  const count = data.habits.filter((habit) => habit.logs.includes(date)).length;
                  return {
                    key: date,
                    value: count === 0 ? 0 : Math.min(4, Math.ceil((count / Math.max(data.habits.length, 1)) * 4)),
                    label: `${fmtDate(date)} · ${count}/${data.habits.length}`,
                  };
                })}
                columns={14}
                legend={["nenhum", "todos"]}
              />
            </div>
          </Panel>
        </div>

        <div className="space-y-5">
          <Panel className="flex flex-col items-center">
            <SectionHeader icon={Target} title="Progresso de hoje" className="w-full" description="Meta: fechar todos os hábitos" />
            <div className="mt-5">
              <Ring
                value={todayPercent}
                size={168}
                thickness={13}
                label={<span className="num">{todayPercent.toFixed(0)}%</span>}
                sub={`${metrics.habits.todayDone} de ${metrics.habits.total}`}
              />
            </div>
            <div className="mt-5 w-full space-y-2">
              {data.habits.map((habit) => {
                const checked = habit.logs.includes(today());
                return (
                  <button
                    key={habit.id}
                    type="button"
                    onClick={() => toggle(habit, today())}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-all",
                      checked
                        ? "border-transparent"
                        : "border-line bg-surface-2/40 hover:border-accent/40",
                    )}
                    style={
                      checked
                        ? { background: `color-mix(in oklab, ${habit.color} 16%, transparent)` }
                        : undefined
                    }
                  >
                    <span className="text-base">{habit.emoji}</span>
                    <span className="min-w-0 flex-1 truncate text-[12.5px] font-medium">
                      {habit.name}
                    </span>
                    <span
                      className={cn(
                        "grid h-5 w-5 shrink-0 place-items-center rounded-full border text-white",
                        checked ? "border-transparent" : "border-line-strong",
                      )}
                      style={checked ? { background: habit.color } : undefined}
                    >
                      {checked && <Check className="h-3 w-3" />}
                    </span>
                  </button>
                );
              })}
            </div>
          </Panel>

          <Panel>
            <SectionHeader icon={TrendingUp} title="Taxa por hábito" description="Últimos 28 dias" />
            <div className="mt-4">
              <BarsGroup
                data={rateSeries}
                series={[{ key: "taxa", label: "Taxa (%)", color: "var(--accent)", format: "percent" }]}
                height={230}
              />
            </div>
          </Panel>

          <Panel>
            <SectionHeader icon={CalendarCheck} title="Hábitos por dia" description="Quantidade cumprida nos últimos 28 dias" />
            <div className="mt-4">
              <BarsGroup
                data={dailySeries.filter((_, index) => index % 2 === 0)}
                series={[{ key: "concluidos", label: "Concluídos", color: "var(--accent-2)" }]}
                height={200}
              />
            </div>
            <p className="mt-3 text-[11.5px] text-muted">
              Sequência atual:{" "}
              <span className="num font-semibold text-ink">{metrics.habits.currentStreak} dias</span>{" "}
              · próximo marco em{" "}
              <span className="num font-semibold text-ink">
                {num(Math.max(metrics.habits.bestStreak + 1 - metrics.habits.currentStreak, 1))} dias
              </span>
            </p>
          </Panel>
        </div>
      </div>

      <Modal
        open={Boolean(editing)}
        onClose={() => setEditing(null)}
        title={data.habits.some((habit) => habit.id === editing?.id) ? "Editar hábito" : "Novo hábito"}
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setEditing(null)}>
              Cancelar
            </Button>
            <Button onClick={saveHabit}>Salvar hábito</Button>
          </>
        }
      >
        {editing && (
          <div className="space-y-4">
            <Field label="Nome do hábito">
              <Input
                value={editing.name}
                onChange={(event) => setEditing({ ...editing, name: event.target.value })}
                placeholder="Ex: Beber 3L de água"
              />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Meta semanal (dias)">
                <Select
                  value={String(editing.targetPerWeek)}
                  onChange={(event) =>
                    setEditing({ ...editing, targetPerWeek: Number(event.target.value) })
                  }
                >
                  {[1, 2, 3, 4, 5, 6, 7].map((value) => (
                    <option key={value} value={value}>
                      {value}× por semana
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Últimos 7 dias">
                <p className="pt-2 text-[12px] text-muted">
                  {editing.logs.filter((log) => week.includes(log) || log === addDaysISO(today(), 0)).length}{" "}
                  registros marcados
                </p>
              </Field>
            </div>
            <Field label="Emoji">
              <div className="flex flex-wrap gap-2">
                {EMOJIS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => setEditing({ ...editing, emoji })}
                    className={cn(
                      "grid h-9 w-9 place-items-center rounded-xl border text-lg transition-transform hover:scale-105",
                      editing.emoji === emoji ? "border-accent" : "border-line",
                    )}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </Field>
            <Field label="Cor">
              <div className="flex flex-wrap gap-2">
                {COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setEditing({ ...editing, color })}
                    className={cn(
                      "h-9 w-9 rounded-xl border-2 transition-transform hover:scale-105",
                      editing.color === color ? "border-ink" : "border-transparent",
                    )}
                    style={{ background: color }}
                    aria-label={`Cor ${color}`}
                  />
                ))}
              </div>
            </Field>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={Boolean(confirmId)}
        title="Excluir hábito"
        description="Todo o histórico de marcações será perdido."
        confirmLabel="Excluir"
        onCancel={() => setConfirmId(null)}
        onConfirm={() => {
          if (confirmId) remove("habits", confirmId);
          notify({ title: "Hábito removido" });
        }}
      />
    </div>
  );
}
