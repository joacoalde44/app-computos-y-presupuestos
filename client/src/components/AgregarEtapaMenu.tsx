import { useEffect, useState } from "react";
import { api } from "../lib/api";

export default function AgregarEtapaMenu({
  etapasExistentes,
  onAgregar,
}: {
  etapasExistentes: string[];
  onAgregar: (nombres: string[]) => void;
}) {
  const [abierto, setAbierto] = useState(false);
  const [catalogo, setCatalogo] = useState<string[] | null>(null);
  const [seleccionadas, setSeleccionadas] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (abierto && !catalogo) {
      api.get("/public/etapas").then((r) => setCatalogo(r.data));
    }
  }, [abierto, catalogo]);

  const disponibles = (catalogo ?? []).filter((e) => !etapasExistentes.includes(e));

  function toggle(nombre: string) {
    setSeleccionadas((prev) => {
      const next = new Set(prev);
      if (next.has(nombre)) next.delete(nombre);
      else next.add(nombre);
      return next;
    });
  }

  function confirmar() {
    if (seleccionadas.size === 0) return;
    onAgregar(Array.from(seleccionadas));
    setSeleccionadas(new Set());
    setAbierto(false);
  }

  return (
    <div className="relative">
      <button
        onClick={() => setAbierto((v) => !v)}
        className="rounded-lg border border-brand-600 px-4 py-2 text-sm font-semibold text-brand-600 hover:bg-brand-50"
      >
        + Agregar etapa de obra
      </button>

      {abierto && (
        <div className="absolute left-0 z-20 mt-2 w-80 rounded-xl border border-slate-200 bg-white p-3 shadow-xl">
          <div className="max-h-72 overflow-y-auto">
            {!catalogo && <p className="p-2 text-sm text-slate-500">Cargando...</p>}
            {disponibles.length === 0 && catalogo && (
              <p className="p-2 text-sm text-slate-500">Ya agregaste todas las etapas disponibles.</p>
            )}
            {disponibles.map((nombre) => (
              <label key={nombre} className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-slate-50">
                <input
                  type="checkbox"
                  checked={seleccionadas.has(nombre)}
                  onChange={() => toggle(nombre)}
                  className="rounded border-slate-300"
                />
                {nombre}
              </label>
            ))}
          </div>
          <div className="mt-2 flex justify-end gap-2 border-t border-slate-100 pt-2">
            <button onClick={() => setAbierto(false)} className="text-sm text-slate-500 hover:text-slate-700">
              Cancelar
            </button>
            <button
              onClick={confirmar}
              disabled={seleccionadas.size === 0}
              className="rounded-md bg-brand-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
            >
              Agregar ({seleccionadas.size})
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
