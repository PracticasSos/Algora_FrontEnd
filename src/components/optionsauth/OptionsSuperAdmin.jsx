import { useEffect, useMemo, useState, useCallback } from "react";
import {
  Box, Flex, Heading, Text, SimpleGrid, Badge, Button, HStack, Avatar, Skeleton, Table, Thead, Tbody, Tr, Th, Td,
  Icon, useColorModeValue,
} from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, Clock, LifeBuoy } from "lucide-react";
import { supabase } from "../../api/supabase";
import { useAuth } from "../AuthContext";
import RegisterPaymentModal from "../SuperAdmin/RegisterPaymentModal";

const ACCENT = "#00A88E";
const money = (v) => `$${(Number(v) || 0).toLocaleString("es-EC", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const todayISO = () => new Date().toISOString().slice(0, 10);
const daysBetween = (iso) => Math.round((new Date(`${iso}T12:00:00`) - new Date(`${todayISO()}T12:00:00`)) / 86400000);

/** Inicio del SuperAdmin: salud de la plataforma y cobros. Sin acceso a datos clínicos. */
const OptionsSuperAdmin = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [tenants, setTenants] = useState([]);
  const [stats, setStats] = useState({});
  const [openTickets, setOpenTickets] = useState(0);
  const [payTenant, setPayTenant] = useState(null);
  const [statsError, setStatsError] = useState(false);
  const [loading, setLoading] = useState(true);

  const cardBg = useColorModeValue("white", "gray.800");
  const border = useColorModeValue("gray.200", "gray.700");
  const muted = useColorModeValue("gray.500", "gray.400");
  const rowHover = useColorModeValue("gray.50", "whiteAlpha.100");

  const load = useCallback(async () => {
    setLoading(true);
    const { data: t } = await supabase.from("tenants").select("*").order("created_at", { ascending: false });
    setTenants(t || []);
    const { data: s, error } = await supabase.rpc("superadmin_tenant_stats");
    setStatsError(!!error);
    setStats(Object.fromEntries((s || []).map((x) => [x.tenant_id, x])));
    const { count } = await supabase.from("support_tickets").select("id", { count: "exact", head: true }).eq("status", "open");
    setOpenTickets(count || 0);
    setLoading(false);
  }, []);
  useEffect(() => { load(); }, [load]);

  const payState = (t) => {
    if (!t.status) return { label: "Suspendida", color: "gray" };
    if (!t.next_billing_date) return { label: "Sin fecha de cobro", color: "gray" };
    const d = daysBetween(String(t.next_billing_date).slice(0, 10));
    if (d < 0) return { label: `Vencido hace ${-d} d`, color: "red" };
    if (d <= 7) return { label: `Vence en ${d} d`, color: "orange" };
    return { label: "Al día", color: "green" };
  };

  const kpis = useMemo(() => {
    const active = tenants.filter((t) => t.status);
    const all = Object.values(stats);
    return {
      active: active.length,
      users: all.reduce((s, x) => s + (x.users_count || 0), 0),
      sales: all.reduce((s, x) => s + Number(x.sales_month || 0), 0),
      overdue: active.filter((t) => payState(t).color === "red").length,
    };
  }, [tenants, stats]);

  const alerts = useMemo(() => {
    const list = [];
    tenants.forEach((t) => {
      const p = payState(t);
      if (p.color === "red") list.push({ key: `p${t.id}`, text: `${t.name}: pago ${p.label.toLowerCase()}`, color: "red" });
      if (p.color === "orange") list.push({ key: `o${t.id}`, text: `${t.name}: ${p.label.toLowerCase()}`, color: "orange" });
      const last = stats[t.id]?.last_sale;
      if (t.status && last && daysBetween(String(last).slice(0, 10)) < -30) list.push({ key: `i${t.id}`, text: `${t.name}: sin ventas hace más de 30 días`, color: "gray" });
    });
    return list;
  }, [tenants, stats]);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Buenos días" : hour < 19 ? "Buenas tardes" : "Buenas noches";

  return (
    <Box p={{ base: 4, md: 8 }} maxW="1200px" mx="auto">
      <Box h="4px" borderRadius="full" bgGradient="linear(to-r, #00A88E, #2DD4BF, #00A88E)" mb={6} />
      <Flex justify="space-between" align={{ base: "start", md: "center" }} direction={{ base: "column", md: "row" }} gap={3} mb={6}>
        <Box>
          <Heading size="lg">{greeting}{user?.firstname ? `, ${user.firstname}` : ""}</Heading>
          <Text color={muted}>Estado de la plataforma</Text>
        </Box>
        <HStack>
          <Button variant="outline" borderRadius="full" size="sm" leftIcon={<LifeBuoy size={15} />} onClick={() => navigate("/super-admin/support")}>
            Soporte {openTickets > 0 && <Badge ml={2} colorScheme="orange" borderRadius="full">{openTickets}</Badge>}
          </Button>
          <Button bg={ACCENT} color="white" _hover={{ bg: "#00967f" }} borderRadius="full" size="sm" onClick={() => navigate("/super-admin/tenants")}>Administrar ópticas</Button>
        </HStack>
      </Flex>

      <SimpleGrid columns={{ base: 2, md: 4 }} spacing={4} mb={6}>
        {[
          { l: "Ópticas activas", v: kpis.active, c: ACCENT },
          { l: "Usuarios totales", v: kpis.users, c: "#3182CE" },
          { l: "Ventas del mes (todas)", v: money(kpis.sales), c: "#38A169" },
          { l: "Cobros vencidos", v: kpis.overdue, c: kpis.overdue ? "#E53E3E" : "#718096" },
        ].map((k) => (
          <Box key={k.l} bg={cardBg} border="1px solid" borderColor={border} borderRadius="20px" p={4}>
            <Text fontSize="xs" color={muted}>{k.l}</Text>
            <Skeleton isLoaded={!loading} mt={1}><Text fontSize={{ base: "xl", md: "2xl" }} fontWeight="extrabold" color={k.c}>{k.v}</Text></Skeleton>
          </Box>
        ))}
      </SimpleGrid>

      {statsError && <Text fontSize="sm" color="orange.400" mb={4}>No se pudieron cargar las estadísticas. Ejecuta sql/superadmin.sql en Supabase.</Text>}

      {alerts.length > 0 && (
        <Box bg={cardBg} border="1px solid" borderColor={border} borderRadius="20px" p={4} mb={6}>
          <Text fontWeight="bold" mb={2}>Alertas</Text>
          {alerts.map((a) => (
            <Flex key={a.key} align="center" gap={2} py={1}>
              <Icon as={a.color === "gray" ? Clock : AlertTriangle} color={`${a.color}.400`} boxSize="15px" />
              <Text fontSize="sm">{a.text}</Text>
            </Flex>
          ))}
        </Box>
      )}

      <Box bg={cardBg} border="1px solid" borderColor={border} borderRadius="24px" overflow="hidden">
        <Box h="4px" bg={ACCENT} />
        <Text fontWeight="bold" p={4} pb={2}>Ópticas</Text>
        <Box overflowX="auto">
          <Table size="sm">
            <Thead><Tr><Th>Óptica</Th><Th>Plan</Th><Th isNumeric>Usuarios</Th><Th isNumeric>Sucursales</Th><Th isNumeric>Ventas del mes</Th><Th>Cobro</Th><Th></Th></Tr></Thead>
            <Tbody>
              {loading ? <Tr><Td colSpan={7}><Skeleton h="80px" /></Td></Tr> : tenants.map((t) => {
                const st = stats[t.id] || {}; const ps = payState(t);
                return (
                  <Tr key={t.id} _hover={{ bg: rowHover }}>
                    <Td><HStack><Avatar size="xs" name={t.name} bg="teal.500" color="white" /><Box><Text fontWeight="semibold" fontSize="sm">{t.name}</Text><Text fontSize="xs" color={muted}>{t.email}</Text></Box></HStack></Td>
                    <Td><Badge borderRadius="full" px={2}>{t.plan}</Badge></Td>
                    <Td isNumeric>{st.users_count ?? "—"}</Td>
                    <Td isNumeric>{st.branches_count ?? "—"}</Td>
                    <Td isNumeric>{st.sales_month !== undefined ? money(st.sales_month) : "—"}</Td>
                    <Td><Badge colorScheme={ps.color} borderRadius="full" px={2}>{ps.label}</Badge></Td>
                    <Td><HStack justify="flex-end" spacing={1}>
                      <Button size="xs" bg={ACCENT} color="white" _hover={{ bg: "#00967f" }} borderRadius="full" onClick={() => setPayTenant(t)}>Registrar pago</Button>
                      <Button size="xs" variant="ghost" onClick={() => navigate(`/super-admin/payments?tenant=${t.id}`)}>Historial</Button>
                    </HStack></Td>
                  </Tr>
                );
              })}
            </Tbody>
          </Table>
        </Box>
      </Box>

      <RegisterPaymentModal isOpen={!!payTenant} tenant={payTenant} onClose={() => setPayTenant(null)} onSaved={load} />
    </Box>
  );
};

export default OptionsSuperAdmin;
