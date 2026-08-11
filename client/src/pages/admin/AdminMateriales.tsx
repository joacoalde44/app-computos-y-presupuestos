import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { api } from "../../lib/api";
import { formatARS, formatDateAR } from "../../lib/format";
import Skeleton from "../../components/Skeleton";

const CATEGORIAS = [
  "Hormigón y cemento",
  "Hierro y acero",
  "Mampostería",
  "Revestimientos y pisos",
  "Madera y carpintería",
  "Impermeabilizantes",
  "Instalaciones eléctricas",
  "Instalaciones sanitarias",
  "Pinturas",
  "Áridos y agregados",
  "Prefabricados",
  "Varios",
];

type MaterialFull = {
  id: string;
  codigo: string | null;
  nombre: string;
  categoria: string;
  unidad: string;
  precioBase: number;
  activo: boolean;
  fechaPrecio: string;
};

const emptyForm = { codigo: "", nombre: "", categoria: CATEGORIAS[0], unidad: "", precioBase: "" };

export default function AdminMateriales() {
  const [materiales, setMateriales] = useState<MaterialFull[] | null>(null);
  const [query, setQuery] = useState("");
  const [mostrarForm, setMostrarForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [guardando, setGuardando] = useState(false);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [precioEdit, setPrecioEdit] = useState("");

  function cargar() {
    api.get("/materiales", { params: { limit: 100, q: query || undefined } }).then((r) => setMateriales(r.data.items));
  }

  useEffect(() => {
    const t = setTimeout(cargar, 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  async function handleCrear(e: React.FormEvent) {
    e.preventDefault();
    if (!form.nombre.trim() || !form.unidad.trim() || !form.precioBase) return;
    setGuardando(true);
    try {
      await api.post("/admin/materiales", {
        codigo: form.codigo || undefined,
        nombre: form.nombre.trim(),
        categoria: form.categoria,
        unidad: form.unidad.trim(),
        precioBase: Number(form.precioBase),
      });
      toast.success("Material creado");
      setForm(emptyForm);
      setMostrarForm(false);
      cargar();
    } catch {
      toast.error("No se pudo crear el material");
    } finally {
      setGuardando(false);
    }
  }

  function empezarEdicion(m: MaterialFull) {
    setEditandoId(m.id);
    setPrecioEdit(String(m.precioBase));
  }

  async function guardarPrecio(id: string) {
    try {
      await api.put(`/admin/materiales/${id}`, { precioBase: Number(precioEdit) });
      toast.success("Precio actualizado");
      setEditandoId(null);
      cargar();
    } catch {
      toast.error("No se pudo actualizar");
    }
  }

  async function toggleActivo(m: MaterialFull) {
    try {
      await api.put(`/admin/materiales/${m.id}`, { activo: !m.activo });
      cargar();
    } catch {
      toast.error("No se pudo actualizar");
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar material..."
          className="w-64 rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
        <button
          onClick={() => setMostrarForm((v) => !v)}
          className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
        >
          + Nuevo material
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
            placeholder="Nombre"
            value={form.nombre}
            onChange={(e) => setForm({ ...form, nombre: e.target.value })}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm sm:col-span-2"
          />
          <select
            value={form.categoria}
            onChange={(e) => setForm({ ...form, categoria: e.target.value })}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
          >
            {CATEGORIAS.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <input
            placeholder="Unidad"
            value={form.unidad}
            onChange={(e) => setForm({ ...form, unidad: e.target.value })}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
          <input
            type="number"
            placeholder="Precio base"
            value={form.precioBase}
            onChange={(e) => setForm({ ...form, precioBase: e.target.value })}
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
              <th className="px-4 py-3">Nombre</th>
              <th className="px-4 py-3">Categoría</th>
              <th className="px-4 py-3">Unidad</th>
              <th className="px-4 py-3">Precio base</th>
              <th className="px-4 py-3">Actualizado</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {!materiales &&
              Array.from({ length: 6 }).map((_, i) => (
                <tr key={i}>
                  <td className="px-4 py-3" colSpan={7}><Skeleton className="h-4 w-full" /></td>
                </tr>
              ))}
            {materiales?.map((m) => (
              <tr key={m.id} className={m.activo ? "" : "opacity-50"}>
                <td className="px-4 py-3 text-slate-500">{m.codigo ?? "-"}</td>
                <td className="px-4 py-3 font-medium text-slate-800">{m.nombre}</td>
                <td className="px-4 py-3 text-slate-500">{m.categoria}</td>
                <td className="px-4 py-3 text-slate-500">{m.unidad}</td>
                <td className="px-4 py-3">
                  {editandoId === m.id ? (
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        value={precioEdit}
                        onChange={(e) => setPrecioEdit(e.target.value)}
                        className="w-24 rounded border border-slate-300 px-2 py-1"
                        autoFocus
                      />
                      <button onClick={() => guardarPrecio(m.id)} className="text-brand-600 hover:underline">
                        ✓
                      </button>
                      <button onClick={() => setEditandoId(null)} className="text-slate-400 hover:underline">
                        ×
                      </button>
                    </div>
                  ) : (
                    <button onClick={() => empezarEdicion(m)} className="text-slate-700 hover:text-brand-600">
                      {formatARS(m.precioBase)}
                    </button>
                  )}
                </td>
                <td className="px-4 py-3 text-slate-500">{formatDateAR(m.fechaPrecio)}</td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => toggleActivo(m)} className="text-xs font-medium text-slate-500 hover:text-red-600">
                    {m.activo ? "Desactivar" : "Activar"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
