import { Fragment, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api";
import { formatARS, formatDateAR, formatPct } from "../lib/format";
import Skeleton from "../components/Skeleton";
import type { CostosResumen, MaterialMuestra, ModeloVivienda, RecursoUocra, TareaMuestra } from "../types";

const ZONAS = ["A", "B", "C", "D"] as const;
const ESPECIALIDADES = ["Construccion", "Yeseria", "Electricidad", "Calefaccion"] as const;
const ESPECIALIDAD_LABEL: Record<string, string> = {
  Construccion: "Construcción",
  Yeseria: "Yesería",
  Electricidad: "Electricidad",
  Calefaccion: "Calefacción",
};
const CATEGORIAS_ORDEN = ["Oficial Especializado", "Oficial", "1/2 Oficial", "Ayudante", "Sereno"];

export default function Landing() {
  const [resumen, setResumen] = useState<CostosResumen | null>(null);
  const [modelos, setModelos] = useState<ModeloVivienda[] | null>(null);
  const [materiales, setMateriales] = useState<MaterialMuestra[] | null>(null);
  const [tareas, setTareas] = useState<TareaMuestra[] | null>(null);
  const [zona, setZona] = useState<(typeof ZONAS)[number]>("A");
  const [uocra, setUocra] = useState<RecursoUocra[] | null>(null);
  const [renderMode, setRenderMode] = useState<Record<string, "render" | "plano">>({});

  useEffect(() => {
    api.get("/public/costos-resumen").then((r) => setResumen(r.data));
    api.get("/public/modelos").then((r) => setModelos(r.data));
    api.get("/public/materiales?limit=6").then((r) => setMateriales(r.data));
    api.get("/public/tareas?limit=6").then((r) => setTareas(r.data));
  }, []);

  useEffect(() => {
    setUocra(null);
    api.get(`/public/uocra?zona=${zona}`).then((r) => setUocra(r.data));
  }, [zona]);

  const uocraByCategoria = new Map<string, RecursoUocra[]>();
  (uocra ?? []).forEach((r) => {
    const list = uocraByCategoria.get(r.categoria) ?? [];
    list.push(r);
    uocraByCategoria.set(r.categoria, list);
  });

  return (
    <div>
      {/* Hero + widget de costos */}
      <section className="bg-gradient-to-b from-brand-900 to-brand-700 text-white">
        <div className="mx-auto max-w-7xl px-4 py-16 lg:px-8">
          <h1 className="max-w-2xl text-3xl font-bold leading-tight sm:text-4xl">
            Cómputo y presupuesto de obra, actualizado al mercado argentino
          </h1>
          <p className="mt-4 max-w-xl text-brand-100">
            Precios de materiales, mano de obra y tabla UOCRA actualizados. Armá tu cómputo personalizado y exportalo en PDF o Excel.
          </p>

          <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <WidgetCard label="Última actualización" value={resumen ? formatDateAR(resumen.fechaActualizacion) : null} />
            <WidgetCard label="Mano de obra x m²" value={resumen ? formatARS(resumen.manoDeObraM2) : null} />
            <WidgetCard label="Materiales x m²" value={resumen ? formatARS(resumen.materialesM2) : null} />
            <WidgetCard
              label="Costo total x m²"
              value={resumen ? formatARS(resumen.costoTotalM2) : null}
              sub={resumen ? formatPct(resumen.variacionMensualPct) + " mensual" : undefined}
              highlight
            />
          </div>
        </div>
      </section>

      {/* Modelos de referencia */}
      <section className="mx-auto max-w-7xl px-4 py-16 lg:px-8">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Modelos de vivienda de referencia</h2>
            <p className="mt-1 text-slate-600">Cómputos completos y actualizados, listos para usar como base.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {!modelos &&
            Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-80 w-full" />)}
          {modelos?.map((m) => (
            <div key={m.id} className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
              <div className="relative h-40 bg-slate-100">
                {m.imgUrl || m.planoUrl ? (
                  <img
                    src={renderMode[m.id] === "plano" ? m.planoUrl ?? m.imgUrl ?? "" : m.imgUrl ?? m.planoUrl ?? ""}
                    alt={m.nombre}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-sm text-slate-400">Sin imagen</div>
                )}
                {m.imgUrl && m.planoUrl && (
                  <button
                    onClick={() =>
                      setRenderMode((s) => ({ ...s, [m.id]: s[m.id] === "plano" ? "render" : "plano" }))
                    }
                    className="absolute right-2 top-2 rounded-md bg-white/90 px-2 py-1 text-xs font-medium text-slate-700 shadow"
                  >
                    {renderMode[m.id] === "plano" ? "Ver render" : "Ver plano"}
                  </button>
                )}
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-slate-900">{m.nombre}</h3>
                <p className="mt-1 text-sm text-slate-500">
                  {m.superficieM2} m² {m.dormitorios ? `· ${m.dormitorios} dorm.` : ""} {m.banos ? `· ${m.banos} baño${m.banos > 1 ? "s" : ""}` : ""}{" "}
                  {m.toilettes ? `· ${m.toilettes} toilette` : ""}
                </p>
                <div className="mt-3 flex items-baseline justify-between">
                  <span className="text-lg font-bold text-brand-700">{formatARS(m.costoM2)} / m²</span>
                </div>
                <p className="text-xs text-slate-500">Total: {formatARS(m.costoTotal)}</p>
                <div className="mt-4 flex gap-3 text-sm font-medium text-brand-600">
                  <Link to={`/computo/${m.id}`} className="hover:underline">Cómputo</Link>
                  {m.planoUrl && <a href={m.planoUrl} className="hover:underline">Plano</a>}
                  <Link to={`/computo/${m.id}`} className="hover:underline">Memoria descriptiva</Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Listados de muestra */}
      <section className="bg-white py-16">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-2">
            <div>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-xl font-bold text-slate-900">Materiales</h2>
                <Link to="/costos/materiales" className="text-sm font-medium text-brand-600 hover:underline">
                  Ver listado completo →
                </Link>
              </div>
              <SampleTable
                loading={!materiales}
                headers={["Material", "Unidad", "Costo"]}
                rows={(materiales ?? []).map((m) => [m.nombre, m.unidad, formatARS(m.precio)])}
              />
            </div>
            <div>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-xl font-bold text-slate-900">Mano de obra</h2>
                <Link to="/costos/mano-de-obra" className="text-sm font-medium text-brand-600 hover:underline">
                  Ver listado completo →
                </Link>
              </div>
              <SampleTable
                loading={!tareas}
                headers={["Tarea", "Unidad", "Costo"]}
                rows={(tareas ?? []).map((t) => [t.descripcion, t.unidad, formatARS(t.precio)])}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Tabla UOCRA */}
      <section className="mx-auto max-w-7xl px-4 py-16 lg:px-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Tabla de costos UOCRA</h2>
            <p className="mt-1 text-slate-600">Valores de jornal por categoría, especialidad y zona.</p>
          </div>
          <div className="flex items-center gap-2">
            <label htmlFor="zona" className="text-sm font-medium text-slate-600">Zona</label>
            <select
              id="zona"
              value={zona}
              onChange={(e) => setZona(e.target.value as (typeof ZONAS)[number])}
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700"
            >
              {ZONAS.map((z) => (
                <option key={z} value={z}>Zona {z}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Categoría</th>
                {ESPECIALIDADES.map((esp) => (
                  <th key={esp} colSpan={2} className="px-4 py-3 text-center">{ESPECIALIDAD_LABEL[esp]}</th>
                ))}
              </tr>
              <tr>
                <th className="px-4 py-2"></th>
                {ESPECIALIDADES.map((esp) => (
                  <Fragment key={esp}>
                    <th className="px-4 py-2 text-right font-medium">Hora</th>
                    <th className="px-4 py-2 text-right font-medium">Día/8hs</th>
                  </Fragment>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {!uocra &&
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td className="px-4 py-3" colSpan={9}>
                      <Skeleton className="h-5 w-full" />
                    </td>
                  </tr>
                ))}
              {uocra &&
                CATEGORIAS_ORDEN.filter((c) => uocraByCategoria.has(c)).map((categoria) => {
                  const items = uocraByCategoria.get(categoria)!;
                  return (
                    <tr key={categoria}>
                      <td className="px-4 py-3 font-medium text-slate-800">{categoria}</td>
                      {ESPECIALIDADES.map((esp) => {
                        const item = items.find((i) => i.especialidad === esp);
                        return (
                          <Fragment key={esp}>
                            <td className="px-4 py-3 text-right text-slate-600">
                              {item ? formatARS(item.jornalHora) : "-"}
                            </td>
                            <td className="px-4 py-3 text-right text-slate-600">
                              {item ? formatARS(item.jornalDia) : "-"}
                            </td>
                          </Fragment>
                        );
                      })}
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </section>

      {/* CTA suscripción */}
      <section className="bg-brand-600">
        <div className="mx-auto max-w-7xl px-4 py-14 text-center text-white lg:px-8">
          <h2 className="text-2xl font-bold">Armá tu cómputo personalizado</h2>
          <p className="mt-2 text-brand-100">Accedé al catálogo completo de materiales y tareas, calculadoras y exportación a PDF/Excel.</p>
          <Link
            to="/suscribirse"
            className="mt-6 inline-block rounded-lg bg-white px-6 py-3 text-sm font-semibold text-brand-700 hover:bg-brand-50"
          >
            Ver planes y suscribirme
          </Link>
        </div>
      </section>
    </div>
  );
}

function WidgetCard({ label, value, sub, highlight }: { label: string; value: string | null; sub?: string; highlight?: boolean }) {
  return (
    <div className={`rounded-xl p-5 ${highlight ? "bg-white text-brand-900" : "bg-white/10"}`}>
      <p className={`text-xs font-medium uppercase tracking-wide ${highlight ? "text-brand-500" : "text-brand-100"}`}>{label}</p>
      {value === null ? (
        <Skeleton className="mt-2 h-7 w-24 bg-white/30" />
      ) : (
        <p className={`mt-1 text-2xl font-bold ${highlight ? "text-brand-700" : "text-white"}`}>{value}</p>
      )}
      {sub && <p className="mt-1 text-xs font-medium text-emerald-600">{sub}</p>}
    </div>
  );
}

function SampleTable({ headers, rows, loading }: { headers: string[]; rows: (string | number)[][]; loading: boolean }) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <table className="w-full text-sm">
        <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
          <tr>
            {headers.map((h) => (
              <th key={h} className="px-4 py-3">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {loading &&
            Array.from({ length: 6 }).map((_, i) => (
              <tr key={i}>
                {headers.map((_, j) => (
                  <td key={j} className="px-4 py-3"><Skeleton className="h-4 w-full" /></td>
                ))}
              </tr>
            ))}
          {!loading &&
            rows.map((row, i) => (
              <tr key={i}>
                {row.map((cell, j) => (
                  <td key={j} className="px-4 py-3 text-slate-700">{cell}</td>
                ))}
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  );
}
