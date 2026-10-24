import { useEffect, useMemo, useState, useCallback } from "react";
import { Box, Flex, Heading, Text, Select, Table, Thead, Tbody, Tr, Th, Td, SimpleGrid, Skeleton, useColorModeValue } from "@chakra-ui/react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "../../api/supabase";

const money = (v) => `$${(Number(v) || 0).toLocaleString("es-EC", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const ACCENT = "#00A88E";

/** Historial de pagos recibidos de las ópticas. */
const TenantPayments = () => {
  const [params, setParams] = useSearchParams();
  const [payments, setPayments] = useState([]);
  const [tenants, setTenants] = useState({});
  const [loading, setLoading] = useState(true);
  const tenantFilter = params.get("tenant") || "";
  const cardBg = useColorModeValue("white", "gray.800");
  const border = useColorModeValue("gray.200", "gray.700");
  const muted = useColorModeValue("gray.500", "gray.400");

  const load = useCallback(async () => {
    setLoading(true);
    const [{ data: p }, { data: t }] = await Promise.all([
      supabase.from("tenant_payments").select("*").order("paid_at", { ascending: false }).limit(500),
      supabase.from("tenants").select("id,name"),
    ]);
    setPayments(p || []);
    setTenants(Object.fromEntries((t || []).map((x) => [x.id, x.name])));
    setLoading(false);
  }, []);
  useEffect(() => { load(); }, [load]);

  const visible = useMemo(() => payments.filter((p) => !tenantFilter || p.tenant_id === tenantFilter), [payments, tenantFilter]);
  const monthKey = new Date().toISOString().slice(0, 7);
  const thisMonth = visible.filter((p) => String(p.paid_at).startsWith(monthKey)).reduce((s, p) => s + Number(p.amount), 0);
  const total = visible.reduce((s, p) => s + Number(p.amount), 0);

  return (
    <Box p={{ base: 4, md: 8 }} maxW="1100px" mx="auto">
      <Box h="4px" borderRadius="full" bgGradient="linear(to-r, #00A88E, #2DD4BF, #00A88E)" mb={6} />
      <Flex justify="space-between" align="center" mb={5} gap={3} wrap="wrap">
        <Box><Heading size="lg">Pagos</Heading><Text color={muted} fontSize="sm">Lo que has cobrado a cada óptica. Para registrar uno nuevo, usa el botón en Inicio.</Text></Box>
        <Select maxW="240px" size="sm" borderRadius="full" placeholder="Todas las ópticas" value={tenantFilter} onChange={(e) => (e.target.value ? setParams({ tenant: e.target.value }) : setParams({}))}>
          {Object.entries(tenants).map(([id, n]) => <option key={id} value={id}>{n}</option>)}
        </Select>
      </Flex>
      <SimpleGrid columns={2} spacing={4} mb={5}>
        <Box bg={cardBg} border="1px solid" borderColor={border} borderRadius="20px" p={4}><Text fontSize="xs" color={muted}>Cobrado este mes</Text><Text fontSize="2xl" fontWeight="extrabold" color={ACCENT}>{money(thisMonth)}</Text></Box>
        <Box bg={cardBg} border="1px solid" borderColor={border} borderRadius="20px" p={4}><Text fontSize="xs" color={muted}>Total histórico</Text><Text fontSize="2xl" fontWeight="extrabold">{money(total)}</Text></Box>
      </SimpleGrid>
      <Box bg={cardBg} border="1px solid" borderColor={border} borderRadius="24px" overflowX="auto">
        {loading ? <Skeleton h="160px" /> : (
          <Table size="sm">
            <Thead><Tr><Th>Fecha</Th><Th>Óptica</Th><Th>Periodo</Th><Th>Método</Th><Th isNumeric>Monto</Th><Th>Registró</Th></Tr></Thead>
            <Tbody>
              {visible.length === 0 ? <Tr><Td colSpan={6} textAlign="center" py={8} color={muted}>Aún no hay pagos registrados.</Td></Tr> : visible.map((p) => (
                <Tr key={p.id}>
                  <Td>{new Date(`${p.paid_at}T12:00:00`).toLocaleDateString("es-EC")}</Td>
                  <Td>{tenants[p.tenant_id] || "—"}</Td>
                  <Td>{p.period_label || "—"}</Td>
                  <Td textTransform="capitalize">{p.method || "—"}</Td>
                  <Td isNumeric fontWeight="bold">{money(p.amount)}</Td>
                  <Td>{p.registered_by || "—"}</Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        )}
      </Box>
    </Box>
  );
};

export default TenantPayments;
