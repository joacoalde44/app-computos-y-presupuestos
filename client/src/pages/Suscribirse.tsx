import toast from "react-hot-toast";

const PLANES = [
  { nombre: "Trimestral", mensual: 14999, total: 44997, duracion: "3 meses" },
  { nombre: "Semestral", mensual: 11499, total: 68994, duracion: "6 meses", destacado: true },
  { nombre: "Anual", mensual: 9999, total: 119988, duracion: "12 meses" },
];

function formatARS(v: number) {
  return `$ ${v.toLocaleString("es-AR")}`;
}

export default function Suscribirse() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-16 lg:px-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-slate-900">Planes y precios</h1>
        <p className="mt-2 text-slate-600">Accedé al catálogo completo, calculadoras y exportación de cómputos.</p>
      </div>

      <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-3">
        {PLANES.map((plan) => (
          <div
            key={plan.nombre}
            className={`rounded-2xl border p-6 shadow-sm ${
              plan.destacado ? "border-brand-500 bg-brand-50 ring-2 ring-brand-500" : "border-slate-200 bg-white"
            }`}
          >
            {plan.destacado && (
              <span className="mb-3 inline-block rounded-full bg-brand-600 px-3 py-1 text-xs font-semibold text-white">Más elegido</span>
            )}
            <h2 className="text-lg font-bold text-slate-900">{plan.nombre}</h2>
            <p className="mt-4 text-3xl font-bold text-slate-900">
              {formatARS(plan.mensual)}
              <span className="text-base font-normal text-slate-500"> /mes</span>
            </p>
            <p className="mt-1 text-sm text-slate-500">Total {formatARS(plan.total)} · {plan.duracion}</p>
            <button
              onClick={() => toast("Próximamente", { icon: "🚀" })}
              className={`mt-6 w-full rounded-lg px-4 py-2.5 text-sm font-semibold ${
                plan.destacado ? "bg-brand-600 text-white hover:bg-brand-700" : "bg-slate-900 text-white hover:bg-slate-800"
              }`}
            >
              Suscribirme
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
