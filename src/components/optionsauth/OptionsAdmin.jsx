import { useEffect, useState } from "react";
import {
  Box,
  Flex,
  Text,
  SimpleGrid,
  Icon,
  Spinner,
  useColorModeValue,
} from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";
import { FiDollarSign, FiCalendar, FiTrendingUp } from "react-icons/fi";
import { useAuth } from "../AuthContext";
import { supabase } from "../../api/supabase";
import { adminNavSections, quickAction } from "../../config/adminNavConfig";

const AdminDashBoard = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  const [kpis, setKpis] = useState({ today: null, month: null, year: null });
  const [kpiLoading, setKpiLoading] = useState(true);
  const [kpiError, setKpiError] = useState(false);

  useEffect(() => {
    if (!user) return;

    const loadKpis = async () => {
      setKpiLoading(true);
      setKpiError(false);
      try {
        const now = new Date();
        const startOfYear = new Date(now.getFullYear(), 0, 1).toISOString().slice(0, 10);

        // Trae solo lo del año actual y calcula hoy/mes/año en el cliente,
        // así una sola consulta cubre los 3 indicadores.
        const { data, error } = await supabase
          .from("sales")
          .select("date, total, is_refund")
          .eq("is_refund", false)
          .gte("date", startOfYear);

        if (error) throw error;

        const todayStr = now.toISOString().slice(0, 10);
        const monthStr = todayStr.slice(0, 7);

        let today = 0;
        let month = 0;
        let year = 0;

        (data || []).forEach((row) => {
          const total = parseFloat(row.total) || 0;
          year += total;
          if (typeof row.date === "string") {
            if (row.date.slice(0, 10) === todayStr) today += total;
            if (row.date.slice(0, 7) === monthStr) month += total;
          }
        });

        setKpis({ today, month, year });
      } catch (err) {
        console.error("Error cargando KPIs de ventas:", err);
        setKpiError(true);
      } finally {
        setKpiLoading(false);
      }
    };

    loadKpis();
  }, [user]);

  if (loading || !user) {
    return null;
  }

  const userData = {
    name: user?.user_metadata?.firstname || user?.firstname || "Usuario",
  };

  const mainBg = useColorModeValue("linear(to-b, #f7fafc, #edf2f7)", "#000000");
  const cardBg = useColorModeValue("white", "rgba(83, 81, 81, 0.4)");
  const cardBorder = useColorModeValue("1px solid rgba(0,0,0,0.08)", "1px solid rgba(255,255,255,0.08)");
  const textColor = useColorModeValue("gray.800", "white");
  const subtitleColor = useColorModeValue("gray.500", "gray.400");
  const sectionTitleColor = useColorModeValue("gray.600", "gray.300");
  const hoverBorder = useColorModeValue("#2196f3", "#00E599");

  const formatMoney = (value) =>
    value === null ? "—" : `$${value.toLocaleString("es-EC", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const kpiCards = [
    { label: "Ventas de hoy", value: kpis.today, icon: FiDollarSign, bg: "white", accent: "#2D3748" },
    { label: "Ventas del mes", value: kpis.month, icon: FiCalendar, bg: "#63b3ed", accent: "white" },
    { label: "Ventas del año", value: kpis.year, icon: FiTrendingUp, bg: "#f6ad55", accent: "white" },
  ];

  const quickAccessItems = [
    quickAction,
    { label: "Registrar Paciente", path: "/register-patient", icon: adminNavSections[1].items[0].icon },
    { label: "Orden de Laboratorio", path: "/order-laboratory-list", icon: adminNavSections[2].items[0].icon },
    { label: "Cierre Diario", path: "/patient-records", icon: adminNavSections[4].items[0].icon },
  ];

  return (
    <Box bg={mainBg} minH="100vh" bgGradient={mainBg}>
      <Box maxW="1100px" mx="auto" px={{ base: 4, md: 8 }} pt={{ base: 4, md: 8 }} pb={12}>
        {/* Saludo */}
        <Text fontSize={{ base: "xl", md: "2xl" }} fontWeight="bold" color={textColor} mb={1}>
          Hola, {userData.name} 👋
        </Text>
        <Text fontSize="sm" color={subtitleColor} mb={6}>
          Esto es lo que puedes hacer hoy
        </Text>

        {/* KPIs reales de la tabla sales */}
        <SimpleGrid columns={{ base: 1, sm: 3 }} spacing={4} mb={8}>
          {kpiCards.map((kpi) => (
            <Flex
              key={kpi.label}
              direction="column"
              justify="space-between"
              bg={kpi.bg}
              color={kpi.accent}
              borderRadius="16px"
              p={5}
              minH="110px"
              boxShadow="sm"
            >
              <Text fontSize="sm" fontWeight="medium" opacity={0.85}>{kpi.label}</Text>
              {kpiLoading ? (
                <Spinner size="sm" mt={2} />
              ) : kpiError ? (
                <Text fontSize="sm" mt={2}>No se pudo cargar</Text>
              ) : (
                <Text fontSize="2xl" fontWeight="bold" mt={2}>{formatMoney(kpi.value)}</Text>
              )}
            </Flex>
          ))}
        </SimpleGrid>

        {/* Accesos rápidos */}
        <SimpleGrid columns={{ base: 2, sm: 2, md: 4 }} spacing={4} mb={10}>
          {quickAccessItems.map((item) => (
            <Flex
              key={item.path}
              direction="column"
              align="center"
              justify="center"
              gap={2}
              bg={cardBg}
              border={`2px solid ${item.path === quickAction.path ? "#00A88E" : "transparent"}`}
              borderRadius="16px"
              boxShadow="sm"
              py={6}
              cursor="pointer"
              transition="0.15s"
              _hover={{ transform: "translateY(-3px)", boxShadow: "md", borderColor: hoverBorder }}
              onClick={() => navigate(item.path)}
            >
              <Icon as={item.icon} boxSize={7} color={item.path === quickAction.path ? "#00A88E" : hoverBorder} />
              <Text fontSize="sm" fontWeight="semibold" color={textColor} textAlign="center" px={2}>
                {item.label}
              </Text>
            </Flex>
          ))}
        </SimpleGrid>

        {/* Secciones agrupadas (además del sidebar, sirve como vista rápida en el home) */}
        {adminNavSections.map((section) => (
          <Box key={section.id} mb={8}>
            <Text fontSize="sm" fontWeight="bold" letterSpacing="wide" textTransform="uppercase" color={sectionTitleColor} mb={3}>
              {section.title}
            </Text>
            <SimpleGrid columns={{ base: 2, sm: 3, md: 5 }} spacing={3}>
              {section.items.map((item) => (
                <Flex
                  key={item.path}
                  direction="column"
                  align="center"
                  justify="center"
                  gap={2}
                  bg={cardBg}
                  border={cardBorder}
                  borderRadius="14px"
                  py={5}
                  px={2}
                  cursor="pointer"
                  transition="0.15s"
                  _hover={{ transform: "translateY(-2px)", boxShadow: "md", borderColor: hoverBorder }}
                  onClick={() => navigate(item.path)}
                >
                  <Icon as={item.icon} boxSize={5} color={hoverBorder} />
                  <Text fontSize="xs" fontWeight="medium" color={textColor} textAlign="center" noOfLines={2}>
                    {item.label}
                  </Text>
                </Flex>
              ))}
            </SimpleGrid>
          </Box>
        ))}
      </Box>
    </Box>
  );
};

export default AdminDashBoard;
