import { useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import confetti from "canvas-confetti";
import { motion } from "framer-motion";
import {
  ArrowUpRight,
  BarChart3,
  Cake,
  CalendarCheck,
  CalendarClock,
  CheckCircle2,
  Circle,
  Dumbbell,
  Flame,
  GraduationCap,
  Inbox,
  Lightbulb,
  Play,
  Plus,
  ShoppingBag,
  Sparkles,
  Target,
  Timer,
  TrendingDown,
  TrendingUp,
  Wallet,
  Zap,
} from "lucide-react";
import {
  Badge,
  Button,
  EmptyState,
  Panel,
  Progress,
  Ring,
  SectionHeader,
  StatCard,
} from "../components/ui";
import { BarsGroup, Donut, TrendArea } from "../components/charts";
import { useApp } from "../lib/store";
import { useMetrics } from "../lib/metrics";
import { MODULES } from "../lib/modules";
import {
  brl,
  cn,
  daysLeft,
  fmtDate,
  greeting,
  num,
  pctChange,
  priorityMeta,
  relative,
  sum,
  today,
} from "../lib/utils";
import type { Task } from "../lib/types";

export default function Dashboard() {
  const { data, settings, update, notify, add } = useApp();
  const metrics = useMetrics();
  const navigate = useNavigate();

  const todayTasks = useMemo(
    () =>
      data.tasks
        .filter((task) => task.today || task.due === today())
        .sort((a, b) => {
          if (a.done !== b.done) return a.done ? 1 : -1;
          return priorityMeta(b.priority).weight - priorityMeta(a.priority).weight;
        }),
    [data.tasks],
  );

  const doneCount = todayTasks.filter((task) => task.done).length;
  const pending = todayTasks.filter((task) => !task.done);

  const activeGoals = data.goals.filter((goal) => goal.status === "ativa");

  const upcoming = useMemo(() => {
    const items = [
      ...data.tasks
        .filter((task) => !task.done && task.due && task.due >= today())
        .map((task) => ({
          id: `task-${task.id}`,
          label: task.title,
          date: task.due as string,
          kind: "Tarefa",
          path: "/meu-dia",
        })),
      ...data.courses
        .filter((course) => course.status === "ativo" && course.deadline)
        .map((course) => ({
          id: `course-${course.id}`,
          label: course.name,
          date: course.deadline as string,
          kind: "Curso",
          path: "/estudos",
        })),
      ...activeGoals
        .filter((goal) => goal.deadline)
        .map((goal) => ({
          id: `goal-${goal.id}`,
          label: goal.title,
          date: goal.deadline as string,
          kind: "Meta",
          path: "/metas",
        })),
      ...data.orders
        .filter((order) => order.deliveryAt && order.status !== "concluido")
        .map((order) => ({
          id: `order-${order.id}`,
          label: `${order.code} · ${order.customer}`,
          date: order.deliveryAt as string,
          kind: "Entrega",
          path: order.businessId === "biz_docura" ? "/srta-docura" : "/srta-das-massas",
        })),
    ]
      .filter((item) => daysLeft(item.date) !== null && (daysLeft(item.date) ?? 0) <= 14)
      .sort((a, b) => (a.date < b.date ? -1 : 1))
      .slice(0, 6);
    return items;
  }, [activeGoals, data.courses, data.orders, data.tasks]);

  const toggleTask = (task: Task) => {
    const willComplete = !task.done;
    update("tasks", task.id, {
      done: willComplete,
      completedAt: willComplete ? today() : undefined,
    });
    if (willComplete && pending.length === 1) {
      confetti({
        particleCount: 140,
        spread: 78,
        origin: { y: 0.72 },
        colors: ["#8b5cf6", "#22d3ee", "#34d399", "#fbbf24"],
      });
      notify({
        title: "Dia fechado! 🎉",
        description: "Todas as tarefas de hoje foram concluídas.",
        tone: "success",
      });
    }
  };

  const incomeDelta = pctChange(metrics.finance.income, metrics.finance.prevIncome);
  const scoreTone = metrics.score.total >= 70 ? "var(--positive)" : metrics.score.total >= 45 ? "var(--accent)" : "var(--warning)";

  return (
    <div className="space-y-6">
      {/* ---------------------------- HERO ---------------------------- */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className="panel relative overflow-hidden p-5 sm:p-7"
      >
        <div className="pointer-events-none absolute -top-28 -left-16 h-72 w-72 rounded-full accent-grad opacity-20 blur-3xl animate-float" />
        <div className="pointer-events-none absolute -right-10 -bottom-24 h-64 w-64 rounded-full bg-[var(--accent-2)] opacity-10 blur-3xl" />

        <div className="relative grid gap-6 lg:grid-cols-[1.6fr_auto] lg:items-center">
          <div>
            <Badge className="accent-soft" dot>
              {greeting()}, {settings.name.split(" ")[0]}
            </Badge>
            <h1 className="mt-4 font-display text-[28px] leading-[1.1] font-extrabold tracking-tight text-balance sm:text-[38px]">
              Sua central de comando para{" "}
              <span className="accent-text">vida, renda e produtividade</span>.
            </h1>
            <p className="mt-3 max-w-xl text-[13.5px] leading-relaxed text-muted">
              {pending.length > 0
                ? `Você tem ${pending.length} ${pending.length === 1 ? "tarefa" : "tarefas"} para hoje, ${metrics.pipeline.open.length} leads em aberto e ${num(metrics.habits.todayDone)}/${num(metrics.habits.total)} hábitos feitos.`
                : "Nenhuma tarefa pendente para hoje. Bom momento para planejar a próxima semana."}
            </p>

            <div className="mt-5 flex flex-wrap items-center gap-2">
              <Button size="md" icon={Play} onClick={() => navigate("/meu-dia")}>
                Iniciar modo foco
              </Button>
              <Button size="md" variant="secondary" icon={Zap} onClick={() => navigate("/inbox")}>
                Processar caixa ({data.inbox.filter((i) => !i.processed).length})
              </Button>
              <Button
                size="md"
                variant="ghost"
                icon={Plus}
                onClick={() =>
                  add("tasks", {
                    id: `task_${Date.now().toString(36)}`,
                    title: "Nova tarefa rápida",
                    done: false,
                    priority: "media",
                    area: "Geral",
                    today: true,
                    due: today(),
                    order: 0,
                    tags: [],
                    createdAt: today(),
                  })
                }
              >
                Tarefa de hoje
              </Button>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { label: "Tarefas hoje", value: `${doneCount}/${todayTasks.length}`, icon: CheckCircle2 },
                { label: "Foco hoje", value: `${Math.floor(metrics.studies.todayMinutes / 60)}h${String(metrics.studies.todayMinutes % 60).padStart(2, "0")}`, icon: Timer },
                { label: "Sequência", value: `${metrics.habits.currentStreak}d`, icon: Flame },
                { label: "Meta do mês", value: brl(metrics.finance.income), icon: Wallet },
              ].map((item) => (
                <div
                  key={item.label}
                  className="rounded-2xl border border-line bg-surface-2/50 px-3.5 py-3 backdrop-blur-sm"
                >
                  <p className="label-xs flex items-center gap-1.5">
                    <item.icon className="h-3 w-3" />
                    {item.label}
                  </p>
                  <p className="num mt-1.5 font-display text-[17px] font-bold">{item.value}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col items-center gap-5 lg:pl-8">
            <Ring
              value={metrics.score.total}
              size={168}
              thickness={13}
              color={scoreTone}
              label={
                <span className="num">
                  {metrics.score.total}
                  <span className="text-sm font-semibold text-muted">/100</span>
                </span>
              }
              sub="Score do dia"
            />
            <div className="grid w-full gap-2">
              {[
                { label: "Tarefas", value: metrics.score.tasks, color: "var(--accent)" },
                { label: "Hábitos", value: metrics.score.habits, color: "var(--info)" },
                { label: "Estudo", value: metrics.score.study, color: "var(--accent-2)" },
                { label: "Receita", value: metrics.score.finance, color: "var(--positive)" },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-2.5">
                  <span className="w-14 text-[11px] text-muted">{item.label}</span>
                  <Progress value={item.value} color={item.color} height={5} className="flex-1" />
                  <span className="num w-8 text-right text-[11px] text-muted">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.section>

      {/* -------------------------- STAT CARDS ------------------------- */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Renda do mês"
          value={brl(metrics.finance.income)}
          icon={Wallet}
          delta={incomeDelta}
          hint="vs mês anterior"
          tone="var(--accent)"
          spark={metrics.finance.series.map((point) => point.receita)}
        />
        <StatCard
          label="Lucro do mês"
          value={brl(metrics.finance.profit)}
          icon={TrendingUp}
          hint={`margem ${metrics.finance.margin.toFixed(0)}%`}
          tone="var(--positive)"
          spark={metrics.finance.series.map((point) => point.lucro)}
        />
        <StatCard
          label="Pipeline de sites"
          value={brl(sum(metrics.pipeline.open.map((lead) => lead.value)))}
          icon={BarChart3}
          hint={`${metrics.pipeline.open.length} leads · ${metrics.pipeline.won.length} ganhos`}
          tone="var(--info)"
        />
        <StatCard
          label="Vendas TikTok Shop"
          value={num(metrics.tiktok.unitsSold)}
          icon={ShoppingBag}
          hint={`${num(metrics.tiktok.views)} views · ${metrics.tiktok.published} publicados`}
          tone="var(--accent-2)"
        />
      </div>

      {/* ---------------------------- GRID ---------------------------- */}
      <div className="grid gap-5 xl:grid-cols-3">
        <div className="space-y-5 xl:col-span-2">
          {/* foco do dia */}
          <Panel>
            <SectionHeader
              icon={Target}
              title="Foco do dia"
              description={`${doneCount} de ${todayTasks.length} concluídas · ${fmtDate(new Date(), "EEEE, d 'de' MMMM")}`}
              action={
                <Link to="/meu-dia">
                  <Button variant="ghost" size="sm" trailingIcon={ArrowUpRight}>
                    Abrir planejador
                  </Button>
                </Link>
              }
            />
            <Progress
              value={doneCount}
              max={Math.max(todayTasks.length, 1)}
              className="mt-4"
              height={7}
            />
            <ul className="mt-4 space-y-2">
              {todayTasks.slice(0, 7).map((task) => {
                const meta = priorityMeta(task.priority);
                return (
                  <li key={task.id}>
                    <button
                      type="button"
                      onClick={() => toggleTask(task)}
                      className={cn(
                        "group flex w-full items-center gap-3 rounded-2xl border border-line bg-surface-2/40 px-3.5 py-3 text-left transition-all hover:border-accent/40 hover:bg-surface-2/70",
                        task.done && "opacity-55",
                      )}
                    >
                      {task.done ? (
                        <CheckCircle2 className="h-[18px] w-[18px] shrink-0 text-positive" />
                      ) : (
                        <Circle className="h-[18px] w-[18px] shrink-0 text-faint group-hover:text-accent" />
                      )}
                      <span className="min-w-0 flex-1">
                        <span
                          className={cn(
                            "block truncate text-[13.5px] font-medium",
                            task.done && "line-through",
                          )}
                        >
                          {task.title}
                        </span>
                        <span className="mt-0.5 flex items-center gap-2 text-[11px] text-faint">
                          {task.area}
                          {task.estimateMin ? ` · ${task.estimateMin}min` : ""}
                        </span>
                      </span>
                      <Badge color={meta.color}>{meta.label}</Badge>
                    </button>
                  </li>
                );
              })}
              {todayTasks.length === 0 && (
                <EmptyState
                  icon={CheckCircle2}
                  title="Nada planejado para hoje"
                  description="Puxe tarefas do backlog no planejador ou crie uma nova agora."
                  action={
                    <Link to="/meu-dia">
                      <Button icon={Plus}>Planejar o dia</Button>
                    </Link>
                  }
                />
              )}
            </ul>
          </Panel>

          {/* renda + estudos */}
          <div className="grid gap-5 lg:grid-cols-2">
            <Panel>
              <SectionHeader
                icon={Wallet}
                title="Renda por fonte"
                description="Mês atual comparado às metas"
              />
              <Donut
                data={metrics.finance.bySource.map((source) => ({
                  label: source.label,
                  value: source.value,
                  color: source.color,
                }))}
                centerLabel={brl(metrics.finance.income)}
                centerSub="receita do mês"
                height={230}
              />
              <div className="mt-4 space-y-3">
                {metrics.finance.bySource.slice(0, 4).map((source) => (
                  <div key={source.id}>
                    <div className="flex items-center justify-between text-[11.5px]">
                      <span className="flex items-center gap-2 text-muted">
                        <span
                          className="h-2 w-2 rounded-full"
                          style={{ background: source.color }}
                        />
                        {source.label}
                      </span>
                      <span className="num text-muted">
                        {brl(source.value)} <span className="text-faint">/ {brl(source.target)}</span>
                      </span>
                    </div>
                    <Progress
                      value={source.value}
                      max={source.target || 1}
                      color={source.color}
                      height={5}
                      className="mt-1.5"
                    />
                  </div>
                ))}
              </div>
            </Panel>

            <Panel>
              <SectionHeader
                icon={GraduationCap}
                title="Estudo dos últimos 14 dias"
                description={`${(metrics.studies.weekMinutes / 60).toFixed(1)}h na semana`}
                action={
                  <Link to="/estudos">
                    <Button variant="ghost" size="sm" trailingIcon={ArrowUpRight}>
                      Detalhes
                    </Button>
                  </Link>
                }
              />
              <div className="mt-4">
                <TrendArea
                  data={metrics.studies.byDay.map((day) => ({
                    label: day.label,
                    minutos: day.minutes,
                  }))}
                  series={[{ key: "minutos", label: "Minutos", color: "var(--accent)" }]}
                  height={180}
                />
              </div>
              <div className="mt-4 grid grid-cols-3 gap-3">
                {[
                  { label: "Cursos ativos", value: num(metrics.studies.activeCourses) },
                  { label: "Concluídos", value: num(metrics.studies.completedCourses) },
                  { label: "Horas totais", value: `${num(metrics.studies.totalHours, 0)}h` },
                ].map((item) => (
                  <div key={item.label} className="rounded-xl border border-line bg-surface-2/50 p-3">
                    <p className="label-xs">{item.label}</p>
                    <p className="num mt-1 font-display text-base font-bold">{item.value}</p>
                  </div>
                ))}
              </div>
            </Panel>
          </div>

          {/* pipeline + tiktok */}
          <div className="grid gap-5 lg:grid-cols-2">
            <Panel>
              <SectionHeader
                icon={BarChart3}
                title="Pipeline de sites"
                description="Valor por etapa do funil"
                action={
                  <Link to="/sites">
                    <Button variant="ghost" size="sm" trailingIcon={ArrowUpRight}>
                      CRM
                    </Button>
                  </Link>
                }
              />
              <div className="mt-4 space-y-3">
                {data.leadStatuses.map((status) => {
                  const leads = data.leads.filter((lead) => lead.statusId === status.id);
                  const value = sum(leads.map((lead) => lead.value));
                  const total = sum(data.leads.map((lead) => lead.value)) || 1;
                  return (
                    <div key={status.id}>
                      <div className="flex items-center justify-between text-[11.5px]">
                        <span className="flex items-center gap-2 text-muted">
                          <span
                            className="h-2 w-2 rounded-full"
                            style={{ background: status.color }}
                          />
                          {status.name}
                          <span className="text-faint">
                            {leads.length} {leads.length === 1 ? "lead" : "leads"}
                          </span>
                        </span>
                        <span className="num text-muted">{brl(value)}</span>
                      </div>
                      <Progress
                        value={value}
                        max={total}
                        color={status.color}
                        height={6}
                        className="mt-1.5"
                      />
                    </div>
                  );
                })}
              </div>
            </Panel>

            <Panel>
              <SectionHeader
                icon={ShoppingBag}
                title="TikTok Shop"
                description="Vendas, estoque e conteúdo"
                action={
                  <Link to="/tiktok">
                    <Button variant="ghost" size="sm" trailingIcon={ArrowUpRight}>
                      Abrir
                    </Button>
                  </Link>
                }
              />
              <div className="mt-4 grid grid-cols-2 gap-3">
                {[
                  { label: "Faturamento", value: brl(metrics.tiktok.revenue) },
                  { label: "Lucro estimado", value: brl(metrics.tiktok.profit) },
                  { label: "Unidades vendidas", value: num(metrics.tiktok.unitsSold) },
                  { label: "Estoque (custo)", value: brl(metrics.tiktok.stockValue) },
                ].map((item) => (
                  <div key={item.label} className="rounded-2xl border border-line bg-surface-2/50 p-3.5">
                    <p className="label-xs">{item.label}</p>
                    <p className="num mt-1.5 font-display text-[15px] font-bold">{item.value}</p>
                  </div>
                ))}
              </div>
              {metrics.tiktok.lowStock.length > 0 && (
                <div className="mt-4 rounded-2xl border border-warning/30 bg-warning/10 p-3.5">
                  <p className="text-[12.5px] font-semibold text-warning">
                    {metrics.tiktok.lowStock.length} produto(s) com estoque baixo
                  </p>
                  <p className="mt-1 text-[11.5px] text-muted">
                    {metrics.tiktok.lowStock.map((product) => product.name).join(", ")}
                  </p>
                </div>
              )}
            </Panel>
          </div>
        </div>

        {/* ------------------------- COLUNA DIREITA ------------------------- */}
        <div className="space-y-5">
          <Panel>
            <SectionHeader
              icon={Target}
              title="Metas em andamento"
              description={`${activeGoals.length} ativas`}
              action={
                <Link to="/metas">
                  <Button variant="ghost" size="sm" trailingIcon={ArrowUpRight}>
                    Ver
                  </Button>
                </Link>
              }
            />
            <div className="mt-4 space-y-4">
              {activeGoals.slice(0, 4).map((goal) => {
                const percent = goal.target ? (goal.current / goal.target) * 100 : 0;
                const left = daysLeft(goal.deadline);
                return (
                  <div key={goal.id}>
                    <div className="flex items-start justify-between gap-3">
                      <p className="min-w-0 flex-1 truncate text-[13px] font-medium">{goal.title}</p>
                      <span className="num shrink-0 text-[11.5px] font-semibold text-muted">
                        {percent.toFixed(0)}%
                      </span>
                    </div>
                    <Progress value={percent} height={6} className="mt-2" />
                    <div className="mt-1.5 flex items-center justify-between text-[11px] text-faint">
                      <span className="num">
                        {goal.unit === "R$" ? brl(goal.current) : num(goal.current)} /{" "}
                        {goal.unit === "R$" ? brl(goal.target) : `${num(goal.target)} ${goal.unit}`}
                      </span>
                      <span className={cn(left !== null && left <= 7 && "text-warning")}>
                        {left === null
                          ? "sem prazo"
                          : left >= 0
                            ? `${left} dias restantes`
                            : `${Math.abs(left)} dias atrás`}
                      </span>
                    </div>
                  </div>
                );
              })}
              {activeGoals.length === 0 && (
                <EmptyState icon={Target} title="Nenhuma meta ativa" description="Defina objetivos por período para acompanhar a evolução." />
              )}
            </div>
          </Panel>

          <Panel>
            <SectionHeader
              icon={CalendarCheck}
              title="Hábitos de hoje"
              description={`${metrics.habits.todayDone} de ${metrics.habits.total} concluídos`}
              action={
                <Link to="/habitos">
                  <Button variant="ghost" size="sm" trailingIcon={ArrowUpRight}>
                    Abrir
                  </Button>
                </Link>
              }
            />
            <div className="mt-4 grid grid-cols-1 gap-2">
              {data.habits.map((habit) => {
                const checked = habit.logs.includes(today());
                return (
                  <button
                    key={habit.id}
                    type="button"
                    onClick={() =>
                      update("habits", habit.id, {
                        logs: checked
                          ? habit.logs.filter((log) => log !== today())
                          : [...habit.logs, today()],
                      })
                    }
                    className={cn(
                      "flex items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-all",
                      checked
                        ? "border-transparent bg-[color-mix(in_oklab,var(--accent)_16%,transparent)]"
                        : "border-line bg-surface-2/40 hover:border-accent/40",
                    )}
                  >
                    <span className="text-base">{habit.emoji}</span>
                    <span className="min-w-0 flex-1 truncate text-[12.5px] font-medium">
                      {habit.name}
                    </span>
                    <span
                      className={cn(
                        "grid h-5 w-5 shrink-0 place-items-center rounded-full border",
                        checked ? "accent-grad border-transparent text-white" : "border-line-strong",
                      )}
                    >
                      {checked && <CheckCircle2 className="h-3.5 w-3.5" />}
                    </span>
                  </button>
                );
              })}
            </div>
          </Panel>

          <Panel>
            <SectionHeader
              icon={CalendarClock}
              title="Próximos prazos"
              description="Tarefas, cursos, metas e entregas"
            />
            <ul className="mt-4 space-y-2">
              {upcoming.map((item) => {
                const left = daysLeft(item.date) ?? 0;
                return (
                  <li key={item.id}>
                    <Link
                      to={item.path}
                      className="flex items-center gap-3 rounded-xl border border-line bg-surface-2/40 px-3 py-2.5 transition-colors hover:border-accent/40"
                    >
                      <span
                        className={cn(
                          "num grid h-9 w-9 shrink-0 place-items-center rounded-xl border text-[12px] font-bold",
                          left <= 3
                            ? "border-danger/30 bg-danger/10 text-danger"
                            : left <= 7
                              ? "border-warning/30 bg-warning/10 text-warning"
                              : "border-line bg-surface-3 text-muted",
                        )}
                      >
                        {left}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[12.5px] font-medium">{item.label}</span>
                        <span className="text-[11px] text-faint">
                          {item.kind} · {fmtDate(item.date, "dd 'de' MMM")}
                        </span>
                      </span>
                    </Link>
                  </li>
                );
              })}
              {upcoming.length === 0 && (
                <li className="rounded-xl border border-dashed border-line-strong px-3 py-6 text-center text-[12px] text-faint">
                  Nada nos próximos 14 dias
                </li>
              )}
            </ul>
          </Panel>

          <Panel>
            <SectionHeader
              icon={Inbox}
              title="Últimas capturas"
              description={`${data.inbox.filter((i) => !i.processed).length} aguardando`}
              action={
                <Link to="/inbox">
                  <Button variant="ghost" size="sm" trailingIcon={ArrowUpRight}>
                    Processar
                  </Button>
                </Link>
              }
            />
            <ul className="mt-4 space-y-2">
              {data.inbox
                .filter((item) => !item.processed)
                .slice(0, 4)
                .map((item) => (
                  <li
                    key={item.id}
                    className="rounded-xl border border-line bg-surface-2/40 px-3 py-2.5"
                  >
                    <p className="flex items-start gap-2 text-[12.5px]">
                      <Lightbulb className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent" />
                      <span className="line-clamp-2">{item.text}</span>
                    </p>
                    <p className="mt-1 pl-5.5 text-[10.5px] text-faint">
                      {item.kind} · {relative(item.createdAt)}
                    </p>
                  </li>
                ))}
            </ul>
          </Panel>
        </div>
      </div>

      {/* --------------------------- ATALHOS --------------------------- */}
      <Panel>
        <SectionHeader
          icon={Sparkles}
          title="Atalhos rápidos"
          description="Todos os módulos da sua central"
        />
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {MODULES.filter((module) => module.id !== "dashboard").map((module) => {
            const Icon = module.icon;
            const disabled = settings.modules[module.id] === false;
            return (
              <Link
                key={module.id}
                to={module.path}
                className={cn(
                  "group flex items-center gap-3 rounded-2xl border border-line bg-surface-2/40 p-3.5 transition-all hover:-translate-y-0.5 hover:border-accent/40",
                  disabled && "opacity-50",
                )}
                style={module.accent ? { borderColor: `color-mix(in oklab, ${module.accent} 25%, var(--line))` } : undefined}
              >
                <span
                  className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border"
                  style={{
                    background: `color-mix(in oklab, ${module.accent ?? "var(--accent)"} 14%, transparent)`,
                    borderColor: `color-mix(in oklab, ${module.accent ?? "var(--accent)"} 26%, transparent)`,
                    color: module.accent ?? "var(--accent)",
                  }}
                >
                  <Icon className="h-4 w-4" />
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-[13px] font-semibold">{module.label}</span>
                  <span className="block truncate text-[11px] text-faint">{module.description}</span>
                </span>
                <ArrowUpRight className="ml-auto h-4 w-4 shrink-0 text-faint transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              </Link>
            );
          })}
        </div>
      </Panel>

      {/* -------------------------- ATIVIDADE -------------------------- */}
      <div className="grid gap-5 lg:grid-cols-3">
        <Panel className="lg:col-span-2">
          <SectionHeader
            icon={TrendingUp}
            title="Receita vs despesa"
            description="Últimos 6 meses consolidados"
            action={
              <Badge color={metrics.finance.profit >= 0 ? "var(--positive)" : "var(--danger)"}>
                {metrics.finance.profit >= 0 ? "Lucro" : "Prejuízo"} {brl(Math.abs(metrics.finance.profit))}
              </Badge>
            }
          />
          <div className="mt-4">
            <BarsGroup
              data={metrics.finance.series}
              series={[
                { key: "receita", label: "Receita", color: "var(--accent)", format: "currency" },
                { key: "despesa", label: "Despesa", color: "var(--danger)", format: "currency" },
              ]}
              height={250}
            />
          </div>
        </Panel>

        <Panel>
          <SectionHeader
            icon={Dumbbell}
            title="Treinos"
            description="Rotina física em dia"
            action={
              <Link to="/treinos">
                <Button variant="ghost" size="sm" trailingIcon={ArrowUpRight}>
                  Abrir
                </Button>
              </Link>
            }
          />
          <div className="mt-4 grid grid-cols-2 gap-3">
            {[
              { label: "Treinos no mês", value: num(metrics.training.monthSessions) },
              { label: "Minutos", value: num(metrics.training.monthMinutes) },
              { label: "Intensidade média", value: `${metrics.training.avgIntensity.toFixed(1)}/5` },
              { label: "Sequência", value: `${metrics.training.streak}d` },
            ].map((item) => (
              <div key={item.label} className="rounded-2xl border border-line bg-surface-2/50 p-3.5">
                <p className="label-xs">{item.label}</p>
                <p className="num mt-1.5 font-display text-[15px] font-bold">{item.value}</p>
              </div>
            ))}
          </div>
          <div className="mt-4">
            <BarsGroup
              data={metrics.training.byWeek}
              series={[{ key: "minutos", label: "Minutos", color: "var(--danger)" }]}
              height={150}
            />
          </div>
        </Panel>
      </div>

      {/* --------------------------- PRODUTOS --------------------------- */}
      <div className="grid gap-5 lg:grid-cols-2">
        <Panel>
          <SectionHeader icon={Cake} title="Deliveries" description="Srta Doçura e Srta das Massas" />
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {data.businesses.map((business) => {
              const orders = data.orders.filter((order) => order.businessId === business.id);
              const open = orders.filter((order) =>
                ["novo", "producao", "entrega"].includes(order.status),
              );
              const revenue = sum(
                orders
                  .filter((order) => order.status === "concluido")
                  .map((order) => sum(order.items.map((item) => item.qty * item.price))),
              );
              return (
                <Link
                  key={business.id}
                  to={business.id === "biz_docura" ? "/srta-docura" : "/srta-das-massas"}
                  className="group rounded-2xl border border-line bg-surface-2/40 p-4 transition-all hover:-translate-y-0.5"
                  style={{ borderColor: `color-mix(in oklab, ${business.color} 25%, var(--line))` }}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{business.emoji}</span>
                    <p className="text-[13.5px] font-semibold">{business.name}</p>
                  </div>
                  <p className="mt-2 text-[11.5px] text-faint">{business.tagline}</p>
                  <div className="mt-3 flex items-center justify-between text-[11.5px]">
                    <span className="text-muted">{open.length} em aberto</span>
                    <span className="num font-semibold" style={{ color: business.color }}>
                      {brl(revenue)}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
          <div className="mt-4 rounded-2xl border border-line bg-surface-2/40 p-4">
            <p className="label-xs mb-3">Faturamento por frente de renda</p>
            <Donut
              data={[
                {
                  label: "Sites",
                  value: sum(
                    metrics.finance.bySource.filter((s) => s.id === "src_sites").map((s) => s.value),
                  ),
                  color: "#8b5cf6",
                },
                {
                  label: "TikTok",
                  value: sum(
                    metrics.finance.bySource.filter((s) => s.id === "src_tiktok").map((s) => s.value),
                  ),
                  color: "#22d3ee",
                },
                {
                  label: "Doçura",
                  value: sum(
                    metrics.finance.bySource.filter((s) => s.id === "src_docura").map((s) => s.value),
                  ),
                  color: "#f43f5e",
                },
                {
                  label: "Massas",
                  value: sum(
                    metrics.finance.bySource.filter((s) => s.id === "src_massas").map((s) => s.value),
                  ),
                  color: "#f59e0b",
                },
              ]}
              height={220}
              format="currency"
            />
          </div>
        </Panel>

        <Panel>
          <SectionHeader
            icon={CheckCircle2}
            title="Concluídas nos últimos 7 dias"
            description={`${metrics.tasks.weekDone} tarefas finalizadas`}
          />
          <div className="mt-4">
            <BarsGroup
              data={metrics.tasks.byDay}
              series={[{ key: "concluidas", label: "Concluídas", color: "var(--positive)" }]}
              height={220}
            />
          </div>
          <div className="mt-4 grid grid-cols-3 gap-3">
            <div className="rounded-2xl border border-danger/25 bg-danger/10 p-3.5">
              <p className="label-xs">Urgentes</p>
              <p className="num mt-1 font-display text-base font-bold text-danger">
                {metrics.tasks.urgent}
              </p>
            </div>
            <div className="rounded-2xl border border-warning/25 bg-warning/10 p-3.5">
              <p className="label-xs">Atrasadas</p>
              <p className="num mt-1 font-display text-base font-bold text-warning">
                {metrics.tasks.overdue}
              </p>
            </div>
            <div className="rounded-2xl border border-line bg-surface-2/50 p-3.5">
              <p className="label-xs">Foco hoje</p>
              <p className="num mt-1 font-display text-base font-bold">
                {metrics.studies.todayMinutes}min
              </p>
            </div>
          </div>
          <div className="mt-4 flex items-center gap-3 rounded-2xl border border-line bg-surface-2/40 p-3.5">
            <TrendingDown className="h-4 w-4 shrink-0 text-faint" />
            <p className="text-[11.5px] text-muted">
              Conclusão de hábitos dos últimos 28 dias:{" "}
              <span className="num font-semibold text-ink">
                {metrics.habits.completionRate.toFixed(0)}%
              </span>{" "}
              · melhor sequência de {metrics.habits.bestStreak} dias
            </p>
          </div>
        </Panel>
      </div>
    </div>
  );
}
