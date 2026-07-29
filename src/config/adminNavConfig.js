// src/config/adminNavConfig.js
// Fuente única de verdad para la navegación del rol Admin.
// Se usa tanto en HeaderAdmin (barra persistente en todas las páginas)
// como en OptionsAdmin (home / dashboard).
//
// Cada sección agrupa acciones relacionadas. `quickAction` es la acción
// más frecuente (Venta) y siempre se muestra de forma prominente,
// separada de las secciones normales.

import {
  FiShoppingCart,
  FiUserPlus,
  FiUsers,
  FiClipboard,
  FiEye,
  FiSmile,
  FiTruck,
  FiPackage,
  FiMapPin,
  FiTool,
  FiDollarSign,
  FiCreditCard,
  FiRotateCcw,
  FiFileText,
  FiUpload,
  FiMessageSquare,
  FiActivity,
  FiList,
  FiHome,
  FiClock,
} from "react-icons/fi";

export const quickAction = {
  label: "Nueva Venta",
  path: "/sales",
  icon: FiShoppingCart,
};

export const adminNavSections = [
  {
    id: "ventas",
    title: "Ventas",
    items: [
      { label: "Nueva Venta", path: "/sales", icon: FiShoppingCart },
      { label: "Historial de Venta", path: "/history-clinic", icon: FiActivity },
      { label: "Créditos", path: "/balance", icon: FiCreditCard },
      { label: "Saldos", path: "/balances-patient", icon: FiDollarSign },
      { label: "Retiros", path: "/retreats-patients", icon: FiRotateCcw },
    ],
  },
  {
    id: "pacientes",
    title: "Pacientes",
    items: [
      { label: "Registrar Paciente", path: "/register-patient", icon: FiUserPlus },
      { label: "Lista de Pacientes", path: "/list-patients", icon: FiUsers },
      { label: "Registrar Medidas", path: "/measures-final", icon: FiClipboard },
      { label: "Historial de Medidas", path: "/history-measure-list", icon: FiList },
      { label: "Experiencia", path: "/register-experience", icon: FiSmile },
    ],
  },
  {
    id: "laboratorio",
    title: "Laboratorio",
    items: [
      { label: "Orden de Laboratorio", path: "/order-laboratory-list", icon: FiTruck },
      { label: "Registrar Laboratorio", path: "/labs", icon: FiTool },
    ],
  },
  {
    id: "inventario",
    title: "Inventario",
    items: [
      { label: "Inventario", path: "/inventory", icon: FiPackage },
      { label: "Registrar Lunas", path: "/register-lens", icon: FiEye },
      { label: "Sucursal", path: "/branch", icon: FiMapPin },
    ],
  },
  {
    id: "caja",
    title: "Caja y Cierres",
    items: [
      { label: "Cierre Diario", path: "/patient-records", icon: FiDollarSign },
      { label: "Consultar Cierre", path: "/cash-closure", icon: FiFileText },
      { label: "Egresos", path: "/egresos", icon: FiUpload },
    ],
  },
  {
    id: "documentos",
    title: "Documentos",
    items: [
      { label: "Imprimir Certificado", path: "/print-certificate", icon: FiFileText },
      { label: "Logos", path: "/upload-logo", icon: FiUpload },
      { label: "Términos y Condiciones", path: "/terms-manager", icon: FiFileText },
    ],
  },
  {
    id: "configuracion",
    title: "Configuración",
    items: [
      { label: "Usuarios", path: "/register", icon: FiUsers },
      { label: "Mensajes", path: "/message-manager", icon: FiMessageSquare },
      { label: "Configuración de Retiros", path: "/delivery-settings", icon: FiClock },
      { label: "Optómetras", path: "/optometrist-settings", icon: FiUsers },
    ],
  },
];

// Los 4 destinos de la barra inferior en móvil (además de "Más" que abre el drawer)
export const mobileTabs = [
  { label: "Inicio", path: "/admin", icon: FiHome },
  { label: "Venta", path: "/sales", icon: FiShoppingCart },
  { label: "Pacientes", path: "/register-patient", icon: FiUserPlus },
];
