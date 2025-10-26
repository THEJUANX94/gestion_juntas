import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import { AuthProvider } from "./context/AuthContext";
//import { ProtectedRoute } from "./components/ProtectedRoute";

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
import Logs from "./pages/Logs";



export default function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route element={<HomeLayout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginUser />} />
          </Route>

            <Route element={<MainLayout />}>
            <Route path ="/juntas/crear" element={<CrearJunta />} />
            <Route path="usuarios/listar" element={<ListarUser />} />
              <Route path="usuarios/crear" element={<CreateUser />} />
              <Route path="usuarios/update/:id" element={<UpdateUser />} />
              <Route path="configuracion" element={<Configuracion />} />
              <Route path="logs" element={<Logs />} />
          <Route path="*" element={<ErrorPage />} />
          </Route>
        </Routes>
      </AuthProvider>
    </Router>
  );
}