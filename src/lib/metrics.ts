import { useMemo } from "react";
import { useApp } from "./store";
import type { AppData } from "./types";
import {
  clamp,
  currentMonth,
  fmtDate,
  iso,
  lastNDays,
  monthKey,
  monthLabel,
  sum,
  today,
} from "./utils";

export interface FinanceSummary {
  income: number;
  expense: number;
  profit: number;
  prevIncome: number;
  margin: number;
  bySource: Array<{ id: string; label: string; value: number; color: string; target: number }>;
  series: Array<{ label: string; receita: number; despesa: number; lucro: number }>;
}

export function financeSummary(data: AppData, months = 6): FinanceSummary {
  const month = currentMonth();
  const monthTx = data.transactions.filter((tx) => monthKey(tx.date) === month);
  const income = sum(monthTx.filter((tx) => tx.type === "receita").map((tx) => tx.amount));
  const expense = sum(monthTx.filter((tx) => tx.type === "despesa").map((tx) => tx.amount));

  const prev = new Date();
  prev.setDate(1);
  prev.setMonth(prev.getMonth() - 1);
  const prevKey = monthKey(prev);
  const prevIncome = sum(
    data.transactions
      .filter((tx) => tx.type === "receita" && monthKey(tx.date) === prevKey)
      .map((tx) => tx.amount),
  );

  const bySource = data.sources
    .map((source) => ({
      id: source.id,
      label: source.name,
      color: source.color,
      target: source.target,
      value: sum(
        monthTx
          .filter((tx) => tx.sourceId === source.id && tx.type === "receita")
          .map((tx) => tx.amount),
      ),
    }))
    .filter((item) => item.value > 0 || item.target > 0);

  const keys: string[] = [];
  const base = new Date();
  base.setDate(1);
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(base);
    d.setMonth(d.getMonth() - i);
    keys.push(monthKey(d));
  }

  const series = keys.map((key) => {
    const txs = data.transactions.filter((tx) => monthKey(tx.date) === key);
    const receita = sum(txs.filter((tx) => tx.type === "receita").map((tx) => tx.amount));
    const despesa = sum(txs.filter((tx) => tx.type === "despesa").map((tx) => tx.amount));
    return { label: monthLabel(key), receita, despesa, lucro: receita - despesa };
  });

  return {
    income,
    expense,
    profit: income - expense,
    prevIncome,
    margin: income > 0 ? ((income - expense) / income) * 100 : 0,
    bySource,
    series,
  };
}

export interface StudySummary {
  todayMinutes: number;
  weekMinutes: number;
  totalHours: number;
  activeCourses: number;
  completedCourses: number;
  averageProgress: number;
  byDay: Array<{ key: string; label: string; minutes: number }>;
  byWeek: Array<{ label: string; minutos: number; horas: number }>;
  heatmap: Array<{ key: string; value: number; label: string }>;
  topCourses: Array<{ id: string; name: string; color: string; percent: number; platform: string }>;
}

export function studySummary(data: AppData, heatDays = 84): StudySummary {
  const todayMinutes = sum(
    data.studySessions.filter((s) => s.date === today()).map((s) => s.minutes),
  );
  const days = lastNDays(7);
  const weekMinutes = sum(
    data.studySessions.filter((s) => days.includes(s.date)).map((s) => s.minutes),
  );
  const totalHours = sum(data.studySessions.map((s) => s.minutes)) / 60;

  const byDayMap = new Map<string, number>();
  data.studySessions.forEach((session) => {
    byDayMap.set(session.date, (byDayMap.get(session.date) ?? 0) + session.minutes);
  });

  const byDay = lastNDays(14).map((key) => ({
    key,
    label: key.slice(8, 10) + "/" + key.slice(5, 7),
    minutes: byDayMap.get(key) ?? 0,
  }));

  const byWeek: StudySummary["byWeek"] = [];
  for (let i = 7; i >= 0; i--) {
    const end = new Date();
    end.setDate(end.getDate() - i * 7);
    const window = lastNDays(7, end);
    const minutes = sum(window.map((day) => byDayMap.get(day) ?? 0));
    byWeek.push({ label: `S${8 - i}`, minutos: minutes, horas: Number((minutes / 60).toFixed(1)) });
  }

  const heatmap = lastNDays(heatDays).map((key) => {
    const minutes = byDayMap.get(key) ?? 0;
    return {
      key,
      value: minutes === 0 ? 0 : clamp(Math.ceil(minutes / 25), 1, 4),
      label: `${fmtDate(key)} · ${minutes}min`,
    };
  });

  const activeCourses = data.courses.filter((c) => c.status === "ativo").length;
  const completedCourses = data.courses.filter((c) => c.status === "concluido").length;
  const averageProgress = data.courses.length
    ? sum(
        data.courses.map((c) => (c.totalLessons ? (c.doneLessons / c.totalLessons) * 100 : 0)),
      ) / data.courses.length
    : 0;

  const topCourses = [...data.courses]
    .map((course) => ({
      id: course.id,
      name: course.name,
      platform: course.platform,
      color: course.color,
      percent: course.totalLessons ? (course.doneLessons / course.totalLessons) * 100 : 0,
    }))
    .sort((a, b) => b.percent - a.percent)
    .slice(0, 5);

  return {
    todayMinutes,
    weekMinutes,
    totalHours,
    activeCourses,
    completedCourses,
    averageProgress,
    byDay,
    byWeek,
    heatmap,
    topCourses,
  };
}

export interface TrainingSummary {
  monthSessions: number;
  monthMinutes: number;
  avgIntensity: number;
  streak: number;
  byWeek: Array<{ label: string; minutos: number; treinos: number }>;
  recent: Array<{ id: string; title: string; date: string; minutes: number; intensity: number }>;
  todayWorkoutId?: string;
}

export function trainingSummary(data: AppData): TrainingSummary {
  const month = currentMonth();
  const sessions = data.trainingSessions.filter((s) => monthKey(s.date) === month);
  const monthMinutes = sum(sessions.map((s) => s.minutes));
  const avgIntensity = sessions.length
    ? sum(sessions.map((s) => s.intensity)) / sessions.length
    : 0;

  const byWeek = Array.from({ length: 8 }).map((_, index) => {
    const i = 7 - index;
    const end = new Date();
    end.setDate(end.getDate() - i * 7);
    const window = lastNDays(7, end);
    const inWindow = data.trainingSessions.filter((s) => window.includes(s.date));
    return {
      label: `S${index + 1}`,
      minutos: sum(inWindow.map((s) => s.minutes)),
      treinos: inWindow.length,
    };
  });

  let streak = 0;
  const cursor = new Date();
  const activeDays = new Set(data.trainingSessions.map((s) => s.date));
  for (let i = 0; i < 90; i++) {
    const key = iso(cursor);
    const weekday = cursor.getDay();
    if (activeDays.has(key)) streak += 1;
    else if (weekday !== 0 && i > 0) break;
    cursor.setDate(cursor.getDate() - 1);
  }

  const recent = [...data.trainingSessions]
    .sort((a, b) => (a.date < b.date ? 1 : -1))
    .slice(0, 6)
    .map((s) => ({
      id: s.id,
      title: s.title,
      date: s.date,
      minutes: s.minutes,
      intensity: s.intensity,
    }));

  return {
    monthSessions: sessions.length,
    monthMinutes,
    avgIntensity,
    streak,
    byWeek,
    recent,
    todayWorkoutId: data.workouts.find((w) => w.weekday === new Date().getDay())?.id,
  };
}

export interface HabitSummary {
  todayDone: number;
  total: number;
  completionRate: number;
  currentStreak: number;
  bestStreak: number;
  byDay: Array<{ key: string; value: number; label: string }>;
}

export function habitSummary(data: AppData, days = 28): HabitSummary {
  const total = data.habits.length;
  const todayDone = data.habits.filter((h) => h.logs.includes(today())).length;
  const window = lastNDays(days);
  const possible = total * days;
  const done = sum(
    data.habits.map((habit) => habit.logs.filter((log) => window.includes(log)).length),
  );

  const byDay = lastNDays(days).map((key) => ({
    key,
    value: data.habits.filter((h) => h.logs.includes(key)).length,
    label: `${fmtDate(key)} · ${data.habits.filter((h) => h.logs.includes(key)).length}/${total}`,
  }));

  let currentStreak = 0;
  const cursor = new Date();
  for (let i = 0; i < 120; i++) {
    const key = iso(cursor);
    const hits = data.habits.filter((h) => h.logs.includes(key)).length;
    if (total > 0 && hits >= Math.max(1, Math.ceil(total / 2))) currentStreak += 1;
    else if (i > 0) break;
    cursor.setDate(cursor.getDate() - 1);
  }

  const bestStreak = data.habits.reduce((best, habit) => {
    const sorted = [...habit.logs].sort();
    let run = 0;
    let localBest = 0;
    let previous: string | null = null;
    sorted.forEach((log) => {
      if (previous) {
        const prevDate = new Date(previous + "T12:00:00");
        prevDate.setDate(prevDate.getDate() + 1);
        run = iso(prevDate) === log ? run + 1 : 1;
      } else {
        run = 1;
      }
      localBest = Math.max(localBest, run);
      previous = log;
    });
    return Math.max(best, localBest);
  }, 0);

  return {
    todayDone,
    total,
    completionRate: possible ? (done / possible) * 100 : 0,
    currentStreak,
    bestStreak,
    byDay,
  };
}

export interface TaskSummary {
  todayDone: number;
  todayPending: number;
  overdue: number;
  weekDone: number;
  urgent: number;
  byDay: Array<{ label: string; concluidas: number }>;
}

export function taskSummary(data: AppData): TaskSummary {
  const todayKey = today();
  const todayTasks = data.tasks.filter((t) => t.today || t.due === todayKey);
  const todayDone = todayTasks.filter((t) => t.done).length;
  const days = lastNDays(7);
  const doneByDay = new Map<string, number>();
  data.tasks
    .filter((task) => task.done && task.completedAt)
    .forEach((task) => {
      const key = String(task.completedAt).slice(0, 10);
      doneByDay.set(key, (doneByDay.get(key) ?? 0) + 1);
    });

  return {
    todayDone,
    todayPending: todayTasks.filter((t) => !t.done).length,
    overdue: data.tasks.filter((t) => !t.done && t.due && t.due < todayKey).length,
    urgent: data.tasks.filter((t) => !t.done && t.priority === "urgente").length,
    weekDone: sum(days.map((day) => doneByDay.get(day) ?? 0)),
    byDay: days.map((day) => ({
      label: ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"][new Date(day + "T12:00:00").getDay()],
      concluidas: doneByDay.get(day) ?? 0,
    })),
  };
}

export interface ScoreBreakdown {
  total: number;
  tasks: number;
  habits: number;
  study: number;
  finance: number;
}

export function useMetrics() {
  const { data } = useApp();
  return useMemo(() => {
    const finance = financeSummary(data);
    const studies = studySummary(data);
    const training = trainingSummary(data);
    const habits = habitSummary(data);
    const tasks = taskSummary(data);

    const taskRate =
      tasks.todayDone + tasks.todayPending > 0
        ? tasks.todayDone / (tasks.todayDone + tasks.todayPending)
        : 0.6;
    const habitRate = habits.total ? habits.todayDone / habits.total : 0;
    const studyRate = clamp(studies.todayMinutes / Math.max(data.settings.dailyFocusTarget, 30), 0, 1);
    const incomeTarget = sum(data.sources.map((s) => s.target));
    const financeRate = incomeTarget ? clamp(finance.income / incomeTarget, 0, 1) : 0;

    const score: ScoreBreakdown = {
      tasks: Math.round(taskRate * 100),
      habits: Math.round(habitRate * 100),
      study: Math.round(studyRate * 100),
      finance: Math.round(financeRate * 100),
      total: Math.round(
        taskRate * 32 + habitRate * 24 + studyRate * 24 + financeRate * 20,
      ),
    };

    const pipeline = {
      open: data.leads.filter((lead) => {
        const status = data.leadStatuses.find((s) => s.id === lead.statusId);
        return !status || status.kind === "aberto";
      }),
      won: data.leads.filter((lead) => {
        const status = data.leadStatuses.find((s) => s.id === lead.statusId);
        return status?.kind === "ganho";
      }),
      lost: data.leads.filter((lead) => {
        const status = data.leadStatuses.find((s) => s.id === lead.statusId);
        return status?.kind === "perdido";
      }),
    };

    const tiktok = {
      stockValue: sum(data.products.map((p) => p.stock * p.cost)),
      unitsSold: sum(data.products.map((p) => p.sold)),
      revenue: sum(data.products.map((p) => p.sold * p.price)),
      profit: sum(data.products.map((p) => p.sold * (p.price - p.cost))),
      views: sum(data.contents.map((c) => c.views)),
      published: data.contents.filter((c) => c.stage === "publicado").length,
      lowStock: data.products.filter((p) => p.active && p.stock <= 10),
    };

    return { finance, studies, training, habits, tasks, score, pipeline, tiktok };
  }, [data]);
}

export const currency = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value || 0);
