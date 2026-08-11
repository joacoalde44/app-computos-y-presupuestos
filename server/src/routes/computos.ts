import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { requireAuth, requireSubscription } from "../middleware/auth";
import { asyncHandler } from "../utils/asyncHandler";
import { calcularEtapa, calcularResumen } from "../utils/computoCalc";
import { desglosePorTipo } from "../utils/apu";

const router = Router();

router.use(requireAuth, requireSubscription);

const ITEM_INCLUDE = {
  tarea: { include: { recursosAPU: { include: { material: true } } } },
} as const;

async function getOwnedComputo(computoId: string, userId: string) {
  const computo = await prisma.computo.findFirst({ where: { id: computoId, usuarioId: userId, esModelo: false } });
  return computo;
}

async function getOwnedEtapa(etapaId: string, userId: string) {
  const etapa = await prisma.etapaComputo.findFirst({
    where: { id: etapaId, computo: { usuarioId: userId } },
    include: { computo: true },
  });
  return etapa;
}

async function getOwnedItem(itemId: string, userId: string) {
  const item = await prisma.itemComputo.findFirst({
    where: { id: itemId, etapa: { computo: { usuarioId: userId } } },
    include: { etapa: true },
  });
  return item;
}

function buildDetalle(computo: any) {
  const etapas = computo.etapas
    .sort((a: any, b: any) => a.orden - b.orden)
    .map((e: any) => calcularEtapa(e));
  const resumen = calcularResumen(etapas, computo.ggPct, computo.beneficioPct, computo.ivaPct);
  return {
    id: computo.id,
    nombre: computo.nombre,
    superficieM2: computo.superficieM2,
    ggPct: computo.ggPct,
    beneficioPct: computo.beneficioPct,
    ivaPct: computo.ivaPct,
    createdAt: computo.createdAt,
    updatedAt: computo.updatedAt,
    etapas,
    resumen,
  };
}

// GET /api/computos
router.get(
  "/",
  asyncHandler(async (req, res) => {
    const computos = await prisma.computo.findMany({
      where: { usuarioId: req.userId, esModelo: false },
      include: {
        etapas: { include: { items: { include: ITEM_INCLUDE } } },
      },
      orderBy: { updatedAt: "desc" },
    });
    const out = computos.map((c) => {
      const etapas = c.etapas.map((e) => calcularEtapa(e as any));
      const resumen = calcularResumen(etapas, c.ggPct, c.beneficioPct, c.ivaPct);
      return {
        id: c.id,
        nombre: c.nombre,
        superficieM2: c.superficieM2,
        etapasCount: c.etapas.length,
        total: resumen.total,
        updatedAt: c.updatedAt,
      };
    });
    res.json(out);
  })
);

const createComputoSchema = z.object({
  nombre: z.string().min(1),
  superficieM2: z.number().positive().optional(),
});

// POST /api/computos
router.post(
  "/",
  asyncHandler(async (req, res) => {
    const parsed = createComputoSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
    const computo = await prisma.computo.create({
      data: { ...parsed.data, usuarioId: req.userId! },
    });
    res.status(201).json(computo);
  })
);

// GET /api/computos/:id
router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const computo = await prisma.computo.findFirst({
      where: { id: req.params.id, usuarioId: req.userId, esModelo: false },
      include: {
        etapas: { include: { items: { include: ITEM_INCLUDE } } },
      },
    });
    if (!computo) return res.status(404).json({ error: "Computo no encontrado" });
    res.json(buildDetalle(computo));
  })
);

const updateComputoSchema = z.object({
  nombre: z.string().min(1).optional(),
  superficieM2: z.number().positive().nullable().optional(),
  ggPct: z.number().min(0).max(100).optional(),
  beneficioPct: z.number().min(0).max(100).optional(),
  ivaPct: z.number().min(0).max(100).optional(),
});

// PUT /api/computos/:id
router.put(
  "/:id",
  asyncHandler(async (req, res) => {
    const owned = await getOwnedComputo(req.params.id, req.userId!);
    if (!owned) return res.status(404).json({ error: "Computo no encontrado" });
    const parsed = updateComputoSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
    const computo = await prisma.computo.update({ where: { id: owned.id }, data: parsed.data });
    res.json(computo);
  })
);

// DELETE /api/computos/:id
router.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    const owned = await getOwnedComputo(req.params.id, req.userId!);
    if (!owned) return res.status(404).json({ error: "Computo no encontrado" });
    await prisma.computo.delete({ where: { id: owned.id } });
    res.status(204).send();
  })
);

// POST /api/computos/:id/clonar-modelo/:modeloId
router.post(
  "/:id/clonar-modelo/:modeloId",
  asyncHandler(async (req, res) => {
    const owned = await getOwnedComputo(req.params.id, req.userId!);
    if (!owned) return res.status(404).json({ error: "Computo no encontrado" });

    const modelo = await prisma.computo.findFirst({
      where: { id: req.params.modeloId, esModelo: true },
      include: { etapas: { include: { items: true }, orderBy: { orden: "asc" } } },
    });
    if (!modelo) return res.status(404).json({ error: "Modelo no encontrado" });

    const etapaBase = await prisma.etapaComputo.count({ where: { computoId: owned.id } });

    await prisma.$transaction(async (tx) => {
      let ordenEtapa = etapaBase;
      for (const etapa of modelo.etapas) {
        const nuevaEtapa = await tx.etapaComputo.create({
          data: { nombre: etapa.nombre, orden: ordenEtapa++, computoId: owned.id },
        });
        let ordenItem = 0;
        for (const item of etapa.items) {
          await tx.itemComputo.create({
            data: {
              descripcion: item.descripcion,
              unidad: item.unidad,
              cantidad: item.cantidad,
              codigo: item.codigo,
              orden: ordenItem++,
              tareaId: item.tareaId,
              etapaId: nuevaEtapa.id,
            },
          });
        }
      }
      if (!owned.superficieM2 && modelo.modeloSuperficieM2) {
        await tx.computo.update({ where: { id: owned.id }, data: { superficieM2: modelo.modeloSuperficieM2 } });
      }
    });

    const computo = await prisma.computo.findUnique({
      where: { id: owned.id },
      include: { etapas: { include: { items: { include: ITEM_INCLUDE } } } },
    });
    res.status(201).json(buildDetalle(computo));
  })
);

const addEtapasSchema = z.object({
  nombres: z.array(z.string().min(1)).min(1).optional(),
  nombre: z.string().min(1).optional(),
});

// POST /api/computos/:id/etapas
router.post(
  "/:id/etapas",
  asyncHandler(async (req, res) => {
    const owned = await getOwnedComputo(req.params.id, req.userId!);
    if (!owned) return res.status(404).json({ error: "Computo no encontrado" });
    const parsed = addEtapasSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
    const nombres = parsed.data.nombres ?? (parsed.data.nombre ? [parsed.data.nombre] : []);
    if (nombres.length === 0) return res.status(400).json({ error: "Se requiere al menos una etapa" });

    const base = await prisma.etapaComputo.count({ where: { computoId: owned.id } });
    const creadas = await prisma.$transaction(
      nombres.map((nombre, i) =>
        prisma.etapaComputo.create({ data: { nombre, orden: base + i, computoId: owned.id } })
      )
    );
    res.status(201).json(creadas);
  })
);

export default router;

// Sub-routers mounted separately in app.ts: etapasRouter, itemsRouter
export const etapasRouter = Router();
etapasRouter.use(requireAuth, requireSubscription);

const updateEtapaSchema = z.object({ nombre: z.string().min(1) });

etapasRouter.put(
  "/:id",
  asyncHandler(async (req, res) => {
    const owned = await getOwnedEtapa(req.params.id, req.userId!);
    if (!owned) return res.status(404).json({ error: "Etapa no encontrada" });
    const parsed = updateEtapaSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
    const etapa = await prisma.etapaComputo.update({ where: { id: owned.id }, data: parsed.data });
    res.json(etapa);
  })
);

etapasRouter.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    const owned = await getOwnedEtapa(req.params.id, req.userId!);
    if (!owned) return res.status(404).json({ error: "Etapa no encontrada" });
    await prisma.etapaComputo.delete({ where: { id: owned.id } });
    res.status(204).send();
  })
);

const reordenarSchema = z.array(z.object({ id: z.string(), orden: z.number().int() }));

etapasRouter.patch(
  "/reordenar",
  asyncHandler(async (req, res) => {
    const parsed = reordenarSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

    const ids = parsed.data.map((e) => e.id);
    const etapas = await prisma.etapaComputo.findMany({
      where: { id: { in: ids }, computo: { usuarioId: req.userId } },
      select: { id: true },
    });
    const ownedIds = new Set(etapas.map((e) => e.id));
    const toUpdate = parsed.data.filter((e) => ownedIds.has(e.id));

    await prisma.$transaction(
      toUpdate.map((e) => prisma.etapaComputo.update({ where: { id: e.id }, data: { orden: e.orden } }))
    );
    res.json({ updated: toUpdate.length });
  })
);

const addItemSchema = z.object({
  tareaId: z.string().optional(),
  descripcion: z.string().min(1).optional(),
  unidad: z.string().min(1).optional(),
  cantidad: z.number().min(0).default(0),
});

etapasRouter.post(
  "/:id/items",
  asyncHandler(async (req, res) => {
    const owned = await getOwnedEtapa(req.params.id, req.userId!);
    if (!owned) return res.status(404).json({ error: "Etapa no encontrada" });
    const parsed = addItemSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
    const { tareaId, cantidad } = parsed.data;

    let descripcion = parsed.data.descripcion;
    let unidad = parsed.data.unidad;
    let codigo: string | null = null;
    let esPersonalizado = true;

    if (tareaId) {
      const tarea = await prisma.tarea.findUnique({ where: { id: tareaId } });
      if (!tarea) return res.status(404).json({ error: "Tarea no encontrada" });
      descripcion = tarea.descripcion;
      unidad = tarea.unidad;
      codigo = tarea.codigo;
      esPersonalizado = false;
    }
    if (!descripcion || !unidad) {
      return res.status(400).json({ error: "descripcion y unidad son requeridos para items personalizados" });
    }

    const orden = await prisma.itemComputo.count({ where: { etapaId: owned.id } });
    const item = await prisma.itemComputo.create({
      data: { descripcion, unidad, cantidad, codigo, esPersonalizado, tareaId: tareaId ?? null, etapaId: owned.id, orden },
      include: ITEM_INCLUDE,
    });
    res.status(201).json(item);
  })
);

export const itemsRouter = Router();
itemsRouter.use(requireAuth, requireSubscription);

const updateItemSchema = z.object({
  cantidad: z.number().min(0).optional(),
  descripcion: z.string().min(1).optional(),
});

itemsRouter.put(
  "/:id",
  asyncHandler(async (req, res) => {
    const owned = await getOwnedItem(req.params.id, req.userId!);
    if (!owned) return res.status(404).json({ error: "Item no encontrado" });
    const parsed = updateItemSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
    const data: any = { ...parsed.data };
    if (data.descripcion && !owned.esPersonalizado) delete data.descripcion;
    const item = await prisma.itemComputo.update({ where: { id: owned.id }, data, include: ITEM_INCLUDE });
    res.json(item);
  })
);

itemsRouter.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    const owned = await getOwnedItem(req.params.id, req.userId!);
    if (!owned) return res.status(404).json({ error: "Item no encontrado" });
    await prisma.itemComputo.delete({ where: { id: owned.id } });
    res.status(204).send();
  })
);

// GET /api/computos/:id/incidencia
router.get(
  "/:id/incidencia",
  asyncHandler(async (req, res) => {
    const computo = await prisma.computo.findFirst({
      where: { id: req.params.id, usuarioId: req.userId, esModelo: false },
      include: { etapas: { include: { items: { include: ITEM_INCLUDE } } } },
    });
    if (!computo) return res.status(404).json({ error: "Computo no encontrado" });

    const etapas = computo.etapas.map((e) => calcularEtapa(e as any));
    const totalGeneral = etapas.reduce((acc, e) => acc + e.subtotal, 0);

    const porEtapa = etapas
      .filter((e) => e.subtotal > 0)
      .map((e) => ({
        etapa: e.nombre,
        subtotal: e.subtotal,
        pct: totalGeneral > 0 ? Math.round((e.subtotal / totalGeneral) * 1000) / 10 : 0,
      }));

    const porTipo = { material: 0, mano_de_obra: 0, equipo: 0, subcontrato: 0 };
    for (const etapa of computo.etapas) {
      for (const item of etapa.items) {
        const desglose = desglosePorTipo((item.tarea?.recursosAPU ?? []) as any);
        porTipo.material += desglose.material * item.cantidad;
        porTipo.mano_de_obra += desglose.mano_de_obra * item.cantidad;
        porTipo.equipo += desglose.equipo * item.cantidad;
        porTipo.subcontrato += desglose.subcontrato * item.cantidad;
      }
    }
    const totalTipos = Object.values(porTipo).reduce((a, b) => a + b, 0);
    const porTipoOut = Object.entries(porTipo)
      .filter(([, v]) => v > 0)
      .map(([tipo, v]) => ({
        tipo,
        subtotal: Math.round(v),
        pct: totalTipos > 0 ? Math.round((v / totalTipos) * 1000) / 10 : 0,
      }));

    res.json({ total: Math.round(totalGeneral), porEtapa, porTipo: porTipoOut });
  })
);
