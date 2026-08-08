import { Router } from "express";
import { prisma } from "../lib/prisma";
import { requireAuth, requireSubscription } from "../middleware/auth";
import { asyncHandler } from "../utils/asyncHandler";

const router = Router();

router.use(requireAuth, requireSubscription);

// GET /api/calculadora/materiales?tipo=&m2=
router.get("/materiales", asyncHandler(async (req, res) => {
  const tipo = req.query.tipo as string;
  const m2 = Number(req.query.m2);
  if (!tipo || !m2 || m2 <= 0) {
    return res.status(400).json({ error: "Parametros tipo y m2 son requeridos" });
  }

  const planes = await prisma.planCalculadora.findMany({
    where: { tipoTrabajo: tipo },
  });
  if (planes.length === 0) return res.json({ tipo, m2, items: [], total: 0 });

  const materialIds = planes.map((p) => p.materialId);
  const materiales = await prisma.material.findMany({ where: { id: { in: materialIds } } });
  const materialMap = new Map(materiales.map((m) => [m.id, m]));

  const items = planes.map((p) => {
    const material = materialMap.get(p.materialId);
    const cantidad = p.cantidadPorM2 * m2;
    const costo = cantidad * (material?.precioBase ?? 0);
    return {
      materialId: p.materialId,
      nombre: material?.nombre ?? "Material",
      unidad: material?.unidad ?? "",
      cantidad: Math.round(cantidad * 100) / 100,
      precioUnitario: material?.precioBase ?? 0,
      costo: Math.round(costo),
    };
  });

  res.json({ tipo, m2, items, total: Math.round(items.reduce((acc, i) => acc + i.costo, 0)) });
}));

// GET /api/calculadora/uocra?categoria=&zona=&especialidad=&horas=
router.get("/uocra", asyncHandler(async (req, res) => {
  const categoria = req.query.categoria as string;
  const zona = (req.query.zona as string) || "A";
  const especialidad = (req.query.especialidad as string) || "Construccion";
  const horas = Number(req.query.horas) || 0;

  if (!categoria || horas <= 0) {
    return res.status(400).json({ error: "Parametros categoria y horas son requeridos" });
  }

  const recurso = await prisma.recursoUOCRA.findFirst({ where: { categoria, zona, especialidad } });
  const factorK = await prisma.factorK.findFirst({ orderBy: { vigenciaDesde: "desc" } });

  if (!recurso) return res.status(404).json({ error: "No se encontro el recurso UOCRA solicitado" });

  const sinCargas = recurso.jornalHora * horas;
  const k = factorK?.valor ?? 3.0;
  const conCargas = sinCargas * k;

  res.json({
    categoria,
    zona,
    especialidad,
    horas,
    jornalHora: recurso.jornalHora,
    factorK: k,
    costoSinCargas: Math.round(sinCargas),
    costoConCargas: Math.round(conCargas),
  });
}));

export default router;
