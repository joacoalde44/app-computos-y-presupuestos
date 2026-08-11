import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { api } from "../../lib/api";
import { formatARS } from "../../lib/format";

type MaterialOpcion = { id: string; nombre: string; unidad: string; precioBase: number };

type RecursoForm = {
  key: number;
  tipo: string;
  rendimiento: string;
  materialId: string | null;
  recursoLibreNombre: string;
  recursoLibreUnidad: string;
  recursoLibrePrecio: string;
};

const TIPOS = [
  { value: "material", label: "Material" },
  { value: "mano_de_obra", label: "Mano de obra" },
  { value: "equipo", label: "Equipo" },
  { value: "subcontrato", label: "Subcontrato" },
];

let keyCounter = 0;

export default function AdminApuEditor({ tareaId, onClose, onSaved }: { tareaId: string; onClose: () => void; onSaved: () => void }) {
  const [descripcion, setDescripcion] = useState("");
  const [recursos, setRecursos] = useState<RecursoForm[] | null>(null);
  const [materiales, setMateriales] = useState<MaterialOpcion[] | null>(null);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    api.get(`/tareas/${tareaId}/apu`).then((r) => {
      setDescripcion(r.data.descripcion);
      setRecursos(
        r.data.recursos.map((rec: any) => ({
          key: keyCounter++,
          tipo: rec.tipo,
          rendimiento: String(rec.rendimiento),
          materialId: rec.tipo === "material" ? rec.materialId ?? null : null,
          recursoLibreNombre: rec.tipo === "material" ? "" : rec.nombre,
          recursoLibreUnidad: "",
          recursoLibrePrecio: rec.tipo === "material" ? "" : String(rec.precioUnitario),
        }))
      );
    });
    api.get("/materiales", { params: { limit: 100 } }).then((r) =>
      setMateriales(r.data.items.map((m: any) => ({ id: m.id, nombre: m.nombre, unidad: m.unidad, precioBase: m.precioBase })))
    );
  }, [tareaId]);

  function agregarRecurso() {
    setRecursos((prev) => [
      ...(prev ?? []),
      { key: keyCounter++, tipo: "material", rendimiento: "1", materialId: null, recursoLibreNombre: "", recursoLibreUnidad: "", recursoLibrePrecio: "" },
    ]);
  }

  function actualizarRecurso(key: number, campo: keyof RecursoForm, valor: string) {
    setRecursos((prev) => prev?.map((r) => (r.key === key ? { ...r, [campo]: valor } : r)) ?? null);
  }

  function eliminarRecurso(key: number) {
    setRecursos((prev) => prev?.filter((r) => r.key !== key) ?? null);
  }

  async function guardar() {
    if (!recursos) return;
    setGuardando(true);
    try {
      const payload = recursos.map((r) => ({
        tipo: r.tipo,
        rendimiento: Number(r.rendimiento) || 0,
        materialId: r.tipo === "material" ? r.materialId : null,
        recursoLibreNombre: r.tipo === "material" ? null : r.recursoLibreNombre || null,
        recursoLibreUnidad: r.tipo === "material" ? null : r.recursoLibreUnidad || null,
        recursoLibrePrecio: r.tipo === "material" ? null : Number(r.recursoLibrePrecio) || null,
      }));
      await api.put(`/admin/tareas/${tareaId}/apu`, { recursos: payload });
      toast.success("APU actualizado");
      onSaved();
      onClose();
    } catch {
      toast.error("No se pudo guardar el APU");
    } finally {
      setGuardando(false);
    }
  }

  const total = (recursos ?? []).reduce((acc, r) => {
    const precio = r.tipo === "material" ? materiales?.find((m) => m.id === r.materialId)?.precioBase ?? 0 : Number(r.recursoLibrePrecio) || 0;
    return acc + precio * (Number(r.rendimiento) || 0);
  }, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between">
          <h2 className="text-lg font-bold text-slate-900">APU: {descripcion}</h2>
          <button onClick={onClose} className="text-2xl leading-none text-slate-400 hover:text-slate-600">
            ×
          </button>
        </div>

        {!recursos && <p className="mt-6 text-sm text-slate-500">Cargando...</p>}

        {recursos && (
          <>
            <div className="mt-4 space-y-2">
              {recursos.map((r) => (
                <div key={r.key} className="grid grid-cols-12 items-center gap-2 rounded-lg border border-slate-200 p-2">
                  <select
                    value={r.tipo}
                    onChange={(e) => actualizarRecurso(r.key, "tipo", e.target.value)}
                    className="col-span-3 rounded border border-slate-300 px-2 py-1.5 text-sm"
                  >
                    {TIPOS.map((t) => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>

                  {r.tipo === "material" ? (
                    <select
                      value={r.materialId ?? ""}
                      onChange={(e) => actualizarRecurso(r.key, "materialId", e.target.value)}
                      className="col-span-5 rounded border border-slate-300 px-2 py-1.5 text-sm"
                    >
                      <option value="">Elegir material...</option>
                      {materiales?.map((m) => (
                        <option key={m.id} value={m.id}>{m.nombre} ({m.unidad})</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      placeholder="Nombre del recurso"
                      value={r.recursoLibreNombre}
                      onChange={(e) => actualizarRecurso(r.key, "recursoLibreNombre", e.target.value)}
                      className="col-span-5 rounded border border-slate-300 px-2 py-1.5 text-sm"
                    />
                  )}

                  <input
                    type="number"
                    placeholder="Rend."
                    value={r.rendimiento}
                    onChange={(e) => actualizarRecurso(r.key, "rendimiento", e.target.value)}
                    className="col-span-2 rounded border border-slate-300 px-2 py-1.5 text-sm"
                  />

                  {r.tipo !== "material" && (
                    <input
                      type="number"
                      placeholder="Precio"
                      value={r.recursoLibrePrecio}
                      onChange={(e) => actualizarRecurso(r.key, "recursoLibrePrecio", e.target.value)}
                      className="col-span-1 rounded border border-slate-300 px-2 py-1.5 text-sm"
                    />
                  )}

                  <button
                    onClick={() => eliminarRecurso(r.key)}
                    className={`text-red-500 hover:text-red-700 ${r.tipo === "material" ? "col-span-1" : ""}`}
                  >
                    ×
                  </button>
                </div>
              ))}

              <button onClick={agregarRecurso} className="text-sm font-medium text-brand-600 hover:underline">
                + Agregar recurso
              </button>
            </div>

            <div className="mt-4 flex items-center justify-between border-t border-slate-200 pt-4">
              <span className="text-sm text-slate-500">Precio unitario estimado</span>
              <span className="text-lg font-bold text-brand-700">{formatARS(total)}</span>
            </div>

            <div className="mt-4 flex justify-end gap-2">
              <button onClick={onClose} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50">
                Cancelar
              </button>
              <button
                onClick={guardar}
                disabled={guardando}
                className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
              >
                {guardando ? "Guardando..." : "Guardar APU"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
