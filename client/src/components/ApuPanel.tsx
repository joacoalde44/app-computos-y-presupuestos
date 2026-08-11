import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { formatARS } from "../lib/format";
import type { TareaAPU } from "../types";

const TIPO_LABEL: Record<string, string> = {
  material: "Material",
  mano_de_obra: "Mano de obra",
  equipo: "Equipo",
  subcontrato: "Subcontrato",
};

export default function ApuPanel({ tareaId, onClose }: { tareaId: string; onClose: () => void }) {
  const [apu, setApu] = useState<TareaAPU | null>(null);

  useEffect(() => {
    setApu(null);
    api.get(`/tareas/${tareaId}/apu`).then((r) => setApu(r.data));
  }, [tareaId]);

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/30" onClick={onClose}>
      <div
        className="h-full w-full max-w-md overflow-y-auto bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <h2 className="text-lg font-bold text-slate-900">Análisis de Precio Unitario</h2>
          <button onClick={onClose} className="text-2xl leading-none text-slate-400 hover:text-slate-600">
            ×
          </button>
        </div>

        {!apu && <p className="mt-6 text-sm text-slate-500">Cargando...</p>}

        {apu && (
          <>
            <p className="mt-2 text-sm text-slate-600">{apu.descripcion}</p>
            <p className="text-xs text-slate-400">
              {apu.etapa} · Unidad: {apu.unidad}
            </p>

            <div className="mt-5 overflow-hidden rounded-lg border border-slate-200">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-3 py-2">Recurso</th>
                    <th className="px-3 py-2">Tipo</th>
                    <th className="px-3 py-2 text-right">Rend.</th>
                    <th className="px-3 py-2 text-right">P. Unit.</th>
                    <th className="px-3 py-2 text-right">Parcial</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {apu.recursos.map((r) => (
                    <tr key={r.id}>
                      <td className="px-3 py-2 text-slate-800">{r.nombre}</td>
                      <td className="px-3 py-2 text-slate-500">{TIPO_LABEL[r.tipo] ?? r.tipo}</td>
                      <td className="px-3 py-2 text-right text-slate-600">{r.rendimiento}</td>
                      <td className="px-3 py-2 text-right text-slate-600">{formatARS(r.precioUnitario)}</td>
                      <td className="px-3 py-2 text-right font-medium text-slate-800">{formatARS(r.parcial)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-4 space-y-1 text-sm">
              {Object.entries(apu.subtotales)
                .filter(([, v]) => v > 0)
                .map(([tipo, v]) => (
                  <div key={tipo} className="flex justify-between text-slate-600">
                    <span>Subtotal {TIPO_LABEL[tipo] ?? tipo}</span>
                    <span>{formatARS(v)}</span>
                  </div>
                ))}
              <div className="flex justify-between border-t border-slate-200 pt-2 text-base font-bold text-slate-900">
                <span>Precio unitario</span>
                <span className="text-brand-700">{formatARS(apu.precioUnitario)}</span>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
