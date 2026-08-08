import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api";
import Skeleton from "../components/Skeleton";
import type { Tutorial } from "../types";

export default function Tutoriales() {
  const [tutoriales, setTutoriales] = useState<Tutorial[] | null>(null);
  const [activo, setActivo] = useState<Tutorial | null>(null);

  useEffect(() => {
    api.get("/public/tutoriales").then((r) => {
      setTutoriales(r.data);
      if (r.data.length > 0) setActivo(r.data[0]);
    });
  }, []);

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 lg:px-8">
      <h1 className="text-2xl font-bold text-slate-900">Tutoriales</h1>
      <p className="mt-2 text-slate-600">Aprendé a usar la app paso a paso.</p>

      {activo && (
        <div className="mt-6 aspect-video w-full overflow-hidden rounded-xl border border-slate-200 shadow-sm">
          <iframe
            className="h-full w-full"
            src={`https://www.youtube.com/embed/${activo.youtubeId}`}
            title={activo.titulo}
            allowFullScreen
          />
        </div>
      )}

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {!tutoriales &&
          Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-40 w-full" />)}
        {tutoriales?.map((t) => (
          <button
            key={t.id}
            onClick={() => setActivo(t)}
            className={`rounded-xl border p-4 text-left shadow-sm transition ${
              activo?.id === t.id ? "border-brand-500 bg-brand-50" : "border-slate-200 bg-white hover:border-brand-300"
            }`}
          >
            <div className="mb-2 aspect-video overflow-hidden rounded-lg bg-slate-100">
              <img
                src={`https://img.youtube.com/vi/${t.youtubeId}/mqdefault.jpg`}
                alt={t.titulo}
                className="h-full w-full object-cover"
              />
            </div>
            <h3 className="font-semibold text-slate-800">{t.titulo}</h3>
            <p className="mt-1 text-sm text-slate-500">{t.descripcion}</p>
          </button>
        ))}
      </div>

      <div className="mt-10 rounded-xl bg-brand-600 p-8 text-center text-white">
        <p className="text-lg font-semibold">Con esta app podés hacer todo esto y más... Suscribite</p>
        <Link to="/suscribirse" className="mt-4 inline-block rounded-lg bg-white px-6 py-2.5 text-sm font-semibold text-brand-700 hover:bg-brand-50">
          Ver planes
        </Link>
      </div>
    </div>
  );
}
