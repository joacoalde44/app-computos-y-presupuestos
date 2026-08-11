import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { api } from "../../lib/api";
import { formatARS } from "../../lib/format";
import Skeleton from "../../components/Skeleton";
import type { ModeloVivienda } from "../../types";

type FormState = {
  nombre: string;
  modeloSuperficieM2: string;
  modeloDormitorios: string;
  modeloBanos: string;
  modeloToilettes: string;
  modeloImgUrl: string;
  modeloPlanoUrl: string;
  modeloMemoria: string;
};

function modeloToForm(m: any): FormState {
  return {
    nombre: m.nombre ?? "",
    modeloSuperficieM2: m.superficieM2 != null ? String(m.superficieM2) : "",
    modeloDormitorios: m.dormitorios != null ? String(m.dormitorios) : "",
    modeloBanos: m.banos != null ? String(m.banos) : "",
    modeloToilettes: m.toilettes != null ? String(m.toilettes) : "",
    modeloImgUrl: m.imgUrl ?? "",
    modeloPlanoUrl: m.planoUrl ?? "",
    modeloMemoria: m.memoria ?? "",
  };
}

export default function AdminModelos() {
  const [modelos, setModelos] = useState<ModeloVivienda[] | null>(null);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState | null>(null);
  const [guardando, setGuardando] = useState(false);

  function cargar() {
    api.get("/public/modelos").then((r) => setModelos(r.data));
  }

  useEffect(cargar, []);

  async function empezarEdicion(modeloId: string) {
    const r = await api.get(`/public/modelos/${modeloId}`);
    setEditandoId(modeloId);
    setForm(modeloToForm(r.data));
  }

  async function guardar() {
    if (!editandoId || !form) return;
    setGuardando(true);
    try {
      await api.put(`/admin/computos/${editandoId}`, {
        nombre: form.nombre.trim(),
        modeloSuperficieM2: form.modeloSuperficieM2 ? Number(form.modeloSuperficieM2) : null,
        modeloDormitorios: form.modeloDormitorios ? Number(form.modeloDormitorios) : null,
        modeloBanos: form.modeloBanos ? Number(form.modeloBanos) : null,
        modeloToilettes: form.modeloToilettes ? Number(form.modeloToilettes) : null,
        modeloImgUrl: form.modeloImgUrl.trim() || null,
        modeloPlanoUrl: form.modeloPlanoUrl.trim() || null,
        modeloMemoria: form.modeloMemoria.trim() || null,
      });
      toast.success("Modelo actualizado");
      setEditandoId(null);
      setForm(null);
      cargar();
    } catch {
      toast.error("No se pudo actualizar el modelo");
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div>
      <p className="text-sm text-slate-500">
        Los modelos de vivienda de referencia (etapas e ítems) se arman clonándolos como base de un cómputo. Acá solo se editan sus datos generales.
      </p>

      <div className="mt-4 space-y-3">
        {!modelos &&
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 w-full" />)}

        {modelos?.map((m) => (
          <div key={m.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="font-semibold text-slate-800">{m.nombre}</h3>
                <p className="text-sm text-slate-500">
                  {m.superficieM2} m² · {formatARS(m.costoM2)}/m²
                </p>
              </div>
              {editandoId !== m.id && (
                <button onClick={() => empezarEdicion(m.id)} className="text-sm font-medium text-brand-600 hover:underline">
                  Editar
                </button>
              )}
            </div>

            {editandoId === m.id && form && (
              <div className="mt-4 grid grid-cols-1 gap-3 border-t border-slate-100 pt-4 sm:grid-cols-3">
                <input
                  placeholder="Nombre"
                  value={form.nombre}
                  onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm sm:col-span-3"
                />
                <input
                  type="number"
                  placeholder="Superficie m²"
                  value={form.modeloSuperficieM2}
                  onChange={(e) => setForm({ ...form, modeloSuperficieM2: e.target.value })}
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
                <input
                  type="number"
                  placeholder="Dormitorios"
                  value={form.modeloDormitorios}
                  onChange={(e) => setForm({ ...form, modeloDormitorios: e.target.value })}
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
                <input
                  type="number"
                  placeholder="Baños"
                  value={form.modeloBanos}
                  onChange={(e) => setForm({ ...form, modeloBanos: e.target.value })}
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
                <input
                  type="number"
                  placeholder="Toilettes"
                  value={form.modeloToilettes}
                  onChange={(e) => setForm({ ...form, modeloToilettes: e.target.value })}
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
                <input
                  placeholder="URL imagen render"
                  value={form.modeloImgUrl}
                  onChange={(e) => setForm({ ...form, modeloImgUrl: e.target.value })}
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm sm:col-span-2"
                />
                <input
                  placeholder="URL plano"
                  value={form.modeloPlanoUrl}
                  onChange={(e) => setForm({ ...form, modeloPlanoUrl: e.target.value })}
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
                <textarea
                  placeholder="Memoria descriptiva"
                  value={form.modeloMemoria}
                  onChange={(e) => setForm({ ...form, modeloMemoria: e.target.value })}
                  rows={3}
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm sm:col-span-3"
                />
                <div className="flex gap-2 sm:col-span-3">
                  <button
                    onClick={guardar}
                    disabled={guardando}
                    className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
                  >
                    {guardando ? "Guardando..." : "Guardar"}
                  </button>
                  <button
                    onClick={() => {
                      setEditandoId(null);
                      setForm(null);
                    }}
                    className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
