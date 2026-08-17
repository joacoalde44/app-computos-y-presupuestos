import { Router } from "express";
import { prisma } from "../lib/prisma";
import { desglosePorTipo } from "../utils/apu";
import { ETAPAS_OBRA } from "../data/etapas";
import { asyncHandler } from "../utils/asyncHandler";

const router = Router();

// GET /api/public/etapas
router.get("/etapas", (_req, res) => {
  res.json(ETAPAS_OBRA);
});

// GET /api/public/costos-resumen
router.get(
  "/costos-resumen",
  asyncHandler(async (_req, res) => {
    const modelo = await prisma.computo.findFirst({
      where: { esModelo: true, modeloSuperficieM2: 80 },
      include: {
        etapas: {
          include: {
            items: {
              include: {
                tarea: { include: { recursosAPU: { include: { material: true } } } },
              },
            },
          },
        },
        indice: true,
      },
    });

    if (!modelo) {
      return res.json({
        fechaActualizacion: new Date().toISOString(),
        manoDeObraM2: 0,
        materialesM2: 0,
        costoTotalM2: 0,
        variacionMensualPct: 0,
      });
    }

    let materiales = 0;
    let manoDeObra = 0;
    let equipoSubcontrato = 0;

    for (const etapa of modelo.etapas) {
      for (const item of etapa.items) {
        if (!item.tarea) continue;
        const desglose = desglosePorTipo(item.tarea.recursosAPU as any);
        materiales += desglose.material * item.cantidad;
        manoDeObra += desglose.mano_de_obra * item.cantidad;
        equipoSubcontrato += (desglose.equipo + desglose.subcontrato) * item.cantidad;
      }
    }

    const superficie = modelo.modeloSuperficieM2 || 1;
    const total = materiales + manoDeObra + equipoSubcontrato;

    res.json({
      fechaActualizacion: modelo.updatedAt.toISOString(),
      manoDeObraM2: Math.round(manoDeObra / superficie),
      materialesM2: Math.round(materiales / superficie),
      costoTotalM2: Math.round(total / superficie),
      variacionMensualPct: modelo.indice?.variacionMensualPct ?? 0,
    });
  })
);

// GET /api/public/modelos
router.get(
  "/modelos",
  asyncHandler(async (_req, res) => {
    const modelos = await prisma.computo.findMany({
      where: { esModelo: true },
      include: {
        etapas: {
          include: {
            items: {
              include: { tarea: { include: { recursosAPU: { include: { material: true } } } } },
            },
          },
        },
      },
    });

    const out = modelos.map((m) => {
      let total = 0;
      for (const etapa of m.etapas) {
        for (const item of etapa.items) {
          if (!item.tarea) continue;
          const desglose = desglosePorTipo(item.tarea.recursosAPU as any);
          total += (desglose.material + desglose.mano_de_obra + desglose.equipo + desglose.subcontrato) * item.cantidad;
        }
      }
      const superficie = m.modeloSuperficieM2 || 1;
      return {
        id: m.id,
        nombre: m.nombre,
        superficieM2: m.modeloSuperficieM2,
        dormitorios: m.modeloDormitorios,
        banos: m.modeloBanos,
        toilettes: m.modeloToilettes,
        imgUrl: m.modeloImgUrl,
        planoUrl: m.modeloPlanoUrl,
        costoM2: Math.round(total / superficie),
        costoTotal: Math.round(total),
      };
    });

    res.json(out);
  })
);

// GET /api/public/modelos/:id
router.get(
  "/modelos/:id",
  asyncHandler(async (req, res) => {
    const modelo = await prisma.computo.findFirst({
      where: { id: req.params.id, esModelo: true },
      include: {
        etapas: {
          orderBy: { orden: "asc" },
          include: {
            items: {
              orderBy: { orden: "asc" },
              include: { tarea: { include: { recursosAPU: { include: { material: true } } } } },
            },
          },
        },
      },
    });
    if (!modelo) return res.status(404).json({ error: "Modelo no encontrado" });

    const etapas = modelo.etapas.map((etapa) => {
      const items = etapa.items.map((item) => {
        const recursos = item.tarea?.recursosAPU ?? [];
        const desglose = desglosePorTipo(recursos as any);
        const precioUnitario = desglose.material + desglose.mano_de_obra + desglose.equipo + desglose.subcontrato;
        return {
          id: item.id,
          codigo: item.codigo ?? item.tarea?.codigo,
          descripcion: item.descripcion,
          unidad: item.unidad,
          cantidad: item.cantidad,
          precioUnitario: Math.round(precioUnitario),
          total: Math.round(precioUnitario * item.cantidad),
        };
      });
      const subtotal = items.reduce((acc, i) => acc + i.total, 0);
      return { id: etapa.id, nombre: etapa.nombre, orden: etapa.orden, items, subtotal };
    });

    const subtotalGeneral = etapas.reduce((acc, e) => acc + e.subtotal, 0);
    const gg = subtotalGeneral * (modelo.ggPct / 100);
    const beneficio = subtotalGeneral * (modelo.beneficioPct / 100);
    const iva = (subtotalGeneral + gg + beneficio) * (modelo.ivaPct / 100);
    const totalGeneral = subtotalGeneral + gg + beneficio + iva;

    res.json({
      id: modelo.id,
      nombre: modelo.nombre,
      superficieM2: modelo.modeloSuperficieM2,
      dormitorios: modelo.modeloDormitorios,
      banos: modelo.modeloBanos,
      toilettes: modelo.modeloToilettes,
      imgUrl: modelo.modeloImgUrl,
      planoUrl: modelo.modeloPlanoUrl,
      memoria: modelo.modeloMemoria,
      etapas,
      resumen: {
        subtotal: Math.round(subtotalGeneral),
        ggPct: modelo.ggPct,
        gg: Math.round(gg),
        beneficioPct: modelo.beneficioPct,
        beneficio: Math.round(beneficio),
        ivaPct: modelo.ivaPct,
        iva: Math.round(iva),
        total: Math.round(totalGeneral),
      },
    });
  })
);

// GET /api/public/materiales?limit=6
router.get(
  "/materiales",
  asyncHandler(async (req, res) => {
    const limit = Math.min(Number(req.query.limit) || 6, 50);
    const [materiales, total] = await Promise.all([
      prisma.material.findMany({
        where: { activo: true },
        take: limit,
        orderBy: { nombre: "asc" },
      }),
      prisma.material.count({ where: { activo: true } }),
    ]);
    res.json({
      total,
      items: materiales.map((m) => ({
        id: m.id,
        codigo: m.codigo,
        nombre: m.nombre,
        categoria: m.categoria,
        unidad: m.unidad,
        precio: m.precioBase,
      })),
    });
  })
);

// GET /api/public/tareas?limit=6
router.get(
  "/tareas",
  asyncHandler(async (req, res) => {
    const limit = Math.min(Number(req.query.limit) || 6, 50);
    const [tareas, total] = await Promise.all([
      prisma.tarea.findMany({
        where: { activo: true },
        take: limit,
        orderBy: { descripcion: "asc" },
        include: { recursosAPU: { include: { material: true } } },
      }),
      prisma.tarea.count({ where: { activo: true } }),
    ]);
    res.json({
      total,
      items: tareas.map((t) => {
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
      }),
    });
  })
);

// GET /api/public/uocra?zona=A
router.get(
  "/uocra",
  asyncHandler(async (req, res) => {
    const zona = (req.query.zona as string) || "A";
    const recursos = await prisma.recursoUOCRA.findMany({
      where: { zona },
      orderBy: [{ categoria: "asc" }, { especialidad: "asc" }],
    });
    res.json(recursos);
  })
);

// GET /api/public/indices
router.get(
  "/indices",
  asyncHandler(async (_req, res) => {
    const indices = await prisma.indice.findMany({ orderBy: { fechaVigencia: "desc" } });
    res.json(indices);
  })
);

// GET /api/public/tutoriales
router.get(
  "/tutoriales",
  asyncHandler(async (_req, res) => {
    const tutoriales = await prisma.tutorial.findMany({
      where: { activo: true },
      orderBy: { orden: "asc" },
    });
    res.json(tutoriales);
  })
);

// GET /api/public/factor-k
router.get(
  "/factor-k",
  asyncHandler(async (_req, res) => {
    const factorK = await prisma.factorK.findFirst({ orderBy: { vigenciaDesde: "desc" } });
    res.json(factorK ?? { valor: 3.0 });
  })
);

export default router;
