import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { formatDateAR, formatPct } from "../lib/format";
import Skeleton from "../components/Skeleton";
import type { Indice } from "../types";

export default function IndicesPage() {
  const [indices, setIndices] = useState<Indice[] | null>(null);

  useEffect(() => {
    api.get("/public/indices").then((r) => setIndices(r.data));
  }, []);

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 lg:px-8">
      <h1 className="text-2xl font-bold text-slate-900">Índices de costos</h1>
      <p className="mt-2 text-slate-600">Histórico de índices CAC, ICC e INDEC utilizados para actualizar los precios del catálogo.</p>

      <div className="mt-6 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Nombre</th>
              <th className="px-4 py-3">Fuente</th>
              <th className="px-4 py-3">Valor</th>
              <th className="px-4 py-3">Variación mensual</th>
              <th className="px-4 py-3">Vigencia</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {!indices &&
              Array.from({ length: 3 }).map((_, i) => (
                <tr key={i}>
                  <td className="px-4 py-3" colSpan={5}><Skeleton className="h-4 w-full" /></td>
                </tr>
              ))}
            {indices?.map((idx) => (
              <tr key={idx.id}>
                <td className="px-4 py-3 font-medium text-slate-800">{idx.nombre}</td>
                <td className="px-4 py-3 text-slate-500">{idx.fuente}</td>
                <td className="px-4 py-3 text-slate-700">{idx.valor.toLocaleString("es-AR")}</td>
                <td className="px-4 py-3 text-slate-700">{formatPct(idx.variacionMensualPct)}</td>
                <td className="px-4 py-3 text-slate-500">{formatDateAR(idx.fechaVigencia)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
