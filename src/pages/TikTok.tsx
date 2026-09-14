import { useMemo, useState } from "react";
import {
  AlertTriangle,
  BarChart3,
  Eye,
  Flame,
  Heart,
  Package,
  Pencil,
  Plus,
  ShoppingBag,
  Sparkles,
  Trash2,
  TrendingUp,
  Video,
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
  SegmentedControl,
  Select,
  StatCard,
  Switch,
  Textarea,
} from "../components/ui";
import { BarsGroup, Donut, TrendArea } from "../components/charts";
import { Kanban, type KanbanChange } from "../components/Kanban";
import { useApp } from "../lib/store";
import { useMetrics } from "../lib/metrics";
import { brl, cn, fmtDate, num, pct, sum, today } from "../lib/utils";
import type { Content, ContentStage, Product } from "../lib/types";

const STAGES: Array<{ id: ContentStage; name: string; color: string }> = [
  { id: "ideia", name: "Ideia", color: "#60a5fa" },
  { id: "roteiro", name: "Roteiro", color: "#a78bfa" },
  { id: "gravacao", name: "Gravação", color: "#fbbf24" },
  { id: "edicao", name: "Edição", color: "#fb923c" },
  { id: "publicado", name: "Publicado", color: "#34d399" },
];

const CHANNELS: Array<{ value: Product["channel"]; label: string }> = [
  { value: "tiktok", label: "TikTok Shop" },
  { value: "shopee", label: "Shopee" },
  { value: "site", label: "Site próprio" },
];

const emptyProduct = (): Product => ({
  id: `prod_${Date.now().toString(36)}`,
  name: "",
  sku: "",
  price: 0,
  cost: 0,
  stock: 0,
  sold: 0,
  channel: "tiktok",
  active: true,
  createdAt: today(),
});

const emptyContent = (stage: ContentStage, order: number): Content => ({
  id: `content_${Date.now().toString(36)}`,
  title: "",
  hook: "",
  stage,
  views: 0,
  likes: 0,
  sales: 0,
  order,
  scheduledAt: today(),
});

export default function TikTok() {
  const { data, add, update, remove, notify } = useApp();
  const metrics = useMetrics();
  const [tab, setTab] = useState<"produtos" | "conteudos">("produtos");
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editingContent, setEditingContent] = useState<Content | null>(null);
  const [confirm, setConfirm] = useState<{ collection: "products" | "contents"; id: string } | null>(
    null,
  );

  const products = useMemo(
    () => [...data.products].sort((a, b) => b.sold * b.price - a.sold * a.price),
    [data.products],
  );

  const totals = useMemo(
    () => ({
      revenue: sum(data.products.map((product) => product.sold * product.price)),
      profit: sum(data.products.map((product) => product.sold * (product.price - product.cost))),
      units: sum(data.products.map((product) => product.sold)),
      views: sum(data.contents.map((content) => content.views)),
      likes: sum(data.contents.map((content) => content.likes)),
      stockValue: sum(data.products.map((product) => product.stock * product.cost)),
      conversion:
        sum(data.contents.map((content) => content.sales)) /
        Math.max(sum(data.contents.map((content) => content.views)), 1),
    }),
    [data.contents, data.products],
  );

  const contentSeries = useMemo(
    () =>
      [...data.contents]
        .sort((a, b) => b.views - a.views)
        .slice(0, 8)
        .map((content) => ({
          label: content.title.length > 14 ? `${content.title.slice(0, 14)}…` : content.title,
          views: content.views,
          vendas: content.sales,
        })),
    [data.contents],
  );

  const handleKanbanChange = (changes: KanbanChange[]) => {
    changes.forEach((change) =>
      update("contents", change.id, { stage: change.columnId as ContentStage, order: change.order }),
    );
  };

  const saveProduct = () => {
    if (!editingProduct) return;
    if (!editingProduct.name.trim()) {
      notify({ title: "Informe o nome do produto", tone: "error" });
      return;
    }
    const exists = data.products.some((product) => product.id === editingProduct.id);
    if (exists) {
      update("products", editingProduct.id, editingProduct);
      notify({ title: "Produto atualizado", tone: "success" });
    } else {
      add("products", editingProduct);
      notify({ title: "Produto cadastrado", tone: "success" });
    }
    setEditingProduct(null);
  };

  const saveContent = () => {
    if (!editingContent) return;
    if (!editingContent.title.trim()) {
      notify({ title: "Informe o título do conteúdo", tone: "error" });
      return;
    }
    const exists = data.contents.some((content) => content.id === editingContent.id);
    if (exists) {
      update("contents", editingContent.id, editingContent);
      notify({ title: "Conteúdo atualizado", tone: "success" });
    } else {
      add("contents", editingContent);
      notify({ title: "Conteúdo criado", tone: "success" });
    }
    setEditingContent(null);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="TikTok Shop"
        icon={ShoppingBag}
        title="Operação de produtos e conteúdo"
        description="Catálogo, margens, estoque e o funil de produção de vídeos — tudo que alimenta as vendas no TikTok Shop."
      >
        <Button variant="secondary" icon={Video} onClick={() => setEditingContent(emptyContent("ideia", 0))}>
          Novo conteúdo
        </Button>
        <Button icon={Plus} onClick={() => setEditingProduct(emptyProduct())}>
          Novo produto
        </Button>
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Faturamento acumulado"
          value={brl(totals.revenue)}
          icon={Wallet}
          hint={`${num(totals.units)} unidades vendidas`}
          tone="var(--accent)"
        />
        <StatCard
          label="Lucro estimado"
          value={brl(totals.profit)}
          icon={TrendingUp}
          hint={`margem ${pct(totals.revenue ? (totals.profit / totals.revenue) * 100 : 0)}`}
          tone="var(--positive)"
        />
        <StatCard
          label="Alcance dos conteúdos"
          value={num(totals.views)}
          icon={Eye}
          hint={`${num(totals.likes)} curtidas · ${num(data.contents.length)} vídeos`}
          tone="var(--accent-2)"
        />
        <StatCard
          label="Estoque (a custo)"
          value={brl(totals.stockValue)}
          icon={Package}
          hint={`${metrics.tiktok.lowStock.length} produtos com estoque baixo`}
          tone="var(--warning)"
        />
      </div>

      <Panel padded={false} className="p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <SectionHeader
            icon={tab === "produtos" ? Package : Video}
            title={tab === "produtos" ? "Catálogo de produtos" : "Funil de conteúdo"}
            description={
              tab === "produtos"
                ? "Margem, giro e disponibilidade de cada item"
                : "Arraste os vídeos entre as etapas de produção"
            }
          />
          <SegmentedControl
            value={tab}
            onChange={setTab}
            options={[
              { value: "produtos", label: "Produtos", icon: Package },
              { value: "conteudos", label: "Conteúdos", icon: Video },
            ]}
          />
        </div>

        {tab === "produtos" ? (
          <div className="mt-5 overflow-x-auto">
            <table className="w-full min-w-[860px] border-separate border-spacing-0 text-left">
              <thead>
                <tr className="text-[11px] text-faint">
                  {["Produto", "Canal", "Preço", "Custo", "Margem", "Estoque", "Vendidos", "Receita", ""].map(
                    (header) => (
                      <th key={header} className="border-b border-line px-3 pb-2 font-semibold">
                        {header}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody>
                {products.map((product) => {
                  const margin = product.price
                    ? ((product.price - product.cost) / product.price) * 100
                    : 0;
                  const revenue = product.sold * product.price;
                  return (
                    <tr key={product.id} className="group transition-colors hover:bg-surface-2/50">
                      <td className="border-b border-line px-3 py-3">
                        <div className="flex items-center gap-2.5">
                          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl accent-soft text-[11px] font-bold">
                            {product.name.slice(0, 2).toUpperCase()}
                          </span>
                          <div className="min-w-0">
                            <p className="truncate text-[13px] font-medium">{product.name}</p>
                            <p className="text-[10.5px] text-faint">
                              {product.sku} · desde {fmtDate(product.createdAt, "MM/yy")}
                            </p>
                          </div>
                          {!product.active && (
                            <Badge className="px-2 py-0.5 text-[10px]">inativo</Badge>
                          )}
                        </div>
                      </td>
                      <td className="border-b border-line px-3 py-3 text-[12px] text-muted capitalize">
                        {product.channel}
                      </td>
                      <td className="num border-b border-line px-3 py-3 text-[12.5px]">
                        {brl(product.price)}
                      </td>
                      <td className="num border-b border-line px-3 py-3 text-[12.5px] text-muted">
                        {brl(product.cost)}
                      </td>
                      <td className="border-b border-line px-3 py-3">
                        <Badge
                          color={margin >= 50 ? "var(--positive)" : margin >= 35 ? "var(--warning)" : "var(--danger)"}
                        >
                          {pct(margin)}
                        </Badge>
                      </td>
                      <td className="border-b border-line px-3 py-3">
                        <span
                          className={cn(
                            "num text-[12.5px] font-semibold",
                            product.stock === 0
                              ? "text-danger"
                              : product.stock <= 10
                                ? "text-warning"
                                : "text-muted",
                          )}
                        >
                          {product.stock} un
                        </span>
                      </td>
                      <td className="num border-b border-line px-3 py-3 text-[12.5px] text-muted">
                        {product.sold}
                      </td>
                      <td className="num border-b border-line px-3 py-3 text-[12.5px] font-semibold text-accent">
                        {brl(revenue)}
                      </td>
                      <td className="border-b border-line px-3 py-3">
                        <div className="flex items-center justify-end gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                          <Button size="xs" variant="ghost" icon={Pencil} onClick={() => setEditingProduct(product)} />
                          <Button
                            size="xs"
                            variant="ghost"
                            icon={Trash2}
                            className="text-danger"
                            onClick={() => setConfirm({ collection: "products", id: product.id })}
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {data.products.length === 0 && (
              <EmptyState icon={Package} title="Nenhum produto cadastrado" description="Cadastre o primeiro item para acompanhar estoque, margem e vendas." />
            )}
          </div>
        ) : (
          <div className="mt-5">
            <Kanban
              items={data.contents}
              columns={STAGES.map((stage) => ({
                id: stage.id,
                name: stage.name,
                color: stage.color,
              }))}
              getColumnId={(content) => content.stage}
              onChange={handleKanbanChange}
              onCardClick={(content) => setEditingContent(content)}
              onAdd={(columnId) =>
                setEditingContent(
                  emptyContent(
                    columnId as ContentStage,
                    data.contents.filter((content) => content.stage === columnId).length,
                  ),
                )
              }
              renderCard={(content) => (
                <div>
                  <p className="text-[12.5px] leading-tight font-semibold">{content.title}</p>
                  {content.hook && (
                    <p className="mt-1 text-[11px] text-muted italic">“{content.hook}”</p>
                  )}
                  <div className="mt-2.5 grid grid-cols-3 gap-1.5 text-[10.5px]">
                    <span className="rounded-md border border-line bg-surface/50 px-1.5 py-1 text-center">
                      <Eye className="mx-auto mb-0.5 h-3 w-3 text-faint" />
                      <span className="num">{num(content.views)}</span>
                    </span>
                    <span className="rounded-md border border-line bg-surface/50 px-1.5 py-1 text-center">
                      <Heart className="mx-auto mb-0.5 h-3 w-3 text-faint" />
                      <span className="num">{num(content.likes)}</span>
                    </span>
                    <span className="rounded-md border border-line bg-surface/50 px-1.5 py-1 text-center">
                      <ShoppingBag className="mx-auto mb-0.5 h-3 w-3 text-faint" />
                      <span className="num">{content.sales}</span>
                    </span>
                  </div>
                  {content.scheduledAt && (
                    <p className="mt-2 text-[10.5px] text-faint">
                      {content.stage === "publicado" ? "publicado" : "previsto"} em{" "}
                      {fmtDate(content.scheduledAt)}
                    </p>
                  )}
                </div>
              )}
            />
          </div>
        )}
      </Panel>

      <div className="grid gap-5 lg:grid-cols-3">
        <Panel className="lg:col-span-2">
          <SectionHeader
            icon={BarChart3}
            title="Desempenho por conteúdo"
            description="Alcance e vendas dos vídeos mais fortes"
          />
          <div className="mt-4">
            <BarsGroup
              data={contentSeries}
              series={[
                { key: "views", label: "Views", color: "var(--accent-2)" },
                { key: "vendas", label: "Vendas", color: "var(--accent)" },
              ]}
              height={260}
            />
          </div>
        </Panel>

        <Panel>
          <SectionHeader icon={Flame} title="Top produtos" description="Participação na receita" />
          <Donut
            data={products.slice(0, 5).map((product, index) => ({
              label: product.name.split(" ").slice(0, 2).join(" "),
              value: product.sold * product.price,
              color: ["#8b5cf6", "#22d3ee", "#34d399", "#fbbf24", "#f43f5e"][index % 5],
            }))}
            centerLabel={brl(totals.revenue)}
            centerSub="receita total"
            height={250}
          />
        </Panel>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Panel>
          <SectionHeader icon={Sparkles} title="Ideias e alertas" description="Ações recomendadas para hoje" />
          <ul className="mt-4 space-y-3">
            {metrics.tiktok.lowStock.length > 0 && (
              <li className="flex items-start gap-3 rounded-2xl border border-warning/30 bg-warning/10 p-3.5">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
                <p className="text-[12.5px] text-muted">
                  Repor estoque de{" "}
                  <span className="font-semibold text-ink">
                    {metrics.tiktok.lowStock.map((product) => product.name).join(", ")}
                  </span>
                  .
                </p>
              </li>
            )}
            {data.contents.filter((content) => content.stage === "ideia").length > 3 && (
              <li className="flex items-start gap-3 rounded-2xl border border-line bg-surface-2/40 p-3.5">
                <Video className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                <p className="text-[12.5px] text-muted">
                  Você tem{" "}
                  <span className="font-semibold text-ink">
                    {data.contents.filter((content) => content.stage === "ideia").length} ideias
                  </span>{" "}
                  paradas. Escolha 3 e leve para roteiro hoje.
                </p>
              </li>
            )}
            <li className="flex items-start gap-3 rounded-2xl border border-line bg-surface-2/40 p-3.5">
              <TrendingUp className="mt-0.5 h-4 w-4 shrink-0 text-positive" />
              <p className="text-[12.5px] text-muted">
                Conversão média de{" "}
                <span className="num font-semibold text-ink">
                  {(totals.conversion * 100).toFixed(3)}%
                </span>{" "}
                (vendas por view). Reforce os ganchos dos vídeos com melhor desempenho.
              </p>
            </li>
          </ul>
          <div className="mt-5">
            <p className="label-xs mb-3">Evolução de views (por vídeo publicado)</p>
            <TrendArea
              data={[...data.contents]
                .filter((content) => content.stage === "publicado")
                .sort((a, b) => (a.scheduledAt ?? "") < (b.scheduledAt ?? "") ? -1 : 1)
                .map((content) => ({ label: fmtDate(content.scheduledAt), views: content.views }))}
              series={[{ key: "views", label: "Views", color: "var(--accent-2)" }]}
              height={170}
            />
          </div>
        </Panel>

        <Panel>
          <SectionHeader icon={Package} title="Reposição e giro" description="Estoque versus volume vendido" />
          <div className="mt-4 space-y-4">
            {products.slice(0, 6).map((product) => {
              const coverage = product.sold ? product.stock / product.sold : product.stock;
              return (
                <div key={product.id}>
                  <div className="flex items-center justify-between text-[12px]">
                    <span className="truncate font-medium">{product.name}</span>
                    <span className="num text-muted">
                      {product.stock} un · {product.sold} vendidas
                    </span>
                  </div>
                  <Progress
                    value={product.stock}
                    max={Math.max(product.stock, product.sold, 1)}
                    color={product.stock <= 10 ? "var(--warning)" : "var(--accent)"}
                    className="mt-2"
                    height={6}
                  />
                  <p className="mt-1 text-[10.5px] text-faint">
                    {coverage < 0.15
                      ? "Risco de ruptura — reponha com urgência"
                      : coverage < 0.4
                        ? "Estoque moderado, monitore a demanda"
                        : "Cobertura confortável de estoque"}
                  </p>
                </div>
              );
            })}
          </div>
        </Panel>
      </div>

      {/* ----------------------------- modais ----------------------------- */}
      <Modal
        open={Boolean(editingProduct)}
        onClose={() => setEditingProduct(null)}
        title={data.products.some((product) => product.id === editingProduct?.id) ? "Editar produto" : "Novo produto"}
        size="lg"
        footer={
          <>
            <Button variant="ghost" onClick={() => setEditingProduct(null)}>
              Cancelar
            </Button>
            <Button onClick={saveProduct}>Salvar produto</Button>
          </>
        }
      >
        {editingProduct && (
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Nome do produto" className="sm:col-span-2">
              <Input
                value={editingProduct.name}
                onChange={(event) => setEditingProduct({ ...editingProduct, name: event.target.value })}
                placeholder="Ex: Kit organizador dobrável"
              />
            </Field>
            <Field label="SKU">
              <Input
                value={editingProduct.sku}
                onChange={(event) => setEditingProduct({ ...editingProduct, sku: event.target.value })}
                placeholder="TK-008"
              />
            </Field>
            <Field label="Canal de venda">
              <Select
                value={editingProduct.channel}
                onChange={(event) =>
                  setEditingProduct({ ...editingProduct, channel: event.target.value as Product["channel"] })
                }
              >
                {CHANNELS.map((channel) => (
                  <option key={channel.value} value={channel.value}>
                    {channel.label}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Preço de venda (R$)">
              <Input
                type="number"
                value={editingProduct.price}
                onChange={(event) =>
                  setEditingProduct({ ...editingProduct, price: Number(event.target.value) })
                }
              />
            </Field>
            <Field label="Custo unitário (R$)">
              <Input
                type="number"
                value={editingProduct.cost}
                onChange={(event) =>
                  setEditingProduct({ ...editingProduct, cost: Number(event.target.value) })
                }
              />
            </Field>
            <Field label="Estoque atual">
              <Input
                type="number"
                value={editingProduct.stock}
                onChange={(event) =>
                  setEditingProduct({ ...editingProduct, stock: Number(event.target.value) })
                }
              />
            </Field>
            <Field label="Unidades vendidas">
              <Input
                type="number"
                value={editingProduct.sold}
                onChange={(event) =>
                  setEditingProduct({ ...editingProduct, sold: Number(event.target.value) })
                }
              />
            </Field>
            <div className="sm:col-span-2 rounded-2xl border border-line bg-surface-2/40 p-3.5">
              <Switch
                checked={editingProduct.active}
                onChange={(checked) => setEditingProduct({ ...editingProduct, active: checked })}
                label="Produto ativo no catálogo"
                hint="Produtos inativos ficam fora das métricas de reposição."
              />
            </div>
            <div className="sm:col-span-2 flex flex-wrap gap-3 rounded-2xl border border-line bg-surface-2/40 p-3.5 text-[12px] text-muted">
              <span>
                Margem:{" "}
                <span className="num font-semibold text-ink">
                  {pct(
                    editingProduct.price
                      ? ((editingProduct.price - editingProduct.cost) / editingProduct.price) * 100
                      : 0,
                  )}
                </span>
              </span>
              <span>
                Lucro por unidade:{" "}
                <span className="num font-semibold text-ink">
                  {brl(editingProduct.price - editingProduct.cost)}
                </span>
              </span>
              <span>
                Receita acumulada:{" "}
                <span className="num font-semibold text-ink">
                  {brl(editingProduct.sold * editingProduct.price)}
                </span>
              </span>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        open={Boolean(editingContent)}
        onClose={() => setEditingContent(null)}
        title={data.contents.some((content) => content.id === editingContent?.id) ? "Editar conteúdo" : "Novo conteúdo"}
        size="lg"
        footer={
          <>
            <Button variant="ghost" onClick={() => setEditingContent(null)}>
              Cancelar
            </Button>
            <Button onClick={saveContent}>Salvar conteúdo</Button>
          </>
        }
      >
        {editingContent && (
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Título do vídeo" className="sm:col-span-2">
              <Input
                value={editingContent.title}
                onChange={(event) => setEditingContent({ ...editingContent, title: event.target.value })}
                placeholder="Ex: 3 formas de organizar a cozinha"
              />
            </Field>
            <Field label="Gancho (primeiros 3 segundos)" className="sm:col-span-2">
              <Textarea
                value={editingContent.hook ?? ""}
                onChange={(event) => setEditingContent({ ...editingContent, hook: event.target.value })}
                placeholder="Você não vai acreditar no resultado…"
                className="min-h-[70px]"
              />
            </Field>
            <Field label="Etapa de produção">
              <Select
                value={editingContent.stage}
                onChange={(event) =>
                  setEditingContent({ ...editingContent, stage: event.target.value as ContentStage })
                }
              >
                {STAGES.map((stage) => (
                  <option key={stage.id} value={stage.id}>
                    {stage.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Produto vinculado">
              <Select
                value={editingContent.productId ?? ""}
                onChange={(event) =>
                  setEditingContent({
                    ...editingContent,
                    productId: event.target.value || undefined,
                  })
                }
              >
                <option value="">Nenhum</option>
                {data.products.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Data (publicação prevista)">
              <Input
                type="date"
                value={editingContent.scheduledAt ?? ""}
                onChange={(event) =>
                  setEditingContent({ ...editingContent, scheduledAt: event.target.value })
                }
              />
            </Field>
            <Field label="Views">
              <Input
                type="number"
                value={editingContent.views}
                onChange={(event) =>
                  setEditingContent({ ...editingContent, views: Number(event.target.value) })
                }
              />
            </Field>
            <Field label="Curtidas">
              <Input
                type="number"
                value={editingContent.likes}
                onChange={(event) =>
                  setEditingContent({ ...editingContent, likes: Number(event.target.value) })
                }
              />
            </Field>
            <Field label="Vendas geradas">
              <Input
                type="number"
                value={editingContent.sales}
                onChange={(event) =>
                  setEditingContent({ ...editingContent, sales: Number(event.target.value) })
                }
              />
            </Field>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={Boolean(confirm)}
        title="Confirmar exclusão"
        description="O item será removido definitivamente do catálogo."
        confirmLabel="Excluir"
        onCancel={() => setConfirm(null)}
        onConfirm={() => {
          if (confirm) remove(confirm.collection, confirm.id);
          notify({ title: "Item excluído" });
        }}
      />
    </div>
  );
}
