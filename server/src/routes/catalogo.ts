import { Router } from "express";
import { prisma } from "../lib/prisma";
import { requireAuth, requireSubscription } from "../middleware/auth";
import { asyncHandler } from "../utils/asyncHandler";
import { desglosePorTipo, parcialRecurso, precioUnitarioRecurso } from "../utils/apu";

const materialesRouter = Router();
materialesRouter.use(requireAuth, requireSubscription);

// GET /api/materiales?q=&categoria=&page=&limit=
materialesRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const q = (req.query.q as string) || undefined;
    const categoria = (req.query.categoria as string) || undefined;
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(Number(req.query.limit) || 50, 100);

    const where = {
      activo: true,
      ...(q ? { nombre: { contains: q, mode: "insensitive" as const } } : {}),
      ...(categoria ? { categoria } : {}),
    };

    const [materiales, total] = await Promise.all([
      prisma.material.findMany({ where, orderBy: { nombre: "asc" }, skip: (page - 1) * limit, take: limit }),
      prisma.material.count({ where }),
    ]);

    res.json({ items: materiales, total, page, pageSize: limit, totalPages: Math.ceil(total / limit) });
  })
);

const tareasRouter = Router();
tareasRouter.use(requireAuth, requireSubscription);

// GET /api/tareas?q=&etapa=&page=&limit=
tareasRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const q = (req.query.q as string) || undefined;
    const etapa = (req.query.etapa as string) || undefined;
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(Number(req.query.limit) || 50, 100);

    const where = {
      activo: true,
      ...(q ? { descripcion: { contains: q, mode: "insensitive" as const } } : {}),
      ...(etapa ? { etapaNombre: etapa } : {}),
    };

    const [tareas, total] = await Promise.all([
      prisma.tarea.findMany({
        where,
        orderBy: { descripcion: "asc" },
        skip: (page - 1) * limit,
        take: limit,
        include: { recursosAPU: { include: { material: true } } },
      }),
      prisma.tarea.count({ where }),
    ]);

    const items = tareas.map((t) => {
      const desglose = desglosePorTipo(t.recursosAPU as any);
      const precio = desglose.material + desglose.mano_de_obra + desglose.equipo + desglose.subcontrato;
      return {
        id: t.id,
        codigo: t.codigo,
        descripcion: t.descripcion,
        etapa: t.etapaNombre,
        unidad: t.unidad,
        precio: Math.round(precio),
      };
    });

    res.json({ items, total, page, pageSize: limit, totalPages: Math.ceil(total / limit) });
  })
);

// GET /api/tareas/:id/apu
tareasRouter.get(
  "/:id/apu",
  asyncHandler(async (req, res) => {
    const tarea = await prisma.tarea.findUnique({
      where: { id: req.params.id },
      include: { recursosAPU: { include: { material: true } } },
    });
    if (!tarea) return res.status(404).json({ error: "Tarea no encontrada" });

    const recursos = tarea.recursosAPU.map((r) => ({
      id: r.id,
      tipo: r.tipo,
      materialId: r.materialId,
      nombre: r.material?.nombre ?? r.recursoLibreNombre ?? "",
      unidad: r.material?.unidad ?? r.recursoLibreUnidad ?? "",
      rendimiento: r.rendimiento,
      precioUnitario: precioUnitarioRecurso(r as any),
      parcial: Math.round(parcialRecurso(r as any)),
    }));

    const desglose = desglosePorTipo(tarea.recursosAPU as any);
    const subtotales = {
      material: Math.round(desglose.material),
      mano_de_obra: Math.round(desglose.mano_de_obra),
      equipo: Math.round(desglose.equipo),
      subcontrato: Math.round(desglose.subcontrato),
    };
    const precioUnitario = Math.round(desglose.material + desglose.mano_de_obra + desglose.equipo + desglose.subcontrato);

    res.json({
      id: tarea.id,
      codigo: tarea.codigo,
      descripcion: tarea.descripcion,
      etapa: tarea.etapaNombre,
      unidad: tarea.unidad,
      recursos,
      subtotales,
      precioUnitario,
    });
  })
);

export { materialesRouter, tareasRouter };
