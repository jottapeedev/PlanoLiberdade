import { useMemo, useState } from "react";
import {
  BadgeCheck,
  Bike,
  CalendarClock,
  ChefHat,
  CircleDollarSign,
  ClipboardList,
  Instagram,
  Package,
  Pencil,
  Phone,
  Plus,
  ShoppingCart,
  Trash2,
  TrendingUp,
  Truck,
  Users,
  UtensilsCrossed,
  X,
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
import { Kanban, type KanbanChange } from "../components/Kanban";
import { useApp } from "../lib/store";
import {
  brl,
  cn,
  currentMonth,
  fmtDate,
  lastNDays,
  monthKey,
  num,
  sum,
  today,
} from "../lib/utils";
import type { Order, OrderItem, OrderStatus, Product } from "../lib/types";

const STATUSES: Array<{ id: OrderStatus; name: string; color: string }> = [
  { id: "novo", name: "Novo pedido", color: "#60a5fa" },
  { id: "producao", name: "Em produção", color: "#fbbf24" },
  { id: "entrega", name: "Saiu para entrega", color: "#a78bfa" },
  { id: "concluido", name: "Concluído", color: "#34d399" },
  { id: "cancelado", name: "Cancelado", color: "#fb7185" },
];

const CHANNELS: Array<{ value: Order["channel"]; label: string; icon: typeof Instagram }> = [
  { value: "whatsapp", label: "WhatsApp", icon: Phone },
  { value: "instagram", label: "Instagram", icon: Instagram },
  { value: "ifood", label: "iFood", icon: Bike },
  { value: "presencial", label: "Presencial", icon: UtensilsCrossed },
];

const orderTotal = (order: Order) =>
  sum(order.items.map((item) => item.qty * item.price));

export default function BusinessPage({ businessId }: { businessId: string }) {
  const { data, add, update, remove, notify } = useApp();
  const [editing, setEditing] = useState<Order | null>(null);
  const [menuItem, setMenuItem] = useState<Product | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const business = data.businesses.find((item) => item.id === businessId) ?? data.businesses[0];
  const accent = business?.color ?? "var(--accent)";

  const orders = useMemo(
    () => data.orders.filter((order) => order.businessId === businessId),
    [businessId, data.orders],
  );

  const menu = useMemo(
    () => data.products.filter((product) => product.businessId === businessId),
    [businessId, data.products],
  );

  const stats = useMemo(() => {
    const month = currentMonth();
    const monthOrders = orders.filter((order) => monthKey(order.createdAt) === month);
    const done = orders.filter((order) => order.status === "concluido");
    const revenue = sum(done.map(orderTotal));
    const monthRevenue = sum(
      monthOrders.filter((order) => order.status === "concluido").map(orderTotal),
    );
    const open = orders.filter((order) => ["novo", "producao", "entrega"].includes(order.status));
    const ticket = done.length ? revenue / done.length : 0;
    const todayOrders = orders.filter((order) => order.createdAt === today());
    const byChannel = CHANNELS.map((channel) => ({
      label: channel.label,
      value: orders.filter((order) => order.channel === channel.value).length,
      color: {
        whatsapp: "#34d399",
        instagram: "#f43f5e",
        ifood: "#fb7185",
        presencial: "#8b5cf6",
      }[channel.value],
    }));
    const series = lastNDays(14).map((day) => ({
      label: day.slice(8, 10) + "/" + day.slice(5, 7),
      pedidos: sum(orders.filter((order) => order.createdAt === day).map(orderTotal)),
    }));
    const customers = new Map<string, { name: string; count: number; total: number }>();
    orders.forEach((order) => {
      const entry = customers.get(order.customer) ?? { name: order.customer, count: 0, total: 0 };
      entry.count += 1;
      entry.total += orderTotal(order);
      customers.set(order.customer, entry);
    });
    return {
      revenue,
      monthRevenue,
      open,
      ticket,
      todayOrders,
      byChannel,
      series,
      customers: Array.from(customers.values()).sort((a, b) => b.total - a.total).slice(0, 5),
      deliveries: orders.filter(
        (order) => order.deliveryAt && order.deliveryAt >= today() && order.status !== "concluido",
      ).length,
    };
  }, [orders]);

  const handleKanbanChange = (changes: KanbanChange[]) => {
    changes.forEach((change) =>
      update("orders", change.id, {
        status: change.columnId as OrderStatus,
        ...(change.columnId === "concluido" ? {} : {}),
      }),
    );
  };

  const newOrder = (status: OrderStatus): Order => ({
    id: `order_${Date.now().toString(36)}`,
    code: `${businessId === "biz_docura" ? "DOC" : "MAS"}-${1000 + orders.length + 1}`,
    businessId,
    customer: "",
    phone: "",
    items: [{ name: menu[0]?.name ?? "Item personalizado", qty: 1, price: menu[0]?.price ?? 0 }],
    status,
    channel: "whatsapp",
    createdAt: today(),
    notes: "",
  });

  const saveOrder = () => {
    if (!editing) return;
    if (!editing.customer.trim()) {
      notify({ title: "Informe o cliente", tone: "error" });
      return;
    }
    const exists = data.orders.some((order) => order.id === editing.id);
    if (exists) {
      update("orders", editing.id, editing);
      notify({ title: "Pedido atualizado", tone: "success" });
    } else {
      add("orders", editing);
      notify({
        title: "Pedido criado",
        description: `${editing.code} · ${brl(orderTotal(editing))}`,
        tone: "success",
      });
    }
    setEditing(null);
  };

  const updateItem = (index: number, patch: Partial<OrderItem>) => {
    if (!editing) return;
    const items = editing.items.map((item, i) => (i === index ? { ...item, ...patch } : item));
    setEditing({ ...editing, items });
  };

  if (!business) return null;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={business.tagline}
        icon={ChefHat}
        title={business.name}
        description="Pedidos, produção, entregas e cardápio do seu delivery — com acompanhamento de faturamento e clientes recorrentes."
        accent={accent}
      >
        <Badge color={accent} dot>
          {stats.open.length} pedidos em aberto
        </Badge>
        <Button
          variant="secondary"
          icon={UtensilsCrossed}
          onClick={() =>
            setMenuItem({
              id: `menu_${Date.now().toString(36)}`,
              businessId,
              name: "",
              sku: "",
              price: 0,
              cost: 0,
              stock: 0,
              sold: 0,
              channel: "site",
              active: true,
              createdAt: today(),
            })
          }
        >
          Novo item do cardápio
        </Button>
        <Button icon={Plus} onClick={() => setEditing(newOrder("novo"))}>
          Novo pedido
        </Button>
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Faturamento do mês"
          value={brl(stats.monthRevenue)}
          icon={CircleDollarSign}
          hint={`${orders.length} pedidos no histórico`}
          tone={accent}
        />
        <StatCard
          label="Pedidos hoje"
          value={num(stats.todayOrders.length)}
          icon={ShoppingCart}
          hint={`${stats.open.length} em produção ou entrega`}
          tone="var(--info)"
        />
        <StatCard
          label="Ticket médio"
          value={brl(stats.ticket)}
          icon={TrendingUp}
          hint="pedidos concluídos"
          tone="var(--positive)"
        />
        <StatCard
          label="Entregas agendadas"
          value={num(stats.deliveries)}
          icon={Truck}
          hint="a partir de hoje"
          tone="var(--warning)"
        />
      </div>

      <Panel padded={false} className="p-4 sm:p-5">
        <SectionHeader
          icon={ClipboardList}
          title="Painel de pedidos"
          description="Arraste os pedidos conforme avançam na produção e entrega"
          action={<Badge>{brl(sum(orders.map(orderTotal)))} em pedidos</Badge>}
        />
        <div className="mt-5">
          <Kanban
            items={orders}
            columns={STATUSES.map((status) => ({ id: status.id, name: status.name, color: status.color }))}
            getColumnId={(order) => order.status}
            onChange={handleKanbanChange}
            onCardClick={(order) => setEditing(order)}
            onAdd={(columnId) => setEditing(newOrder(columnId as OrderStatus))}
            renderCard={(order) => {
              const channel = CHANNELS.find((item) => item.value === order.channel);
              const ChannelIcon = channel?.icon ?? Phone;
              return (
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-[13px] font-semibold">{order.customer}</p>
                      <p className="text-[10.5px] text-faint">{order.code}</p>
                    </div>
                    <span className="num shrink-0 text-[12px] font-bold" style={{ color: accent }}>
                      {brl(orderTotal(order))}
                    </span>
                  </div>
                  <ul className="mt-2 space-y-1">
                    {order.items.map((item, index) => (
                      <li key={index} className="flex items-center justify-between text-[11px] text-muted">
                        <span className="truncate">
                          {item.qty}× {item.name}
                        </span>
                        <span className="num text-faint">{brl(item.qty * item.price)}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-2.5 flex flex-wrap items-center gap-2 text-[10.5px] text-faint">
                    <span className="inline-flex items-center gap-1">
                      <ChannelIcon className="h-3 w-3" />
                      {channel?.label}
                    </span>
                    {order.deliveryAt && (
                      <span
                        className={cn(
                          "inline-flex items-center gap-1",
                          order.deliveryAt === today() && "font-semibold text-warning",
                        )}
                      >
                        <CalendarClock className="h-3 w-3" />
                        {fmtDate(order.deliveryAt)}
                      </span>
                    )}
                  </div>
                </div>
              );
            }}
          />
        </div>
      </Panel>

      <div className="grid gap-5 xl:grid-cols-3">
        <Panel className="xl:col-span-2">
          <SectionHeader
            icon={UtensilsCrossed}
            title="Cardápio"
            description="Preços, custos e disponibilidade dos itens"
          />
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {menu.map((item) => (
              <li
                key={item.id}
                className="group flex items-start justify-between gap-3 rounded-2xl border border-line bg-surface-2/40 p-3.5 transition-colors hover:border-accent/40"
              >
                <div className="min-w-0">
                  <p className="flex items-center gap-2 text-[13px] font-semibold">
                    {item.name}
                    {!item.active && <Badge className="px-2 py-0.5 text-[10px]">pausado</Badge>}
                  </p>
                  <p className="mt-1 text-[11px] text-faint">
                    {item.sku} · {item.sold} vendidos · margem{" "}
                    {item.price ? Math.round(((item.price - item.cost) / item.price) * 100) : 0}%
                  </p>
                  <div className="mt-2 flex items-center gap-3">
                    <span className="num text-[13px] font-bold" style={{ color: accent }}>
                      {brl(item.price)}
                    </span>
                    <span className="num text-[11px] text-faint">custo {brl(item.cost)}</span>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100 max-sm:opacity-100">
                  <Button
                    size="xs"
                    variant="ghost"
                    icon={item.active ? X : BadgeCheck}
                    onClick={() => update("products", item.id, { active: !item.active })}
                    title={item.active ? "Pausar item" : "Ativar item"}
                  />
                  <Button size="xs" variant="ghost" icon={Pencil} onClick={() => setMenuItem(item)} />
                  <Button
                    size="xs"
                    variant="ghost"
                    icon={Trash2}
                    className="text-danger"
                    onClick={() => setConfirmId(item.id)}
                  />
                </div>
              </li>
            ))}
            {menu.length === 0 && (
              <li className="sm:col-span-2">
                <EmptyState
                  icon={UtensilsCrossed}
                  title="Cardápio vazio"
                  description="Cadastre os itens que você produz para agilizar a criação de pedidos."
                />
              </li>
            )}
          </ul>
        </Panel>

        <div className="space-y-5">
          <Panel>
            <SectionHeader icon={Users} title="Melhores clientes" description="Por valor gasto" />
            <ul className="mt-4 space-y-3">
              {stats.customers.map((customer) => (
                <li key={customer.name} className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-[12.5px] font-medium">{customer.name}</p>
                    <p className="text-[10.5px] text-faint">{customer.count} pedidos</p>
                  </div>
                  <span className="num text-[12.5px] font-semibold" style={{ color: accent }}>
                    {brl(customer.total)}
                  </span>
                </li>
              ))}
              {stats.customers.length === 0 && (
                <li className="text-[12px] text-faint">Sem pedidos registrados ainda.</li>
              )}
            </ul>
          </Panel>

          <Panel>
            <SectionHeader icon={ShoppingCart} title="Canais de venda" description="Origem dos pedidos" />
            <Donut
              data={stats.byChannel}
              height={210}
              format="number"
              showLegend
            />
          </Panel>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Panel>
          <SectionHeader
            icon={CircleDollarSign}
            title="Faturamento diário (14 dias)"
            description="Valor dos pedidos criados por dia"
          />
          <div className="mt-4">
            <BarsGroup
              data={stats.series}
              series={[{ key: "pedidos", label: "Pedidos (R$)", color: accent, format: "currency" }]}
              height={240}
            />
          </div>
        </Panel>

        <Panel>
          <SectionHeader icon={Package} title="Produção e estoque" description="Capacidade e insumos" />
          <div className="mt-4 space-y-4">
            {menu.slice(0, 6).map((item) => (
              <div key={item.id}>
                <div className="flex items-center justify-between text-[12px]">
                  <span className="truncate font-medium">{item.name}</span>
                  <span className="num text-muted">
                    {item.stock} em estoque · {item.sold} vendidos
                  </span>
                </div>
                <Progress
                  value={item.stock}
                  max={Math.max(item.stock, item.sold, 1)}
                  color={item.stock <= 5 ? "var(--warning)" : accent}
                  className="mt-2"
                  height={6}
                />
              </div>
            ))}
          </div>
          <div className="mt-5 rounded-2xl border border-line bg-surface-2/40 p-3.5">
            <p className="text-[11.5px] text-muted">
              Capacidade de produção do mês:{" "}
              <span className="num font-semibold text-ink">{num(stats.open.length * 2)}</span>{" "}
              pedidos projetados. Ajuste preços quando o custo dos insumos variar mais de 10%.
            </p>
          </div>
        </Panel>
      </div>

      {/* ----------------------------- modais ----------------------------- */}
      <Modal
        open={Boolean(editing)}
        onClose={() => setEditing(null)}
        title={data.orders.some((order) => order.id === editing?.id) ? `Pedido ${editing?.code}` : "Novo pedido"}
        description="Dados do cliente, itens e status de produção."
        size="lg"
        footer={
          <>
            <Button variant="ghost" onClick={() => setEditing(null)}>
              Cancelar
            </Button>
            <Button onClick={saveOrder}>Salvar pedido</Button>
          </>
        }
      >
        {editing && (
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Cliente">
              <Input
                value={editing.customer}
                onChange={(event) => setEditing({ ...editing, customer: event.target.value })}
                placeholder="Nome do cliente"
              />
            </Field>
            <Field label="Telefone">
              <Input
                value={editing.phone ?? ""}
                onChange={(event) => setEditing({ ...editing, phone: event.target.value })}
                placeholder="(11) 90000-0000"
              />
            </Field>
            <Field label="Status">
              <Select
                value={editing.status}
                onChange={(event) =>
                  setEditing({ ...editing, status: event.target.value as OrderStatus })
                }
              >
                {STATUSES.map((status) => (
                  <option key={status.id} value={status.id}>
                    {status.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Canal">
              <Select
                value={editing.channel}
                onChange={(event) =>
                  setEditing({ ...editing, channel: event.target.value as Order["channel"] })
                }
              >
                {CHANNELS.map((channel) => (
                  <option key={channel.value} value={channel.value}>
                    {channel.label}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Data do pedido">
              <Input
                type="date"
                value={editing.createdAt}
                onChange={(event) => setEditing({ ...editing, createdAt: event.target.value })}
              />
            </Field>
            <Field label="Entrega prevista">
              <Input
                type="date"
                value={editing.deliveryAt ?? ""}
                onChange={(event) => setEditing({ ...editing, deliveryAt: event.target.value })}
              />
            </Field>

            <div className="sm:col-span-2">
              <div className="mb-2 flex items-center justify-between">
                <span className="label-xs">Itens do pedido</span>
                <Button
                  size="xs"
                  variant="subtle"
                  icon={Plus}
                  onClick={() => {
                    const first = menu[0];
                    setEditing({
                      ...editing,
                      items: [
                        ...editing.items,
                        { name: first?.name ?? "", qty: 1, price: first?.price ?? 0 },
                      ],
                    });
                  }}
                >
                  Adicionar item
                </Button>
              </div>
              <div className="space-y-2">
                {editing.items.map((item, index) => (
                  <div key={index} className="grid gap-2 sm:grid-cols-[1.6fr_auto_auto_auto]">
                    <Select
                      value={item.name}
                      onChange={(event) => {
                        const selected = menu.find((entry) => entry.name === event.target.value);
                        updateItem(index, {
                          name: event.target.value,
                          price: selected?.price ?? item.price,
                        });
                      }}
                    >
                      <option value={item.name}>{item.name || "Selecione…"}</option>
                      {menu
                        .filter((entry) => entry.name !== item.name)
                        .map((entry) => (
                          <option key={entry.id} value={entry.name}>
                            {entry.name} — {brl(entry.price)}
                          </option>
                        ))}
                    </Select>
                    <Input
                      type="number"
                      min={1}
                      value={item.qty}
                      onChange={(event) => updateItem(index, { qty: Number(event.target.value) })}
                      className="w-full sm:w-[84px]"
                    />
                    <Input
                      type="number"
                      value={item.price}
                      onChange={(event) => updateItem(index, { price: Number(event.target.value) })}
                      className="w-full sm:w-[110px]"
                    />
                    <Button
                      size="icon"
                      variant="ghost"
                      className="text-danger"
                      onClick={() =>
                        setEditing({
                          ...editing,
                          items: editing.items.filter((_, i) => i !== index),
                        })
                      }
                      disabled={editing.items.length === 1}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
              <div className="mt-3 flex items-center justify-between rounded-2xl border border-line bg-surface-2/50 px-4 py-3">
                <span className="text-[12.5px] text-muted">Total do pedido</span>
                <span className="num font-display text-lg font-bold" style={{ color: accent }}>
                  {brl(orderTotal(editing))}
                </span>
              </div>
            </div>

            <Field label="Observações" className="sm:col-span-2">
              <Textarea
                value={editing.notes ?? ""}
                onChange={(event) => setEditing({ ...editing, notes: event.target.value })}
                placeholder="Ex: sem lactose, escrever parabéns no bolo…"
                className="min-h-[70px]"
              />
            </Field>
          </div>
        )}
      </Modal>

      <Modal
        open={Boolean(menuItem)}
        onClose={() => setMenuItem(null)}
        title={data.products.some((item) => item.id === menuItem?.id) ? "Editar item do cardápio" : "Novo item"}
        footer={
          <>
            <Button variant="ghost" onClick={() => setMenuItem(null)}>
              Cancelar
            </Button>
            <Button
              onClick={() => {
                if (!menuItem) return;
                if (!menuItem.name.trim()) {
                  notify({ title: "Informe o nome do item", tone: "error" });
                  return;
                }
                if (data.products.some((item) => item.id === menuItem.id)) {
                  update("products", menuItem.id, menuItem);
                } else {
                  add("products", menuItem);
                }
                notify({ title: "Cardápio atualizado", tone: "success" });
                setMenuItem(null);
              }}
            >
              Salvar item
            </Button>
          </>
        }
      >
        {menuItem && (
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Nome do item" className="sm:col-span-2">
              <Input
                value={menuItem.name}
                onChange={(event) => setMenuItem({ ...menuItem, name: event.target.value })}
                placeholder="Ex: Bolo de ninho com morango"
              />
            </Field>
            <Field label="Código">
              <Input
                value={menuItem.sku}
                onChange={(event) => setMenuItem({ ...menuItem, sku: event.target.value })}
                placeholder="DOC-06"
              />
            </Field>
            <Field label="Preço (R$)">
              <Input
                type="number"
                value={menuItem.price}
                onChange={(event) => setMenuItem({ ...menuItem, price: Number(event.target.value) })}
              />
            </Field>
            <Field label="Custo (R$)">
              <Input
                type="number"
                value={menuItem.cost}
                onChange={(event) => setMenuItem({ ...menuItem, cost: Number(event.target.value) })}
              />
            </Field>
            <Field label="Quantidade disponível">
              <Input
                type="number"
                value={menuItem.stock}
                onChange={(event) => setMenuItem({ ...menuItem, stock: Number(event.target.value) })}
              />
            </Field>
            <div className="sm:col-span-2 rounded-2xl border border-line bg-surface-2/40 p-3.5">
              <Switch
                checked={menuItem.active}
                onChange={(checked) => setMenuItem({ ...menuItem, active: checked })}
                label="Disponível para pedidos"
                hint="Itens pausados não aparecem como sugestão em novos pedidos."
              />
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={Boolean(confirmId)}
        title="Excluir item do cardápio"
        description="O item será removido definitivamente."
        confirmLabel="Excluir"
        onCancel={() => setConfirmId(null)}
        onConfirm={() => {
          if (confirmId) remove("products", confirmId);
          notify({ title: "Item removido" });
        }}
      />
    </div>
  );
}
