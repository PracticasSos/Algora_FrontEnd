import { Box } from "@chakra-ui/react";
import { useAuth } from "../AuthContext";
import AdminSidebar, { COLLAPSED_W } from "./AdminSidebar";
import AdminTopbar from "./AdminTopbar";
import AdminMobileNav from "./AdminMobileNav";

// role_id: 1 Admin, 4 SuperAdmin (igual que en SmartHeader.jsx)
const ADMIN_ROLE_IDS = [1, 4];

const AdminShell = ({ children }) => {
  const { user, loading } = useAuth();

  const isAdmin = !loading && user && ADMIN_ROLE_IDS.includes(user.role_id);

  // Vendedor / Optometra / sin sesión: no se toca nada, se comportan exactamente como antes
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
      <Box ml={{ base: 0, md: COLLAPSED_W }}>{children}</Box>
    </Box>
  );
};

export default AdminShell;
