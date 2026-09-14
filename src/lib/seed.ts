import type {
  AppData,
  Course,
  Goal,
  Habit,
  Lead,
  Order,
  Task,
  Transaction,
} from "./types";
import { addDaysISO, iso, lastNDays, monthKey, seededRandom, today } from "./utils";

const rnd = seededRandom(20240914);
const pick = <T>(items: T[]): T => items[Math.floor(rnd() * items.length)];
const between = (min: number, max: number) => Math.round(min + rnd() * (max - min));
const daysAgo = (n: number) => addDaysISO(today(), -n);
const inDays = (n: number) => addDaysISO(today(), n);

function makeHabits(): Habit[] {
  const habits: Array<Pick<Habit, "name" | "emoji" | "color" | "targetPerWeek">> = [
    { name: "Acordar antes das 7h", emoji: "🌅", color: "#f59e0b", targetPerWeek: 6 },
    { name: "Treinar", emoji: "🏋️", color: "#f43f5e", targetPerWeek: 5 },
    { name: "Estudar 1h", emoji: "📚", color: "#8b5cf6", targetPerWeek: 6 },
    { name: "Beber 3L de água", emoji: "💧", color: "#3b82f6", targetPerWeek: 7 },
    { name: "Ler 20 páginas", emoji: "📖", color: "#10b981", targetPerWeek: 5 },
    { name: "Sem rede social à noite", emoji: "🌙", color: "#22d3ee", targetPerWeek: 6 },
  ];
  const window = lastNDays(56);
  return habits.map((h, index) => ({
    id: `habit_${index + 1}`,
    ...h,
    logs: window.filter(() => rnd() < 0.62),
  }));
}

function makeTransactions(): Transaction[] {
  const sources = [
    { id: "src_sites", weight: 0.3, base: 2400 },
    { id: "src_tiktok", weight: 0.28, base: 1800 },
    { id: "src_docura", weight: 0.24, base: 1500 },
    { id: "src_massas", weight: 0.18, base: 1200 },
  ];
  const out: Transaction[] = [];
  const months = new Set<string>();
  const base = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(base);
    d.setMonth(d.getMonth() - i);
    months.add(monthKey(d));
  }
  let counter = 0;
  months.forEach((month) => {
    sources.forEach((source) => {
      const count = between(2, 4);
      for (let i = 0; i < count; i++) {
        counter += 1;
        const day = Math.min(between(2, 27), 28);
        const amount = Math.round((source.base * (0.55 + rnd() * 0.95)) / 10) * 10;
        out.push({
          id: `tx_${counter}`,
          type: "receita",
          amount,
          category: source.id.replace("src_", ""),
          sourceId: source.id,
          date: `${month}-${String(day).padStart(2, "0")}`,
          note: "",
          recurring: rnd() > 0.6,
        });
      }
    });
    const expenseCount = between(3, 6);
    for (let i = 0; i < expenseCount; i++) {
      counter += 1;
      out.push({
        id: `tx_${counter}`,
        type: "despesa",
        amount: Math.round(between(60, 780) / 5) * 5,
        category: pick(["ferramentas", "marketing", "insumos", "transporte", "casa"]),
        date: `${month}-${String(between(2, 27)).padStart(2, "0")}`,
        note: "",
        recurring: rnd() > 0.7,
      });
    }
  });
  return out.sort((a, b) => (a.date < b.date ? 1 : -1));
}

function makeTasks(): Task[] {
  const base: Array<Partial<Task> & { title: string }> = [
    { title: "Fechar proposta do site institucional", priority: "urgente", area: "Sites", estimateMin: 45, today: true },
    { title: "Gravar 3 vídeos de produto", priority: "alta", area: "TikTok", estimateMin: 90, today: true },
    { title: "Responder leads do WhatsApp", priority: "alta", area: "Sites", estimateMin: 25, today: true },
    { title: "Encomenda — bolo de ninho (entrega 18h)", priority: "urgente", area: "Srta Doçura", estimateMin: 60, today: true },
    { title: "Estudar módulo 4 — copywriting", priority: "media", area: "Estudos", estimateMin: 60, today: true },
    { title: "Treino de inferiores", priority: "media", area: "Treinos", estimateMin: 50, today: true },
    { title: "Atualizar precificação dos kits", priority: "media", area: "Srta das Massas", estimateMin: 40 },
    { title: "Publicar carrossel do case cliente", priority: "alta", area: "TikTok", estimateMin: 30 },
    { title: "Organizar planilha de fluxo de caixa", priority: "media", area: "Finanças", estimateMin: 35 },
    { title: "Pesquisar fornecedor de embalagem", priority: "baixa", area: "Srta Doçura", estimateMin: 20 },
    { title: "Escrever roteiro do vídeo viral", priority: "alta", area: "TikTok", estimateMin: 40 },
    { title: "Backup dos arquivos do workspace", priority: "baixa", area: "Sistema", estimateMin: 10 },
  ];
  const tasks: Task[] = base.map((t, index) => ({
    id: `task_${index + 1}`,
    title: t.title,
    notes: "",
    done: index > 7 && index % 3 === 0,
    priority: (t.priority ?? "media") as Task["priority"],
    area: t.area ?? "Geral",
    due: t.today ? today() : index % 4 === 0 ? inDays(between(1, 12)) : undefined,
    today: Boolean(t.today),
    order: index,
    estimateMin: t.estimateMin,
    tags: [],
    createdAt: daysAgo(between(1, 20)),
    completedAt: index > 7 && index % 3 === 0 ? daysAgo(between(0, 5)) : undefined,
  }));

  const done = lastNDays(14).flatMap((date, i) =>
    Array.from({ length: between(1, 4) }).map((_, k) => ({
      id: `task_done_${i}_${k}`,
      title: pick([
        "Enviar orçamento",
        "Responder cliente",
        "Editar vídeo",
        "Fazer compras",
        "Revisar aulas",
        "Postar story de venda",
        "Conferir pedidos",
      ]),
      done: true,
      priority: "media" as const,
      area: pick(["Sites", "TikTok", "Estudos", "Srta Doçura", "Finanças"]),
      today: false,
      order: 100 + i,
      tags: [],
      createdAt: date,
      completedAt: date,
    })),
  );

  return [...tasks, ...done];
}

export function createSeedData(): AppData {
  const goals: Goal[] = [
    {
      id: "goal_1",
      title: "Faturar R$ 12.000/mês",
      area: "Finanças",
      unit: "R$",
      target: 12000,
      current: 7840,
      deadline: inDays(48),
      status: "ativa",
      milestones: [
        { id: "m1", title: "10 clientes fixos de site", done: true },
        { id: "m2", title: "Loja TikTok com 5 produtos validados", done: false },
        { id: "m3", title: "Delivery com 30 pedidos/mês", done: false },
      ],
    },
    {
      id: "goal_2",
      title: "10 clientes de site fechados",
      area: "Sites",
      unit: "clientes",
      target: 10,
      current: 6,
      deadline: inDays(30),
      status: "ativa",
      milestones: [
        { id: "m4", title: "Landing page de portfólio", done: true },
        { id: "m5", title: "Proposta comercial em PDF", done: true },
        { id: "m6", title: "Indicação estruturada", done: false },
      ],
    },
    {
      id: "goal_3",
      title: "Publicar 60 vídeos no TikTok",
      area: "TikTok",
      unit: "vídeos",
      target: 60,
      current: 34,
      deadline: inDays(60),
      status: "ativa",
      milestones: [],
    },
    {
      id: "goal_4",
      title: "120h de estudo até dezembro",
      area: "Estudos",
      unit: "h",
      target: 120,
      current: 71,
      deadline: inDays(100),
      status: "ativa",
      milestones: [],
    },
    {
      id: "goal_5",
      title: "Correr 5km sem parar",
      area: "Saúde",
      unit: "km",
      target: 5,
      current: 3.4,
      deadline: inDays(21),
      status: "ativa",
      milestones: [{ id: "m7", title: "Correr 2km", done: true }],
    },
    {
      id: "goal_6",
      title: "Reserva de emergência",
      area: "Finanças",
      unit: "R$",
      target: 20000,
      current: 20000,
      deadline: daysAgo(5),
      status: "concluida",
      milestones: [{ id: "m8", title: "6 meses de custo guardado", done: true }],
    },
  ];

  const courses: Course[] = [
    { id: "course_1", name: "Copywriting que Vende", platform: "Hotmart", category: "Marketing", totalLessons: 42, doneLessons: 28, status: "ativo", deadline: inDays(20), color: "#8b5cf6", createdAt: daysAgo(60) },
    { id: "course_2", name: "Tráfego Pago Essencial", platform: "Udemy", category: "Marketing", totalLessons: 30, doneLessons: 12, status: "ativo", deadline: inDays(35), color: "#3b82f6", createdAt: daysAgo(40) },
    { id: "course_3", name: "React + TypeScript", platform: "Alura", category: "Dev", totalLessons: 88, doneLessons: 61, status: "ativo", deadline: inDays(70), color: "#22d3ee", createdAt: daysAgo(120) },
    { id: "course_4", name: "Finanças para Autônomos", platform: "YouTube", category: "Finanças", totalLessons: 18, doneLessons: 18, status: "concluido", color: "#10b981", createdAt: daysAgo(150) },
    { id: "course_5", name: "Confeitaria Profissional", platform: "Presencial", category: "Negócios", totalLessons: 24, doneLessons: 9, status: "ativo", deadline: inDays(50), color: "#f59e0b", createdAt: daysAgo(80) },
    { id: "course_6", name: "Design de Interfaces", platform: "Design+", category: "Design", totalLessons: 36, doneLessons: 4, status: "pausado", color: "#f43f5e", createdAt: daysAgo(200) },
  ];

  const leads: Lead[] = [
    ["Padaria Pão Dourado", "Padaria Pão Dourado", 3200, "site_novo", "Indicação"],
    ["Studio Bella Estética", "Bella Estética", 4500, "proposta", "Instagram"],
    ["Marcenaria Silva", "Silva Marcenaria", 2800, "contato", "Google"],
    ["Dra. Camila Odonto", "Clínica Sorriso", 6200, "proposta", "Indicação"],
    ["Auto Center Turbo", "Turbo Peças", 1900, "novo", "Instagram"],
    ["Pet Shop Amigo Fiel", "Amigo Fiel", 2400, "fechado", "Google"],
    ["Academia Força Total", "Força Total", 5400, "contato", "Indicação"],
    ["Buffet Alegria", "Buffet Alegria", 3600, "fechado", "Instagram"],
    ["Lava Rápido Brilho", "Brilho Car", 1400, "perdido", "Google"],
    ["Consultório Vet Vida", "Vet Vida", 2900, "proposta", "Indicação"],
    ["Boutique Elegance", "Elegance Store", 3800, "contato", "Instagram"],
    ["Hamburgueria do Zé", "Zé Burgers", 2200, "fechado", "Indicação"],
  ].map((row, index) => ({
    id: `lead_${index + 1}`,
    name: row[0] as string,
    company: row[1] as string,
    contact: "(11) 9" + between(1000, 9999) + "-" + between(1000, 9999),
    value: row[2] as number,
    mrr: rnd() > 0.6 ? between(150, 600) : 0,
    statusId: `status_${row[3]}`,
    source: row[4] as string,
    notes: "",
    nextStep: pick([
      "Enviar proposta com 2 opções",
      "Agendar call de 20min",
      "Follow-up no WhatsApp",
      "Enviar portfólio",
      "Fechar contrato",
    ]),
    order: index,
    createdAt: daysAgo(between(1, 45)),
  }));

  const orders: Order[] = Array.from({ length: 18 }).map((_, index) => {
    const business = index % 2 === 0 ? "docura" : "massas";
    const items =
      business === "docura"
        ? [{ name: pick(["Bolo de ninho", "Bolo de chocolate", "Torta de limão", "Cupcake (12un)"]), qty: between(1, 3), price: between(45, 160) }]
        : [{ name: pick(["Lasanha 1kg", "Nhoque recheado", "Rondelli de frango", "Molho artesanal 500g"]), qty: between(1, 4), price: between(30, 95) }];
    const total = items.reduce((acc, item) => acc + item.qty * item.price, 0);
    const statuses: Order["status"][] = ["novo", "producao", "entrega", "concluido", "concluido", "cancelado"];
    return {
      id: `order_${index + 1}`,
      code: `${business === "docura" ? "DOC" : "MAS"}-${1000 + index}`,
      businessId: `biz_${business}`,
      customer: pick(["Ana Paula", "Juliana Reis", "Carlos Eduardo", "Fernanda Lima", "Marcos Souza", "Patrícia Alves", "Rafael Dias", "Bianca Melo"]),
      phone: "(11) 9" + between(1000, 9999) + "-" + between(1000, 9999),
      items,
      status: statuses[index % statuses.length],
      channel: pick(["whatsapp", "instagram", "ifood"]) as Order["channel"],
      createdAt: daysAgo(between(0, 20)),
      deliveryAt: index % 3 === 0 ? inDays(between(0, 6)) : undefined,
      notes: "",
    };
  });

  return {
    version: 1,
    tasks: makeTasks(),
    inbox: [
      { id: "inbox_1", text: "Ideia: série de vídeos 'antes e depois' dos sites dos clientes", kind: "ideia", tags: ["tiktok"], processed: false, createdAt: daysAgo(0) + "T09:12:00" },
      { id: "inbox_2", text: "Ligar para o fornecedor de farinha — desconto em 10kg", kind: "tarefa", tags: ["massas"], processed: false, createdAt: daysAgo(0) + "T11:40:00" },
      { id: "inbox_3", text: "https://referencia.design/landing-saas — usar como referência", kind: "link", tags: ["design"], processed: false, createdAt: daysAgo(1) + "T18:02:00" },
      { id: "inbox_4", text: "Cliente pediu segunda via do contrato assinado", kind: "tarefa", tags: ["sites"], processed: false, createdAt: daysAgo(1) + "T20:30:00" },
      { id: "inbox_5", text: "Testar embalagem com lacre para o delivery de massas", kind: "ideia", tags: ["massas", "produto"], processed: false, createdAt: daysAgo(2) + "T08:15:00" },
      { id: "inbox_6", text: "Nota: cliente Pão Dourado prefere reunião depois das 18h", kind: "nota", tags: ["sites"], processed: false, createdAt: daysAgo(3) + "T14:22:00" },
    ],
    leadStatuses: [
      { id: "status_novo", name: "Novo lead", color: "#60a5fa", order: 0, kind: "aberto" },
      { id: "status_contato", name: "Em contato", color: "#a78bfa", order: 1, kind: "aberto" },
      { id: "status_proposta", name: "Proposta enviada", color: "#fbbf24", order: 2, kind: "aberto" },
      { id: "status_fechado", name: "Fechado", color: "#34d399", order: 3, kind: "ganho" },
      { id: "status_perdido", name: "Perdido", color: "#fb7185", order: 4, kind: "perdido" },
    ],
    leads,
    products: [
      { id: "prod_1", name: "Kit Organizador Dobrável", sku: "TK-001", price: 89.9, cost: 38, stock: 42, sold: 128, channel: "tiktok", active: true, createdAt: daysAgo(70) },
      { id: "prod_2", name: "Luminária de Mesa LED Touch", sku: "TK-002", price: 129.9, cost: 54, stock: 18, sold: 96, channel: "tiktok", active: true, createdAt: daysAgo(64) },
      { id: "prod_3", name: "Fone Bluetooth Pro", sku: "TK-003", price: 199.9, cost: 88, stock: 7, sold: 74, channel: "tiktok", active: true, createdAt: daysAgo(52) },
      { id: "prod_4", name: "Garrafa Térmica 1L", sku: "TK-004", price: 74.9, cost: 29, stock: 63, sold: 61, channel: "tiktok", active: true, createdAt: daysAgo(44) },
      { id: "prod_5", name: "Capa de Almofada Boho", sku: "TK-005", price: 49.9, cost: 19, stock: 0, sold: 58, channel: "shopee", active: false, createdAt: daysAgo(38) },
      { id: "prod_6", name: "Escova Secadora 5 em 1", sku: "TK-006", price: 159.9, cost: 72, stock: 24, sold: 41, channel: "tiktok", active: true, createdAt: daysAgo(21) },
      { id: "prod_7", name: "Tripé Ring Light 26cm", sku: "TK-007", price: 119.9, cost: 52, stock: 11, sold: 27, channel: "tiktok", active: true, createdAt: daysAgo(12) },
      // cardápio — Srta Doçura
      { id: "menu_docura_1", businessId: "biz_docura", name: "Bolo de ninho com morango", sku: "DOC-01", price: 120, cost: 45, stock: 12, sold: 38, channel: "site", active: true, createdAt: daysAgo(90) },
      { id: "menu_docura_2", businessId: "biz_docura", name: "Bolo de chocolate belga", sku: "DOC-02", price: 110, cost: 42, stock: 10, sold: 31, channel: "site", active: true, createdAt: daysAgo(88) },
      { id: "menu_docura_3", businessId: "biz_docura", name: "Torta de limão", sku: "DOC-03", price: 95, cost: 34, stock: 8, sold: 24, channel: "site", active: true, createdAt: daysAgo(80) },
      { id: "menu_docura_4", businessId: "biz_docura", name: "Cupcake decorado (12un)", sku: "DOC-04", price: 85, cost: 30, stock: 15, sold: 19, channel: "site", active: true, createdAt: daysAgo(60) },
      { id: "menu_docura_5", businessId: "biz_docura", name: "Brigadeiro gourmet (20un)", sku: "DOC-05", price: 60, cost: 22, stock: 20, sold: 27, channel: "site", active: true, createdAt: daysAgo(45) },
      // cardápio — Srta das Massas
      { id: "menu_massas_1", businessId: "biz_massas", name: "Lasanha artesanal 1kg", sku: "MAS-01", price: 85, cost: 38, stock: 14, sold: 44, channel: "site", active: true, createdAt: daysAgo(92) },
      { id: "menu_massas_2", businessId: "biz_massas", name: "Nhoque recheado 1kg", sku: "MAS-02", price: 65, cost: 26, stock: 18, sold: 36, channel: "site", active: true, createdAt: daysAgo(85) },
      { id: "menu_massas_3", businessId: "biz_massas", name: "Rondelli de frango 1kg", sku: "MAS-03", price: 70, cost: 29, stock: 12, sold: 29, channel: "site", active: true, createdAt: daysAgo(70) },
      { id: "menu_massas_4", businessId: "biz_massas", name: "Molho artesanal 500g", sku: "MAS-04", price: 35, cost: 12, stock: 26, sold: 41, channel: "site", active: true, createdAt: daysAgo(55) },
      { id: "menu_massas_5", businessId: "biz_massas", name: "Canelone (12 unidades)", sku: "MAS-05", price: 75, cost: 31, stock: 9, sold: 22, channel: "site", active: true, createdAt: daysAgo(40) },
    ],
    contents: [
      "Unboxing do kit organizador|roteiro|18k|1240|22",
      "3 formas de organizar a cozinha|gravacao|32k|2100|31",
      "Antes e depois do closet|edicao|9k|640|8",
      "Review honesto da luminária|publicado|128k|9400|142",
      "Erros que fazem você perder tempo|ideia|0|0|0",
      "Rotina de manhã produtiva|publicado|76k|5200|88",
      "Meu setup de gravação|roteiro|4k|310|5",
      "Capa de almofada custo-benefício|publicado|54k|3900|63",
      "Testei a escova secadora|gravacao|12k|860|14",
      "Top 5 achados do mês|edicao|21k|1500|26",
      "Como eu dobro a produção|ideia|0|0|0",
      "Depoimento de cliente|publicado|38k|2700|44",
    ].map((row, index) => {
      const [title, stage, views, likes, sales] = row.split("|");
      return {
        id: `content_${index + 1}`,
        title,
        hook: pick(["Você não vai acreditar no resultado", "Isso mudou minha rotina", "Ninguém fala sobre isso", "Testei por 30 dias"]),
        stage: stage as never,
        productId: index % 3 === 0 ? `prod_${(index % 7) + 1}` : undefined,
        views: Number(views),
        likes: Number(likes),
        sales: Number(sales),
        scheduledAt: stage === "publicado" ? daysAgo(between(1, 30)) : inDays(between(1, 10)),
        order: index,
      };
    }),
    businesses: [
      { id: "biz_docura", name: "Srta Doçura", emoji: "🧁", tagline: "Confeitaria artesanal & encomendas", color: "#f43f5e", active: true },
      { id: "biz_massas", name: "Srta das Massas", emoji: "🍝", tagline: "Massas frescas e delivery", color: "#f59e0b", active: true },
    ],
    orders,
    courses,
    studySessions: lastNDays(84).flatMap((date, index) =>
      rnd() < 0.68
        ? [
            {
              id: `study_${index}`,
              courseId: `course_${between(1, 5)}`,
              minutes: between(25, 95),
              date,
            },
          ]
        : [],
    ),
    workouts: [
      { id: "wo_1", weekday: 1, title: "Peito, ombro e tríceps", focus: "Empurrar", durationMin: 55, exercises: [
        { id: "ex1", name: "Supino reto", sets: 4, reps: "8-10", load: "40kg" },
        { id: "ex2", name: "Desenvolvimento militar", sets: 3, reps: "10", load: "24kg" },
        { id: "ex3", name: "Crucifixo inclinado", sets: 3, reps: "12", load: "14kg" },
        { id: "ex4", name: "Tríceps corda", sets: 3, reps: "15", load: "20kg" },
      ] },
      { id: "wo_2", weekday: 2, title: "Costas e bíceps", focus: "Puxar", durationMin: 55, exercises: [
        { id: "ex5", name: "Barra fixa", sets: 4, reps: "até a falha" },
        { id: "ex6", name: "Remada curvada", sets: 4, reps: "10", load: "36kg" },
        { id: "ex7", name: "Puxada alta", sets: 3, reps: "12", load: "45kg" },
        { id: "ex8", name: "Rosca direta", sets: 3, reps: "12", load: "22kg" },
      ] },
      { id: "wo_3", weekday: 3, title: "Pernas completo", focus: "Inferiores", durationMin: 65, exercises: [
        { id: "ex9", name: "Agachamento livre", sets: 5, reps: "8", load: "60kg" },
        { id: "ex10", name: "Leg press", sets: 4, reps: "12", load: "120kg" },
        { id: "ex11", name: "Cadeira extensora", sets: 3, reps: "15", load: "40kg" },
        { id: "ex12", name: "Panturrilha em pé", sets: 4, reps: "20", load: "50kg" },
      ] },
      { id: "wo_4", weekday: 4, title: "Cardio + core", focus: "Condicionamento", durationMin: 45, exercises: [
        { id: "ex13", name: "Corrida intervalada", sets: 8, reps: "1min forte / 1min leve" },
        { id: "ex14", name: "Prancha", sets: 3, reps: "60s" },
        { id: "ex15", name: "Abdominal remador", sets: 3, reps: "20" },
      ] },
      { id: "wo_5", weekday: 5, title: "Full body + mobilidade", focus: "Misto", durationMin: 50, exercises: [
        { id: "ex16", name: "Levantamento terra", sets: 4, reps: "6", load: "70kg" },
        { id: "ex17", name: "Remada unilateral", sets: 3, reps: "10", load: "28kg" },
        { id: "ex18", name: "Mobilidade de quadril", sets: 3, reps: "45s" },
      ] },
      { id: "wo_6", weekday: 6, title: "Corrida leve + alongamento", focus: "Aeróbico", durationMin: 40, exercises: [
        { id: "ex19", name: "Corrida contínua", sets: 1, reps: "30min zona 2" },
        { id: "ex20", name: "Alongamento geral", sets: 1, reps: "10min" },
      ] },
    ],
    trainingSessions: lastNDays(70).flatMap((date, index) => {
      const weekday = new Date(date + "T12:00:00").getDay();
      if (weekday === 0 || rnd() > 0.66) return [];
      return [
        {
          id: `train_${index}`,
          workoutId: `wo_${weekday}`,
          title: ["Peito, ombro e tríceps", "Costas e bíceps", "Pernas completo", "Cardio + core", "Full body + mobilidade", "Corrida leve"][weekday - 1] ?? "Treino livre",
          date,
          minutes: between(35, 75),
          intensity: between(2, 5) as 1 | 2 | 3 | 4 | 5,
        },
      ];
    }),
    transactions: makeTransactions(),
    sources: [
      { id: "src_sites", name: "Sites & Landing Pages", kind: "site", target: 4500, color: "#8b5cf6", active: true },
      { id: "src_tiktok", name: "TikTok Shop", kind: "tiktok", target: 3500, color: "#22d3ee", active: true },
      { id: "src_docura", name: "Srta Doçura", kind: "delivery", target: 2500, color: "#f43f5e", active: true },
      { id: "src_massas", name: "Srta das Massas", kind: "delivery", target: 2000, color: "#f59e0b", active: true },
      { id: "src_servicos", name: "Consultorias avulsas", kind: "servico", target: 1000, color: "#10b981", active: true },
    ],
    goals,
    habits: makeHabits(),
    settings: {
      name: "João Pedro",
      theme: "dark",
      accent: "violeta",
      currency: "BRL",
      dailyFocusTarget: 240,
      focusMinutes: 50,
      breakMinutes: 10,
      modules: {
        dashboard: true,
        inbox: true,
        myday: true,
        sites: true,
        tiktok: true,
        docura: true,
        massas: true,
        studies: true,
        training: true,
        habits: true,
        goals: true,
        finance: true,
        settings: true,
      },
    },
  };
}

export const emptyData = (): AppData => {
  const seed = createSeedData();
  return {
    ...seed,
    tasks: [],
    inbox: [],
    leads: [],
    contents: [],
    orders: [],
    studySessions: [],
    trainingSessions: [],
    transactions: [],
    goals: [],
    habits: [],
  };
};

export const seedGeneratedAt = iso(new Date());
