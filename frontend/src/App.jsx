import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import { AuthProvider } from "./context/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";

import MainLayout from "./layouts/MainLayout";
import HomeLayout from "./layouts/HomeLayout";
import HomePage from "./pages/HomePage";
import LoginUser from "./pages/LoginUser";
import ErrorPage from "./pages/ErrorPage";
import CreateUser from "./pages/CreateUser";
import Configuracion from "./pages/Configuracion";
import ListarUser from "./pages/ListarUser";
import UpdateUser from "./pages/UpdateUser";
import CrearJunta from "./pages/CrearJunta";
import ConsultarJunta from "./pages/ConsultarJunta";
import DetalleJunta from "./pages/DetalleJunta";
import Logs from "./pages/Logs";
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import DatosJunta from "./pages/DatosJunta";
import ListarCargos from "./pages/ListarCargos";
import ListarComisiones from "./pages/ListarComisiones";
import CrearComision from "./pages/CrearComision";
import UpdateComision from "./pages/UpdateComision";
import CrearCargo from "./pages/CrearCargo";
import CrearInstitucion from "./pages/CrearInstitucion";
import ListarInstituciones from "./pages/ListarInstituciones";
import CrearMandatario from "./pages/CrearMandatario";
import BuscarMandatario from "./pages/BuscarMandatario";
import ListarLugares from "./pages/ListarLugares";
import EditarMandatarioExistente from "./pages/EditarMandatarioExistente";
import ValidacionQR from "./pages/ValidacionQR";


export default function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route element={<HomeLayout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/validacionqr/:IDCertificado" element={<ValidacionQR/>} />
            <Route path="/login" element={<LoginUser />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password/:token" element={<ResetPassword />} />
          </Route>
          <Route element={<ProtectedRoute />}>
            <Route element={<MainLayout />}>
              <Route path="/juntas/crear" element={<CrearJunta />} />
              <Route path="/juntas/consultar" element={<ConsultarJunta />} />
              <Route path="/juntas/:id/mandatario/crear" element={<CrearMandatario />} />
              <Route path="/juntas/:id/mandatario/buscar" element={<BuscarMandatario />} />
              <Route path="/juntas/detalle-junta/:id" element={<DetalleJunta />} />
              <Route path="/juntas/datos-junta/:id" element={<DatosJunta />} />
              <Route path="/juntas/:idJunta/mandatario/editar-datos/:idUsuario" element={<EditarMandatarioExistente />}/>
              <Route path="cargos/listar" element={<ListarCargos/>}/>
              <Route path="comisiones/listar" element={<ListarComisiones/>} />
              <Route path="comisiones/create" element={<CrearComision/>} />
              <Route path="comisiones/update/:id" element={<UpdateComision/>} />
              <Route path="cargos/create" element={<CrearCargo/>} />
              <Route path="instituciones/listar" element={<ListarInstituciones/>} />
              <Route path="instituciones/create" element={<CrearInstitucion/>} />
              <Route path="instituciones/listar" element={<ListarInstituciones/>} />
              <Route path="lugares/listar" element={<ListarLugares/>} />
              <Route path="usuarios/listar" element={<ListarUser />} />
              <Route path="usuarios/crear" element={<CreateUser />} />
              <Route path="usuarios/update/:id" element={<UpdateUser />} />
              <Route path="configuracion" element={<Configuracion />} />
              <Route path="logs" element={<Logs />} />
            </Route>
          </Route>
        </Routes>
      </AuthProvider>
    </Router >
  );
} 