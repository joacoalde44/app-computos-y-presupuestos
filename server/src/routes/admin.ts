import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { requireAuth, requireAdmin } from "../middleware/auth";
import { asyncHandler } from "../utils/asyncHandler";

const router = Router();

router.use(requireAuth, requireAdmin);

// ---------- Materiales ----------

const materialSchema = z.object({
  codigo: z.string().optional().nullable(),
  nombre: z.string().min(1),
  categoria: z.string().min(1),
  unidad: z.string().min(1),
  precioBase: z.number().positive(),
});

router.post(
  "/materiales",
  asyncHandler(async (req, res) => {
    const parsed = materialSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
    const material = await prisma.material.create({ data: parsed.data });
    res.status(201).json(material);
  })
);

const materialUpdateSchema = materialSchema.partial().extend({ activo: z.boolean().optional() });

router.put(
  "/materiales/:id",
  asyncHandler(async (req, res) => {
    const parsed = materialUpdateSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
    const material = await prisma.material.update({
      where: { id: req.params.id },
      data: { ...parsed.data, fechaPrecio: parsed.data.precioBase !== undefined ? new Date() : undefined },
    });
    res.json(material);
  })
);

// ---------- Tareas ----------

const tareaSchema = z.object({
  codigo: z.string().optional().nullable(),
  descripcion: z.string().min(1),
  etapaNombre: z.string().min(1),
  unidad: z.string().min(1),
});

router.post(
  "/tareas",
  asyncHandler(async (req, res) => {
    const parsed = tareaSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
    const tarea = await prisma.tarea.create({ data: parsed.data });
    res.status(201).json(tarea);
  })
);

const tareaUpdateSchema = tareaSchema.partial().extend({ activo: z.boolean().optional() });

router.put(
  "/tareas/:id",
  asyncHandler(async (req, res) => {
    const parsed = tareaUpdateSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
    const tarea = await prisma.tarea.update({ where: { id: req.params.id }, data: parsed.data });
    res.json(tarea);
  })
);

const apuRecursoSchema = z.object({
  tipo: z.enum(["material", "mano_de_obra", "equipo", "subcontrato"]),
  rendimiento: z.number().positive(),
  materialId: z.string().optional().nullable(),
  recursoLibreNombre: z.string().optional().nullable(),
  recursoLibreUnidad: z.string().optional().nullable(),
  recursoLibrePrecio: z.number().optional().nullable(),
});

const apuUpdateSchema = z.object({ recursos: z.array(apuRecursoSchema) });

router.put(
  "/tareas/:id/apu",
  asyncHandler(async (req, res) => {
    const tarea = await prisma.tarea.findUnique({ where: { id: req.params.id } });
    if (!tarea) return res.status(404).json({ error: "Tarea no encontrada" });
    const parsed = apuUpdateSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

    await prisma.$transaction([
      prisma.aPURecurso.deleteMany({ where: { tareaId: tarea.id } }),
      ...parsed.data.recursos.map((r) =>
        prisma.aPURecurso.create({ data: { ...r, tareaId: tarea.id } })
      ),
    ]);

    const actualizado = await prisma.tarea.findUnique({
      where: { id: tarea.id },
      include: { recursosAPU: { include: { material: true } } },
    });
    res.json(actualizado);
  })
);

// ---------- UOCRA ----------

const uocraSchema = z.object({
  categoria: z.string().min(1),
  zona: z.string().min(1),
  especialidad: z.string().min(1),
  jornalHora: z.number().positive(),
  jornalDia: z.number().positive(),
  vigenciaDesde: z.coerce.date().optional(),
});

router.post(
  "/uocra",
  asyncHandler(async (req, res) => {
    const parsed = uocraSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
    const recurso = await prisma.recursoUOCRA.create({
      data: { ...parsed.data, vigenciaDesde: parsed.data.vigenciaDesde ?? new Date() },
    });
    res.status(201).json(recurso);
  })
);

const uocraUpdateSchema = uocraSchema.partial();

router.put(
  "/uocra/:id",
  asyncHandler(async (req, res) => {
    const parsed = uocraUpdateSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
    const recurso = await prisma.recursoUOCRA.update({ where: { id: req.params.id }, data: parsed.data });
    res.json(recurso);
  })
);

// ---------- Indices ----------

const indiceSchema = z.object({
  nombre: z.string().min(1),
  fuente: z.enum(["CAC", "INDEC", "ICC", "Manual"]),
  valor: z.number().positive(),
  variacionMensualPct: z.number().optional().nullable(),
  fechaVigencia: z.coerce.date(),
});

router.post(
  "/indices",
  asyncHandler(async (req, res) => {
    const parsed = indiceSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
    const indice = await prisma.indice.create({ data: parsed.data });
    res.status(201).json(indice);
  })
);

const indiceUpdateSchema = indiceSchema.partial();

router.put(
  "/indices/:id",
  asyncHandler(async (req, res) => {
    const parsed = indiceUpdateSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
    const indice = await prisma.indice.update({ where: { id: req.params.id }, data: parsed.data });
    res.json(indice);
  })
);

// ---------- Factor K ----------

const factorKSchema = z.object({
  valor: z.number().positive(),
  descripcion: z.string().optional().nullable(),
  vigenciaDesde: z.coerce.date().optional(),
});

router.post(
  "/factor-k",
  asyncHandler(async (req, res) => {
    const parsed = factorKSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
    const factorK = await prisma.factorK.create({
      data: { ...parsed.data, vigenciaDesde: parsed.data.vigenciaDesde ?? new Date() },
    });
    res.status(201).json(factorK);
  })
);

router.put(
  "/factor-k/:id",
  asyncHandler(async (req, res) => {
    const parsed = factorKSchema.partial().safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
    const factorK = await prisma.factorK.update({ where: { id: req.params.id }, data: parsed.data });
    res.json(factorK);
  })
);

// ---------- Modelos de referencia (Computo esModelo=true) ----------

const modeloUpdateSchema = z.object({
  nombre: z.string().min(1).optional(),
  modeloSuperficieM2: z.number().positive().optional().nullable(),
  modeloDormitorios: z.number().int().optional().nullable(),
  modeloBanos: z.number().int().optional().nullable(),
  modeloToilettes: z.number().int().optional().nullable(),
  modeloImgUrl: z.string().url().optional().nullable(),
  modeloPlanoUrl: z.string().url().optional().nullable(),
  modeloMemoria: z.string().optional().nullable(),
  ggPct: z.number().min(0).max(100).optional(),
  beneficioPct: z.number().min(0).max(100).optional(),
  ivaPct: z.number().min(0).max(100).optional(),
});

router.put(
  "/computos/:id",
  asyncHandler(async (req, res) => {
    const modelo = await prisma.computo.findFirst({ where: { id: req.params.id, esModelo: true } });
    if (!modelo) return res.status(404).json({ error: "Modelo no encontrado" });
    const parsed = modeloUpdateSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
    const actualizado = await prisma.computo.update({ where: { id: modelo.id }, data: parsed.data });
    res.json(actualizado);
  })
);

// ---------- Tutoriales ----------

const tutorialSchema = z.object({
  titulo: z.string().min(1),
  descripcion: z.string().min(1),
  youtubeId: z.string().min(1),
  orden: z.number().int().optional(),
});

router.post(
  "/tutoriales",
  asyncHandler(async (req, res) => {
    const parsed = tutorialSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
    const count = await prisma.tutorial.count();
    const tutorial = await prisma.tutorial.create({
      data: { ...parsed.data, orden: parsed.data.orden ?? count },
    });
    res.status(201).json(tutorial);
  })
);

const tutorialUpdateSchema = tutorialSchema.partial().extend({ activo: z.boolean().optional() });

router.put(
  "/tutoriales/:id",
  asyncHandler(async (req, res) => {
    const parsed = tutorialUpdateSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
    const tutorial = await prisma.tutorial.update({ where: { id: req.params.id }, data: parsed.data });
    res.json(tutorial);
  })
);

export default router;
