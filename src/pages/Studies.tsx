import { useMemo, useState } from "react";
import {
  BookOpen,
  CalendarDays,
  CheckCircle2,
  Clock,
  Flame,
  GraduationCap,
  Layers,
  Pause,
  Pencil,
  Play,
  Plus,
  Target,
  Timer,
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
  HeatGrid,
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
import { BarsGroup, TrendArea } from "../components/charts";
import { useApp } from "../lib/store";
import { useMetrics } from "../lib/metrics";
import { addDaysISO, cn, daysLeft, fmtDate, num, sum, today } from "../lib/utils";
import type { Course } from "../lib/types";

const COLORS = ["#8b5cf6", "#22d3ee", "#34d399", "#fbbf24", "#f43f5e", "#60a5fa"];

const emptyCourse = (): Course => ({
  id: `course_${Date.now().toString(36)}`,
  name: "",
  platform: "",
  category: "Marketing",
  totalLessons: 20,
  doneLessons: 0,
  status: "ativo",
  deadline: addDaysISO(today(), 30),
  color: COLORS[Math.floor(Math.random() * COLORS.length)],
  createdAt: today(),
});

export default function Studies() {
  const { data, add, update, remove, notify } = useApp();
  const metrics = useMetrics();
  const [filter, setFilter] = useState<"todos" | "ativo" | "concluido" | "pausado">("ativo");
  const [editing, setEditing] = useState<Course | null>(null);
  const [sessionCourse, setSessionCourse] = useState<Course | null>(null);
  const [sessionMinutes, setSessionMinutes] = useState("50");
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const courses = useMemo(
    () =>
      [...data.courses]
        .filter((course) => (filter === "todos" ? true : course.status === filter))
        .sort((a, b) => {
          const progressA = a.totalLessons ? a.doneLessons / a.totalLessons : 0;
          const progressB = b.totalLessons ? b.doneLessons / b.totalLessons : 0;
          return progressB - progressA;
        }),
    [data.courses, filter],
  );

  const weeklyGoal = data.settings.dailyFocusTarget * 7;
  const weekProgress = (metrics.studies.weekMinutes / weeklyGoal) * 100;

  const categorySeries = useMemo(() => {
    const map = new Map<string, number>();
    data.courses.forEach((course) => {
      const minutes = sum(
        data.studySessions
          .filter((session) => session.courseId === course.id)
          .map((session) => session.minutes),
      );
      map.set(course.category, (map.get(course.category) ?? 0) + minutes / 60);
    });
    return Array.from(map.entries())
      .map(([label, horas]) => ({ label, horas: Number(horas.toFixed(1)) }))
      .sort((a, b) => b.horas - a.horas);
  }, [data.courses, data.studySessions]);

  const logSession = (course: Course, minutes: number, note?: string) => {
    add("studySessions", {
      id: `study_${Date.now().toString(36)}`,
      courseId: course.id,
      minutes,
      date: today(),
      note,
    });
    notify({
      title: `+${minutes}min registrados`,
      description: course.name,
      tone: "success",
    });
  };

  const saveCourse = () => {
    if (!editing) return;
    if (!editing.name.trim()) {
      notify({ title: "Informe o nome do curso", tone: "error" });
      return;
    }
    if (data.courses.some((course) => course.id === editing.id)) {
      update("courses", editing.id, editing);
      notify({ title: "Curso atualizado", tone: "success" });
    } else {
      add("courses", editing);
      notify({ title: "Curso adicionado", tone: "success" });
    }
    setEditing(null);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Aprendizado contínuo"
        icon={GraduationCap}
        title="Estudos"
        description="Controle de cursos, sessões de foco, progresso por área e consistência diária — tudo alimentando o seu score de produtividade."
      >
        <Button
          variant="secondary"
          icon={Timer}
          onClick={() => {
            const target = data.courses.find((course) => course.status === "ativo");
            if (target) {
              setSessionCourse(target);
              setSessionMinutes("50");
            }
          }}
        >
          Registrar sessão
        </Button>
        <Button icon={Plus} onClick={() => setEditing(emptyCourse())}>
          Novo curso
        </Button>
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Foco hoje"
          value={`${num(metrics.studies.todayMinutes)}min`}
          icon={Clock}
          hint={`meta diária ${data.settings.dailyFocusTarget}min`}
          tone="var(--accent)"
          delta={
            data.settings.dailyFocusTarget
              ? ((metrics.studies.todayMinutes - data.settings.dailyFocusTarget) /
                  data.settings.dailyFocusTarget) *
                100
              : 0
          }
        />
        <StatCard
          label="Na semana"
          value={`${(metrics.studies.weekMinutes / 60).toFixed(1)}h`}
          icon={TrendingUp}
          hint={`meta semanal ${(weeklyGoal / 60).toFixed(0)}h`}
          tone="var(--accent-2)"
          spark={metrics.studies.byWeek.map((week) => week.minutos)}
        />
        <StatCard
          label="Cursos ativos"
          value={num(metrics.studies.activeCourses)}
          icon={BookOpen}
          hint={`${metrics.studies.completedCourses} concluídos`}
          tone="var(--info)"
        />
        <StatCard
          label="Horas acumuladas"
          value={`${num(metrics.studies.totalHours, 1)}h`}
          icon={Trophy}
          hint={`progresso médio ${metrics.studies.averageProgress.toFixed(0)}%`}
          tone="var(--positive)"
        />
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.6fr_1fr]">
        <div className="space-y-5">
          <Panel>
            <SectionHeader
              icon={Layers}
              title="Meus cursos"
              description="Progresso, prazos e registro rápido de sessões"
              action={
                <SegmentedControl
                  value={filter}
                  onChange={setFilter}
                  options={[
                    { value: "ativo", label: "Ativos" },
                    { value: "concluido", label: "Concluídos" },
                    { value: "pausado", label: "Pausados" },
                    { value: "todos", label: "Todos" },
                  ]}
                />
              }
            />
            <ul className="mt-5 space-y-3">
              {courses.map((course) => {
                const percent = course.totalLessons
                  ? (course.doneLessons / course.totalLessons) * 100
                  : 0;
                const minutes = sum(
                  data.studySessions
                    .filter((session) => session.courseId === course.id)
                    .map((session) => session.minutes),
                );
                const left = daysLeft(course.deadline);
                return (
                  <li
                    key={course.id}
                    className="group rounded-2xl border border-line bg-surface-2/40 p-4 transition-colors hover:border-accent/40"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span
                            className="h-2.5 w-2.5 shrink-0 rounded-full"
                            style={{ background: course.color, boxShadow: `0 0 10px ${course.color}` }}
                          />
                          <p className="truncate text-[13.5px] font-semibold">{course.name}</p>
                          <Badge
                            color={
                              course.status === "concluido"
                                ? "var(--positive)"
                                : course.status === "pausado"
                                  ? "var(--warning)"
                                  : course.color
                            }
                            className="px-2 py-0.5 text-[10px]"
                          >
                            {course.status}
                          </Badge>
                        </div>
                        <p className="mt-1.5 flex flex-wrap items-center gap-2 text-[11px] text-faint">
                          <span>{course.platform}</span>
                          <span>· {course.category}</span>
                          <span className="num">
                            · {course.doneLessons}/{course.totalLessons} aulas
                          </span>
                          <span className="num">· {(minutes / 60).toFixed(1)}h estudadas</span>
                          {left !== null && (
                            <span className={cn(left <= 7 && left >= 0 && "text-warning")}>
                              · prazo em {left} dia(s)
                            </span>
                          )}
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Button
                          size="xs"
                          variant="subtle"
                          icon={Timer}
                          onClick={() => {
                            setSessionCourse(course);
                            setSessionMinutes("50");
                          }}
                        >
                          Sessão
                        </Button>
                        <Button
                          size="xs"
                          variant="ghost"
                          icon={course.status === "pausado" ? Play : Pause}
                          onClick={() =>
                            update("courses", course.id, {
                              status: course.status === "pausado" ? "ativo" : "pausado",
                            })
                          }
                          title={course.status === "pausado" ? "Retomar" : "Pausar"}
                        />
                        <Button size="xs" variant="ghost" icon={Pencil} onClick={() => setEditing(course)} />
                        <Button
                          size="xs"
                          variant="ghost"
                          icon={Trash2}
                          className="text-danger"
                          onClick={() => setConfirmId(course.id)}
                        />
                      </div>
                    </div>

                    <div className="mt-3 flex items-center gap-3">
                      <Progress value={percent} color={course.color} height={7} className="flex-1" />
                      <span className="num w-10 text-right text-[11.5px] font-semibold text-muted">
                        {percent.toFixed(0)}%
                      </span>
                    </div>

                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      {[15, 30, 50, 90].map((minutesOption) => (
                        <button
                          key={minutesOption}
                          type="button"
                          onClick={() => logSession(course, minutesOption)}
                          className="rounded-lg border border-line bg-surface-2/60 px-2.5 py-1 text-[11px] text-muted transition-colors hover:border-accent/50 hover:text-ink"
                        >
                          +{minutesOption}min
                        </button>
                      ))}
                      <button
                        type="button"
                        onClick={() =>
                          update("courses", course.id, {
                            doneLessons: Math.min(course.doneLessons + 1, course.totalLessons),
                            status:
                              course.doneLessons + 1 >= course.totalLessons
                                ? "concluido"
                                : course.status,
                          })
                        }
                        className="rounded-lg border border-line bg-surface-2/60 px-2.5 py-1 text-[11px] text-muted transition-colors hover:border-accent/50 hover:text-ink"
                      >
                        +1 aula
                      </button>
                    </div>
                  </li>
                );
              })}
              {courses.length === 0 && (
                <li>
                  <EmptyState
                    icon={BookOpen}
                    title="Nenhum curso neste filtro"
                    description="Adicione um curso para começar a acompanhar seu progresso de aprendizado."
                    action={<Button icon={Plus} onClick={() => setEditing(emptyCourse())}>Adicionar curso</Button>}
                  />
                </li>
              )}
            </ul>
          </Panel>

          <Panel>
            <SectionHeader
              icon={CalendarDays}
              title="Consistência de estudo"
              description="Cada quadrado representa um dia das últimas 12 semanas"
            />
            <div className="mt-5">
              <HeatGrid
                cells={metrics.studies.heatmap}
                columns={14}
                legend={["menos", "mais"]}
              />
            </div>
          </Panel>
        </div>

        <div className="space-y-5">
          <Panel className="flex flex-col items-center">
            <SectionHeader
              icon={Target}
              title="Meta semanal"
              description={`${(metrics.studies.weekMinutes / 60).toFixed(1)}h de ${(weeklyGoal / 60).toFixed(0)}h`}
              className="w-full"
            />
            <div className="mt-5">
              <Ring
                value={weekProgress}
                size={168}
                thickness={13}
                label={<span className="num">{weekProgress.toFixed(0)}%</span>}
                sub="da meta da semana"
              />
            </div>
            <div className="mt-5 w-full space-y-3">
              {metrics.studies.byWeek.slice(-4).map((week) => (
                <div key={week.label} className="flex items-center gap-3">
                  <span className="w-8 text-[11px] text-faint">{week.label}</span>
                  <Progress
                    value={week.minutos}
                    max={Math.max(weeklyGoal, 1)}
                    height={6}
                    className="flex-1"
                  />
                  <span className="num w-12 text-right text-[11px] text-muted">
                    {(week.minutos / 60).toFixed(1)}h
                  </span>
                </div>
              ))}
            </div>
          </Panel>

          <Panel>
            <SectionHeader icon={Flame} title="Sessões recentes" description="Últimos registros de foco" />
            <ul className="mt-4 space-y-2">
              {[...data.studySessions]
                .sort((a, b) => (a.date < b.date ? 1 : -1))
                .slice(0, 7)
                .map((session) => {
                  const course = data.courses.find((item) => item.id === session.courseId);
                  return (
                    <li
                      key={session.id}
                      className="flex items-center gap-3 rounded-xl border border-line bg-surface-2/40 px-3.5 py-2.5"
                    >
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-positive" />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[12.5px] font-medium">
                          {course?.name ?? "Sessão livre"}
                        </span>
                        <span className="text-[10.5px] text-faint">{fmtDate(session.date, "dd/MM/yy")}</span>
                      </span>
                      <span className="num text-[12px] font-semibold text-accent">
                        {session.minutes}min
                      </span>
                    </li>
                  );
                })}
              {data.studySessions.length === 0 && (
                <li className="rounded-xl border border-dashed border-line-strong px-3 py-5 text-center text-[12px] text-faint">
                  Nenhuma sessão registrada ainda
                </li>
              )}
            </ul>
          </Panel>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Panel>
          <SectionHeader icon={TrendingUp} title="Minutos por dia" description="Últimos 14 dias" />
          <div className="mt-4">
            <TrendArea
              data={metrics.studies.byDay.map((day) => ({ label: day.label, minutos: day.minutes }))}
              series={[{ key: "minutos", label: "Minutos", color: "var(--accent)" }]}
              height={240}
            />
          </div>
        </Panel>

        <Panel>
          <SectionHeader icon={Layers} title="Horas por categoria" description="Onde o tempo está sendo investido" />
          <div className="mt-4">
            <BarsGroup
              data={categorySeries}
              series={[{ key: "horas", label: "Horas", color: "var(--accent-2)" }]}
              height={240}
            />
          </div>
        </Panel>
      </div>

      {/* ----------------------------- modais ----------------------------- */}
      <Modal
        open={Boolean(editing)}
        onClose={() => setEditing(null)}
        title={data.courses.some((course) => course.id === editing?.id) ? "Editar curso" : "Novo curso"}
        size="lg"
        footer={
          <>
            <Button variant="ghost" onClick={() => setEditing(null)}>
              Cancelar
            </Button>
            <Button onClick={saveCourse}>Salvar curso</Button>
          </>
        }
      >
        {editing && (
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Nome do curso" className="sm:col-span-2">
              <Input
                value={editing.name}
                onChange={(event) => setEditing({ ...editing, name: event.target.value })}
                placeholder="Ex: Copywriting que vende"
              />
            </Field>
            <Field label="Plataforma">
              <Input
                value={editing.platform}
                onChange={(event) => setEditing({ ...editing, platform: event.target.value })}
                placeholder="Hotmart, Udemy, presencial…"
              />
            </Field>
            <Field label="Categoria">
              <Select
                value={editing.category}
                onChange={(event) => setEditing({ ...editing, category: event.target.value })}
              >
                {["Marketing", "Dev", "Design", "Finanças", "Negócios", "Idiomas", "Outros"].map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Total de aulas">
              <Input
                type="number"
                value={editing.totalLessons}
                onChange={(event) =>
                  setEditing({ ...editing, totalLessons: Number(event.target.value) })
                }
              />
            </Field>
            <Field label="Aulas concluídas">
              <Input
                type="number"
                value={editing.doneLessons}
                onChange={(event) =>
                  setEditing({ ...editing, doneLessons: Number(event.target.value) })
                }
              />
            </Field>
            <Field label="Status">
              <Select
                value={editing.status}
                onChange={(event) =>
                  setEditing({ ...editing, status: event.target.value as Course["status"] })
                }
              >
                <option value="ativo">Ativo</option>
                <option value="pausado">Pausado</option>
                <option value="concluido">Concluído</option>
                <option value="planejado">Planejado</option>
              </Select>
            </Field>
            <Field label="Prazo">
              <Input
                type="date"
                value={editing.deadline ?? ""}
                onChange={(event) => setEditing({ ...editing, deadline: event.target.value })}
              />
            </Field>
            <Field label="Cor de destaque" className="sm:col-span-2">
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

      <Modal
        open={Boolean(sessionCourse)}
        onClose={() => setSessionCourse(null)}
        title="Registrar sessão de estudo"
        description={sessionCourse?.name}
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setSessionCourse(null)}>
              Cancelar
            </Button>
            <Button
              icon={CheckCircle2}
              onClick={() => {
                if (sessionCourse) logSession(sessionCourse, Number(sessionMinutes) || 30);
                setSessionCourse(null);
              }}
            >
              Registrar
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="Duração (minutos)">
            <Input
              type="number"
              value={sessionMinutes}
              onChange={(event) => setSessionMinutes(event.target.value)}
            />
          </Field>
          <div className="flex flex-wrap gap-2">
            {[15, 25, 45, 60, 90].map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setSessionMinutes(String(option))}
                className="rounded-lg border border-line bg-surface-2/60 px-3 py-1.5 text-[12px] text-muted transition-colors hover:border-accent/50 hover:text-ink"
              >
                {option}min
              </button>
            ))}
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={Boolean(confirmId)}
        title="Excluir curso"
        description="O curso e seu histórico de sessões permanecerão nos registros, mas o curso será removido da lista."
        confirmLabel="Excluir"
        onCancel={() => setConfirmId(null)}
        onConfirm={() => {
          if (confirmId) remove("courses", confirmId);
          notify({ title: "Curso removido" });
        }}
      />
    </div>
  );
}
