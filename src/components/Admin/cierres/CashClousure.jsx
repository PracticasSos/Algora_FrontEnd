import { useEffect, useState, useCallback } from "react";
import { supabase } from "../../../api/supabase";
import {
  Box, Container, Heading, Text, Flex, HStack, VStack, Icon, Badge, Select,
  SimpleGrid, useColorModeValue, Spinner, Input, FormControl, FormLabel,
} from "@chakra-ui/react";
import {
  DollarSign, Banknote, ArrowLeftRight, CreditCard, TrendingDown, Scale, CheckCircle2, AlertTriangle,
} from "lucide-react";
import SmartHeader from "../../header/SmartHeader";

const ACCENT = "#00A88E";
const METHODS = [
  { key: "efectivo", label: "Efectivo", icon: Banknote, color: "#00A88E" },
  { key: "transferencia", label: "Transferencia", icon: ArrowLeftRight, color: "#2B6CB0" },
  { key: "datafast", label: "Datafast", icon: CreditCard, color: "#805AD5" },
];
const MONTHS = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

const todayStr = () => new Date().toLocaleDateString("en-CA");

const formatMoney = (value) => {
  const n = parseFloat(value);
  if (isNaN(n)) return "$0.00";
  return `$${n.toLocaleString("es-EC", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const emptyMethods = () => ({ efectivo: 0, transferencia: 0, datafast: 0 });

const getMonthRange = (monthName) => {
  const idx = MONTHS.indexOf(monthName);
  if (idx === -1) return { since: "", till: "" };
  const year = new Date().getFullYear();
  const mm = String(idx + 1).padStart(2, "0");
  const lastDay = new Date(year, idx + 1, 0).getDate();
  return { since: `${year}-${mm}-01`, till: `${year}-${mm}-${lastDay}` };
};

const CashClousure = () => {
  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState("");
  const [since, setSince] = useState(todayStr());
  const [till, setTill] = useState(todayStr());
  const [month, setMonth] = useState("");
  const [loading, setLoading] = useState(false);

  const [sales, setSales] = useState([]);
  const [abonos, setAbonos] = useState([]);
  const [egresos, setEgresos] = useState([]);
  const [settlements, setSettlements] = useState([]);

  useEffect(() => {
    fetchBranches();
  }, []);

  useEffect(() => {
    if (selectedBranch && since && till) fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedBranch, since, till]);

  const fetchBranches = async () => {
    const { data, error } = await supabase.from("branchs").select("id, name");
    if (!error) {
      setBranches(data || []);
      if (data && data.length > 0) setSelectedBranch(data[0].id);
    }
  };

  const handleMonthChange = (value) => {
    setMonth(value);
    const range = getMonthRange(value);
    setSince(range.since);
    setTill(range.till);
  };

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [salesRes, abonosRes, egresosRes, settlementsRes] = await Promise.all([
        supabase
          .from("sales")
          .select("id, total, payment_in, is_refund, date")
          .eq("branchs_id", selectedBranch)
          .gte("date", since)
          .lte("date", till),
        supabase
          .from("abono_payments")
          .select("id, amount, payment_method, paid_at, sales!inner(branchs_id)")
          .eq("sales.branchs_id", selectedBranch)
          .gte("paid_at", `${since}T00:00:00`)
          .lte("paid_at", `${till}T23:59:59`),
        supabase
          .from("egresos")
          .select("id, value, payment_in, date")
          .eq("branchs_id", selectedBranch)
          .gte("date", since)
          .lte("date", till),
        supabase
          .from("datafast_settlements")
          .select("*")
          .eq("branchs_id", selectedBranch)
          .gte("settlement_date", since)
          .lte("settlement_date", till),
      ]);

      setSales(salesRes.data || []);
      setAbonos(abonosRes.data || []);
      setEgresos(egresosRes.data || []);
      setSettlements(settlementsRes.data || []);
    } catch (err) {
      console.error("Error cargando el consultar cierre:", err);
    } finally {
      setLoading(false);
    }
  }, [selectedBranch, since, till]);

  const ingresosPorMetodo = emptyMethods();
  sales.filter((s) => !s.is_refund).forEach((s) => {
    const method = (s.payment_in || "").toLowerCase();
    if (method in ingresosPorMetodo) ingresosPorMetodo[method] += Number(s.total) || 0;
  });

  const abonosPorMetodo = emptyMethods();
  abonos.forEach((a) => {
    const method = (a.payment_method || "").toLowerCase();
    if (method in abonosPorMetodo) abonosPorMetodo[method] += Number(a.amount) || 0;
  });

  const egresosPorMetodo = emptyMethods();
  egresos.forEach((e) => {
    const method = (e.payment_in || "").toLowerCase();
    if (method in egresosPorMetodo) egresosPorMetodo[method] += Number(e.value) || 0;
  });

  const datafastGross = ingresosPorMetodo.datafast + abonosPorMetodo.datafast;
  // El valor real de Datafast en un rango es la suma de todas las
  // conciliaciones guardadas día por día — esto es lo que de verdad llegó
  // al banco, no lo que muestran las ventas en bruto.
  const datafastNetReconciled = settlements.reduce((sum, s) => sum + (Number(s.net_amount) || 0), 0);
  const daysWithSales = new Set(sales.filter((s) => (s.payment_in || "").toLowerCase() === "datafast").map((s) => s.date)).size;
  const daysReconciled = settlements.length;
  const fullyReconciled = daysWithSales > 0 && daysReconciled >= daysWithSales;
  const datafastNet = daysReconciled > 0 ? datafastNetReconciled : datafastGross;

  const balancePorMetodo = {
    efectivo: ingresosPorMetodo.efectivo + abonosPorMetodo.efectivo - egresosPorMetodo.efectivo,
    transferencia: ingresosPorMetodo.transferencia + abonosPorMetodo.transferencia - egresosPorMetodo.transferencia,
    datafast: datafastNet - egresosPorMetodo.datafast,
  };
  const balanceTotal = balancePorMetodo.efectivo + balancePorMetodo.transferencia + balancePorMetodo.datafast;

  const totalIngresos = ingresosPorMetodo.efectivo + ingresosPorMetodo.transferencia + ingresosPorMetodo.datafast;
  const totalAbonos = abonosPorMetodo.efectivo + abonosPorMetodo.transferencia + abonosPorMetodo.datafast;
  const totalEgresos = egresosPorMetodo.efectivo + egresosPorMetodo.transferencia + egresosPorMetodo.datafast;

  const cardBg = useColorModeValue("white", "gray.700");
  const inputBg = useColorModeValue("gray.50", "gray.700");
  const borderColor = useColorModeValue("gray.200", "gray.600");
  const subtitleColor = useColorModeValue("gray.500", "gray.400");
  const sectionIconBg = useColorModeValue("#E6FBF6", "rgba(0,168,142,0.15)");

  const SectionTitle = ({ icon, children }) => (
    <Flex align="center" gap={3} mb={4}>
      <Flex align="center" justify="center" boxSize="30px" borderRadius="10px" bg={sectionIconBg} color={ACCENT} flexShrink={0}>
        <Icon as={icon} boxSize="15px" />
      </Flex>
      <Text fontWeight="bold" fontSize="sm" letterSpacing="wide" textTransform="uppercase" color={ACCENT} whiteSpace="nowrap">
        {children}
      </Text>
      <Box flex="1" h="1px" bgGradient={`linear(to-r, ${sectionIconBg}, transparent)`} />
    </Flex>
  );

  const MethodCard = ({ method, ingresos, abonosVal, egresosVal, balance, isDatafast }) => (
    <Box p={4} borderRadius="14px" bg={inputBg} border={`1px solid ${borderColor}`}>
      <HStack spacing={2} mb={2}>
        <Icon as={method.icon} boxSize="16px" color={method.color} />
        <Text fontWeight="bold" fontSize="sm">{method.label}</Text>
      </HStack>
      <VStack align="stretch" spacing={1} fontSize="xs" color={subtitleColor} mb={2}>
        <Flex justify="space-between"><Text>Ventas</Text><Text fontWeight="medium">{formatMoney(ingresos)}</Text></Flex>
        <Flex justify="space-between"><Text>Abonos</Text><Text fontWeight="medium">{formatMoney(abonosVal)}</Text></Flex>
        <Flex justify="space-between"><Text>Egresos</Text><Text fontWeight="medium" color="red.400">-{formatMoney(egresosVal)}</Text></Flex>
        {isDatafast && (
          <Flex justify="space-between"><Text>Comisión banco</Text><Text fontWeight="medium" color="orange.400">-{formatMoney(datafastGross - datafastNet)}</Text></Flex>
        )}
      </VStack>
      <Box pt={2} borderTop={`1px solid ${borderColor}`}>
        <Text fontSize="xs" color={subtitleColor}>Balance</Text>
        <Text fontWeight="800" fontSize="lg" color={method.color}>{formatMoney(balance)}</Text>
      </Box>
    </Box>
  );

  return (
    <Box minHeight="100vh" bgGradient={useColorModeValue("linear(to-br, gray.50, teal.50)", "linear(to-br, gray.900, #0d1f1c)")}>
      <SmartHeader moduleSpecificButton={null} />

      <Container maxW="1150px" py={8} px={{ base: 3, md: 6 }}>
        <Box
          borderRadius="24px"
          bg={cardBg}
          border={`1px solid ${borderColor}`}
          boxShadow={useColorModeValue("0 20px 45px -20px rgba(0,168,142,0.25)", "0 20px 45px -20px rgba(0,168,142,0.35)")}
          overflow="hidden"
        >
          <Box h="5px" bgGradient="linear(to-r, #00A88E, #2DD4BF, #00A88E)" />
          <Box p={{ base: 5, md: 8 }}>
            <HStack spacing={3} mb={6}>
              <Flex align="center" justify="center" boxSize="44px" borderRadius="14px" bgGradient="linear(to-br, #00A88E, #00786A)" color="white" boxShadow="0 6px 16px -4px rgba(0,168,142,0.5)">
                <Icon as={Scale} boxSize="20px" />
              </Flex>
              <VStack align="start" spacing={0}>
                <Heading size="lg" fontWeight="800" color={useColorModeValue("gray.800", "white")} letterSpacing="tight">
                  Consultar Cierre
                </Heading>
                <Text fontSize="xs" color={subtitleColor}>Revisa el balance de cualquier rango de fechas</Text>
              </VStack>
            </HStack>

            <SimpleGrid columns={{ base: 1, md: 4 }} spacing={4} mb={6}>
              <FormControl>
                <FormLabel fontSize="xs" color={subtitleColor}>Sucursal</FormLabel>
                <Select
                  placeholder="Seleccione"
                  value={selectedBranch}
                  onChange={(e) => setSelectedBranch(e.target.value)}
                  borderRadius="10px"
                  bg={inputBg}
                  borderColor={borderColor}
                  _focus={{ borderColor: ACCENT, boxShadow: `0 0 0 1px ${ACCENT}` }}
                >
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </Select>
              </FormControl>
              <FormControl>
                <FormLabel fontSize="xs" color={subtitleColor}>Desde</FormLabel>
                <Input type="date" value={since} onChange={(e) => { setSince(e.target.value); setMonth(""); }} borderRadius="10px" bg={inputBg} borderColor={borderColor} _focus={{ borderColor: ACCENT, boxShadow: `0 0 0 1px ${ACCENT}` }} />
              </FormControl>
              <FormControl>
                <FormLabel fontSize="xs" color={subtitleColor}>Hasta</FormLabel>
                <Input type="date" value={till} onChange={(e) => { setTill(e.target.value); setMonth(""); }} borderRadius="10px" bg={inputBg} borderColor={borderColor} _focus={{ borderColor: ACCENT, boxShadow: `0 0 0 1px ${ACCENT}` }} />
              </FormControl>
              <FormControl>
                <FormLabel fontSize="xs" color={subtitleColor}>O elige un mes</FormLabel>
                <Select
                  placeholder="Mes completo"
                  value={month}
                  onChange={(e) => handleMonthChange(e.target.value)}
                  borderRadius="10px"
                  bg={inputBg}
                  borderColor={borderColor}
                  _focus={{ borderColor: ACCENT, boxShadow: `0 0 0 1px ${ACCENT}` }}
                >
                  {MONTHS.map((m) => <option key={m} value={m}>{m}</option>)}
                </Select>
              </FormControl>
            </SimpleGrid>

            {!selectedBranch ? (
              <Text textAlign="center" color={subtitleColor} py={12}>
                Selecciona una sucursal y un rango de fechas para ver el cierre.
              </Text>
            ) : loading ? (
              <Flex justify="center" py={16}><Spinner color={ACCENT} /></Flex>
            ) : (
              <>
                {daysWithSales > 0 && !fullyReconciled && (
                  <HStack p={3} borderRadius="10px" bg="orange.50" border="1px solid" borderColor="orange.200" mb={6}>
                    <Icon as={AlertTriangle} color="orange.500" boxSize="16px" />
                    <Text fontSize="xs" color="orange.700">
                      {daysReconciled} de {daysWithSales} día(s) con Datafast ya están conciliados. Los días sin conciliar muestran el monto en bruto (sin descontar comisión) — ve a Cierre Diario de ese día para registrar el monto real.
                    </Text>
                  </HStack>
                )}
                {daysWithSales > 0 && fullyReconciled && (
                  <HStack p={3} borderRadius="10px" bg={sectionIconBg} mb={6}>
                    <Icon as={CheckCircle2} color={ACCENT} boxSize="16px" />
                    <Text fontSize="xs" color={subtitleColor}>Todos los días con Datafast en este rango ya están conciliados — los valores mostrados son los reales.</Text>
                  </HStack>
                )}

                <SimpleGrid columns={{ base: 2, md: 4 }} spacing={4} mb={6}>
                  <Box p={4} borderRadius="14px" bg={inputBg} border={`1px solid ${borderColor}`}>
                    <Text fontSize="xs" color={subtitleColor} textTransform="uppercase" mb={1}>Ventas</Text>
                    <Text fontWeight="800" fontSize="xl" color={ACCENT}>{formatMoney(totalIngresos)}</Text>
                  </Box>
                  <Box p={4} borderRadius="14px" bg={inputBg} border={`1px solid ${borderColor}`}>
                    <Text fontSize="xs" color={subtitleColor} textTransform="uppercase" mb={1}>Abonos</Text>
                    <Text fontWeight="800" fontSize="xl">{formatMoney(totalAbonos)}</Text>
                  </Box>
                  <Box p={4} borderRadius="14px" bg={inputBg} border={`1px solid ${borderColor}`}>
                    <Text fontSize="xs" color={subtitleColor} textTransform="uppercase" mb={1}>Egresos</Text>
                    <Text fontWeight="800" fontSize="xl" color="red.400">{formatMoney(totalEgresos)}</Text>
                  </Box>
                  <Box p={4} borderRadius="14px" bgGradient="linear(to-br, #00A88E, #00786A)" color="white">
                    <Text fontSize="xs" textTransform="uppercase" mb={1} opacity={0.9}>Balance real</Text>
                    <Text fontWeight="800" fontSize="xl">{formatMoney(balanceTotal)}</Text>
                  </Box>
                </SimpleGrid>

                <SectionTitle icon={DollarSign}>Por método de pago</SectionTitle>
                <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
                  <MethodCard method={METHODS[0]} ingresos={ingresosPorMetodo.efectivo} abonosVal={abonosPorMetodo.efectivo} egresosVal={egresosPorMetodo.efectivo} balance={balancePorMetodo.efectivo} />
                  <MethodCard method={METHODS[1]} ingresos={ingresosPorMetodo.transferencia} abonosVal={abonosPorMetodo.transferencia} egresosVal={egresosPorMetodo.transferencia} balance={balancePorMetodo.transferencia} />
                  <MethodCard method={METHODS[2]} ingresos={ingresosPorMetodo.datafast} abonosVal={abonosPorMetodo.datafast} egresosVal={egresosPorMetodo.datafast} balance={balancePorMetodo.datafast} isDatafast />
                </SimpleGrid>
              </>
            )}
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

export default CashClousure;
