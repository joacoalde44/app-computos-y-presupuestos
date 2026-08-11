import { calcularEtapa, calcularResumen } from "./computoCalc";

function formatARS(v: number): string {
  return `$ ${Math.round(v).toLocaleString("es-AR")}`;
}

function formatFechaAR(d: Date): string {
  return d.toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export function construirHtmlComputo(computo: any, logoUrl?: string | null): string {
  const etapas = computo.etapas.sort((a: any, b: any) => a.orden - b.orden).map((e: any) => calcularEtapa(e));
  const resumen = calcularResumen(etapas, computo.ggPct, computo.beneficioPct, computo.ivaPct);
  const hoy = formatFechaAR(new Date());

  const filasEtapas = etapas
    .filter((e: any) => e.items.length > 0)
    .map(
      (etapa: any) => `
        <tr class="etapa">
          <td colspan="5">${escapeHtml(etapa.nombre)}</td>
          <td class="right">${formatARS(etapa.subtotal)}</td>
        </tr>
        ${etapa.items
          .map(
            (item: any) => `
          <tr>
            <td>${item.codigo ? escapeHtml(item.codigo) : "-"}</td>
            <td>${escapeHtml(item.descripcion)}</td>
            <td class="center">${escapeHtml(item.unidad)}</td>
            <td class="right">${item.cantidad}</td>
            <td class="right">${formatARS(item.precioUnitario)}</td>
            <td class="right">${formatARS(item.total)}</td>
          </tr>`
          )
          .join("")}
      `
    )
    .join("");

  return `
<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8" />
<style>
  * { box-sizing: border-box; }
  body { font-family: Arial, Helvetica, sans-serif; color: #1e293b; font-size: 11px; margin: 0; padding: 32px; }
  header { display: flex; justify-content: space-between; align-items: center; border-bottom: 3px solid #1d4ed8; padding-bottom: 16px; margin-bottom: 20px; }
  header img { max-height: 50px; }
  h1 { font-size: 20px; margin: 0 0 4px; color: #172554; }
  .meta { color: #64748b; font-size: 11px; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 4px; }
  th { background: #f1f5f9; text-align: left; padding: 6px 8px; font-size: 9px; text-transform: uppercase; letter-spacing: 0.03em; color: #64748b; }
  td { padding: 5px 8px; border-bottom: 1px solid #f1f5f9; }
  tr.etapa td { background: #eff6ff; font-weight: bold; color: #1e40af; padding-top: 8px; padding-bottom: 8px; }
  .right { text-align: right; }
  .center { text-align: center; }
  .resumen { margin-top: 24px; width: 320px; margin-left: auto; }
  .resumen div { display: flex; justify-content: space-between; padding: 4px 0; }
  .resumen .total { border-top: 2px solid #1d4ed8; margin-top: 6px; padding-top: 8px; font-weight: bold; font-size: 14px; color: #1d4ed8; }
  footer { margin-top: 32px; border-top: 1px solid #e2e8f0; padding-top: 10px; font-size: 9px; color: #94a3b8; text-align: center; }
</style>
</head>
<body>
  <header>
    <div>
      <h1>${escapeHtml(computo.nombre)}</h1>
      <div class="meta">${computo.superficieM2 ? `${computo.superficieM2} m² · ` : ""}Fecha: ${hoy}</div>
    </div>
    ${logoUrl ? `<img src="${escapeHtml(logoUrl)}" alt="logo" />` : ""}
  </header>

  <table>
    <thead>
      <tr>
        <th>Código</th>
        <th>Descripción</th>
        <th class="center">Unidad</th>
        <th class="right">Cantidad</th>
        <th class="right">P. Unit.</th>
        <th class="right">Total</th>
      </tr>
    </thead>
    <tbody>
      ${filasEtapas}
    </tbody>
  </table>

  <div class="resumen">
    <div><span>Subtotal</span><span>${formatARS(resumen.subtotal)}</span></div>
    <div><span>Gastos generales (${resumen.ggPct}%)</span><span>${formatARS(resumen.gg)}</span></div>
    <div><span>Beneficio (${resumen.beneficioPct}%)</span><span>${formatARS(resumen.beneficio)}</span></div>
    <div><span>IVA (${resumen.ivaPct}%)</span><span>${formatARS(resumen.iva)}</span></div>
    <div class="total"><span>TOTAL</span><span>${formatARS(resumen.total)}</span></div>
  </div>

  <footer>Precios actualizados al ${hoy} — Cómputo y Presupuesto</footer>
</body>
</html>`;
}
