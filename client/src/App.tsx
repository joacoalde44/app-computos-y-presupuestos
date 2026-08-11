import { Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import Landing from "./pages/Landing";
import MaterialesPage from "./pages/MaterialesPage";
import ManoDeObraPage from "./pages/ManoDeObraPage";
import IndicesPage from "./pages/IndicesPage";
import ComputoModeloPage from "./pages/ComputoModeloPage";
import CalculadoraMateriales from "./pages/CalculadoraMateriales";
import CalculadoraUocra from "./pages/CalculadoraUocra";
import DetallesConstructivos from "./pages/DetallesConstructivos";
import Tutoriales from "./pages/Tutoriales";
import Suscribirse from "./pages/Suscribirse";
import Login from "./pages/Login";
import Registro from "./pages/Registro";
import UsuarioComputo from "./pages/UsuarioComputo";
import UsuarioComputoDetalle from "./pages/UsuarioComputoDetalle";
import NotFound from "./pages/NotFound";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminRoute from "./components/AdminRoute";
import AdminLayout from "./pages/admin/AdminLayout";
import AdminMateriales from "./pages/admin/AdminMateriales";
import AdminTareas from "./pages/admin/AdminTareas";
import AdminUocra from "./pages/admin/AdminUocra";
import AdminIndices from "./pages/admin/AdminIndices";
import AdminModelos from "./pages/admin/AdminModelos";
import AdminTutoriales from "./pages/admin/AdminTutoriales";

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Landing />} />
        <Route path="/costos/materiales" element={<MaterialesPage />} />
        <Route path="/costos/mano-de-obra" element={<ManoDeObraPage />} />
        <Route path="/costos/indices-de-costos" element={<IndicesPage />} />
        <Route path="/computo/:id" element={<ComputoModeloPage />} />
        <Route path="/computo/pre-establecido/:id" element={<ComputoModeloPage />} />
        <Route path="/calculadora-de-materiales" element={<CalculadoraMateriales />} />
        <Route path="/calculadora-de-costos-uocra" element={<CalculadoraUocra />} />
        <Route path="/detalles-constructivos" element={<DetallesConstructivos />} />
        <Route path="/usuarios/tutoriales" element={<Tutoriales />} />
        <Route path="/suscribirse" element={<Suscribirse />} />
        <Route path="/usuarios/iniciar-sesion" element={<Login />} />
        <Route path="/usuarios/registro" element={<Registro />} />

        <Route
          path="/usuarios/computo"
          element={
            <ProtectedRoute>
              <UsuarioComputo />
            </ProtectedRoute>
          }
        />
        <Route
          path="/usuarios/computo/:id"
          element={
            <ProtectedRoute>
              <UsuarioComputoDetalle />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin"
          element={
            <AdminRoute>
              <AdminLayout />
            </AdminRoute>
          }
        >
          <Route index element={<AdminMateriales />} />
          <Route path="materiales" element={<AdminMateriales />} />
          <Route path="tareas" element={<AdminTareas />} />
          <Route path="uocra" element={<AdminUocra />} />
          <Route path="indices" element={<AdminIndices />} />
          <Route path="modelos" element={<AdminModelos />} />
          <Route path="tutoriales" element={<AdminTutoriales />} />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
