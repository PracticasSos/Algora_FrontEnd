import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box, Container, Heading, Text, Flex, HStack, VStack, Icon, SimpleGrid,
  Button, Spinner, useColorModeValue,
} from "@chakra-ui/react";
import { supabase } from "../../api/supabase";
import SmartHeader from "../header/SmartHeader";
import {
  Store, Sparkles, LogOut, ShoppingCart, Activity, Wallet, CreditCard,
  RotateCcw, UserPlus, Users, ClipboardList, List, Smile, Truck, Wrench,
  Package, Eye, Building2, DollarSign, FileText, Upload, MessageSquare,
  Clock, Layers, ArrowRight,
} from "lucide-react";

const ACCENT = "#00A88E";

// Un solo lugar con label + ícono + ruta — antes esto vivía separado
// (options[] vs handleOptionClick switch) y se había desincronizado: el
// botón "HISTORIAL PACIENTE" no navegaba a ningún lado porque el switch
// comparaba contra "HISTORIAL DE VENTAS", un label que no existía en la
// lista. Con un solo array no puede volver a pasar.
const SECTIONS = [
  {
    title: "Ventas",
    items: [
      { label: "Nueva Venta", icon: ShoppingCart, route: "/sales" },
      { label: "Historial de Venta", icon: Activity, route: "/history-clinic" },
      { label: "Créditos", icon: CreditCard, route: "/balance" },
      { label: "Saldos", icon: DollarSign, route: "/balances-patient" },
      { label: "Retiros", icon: RotateCcw, route: "/retreats-patients" },
    ],
  },
  {
    title: "Pacientes",
    items: [
      { label: "Registrar Paciente", icon: UserPlus, route: "/register-patient" },
      { label: "Lista de Pacientes", icon: Users, route: "/list-patients" },
      { label: "Registrar Medidas", icon: ClipboardList, route: "/measures-final" },
      { label: "Historial de Medidas", icon: List, route: "/history-measure-list" },
      { label: "Experiencia", icon: Smile, route: "/register-experience" },
    ],
  },
  {
    title: "Laboratorio",
    items: [
      { label: "Orden de Laboratorio", icon: Truck, route: "/order-laboratory-list" },
      { label: "Registrar Laboratorio", icon: Wrench, route: "/labs" },
    ],
  },
  {
    title: "Inventario",
    items: [
      { label: "Armazones", icon: Package, route: "/inventory" },
      { label: "Lunas", icon: Eye, route: "/list-lens" },
      { label: "Tratamientos", icon: Wrench, route: "/treatments" },
      { label: "Sucursal", icon: Building2, route: "/branch" },
    ],
  },
  {
    title: "Caja y Cierres",
    items: [
      { label: "Cierre Diario", icon: DollarSign, route: "/patient-records" },
      { label: "Consultar Cierre", icon: FileText, route: "/cash-closure" },
      { label: "Egresos", icon: Upload, route: "/egresos" },
      { label: "Conciliación Datafast", icon: CreditCard, route: "/datafast-reconciliation" },
    ],
  },
  {
    title: "Documentos",
    items: [
      { label: "Imprimir Certificado", icon: FileText, route: "/print-certificate" },
      { label: "Logos", icon: Upload, route: "/upload-logo" },
      { label: "Términos y Condiciones", icon: FileText, route: "/terms-manager" },
    ],
  },
  {
    title: "Configuración",
    items: [
      { label: "Usuarios", icon: Users, route: "/register" },
      { label: "Configuración de Usuarios", icon: Users, route: "/user-management" },
      { label: "Mensajes", icon: MessageSquare, route: "/message-manager" },
      { label: "Configuración de Retiros", icon: Clock, route: "/delivery-settings" },
      { label: "Optómetras", icon: Users, route: "/optometrist-settings" },
      { label: "Tenant", icon: Layers, route: "/super-admin/tenants" },
    ],
  },
];

const SuperAdminDashBoard = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error || !session?.user) {
        navigate("/Login");
      } else {
        setUser(session.user);
        localStorage.setItem("user", JSON.stringify(session.user));
      }
      setLoading(false);
    };

    const userFromStorage = JSON.parse(localStorage.getItem("user"));
    if (userFromStorage) {
      setUser(userFromStorage);
      setLoading(false);
    } else {
      checkSession();
    }
  }, [navigate]);

  const handleLogout = async () => {
    // Antes esto solo redirigía a /Login sin cerrar la sesión real de
    // Supabase, así que el token seguía válido — se corrige cerrando la
    // sesión de verdad antes de navegar.
    await supabase.auth.signOut();
    localStorage.removeItem("user");
    navigate("/Login");
  };

  const cardBg = useColorModeValue("white", "gray.700");
  const borderColor = useColorModeValue("gray.200", "gray.600");
  const subtitleColor = useColorModeValue("gray.500", "gray.400");
  const sectionIconBg = useColorModeValue("#E6FBF6", "rgba(0,168,142,0.15)");
  const headingColor = useColorModeValue("gray.800", "white");
  const tileBg = useColorModeValue("gray.50", "gray.750");

  if (loading || !user) {
    return (
      <Flex minH="100vh" align="center" justify="center" bg={useColorModeValue("gray.50", "gray.900")}>
        <Spinner color={ACCENT} />
      </Flex>
    );
  }

  return (
    <Box minHeight="100vh" bgGradient={useColorModeValue("linear(to-br, gray.50, teal.50)", "linear(to-br, gray.900, #0d1f1c)")}>
      <SmartHeader moduleSpecificButton={null} />

      <Container maxW="1300px" py={8} px={{ base: 3, md: 6 }}>
        {/* Encabezado + cerrar sesión */}
        <Flex justify="space-between" align="center" mb={6} flexWrap="wrap" gap={3}>
          <HStack spacing={3}>
            <Flex align="center" justify="center" boxSize="44px" borderRadius="14px" bgGradient="linear(to-br, #00A88E, #00786A)" color="white" boxShadow="0 6px 16px -4px rgba(0,168,142,0.5)">
              <Icon as={Sparkles} boxSize="20px" />
            </Flex>
            <VStack align="start" spacing={0}>
              <Heading size="lg" fontWeight="800" color={headingColor} letterSpacing="tight">
                Panel de SuperAdmin
              </Heading>
              <Text fontSize="xs" color={subtitleColor}>Acceso completo a todos los módulos de Veoptics</Text>
            </VStack>
          </HStack>
          <Button leftIcon={<LogOut size={16} />} variant="outline" colorScheme="red" borderRadius="12px" onClick={handleLogout}>
            Cerrar sesión
          </Button>
        </Flex>

        {/* Tarjeta destacada: Panel de Ópticas */}
        <Box
          borderRadius="24px"
          bgGradient="linear(to-br, #00A88E, #00786A)"
          color="white"
          p={{ base: 5, md: 7 }}
          mb={8}
          position="relative"
          overflow="hidden"
          cursor="pointer"
          transition="all 0.2s ease"
          _hover={{ transform: "translateY(-3px)", boxShadow: "2xl" }}
          onClick={() => navigate("/super-admin/opticas")}
        >
          <Icon as={Store} boxSize="140px" position="absolute" right="-20px" bottom="-30px" opacity={0.12} />
          <Flex justify="space-between" align="center" flexWrap="wrap" gap={4}>
            <Box>
              <HStack mb={1}>
                <Icon as={Store} boxSize="18px" />
                <Text fontSize="xs" fontWeight="bold" letterSpacing="wide" textTransform="uppercase" opacity={0.9}>
                  Nuevo
                </Text>
              </HStack>
              <Heading size="md" fontWeight="800" mb={1}>Panel de Ópticas</Heading>
              <Text fontSize="sm" opacity={0.9}>
                Administra cada óptica, su Admin asignado y compara sus ventas — todo en un solo lugar.
              </Text>
            </Box>
            <Button
              rightIcon={<ArrowRight size={16} />}
              bg="white"
              color={ACCENT}
              _hover={{ bg: "gray.100" }}
              borderRadius="12px"
              onClick={(e) => { e.stopPropagation(); navigate("/super-admin/opticas"); }}
            >
              Abrir panel
            </Button>
          </Flex>
        </Box>

        {/* Secciones agrupadas */}
        {SECTIONS.map((section) => (
          <Box key={section.title} mb={8}>
            <Flex align="center" gap={3} mb={4}>
              <Box flex="1" h="1px" bg={borderColor} />
              <Text fontSize="xs" fontWeight="bold" letterSpacing="wide" textTransform="uppercase" color={ACCENT} whiteSpace="nowrap">
                {section.title}
              </Text>
              <Box flex="1" h="1px" bg={borderColor} />
            </Flex>
            <SimpleGrid columns={{ base: 2, sm: 3, md: 4 }} spacing={4}>
              {section.items.map((item) => (
                <Flex
                  key={item.label}
                  direction="column"
                  align="center"
                  justify="center"
                  gap={2}
                  py={6}
                  px={3}
                  bg={cardBg}
                  border={`1px solid ${borderColor}`}
                  borderRadius="18px"
                  cursor="pointer"
                  textAlign="center"
                  transition="all 0.15s ease"
                  _hover={{ transform: "translateY(-3px)", boxShadow: "lg", borderColor: ACCENT }}
                  onClick={() => navigate(item.route)}
                >
                  <Flex align="center" justify="center" boxSize="40px" borderRadius="12px" bg={tileBg} color={ACCENT}>
                    <Icon as={item.icon} boxSize="18px" />
                  </Flex>
                  <Text fontSize="xs" fontWeight="semibold" color={headingColor}>
                    {item.label}
                  </Text>
                </Flex>
              ))}
            </SimpleGrid>
          </Box>
        ))}
      </Container>
    </Box>
  );
};

export default SuperAdminDashBoard;
