import ExcelJS from "exceljs";
import { calcularEtapa, calcularResumen } from "./computoCalc";

const money = "#,##0";

export async function generarExcelComputo(computo: any): Promise<Buffer> {
  const etapas = computo.etapas.sort((a: any, b: any) => a.orden - b.orden).map((e: any) => calcularEtapa(e));
  const resumen = calcularResumen(etapas, computo.ggPct, computo.beneficioPct, computo.ivaPct);

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Cómputo y Presupuesto";
  workbook.created = new Date();

  // ---- Hoja 1: Resumen ----
  const hojaResumen = workbook.addWorksheet("Resumen");
  hojaResumen.columns = [
    { header: "Etapa", key: "etapa", width: 35 },
    { header: "Subtotal", key: "subtotal", width: 18 },
  ];
  hojaResumen.getRow(1).font = { bold: true };
  for (const etapa of etapas) {
    hojaResumen.addRow({ etapa: etapa.nombre, subtotal: etapa.subtotal });
  }
  hojaResumen.addRow({});
  hojaResumen.addRow({ etapa: "Subtotal", subtotal: resumen.subtotal }).font = { bold: true };
  hojaResumen.addRow({ etapa: `Gastos generales (${resumen.ggPct}%)`, subtotal: resumen.gg });
  hojaResumen.addRow({ etapa: `Beneficio (${resumen.beneficioPct}%)`, subtotal: resumen.beneficio });
  hojaResumen.addRow({ etapa: `IVA (${resumen.ivaPct}%)`, subtotal: resumen.iva });
  const totalRow = hojaResumen.addRow({ etapa: "TOTAL GENERAL", subtotal: resumen.total });
  totalRow.font = { bold: true };
  hojaResumen.getColumn("subtotal").numFmt = money;

  // ---- Hoja 2: Detalle por ítem con APU ----
  const hojaDetalle = workbook.addWorksheet("Detalle");
  hojaDetalle.columns = [
    { header: "Etapa", key: "etapa", width: 28 },
    { header: "Código", key: "codigo", width: 10 },
    { header: "Descripción", key: "descripcion", width: 40 },
    { header: "Unidad", key: "unidad", width: 10 },
    { header: "Cantidad", key: "cantidad", width: 12 },
    { header: "P. Unitario", key: "precioUnitario", width: 15 },
    { header: "Total", key: "total", width: 15 },
    { header: "Materiales", key: "material", width: 14 },
    { header: "Mano de obra", key: "manoDeObra", width: 14 },
    { header: "Equipos", key: "equipo", width: 14 },
    { header: "Subcontratos", key: "subcontrato", width: 14 },
  ];
  hojaDetalle.getRow(1).font = { bold: true };
  for (const etapa of etapas) {
    for (const item of etapa.items) {
      hojaDetalle.addRow({
        etapa: etapa.nombre,
        codigo: item.codigo ?? "",
        descripcion: item.descripcion,
        unidad: item.unidad,
        cantidad: item.cantidad,
        precioUnitario: item.precioUnitario,
        total: item.total,
        material: item.desglose.material,
        manoDeObra: item.desglose.mano_de_obra,
        equipo: item.desglose.equipo,
        subcontrato: item.desglose.subcontrato,
      });
    }
  }
  ["precioUnitario", "total", "material", "manoDeObra", "equipo", "subcontrato"].forEach((k) => {
    hojaDetalle.getColumn(k).numFmt = money;
  });

  // ---- Hoja 3: Listado de materiales ----
  const materiales = new Map<string, { nombre: string; unidad: string; cantidad: number; precioUnitario: number }>();
  for (const etapa of computo.etapas) {
    for (const item of etapa.items) {
      const recursos = item.tarea?.recursosAPU ?? [];
      for (const r of recursos) {
        if (r.tipo !== "material" || !r.materialId || !r.material) continue;
        const cantidad = r.rendimiento * item.cantidad;
        const existente = materiales.get(r.materialId);
        if (existente) {
          existente.cantidad += cantidad;
        } else {
          materiales.set(r.materialId, {
            nombre: r.material.nombre,
            unidad: r.material.unidad,
            cantidad,
            precioUnitario: r.material.precioBase,
          });
        }
      }
    }
  }

  const hojaMateriales = workbook.addWorksheet("Materiales");
  hojaMateriales.columns = [
    { header: "Material", key: "nombre", width: 35 },
    { header: "Unidad", key: "unidad", width: 10 },
    { header: "Cantidad total", key: "cantidad", width: 16 },
    { header: "Precio unitario", key: "precioUnitario", width: 16 },
    { header: "Costo total", key: "costo", width: 16 },
  ];
  hojaMateriales.getRow(1).font = { bold: true };
  for (const [, m] of Array.from(materiales.entries()).sort((a, b) => a[1].nombre.localeCompare(b[1].nombre))) {
    hojaMateriales.addRow({
      nombre: m.nombre,
      unidad: m.unidad,
      cantidad: Math.round(m.cantidad * 100) / 100,
      precioUnitario: m.precioUnitario,
      costo: Math.round(m.cantidad * m.precioUnitario),
    });
  }
  ["precioUnitario", "costo"].forEach((k) => {
    hojaMateriales.getColumn(k).numFmt = money;
  });

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}
