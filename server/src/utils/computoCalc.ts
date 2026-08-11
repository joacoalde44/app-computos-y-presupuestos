import { desglosePorTipo } from "./apu";

type ItemConTarea = {
  id: string;
  codigo: string | null;
  descripcion: string;
  unidad: string;
  cantidad: number;
  orden: number;
  esPersonalizado: boolean;
  tareaId: string | null;
  tarea: { recursosAPU: any[]; codigo: string | null } | null;
};

type EtapaConItems = {
  id: string;
  nombre: string;
  orden: number;
  items: ItemConTarea[];
};

export function calcularItem(item: ItemConTarea) {
  const recursos = item.tarea?.recursosAPU ?? [];
  const desglose = desglosePorTipo(recursos as any);
  const precioUnitario = desglose.material + desglose.mano_de_obra + desglose.equipo + desglose.subcontrato;
  return {
    id: item.id,
    codigo: item.codigo ?? item.tarea?.codigo ?? null,
    descripcion: item.descripcion,
    unidad: item.unidad,
    cantidad: item.cantidad,
    orden: item.orden,
    esPersonalizado: item.esPersonalizado,
    tareaId: item.tareaId,
    precioUnitario: Math.round(precioUnitario),
    total: Math.round(precioUnitario * item.cantidad),
    desglose: {
      material: Math.round(desglose.material * item.cantidad),
      mano_de_obra: Math.round(desglose.mano_de_obra * item.cantidad),
      equipo: Math.round(desglose.equipo * item.cantidad),
      subcontrato: Math.round(desglose.subcontrato * item.cantidad),
    },
  };
}

export function calcularEtapa(etapa: EtapaConItems) {
  const items = etapa.items.sort((a, b) => a.orden - b.orden).map(calcularItem);
  const subtotal = items.reduce((acc, i) => acc + i.total, 0);
  return { id: etapa.id, nombre: etapa.nombre, orden: etapa.orden, items, subtotal };
}

export function calcularResumen(
  etapas: ReturnType<typeof calcularEtapa>[],
  ggPct: number,
  beneficioPct: number,
  ivaPct: number
) {
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
