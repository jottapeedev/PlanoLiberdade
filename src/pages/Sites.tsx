import { useMemo, useState } from "react";
import {
  ArrowUpRight,
  BarChart3,
  Building2,
  Columns,
  DollarSign,
  Mail,
  Pencil,
  Phone,
  Plus,
  Rows,
  Settings2,
  Target,
  Trash2,
  Trophy,
  User,
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
  SegmentedControl,
  Select,
  StatCard,
  Textarea,
} from "../components/ui";
import { Kanban, type KanbanChange } from "../components/Kanban";
import { useApp } from "../lib/store";
import { useMetrics } from "../lib/metrics";
import { brl, cn, currentMonth, fmtDate, monthKey, num, sum, today } from "../lib/utils";
import type { Lead, LeadStatus } from "../lib/types";

const SOURCES = ["Indicação", "Instagram", "Google", "TikTok", "Prospecção ativa", "Outro"];

const emptyLead = (statusId: string, order: number): Lead => ({
  id: `lead_${Date.now().toString(36)}`,
  name: "",
  company: "",
  contact: "",
  value: 0,
  mrr: 0,
  statusId,
  source: "Indicação",
  notes: "",
  nextStep: "",
  order,
  createdAt: today(),
});

export default function Sites() {
  const { data, add, update, remove, notify } = useApp();
  const metrics = useMetrics();
  const [view, setView] = useState<"kanban" | "lista">("kanban");
  const [editing, setEditing] = useState<Lead | null>(null);
  const [statusModal, setStatusModal] = useState(false);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const statuses = useMemo(
    () => [...data.leadStatuses].sort((a, b) => a.order - b.order),
    [data.leadStatuses],
  );

  const stats = useMemo(() => {
    const openValue = sum(metrics.pipeline.open.map((lead) => lead.value));
    const won = metrics.pipeline.won;
    const lost = metrics.pipeline.lost;
    const wonThisMonth = won.filter((lead) => monthKey(lead.createdAt) === currentMonth());
    const conversion = won.length + lost.length > 0
      ? (won.length / (won.length + lost.length)) * 100
      : 0;
    const avgTicket = data.leads.length ? sum(data.leads.map((l) => l.value)) / data.leads.length : 0;
    return {
      openValue,
      wonValue: sum(won.map((lead) => lead.value)),
      wonThisMonth: sum(wonThisMonth.map((lead) => lead.value)),
      conversion,
      avgTicket,
      mrr: sum(data.leads.map((lead) => lead.mrr ?? 0)),
    };
  }, [data.leads, metrics.pipeline]);

  const handleKanbanChange = (changes: KanbanChange[]) => {
    changes.forEach((change) =>
      update("leads", change.id, { statusId: change.columnId, order: change.order }),
    );
  };

  const saveLead = () => {
    if (!editing) return;
    if (!editing.name.trim()) {
      notify({ title: "Nome obrigatório", description: "Informe o nome do lead.", tone: "error" });
      return;
    }
    const exists = data.leads.some((lead) => lead.id === editing.id);
    if (exists) {
      update("leads", editing.id, editing);
      notify({ title: "Lead atualizado", tone: "success" });
    } else {
      add("leads", editing);
      notify({ title: "Lead criado", description: editing.name, tone: "success" });
    }
    setEditing(null);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="CRM de sites"
        icon={BarChart3}
        title="Pipeline comercial"
        description="Acompanhe cada oportunidade da prospecção ao fechamento. Arraste os cards entre as etapas para atualizar o estágio."
      >
        <Button variant="secondary" icon={Settings2} onClick={() => setStatusModal(true)}>
          Editar etapas
        </Button>
        <Button
          icon={Plus}
          onClick={() => setEditing(emptyLead(statuses[0]?.id ?? "status_novo", 0))}
        >
          Novo lead
        </Button>
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Pipeline em aberto"
          value={brl(stats.openValue)}
          icon={Target}
          hint={`${metrics.pipeline.open.length} oportunidades`}
          tone="var(--info)"
        />
        <StatCard
          label="Fechado no mês"
          value={brl(stats.wonThisMonth)}
          icon={Trophy}
          hint={`${metrics.pipeline.won.length} clientes no total`}
          tone="var(--positive)"
        />
        <StatCard
          label="Taxa de conversão"
          value={`${stats.conversion.toFixed(0)}%`}
          icon={ArrowUpRight}
          hint={`${metrics.pipeline.lost.length} perdidos`}
          tone="var(--accent)"
        />
        <StatCard
          label="Ticket médio"
          value={brl(stats.avgTicket)}
          icon={DollarSign}
          hint={`MRR contratos: ${brl(stats.mrr)}`}
          tone="var(--accent-2)"
        />
      </div>

      <Panel padded={false} className="p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <SectionHeader
            icon={Columns}
            title="Funil de vendas"
            description="Clique em um card para editar ou arraste para mudar a etapa"
          />
          <SegmentedControl
            value={view}
            onChange={setView}
            options={[
              { value: "kanban", label: "Kanban", icon: Columns },
              { value: "lista", label: "Lista", icon: Rows },
            ]}
          />
        </div>

        {view === "kanban" ? (
          <div className="mt-5">
            <Kanban
              items={data.leads}
              columns={statuses.map((status) => ({
                id: status.id,
                name: status.name,
                color: status.color,
              }))}
              getColumnId={(lead) => lead.statusId}
              onChange={handleKanbanChange}
              onCardClick={(lead) => setEditing(lead)}
              onAdd={(columnId) =>
                setEditing(emptyLead(columnId, data.leads.filter((l) => l.statusId === columnId).length))
              }
              renderCard={(lead) => (
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-[13px] leading-tight font-semibold">{lead.name}</p>
                    <span className="num shrink-0 text-[12px] font-bold text-accent">
                      {brl(lead.value)}
                    </span>
                  </div>
                  {lead.company && (
                    <p className="mt-1 flex items-center gap-1.5 text-[11px] text-faint">
                      <Building2 className="h-3 w-3" />
                      {lead.company}
                    </p>
                  )}
                  {lead.nextStep && (
                    <p className="mt-2 rounded-lg border border-line bg-surface/60 px-2 py-1.5 text-[11px] text-muted">
                      {lead.nextStep}
                    </p>
                  )}
                  <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                    <Badge className="px-2 py-0.5 text-[10px]">{lead.source}</Badge>
                    {lead.mrr ? (
                      <Badge color="var(--positive)" className="px-2 py-0.5 text-[10px]">
                        MRR {brl(lead.mrr)}
                      </Badge>
                    ) : null}
                    <span className="ml-auto text-[10px] text-faint">{fmtDate(lead.createdAt)}</span>
                  </div>
                </div>
              )}
            />
          </div>
        ) : (
          <div className="mt-5 overflow-x-auto">
            <table className="w-full min-w-[720px] border-separate border-spacing-0 text-left">
              <thead>
                <tr className="text-[11px] text-faint">
                  {["Lead", "Etapa", "Origem", "Valor", "Próximo passo", "Criado", ""].map((header) => (
                    <th key={header} className="border-b border-line px-3 pb-2 font-semibold">
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[...data.leads]
                  .sort((a, b) => b.value - a.value)
                  .map((lead) => {
                    const status = statuses.find((item) => item.id === lead.statusId);
                    return (
                      <tr key={lead.id} className="group transition-colors hover:bg-surface-2/50">
                        <td className="border-b border-line px-3 py-3">
                          <p className="text-[13px] font-medium">{lead.name}</p>
                          <p className="text-[11px] text-faint">{lead.company}</p>
                        </td>
                        <td className="border-b border-line px-3 py-3">
                          <Badge color={status?.color}>{status?.name ?? "—"}</Badge>
                        </td>
                        <td className="border-b border-line px-3 py-3 text-[12.5px] text-muted">
                          {lead.source}
                        </td>
                        <td className="num border-b border-line px-3 py-3 text-[12.5px] font-semibold">
                          {brl(lead.value)}
                        </td>
                        <td className="border-b border-line px-3 py-3 text-[12px] text-muted">
                          {lead.nextStep || "—"}
                        </td>
                        <td className="border-b border-line px-3 py-3 text-[11.5px] text-faint">
                          {fmtDate(lead.createdAt, "dd/MM/yy")}
                        </td>
                        <td className="border-b border-line px-3 py-3">
                          <div className="flex items-center justify-end gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                            <Button size="xs" variant="ghost" icon={Pencil} onClick={() => setEditing(lead)} />
                            <Button
                              size="xs"
                              variant="ghost"
                              icon={Trash2}
                              className="text-danger"
                              onClick={() => setConfirmId(lead.id)}
                            />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
            {data.leads.length === 0 && (
              <EmptyState icon={Target} title="Nenhum lead cadastrado" description="Adicione sua primeira oportunidade para começar a acompanhar o funil." />
            )}
          </div>
        )}
      </Panel>

      <div className="grid gap-5 lg:grid-cols-3">
        <Panel className="lg:col-span-2">
          <SectionHeader
            icon={BarChart3}
            title="Distribuição por etapa"
            description="Quantidade e valor acumulado em cada fase"
          />
          <div className="mt-5 space-y-4">
            {statuses.map((status) => {
              const leads = data.leads.filter((lead) => lead.statusId === status.id);
              const value = sum(leads.map((lead) => lead.value));
              const total = sum(data.leads.map((lead) => lead.value)) || 1;
              return (
                <div key={status.id}>
                  <div className="flex items-center justify-between text-[12px]">
                    <span className="flex items-center gap-2 font-medium">
                      <span className="h-2 w-2 rounded-full" style={{ background: status.color }} />
                      {status.name}
                    </span>
                    <span className="num text-muted">
                      {leads.length} · {brl(value)}
                    </span>
                  </div>
                  <Progress value={value} max={total} color={status.color} className="mt-2" height={7} />
                </div>
              );
            })}
          </div>
        </Panel>

        <Panel>
          <SectionHeader icon={User} title="Origem dos leads" description="Onde estão nascendo as oportunidades" />
          <div className="mt-4 space-y-3">
            {Array.from(new Set(data.leads.map((lead) => lead.source))).map((source) => {
              const leads = data.leads.filter((lead) => lead.source === source);
              return (
                <div key={source} className="flex items-center justify-between rounded-xl border border-line bg-surface-2/40 px-3.5 py-2.5">
                  <span className="text-[12.5px] text-muted">{source}</span>
                  <span className="flex items-center gap-2">
                    <span className="num text-[12.5px] font-semibold">{leads.length}</span>
                    <span className="num text-[11px] text-faint">{brl(sum(leads.map((l) => l.value)))}</span>
                  </span>
                </div>
              );
            })}
          </div>
          <div className="mt-4 rounded-2xl border border-line bg-surface-2/40 p-3.5">
            <p className="text-[11.5px] text-muted">
              Leads ativos por etapa somam{" "}
              <span className="num font-semibold text-ink">{brl(stats.openValue)}</span>. Foque em
              propostas paradas há mais de 7 dias.
            </p>
          </div>
        </Panel>
      </div>

      {/* ------------------------------ modais ------------------------------ */}
      <Modal
        open={Boolean(editing)}
        onClose={() => setEditing(null)}
        title={data.leads.some((lead) => lead.id === editing?.id) ? "Editar lead" : "Novo lead"}
        description="Dados comerciais e próximo passo do atendimento."
        size="lg"
        footer={
          <>
            <Button variant="ghost" onClick={() => setEditing(null)}>
              Cancelar
            </Button>
            <Button onClick={saveLead}>Salvar lead</Button>
          </>
        }
      >
        {editing && (
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Nome / contato" className="sm:col-span-1">
              <Input
                value={editing.name}
                onChange={(event) => setEditing({ ...editing, name: event.target.value })}
                placeholder="Ex: Padaria Pão Dourado"
              />
            </Field>
            <Field label="Empresa">
              <Input
                value={editing.company ?? ""}
                onChange={(event) => setEditing({ ...editing, company: event.target.value })}
                placeholder="Razão social ou nome fantasia"
              />
            </Field>
            <Field label="Telefone / WhatsApp">
              <Input
                value={editing.contact ?? ""}
                onChange={(event) => setEditing({ ...editing, contact: event.target.value })}
                placeholder="(11) 90000-0000"
              />
            </Field>
            <Field label="Origem do lead">
              <Select
                value={editing.source}
                onChange={(event) => setEditing({ ...editing, source: event.target.value })}
              >
                {SOURCES.map((source) => (
                  <option key={source} value={source}>
                    {source}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Valor do projeto (R$)">
              <Input
                type="number"
                value={editing.value}
                onChange={(event) => setEditing({ ...editing, value: Number(event.target.value) })}
              />
            </Field>
            <Field label="Recorrência mensal (R$)">
              <Input
                type="number"
                value={editing.mrr ?? 0}
                onChange={(event) => setEditing({ ...editing, mrr: Number(event.target.value) })}
              />
            </Field>
            <Field label="Etapa do funil">
              <Select
                value={editing.statusId}
                onChange={(event) => setEditing({ ...editing, statusId: event.target.value })}
              >
                {statuses.map((status) => (
                  <option key={status.id} value={status.id}>
                    {status.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Próximo passo">
              <Input
                value={editing.nextStep ?? ""}
                onChange={(event) => setEditing({ ...editing, nextStep: event.target.value })}
                placeholder="Ex: enviar proposta com 2 opções"
              />
            </Field>
            <Field label="Anotações" className="sm:col-span-2">
              <Textarea
                value={editing.notes ?? ""}
                onChange={(event) => setEditing({ ...editing, notes: event.target.value })}
                placeholder="Contexto da negociação, dores do cliente, objeções…"
              />
            </Field>
            <div className="flex flex-wrap items-center gap-3 sm:col-span-2">
              {editing.contact && (
                <Badge dot>
                  <Phone className="h-3 w-3" /> {editing.contact}
                </Badge>
              )}
              <Badge dot>
                <Mail className="h-3 w-3" /> atualizado em {fmtDate(today())}
              </Badge>
            </div>
          </div>
        )}
      </Modal>

      <StatusManager open={statusModal} onClose={() => setStatusModal(false)} />

      <ConfirmDialog
        open={Boolean(confirmId)}
        title="Excluir lead"
        description="Todo o histórico deste lead será removido."
        confirmLabel="Excluir"
        onCancel={() => setConfirmId(null)}
        onConfirm={() => {
          if (confirmId) remove("leads", confirmId);
          notify({ title: "Lead excluído" });
        }}
      />
    </div>
  );
}

function StatusManager({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { data, add, update, remove, notify } = useApp();
  const statuses = [...data.leadStatuses].sort((a, b) => a.order - b.order);

  const move = (status: LeadStatus, direction: -1 | 1) => {
    const index = statuses.findIndex((item) => item.id === status.id);
    const swapWith = statuses[index + direction];
    if (!swapWith) return;
    update("leadStatuses", status.id, { order: swapWith.order });
    update("leadStatuses", swapWith.id, { order: status.order });
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Etapas do funil"
      description="Personalize os estágios do seu processo comercial."
      footer={
        <>
          <Button
            variant="secondary"
            icon={Plus}
            onClick={() => {
              add("leadStatuses", {
                id: `status_${Date.now().toString(36)}`,
                name: "Nova etapa",
                color: "#8b5cf6",
                order: statuses.length,
                kind: "aberto",
              });
              notify({ title: "Etapa criada", tone: "success" });
            }}
          >
            Adicionar etapa
          </Button>
          <Button onClick={onClose}>Concluir</Button>
        </>
      }
    >
      <ul className="space-y-2">
        {statuses.map((status, index) => {
          const count = data.leads.filter((lead) => lead.statusId === status.id).length;
          return (
            <li
              key={status.id}
              className="flex flex-wrap items-center gap-2 rounded-2xl border border-line bg-surface-2/40 p-3"
            >
              <input
                type="color"
                value={status.color}
                onChange={(event) => update("leadStatuses", status.id, { color: event.target.value })}
                className="h-9 w-9 shrink-0 cursor-pointer rounded-lg border border-line bg-transparent"
              />
              <input
                value={status.name}
                onChange={(event) => update("leadStatuses", status.id, { name: event.target.value })}
                className="h-9 min-w-[140px] flex-1 rounded-xl border border-line bg-surface-2/70 px-3 text-[13px] outline-none focus:border-accent/60"
              />
              <Select
                value={status.kind ?? "aberto"}
                onChange={(event) =>
                  update("leadStatuses", status.id, {
                    kind: event.target.value as LeadStatus["kind"],
                  })
                }
                className="w-[136px]"
              >
                <option value="aberto">Em aberto</option>
                <option value="ganho">Ganho</option>
                <option value="perdido">Perdido</option>
              </Select>
              <Badge className="hidden sm:inline-flex">{num(count)} leads</Badge>
              <div className="flex items-center gap-0.5">
                <Button size="xs" variant="ghost" icon={ArrowUpRight} className="rotate-[-45deg]" onClick={() => move(status, -1)} disabled={index === 0} />
                <Button size="xs" variant="ghost" icon={ArrowUpRight} className="rotate-45" onClick={() => move(status, 1)} disabled={index === statuses.length - 1} />
                <Button
                  size="xs"
                  variant="ghost"
                  icon={Trash2}
                  className={cn("text-danger", count > 0 && "opacity-40")}
                  disabled={count > 0}
                  onClick={() => {
                    remove("leadStatuses", status.id);
                    notify({ title: "Etapa removida" });
                  }}
                />
              </div>
            </li>
          );
        })}
      </ul>
      <p className="mt-4 text-[11.5px] text-faint">
        Etapas com leads vinculados não podem ser excluídas — mova os cards primeiro.
      </p>
    </Modal>
  );
}
