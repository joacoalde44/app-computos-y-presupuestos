import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { api } from "../lib/api";
import { formatARS, formatDateAR } from "../lib/format";
import { useAuthStore } from "../store/authStore";
import Skeleton from "../components/Skeleton";
import type { ComputoListItem } from "../types";

export default function UsuarioComputo() {
  const usuario = useAuthStore((s) => s.usuario);
  const navigate = useNavigate();
  const [computos, setComputos] = useState<ComputoListItem[] | null>(null);
  const [nombre, setNombre] = useState("");
  const [superficie, setSuperficie] = useState("");
  const [creando, setCreando] = useState(false);
  const [mostrarForm, setMostrarForm] = useState(false);

  function cargar() {
    api.get("/computos").then((r) => setComputos(r.data));
  }

  useEffect(() => {
    cargar();
  }, []);

  async function handleCrear(e: React.FormEvent) {
    e.preventDefault();
    if (!nombre.trim()) return;
    setCreando(true);
    try {
      const r = await api.post("/computos", {
        nombre: nombre.trim(),
        ...(superficie ? { superficieM2: Number(superficie) } : {}),
      });
      toast.success("Cómputo creado");
      navigate(`/usuarios/computo/${r.data.id}`);
    } catch {
      toast.error("No se pudo crear el cómputo");
    } finally {
      setCreando(false);
    }
  }

  async function handleEliminar(id: string) {
    if (!confirm("¿Eliminar este cómputo? Esta acción no se puede deshacer.")) return;
    try {
      await api.delete(`/computos/${id}`);
      toast.success("Cómputo eliminado");
      cargar();
    } catch {
      toast.error("No se pudo eliminar");
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 lg:px-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Mis cómputos</h1>
          <p className="mt-1 text-slate-600">¡Hola {usuario?.nombre}! Acá están tus cómputos de obra.</p>
        </div>
        <button
          onClick={() => setMostrarForm((v) => !v)}
          className="rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-700"
        >
          + Nuevo cómputo
        </button>
      </div>

      {mostrarForm && (
        <form onSubmit={handleCrear} className="mt-6 flex flex-wrap items-end gap-3 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex-1 min-w-[200px]">
            <label className="mb-1 block text-sm font-medium text-slate-700">Nombre del proyecto</label>
            <input
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej: Casa familia Gómez"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
          <div className="w-32">
            <label className="mb-1 block text-sm font-medium text-slate-700">Superficie (m²)</label>
            <input
              type="number"
              value={superficie}
              onChange={(e) => setSuperficie(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
          <button
            type="submit"
            disabled={creando || !nombre.trim()}
            className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
          >
            {creando ? "Creando..." : "Crear"}
          </button>
        </form>
      )}

      <div className="mt-8 space-y-3">
        {!computos &&
          Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}

        {computos?.length === 0 && (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center">
            <p className="text-slate-500">Todavía no tenés cómputos. Creá el primero con el botón de arriba.</p>
          </div>
        )}

        {computos?.map((c) => (
          <div
            key={c.id}
            className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <Link to={`/usuarios/computo/${c.id}`} className="flex-1 min-w-[200px]">
              <h3 className="font-semibold text-slate-900 hover:text-brand-600">{c.nombre}</h3>
              <p className="mt-1 text-sm text-slate-500">
                {c.superficieM2 ? `${c.superficieM2} m² · ` : ""}
                {c.etapasCount} etapa{c.etapasCount !== 1 ? "s" : ""} · Actualizado {formatDateAR(c.updatedAt)}
              </p>
            </Link>
            <div className="flex items-center gap-4">
              <span className="text-lg font-bold text-brand-700">{formatARS(c.total)}</span>
              <button
                onClick={() => handleEliminar(c.id)}
                className="text-sm font-medium text-red-600 hover:underline"
              >
                Eliminar
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
