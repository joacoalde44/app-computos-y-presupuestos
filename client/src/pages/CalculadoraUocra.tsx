import { useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api";
import { formatARS } from "../lib/format";
import { useAuthStore } from "../store/authStore";

const CATEGORIAS = ["Oficial Especializado", "Oficial", "1/2 Oficial", "Ayudante", "Sereno"];
const ESPECIALIDADES = [
  { value: "Construccion", label: "Construcción" },
  { value: "Yeseria", label: "Yesería" },
  { value: "Electricidad", label: "Electricidad" },
  { value: "Calefaccion", label: "Calefacción" },
];
const ZONAS = ["A", "B", "C", "D"];

type Resultado = {
  jornalHora: number;
  factorK: number;
  costoSinCargas: number;
  costoConCargas: number;
};

export default function CalculadoraUocra() {
  const usuario = useAuthStore((s) => s.usuario);
  const [categoria, setCategoria] = useState(CATEGORIAS[1]);
  const [especialidad, setEspecialidad] = useState(ESPECIALIDADES[0].value);
  const [zona, setZona] = useState(ZONAS[0]);
  const [horas, setHoras] = useState(8);
  const [resultado, setResultado] = useState<Resultado | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCalcular() {
    setLoading(true);
    setError(null);
    setResultado(null);
    try {
      const r = await api.get("/calculadora/uocra", { params: { categoria, especialidad, zona, horas } });
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
      <h1 className="text-2xl font-bold text-slate-900">Calculadora de costos UOCRA</h1>
      <p className="mt-2 text-slate-600">Calculá el costo de mano de obra con y sin cargas sociales (Factor K).</p>

      <div className="mt-6 grid grid-cols-1 gap-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm sm:grid-cols-2">
        <label className="text-sm">
          <span className="mb-1 block font-medium text-slate-700">Categoría</span>
          <select value={categoria} onChange={(e) => setCategoria(e.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2">
            {CATEGORIAS.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </label>
        <label className="text-sm">
          <span className="mb-1 block font-medium text-slate-700">Especialidad</span>
          <select value={especialidad} onChange={(e) => setEspecialidad(e.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2">
            {ESPECIALIDADES.map((e) => <option key={e.value} value={e.value}>{e.label}</option>)}
          </select>
        </label>
        <label className="text-sm">
          <span className="mb-1 block font-medium text-slate-700">Zona</span>
          <select value={zona} onChange={(e) => setZona(e.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2">
            {ZONAS.map((z) => <option key={z} value={z}>Zona {z}</option>)}
          </select>
        </label>
        <label className="text-sm">
          <span className="mb-1 block font-medium text-slate-700">Cantidad de horas</span>
          <input
            type="number"
            min={1}
            value={horas}
            onChange={(e) => setHoras(Number(e.target.value))}
            className="w-full rounded-lg border border-slate-300 px-3 py-2"
          />
        </label>
        <div className="sm:col-span-2">
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
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Sin cargas sociales</p>
            <p className="mt-1 text-2xl font-bold text-slate-800">{formatARS(resultado.costoSinCargas)}</p>
          </div>
          <div className="rounded-xl border border-brand-200 bg-brand-50 p-5 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-wide text-brand-600">Con cargas sociales (Factor K = {resultado.factorK})</p>
            <p className="mt-1 text-2xl font-bold text-brand-700">{formatARS(resultado.costoConCargas)}</p>
          </div>
        </div>
      )}
    </div>
  );
}
