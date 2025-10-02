import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../components/AuthContext";

// ============================
// 🗺️ MAPEAR ROLES A RUTAS
// ============================
// Cada rol tiene una ruta "home" por defecto a la que será redirigido
// si intenta acceder a una ruta no permitida
const getDefaultRouteForRole = (roleId) => {
  switch (roleId) {
    case 1: return "/admin";        // Administrador
    case 2: return "/optometra";    // Optometrista
    case 3: return "/vendedor";     // Vendedor
    case 4: return "/super-admin";  // Super Administrador
    default: return "/login-form";  // Si no tiene rol, al login
  }
};

// ============================
// 🛡️ COMPONENTE PROTECTEDROUTE
// ============================
// Este componente envuelve rutas que requieren autenticación
// y valida permisos según el rol del usuario
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  // ========================================
  // PASO 1: Mostrar loader mientras verifica
  // ========================================
  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        minHeight: '100vh' 
      }}>
        Verificando acceso...
      </div>
    );
  }

  // ========================================
  // PASO 2: Si no hay usuario, redirigir a login
  // ========================================
  // Si no hay usuario autenticado, redirigir al login
  // Guardamos la ruta actual en "state" para poder volver después del login
  if (!user) {
    return <Navigate to="/login-form" state={{ from: location }} replace />;
  }

  // ========================================
  // PASO 3: Obtener datos del usuario
  // ========================================
  const roleId = user.role_id;                    // ID del rol del usuario
  const allowedRoutes = user.allowed_routes || []; // Array de rutas permitidas

  // ========================================
  // PASO 4: Validar acceso a rutas de super-admin
  // ========================================
  // Solo los roles 1 (Admin) y 4 (Super Admin) pueden acceder a /super-admin
  if (location.pathname.startsWith("/super-admin")) {
    if (roleId === 1 || roleId === 4) {
      console.log(`✅ Acceso permitido a super-admin para rol ${roleId}`);
      return children; // Permitir acceso
    }
    console.warn(`🚫 Acceso denegado a super-admin para rol ${roleId}`);
    return <Navigate to={getDefaultRouteForRole(roleId)} replace />;
  }

  // ========================================
  // PASO 5: Admin tiene acceso total
  // ========================================
  // El rol 1 (Admin) tiene acceso a todas las rutas excepto super-admin
  if (roleId === 1) {
    console.log(`✅ Admin tiene acceso total a: ${location.pathname}`);
    return children;
  }

  // ========================================
  // PASO 6: Validar permisos para otros roles
  // ========================================
  // Para roles 2 (Optometra) y 3 (Vendedor), verificar si la ruta
  // está en su array de allowed_routes
  const hasPermission = allowedRoutes.some((route) =>
    location.pathname.startsWith(route)
  );

  if (!hasPermission) {
    console.warn(`🚫 Usuario sin permiso para: ${location.pathname}`);
    console.warn(`   Rutas permitidas:`, allowedRoutes);
    // Si no tiene permiso, redirigir a su ruta por defecto
    return <Navigate to={getDefaultRouteForRole(roleId)} replace />;
  }

  // ========================================
  // PASO 7: Acceso concedido
  // ========================================
  console.log(`✅ Acceso permitido a: ${location.pathname}`);
  return children;
};

export default ProtectedRoute;