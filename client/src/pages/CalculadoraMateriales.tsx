import { useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api";
import { formatARS } from "../lib/format";
import { useAuthStore } from "../store/authStore";

const TIPOS_TRABAJO = [
  { value: "mamposteria", label: "Mampostería" },
  { value: "revoque", label: "Revoque" },
  { value: "piso", label: "Piso" },
  { value: "pintura", label: "Pintura" },
  { value: "contrapiso", label: "Contrapiso" },
  { value: "impermeabilizacion", label: "Impermeabilización" },
];

type Resultado = {
  tipo: string;
  m2: number;
  items: { materialId: string; nombre: string; unidad: string; cantidad: number; precioUnitario: number; costo: number }[];
  total: number;
};

export default function CalculadoraMateriales() {
  const usuario = useAuthStore((s) => s.usuario);
  const [tipo, setTipo] = useState(TIPOS_TRABAJO[0].value);
  const [m2, setM2] = useState(50);
  const [resultado, setResultado] = useState<Resultado | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCalcular() {
    setLoading(true);
    setError(null);
    setResultado(null);
    try {
      const r = await api.get("/calculadora/materiales", { params: { tipo, m2 } });
      setResultado(r.data);
    } catch (e: any) {
      if (e.response?.status === 401 || e.response?.status === 403) {
        setError("Necesitás iniciar sesión y tener una suscripción activa para usar la calculadora.");
      } else {
        setError("No se pudo calcular. Intentá nuevamente.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 lg:px-8">
      <h1 className="text-2xl font-bold text-slate-900">Calculadora de materiales</h1>
      <p className="mt-2 text-slate-600">Estimá la cantidad de materiales necesarios según el tipo de trabajo y la superficie.</p>

      <div className="mt-6 grid grid-cols-1 gap-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm sm:grid-cols-3">
        <label className="text-sm">
          <span className="mb-1 block font-medium text-slate-700">Tipo de trabajo</span>
          <select value={tipo} onChange={(e) => setTipo(e.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2">
            {TIPOS_TRABAJO.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          <span className="mb-1 block font-medium text-slate-700">Superficie (m²)</span>
          <input
            type="number"
            min={1}
            value={m2}
            onChange={(e) => setM2(Number(e.target.value))}
            className="w-full rounded-lg border border-slate-300 px-3 py-2"
          />
        </label>
        <div className="flex items-end">
          <button
            onClick={handleCalcular}
            disabled={loading}
            className="w-full rounded-lg bg-brand-600 px-4 py-2 font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
          >
            {loading ? "Calculando..." : "Calcular"}
          </button>
        </div>
      </div>

      {error && (
        <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-5 text-center">
          <p className="text-sm text-amber-800">{error}</p>
          {!usuario && (
            <Link to="/usuarios/iniciar-sesion" className="mt-3 inline-block rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700">
              Iniciar sesión
            </Link>
          )}
          {usuario && !usuario.suscripto && (
            <Link to="/suscribirse" className="mt-3 inline-block rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700">
              Ver planes
            </Link>
          )}
        </div>
      )}

      {resultado && (
        <div className="mt-6 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Material</th>
                <th className="px-4 py-3">Cantidad</th>
                <th className="px-4 py-3">P. Unit.</th>
                <th className="px-4 py-3">Costo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {resultado.items.map((i) => (
                <tr key={i.materialId}>
                  <td className="px-4 py-3 font-medium text-slate-800">{i.nombre}</td>
                  <td className="px-4 py-3 text-slate-600">{i.cantidad} {i.unidad}</td>
                  <td className="px-4 py-3 text-slate-600">{formatARS(i.precioUnitario)}</td>
                  <td className="px-4 py-3 text-slate-800">{formatARS(i.costo)}</td>
                </tr>
              ))}
              {resultado.items.length === 0 && (
                <tr>
                  <td className="px-4 py-6 text-center text-slate-500" colSpan={4}>No hay datos para este tipo de trabajo.</td>
                </tr>
              )}
            </tbody>
            {resultado.items.length > 0 && (
              <tfoot>
                <tr className="border-t border-slate-200 bg-slate-50">
                  <td className="px-4 py-3 font-bold text-slate-800" colSpan={3}>Costo total estimado</td>
                  <td className="px-4 py-3 font-bold text-brand-700">{formatARS(resultado.total)}</td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      )}
    </div>
  );
}
