import { useEffect, useState } from "react";
import { useAuth } from "../../AuthContext";

/**
 * Fecha y sucursal de la venta — ya no se piden a mano. La sucursal se
 * detecta sola desde el usuario que inició sesión (branch_id), y la fecha
 * siempre es la de hoy. Este componente no muestra nada en pantalla, solo
 * se asegura de que esos dos valores queden guardados en formData.
 */
const TotalUI = ({ onFormDataChange, initialFormData = {} }) => {
  const { user } = useAuth();
  const [hasAutoFilled, setHasAutoFilled] = useState(false);

  useEffect(() => {
    if (hasAutoFilled) return;
    if (!initialFormData.date) {
      onFormDataChange({ date: new Date().toLocaleDateString("en-CA") });
    }
    if (!initialFormData.branchs_id && user?.branch_id) {
      onFormDataChange({ branchs_id: String(user.branch_id) });
    }
    if (user) setHasAutoFilled(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, initialFormData.date, initialFormData.branchs_id]);

  return null;
};

export default TotalUI;
