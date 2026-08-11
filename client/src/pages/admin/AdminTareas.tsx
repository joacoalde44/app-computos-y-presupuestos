import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { api } from "../../lib/api";
import { formatARS } from "../../lib/format";
import Skeleton from "../../components/Skeleton";
import AdminApuEditor from "../../components/admin/AdminApuEditor";
import type { TareaBusqueda } from "../../types";

type TareaAdmin = TareaBusqueda & { activo?: boolean };

const emptyForm = { codigo: "", descripcion: "", etapaNombre: "", unidad: "" };

export default function AdminTareas() {
  const [tareas, setTareas] = useState<TareaAdmin[] | null>(null);
  const [etapas, setEtapas] = useState<string[] | null>(null);
  const [query, setQuery] = useState("");
  const [mostrarForm, setMostrarForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [guardando, setGuardando] = useState(false);
  const [apuTareaId, setApuTareaId] = useState<string | null>(null);

  function cargar() {
    api.get("/tareas", { params: { limit: 100, q: query || undefined } }).then((r) => setTareas(r.data.items));
  }

  useEffect(() => {
    api.get("/public/etapas").then((r) => setEtapas(r.data));
  }, []);

  useEffect(() => {
    const t = setTimeout(cargar, 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  async function handleCrear(e: React.FormEvent) {
    e.preventDefault();
    if (!form.descripcion.trim() || !form.etapaNombre || !form.unidad.trim()) return;
    setGuardando(true);
    try {
      await api.post("/admin/tareas", {
        codigo: form.codigo || undefined,
        descripcion: form.descripcion.trim(),
        etapaNombre: form.etapaNombre,
        unidad: form.unidad.trim(),
      });
      toast.success("Tarea creada. Ahora agregale el APU.");
      setForm(emptyForm);
      setMostrarForm(false);
      cargar();
    } catch {
      toast.error("No se pudo crear la tarea");
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar tarea..."
          className="w-64 rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
        <button
          onClick={() => setMostrarForm((v) => !v)}
          className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
        >
          + Nueva tarea
        </button>
      </div>

      {mostrarForm && (
        <form onSubmit={handleCrear} className="mt-4 grid grid-cols-1 gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-5">
          <input
            placeholder="Código (opcional)"
            value={form.codigo}
            onChange={(e) => setForm({ ...form, codigo: e.target.value })}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
          <input
            placeholder="Descripción"
            value={form.descripcion}
            onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm sm:col-span-2"
          />
          <select
            value={form.etapaNombre}
            onChange={(e) => setForm({ ...form, etapaNombre: e.target.value })}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="">Etapa...</option>
            {etapas?.map((e) => (
              <option key={e} value={e}>{e}</option>
            ))}
          </select>
          <input
            placeholder="Unidad"
            value={form.unidad}
            onChange={(e) => setForm({ ...form, unidad: e.target.value })}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
          <button
            type="submit"
            disabled={guardando}
            className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
          >
            {guardando ? "Guardando..." : "Crear"}
          </button>
        </form>
      )}

      <div className="mt-4 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Código</th>
              <th className="px-4 py-3">Descripción</th>
              <th className="px-4 py-3">Etapa</th>
              <th className="px-4 py-3">Unidad</th>
              <th className="px-4 py-3">Precio (APU)</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {!tareas &&
              Array.from({ length: 6 }).map((_, i) => (
                <tr key={i}>
                  <td className="px-4 py-3" colSpan={6}><Skeleton className="h-4 w-full" /></td>
                </tr>
              ))}
            {tareas?.map((t) => (
              <tr key={t.id}>
                <td className="px-4 py-3 text-slate-500">{t.codigo ?? "-"}</td>
                <td className="px-4 py-3 font-medium text-slate-800">{t.descripcion}</td>
                <td className="px-4 py-3 text-slate-500">{t.etapa}</td>
                <td className="px-4 py-3 text-slate-500">{t.unidad}</td>
                <td className="px-4 py-3 text-slate-700">{formatARS(t.precio)}</td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => setApuTareaId(t.id)} className="text-sm font-medium text-brand-600 hover:underline">
                    Editar APU
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {apuTareaId && (
        <AdminApuEditor tareaId={apuTareaId} onClose={() => setApuTareaId(null)} onSaved={cargar} />
      )}
    </div>
  );
}
