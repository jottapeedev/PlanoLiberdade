import { useMemo, useState } from "react";
import {
  ArrowDownRight,
  ArrowUpRight,
  Banknote,
  CalendarRange,
  Filter,
  Pencil,
  PiggyBank,
  Plus,
  Receipt,
  RefreshCw,
  Trash2,
  TrendingDown,
  TrendingUp,
  Wallet,
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
  SectionHeader,
  Select,
  StatCard,
  Switch,
  Textarea,
} from "../components/ui";
import { BarsGroup, Donut } from "../components/charts";
import { useApp } from "../lib/store";
import { useMetrics } from "../lib/metrics";
import {
  brl,
  cn,
  currentMonth,
  fmtDate,
  monthKey,
  monthLabel,
  num,
  pct,
  sum,
  today,
} from "../lib/utils";
import type { Transaction, TxType } from "../lib/types";

const EXPENSE_CATEGORIES = [
  "insumos",
  "ferramentas",
  "marketing",
  "transporte",
  "casa",
  "educação",
  "impostos",
  "outros",
];

const emptyTx = (): Transaction => ({
  id: `tx_${Date.now().toString(36)}`,
  type: "receita",
  amount: 0,
  category: "sites",
  sourceId: "src_sites",
  date: today(),
  note: "",
  recurring: false,
});

export default function Finance() {
  const { data, add, update, remove, notify } = useApp();
  const metrics = useMetrics();
  const [monthFilter, setMonthFilter] = useState(currentMonth());
  const [typeFilter, setTypeFilter] = useState<"todos" | TxType>("todos");
  const [editing, setEditing] = useState<Transaction | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const months = useMemo(() => {
    const set = new Set(data.transactions.map((tx) => monthKey(tx.date)));
    set.add(currentMonth());
    return Array.from(set).sort().reverse();
  }, [data.transactions]);

  const transactions = useMemo(
    () =>
      data.transactions
        .filter((tx) => monthKey(tx.date) === monthFilter)
        .filter((tx) => (typeFilter === "todos" ? true : tx.type === typeFilter))
        .sort((a, b) => (a.date < b.date ? 1 : -1)),
    [data.transactions, monthFilter, typeFilter],
  );

  const monthTotals = useMemo(() => {
    const txs = data.transactions.filter((tx) => monthKey(tx.date) === monthFilter);
    const income = sum(txs.filter((tx) => tx.type === "receita").map((tx) => tx.amount));
    const expense = sum(txs.filter((tx) => tx.type === "despesa").map((tx) => tx.amount));
    const days = new Set(txs.map((tx) => tx.date)).size || 1;
    return {
      income,
      expense,
      profit: income - expense,
      margin: income ? ((income - expense) / income) * 100 : 0,
      dailyAverage: income / days,
      projection: income + (income / days) * Math.max(30 - new Date().getDate(), 0),
    };
  }, [data.transactions, monthFilter]);

  const expenseByCategory = useMemo(() => {
    const map = new Map<string, number>();
    data.transactions
      .filter((tx) => tx.type === "despesa" && monthKey(tx.date) === monthFilter)
      .forEach((tx) => map.set(tx.category, (map.get(tx.category) ?? 0) + tx.amount));
    const colors = ["#f43f5e", "#fb923c", "#fbbf24", "#a78bfa", "#60a5fa", "#34d399"];
    return Array.from(map.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([label, value], index) => ({
        label,
        value,
        color: colors[index % colors.length],
      }));
  }, [data.transactions, monthFilter]);

  const saveTx = () => {
    if (!editing) return;
    if (!editing.amount || editing.amount <= 0) {
      notify({ title: "Informe um valor válido", tone: "error" });
      return;
    }
    if (data.transactions.some((tx) => tx.id === editing.id)) {
      update("transactions", editing.id, editing);
      notify({ title: "Lançamento atualizado", tone: "success" });
    } else {
      add("transactions", editing);
      notify({
        title: editing.type === "receita" ? "Receita registrada" : "Despesa registrada",
        description: brl(editing.amount),
        tone: "success",
      });
    }
    setEditing(null);
  };

  const sourceOptions = data.sources;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Consolidado financeiro"
        icon={Wallet}
        title="Finanças"
        description="Todas as frentes de renda em um só painel: sites, TikTok Shop e deliveries. Controle o que entra, o que sai e a margem real."
      >
        <Select
          value={monthFilter}
          onChange={(event) => setMonthFilter(event.target.value)}
          className="w-[170px]"
        >
          {months.map((month) => (
            <option key={month} value={month}>
              {monthLabel(month, false)}
            </option>
          ))}
        </Select>
        <Button icon={Plus} onClick={() => setEditing(emptyTx())}>
          Novo lançamento
        </Button>
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Receita do mês"
          value={brl(monthTotals.income)}
          icon={ArrowUpRight}
          hint={`projeção ${brl(monthTotals.projection)}`}
          tone="var(--positive)"
          delta={
            metrics.finance.prevIncome
              ? ((monthTotals.income - metrics.finance.prevIncome) / metrics.finance.prevIncome) * 100
              : undefined
          }
        />
        <StatCard
          label="Despesas do mês"
          value={brl(monthTotals.expense)}
          icon={ArrowDownRight}
          hint={`média diária ${brl(monthTotals.dailyAverage)}`}
          tone="var(--danger)"
        />
        <StatCard
          label="Lucro"
          value={brl(monthTotals.profit)}
          icon={PiggyBank}
          hint={`margem ${pct(monthTotals.margin)}`}
          tone={monthTotals.profit >= 0 ? "var(--accent)" : "var(--warning)"}
        />
        <StatCard
          label="Meta consolidada"
          value={`${((monthTotals.income / Math.max(sum(sourceOptions.map((s) => s.target)), 1)) * 100).toFixed(0)}%`}
          icon={TrendingUp}
          hint={`meta de ${brl(sum(sourceOptions.map((s) => s.target)))}`}
          tone="var(--accent-2)"
        />
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <Panel className="lg:col-span-2">
          <SectionHeader
            icon={TrendingUp}
            title="Receita vs despesa"
            description="Últimos 6 meses"
            action={
              <Badge color={metrics.finance.profit >= 0 ? "var(--positive)" : "var(--danger)"} dot>
                {metrics.finance.profit >= 0 ? "Superávit" : "Déficit"} no mês
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
              height={260}
            />
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            {[
              { label: "Melhor mês", value: brl(Math.max(...metrics.finance.series.map((s) => s.receita))) },
              {
                label: "Média mensal",
                value: brl(sum(metrics.finance.series.map((s) => s.receita)) / metrics.finance.series.length),
              },
              {
                label: "Despesa média",
                value: brl(sum(metrics.finance.series.map((s) => s.despesa)) / metrics.finance.series.length),
              },
            ].map((item) => (
              <div key={item.label} className="rounded-2xl border border-line bg-surface-2/40 p-3.5">
                <p className="label-xs">{item.label}</p>
                <p className="num mt-1.5 font-display text-[15px] font-bold">{item.value}</p>
              </div>
            ))}
          </div>
        </Panel>

        <Panel>
          <SectionHeader icon={Receipt} title="Despesas por categoria" description={monthLabel(monthFilter, false)} />
          <div className="mt-3">
            <Donut data={expenseByCategory} height={240} format="currency" centerLabel={brl(monthTotals.expense)} centerSub="total" />
          </div>
        </Panel>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.6fr_1fr]">
        <Panel padded={false} className="p-4 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <SectionHeader
              icon={Banknote}
              title="Lançamentos"
              description={`${transactions.length} registros em ${monthLabel(monthFilter, false)}`}
            />
            <div className="flex items-center gap-2">
              <Filter className="h-3.5 w-3.5 text-faint" />
              <Select
                value={typeFilter}
                onChange={(event) => setTypeFilter(event.target.value as typeof typeFilter)}
                className="w-[140px]"
              >
                <option value="todos">Todos</option>
                <option value="receita">Receitas</option>
                <option value="despesa">Despesas</option>
              </Select>
            </div>
          </div>

          <ul className="mt-4 space-y-2">
            {transactions.map((tx) => {
              const source = data.sources.find((item) => item.id === tx.sourceId);
              const isIncome = tx.type === "receita";
              return (
                <li
                  key={tx.id}
                  className="group flex items-center gap-3 rounded-2xl border border-line bg-surface-2/40 px-3.5 py-3 transition-colors hover:border-accent/40"
                >
                  <span
                    className={cn(
                      "grid h-9 w-9 shrink-0 place-items-center rounded-xl border",
                      isIncome ? "border-positive/30 bg-positive/10 text-positive" : "border-danger/30 bg-danger/10 text-danger",
                    )}
                  >
                    {isIncome ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-medium capitalize">
                      {source?.name ?? tx.category}
                    </p>
                    <p className="mt-0.5 flex flex-wrap items-center gap-2 text-[11px] text-faint">
                      <span>{fmtDate(tx.date, "dd/MM/yy")}</span>
                      <span>· {tx.category}</span>
                      {tx.recurring && (
                        <span className="inline-flex items-center gap-1">
                          · <RefreshCw className="h-3 w-3" /> recorrente
                        </span>
                      )}
                      {tx.note && <span className="truncate">· {tx.note}</span>}
                    </p>
                  </div>
                  <span
                    className={cn(
                      "num shrink-0 text-[13px] font-bold",
                      isIncome ? "text-positive" : "text-danger",
                    )}
                  >
                    {isIncome ? "+" : "−"} {brl(tx.amount)}
                  </span>
                  <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100 max-sm:opacity-100">
                    <Button size="xs" variant="ghost" icon={Pencil} onClick={() => setEditing(tx)} />
                    <Button
                      size="xs"
                      variant="ghost"
                      icon={Trash2}
                      className="text-danger"
                      onClick={() => setConfirmId(tx.id)}
                    />
                  </div>
                </li>
              );
            })}
            {transactions.length === 0 && (
              <li>
                <EmptyState
                  icon={Wallet}
                  title="Nenhum lançamento neste mês"
                  description="Registre receitas e despesas para acompanhar sua margem real por frente de renda."
                  action={<Button icon={Plus} onClick={() => setEditing(emptyTx())}>Novo lançamento</Button>}
                />
              </li>
            )}
          </ul>
        </Panel>

        <div className="space-y-5">
          <Panel>
            <SectionHeader icon={CalendarRange} title="Metas por fonte" description={`Progresso em ${monthLabel(monthFilter)}`} />
            <div className="mt-4 space-y-4">
              {metrics.finance.bySource.map((source) => (
                <div key={source.id}>
                  <div className="flex items-center justify-between text-[11.5px]">
                    <span className="flex items-center gap-2 text-muted">
                      <span className="h-2 w-2 rounded-full" style={{ background: source.color }} />
                      {source.label}
                    </span>
                    <span className="num text-muted">
                      {brl(source.value)} <span className="text-faint">/ {brl(source.target)}</span>
                    </span>
                  </div>
                  <Progress value={source.value} max={source.target || 1} color={source.color} height={6} className="mt-1.5" />
                </div>
              ))}
            </div>
          </Panel>

          <Panel>
            <SectionHeader icon={TrendingDown} title="Saúde financeira" description="Indicadores do mês" />
            <div className="mt-4 space-y-3">
              {[
                { label: "Receita média por dia útil", value: brl(monthTotals.dailyAverage) },
                { label: "Projeção para o fim do mês", value: brl(monthTotals.projection) },
                { label: "Margem atual", value: pct(monthTotals.margin) },
                {
                  label: "Custo fixo estimado",
                  value: brl(
                    sum(
                      data.transactions
                        .filter((tx) => tx.type === "despesa" && tx.recurring)
                        .map((tx) => tx.amount),
                    ) / Math.max(metrics.finance.series.length, 1),
                  ),
                },
                { label: "Lançamentos no mês", value: num(transactions.length) },
              ].map((item) => (
                <div
                  key={item.label}
                  className="flex items-center justify-between rounded-xl border border-line bg-surface-2/40 px-3.5 py-2.5"
                >
                  <span className="text-[12px] text-muted">{item.label}</span>
                  <span className="num text-[12.5px] font-semibold">{item.value}</span>
                </div>
              ))}
            </div>
          </Panel>

          <Panel>
            <SectionHeader icon={PiggyBank} title="Distribuição de lucro" description="Sugestão de alocação" />
            <div className="mt-4 space-y-4">
              {[
                { label: "Reinvestimento no negócio", percent: 40, color: "var(--accent)" },
                { label: "Reserva de emergência", percent: 30, color: "var(--positive)" },
                { label: "Pró-labore", percent: 20, color: "var(--accent-2)" },
                { label: "Lazer e desenvolvimento", percent: 10, color: "var(--warning)" },
              ].map((item) => (
                <div key={item.label}>
                  <div className="flex items-center justify-between text-[11.5px]">
                    <span className="text-muted">{item.label}</span>
                    <span className="num font-semibold">{brl((monthTotals.profit * item.percent) / 100)}</span>
                  </div>
                  <Progress value={item.percent} max={100} color={item.color} height={5} className="mt-1.5" />
                </div>
              ))}
            </div>
            <p className="mt-4 text-[11.5px] text-faint">
              Baseado no lucro de {brl(monthTotals.profit)} deste mês. Ajuste os percentuais conforme seus
              objetivos.
            </p>
          </Panel>
        </div>
      </div>

      <Modal
        open={Boolean(editing)}
        onClose={() => setEditing(null)}
        title={data.transactions.some((tx) => tx.id === editing?.id) ? "Editar lançamento" : "Novo lançamento"}
        size="lg"
        footer={
          <>
            <Button variant="ghost" onClick={() => setEditing(null)}>
              Cancelar
            </Button>
            <Button onClick={saveTx}>Salvar</Button>
          </>
        }
      >
        {editing && (
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Tipo">
              <Select
                value={editing.type}
                onChange={(event) => {
                  const type = event.target.value as TxType;
                  setEditing({
                    ...editing,
                    type,
                    sourceId: type === "receita" ? editing.sourceId ?? "src_sites" : undefined,
                    category: type === "despesa" ? "insumos" : "sites",
                  });
                }}
              >
                <option value="receita">Receita</option>
                <option value="despesa">Despesa</option>
              </Select>
            </Field>
            <Field label="Valor (R$)">
              <Input
                type="number"
                value={editing.amount}
                onChange={(event) => setEditing({ ...editing, amount: Number(event.target.value) })}
              />
            </Field>
            {editing.type === "receita" ? (
              <Field label="Fonte de renda">
                <Select
                  value={editing.sourceId ?? ""}
                  onChange={(event) =>
                    setEditing({
                      ...editing,
                      sourceId: event.target.value || undefined,
                      category: sourceOptions.find((source) => source.id === event.target.value)?.kind ?? editing.category,
                    })
                  }
                >
                  <option value="">Sem fonte definida</option>
                  {sourceOptions.map((source) => (
                    <option key={source.id} value={source.id}>
                      {source.name}
                    </option>
                  ))}
                </Select>
              </Field>
            ) : (
              <Field label="Categoria">
                <Select
                  value={editing.category}
                  onChange={(event) => setEditing({ ...editing, category: event.target.value })}
                >
                  {EXPENSE_CATEGORIES.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </Select>
              </Field>
            )}
            <Field label="Data">
              <Input
                type="date"
                value={editing.date}
                onChange={(event) => setEditing({ ...editing, date: event.target.value })}
              />
            </Field>
            <Field label="Observação" className="sm:col-span-2">
              <Textarea
                value={editing.note ?? ""}
                onChange={(event) => setEditing({ ...editing, note: event.target.value })}
                placeholder="Detalhe do lançamento, cliente, nota fiscal…"
                className="min-h-[70px]"
              />
            </Field>
            <div className="sm:col-span-2 rounded-2xl border border-line bg-surface-2/40 p-3.5">
              <Switch
                checked={editing.recurring}
                onChange={(checked) => setEditing({ ...editing, recurring: checked })}
                label="Lançamento recorrente"
                hint="Marque para despesas fixas ou receitas previsíveis."
              />
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={Boolean(confirmId)}
        title="Excluir lançamento"
        description="O registro sairá do histórico financeiro."
        confirmLabel="Excluir"
        onCancel={() => setConfirmId(null)}
        onConfirm={() => {
          if (confirmId) remove("transactions", confirmId);
          notify({ title: "Lançamento excluído" });
        }}
      />
    </div>
  );
}
