import { useState, useEffect } from 'react';
import  { supabase } from '../../api/supabase';

// Mover la función isRouteAllowed fuera del hook para poder exportarla
export const isRouteAllowed = (currentPath, allowedRoutes) => {
  if (!allowedRoutes || !Array.isArray(allowedRoutes)) {
    return false;
  }
  
  // Verificación exacta
  if (allowedRoutes.includes(currentPath)) {
    return true;
  }

  // Verificación para rutas con parámetros
  for (const route of allowedRoutes) {
    // Casos específicos para rutas dinámicas
    if (route === '/retreats-patients/retreats' && currentPath.startsWith('/retreats-patients/Retreats/')) {
      return true;
    }
    
    // Verificación general
    if (currentPath.startsWith(route + '/')) {
      return true;
    }
  }

  return false;
};

export const useUserPermissions = (userData) => {
  const [allowedRoutes, setAllowedRoutes] = useState([]);
  const [loading, setLoading] = useState(true);

  const getDefaultRoutesForRole = (roleId) => {
    switch (roleId) {
      case 1: 
        return [
          '/admin', '/register-patient', '/measures-final', '/sales', 
          '/retreats-patients', '/register-experience', '/register', 
          '/inventory', '/branch', '/labs', '/cash-closure', '/change-password',
          '/register-lens', '/patient-records', '/egresos', 
          '/order-laboratory-list', '/balances-patient', '/balance', 
          '/history-measure-list', '/print-certificate', '/history-clinic', 
          '/message-manager', '/list-balance', '/list-sales',
          '/list-patients', '/list-users', '/list-lens', '/list-inventory',
          '/list-branch', '/list-labs','/cuestionario','/lens','/material',
          '/admin/modelos','/resultados','/register-experience','/mensajeria',
          '/retreats-patients/retreats', '/retreats', '/history-clinic/patient-history',  'patient-history','/super-admin/tenants'
        ];
      case 2: 
        return ['/optometra', '/register-patient', '/retreats-patients', '/register-experience', '/register-patient', '/sales', 
          '/order-laboratory-list', '/retreats-patients', '/register-experience',
          '/history-clinic', '/patient-records', '/balances-patient', '/egresos', 
          '/measures-final', '/balance', '/inventory','/certificado', '/cuestionario',
          '/lens','/material',
          '/admin/modelos','/resultados',];
      case 3: 
        return [
          '/vendedor', '/register-patient', '/sales', 
          '/order-laboratory-list', '/register-experience', '/retreats-patients', 
          '/history-clinic', '/patient-records', '/balances-patient', '/egresos', 
          '/measures-final', '/balance', '/inventory', 
          '/history-measure-list', '/register-lens','/cuestionario','/lens','/material',
          '/admin/modelos','/resultados', '/retreats-patients/retreats',
        ];
      case 4: 
        return [
          '/admin', '/register-patient', '/measures-final', '/sales', 
          '/retreats-patients', '/register-experience', '/register', 
          '/inventory', '/branch', '/labs', '/cash-closure', '/change-password',
          '/register-lens', '/patient-records', '/egresos', 
          '/order-laboratory-list', '/balances-patient', '/balance', 
          '/history-measure-list', '/print-certificate', '/history-clinic', 
          '/message-manager', '/list-balance', '/list-sales',
          '/list-patients', '/list-users', '/list-lens', '/list-inventory',
          '/list-branch', '/list-lab','/cuestionario','/lens','/material',
          '/admin/modelos','/resultados','/register-experience','/mensajeria',
          '/retreats-patients/retreats', '/retreats', '/history-clinic/patient-history',  'patient-history','/cuestionario',
          '/lens','/material',
          '/admin/modelos','/resultados','/register-experience','/super-admin/tenants'
        ];
      default: 
        return ['/login-form'];
    }
  };

  useEffect(() => {
    const fetchPermissions = async () => {
      if (!userData?.auth_id) {
        setLoading(false);
        return;
      }

      try {
        const { data: permissions, error } = await supabase
          .from('user_permissions')
          .select('route')
          .eq('auth_id', userData.auth_id);

        let validRoutes = [];

        if (!error && permissions && permissions.length > 0) {
          // Si tiene permisos específicos, usar esos
          validRoutes = permissions.map(p => p.route);
        } else {
          // Si no tiene permisos específicos, usar rutas por defecto del rol
          validRoutes = getDefaultRoutesForRole(userData.role_id);
        }

        // Agregar dashboard principal del rol
        const dashboardRoutes = {
          1: '/admin',
          2: '/optometra',
          3: '/vendedor',
          4: '/SuperAdmin'
        };

        const dashboardRoute = dashboardRoutes[userData.role_id];
        if (dashboardRoute && !validRoutes.includes(dashboardRoute)) {
          validRoutes.push(dashboardRoute);
        }

        setAllowedRoutes(validRoutes);
      } catch (error) {
        console.error('Error fetching permissions:', error);
        setAllowedRoutes(getDefaultRoutesForRole(userData.role_id));
      } finally {
        setLoading(false);
      }
    };

    fetchPermissions();
  }, [userData]);

  return { allowedRoutes, loading };
};

export default useUserPermissions;