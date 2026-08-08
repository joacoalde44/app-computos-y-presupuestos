import { Prisma } from "@prisma/client";

type APURecursoConMaterial = Prisma.APURecursoGetPayload<{ include: { material: true } }>;

export function precioUnitarioRecurso(r: APURecursoConMaterial): number {
  if (r.materialId && r.material) return r.material.precioBase;
  return r.recursoLibrePrecio ?? 0;
}

export function parcialRecurso(r: APURecursoConMaterial): number {
  return r.rendimiento * precioUnitarioRecurso(r);
}

export function precioTarea(recursos: APURecursoConMaterial[]): number {
  return recursos.reduce((acc, r) => acc + parcialRecurso(r), 0);
}

export function desglosePorTipo(recursos: APURecursoConMaterial[]) {
  const tipos = ["material", "mano_de_obra", "equipo", "subcontrato"] as const;
  const out: Record<(typeof tipos)[number], number> = {
    material: 0,
    mano_de_obra: 0,
    equipo: 0,
    subcontrato: 0,
  };
  for (const r of recursos) {
    const parcial = parcialRecurso(r);
    if (out[r.tipo as (typeof tipos)[number]] !== undefined) {
      out[r.tipo as (typeof tipos)[number]] += parcial;
    }
  }
  return out;
}
