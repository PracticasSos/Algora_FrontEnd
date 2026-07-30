import { Box } from "@chakra-ui/react";
import { useLocation } from "react-router-dom";
import { useAuth } from "../AuthContext";
import AdminSidebar, { COLLAPSED_W } from "./AdminSidebar";
import AdminTopbar from "./AdminTopbar";
import AdminMobileNav from "./AdminMobileNav";

// role_id: 1 Admin, 4 SuperAdmin (igual que en SmartHeader.jsx)
const ADMIN_ROLE_IDS = [1, 4];

// Pantallas públicas/de autenticación: nunca deben mostrar el sidebar,
// aunque exista una sesión de Admin cacheada en el navegador.
const PUBLIC_ROUTES = ["/", "/login-form", "/change-password"];

const AdminShell = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  const isPublicRoute = PUBLIC_ROUTES.includes(location.pathname);
  const isAdmin = !loading && !isPublicRoute && user && ADMIN_ROLE_IDS.includes(user.role_id);

  // Vendedor / Optometra / sin sesión / pantallas públicas: no se toca nada
  if (!isAdmin) {
    return children;
  }

  return (
    <Box minH="100vh">
      {/* Desktop / tablet: sidebar fija + topbar */}
      <AdminSidebar />
      <AdminTopbar />

      {/* Móvil: topbar propia + drawer + bottom tabs (AdminMobileNav ya se auto-oculta en md+) */}
      <AdminMobileNav />

      {/* Contenido de la página */}
      <Box ml={{ base: 0, md: COLLAPSED_W }}>
        {children}
        {/* Espacio para que la bottom bar móvil no tape el final del contenido */}
        <Box h={{ base: "64px", md: 0 }} display={{ base: "block", md: "none" }} />
      </Box>
    </Box>
  );
};

export default AdminShell;
