import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-slate-900 text-slate-300">
      <div className="mx-auto max-w-7xl px-4 py-10 lg:px-8">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          <div>
            <h3 className="mb-3 text-sm font-semibold text-white">Costos</h3>
            <ul className="space-y-2 text-sm">
              <li><Link to="/costos/materiales" className="hover:text-white">Materiales</Link></li>
              <li><Link to="/costos/mano-de-obra" className="hover:text-white">Mano de obra</Link></li>
              <li><Link to="/costos/indices-de-costos" className="hover:text-white">Índices de costos</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="mb-3 text-sm font-semibold text-white">Herramientas</h3>
            <ul className="space-y-2 text-sm">
              <li><Link to="/calculadora-de-materiales" className="hover:text-white">Calculadora de materiales</Link></li>
              <li><Link to="/calculadora-de-costos-uocra" className="hover:text-white">Calculadora UOCRA</Link></li>
              <li><Link to="/detalles-constructivos" className="hover:text-white">Detalles constructivos</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="mb-3 text-sm font-semibold text-white">Cuenta</h3>
            <ul className="space-y-2 text-sm">
              <li><Link to="/usuarios/iniciar-sesion" className="hover:text-white">Iniciar sesión</Link></li>
              <li><Link to="/usuarios/registro" className="hover:text-white">Registrarme</Link></li>
              <li><Link to="/suscribirse" className="hover:text-white">Planes y precios</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="mb-3 text-sm font-semibold text-white">Aprendé</h3>
            <ul className="space-y-2 text-sm">
              <li><Link to="/usuarios/tutoriales" className="hover:text-white">Tutoriales</Link></li>
            </ul>
          </div>
        </div>
        <div className="mt-8 border-t border-slate-800 pt-6 text-xs text-slate-500">
          © {new Date().getFullYear()} Cómputo &amp; Presupuesto. Precios de referencia para el mercado argentino de la construcción.
        </div>
      </div>
    </footer>
  );
}
