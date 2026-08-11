import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { api } from "../../lib/api";
import Skeleton from "../../components/Skeleton";
import type { Tutorial } from "../../types";

const emptyForm = { titulo: "", descripcion: "", youtubeId: "" };

export default function AdminTutoriales() {
  const [tutoriales, setTutoriales] = useState<(Tutorial & { activo?: boolean })[] | null>(null);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [guardando, setGuardando] = useState(false);

  function cargar() {
    api.get("/public/tutoriales").then((r) => setTutoriales(r.data));
  }

  useEffect(cargar, []);

  async function handleCrear(e: React.FormEvent) {
    e.preventDefault();
    if (!form.titulo.trim() || !form.descripcion.trim() || !form.youtubeId.trim()) return;
    setGuardando(true);
    try {
      await api.post("/admin/tutoriales", {
        titulo: form.titulo.trim(),
        descripcion: form.descripcion.trim(),
        youtubeId: form.youtubeId.trim(),
      });
      toast.success("Tutorial creado");
      setForm(emptyForm);
      setMostrarForm(false);
      cargar();
    } catch {
      toast.error("No se pudo crear el tutorial");
    } finally {
      setGuardando(false);
    }
  }

  async function toggleActivo(t: Tutorial & { activo?: boolean }) {
    try {
      await api.put(`/admin/tutoriales/${t.id}`, { activo: !t.activo });
      cargar();
    } catch {
      toast.error("No se pudo actualizar");
    }
  }

  return (
    <div>
      <div className="flex justify-end">
        <button
          onClick={() => setMostrarForm((v) => !v)}
          className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
        >
          + Nuevo tutorial
        </button>
      </div>

      {mostrarForm && (
        <form onSubmit={handleCrear} className="mt-4 grid grid-cols-1 gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-2">
          <input
            placeholder="Título"
            value={form.titulo}
            onChange={(e) => setForm({ ...form, titulo: e.target.value })}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm sm:col-span-2"
          />
          <textarea
            placeholder="Descripción"
            value={form.descripcion}
            onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
            rows={2}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm sm:col-span-2"
          />
          <input
            placeholder="ID de YouTube (ej: dQw4w9WgXcQ)"
            value={form.youtubeId}
            onChange={(e) => setForm({ ...form, youtubeId: e.target.value })}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
          <button
            type="submit"
            disabled={guardando}
            className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
          >
            {guardando ? "Guardando..." : "Crear"}
          </button>
        </form>
      )}

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {!tutoriales &&
          Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-32 w-full" />)}
        {tutoriales?.map((t) => (
          <div key={t.id} className={`rounded-xl border border-slate-200 bg-white p-4 shadow-sm ${t.activo === false ? "opacity-50" : ""}`}>
            <img
              src={`https://img.youtube.com/vi/${t.youtubeId}/mqdefault.jpg`}
              alt={t.titulo}
              className="mb-2 aspect-video w-full rounded-lg object-cover"
            />
            <h3 className="font-semibold text-slate-800">{t.titulo}</h3>
            <p className="mt-1 text-sm text-slate-500">{t.descripcion}</p>
            <button onClick={() => toggleActivo(t)} className="mt-2 text-xs font-medium text-slate-500 hover:text-red-600">
              {t.activo === false ? "Activar" : "Desactivar"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
