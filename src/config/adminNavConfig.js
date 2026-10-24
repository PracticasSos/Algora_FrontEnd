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
  FiAlertCircle,
  FiLifeBuoy,
  FiLayers,
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
      { label: "Solicitudes de corrección", path: "/correction-requests", icon: FiAlertCircle },
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
      { label: "Armazones", path: "/inventory", icon: FiPackage },
      { label: "Lunas", path: "/list-lens", icon: FiEye },
      { label: "Tratamientos", path: "/treatments", icon: FiTool },
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
      { label: "Conciliación Datafast", path: "/datafast-reconciliation", icon: FiCreditCard },
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
      { label: "Registrar Usuario", path: "/register", icon: FiUserPlus },
      { label: "Configuración de Usuarios", path: "/user-management", icon: FiUsers },
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

export const optometraMobileTabs = [
  { label: "Inicio", path: "/optometra", icon: FiHome },
  { label: "Pacientes", path: "/list-patients", icon: FiUsers },
  { label: "Medidas", path: "/measures-final", icon: FiClipboard },
];


// ---- Navegación por rol (el Optometra no ve el menú completo de Admin) ----
export const optometraNavSections = [
  {
    id: "pacientes",
    title: "Pacientes",
    items: [
      { label: "Registrar Paciente", path: "/register-patient", icon: FiUserPlus },
      { label: "Lista de Pacientes", path: "/list-patients", icon: FiUsers },
      { label: "Registrar Medidas", path: "/measures-final", icon: FiClipboard },
      { label: "Historial de Medidas", path: "/history-measure-list", icon: FiList },
    ],
  },
  {
    id: "documentos",
    title: "Documentos",
    items: [{ label: "Imprimir Certificado", path: "/print-certificate", icon: FiFileText }],
  },
  {
    id: "caja",
    title: "Caja",
    items: [{ label: "Egresos", path: "/egresos", icon: FiUpload }],
  },
];

export const vendedorNavSections = [
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
    items: [{ label: "Registrar Paciente", path: "/register-patient", icon: FiUserPlus }],
  },
  {
    id: "documentos",
    title: "Documentos",
    items: [{ label: "Imprimir Certificado", path: "/print-certificate", icon: FiFileText }],
  },
  {
    id: "caja",
    title: "Caja",
    items: [{ label: "Egresos", path: "/egresos", icon: FiUpload }],
  },
];

export const vendedorMobileTabs = [
  { label: "Inicio", path: "/vendedor", icon: FiHome },
  { label: "Venta", path: "/sales", icon: FiShoppingCart },
  { label: "Retiros", path: "/retreats-patients", icon: FiRotateCcw },
];

export const superadminNavSections = [
  {
    id: "plataforma",
    title: "Plataforma",
    items: [
      { label: "Ópticas", path: "/super-admin/tenants", icon: FiLayers },
      { label: "Planes", path: "/super-admin/plans", icon: FiPackage },
      { label: "Pagos", path: "/super-admin/payments", icon: FiDollarSign },
      { label: "Soporte", path: "/super-admin/support", icon: FiLifeBuoy },
    ],
  },
];

export const superadminMobileTabs = [
  { label: "Inicio", path: "/super-admin", icon: FiHome },
  { label: "Ópticas", path: "/super-admin/tenants", icon: FiLayers },
  { label: "Pagos", path: "/super-admin/payments", icon: FiDollarSign },
];

export const isAdminRoleId = (roleId) => [1, 4].includes(Number(roleId));
export const homePathForRole = (roleId) => (Number(roleId) === 4 ? "/super-admin" : isAdminRoleId(roleId) ? "/admin" : Number(roleId) === 2 ? "/optometra" : "/vendedor");
export const baseSectionsForRole = (roleId) =>
  Number(roleId) === 4 ? superadminNavSections : isAdminRoleId(roleId) ? adminNavSections : Number(roleId) === 3 ? vendedorNavSections : optometraNavSections;
// Ventas solo si es admin o se le asignó /sales
export const canQuickSale = (user) =>
  Number(user?.role_id) === 1 || (Array.isArray(user?.allowed_routes) && user.allowed_routes.includes("/sales"));
