import { useEffect, useRef, useState } from "react";
import { api } from "../lib/api";
import { formatARS } from "../lib/format";
import { useDebouncedCallback } from "../lib/useDebouncedCallback";
import type { TareaBusqueda } from "../types";

export default function BuscadorTareas({
  onSelect,
  onCrearPersonalizado,
  onClose,
}: {
  onSelect: (tarea: TareaBusqueda) => void;
  onCrearPersonalizado: (descripcion: string, unidad: string) => void;
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");
  const [resultados, setResultados] = useState<TareaBusqueda[] | null>(null);
  const [modoPersonalizado, setModoPersonalizado] = useState(false);
  const [descPersonalizada, setDescPersonalizada] = useState("");
  const [unidadPersonalizada, setUnidadPersonalizada] = useState("U");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const buscar = useDebouncedCallback((q: string) => {
    if (!q.trim()) {
      setResultados(null);
      return;
    }
    api.get("/tareas", { params: { q, limit: 8 } }).then((r) => setResultados(r.data.items));
  }, 300);

  function handleChange(v: string) {
    setQuery(v);
    buscar(v);
  }

  if (modoPersonalizado) {
    return (
      <div className="mt-2 rounded-lg border border-slate-200 bg-slate-50 p-3">
        <div className="flex gap-2">
          <input
            autoFocus
            value={descPersonalizada}
            onChange={(e) => setDescPersonalizada(e.target.value)}
            placeholder="Descripción del ítem"
            className="flex-1 rounded-md border border-slate-300 px-2 py-1.5 text-sm"
          />
          <input
            value={unidadPersonalizada}
            onChange={(e) => setUnidadPersonalizada(e.target.value)}
            placeholder="Unidad"
            className="w-20 rounded-md border border-slate-300 px-2 py-1.5 text-sm"
          />
        </div>
        <div className="mt-2 flex justify-end gap-2 text-sm">
          <button onClick={onClose} className="text-slate-500 hover:text-slate-700">
            Cancelar
          </button>
          <button
            onClick={() => descPersonalizada.trim() && onCrearPersonalizado(descPersonalizada.trim(), unidadPersonalizada.trim() || "U")}
            disabled={!descPersonalizada.trim()}
            className="rounded-md bg-brand-600 px-3 py-1 font-medium text-white hover:bg-brand-700 disabled:opacity-50"
          >
            Agregar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative mt-2">
      <div className="flex gap-2">
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => handleChange(e.target.value)}
          placeholder="Buscar ítem del catálogo..."
          className="flex-1 rounded-md border border-slate-300 px-3 py-1.5 text-sm"
        />
        <button onClick={onClose} className="px-2 text-sm text-slate-400 hover:text-slate-600">
          ×
        </button>
      </div>

      {resultados && (
        <div className="absolute z-10 mt-1 w-full rounded-lg border border-slate-200 bg-white shadow-lg">
          {resultados.length === 0 && (
            <p className="px-3 py-2 text-sm text-slate-500">Sin resultados.</p>
          )}
          {resultados.map((t) => (
            <button
              key={t.id}
              onClick={() => onSelect(t)}
              className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-slate-50"
            >
              <span>
                <span className="text-slate-800">{t.descripcion}</span>
                <span className="ml-2 text-xs text-slate-400">{t.unidad}</span>
              </span>
              <span className="text-slate-500">{formatARS(t.precio)}</span>
            </button>
          ))}
          <button
            onClick={() => setModoPersonalizado(true)}
            className="block w-full border-t border-slate-100 px-3 py-2 text-left text-sm font-medium text-brand-600 hover:bg-brand-50"
          >
            + Crear ítem personalizado
          </button>
        </div>
      )}
    </div>
  );
}
