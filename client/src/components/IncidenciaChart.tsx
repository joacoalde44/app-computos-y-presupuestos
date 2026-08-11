import { useEffect, useState } from "react";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { api } from "../lib/api";
import { formatARS } from "../lib/format";
import type { IncidenciaData } from "../types";

const COLORES = ["#1d4ed8", "#0891b2", "#059669", "#ca8a04", "#dc2626", "#7c3aed", "#db2777", "#4b5563"];
const TIPO_LABEL: Record<string, string> = {
  material: "Materiales",
  mano_de_obra: "Mano de obra",
  equipo: "Equipos",
  subcontrato: "Subcontratos",
};

function agruparConOtras<T extends { pct: number }>(items: T[], max: number, label: (i: T) => string) {
  if (items.length <= max) return items.map((i) => ({ ...i, __label: label(i) }));
  const ordenados = [...items].sort((a, b) => b.pct - a.pct);
  const top = ordenados.slice(0, max - 1);
  const resto = ordenados.slice(max - 1);
  const otras = resto.reduce((acc, i: any) => ({ subtotal: acc.subtotal + i.subtotal, pct: acc.pct + i.pct }), {
    subtotal: 0,
    pct: 0,
  });
  return [...top.map((i) => ({ ...i, __label: label(i) })), { ...otras, __label: "Otras" } as any];
}

export default function IncidenciaChart({ computoId }: { computoId: string }) {
  const [data, setData] = useState<IncidenciaData | null>(null);
  const [vista, setVista] = useState<"etapa" | "tipo">("etapa");

  useEffect(() => {
    api.get(`/computos/${computoId}/incidencia`).then((r) => setData(r.data));
  }, [computoId]);

  if (!data) return <p className="text-sm text-slate-500">Cargando incidencia...</p>;
  if (data.total === 0) return <p className="text-sm text-slate-500">Agregá ítems con cantidad para ver la incidencia de costos.</p>;

  const porEtapa = agruparConOtras(data.porEtapa, 8, (i) => i.etapa);
  const porTipo = data.porTipo.map((i) => ({ ...i, __label: TIPO_LABEL[i.tipo] ?? i.tipo }));
  const activos = vista === "etapa" ? porEtapa : porTipo;

  return (
    <div>
      <div className="mb-4 flex gap-1 rounded-lg bg-slate-100 p-1 text-sm font-medium">
        <button
          onClick={() => setVista("etapa")}
          className={`rounded-md px-3 py-1.5 ${vista === "etapa" ? "bg-white text-brand-700 shadow-sm" : "text-slate-500"}`}
        >
          Por etapa
        </button>
        <button
          onClick={() => setVista("tipo")}
          className={`rounded-md px-3 py-1.5 ${vista === "tipo" ? "bg-white text-brand-700 shadow-sm" : "text-slate-500"}`}
        >
          Por tipo
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={activos as any[]} dataKey="pct" nameKey="__label" innerRadius={60} outerRadius={100} paddingAngle={1}>
                {activos.map((_, i) => (
                  <Cell key={i} fill={COLORES[i % COLORES.length]} stroke="#fff" strokeWidth={2} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => `${value}%`} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="overflow-hidden rounded-xl border border-slate-200">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-3 py-2">{vista === "etapa" ? "Etapa" : "Tipo"}</th>
                <th className="px-3 py-2 text-right">Subtotal</th>
                <th className="px-3 py-2 text-right">% del total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {activos.map((i: any, idx) => (
                <tr key={idx}>
                  <td className="px-3 py-2">
                    <span className="mr-2 inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: COLORES[idx % COLORES.length] }} />
                    {i.__label}
                  </td>
                  <td className="px-3 py-2 text-right text-slate-700">{formatARS(i.subtotal)}</td>
                  <td className="px-3 py-2 text-right text-slate-700">{i.pct}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
