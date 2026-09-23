"use strict";

const PRIMARY = "#174643";
const TEAL = "#2A9D8F";
const WARM = "#E08A4A";
const MUTED = "#3A524F";

const ID = {
  vivienda: "c4a70000-0001-4000-8000-000000000001",
  comida: "c4a70000-0001-4000-8000-000000000002",
  transporte: "c4a70000-0001-4000-8000-000000000003",
  servicios: "c4a70000-0001-4000-8000-000000000004",
  suscripciones: "c4a70000-0001-4000-8000-000000000005",
  salud: "c4a70000-0001-4000-8000-000000000006",
  educacion: "c4a70000-0001-4000-8000-000000000007",
  ocio: "c4a70000-0001-4000-8000-000000000008",
  ropa: "c4a70000-0001-4000-8000-000000000009",
  familia: "c4a70000-0001-4000-8000-00000000000a",
  cuotasTarjeta: "c4a70000-0001-4000-8000-00000000000b",
  otrosGasto: "c4a70000-0001-4000-8000-00000000000c",
  sueldo: "c4a70000-0001-4000-8000-00000000000d",
  freelance: "c4a70000-0001-4000-8000-00000000000e",
  otrosIngreso: "c4a70000-0001-4000-8000-00000000000f",
  ajuste: "c4a70000-0001-4000-8000-000000000010",
  alquiler: "c4a70000-0001-4000-8000-000000000011",
  expensas: "c4a70000-0001-4000-8000-000000000012",
  supermercado: "c4a70000-0001-4000-8000-000000000013",
  delivery: "c4a70000-0001-4000-8000-000000000014",
  restaurante: "c4a70000-0001-4000-8000-000000000015",
  nafta: "c4a70000-0001-4000-8000-000000000016",
  uber: "c4a70000-0001-4000-8000-000000000017",
  colectivo: "c4a70000-0001-4000-8000-000000000018",
  luz: "c4a70000-0001-4000-8000-000000000019",
  gas: "c4a70000-0001-4000-8000-00000000001a",
  internet: "c4a70000-0001-4000-8000-00000000001b",
  farmacia: "c4a70000-0001-4000-8000-00000000001c",
  consultas: "c4a70000-0001-4000-8000-00000000001d",
  envios: "c4a70000-0001-4000-8000-00000000001e",
};

function row(now, item) {
  return {
    id: item.id,
    user_id: null,
    parent_id: item.parentId ?? null,
    slug: item.slug,
    name: item.name,
    kind: item.kind,
    icon: item.icon,
    color: item.color,
    is_system: true,
    sort_order: item.sortOrder,
    archived_at: null,
    created_at: now,
    updated_at: now,
  };
}

/** Builds the spec §3.5 system catalog, parents first. */
function catalog(now) {
  const parents = [
    row(now, { id: ID.vivienda, slug: "vivienda", name: "Vivienda", kind: "gasto", icon: "house", color: PRIMARY, sortOrder: 10 }),
    row(now, { id: ID.comida, slug: "comida", name: "Comida", kind: "gasto", icon: "utensils", color: WARM, sortOrder: 20 }),
    row(now, { id: ID.transporte, slug: "transporte", name: "Transporte", kind: "gasto", icon: "car", color: TEAL, sortOrder: 30 }),
    row(now, { id: ID.servicios, slug: "servicios", name: "Servicios", kind: "gasto", icon: "zap", color: MUTED, sortOrder: 40 }),
    row(now, { id: ID.suscripciones, slug: "suscripciones", name: "Suscripciones", kind: "gasto", icon: "repeat", color: TEAL, sortOrder: 50 }),
    row(now, { id: ID.salud, slug: "salud", name: "Salud", kind: "gasto", icon: "heart-pulse", color: WARM, sortOrder: 60 }),
    row(now, { id: ID.educacion, slug: "educacion", name: "Educación", kind: "gasto", icon: "graduation-cap", color: PRIMARY, sortOrder: 70 }),
    row(now, { id: ID.ocio, slug: "ocio", name: "Ocio", kind: "gasto", icon: "ticket", color: WARM, sortOrder: 80 }),
    row(now, { id: ID.ropa, slug: "ropa", name: "Ropa", kind: "gasto", icon: "shirt", color: MUTED, sortOrder: 90 }),
    row(now, { id: ID.familia, slug: "familia", name: "Familia", kind: "gasto", icon: "users", color: PRIMARY, sortOrder: 100 }),
    row(now, { id: ID.cuotasTarjeta, slug: "cuotas-tarjeta", name: "Cuotas y tarjeta", kind: "gasto", icon: "credit-card", color: MUTED, sortOrder: 110 }),
    row(now, { id: ID.otrosGasto, slug: "otros-gasto", name: "Otros", kind: "gasto", icon: "circle", color: MUTED, sortOrder: 120 }),
    row(now, { id: ID.sueldo, slug: "sueldo", name: "Sueldo", kind: "ingreso", icon: "banknote", color: TEAL, sortOrder: 10 }),
    row(now, { id: ID.freelance, slug: "freelance", name: "Freelance", kind: "ingreso", icon: "briefcase", color: PRIMARY, sortOrder: 20 }),
    row(now, { id: ID.otrosIngreso, slug: "otros-ingreso", name: "Otros", kind: "ingreso", icon: "circle", color: MUTED, sortOrder: 30 }),
    row(now, { id: ID.ajuste, slug: "ajuste", name: "Ajuste", kind: "ajuste", icon: "scale", color: MUTED, sortOrder: 10 }),
  ];

  const children = [
    row(now, { id: ID.alquiler, parentId: ID.vivienda, slug: "alquiler", name: "Alquiler", kind: "gasto", icon: "house", color: PRIMARY, sortOrder: 1 }),
    row(now, { id: ID.expensas, parentId: ID.vivienda, slug: "expensas", name: "Expensas", kind: "gasto", icon: "house", color: PRIMARY, sortOrder: 2 }),
    row(now, { id: ID.supermercado, parentId: ID.comida, slug: "supermercado", name: "Supermercado", kind: "gasto", icon: "utensils", color: WARM, sortOrder: 1 }),
    row(now, { id: ID.delivery, parentId: ID.comida, slug: "delivery", name: "Delivery", kind: "gasto", icon: "utensils", color: WARM, sortOrder: 2 }),
    row(now, { id: ID.restaurante, parentId: ID.comida, slug: "restaurante", name: "Restaurante", kind: "gasto", icon: "utensils", color: WARM, sortOrder: 3 }),
    row(now, { id: ID.nafta, parentId: ID.transporte, slug: "nafta", name: "Nafta", kind: "gasto", icon: "car", color: TEAL, sortOrder: 1 }),
    row(now, { id: ID.uber, parentId: ID.transporte, slug: "uber", name: "Uber / taxi", kind: "gasto", icon: "car", color: TEAL, sortOrder: 2 }),
    row(now, { id: ID.colectivo, parentId: ID.transporte, slug: "colectivo", name: "Colectivo", kind: "gasto", icon: "car", color: TEAL, sortOrder: 3 }),
    row(now, { id: ID.luz, parentId: ID.servicios, slug: "luz", name: "Luz", kind: "gasto", icon: "zap", color: MUTED, sortOrder: 1 }),
    row(now, { id: ID.gas, parentId: ID.servicios, slug: "gas", name: "Gas", kind: "gasto", icon: "zap", color: MUTED, sortOrder: 2 }),
    row(now, { id: ID.internet, parentId: ID.servicios, slug: "internet", name: "Internet", kind: "gasto", icon: "zap", color: MUTED, sortOrder: 3 }),
    row(now, { id: ID.farmacia, parentId: ID.salud, slug: "farmacia", name: "Farmacia", kind: "gasto", icon: "heart-pulse", color: WARM, sortOrder: 1 }),
    row(now, { id: ID.consultas, parentId: ID.salud, slug: "consultas", name: "Consultas", kind: "gasto", icon: "heart-pulse", color: WARM, sortOrder: 2 }),
    row(now, { id: ID.envios, parentId: ID.familia, slug: "envios", name: "Envíos", kind: "gasto", icon: "users", color: PRIMARY, sortOrder: 1 }),
  ];

  return { parents, children, all: [...parents, ...children] };
}

/** Inserts missing system categories; safe to re-run. */
async function insertMissing(queryInterface, rows) {
  const [existing] = await queryInterface.sequelize.query("SELECT slug FROM categories");
  const have = new Set(existing.map((item) => item.slug));
  const pending = rows.filter((item) => !have.has(item.slug));
  if (pending.length === 0) {
    return;
  }
  await queryInterface.bulkInsert("categories", pending);
}

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    const now = new Date();
    const { parents, children } = catalog(now);
    await insertMissing(queryInterface, parents);
    await insertMissing(queryInterface, children);
  },

  async down(queryInterface, Sequelize) {
    const { all } = catalog(new Date());
    await queryInterface.bulkDelete("categories", {
      slug: { [Sequelize.Op.in]: all.map((item) => item.slug) },
    });
  },
};
