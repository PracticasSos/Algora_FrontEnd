import { useAuth } from '../AuthContext';
import HeaderAdmin from './HeaderAdmin';
import HeaderVendedor from './HeaderVendedor';
import HeaderOptometra from './HeaderOptometra';

const SmartHeader = ({ moduleSpecificButton = null }) => {
  const { user, loading } = useAuth();

  // Si está cargando, no mostrar header
  if (loading) {
    return null;
  }

  // Si no hay usuario, no mostrar header
  if (!user || !user.role_id) {
    return null;
  }

  // Determinar qué header mostrar según el rol
  switch (user.role_id) {
    case 1: // Admin
    case 4: // SuperAdmin
      // El nav de Admin ahora vive en AdminShell (sidebar + topbar globales),
      // así que aquí ya no se renderiza nada para evitar duplicarlo.
      return null;

    case 2: // Optometra
      return <HeaderOptometra moduleSpecificButton={moduleSpecificButton} />;
    
    case 3: // Vendedor
      return <HeaderVendedor moduleSpecificButton={moduleSpecificButton} />;
    
    default:
      return null;
  }
};

export default SmartHeader;