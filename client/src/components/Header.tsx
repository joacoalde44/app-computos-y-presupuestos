import { Link, NavLink } from "react-router-dom";
import { useState } from "react";
import { useAuthStore } from "../store/authStore";
import { api } from "../lib/api";
import toast from "react-hot-toast";

const navLink = ({ isActive }: { isActive: boolean }) =>
  `text-sm font-medium transition-colors ${isActive ? "text-brand-600" : "text-slate-600 hover:text-brand-600"}`;

export default function Header() {
  const { usuario, clear } = useAuthStore();
  const [menuOpen, setMenuOpen] = useState(false);

  async function handleLogout() {
    try {
      await api.post("/auth/logout");
    } catch {
      // ignore
    }
    clear();
    toast.success("Sesión cerrada");
  }

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 lg:px-8">
        <Link to="/" className="flex items-center gap-2 text-lg font-bold text-slate-900">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-white">CP</span>
          Cómputo &amp; Presupuesto
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          <NavLink to="/costos/materiales" className={navLink}>Materiales</NavLink>
          <NavLink to="/costos/mano-de-obra" className={navLink}>Mano de obra</NavLink>
          <NavLink to="/costos/indices-de-costos" className={navLink}>Índices</NavLink>
          <NavLink to="/calculadora-de-materiales" className={navLink}>Calculadoras</NavLink>
          <NavLink to="/detalles-constructivos" className={navLink}>Detalles constructivos</NavLink>
          <NavLink to="/usuarios/tutoriales" className={navLink}>Tutoriales</NavLink>
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          {usuario ? (
            <div className="relative">
              <button
                onClick={() => setMenuOpen((v) => !v)}
                className="flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-200"
              >
                {usuario.nombre}
              </button>
              {menuOpen && (
                <div className="absolute right-0 mt-2 w-48 rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
                  <Link
                    to="/usuarios/computo"
                    className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                    onClick={() => setMenuOpen(false)}
                  >
                    Mi cómputo
                  </Link>
                  {usuario.rol === "admin" && (
                    <Link
                      to="/admin"
                      className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                      onClick={() => setMenuOpen(false)}
                    >
                      Panel admin
                    </Link>
                  )}
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      handleLogout();
                    }}
                    className="block w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-slate-50"
                  >
                    Cerrar sesión
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link to="/usuarios/iniciar-sesion" className="text-sm font-medium text-slate-600 hover:text-brand-600">
                Iniciar sesión
              </Link>
              <Link
                to="/suscribirse"
                className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
              >
                Suscribirme
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
