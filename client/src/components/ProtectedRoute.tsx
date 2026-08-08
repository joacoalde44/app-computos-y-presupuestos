import { Navigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const usuario = useAuthStore((s) => s.usuario);

  if (!usuario) {
    return <Navigate to="/usuarios/iniciar-sesion" replace />;
  }
  if (!usuario.suscripto) {
    return <Navigate to="/suscribirse" replace />;
  }
  return <>{children}</>;
}
