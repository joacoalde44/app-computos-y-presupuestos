import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api";
import { formatARS } from "../lib/format";
import Skeleton from "../components/Skeleton";
import { useAuthStore } from "../store/authStore";
import type { MaterialMuestra } from "../types";

export default function MaterialesPage() {
  const [materiales, setMateriales] = useState<MaterialMuestra[] | null>(null);
  const [query, setQuery] = useState("");
  const usuario = useAuthStore((s) => s.usuario);

  useEffect(() => {
    api.get("/public/materiales?limit=50").then((r) => setMateriales(r.data));
  }, []);

  const filtrados = (materiales ?? []).filter((m) =>
    m.nombre.toLowerCase().includes(query.toLowerCase()) || m.categoria.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 lg:px-8">
      <h1 className="text-2xl font-bold text-slate-900">Costos de materiales</h1>
      <p className="mt-2 text-slate-600">
        Precios de referencia de materiales de construcción para el mercado argentino.
      </p>

      <input
        type="search"
        placeholder="Buscar material o categoría..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="mt-6 w-full max-w-sm rounded-lg border border-slate-300 px-4 py-2 text-sm"
      />

      <div className="mt-6 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Material</th>
              <th className="px-4 py-3">Categoría</th>
              <th className="px-4 py-3">Unidad</th>
              <th className="px-4 py-3">Costo</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {!materiales &&
              Array.from({ length: 8 }).map((_, i) => (
                <tr key={i}>
                  <td className="px-4 py-3" colSpan={4}><Skeleton className="h-4 w-full" /></td>
                </tr>
              ))}
            {materiales &&
              filtrados.map((m) => (
                <tr key={m.id}>
                  <td className="px-4 py-3 font-medium text-slate-800">{m.nombre}</td>
                  <td className="px-4 py-3 text-slate-500">{m.categoria}</td>
                  <td className="px-4 py-3 text-slate-500">{m.unidad}</td>
                  <td className="px-4 py-3 text-slate-700">{formatARS(m.precio)}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {!usuario?.suscripto && (
        <div className="mt-8 rounded-xl border border-brand-200 bg-brand-50 p-6 text-center">
          <p className="font-semibold text-brand-800">Este es solo un adelanto del catálogo.</p>
          <p className="mt-1 text-sm text-brand-700">Con una suscripción activa accedés a más de 1.300 materiales actualizados.</p>
          <Link to="/suscribirse" className="mt-4 inline-block rounded-lg bg-brand-600 px-5 py-2 text-sm font-semibold text-white hover:bg-brand-700">
            Ver planes
          </Link>
        </div>
      )}
    </div>
  );
}
