import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { api } from "../../lib/api";
import { formatDateAR, formatPct } from "../../lib/format";
import Skeleton from "../../components/Skeleton";
import type { Indice } from "../../types";

const FUENTES = ["CAC", "INDEC", "ICC", "Manual"];
const emptyForm = { nombre: "", fuente: FUENTES[0], valor: "", variacionMensualPct: "", fechaVigencia: "" };

type FactorK = { id: string; valor: number; descripcion: string | null; vigenciaDesde: string };

export default function AdminIndices() {
  const [indices, setIndices] = useState<Indice[] | null>(null);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [guardando, setGuardando] = useState(false);

  const [factorK, setFactorK] = useState<FactorK | null>(null);
  const [factorKValor, setFactorKValor] = useState("");
  const [guardandoFactorK, setGuardandoFactorK] = useState(false);

  function cargar() {
    api.get("/public/indices").then((r) => setIndices(r.data));
  }

  function cargarFactorK() {
    api.get("/public/factor-k").then((r) => {
      setFactorK(r.data.id ? r.data : null);
      setFactorKValor(String(r.data.valor ?? 3.0));
    });
  }

  useEffect(() => {
    cargar();
    cargarFactorK();
  }, []);

  async function handleCrear(e: React.FormEvent) {
    e.preventDefault();
    if (!form.nombre.trim() || !form.valor || !form.fechaVigencia) return;
    setGuardando(true);
    try {
      await api.post("/admin/indices", {
        nombre: form.nombre.trim(),
        fuente: form.fuente,
        valor: Number(form.valor),
        variacionMensualPct: form.variacionMensualPct ? Number(form.variacionMensualPct) : undefined,
        fechaVigencia: form.fechaVigencia,
      });
      toast.success("Índice creado");
      setForm(emptyForm);
      setMostrarForm(false);
      cargar();
    } catch {
      toast.error("No se pudo crear el índice");
    } finally {
      setGuardando(false);
    }
  }

  async function handleGuardarFactorK() {
    setGuardandoFactorK(true);
    try {
      if (factorK) {
        await api.put(`/admin/factor-k/${factorK.id}`, { valor: Number(factorKValor) });
      } else {
        await api.post("/admin/factor-k", { valor: Number(factorKValor) });
      }
      toast.success("Factor K actualizado");
      cargarFactorK();
    } catch {
      toast.error("No se pudo actualizar el Factor K");
    } finally {
      setGuardandoFactorK(false);
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-slate-900">Índices de costos</h2>
          <button
            onClick={() => setMostrarForm((v) => !v)}
            className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
          >
            + Nuevo índice
          </button>
        </div>

        {mostrarForm && (
          <form onSubmit={handleCrear} className="mt-4 grid grid-cols-1 gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-5">
            <input
              placeholder="Nombre (ej: CAC Agosto 2026)"
              value={form.nombre}
              onChange={(e) => setForm({ ...form, nombre: e.target.value })}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm sm:col-span-2"
            />
            <select
              value={form.fuente}
              onChange={(e) => setForm({ ...form, fuente: e.target.value })}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
            >
              {FUENTES.map((f) => (
                <option key={f} value={f}>{f}</option>
              ))}
            </select>
            <input
              type="number"
              placeholder="Valor"
              value={form.valor}
              onChange={(e) => setForm({ ...form, valor: e.target.value })}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
            <input
              type="number"
              placeholder="Variación % mensual"
              value={form.variacionMensualPct}
              onChange={(e) => setForm({ ...form, variacionMensualPct: e.target.value })}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
            <input
              type="date"
              value={form.fechaVigencia}
              onChange={(e) => setForm({ ...form, fechaVigencia: e.target.value })}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
            <button
              type="submit"
              disabled={guardando}
              className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50 sm:col-span-1"
            >
              {guardando ? "Guardando..." : "Crear"}
            </button>
          </form>
        )}

        <div className="mt-4 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
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

      <div>
        <h2 className="text-lg font-semibold text-slate-900">Factor K (coeficiente UOCRA)</h2>
        <div className="mt-4 flex max-w-sm items-end gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex-1">
            <label className="mb-1 block text-sm font-medium text-slate-700">Valor actual</label>
            <input
              type="number"
              step="0.1"
              value={factorKValor}
              onChange={(e) => setFactorKValor(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
          <button
            onClick={handleGuardarFactorK}
            disabled={guardandoFactorK}
            className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
          >
            {guardandoFactorK ? "Guardando..." : "Guardar"}
          </button>
        </div>
      </div>
    </div>
  );
}
