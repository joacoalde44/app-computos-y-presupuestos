import type { EtapaDetalle } from "../types";

export function recalcularEtapaSubtotal(etapa: EtapaDetalle): EtapaDetalle {
  const items = etapa.items.map((item) => ({ ...item, total: Math.round(item.precioUnitario * item.cantidad) }));
  const subtotal = items.reduce((acc, i) => acc + i.total, 0);
  return { ...etapa, items, subtotal };
}

export function calcularResumenLocal(etapas: EtapaDetalle[], ggPct: number, beneficioPct: number, ivaPct: number) {
  const subtotal = etapas.reduce((acc, e) => acc + e.subtotal, 0);
  const gg = subtotal * (ggPct / 100);
  const beneficio = subtotal * (beneficioPct / 100);
  const iva = (subtotal + gg + beneficio) * (ivaPct / 100);
  const total = subtotal + gg + beneficio + iva;
  return {
    subtotal: Math.round(subtotal),
    ggPct,
    gg: Math.round(gg),
    beneficioPct,
    beneficio: Math.round(beneficio),
    ivaPct,
    iva: Math.round(iva),
    total: Math.round(total),
  };
}
