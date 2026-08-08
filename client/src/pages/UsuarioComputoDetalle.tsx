import { useParams } from "react-router-dom";

export default function UsuarioComputoDetalle() {
  const { id } = useParams();

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 text-center lg:px-8">
      <h1 className="text-2xl font-bold text-slate-900">Cómputo {id}</h1>
      <p className="mt-3 text-slate-600">Esta vista está en desarrollo. Pronto vas a poder editar etapas, ítems y ver el detalle de APU acá.</p>
      <div className="mt-8 rounded-xl border border-dashed border-slate-300 bg-white p-10">
        <p className="text-sm text-slate-500">🚧 Próximamente</p>
      </div>
    </div>
  );
}
