import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api";
import { formatARS } from "../lib/format";
import Skeleton from "../components/Skeleton";
import { useAuthStore } from "../store/authStore";
import type { TareaMuestra } from "../types";

export default function ManoDeObraPage() {
  const [tareas, setTareas] = useState<TareaMuestra[] | null>(null);
  const [total, setTotal] = useState(0);
  const [query, setQuery] = useState("");
  const usuario = useAuthStore((s) => s.usuario);

  useEffect(() => {
    api.get("/public/tareas?limit=50").then((r) => {
      setTareas(r.data.items);
      setTotal(r.data.total);
    });
  }, []);

  const filtradas = (tareas ?? []).filter((t) =>
    t.descripcion.toLowerCase().includes(query.toLowerCase()) || t.etapa.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 lg:px-8">
      <h1 className="text-2xl font-bold text-slate-900">Costos de mano de obra</h1>
      <p className="mt-2 text-slate-600">Precios de referencia de tareas de construcción, incluyendo materiales y mano de obra.</p>

      <input
        type="search"
        placeholder="Buscar tarea o etapa..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="mt-6 w-full max-w-sm rounded-lg border border-slate-300 px-4 py-2 text-sm"
      />

      {tareas && total > tareas.length && (
        <p className="mt-3 text-sm text-slate-500">
          Mostrando {tareas.length} de {total} tareas.
        </p>
      )}

      <div className="mt-6 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Tarea</th>
              <th className="px-4 py-3">Etapa</th>
              <th className="px-4 py-3">Unidad</th>
              <th className="px-4 py-3">Costo</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {!tareas &&
              Array.from({ length: 8 }).map((_, i) => (
                <tr key={i}>
                  <td className="px-4 py-3" colSpan={4}><Skeleton className="h-4 w-full" /></td>
                </tr>
              ))}
            {tareas &&
              filtradas.map((t) => (
                <tr key={t.id}>
                  <td className="px-4 py-3 font-medium text-slate-800">{t.descripcion}</td>
                  <td className="px-4 py-3 text-slate-500">{t.etapa}</td>
                  <td className="px-4 py-3 text-slate-500">{t.unidad}</td>
                  <td className="px-4 py-3 text-slate-700">{formatARS(t.precio)}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {!usuario?.suscripto && (
        <div className="mt-8 rounded-xl border border-brand-200 bg-brand-50 p-6 text-center">
          <p className="font-semibold text-brand-800">Este es solo un adelanto del catálogo.</p>
          <p className="mt-1 text-sm text-brand-700">
            Suscribite para ver la lista completa de {total > 0 ? `las ${total} tareas` : "tareas"} con su análisis de precio unitario (APU).
          </p>
          <Link to="/suscribirse" className="mt-4 inline-block rounded-lg bg-brand-600 px-5 py-2 text-sm font-semibold text-white hover:bg-brand-700">
            Ver planes
          </Link>
        </div>
      )}
    </div>
  );
}
