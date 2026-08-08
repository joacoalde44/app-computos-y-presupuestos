import { useAuthStore } from "../store/authStore";

export default function UsuarioComputo() {
  const usuario = useAuthStore((s) => s.usuario);

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 text-center lg:px-8">
      <h1 className="text-2xl font-bold text-slate-900">Mi cómputo</h1>
      <p className="mt-3 text-slate-600">
        ¡Hola {usuario?.nombre}! La tabla de cómputo personalizable está en desarrollo y va a estar disponible muy pronto:
        etapas de obra, ítems con cantidades editables, panel de APU, incidencia de costos y exportación a PDF/Excel.
      </p>
      <div className="mt-8 rounded-xl border border-dashed border-slate-300 bg-white p-10">
        <p className="text-sm text-slate-500">🚧 Próximamente</p>
      </div>
    </div>
  );
}
