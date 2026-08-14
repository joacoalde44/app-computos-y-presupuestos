import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { api } from "../lib/api";
import { formatARS } from "../lib/format";
import { useDebouncedCallback } from "../lib/useDebouncedCallback";
import { recalcularEtapaSubtotal, calcularResumenLocal } from "../lib/computoCalc";
import Skeleton from "../components/Skeleton";
import AgregarEtapaMenu from "../components/AgregarEtapaMenu";
import BuscadorTareas from "../components/BuscadorTareas";
import ApuPanel from "../components/ApuPanel";
import IncidenciaChart from "../components/IncidenciaChart";
import type { ComputoDetalle, ModeloVivienda, TareaBusqueda } from "../types";

export default function UsuarioComputoDetalle() {
  const { id } = useParams<{ id: string }>();
  const [computo, setComputo] = useState<ComputoDetalle | null>(null);
  const [abiertas, setAbiertas] = useState<Set<string>>(new Set());
  const [buscadorEn, setBuscadorEn] = useState<string | null>(null);
  const [apuTareaId, setApuTareaId] = useState<string | null>(null);
  const [nombre, setNombre] = useState("");
  const [superficie, setSuperficie] = useState("");
  const [modelos, setModelos] = useState<ModeloVivienda[] | null>(null);
  const [mostrarIncidencia, setMostrarIncidencia] = useState(false);
  const [exportando, setExportando] = useState<"pdf" | "excel" | null>(null);

  function cargar() {
    if (!id) return;
    api.get(`/computos/${id}`).then((r) => {
      setComputo(r.data);
      setNombre(r.data.nombre);
      setSuperficie(r.data.superficieM2 ? String(r.data.superficieM2) : "");
      setAbiertas(new Set(r.data.etapas.filter((e: any) => e.items.length > 0).map((e: any) => e.id)));
    });
  }

  useEffect(() => {
    cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    if (computo && computo.etapas.length === 0 && !modelos) {
      api.get("/public/modelos").then((r) => setModelos(r.data));
    }
  }, [computo, modelos]);

  const guardarComputo = useDebouncedCallback((data: Partial<Pick<ComputoDetalle, "nombre" | "superficieM2" | "ggPct" | "beneficioPct" | "ivaPct">>) => {
    if (!id) return;
    api.put(`/computos/${id}`, data).catch(() => toast.error("No se pudo guardar"));
  }, 1500);

  const guardarCantidad = useDebouncedCallback((itemId: string, cantidad: number) => {
    api.put(`/items/${itemId}`, { cantidad }).catch(() => toast.error("No se pudo guardar la cantidad"));
  }, 1500);

  function toggleEtapa(etapaId: string) {
    setAbiertas((prev) => {
      const next = new Set(prev);
      if (next.has(etapaId)) next.delete(etapaId);
      else next.add(etapaId);
      return next;
    });
  }

  function handleNombreBlur() {
    if (!computo || nombre === computo.nombre) return;
    setComputo({ ...computo, nombre });
    guardarComputo({ nombre });
  }

  function handleSuperficieBlur() {
    if (!computo) return;
    const val = superficie ? Number(superficie) : null;
    if (val === computo.superficieM2) return;
    setComputo({ ...computo, superficieM2: val });
    guardarComputo({ superficieM2: val ?? undefined });
  }

  function handleCantidadChange(etapaId: string, itemId: string, nuevaCantidad: number) {
    if (!computo) return;
    const etapas = computo.etapas.map((e) => {
      if (e.id !== etapaId) return e;
      const items = e.items.map((i) => (i.id === itemId ? { ...i, cantidad: nuevaCantidad } : i));
      return recalcularEtapaSubtotal({ ...e, items });
    });
    const resumen = calcularResumenLocal(etapas, computo.ggPct, computo.beneficioPct, computo.ivaPct);
    setComputo({ ...computo, etapas, resumen });
    guardarCantidad(itemId, nuevaCantidad);
  }

  function handleResumenPctChange(campo: "ggPct" | "beneficioPct" | "ivaPct", valor: number) {
    if (!computo) return;
    const nuevo = { ...computo, [campo]: valor };
    const resumen = calcularResumenLocal(nuevo.etapas, nuevo.ggPct, nuevo.beneficioPct, nuevo.ivaPct);
    setComputo({ ...nuevo, resumen });
    guardarComputo({ [campo]: valor });
  }

  async function handleAgregarEtapas(nombres: string[]) {
    if (!id) return;
    try {
      await api.post(`/computos/${id}/etapas`, { nombres });
      toast.success(nombres.length > 1 ? "Etapas agregadas" : "Etapa agregada");
      cargar();
    } catch {
      toast.error("No se pudieron agregar las etapas");
    }
  }

  async function handleEliminarEtapa(etapaId: string) {
    if (!confirm("¿Eliminar esta etapa y todos sus ítems?")) return;
    try {
      await api.delete(`/etapas/${etapaId}`);
      toast.success("Etapa eliminada");
      cargar();
    } catch {
      toast.error("No se pudo eliminar la etapa");
    }
  }

  async function handleAgregarItem(etapaId: string, tarea: TareaBusqueda) {
    try {
      await api.post(`/etapas/${etapaId}/items`, { tareaId: tarea.id, cantidad: 0 });
      setBuscadorEn(null);
      cargar();
    } catch {
      toast.error("No se pudo agregar el ítem");
    }
  }

  async function handleAgregarItemPersonalizado(etapaId: string, descripcion: string, unidad: string) {
    try {
      await api.post(`/etapas/${etapaId}/items`, { descripcion, unidad, cantidad: 0 });
      setBuscadorEn(null);
      cargar();
    } catch {
      toast.error("No se pudo agregar el ítem");
    }
  }

  async function handleEliminarItem(itemId: string) {
    if (!confirm("¿Eliminar este ítem?")) return;
    try {
      await api.delete(`/items/${itemId}`);
      cargar();
    } catch {
      toast.error("No se pudo eliminar el ítem");
    }
  }

  async function handleUsarModelo(modeloId: string) {
    if (!id) return;
    try {
      await api.post(`/computos/${id}/clonar-modelo/${modeloId}`);
      toast.success("Modelo aplicado como base");
      cargar();
    } catch {
      toast.error("No se pudo aplicar el modelo");
    }
  }

  async function handleExportar(formato: "pdf" | "excel") {
    if (!id || !computo) return;
    if (computo.etapas.length === 0) {
      toast.error("Agregá al menos una etapa antes de exportar");
      return;
    }
    setExportando(formato);
    try {
      const r = await api.get(`/computos/${id}/export/${formato}`, { responseType: "blob" });
      const ext = formato === "pdf" ? "pdf" : "xlsx";
      const url = window.URL.createObjectURL(new Blob([r.data]));
      const a = document.createElement("a");
      a.href = url;
      a.download = `${computo.nombre.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}.${ext}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      toast.error(`No se pudo generar el ${formato === "pdf" ? "PDF" : "Excel"}`);
    } finally {
      setExportando(null);
    }
  }

  if (!computo) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-12 lg:px-8">
        <Skeleton className="h-10 w-1/2" />
        <Skeleton className="mt-4 h-64 w-full" />
      </div>
    );
  }

  const etapasExistentes = computo.etapas.map((e) => e.nombre);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 lg:px-8">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <input
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          onBlur={handleNombreBlur}
          className="min-w-0 flex-1 border-none bg-transparent text-2xl font-bold text-slate-900 outline-none focus:ring-0"
        />
        <div className="flex gap-2">
          <button
            onClick={() => handleExportar("pdf")}
            disabled={exportando !== null}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50"
          >
            {exportando === "pdf" ? "Generando..." : "Imprimir PDF"}
          </button>
          <button
            onClick={() => handleExportar("excel")}
            disabled={exportando !== null}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50"
          >
            {exportando === "excel" ? "Generando..." : "Excel"}
          </button>
        </div>
      </div>

      <div className="mt-3 flex items-center gap-2 text-sm text-slate-500">
        <span>Superficie:</span>
        <input
          type="number"
          value={superficie}
          onChange={(e) => setSuperficie(e.target.value)}
          onBlur={handleSuperficieBlur}
          className="w-20 rounded border border-slate-300 px-2 py-1"
        />
        <span>m²</span>
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <AgregarEtapaMenu etapasExistentes={etapasExistentes} onAgregar={handleAgregarEtapas} />
        <button
          onClick={() => setMostrarIncidencia((v) => !v)}
          className="text-sm font-medium text-brand-600 hover:underline"
        >
          {mostrarIncidencia ? "Ocultar" : "Ver"} incidencia de costos
        </button>
      </div>

      {computo.etapas.length === 0 && (
        <div className="mt-6 rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center">
          <p className="text-slate-500">Todavía no agregaste etapas. Empezá desde cero o usá un modelo como base.</p>
          {modelos && modelos.length > 0 && (
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              {modelos.map((m) => (
                <button
                  key={m.id}
                  onClick={() => handleUsarModelo(m.id)}
                  className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:border-brand-400 hover:text-brand-600"
                >
                  Usar "{m.nombre}"
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {mostrarIncidencia && computo.etapas.length > 0 && (
        <div className="mt-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <IncidenciaChart computoId={computo.id} />
        </div>
      )}

      <div className="mt-6 space-y-3">
        {computo.etapas.map((etapa) => (
          <div key={etapa.id} className="rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between px-4 py-3">
              <button onClick={() => toggleEtapa(etapa.id)} className="flex flex-1 items-center gap-2 text-left">
                <span className="text-slate-400">{abiertas.has(etapa.id) ? "▲" : "▼"}</span>
                <span className="font-semibold text-slate-800">{etapa.nombre}</span>
              </button>
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium text-slate-500">{formatARS(etapa.subtotal)}</span>
                <button
                  onClick={() => setBuscadorEn(buscadorEn === etapa.id ? null : etapa.id)}
                  className="text-sm font-medium text-brand-600 hover:underline"
                >
                  + ítem
                </button>
                <button onClick={() => handleEliminarEtapa(etapa.id)} className="text-sm text-red-500 hover:underline">
                  Eliminar
                </button>
              </div>
            </div>

            {buscadorEn === etapa.id && (
              <div className="px-4 pb-3">
                <BuscadorTareas
                  onSelect={(t) => handleAgregarItem(etapa.id, t)}
                  onCrearPersonalizado={(desc, unidad) => handleAgregarItemPersonalizado(etapa.id, desc, unidad)}
                  onClose={() => setBuscadorEn(null)}
                />
              </div>
            )}

            {abiertas.has(etapa.id) && etapa.items.length > 0 && (
              <table className="w-full border-t border-slate-100 text-sm">
                <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="w-8 px-2 py-2"></th>
                    <th className="px-2 py-2">Descripción</th>
                    <th className="px-2 py-2">Unidad</th>
                    <th className="px-2 py-2 text-right">Cantidad</th>
                    <th className="px-2 py-2 text-right">P. Unit.</th>
                    <th className="px-2 py-2 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {etapa.items.map((item) => (
                    <tr key={item.id}>
                      <td className="px-2 py-2">
                        <button
                          onClick={() => handleEliminarItem(item.id)}
                          className="text-slate-300 hover:text-red-500"
                          title="Eliminar ítem"
                        >
                          ×
                        </button>
                      </td>
                      <td className="px-2 py-2 text-slate-800">
                        {item.tareaId ? (
                          <button onClick={() => setApuTareaId(item.tareaId)} className="text-left hover:text-brand-600 hover:underline">
                            {item.descripcion}
                          </button>
                        ) : (
                          <span>
                            {item.descripcion} <span className="text-xs text-slate-400">(personalizado)</span>
                          </span>
                        )}
                      </td>
                      <td className="px-2 py-2 text-slate-500">{item.unidad}</td>
                      <td className="px-2 py-2 text-right">
                        <input
                          type="number"
                          defaultValue={item.cantidad}
                          onChange={(e) => handleCantidadChange(etapa.id, item.id, Number(e.target.value) || 0)}
                          className="w-20 rounded border border-slate-200 px-2 py-1 text-right"
                        />
                      </td>
                      <td className="px-2 py-2 text-right text-slate-600">{formatARS(item.precioUnitario)}</td>
                      <td className="px-2 py-2 text-right font-medium text-slate-800">{formatARS(item.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        ))}
      </div>

      {computo.etapas.length > 0 && (
        <div className="mt-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <ResumenLinea label="Subtotal" value={computo.resumen.subtotal} />
          <ResumenLineaEditable
            label="Gastos generales"
            pct={computo.ggPct}
            valor={computo.resumen.gg}
            onChange={(v) => handleResumenPctChange("ggPct", v)}
          />
          <ResumenLineaEditable
            label="Beneficio"
            pct={computo.beneficioPct}
            valor={computo.resumen.beneficio}
            onChange={(v) => handleResumenPctChange("beneficioPct", v)}
          />
          <ResumenLineaEditable
            label="IVA"
            pct={computo.ivaPct}
            valor={computo.resumen.iva}
            onChange={(v) => handleResumenPctChange("ivaPct", v)}
          />
          <div className="mt-3 flex items-center justify-between border-t border-slate-200 pt-3">
            <span className="text-base font-bold text-slate-900">TOTAL GENERAL</span>
            <span className="text-lg font-bold text-brand-700">{formatARS(computo.resumen.total)}</span>
          </div>
        </div>
      )}

      {apuTareaId && <ApuPanel tareaId={apuTareaId} onClose={() => setApuTareaId(null)} />}
    </div>
  );
}

function ResumenLinea({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between py-1 text-sm">
      <span className="text-slate-500">{label}</span>
      <span className="font-medium text-slate-700">{formatARS(value)}</span>
    </div>
  );
}

function ResumenLineaEditable({
  label,
  pct,
  valor,
  onChange,
}: {
  label: string;
  pct: number;
  valor: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex items-center justify-between py-1 text-sm">
      <span className="flex items-center gap-2 text-slate-500">
        {label} (
        <input
          type="number"
          defaultValue={pct}
          onChange={(e) => onChange(Number(e.target.value) || 0)}
          className="w-14 rounded border border-slate-200 px-1 py-0.5 text-right"
        />
        %)
      </span>
      <span className="font-medium text-slate-700">{formatARS(valor)}</span>
    </div>
  );
}
