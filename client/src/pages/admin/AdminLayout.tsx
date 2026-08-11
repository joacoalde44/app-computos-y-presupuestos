import { NavLink, Outlet } from "react-router-dom";

const TABS = [
  { to: "/admin/materiales", label: "Materiales" },
  { to: "/admin/tareas", label: "Tareas" },
  { to: "/admin/uocra", label: "UOCRA" },
  { to: "/admin/indices", label: "Índices" },
  { to: "/admin/modelos", label: "Modelos" },
  { to: "/admin/tutoriales", label: "Tutoriales" },
];

const tabClass = ({ isActive }: { isActive: boolean }) =>
  `whitespace-nowrap border-b-2 px-3 py-3 text-sm font-medium ${
    isActive ? "border-brand-600 text-brand-600" : "border-transparent text-slate-500 hover:text-slate-700"
  }`;

export default function AdminLayout() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 lg:px-8">
      <h1 className="text-2xl font-bold text-slate-900">Panel de administración</h1>
      <p className="mt-1 text-slate-600">Editá los catálogos que alimentan toda la app.</p>

      <div className="mt-6 flex gap-1 overflow-x-auto border-b border-slate-200">
        {TABS.map((t) => (
          <NavLink key={t.to} to={t.to} className={tabClass}>
            {t.label}
          </NavLink>
        ))}
      </div>

      <div className="mt-6">
        <Outlet />
      </div>
    </div>
  );
}
