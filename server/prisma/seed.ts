import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seed: usuarios...");
  const adminPass = await bcrypt.hash("Admin123", 10);
  const testPass = await bcrypt.hash("Test123", 10);

  await prisma.usuario.upsert({
    where: { email: "admin@app.com" },
    update: {},
    create: { email: "admin@app.com", nombre: "Admin", password: adminPass, rol: "admin" },
  });

  await prisma.usuario.upsert({
    where: { email: "prueba@app.com" },
    update: {},
    create: {
      email: "prueba@app.com",
      nombre: "Usuario de Prueba",
      password: testPass,
      rol: "user",
      subscriptionEnd: new Date("2027-12-31"),
    },
  });

  console.log("Seed: materiales...");
  const materialesData = [
    { nombre: "Arena fina", categoria: "Áridos y agregados", unidad: "M³", precioBase: 52246 },
    { nombre: "Cemento Loma Negra", categoria: "Hormigón y cemento", unidad: "Bolsa 25Kg", precioBase: 8690 },
    { nombre: "Fino a la cal (Stuko)", categoria: "Revestimientos y pisos", unidad: "Bolsa 25kg", precioBase: 25467 },
    { nombre: "Ladrillo Hueco 12x18x33", categoria: "Mampostería", unidad: "U", precioBase: 1037 },
    { nombre: "Pastina Klaukol", categoria: "Revestimientos y pisos", unidad: "Kg", precioBase: 4076 },
    { nombre: "Piedra partida 6/20", categoria: "Áridos y agregados", unidad: "M³", precioBase: 106299 },
    { nombre: "Hierro del 8mm", categoria: "Hierro y acero", unidad: "ML", precioBase: 3120 },
    { nombre: "Hierro del 10mm", categoria: "Hierro y acero", unidad: "ML", precioBase: 4890 },
    { nombre: "Alambre negro N°16", categoria: "Hierro y acero", unidad: "Kg", precioBase: 2350 },
    { nombre: "Cerámico 20x20", categoria: "Revestimientos y pisos", unidad: "M²", precioBase: 18990 },
    { nombre: "Porcellanato 80x80", categoria: "Revestimientos y pisos", unidad: "M²", precioBase: 45800 },
    { nombre: "Membrana asfáltica 4mm", categoria: "Impermeabilizantes", unidad: "M²", precioBase: 9870 },
    { nombre: "Chapa acanalada N°25", categoria: "Varios", unidad: "M²", precioBase: 21400 },
    { nombre: "Cable unipolar 2.5mm", categoria: "Instalaciones eléctricas", unidad: "ML", precioBase: 890 },
    { nombre: "Caño PVC 110mm cloacal", categoria: "Instalaciones sanitarias", unidad: "ML", precioBase: 6540 },
    { nombre: "Caño PVC 1/2\" agua fría", categoria: "Instalaciones sanitarias", unidad: "ML", precioBase: 2100 },
    { nombre: "Látex interior 20L", categoria: "Pinturas", unidad: "Balde", precioBase: 98500 },
    { nombre: "Fondo antióxido", categoria: "Pinturas", unidad: "Litro", precioBase: 12300 },
    { nombre: "Madera de pino 2x3\"", categoria: "Madera y carpintería", unidad: "ML", precioBase: 3450 },
    { nombre: "Contrapiso premoldeado H°", categoria: "Prefabricados", unidad: "M²", precioBase: 15600 },
  ];
  const materiales: Record<string, string> = {};
  for (const m of materialesData) {
    const created = await prisma.material.upsert({
      where: { id: `seed-mat-${m.nombre}` },
      update: {},
      create: { id: `seed-mat-${m.nombre}`, ...m },
    });
    materiales[m.nombre] = created.id;
  }

  console.log("Seed: tareas + APU...");
  type TareaSeed = {
    descripcion: string;
    etapaNombre: string;
    unidad: string;
    recursos: { tipo: string; rendimiento: number; materialNombre?: string; recursoLibreNombre?: string; recursoLibrePrecio?: number }[];
  };

  const tareasData: TareaSeed[] = [
    {
      descripcion: "Colocar cerámico 20x20",
      etapaNombre: "Pisos",
      unidad: "M²",
      recursos: [
        { tipo: "material", rendimiento: 1.05, materialNombre: "Cerámico 20x20" },
        { tipo: "material", rendimiento: 0.3, materialNombre: "Pastina Klaukol" },
        { tipo: "mano_de_obra", rendimiento: 1, recursoLibreNombre: "Oficial + ayudante", recursoLibrePrecio: 22411 },
      ],
    },
    {
      descripcion: "Armar encadenado H°A° 15x20",
      etapaNombre: "Estructura (columnas y vigas)",
      unidad: "ML",
      recursos: [
        { tipo: "material", rendimiento: 4, materialNombre: "Hierro del 8mm" },
        { tipo: "mano_de_obra", rendimiento: 1, recursoLibreNombre: "Oficial + ayudante", recursoLibrePrecio: 22362 },
      ],
    },
    {
      descripcion: "Revoque fino interior",
      etapaNombre: "Revoques",
      unidad: "M²",
      recursos: [
        { tipo: "material", rendimiento: 0.5, materialNombre: "Fino a la cal (Stuko)" },
        { tipo: "mano_de_obra", rendimiento: 1, recursoLibreNombre: "Oficial", recursoLibrePrecio: 12919 },
      ],
    },
    {
      descripcion: "Levantar pared ladrillo hueco 12x18x33",
      etapaNombre: "Mampostería",
      unidad: "M²",
      recursos: [
        { tipo: "material", rendimiento: 12.5, materialNombre: "Ladrillo Hueco 12x18x33" },
        { tipo: "material", rendimiento: 0.05, materialNombre: "Cemento Loma Negra" },
        { tipo: "mano_de_obra", rendimiento: 1, recursoLibreNombre: "Oficial + ayudante", recursoLibrePrecio: 18983 },
      ],
    },
    {
      descripcion: "Pintar pared interior (imp. + 3 manos)",
      etapaNombre: "Pintura",
      unidad: "M²",
      recursos: [
        { tipo: "material", rendimiento: 0.02, materialNombre: "Látex interior 20L" },
        { tipo: "mano_de_obra", rendimiento: 1, recursoLibreNombre: "Oficial", recursoLibrePrecio: 13316 },
      ],
    },
    {
      descripcion: "Colocar porcellanato 80x80",
      etapaNombre: "Pisos",
      unidad: "M²",
      recursos: [
        { tipo: "material", rendimiento: 1.05, materialNombre: "Porcellanato 80x80" },
        { tipo: "material", rendimiento: 0.35, materialNombre: "Pastina Klaukol" },
        { tipo: "mano_de_obra", rendimiento: 1, recursoLibreNombre: "Oficial especializado", recursoLibrePrecio: 39549 },
      ],
    },
    {
      descripcion: "Excavación manual de zanjas",
      etapaNombre: "Movimiento de suelos",
      unidad: "M³",
      recursos: [{ tipo: "mano_de_obra", rendimiento: 1, recursoLibreNombre: "Ayudante", recursoLibrePrecio: 15800 }],
    },
    {
      descripcion: "Hormigón para fundaciones H21",
      etapaNombre: "Fundaciones",
      unidad: "M³",
      recursos: [
        { tipo: "material", rendimiento: 7, materialNombre: "Cemento Loma Negra" },
        { tipo: "material", rendimiento: 0.5, materialNombre: "Arena fina" },
        { tipo: "material", rendimiento: 0.8, materialNombre: "Piedra partida 6/20" },
        { tipo: "mano_de_obra", rendimiento: 1, recursoLibreNombre: "Cuadrilla", recursoLibrePrecio: 62000 },
      ],
    },
    {
      descripcion: "Contrapiso de hormigón pobre",
      etapaNombre: "Contrapisos",
      unidad: "M²",
      recursos: [
        { tipo: "material", rendimiento: 1, materialNombre: "Contrapiso premoldeado H°" },
        { tipo: "mano_de_obra", rendimiento: 1, recursoLibreNombre: "Oficial", recursoLibrePrecio: 9800 },
      ],
    },
    {
      descripcion: "Colocar cubierta chapa acanalada",
      etapaNombre: "Cubierta / Techo",
      unidad: "M²",
      recursos: [
        { tipo: "material", rendimiento: 1.1, materialNombre: "Chapa acanalada N°25" },
        { tipo: "mano_de_obra", rendimiento: 1, recursoLibreNombre: "Oficial + ayudante", recursoLibrePrecio: 16400 },
      ],
    },
    {
      descripcion: "Impermeabilizar terraza con membrana",
      etapaNombre: "Aislaciones e impermeabilizaciones",
      unidad: "M²",
      recursos: [
        { tipo: "material", rendimiento: 1.15, materialNombre: "Membrana asfáltica 4mm" },
        { tipo: "mano_de_obra", rendimiento: 1, recursoLibreNombre: "Oficial", recursoLibrePrecio: 11200 },
      ],
    },
    {
      descripcion: "Tendido de circuito eléctrico por boca",
      etapaNombre: "Instalación eléctrica",
      unidad: "U",
      recursos: [
        { tipo: "material", rendimiento: 8, materialNombre: "Cable unipolar 2.5mm" },
        { tipo: "mano_de_obra", rendimiento: 1, recursoLibreNombre: "Electricista", recursoLibrePrecio: 21500 },
      ],
    },
    {
      descripcion: "Instalación cloacal por artefacto",
      etapaNombre: "Instalación sanitaria",
      unidad: "U",
      recursos: [
        { tipo: "material", rendimiento: 3, materialNombre: "Caño PVC 110mm cloacal" },
        { tipo: "mano_de_obra", rendimiento: 1, recursoLibreNombre: "Plomero", recursoLibrePrecio: 24800 },
      ],
    },
    {
      descripcion: "Colocar carpintería de madera (marco+hoja)",
      etapaNombre: "Carpintería de madera",
      unidad: "U",
      recursos: [
        { tipo: "material", rendimiento: 6, materialNombre: "Madera de pino 2x3\"" },
        { tipo: "mano_de_obra", rendimiento: 1, recursoLibreNombre: "Carpintero", recursoLibrePrecio: 32000 },
      ],
    },
    {
      descripcion: "Pintura antióxido sobre herrería",
      etapaNombre: "Carpintería metálica / Herrería",
      unidad: "M²",
      recursos: [
        { tipo: "material", rendimiento: 0.15, materialNombre: "Fondo antióxido" },
        { tipo: "mano_de_obra", rendimiento: 1, recursoLibreNombre: "Oficial pintor", recursoLibrePrecio: 10500 },
      ],
    },
  ];

  const tareas: Record<string, string> = {};
  for (const t of tareasData) {
    const tarea = await prisma.tarea.upsert({
      where: { id: `seed-tarea-${t.descripcion}` },
      update: {},
      create: {
        id: `seed-tarea-${t.descripcion}`,
        descripcion: t.descripcion,
        etapaNombre: t.etapaNombre,
        unidad: t.unidad,
      },
    });
    tareas[t.descripcion] = tarea.id;

    for (const r of t.recursos) {
      const id = `seed-apu-${t.descripcion}-${r.materialNombre ?? r.recursoLibreNombre}`;
      await prisma.aPURecurso.upsert({
        where: { id },
        update: {},
        create: {
          id,
          tareaId: tarea.id,
          tipo: r.tipo,
          rendimiento: r.rendimiento,
          materialId: r.materialNombre ? materiales[r.materialNombre] : undefined,
          recursoLibreNombre: r.recursoLibreNombre,
          recursoLibrePrecio: r.recursoLibrePrecio,
        },
      });
    }
  }

  console.log("Seed: modelo Vivienda Unifamiliar 80m²...");
  const modeloUnifamiliar = await prisma.computo.upsert({
    where: { id: "seed-modelo-unifamiliar" },
    update: {},
    create: {
      id: "seed-modelo-unifamiliar",
      nombre: "Vivienda Unifamiliar",
      esModelo: true,
      modeloSuperficieM2: 80,
      modeloDormitorios: 2,
      modeloBanos: 1,
      modeloToilettes: 1,
      modeloMemoria:
        "Vivienda unifamiliar de 80m² cubiertos, mampostería tradicional de ladrillo hueco, cubierta liviana de chapa, pisos cerámicos, terminaciones estándar. Estructura independiente de hormigón armado, instalaciones eléctrica y sanitaria completas.",
    },
  });

  const etapasModelo: { nombre: string; items: { tareaDescripcion: string; cantidad: number }[] }[] = [
    {
      nombre: "Movimiento de suelos",
      items: [{ tareaDescripcion: "Excavación manual de zanjas", cantidad: 18 }],
    },
    {
      nombre: "Fundaciones",
      items: [{ tareaDescripcion: "Hormigón para fundaciones H21", cantidad: 12 }],
    },
    {
      nombre: "Estructura (columnas y vigas)",
      items: [{ tareaDescripcion: "Armar encadenado H°A° 15x20", cantidad: 45 }],
    },
    {
      nombre: "Mampostería",
      items: [{ tareaDescripcion: "Levantar pared ladrillo hueco 12x18x33", cantidad: 140 }],
    },
    {
      nombre: "Cubierta / Techo",
      items: [{ tareaDescripcion: "Colocar cubierta chapa acanalada", cantidad: 95 }],
    },
    {
      nombre: "Contrapisos",
      items: [{ tareaDescripcion: "Contrapiso de hormigón pobre", cantidad: 80 }],
    },
    {
      nombre: "Revoques",
      items: [{ tareaDescripcion: "Revoque fino interior", cantidad: 220 }],
    },
    {
      nombre: "Pisos",
      items: [
        { tareaDescripcion: "Colocar cerámico 20x20", cantidad: 60 },
        { tareaDescripcion: "Colocar porcellanato 80x80", cantidad: 20 },
      ],
    },
    {
      nombre: "Carpintería de madera",
      items: [{ tareaDescripcion: "Colocar carpintería de madera (marco+hoja)", cantidad: 8 }],
    },
    {
      nombre: "Carpintería metálica / Herrería",
      items: [{ tareaDescripcion: "Pintura antióxido sobre herrería", cantidad: 15 }],
    },
    {
      nombre: "Pintura",
      items: [{ tareaDescripcion: "Pintar pared interior (imp. + 3 manos)", cantidad: 220 }],
    },
    {
      nombre: "Instalación eléctrica",
      items: [{ tareaDescripcion: "Tendido de circuito eléctrico por boca", cantidad: 25 }],
    },
    {
      nombre: "Instalación sanitaria",
      items: [{ tareaDescripcion: "Instalación cloacal por artefacto", cantidad: 6 }],
    },
    {
      nombre: "Aislaciones e impermeabilizaciones",
      items: [{ tareaDescripcion: "Impermeabilizar terraza con membrana", cantidad: 15 }],
    },
  ];

  let orden = 0;
  for (const etapa of etapasModelo) {
    const e = await prisma.etapaComputo.upsert({
      where: { id: `seed-etapa-unifamiliar-${etapa.nombre}` },
      update: {},
      create: {
        id: `seed-etapa-unifamiliar-${etapa.nombre}`,
        nombre: etapa.nombre,
        orden: orden++,
        computoId: modeloUnifamiliar.id,
      },
    });
    let itemOrden = 0;
    for (const item of etapa.items) {
      await prisma.itemComputo.upsert({
        where: { id: `seed-item-unifamiliar-${etapa.nombre}-${item.tareaDescripcion}` },
        update: {},
        create: {
          id: `seed-item-unifamiliar-${etapa.nombre}-${item.tareaDescripcion}`,
          descripcion: item.tareaDescripcion,
          unidad: "U",
          cantidad: item.cantidad,
          orden: itemOrden++,
          tareaId: tareas[item.tareaDescripcion],
          etapaId: e.id,
        },
      });
    }
  }

  console.log("Seed: otros modelos (Dos Plantas, Duplex, Reforma Baño)...");
  await prisma.computo.upsert({
    where: { id: "seed-modelo-dos-plantas" },
    update: {},
    create: {
      id: "seed-modelo-dos-plantas",
      nombre: "En Dos Plantas",
      esModelo: true,
      modeloSuperficieM2: 120,
      modeloDormitorios: 3,
      modeloBanos: 2,
      modeloToilettes: 1,
      modeloMemoria: "Vivienda en dos plantas de 120m² cubiertos, estructura independiente, cubierta de teja, terminaciones de categoría media.",
    },
  });

  await prisma.computo.upsert({
    where: { id: "seed-modelo-duplex" },
    update: {},
    create: {
      id: "seed-modelo-duplex",
      nombre: "Duplex",
      esModelo: true,
      modeloSuperficieM2: 200,
      modeloDormitorios: 2,
      modeloBanos: 1,
      modeloToilettes: 1,
      modeloMemoria: "Duplex de 200m² totales (2 unidades de 100m²), cada una con 2 dormitorios, 1 baño y 1 toilette.",
    },
  });

  await prisma.computo.upsert({
    where: { id: "seed-modelo-reforma-bano" },
    update: {},
    create: {
      id: "seed-modelo-reforma-bano",
      nombre: "Reforma de Baño",
      esModelo: true,
      modeloSuperficieM2: 4,
      modeloMemoria: "Reforma integral de baño de 4m²: demolición de revestimientos existentes, nueva instalación sanitaria, revestimiento cerámico y colocación de artefactos.",
    },
  });

  console.log("Seed: UOCRA zona A...");
  const uocraBase = [
    { categoria: "Oficial Especializado", construccionHora: 6800, construccionDia: 54400 },
    { categoria: "Oficial", construccionHora: 5817, construccionDia: 46536 },
    { categoria: "1/2 Oficial", construccionHora: 5375, construccionDia: 43000 },
    { categoria: "Ayudante", construccionHora: 4948, construccionDia: 39584 },
    { categoria: "Sereno", construccionHora: 4494, construccionDia: 35953 },
  ];
  const especialidadFactor: Record<string, number> = {
    Construccion: 1,
    Yeseria: 0.97,
    Electricidad: 1.08,
    Calefaccion: 1.05,
  };
  for (const zona of ["A", "B", "C", "D"]) {
    const zonaFactor = zona === "A" ? 1 : zona === "B" ? 0.95 : zona === "C" ? 0.9 : 0.85;
    for (const base of uocraBase) {
      for (const especialidad of Object.keys(especialidadFactor)) {
        const factor = zonaFactor * especialidadFactor[especialidad];
        const id = `seed-uocra-${zona}-${base.categoria}-${especialidad}`;
        await prisma.recursoUOCRA.upsert({
          where: { id },
          update: {},
          create: {
            id,
            categoria: base.categoria,
            zona,
            especialidad,
            jornalHora: Math.round(base.construccionHora * factor),
            jornalDia: Math.round(base.construccionDia * factor),
            vigenciaDesde: new Date("2026-07-01"),
          },
        });
      }
    }
  }

  console.log("Seed: índice CAC, Factor K, Tutorial...");
  const indice = await prisma.indice.upsert({
    where: { id: "seed-indice-cac-julio-2026" },
    update: {},
    create: {
      id: "seed-indice-cac-julio-2026",
      nombre: "CAC Julio 2026",
      fuente: "CAC",
      valor: 1250.0,
      variacionMensualPct: 1.8,
      fechaVigencia: new Date("2026-07-01"),
    },
  });

  await prisma.computo.updateMany({ where: { esModelo: true }, data: { indiceId: indice.id } });

  await prisma.factorK.upsert({
    where: { id: "seed-factor-k" },
    update: {},
    create: { id: "seed-factor-k", valor: 3.0, descripcion: "Coeficiente de resumen UOCRA vigente", vigenciaDesde: new Date("2026-07-01") },
  });

  await prisma.tutorial.upsert({
    where: { id: "seed-tutorial-1" },
    update: {},
    create: {
      id: "seed-tutorial-1",
      titulo: "Cómo crear un cómputo desde cero",
      descripcion: "Aprendé a armar tu primer cómputo y presupuesto de obra paso a paso, desde elegir las etapas hasta exportar el PDF final.",
      youtubeId: "dQw4w9WgXcQ",
      orden: 0,
    },
  });

  console.log("Seed completo.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
