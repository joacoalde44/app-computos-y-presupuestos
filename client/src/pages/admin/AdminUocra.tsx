import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { api } from "../../lib/api";
import { formatARS } from "../../lib/format";
import Skeleton from "../../components/Skeleton";
import type { RecursoUocra } from "../../types";

const ZONAS = ["A", "B", "C", "D"];
const ESPECIALIDADES = ["Construccion", "Yeseria", "Electricidad", "Calefaccion"];
const CATEGORIAS = ["Oficial Especializado", "Oficial", "1/2 Oficial", "Ayudante", "Sereno"];

const emptyForm = { categoria: CATEGORIAS[0], especialidad: ESPECIALIDADES[0], jornalHora: "", jornalDia: "" };

export default function AdminUocra() {
  const [zona, setZona] = useState("A");
  const [recursos, setRecursos] = useState<RecursoUocra[] | null>(null);
  const [editando, setEditando] = useState<string | null>(null);
  const [horaEdit, setHoraEdit] = useState("");
  const [diaEdit, setDiaEdit] = useState("");
  const [mostrarForm, setMostrarForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [guardando, setGuardando] = useState(false);

  function cargar() {
    setRecursos(null);
    api.get(`/public/uocra`, { params: { zona } }).then((r) => setRecursos(r.data));
  }

  useEffect(cargar, [zona]);

  function empezarEdicion(r: RecursoUocra) {
    setEditando(r.id);
    setHoraEdit(String(r.jornalHora));
    setDiaEdit(String(r.jornalDia));
  }

  async function guardarEdicion(id: string) {
    try {
      await api.put(`/admin/uocra/${id}`, { jornalHora: Number(horaEdit), jornalDia: Number(diaEdit) });
      toast.success("Actualizado");
      setEditando(null);
      cargar();
    } catch {
      toast.error("No se pudo actualizar");
    }
  }

  async function handleCrear(e: React.FormEvent) {
    e.preventDefault();
    if (!form.jornalHora || !form.jornalDia) return;
    setGuardando(true);
    try {
      await api.post("/admin/uocra", {
        categoria: form.categoria,
        zona,
        especialidad: form.especialidad,
        jornalHora: Number(form.jornalHora),
        jornalDia: Number(form.jornalDia),
      });
      toast.success("Fila UOCRA creada");
      setForm(emptyForm);
      setMostrarForm(false);
      cargar();
    } catch {
      toast.error("No se pudo crear");
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-slate-600">Zona</label>
          <select value={zona} onChange={(e) => setZona(e.target.value)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm">
            {ZONAS.map((z) => (
              <option key={z} value={z}>Zona {z}</option>
            ))}
          </select>
        </div>
        <button
          onClick={() => setMostrarForm((v) => !v)}
          className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
        >
          + Nueva fila
        </button>
      </div>

      {mostrarForm && (
        <form onSubmit={handleCrear} className="mt-4 grid grid-cols-1 gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-5">
          <select
            value={form.categoria}
            onChange={(e) => setForm({ ...form, categoria: e.target.value })}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
          >
            {CATEGORIAS.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <select
            value={form.especialidad}
            onChange={(e) => setForm({ ...form, especialidad: e.target.value })}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
          >
            {ESPECIALIDADES.map((e) => (
              <option key={e} value={e}>{e}</option>
            ))}
          </select>
          <input
            type="number"
            placeholder="Jornal hora"
            value={form.jornalHora}
            onChange={(e) => setForm({ ...form, jornalHora: e.target.value })}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
          <input
            type="number"
            placeholder="Jornal día"
            value={form.jornalDia}
            onChange={(e) => setForm({ ...form, jornalDia: e.target.value })}
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
              <th className="px-4 py-3">Categoría</th>
              <th className="px-4 py-3">Especialidad</th>
              <th className="px-4 py-3">Jornal hora</th>
              <th className="px-4 py-3">Jornal día</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {!recursos &&
              Array.from({ length: 6 }).map((_, i) => (
                <tr key={i}>
                  <td className="px-4 py-3" colSpan={5}><Skeleton className="h-4 w-full" /></td>
                </tr>
              ))}
            {recursos?.map((r) => (
              <tr key={r.id}>
                <td className="px-4 py-3 font-medium text-slate-800">{r.categoria}</td>
                <td className="px-4 py-3 text-slate-500">{r.especialidad}</td>
                {editando === r.id ? (
                  <>
                    <td className="px-4 py-3">
                      <input value={horaEdit} onChange={(e) => setHoraEdit(e.target.value)} type="number" className="w-24 rounded border border-slate-300 px-2 py-1" />
                    </td>
                    <td className="px-4 py-3">
                      <input value={diaEdit} onChange={(e) => setDiaEdit(e.target.value)} type="number" className="w-24 rounded border border-slate-300 px-2 py-1" />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => guardarEdicion(r.id)} className="text-brand-600 hover:underline">Guardar</button>
                      <button onClick={() => setEditando(null)} className="ml-2 text-slate-400 hover:underline">Cancelar</button>
                    </td>
                  </>
                ) : (
                  <>
                    <td className="px-4 py-3 text-slate-700">{formatARS(r.jornalHora)}</td>
                    <td className="px-4 py-3 text-slate-700">{formatARS(r.jornalDia)}</td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => empezarEdicion(r)} className="text-sm font-medium text-brand-600 hover:underline">Editar</button>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
