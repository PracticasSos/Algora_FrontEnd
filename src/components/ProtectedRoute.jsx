import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// Mapear rol → ruta por defecto (fallback en caso de que no haya permisos)
const getDefaultRouteForRole = (roleId) => {
  switch (roleId) {
    case 1: return "/admin";
    case 2: return "/optometra";
    case 3: return "/vendedor";
    case 4: return "/super-admin";
    default: return "/login";
  }
};

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  // ⏳ Mientras carga la sesión
  if (loading) return null;

  // 🚪 Si no hay usuario → login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // 🛡️ Claims principales
  const roleId = user.role_id || user.user_metadata?.role_id;
  const allowedRoutes = user.allowed_routes || user.user_metadata?.allowed_routes || [];

  // ✅ Excepción: rutas de super admin
  if (location.pathname.startsWith("/super-admin")) {
    if (roleId === 1 || roleId === 4) {
      return children;
    }
    return <Navigate to={getDefaultRouteForRole(roleId)} replace />;
  }

  // 🔒 Validar si la ruta actual está en las permitidas
  const hasPermission = allowedRoutes.some((route) =>
    location.pathname.startsWith(route)
  );

  if (!hasPermission) {
    return <Navigate to={getDefaultRouteForRole(roleId)} replace />;
  }

  // 🚀 Si pasó todos los checks → renderizamos la página
  return children;
};

export default ProtectedRoute;
