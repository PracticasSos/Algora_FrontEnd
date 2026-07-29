import { useEffect, useState } from "react";
import {
  Box,
  Flex,
  Text,
  SimpleGrid,
  Icon,
  Spinner,
  useColorModeValue,
  HStack,
  VStack,
  Badge,
} from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";
import { FiDollarSign, FiCalendar, FiTrendingUp, FiAlertTriangle, FiClock } from "react-icons/fi";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { useAuth } from "../AuthContext";
import { supabase } from "../../api/supabase";
import { quickAction } from "../../config/adminNavConfig";
import { FiUserPlus, FiDollarSign as FiCash } from "react-icons/fi";

const monthNames = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

const AdminDashBoard = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  const [kpis, setKpis] = useState({ today: null, month: null, year: null });
  const [chartData, setChartData] = useState([]);
  const [recentSales, setRecentSales] = useState([]);
  const [lowStock, setLowStock] = useState([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [dataError, setDataError] = useState(false);

  useEffect(() => {
    if (!user) return;

    const loadDashboard = async () => {
      setDataLoading(true);
      setDataError(false);
      try {
        const now = new Date();
        const startOfYear = new Date(now.getFullYear(), 0, 1).toISOString().slice(0, 10);
        const twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 11, 1)
          .toISOString()
          .slice(0, 10);
        const rangeStart = startOfYear < twelveMonthsAgo ? twelveMonthsAgo : startOfYear;

        const [salesRes, recentRes, stockRes] = await Promise.all([
          supabase
            .from("sales")
            .select("date, total, is_refund")
            .eq("is_refund", false)
            .gte("date", rangeStart),
          supabase
            .from("sales")
            .select("id, date, total, patients (pt_firstname, pt_lastname)")
            .eq("is_refund", false)
            .order("date", { ascending: false })
            .limit(5),
          supabase
            .from("inventario")
            .select("id, brand, quantity")
            .eq("category", "armazon")
            .lte("quantity", 5)
            .order("quantity", { ascending: true })
            .limit(5),
        ]);

        if (salesRes.error) throw salesRes.error;
        if (recentRes.error) throw recentRes.error;
        if (stockRes.error) throw stockRes.error;

        // KPIs (hoy / mes / año)
        const todayStr = now.toISOString().slice(0, 10);
        const monthStr = todayStr.slice(0, 7);
        let today = 0;
        let month = 0;
        let year = 0;

        // Tendencia mensual (últimos 12 meses)
        const monthBuckets = {};
        for (let i = 11; i >= 0; i--) {
          const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
          const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
          monthBuckets[key] = { key, label: monthNames[d.getMonth()], total: 0 };
        }

        (salesRes.data || []).forEach((row) => {
          const total = parseFloat(row.total) || 0;
          if (typeof row.date !== "string") return;
          const dateStr = row.date.slice(0, 10);
          if (dateStr >= startOfYear) year += total;
          if (dateStr === todayStr) today += total;
          if (dateStr.slice(0, 7) === monthStr) month += total;

          const bucketKey = dateStr.slice(0, 7);
          if (monthBuckets[bucketKey]) monthBuckets[bucketKey].total += total;
        });

        setKpis({ today, month, year });
        setChartData(Object.values(monthBuckets));
        setRecentSales(recentRes.data || []);
        setLowStock(stockRes.data || []);
      } catch (err) {
        console.error("Error cargando el dashboard:", err);
        setDataError(true);
      } finally {
        setDataLoading(false);
      }
    };

    loadDashboard();
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
  const hoverBorder = useColorModeValue("#2196f3", "#00E599");
  const gridColor = useColorModeValue("#E2E8F0", "#2D3748");
  const tooltipBg = useColorModeValue("white", "gray.800");

  const formatMoney = (value) =>
    value === null ? "—" : `$${value.toLocaleString("es-EC", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const kpiCards = [
    { label: "Ventas de hoy", value: kpis.today, icon: FiDollarSign, bg: "white", accent: "#2D3748" },
    { label: "Ventas del mes", value: kpis.month, icon: FiCalendar, bg: "#63b3ed", accent: "white" },
    { label: "Ventas del año", value: kpis.year, icon: FiTrendingUp, bg: "#f6ad55", accent: "white" },
  ];

  // Solo lo que realmente se usa a diario — el resto ya vive en el sidebar
  const quickAccessItems = [
    quickAction,
    { label: "Registrar Paciente", path: "/register-patient", icon: FiUserPlus },
    { label: "Cierre Diario", path: "/patient-records", icon: FiCash },
  ];

  return (
    <Box bg={mainBg} minH="100vh" bgGradient={mainBg}>
      <Box maxW="1200px" mx="auto" px={{ base: 4, md: 8 }} pt={{ base: 4, md: 8 }} pb={12}>
        {/* Saludo */}
        <Text fontSize={{ base: "xl", md: "2xl" }} fontWeight="bold" color={textColor} mb={1}>
          Hola, {userData.name} 👋
        </Text>
        <Text fontSize="sm" color={subtitleColor} mb={6}>
          Esto es lo que está pasando en tu óptica
        </Text>

        {/* KPIs reales de la tabla sales */}
        <SimpleGrid columns={{ base: 1, sm: 3 }} spacing={4} mb={4}>
          {kpiCards.map((kpi) => (
            <Flex
              key={kpi.label}
              direction="column"
              justify="space-between"
              bg={kpi.bg}
              color={kpi.accent}
              borderRadius="16px"
              p={5}
              minH="100px"
              boxShadow="sm"
            >
              <Text fontSize="sm" fontWeight="medium" opacity={0.85}>{kpi.label}</Text>
              {dataLoading ? (
                <Spinner size="sm" mt={2} />
              ) : dataError ? (
                <Text fontSize="sm" mt={2}>No se pudo cargar</Text>
              ) : (
                <Text fontSize="2xl" fontWeight="bold" mt={2}>{formatMoney(kpi.value)}</Text>
              )}
            </Flex>
          ))}
        </SimpleGrid>

        {/* Accesos rápidos: solo los 3 que se usan todo el día */}
        <SimpleGrid columns={{ base: 3 }} spacing={3} mb={8}>
          {quickAccessItems.map((item) => (
            <Flex
              key={item.path}
              direction="column"
              align="center"
              justify="center"
              gap={2}
              bg={cardBg}
              border={`2px solid ${item.path === quickAction.path ? "#00A88E" : "transparent"}`}
              borderRadius="14px"
              boxShadow="sm"
              py={4}
              cursor="pointer"
              transition="0.15s"
              _hover={{ transform: "translateY(-3px)", boxShadow: "md", borderColor: hoverBorder }}
              onClick={() => navigate(item.path)}
            >
              <Icon as={item.icon} boxSize={5} color={item.path === quickAction.path ? "#00A88E" : hoverBorder} />
              <Text fontSize="xs" fontWeight="semibold" color={textColor} textAlign="center" px={1}>
                {item.label}
              </Text>
            </Flex>
          ))}
        </SimpleGrid>

        {/* Gráfico de evolución de ventas */}
        <Box bg={cardBg} border={cardBorder} borderRadius="18px" p={{ base: 4, md: 6 }} mb={6} boxShadow="sm">
          <Text fontWeight="bold" color={textColor} mb={1}>Evolución de ventas</Text>
          <Text fontSize="xs" color={subtitleColor} mb={4}>Últimos 12 meses</Text>
          {dataLoading ? (
            <Flex justify="center" py={10}><Spinner /></Flex>
          ) : dataError ? (
            <Text fontSize="sm" color={subtitleColor}>No se pudo cargar el gráfico.</Text>
          ) : (
            <Box h="260px">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#00A88E" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="#00A88E" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                  <XAxis dataKey="label" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v}`} />
                  <Tooltip
                    formatter={(value) => [formatMoney(value), "Ventas"]}
                    contentStyle={{ background: tooltipBg, border: "none", borderRadius: "10px", fontSize: "13px" }}
                  />
                  <Area type="monotone" dataKey="total" stroke="#00A88E" strokeWidth={2.5} fill="url(#salesGradient)" />
                </AreaChart>
              </ResponsiveContainer>
            </Box>
          )}
        </Box>

        {/* Ventas recientes + Stock bajo */}
        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
          <Box bg={cardBg} border={cardBorder} borderRadius="18px" p={{ base: 4, md: 6 }} boxShadow="sm">
            <HStack mb={4}>
              <Icon as={FiClock} color={hoverBorder} />
              <Text fontWeight="bold" color={textColor}>Ventas recientes</Text>
            </HStack>
            {dataLoading ? (
              <Spinner size="sm" />
            ) : recentSales.length === 0 ? (
              <Text fontSize="sm" color={subtitleColor}>Aún no hay ventas registradas.</Text>
            ) : (
              <VStack align="stretch" spacing={3}>
                {recentSales.map((sale) => (
                  <HStack key={sale.id} justify="space-between">
                    <VStack align="start" spacing={0}>
                      <Text fontSize="sm" fontWeight="medium" color={textColor}>
                        {sale.patients ? `${sale.patients.pt_firstname} ${sale.patients.pt_lastname}` : "Sin paciente"}
                      </Text>
                      <Text fontSize="xs" color={subtitleColor}>{sale.date}</Text>
                    </VStack>
                    <Text fontSize="sm" fontWeight="bold" color={hoverBorder}>
                      {formatMoney(parseFloat(sale.total))}
                    </Text>
                  </HStack>
                ))}
              </VStack>
            )}
          </Box>

          <Box bg={cardBg} border={cardBorder} borderRadius="18px" p={{ base: 4, md: 6 }} boxShadow="sm">
            <HStack mb={4}>
              <Icon as={FiAlertTriangle} color="orange.400" />
              <Text fontWeight="bold" color={textColor}>Stock bajo</Text>
            </HStack>
            {dataLoading ? (
              <Spinner size="sm" />
            ) : lowStock.length === 0 ? (
              <Text fontSize="sm" color={subtitleColor}>Todo el inventario está en buen nivel.</Text>
            ) : (
              <VStack align="stretch" spacing={3}>
                {lowStock.map((item) => (
                  <HStack key={item.id} justify="space-between">
                    <Text fontSize="sm" color={textColor} noOfLines={1}>{item.brand}</Text>
                    <Badge colorScheme={item.quantity === 0 ? "red" : "orange"} borderRadius="full">
                      {item.quantity} en stock
                    </Badge>
                  </HStack>
                ))}
              </VStack>
            )}
          </Box>
        </SimpleGrid>
      </Box>
    </Box>
  );
};

export default AdminDashBoard;
