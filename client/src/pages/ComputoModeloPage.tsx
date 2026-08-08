import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { api } from "../lib/api";
import { formatARS } from "../lib/format";
import Skeleton from "../components/Skeleton";
import { useAuthStore } from "../store/authStore";
import type { ComputoModeloDetalle } from "../types";

type Tab = "computo" | "plano" | "memoria";

export default function ComputoModeloPage() {
  const { id } = useParams();
  const [modelo, setModelo] = useState<ComputoModeloDetalle | null>(null);
  const [tab, setTab] = useState<Tab>("computo");
  const [abiertas, setAbiertas] = useState<Set<string>>(new Set());
  const usuario = useAuthStore((s) => s.usuario);

  useEffect(() => {
    if (!id) return;
    api.get(`/public/modelos/${id}`).then((r) => setModelo(r.data));
  }, [id]);

  function toggleEtapa(etapaId: string) {
    setAbiertas((prev) => {
      const next = new Set(prev);
      if (next.has(etapaId)) next.delete(etapaId);
      else next.add(etapaId);
      return next;
    });
  }

  function handleUsarComoBase() {
    if (!usuario) {
      toast.error("Iniciá sesión para usar este modelo como base");
      return;
    }
    if (!usuario.suscripto) {
      toast.error("Necesitás una suscripción activa");
      return;
    }
    toast("Función disponible próximamente", { icon: "🚧" });
  }

  if (!modelo) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-12 lg:px-8">
        <Skeleton className="h-10 w-1/2" />
        <Skeleton className="mt-4 h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 lg:px-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{modelo.nombre}</h1>
          <p className="mt-1 text-slate-600">
            {modelo.superficieM2} m²
            {modelo.dormitorios ? ` · ${modelo.dormitorios} dorm.` : ""}
            {modelo.banos ? ` · ${modelo.banos} baño${modelo.banos > 1 ? "s" : ""}` : ""}
            {modelo.toilettes ? ` · ${modelo.toilettes} toilette` : ""}
          </p>
        </div>
        <button
          onClick={handleUsarComoBase}
          className="rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700"
        >
          Usar como base
        </button>
      </div>

      <div className="mt-6 flex gap-1 border-b border-slate-200">
        {(["computo", "plano", "memoria"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`border-b-2 px-4 py-2 text-sm font-medium capitalize ${
              tab === t ? "border-brand-600 text-brand-600" : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            {t === "computo" ? "Cómputo" : t === "plano" ? "Plano" : "Memoria descriptiva"}
          </button>
        ))}
      </div>

      {tab === "computo" && (
        <div className="mt-6 space-y-3">
          {modelo.etapas.map((etapa) => (
            <div key={etapa.id} className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
              <button
                onClick={() => toggleEtapa(etapa.id)}
                className="flex w-full items-center justify-between px-4 py-3 text-left"
              >
                <span className="font-semibold text-slate-800">{etapa.nombre}</span>
                <span className="flex items-center gap-4">
                  <span className="text-sm font-medium text-slate-500">{formatARS(etapa.subtotal)}</span>
                  <span className="text-slate-400">{abiertas.has(etapa.id) ? "▲" : "▼"}</span>
                </span>
              </button>
              {abiertas.has(etapa.id) && (
                <table className="w-full border-t border-slate-100 text-sm">
                  <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-4 py-2">Código</th>
                      <th className="px-4 py-2">Descripción</th>
                      <th className="px-4 py-2">Unidad</th>
                      <th className="px-4 py-2 text-right">Cantidad</th>
                      <th className="px-4 py-2 text-right">P. Unit.</th>
                      <th className="px-4 py-2 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {etapa.items.map((item) => (
                      <tr key={item.id}>
                        <td className="px-4 py-2 text-slate-500">{item.codigo ?? "-"}</td>
                        <td className="px-4 py-2 text-slate-800">{item.descripcion}</td>
                        <td className="px-4 py-2 text-slate-500">{item.unidad}</td>
                        <td className="px-4 py-2 text-right text-slate-700">{item.cantidad}</td>
                        <td className="px-4 py-2 text-right text-slate-700">{formatARS(item.precioUnitario)}</td>
                        <td className="px-4 py-2 text-right font-medium text-slate-800">{formatARS(item.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          ))}

          <div className="mt-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <ResumenLinea label="Subtotal" value={modelo.resumen.subtotal} />
            <ResumenLinea label={`Gastos generales (${modelo.resumen.ggPct}%)`} value={modelo.resumen.gg} />
            <ResumenLinea label={`Beneficio (${modelo.resumen.beneficioPct}%)`} value={modelo.resumen.beneficio} />
            <ResumenLinea label={`IVA (${modelo.resumen.ivaPct}%)`} value={modelo.resumen.iva} />
            <div className="mt-3 flex items-center justify-between border-t border-slate-200 pt-3">
              <span className="text-base font-bold text-slate-900">TOTAL GENERAL</span>
              <span className="text-lg font-bold text-brand-700">{formatARS(modelo.resumen.total)}</span>
            </div>
          </div>
        </div>
      )}

      {tab === "plano" && (
        <div className="mt-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          {modelo.planoUrl ? (
            <img src={modelo.planoUrl} alt={`Plano de ${modelo.nombre}`} className="w-full rounded-lg" />
          ) : (
            <p className="text-center text-slate-500">No hay plano disponible para este modelo todavía.</p>
          )}
        </div>
      )}

      {tab === "memoria" && (
        <div className="mt-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="whitespace-pre-line text-slate-700">{modelo.memoria ?? "No hay memoria descriptiva disponible para este modelo."}</p>
        </div>
      )}
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
