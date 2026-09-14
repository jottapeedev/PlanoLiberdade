import { useMemo, useState } from "react";
import {
  Activity,
  CalendarCheck,
  CheckCircle2,
  Dumbbell,
  Flame,
  HeartPulse,
  Plus,
  Repeat,
  Sparkles,
  Timer,
  Trash2,
  TrendingUp,
  Trophy,
  Zap,
} from "lucide-react";
import {
  Badge,
  Button,
  EmptyState,
  Field,
  Input,
  Modal,
  PageHeader,
  Panel,
  Progress,
  Ring,
  SectionHeader,
  Select,
  StatCard,
  Textarea,
} from "../components/ui";
import { BarsGroup } from "../components/charts";
import { useApp } from "../lib/store";
import { useMetrics } from "../lib/metrics";
import { cn, fmtDate, num, sum, today, weekdayShort } from "../lib/utils";
import type { TrainingSession } from "../lib/types";

const INTENSITY_LABEL = ["", "Leve", "Moderada", "Forte", "Intensa", "Máxima"];

export default function Training() {
  const { data, add, remove, notify } = useApp();
  const metrics = useMetrics();
  const [openWorkout, setOpenWorkout] = useState<string | null>(null);
  const [logOpen, setLogOpen] = useState(false);
  const [minutes, setMinutes] = useState("50");
  const [intensity, setIntensity] = useState("4");
  const [note, setNote] = useState("");

  const weekday = new Date().getDay();
  const todayWorkout = data.workouts.find((workout) => workout.weekday === weekday);
  const sessionsThisWeek = useMemo(() => {
    const limit = new Date();
    limit.setDate(limit.getDate() - 6);
    const key = limit.toISOString().slice(0, 10);
    return data.trainingSessions.filter((session) => session.date >= key);
  }, [data.trainingSessions]);

  const byWeekday = useMemo(
    () =>
      [1, 2, 3, 4, 5, 6].map((day) => ({
        label: weekdayShort(day),
        treinos: data.trainingSessions.filter(
          (session) => new Date(session.date + "T12:00:00").getDay() === day,
        ).length,
        minutos: sum(
          data.trainingSessions
            .filter((session) => new Date(session.date + "T12:00:00").getDay() === day)
            .map((session) => session.minutes),
        ),
      })),
    [data.trainingSessions],
  );

  const weekProgress = (metrics.training.monthSessions / 20) * 100;

  const logSession = (workoutId: string | undefined, title: string, mins: number) => {
    const session: TrainingSession = {
      id: `train_${Date.now().toString(36)}`,
      workoutId,
      title,
      date: today(),
      minutes: mins,
      intensity: Number(intensity) as TrainingSession["intensity"],
      note: note || undefined,
    };
    add("trainingSessions", session);
    notify({
      title: "Treino registrado 💪",
      description: `${title} · ${mins}min · ${INTENSITY_LABEL[Number(intensity)]}`,
      tone: "success",
    });
    setLogOpen(false);
    setNote("");
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Saúde e performance"
        icon={Dumbbell}
        title="Treinos"
        description="Planilha semanal, registro de sessões e evolução de carga. Corpo forte sustenta mente focada."
      >
        <Button variant="secondary" icon={Plus} onClick={() => setLogOpen(true)}>
          Registrar treino
        </Button>
        {todayWorkout && (
          <Button
            icon={CheckCircle2}
            onClick={() => {
              setMinutes(String(todayWorkout.durationMin));
              logSession(todayWorkout.id, todayWorkout.title, todayWorkout.durationMin);
            }}
          >
            Concluir treino de hoje
          </Button>
        )}
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Treinos no mês"
          value={num(metrics.training.monthSessions)}
          icon={Dumbbell}
          hint={`meta 20 treinos · ${weekProgress.toFixed(0)}% concluído`}
          tone="var(--danger)"
        />
        <StatCard
          label="Minutos treinados"
          value={num(metrics.training.monthMinutes)}
          icon={Timer}
          hint={`média ${num(metrics.training.monthMinutes / Math.max(metrics.training.monthSessions, 1))}min por treino`}
          tone="var(--accent)"
          spark={metrics.training.byWeek.map((week) => week.minutos)}
        />
        <StatCard
          label="Intensidade média"
          value={`${metrics.training.avgIntensity.toFixed(1)}/5`}
          icon={Zap}
          hint="percepção de esforço"
          tone="var(--warning)"
        />
        <StatCard
          label="Sequência"
          value={`${metrics.training.streak} dias`}
          icon={Flame}
          hint="dias ativos consecutivos"
          tone="var(--positive)"
        />
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.5fr_1fr]">
        <div className="space-y-5">
          <Panel>
            <SectionHeader
              icon={CalendarCheck}
              title="Planilha da semana"
              description="Toque em um treino para ver os exercícios"
              action={
                todayWorkout ? (
                  <Badge color="var(--positive)" dot>
                    Hoje: {todayWorkout.focus}
                  </Badge>
                ) : (
                  <Badge dot>Dia de descanso</Badge>
                )
              }
            />
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {data.workouts
                .slice()
                .sort((a, b) => a.weekday - b.weekday)
                .map((workout) => {
                  const isToday = workout.weekday === weekday;
                  const open = openWorkout === workout.id;
                  const doneToday = data.trainingSessions.some(
                    (session) => session.date === today() && session.workoutId === workout.id,
                  );
                  return (
                    <div
                      key={workout.id}
                      className={cn(
                        "rounded-2xl border bg-surface-2/40 p-4 transition-colors",
                        isToday ? "border-accent/50" : "border-line",
                      )}
                    >
                      <button
                        type="button"
                        onClick={() => setOpenWorkout(open ? null : workout.id)}
                        className="w-full text-left"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="flex items-center gap-2">
                            <span
                              className={cn(
                                "num grid h-8 w-8 place-items-center rounded-xl text-[11px] font-bold",
                                isToday ? "accent-grad text-white" : "border border-line bg-surface-3 text-muted",
                              )}
                            >
                              {weekdayShort(workout.weekday)}
                            </span>
                            <span>
                              <span className="block text-[13px] font-semibold">{workout.title}</span>
                              <span className="block text-[10.5px] text-faint">
                                {workout.focus} · {workout.durationMin}min ·{" "}
                                {workout.exercises.length} exercícios
                              </span>
                            </span>
                          </span>
                          {doneToday && <CheckCircle2 className="h-4 w-4 shrink-0 text-positive" />}
                        </div>
                      </button>

                      {open && (
                        <ul className="mt-3 space-y-1.5 border-t border-line pt-3">
                          {workout.exercises.map((exercise) => (
                            <li
                              key={exercise.id}
                              className="flex items-center justify-between text-[11.5px]"
                            >
                              <span className="text-muted">{exercise.name}</span>
                              <span className="num text-faint">
                                {exercise.sets}× {exercise.reps}
                                {exercise.load ? ` · ${exercise.load}` : ""}
                              </span>
                            </li>
                          ))}
                        </ul>
                      )}

                      <div className="mt-3 flex items-center gap-2">
                        <Button
                          size="xs"
                          variant="subtle"
                          icon={CheckCircle2}
                          disabled={doneToday}
                          onClick={() => {
                            setMinutes(String(workout.durationMin));
                            logSession(workout.id, workout.title, workout.durationMin);
                          }}
                        >
                          {doneToday ? "Feito hoje" : "Concluir"}
                        </Button>
                        <Button
                          size="xs"
                          variant="ghost"
                          onClick={() => setOpenWorkout(open ? null : workout.id)}
                        >
                          {open ? "Ocultar" : "Ver exercícios"}
                        </Button>
                      </div>
                    </div>
                  );
                })}
            </div>
          </Panel>

          <div className="grid gap-5 lg:grid-cols-2">
            <Panel>
              <SectionHeader icon={TrendingUp} title="Minutos por semana" description="Últimas 8 semanas" />
              <div className="mt-4">
                <BarsGroup
                  data={metrics.training.byWeek}
                  series={[{ key: "minutos", label: "Minutos", color: "var(--danger)" }]}
                  height={230}
                />
              </div>
            </Panel>
            <Panel>
              <SectionHeader icon={Repeat} title="Frequência por dia" description="Distribuição semanal" />
              <div className="mt-4">
                <BarsGroup
                  data={byWeekday}
                  series={[{ key: "treinos", label: "Treinos", color: "var(--accent)" }]}
                  height={230}
                />
              </div>
            </Panel>
          </div>
        </div>

        <div className="space-y-5">
          <Panel className="flex flex-col items-center">
            <SectionHeader icon={Trophy} title="Hoje" description={todayWorkout?.title ?? "Dia de descanso"} className="w-full" />
            <div className="mt-5">
              <Ring
                value={todayWorkout ? 100 : 0}
                size={168}
                thickness={13}
                color="var(--danger)"
                label={<span className="text-lg">{todayWorkout ? "Treino" : "Descanso"}</span>}
                sub={todayWorkout ? "no plano de hoje" : "recuperação ativa"}
              />
            </div>
            {todayWorkout && (
              <ul className="mt-5 w-full space-y-2">
                {todayWorkout.exercises.slice(0, 5).map((exercise) => (
                  <li
                    key={exercise.id}
                    className="flex items-center justify-between rounded-xl border border-line bg-surface-2/40 px-3 py-2 text-[11.5px]"
                  >
                    <span className="text-muted">{exercise.name}</span>
                    <span className="num text-faint">
                      {exercise.sets}× {exercise.reps}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          <Panel>
            <SectionHeader
              icon={Activity}
              title="Histórico recente"
              description={`${sessionsThisWeek.length} sessões registradas`}
            />
            <ul className="mt-4 space-y-2">
              {metrics.training.recent.map((session) => (
                <li
                  key={session.id}
                  className="group flex items-center gap-3 rounded-xl border border-line bg-surface-2/40 px-3.5 py-2.5"
                >
                  <HeartPulse className="h-4 w-4 shrink-0 text-danger" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[12.5px] font-medium">{session.title}</span>
                    <span className="text-[10.5px] text-faint">
                      {fmtDate(session.date, "dd/MM")} · {INTENSITY_LABEL[session.intensity]}
                    </span>
                  </span>
                  <span className="num text-[12px] font-semibold text-muted">
                    {session.minutes}min
                  </span>
                  <Button
                    size="xs"
                    variant="ghost"
                    icon={Trash2}
                    className="text-danger opacity-0 group-hover:opacity-100"
                    onClick={() => {
                      remove("trainingSessions", session.id);
                      notify({ title: "Sessão removida" });
                    }}
                  />
                </li>
              ))}
              {metrics.training.recent.length === 0 && (
                <li>
                  <EmptyState
                    icon={Dumbbell}
                    title="Sem treinos registrados"
                    description="Registre a primeira sessão para começar a acompanhar sua evolução."
                  />
                </li>
              )}
            </ul>
          </Panel>

          <Panel>
            <SectionHeader icon={Sparkles} title="Construção de força" description="Dicas aplicadas ao seu plano" />
            <ul className="mt-4 space-y-3 text-[12.5px] text-muted">
              {[
                "Progrida 2,5% na carga quando completar todas as repetições com boa técnica.",
                "Mantenha 2 dias de recuperação entre estímulos do mesmo grupo muscular.",
                "Priorize 7h de sono — recuperação é parte do treino.",
                "Registre a intensidade percebida para ajustar o volume da semana.",
              ].map((tip) => (
                <li key={tip} className="flex gap-2.5">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-danger" />
                  {tip}
                </li>
              ))}
            </ul>
            <div className="mt-4">
              <p className="label-xs mb-2">Carga semanal vs meta</p>
              <Progress
                value={metrics.training.monthMinutes}
                max={Math.max(20 * 50, 1)}
                color="var(--danger)"
                height={7}
              />
              <p className="mt-2 text-[11px] text-faint">
                {num(metrics.training.monthMinutes)} de {num(20 * 50)} minutos previstos no mês
              </p>
            </div>
          </Panel>
        </div>
      </div>

      <Modal
        open={logOpen}
        onClose={() => setLogOpen(false)}
        title="Registrar treino"
        description="Sessão livre ou treino do plano"
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setLogOpen(false)}>
              Cancelar
            </Button>
            <Button
              icon={CheckCircle2}
              onClick={() =>
                logSession(todayWorkout?.id, todayWorkout?.title ?? "Treino livre", Number(minutes) || 45)
              }
            >
              Salvar treino
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="Duração (minutos)">
            <Input
              type="number"
              value={minutes}
              onChange={(event) => setMinutes(event.target.value)}
            />
          </Field>
          <Field label="Intensidade percebida">
            <Select value={intensity} onChange={(event) => setIntensity(event.target.value)}>
              {[1, 2, 3, 4, 5].map((level) => (
                <option key={level} value={level}>
                  {level} — {INTENSITY_LABEL[level]}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Observações">
            <Textarea
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="Cargas, sensações, o que evoluir…"
              className="min-h-[80px]"
            />
          </Field>
        </div>
      </Modal>
    </div>
  );
}
