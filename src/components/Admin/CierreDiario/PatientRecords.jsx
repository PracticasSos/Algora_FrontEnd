import { useEffect, useState, useCallback } from "react";
import { supabase } from "../../../api/supabase";
import {
  Box, Container, Heading, Text, Flex, HStack, VStack, Icon, Badge, Select,
  SimpleGrid, useColorModeValue, Spinner, Input, Button, useToast, Table,
  Thead, Tbody, Tr, Th, Td,
} from "@chakra-ui/react";
import {
  DollarSign, Banknote, ArrowLeftRight, CreditCard, TrendingDown,
  Scale, CheckCircle2, List, ChevronLeft, ChevronRight,
} from "lucide-react";
import SmartHeader from "../../header/SmartHeader";

const PAGE_SIZE = 10;
const ACCENT = "#00A88E";
const METHODS = [
  { key: "efectivo", label: "Efectivo", icon: Banknote, color: "#00A88E" },
  { key: "transferencia", label: "Transferencia", icon: ArrowLeftRight, color: "#2B6CB0" },
  { key: "datafast", label: "Datafast", icon: CreditCard, color: "#805AD5" },
];

const todayStr = () => new Date().toLocaleDateString("en-CA"); // YYYY-MM-DD en hora local

const formatMoney = (value) => {
  const n = parseFloat(value);
  if (isNaN(n)) return "$0.00";
  return `$${n.toLocaleString("es-EC", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const emptyMethods = () => ({ efectivo: 0, transferencia: 0, datafast: 0 });

const PatientRecords = () => {
  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState("");
  const [loading, setLoading] = useState(false);

  const [sales, setSales] = useState([]);
  const [abonos, setAbonos] = useState([]);
  const [egresos, setEgresos] = useState([]);
  const [settlement, setSettlement] = useState(null); // conciliación de datafast ya guardada, si existe

  // --- Detalle de ventas de hoy (paginado, independiente del resumen) ---
  const [detailRecords, setDetailRecords] = useState([]);
  const [detailPage, setDetailPage] = useState(1);
  const [detailCount, setDetailCount] = useState(0);
  const [detailLoading, setDetailLoading] = useState(false);

  const toast = useToast();
  const today = todayStr();

  useEffect(() => {
    fetchBranches();
  }, []);

  useEffect(() => {
    if (selectedBranch) fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedBranch]);

  useEffect(() => {
    setDetailPage(1);
  }, [selectedBranch]);

  useEffect(() => {
    const fetchDetailPage = async () => {
      if (!selectedBranch) return;
      setDetailLoading(true);
      const from = (detailPage - 1) * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      const { data, count } = await supabase
        .from("sales")
        .select(`
          id, total, credit, balance, payment_in, is_refund,
          patients (pt_firstname, pt_lastname),
          inventario (brand),
          lens (lens_type)
        `, { count: "exact" })
        .eq("branchs_id", selectedBranch)
        .eq("date", today)
        .eq("is_refund", false)
        .order("id", { ascending: false })
        .range(from, to);

      setDetailRecords(data || []);
      setDetailCount(count || 0);
      setDetailLoading(false);
    };
    fetchDetailPage();
  }, [selectedBranch, today, detailPage]);

  const detailTotalPages = Math.max(1, Math.ceil(detailCount / PAGE_SIZE));

  const fetchBranches = async () => {
    const { data, error } = await supabase.from("branchs").select("id, name");
    if (!error) {
      setBranches(data || []);
      // Se selecciona sola la primera sucursal, así ya aparece algo de
      // entrada sin tener que filtrar manualmente primero.
      if (data && data.length > 0) setSelectedBranch(data[0].id);
    }
  };

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [salesRes, abonosRes, egresosRes, settlementRes] = await Promise.all([
        supabase
          .from("sales")
          .select("id, total, payment_in, is_refund")
          .eq("branchs_id", selectedBranch)
          .eq("date", today),
        supabase
          .from("abono_payments")
          .select("id, amount, payment_method, paid_at, sales!inner(branchs_id)")
          .eq("sales.branchs_id", selectedBranch)
          .gte("paid_at", `${today}T00:00:00`)
          .lte("paid_at", `${today}T23:59:59`),
        supabase
          .from("egresos")
          .select("id, value, payment_in, specification")
          .eq("branchs_id", selectedBranch)
          .eq("date", today),
        supabase
          .from("datafast_settlements")
          .select("*")
          .eq("branchs_id", selectedBranch)
          .eq("settlement_date", today)
          .maybeSingle(),
      ]);

      setSales(salesRes.data || []);
      setAbonos(abonosRes.data || []);
      setEgresos(egresosRes.data || []);
      setSettlement(settlementRes.data || null);
    } catch (err) {
      console.error("Error cargando el cierre diario:", err);
      toast({ title: "Error", description: "No se pudo cargar el cierre del día.", status: "error", duration: 4000, isClosable: true });
    } finally {
      setLoading(false);
    }
  }, [selectedBranch, today, toast]);

  // --- Totales por método ---
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
  const datafastNet = settlement ? Number(settlement.net_amount) : datafastGross;
  const datafastFee = settlement ? datafastGross - datafastNet : 0;

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
        {isDatafast && settlement && (
          <Flex justify="space-between"><Text>Comisión banco</Text><Text fontWeight="medium" color="orange.400">-{formatMoney(datafastFee)}</Text></Flex>
        )}
      </VStack>
      <Box pt={2} borderTop={`1px solid ${borderColor}`}>
        <Text fontSize="xs" color={subtitleColor}>{isDatafast && !settlement ? "Balance (sin conciliar)" : "Balance"}</Text>
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
                  Cierre Diario
                </Heading>
                <Text fontSize="xs" color={subtitleColor}>
                  {new Date().toLocaleDateString("es-EC", { weekday: "long", day: "2-digit", month: "long", year: "numeric" })}
                </Text>
              </VStack>
            </HStack>

            <Select
              placeholder="Seleccione una sucursal"
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              size="lg"
              maxW="320px"
              mb={6}
              borderRadius="12px"
              bg={inputBg}
              borderColor={borderColor}
              _focus={{ borderColor: ACCENT, boxShadow: `0 0 0 1px ${ACCENT}` }}
            >
              {branches.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </Select>

            {!selectedBranch ? (
              <Text textAlign="center" color={subtitleColor} py={12}>
                Selecciona una sucursal para ver el cierre de hoy.
              </Text>
            ) : loading ? (
              <Flex justify="center" py={16}><Spinner color={ACCENT} /></Flex>
            ) : (
              <>
                {/* Resumen general */}
                <SimpleGrid columns={{ base: 2, md: 4 }} spacing={4} mb={6}>
                  <Box p={4} borderRadius="14px" bg={inputBg} border={`1px solid ${borderColor}`}>
                    <Text fontSize="xs" color={subtitleColor} textTransform="uppercase" mb={1}>Ventas de hoy</Text>
                    <Text fontWeight="800" fontSize="xl" color={ACCENT}>{formatMoney(totalIngresos)}</Text>
                  </Box>
                  <Box p={4} borderRadius="14px" bg={inputBg} border={`1px solid ${borderColor}`}>
                    <Text fontSize="xs" color={subtitleColor} textTransform="uppercase" mb={1}>Abonos de hoy</Text>
                    <Text fontWeight="800" fontSize="xl">{formatMoney(totalAbonos)}</Text>
                  </Box>
                  <Box p={4} borderRadius="14px" bg={inputBg} border={`1px solid ${borderColor}`}>
                    <Text fontSize="xs" color={subtitleColor} textTransform="uppercase" mb={1}>Egresos de hoy</Text>
                    <Text fontWeight="800" fontSize="xl" color="red.400">{formatMoney(totalEgresos)}</Text>
                  </Box>
                  <Box p={4} borderRadius="14px" bgGradient="linear(to-br, #00A88E, #00786A)" color="white">
                    <Text fontSize="xs" textTransform="uppercase" mb={1} opacity={0.9}>Balance final del día</Text>
                    <Text fontWeight="800" fontSize="xl">{formatMoney(balanceTotal)}</Text>
                  </Box>
                </SimpleGrid>

                {/* Por método de pago */}
                <SectionTitle icon={DollarSign}>Por método de pago</SectionTitle>
                <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4} mb={8}>
                  <MethodCard
                    method={METHODS[0]}
                    ingresos={ingresosPorMetodo.efectivo}
                    abonosVal={abonosPorMetodo.efectivo}
                    egresosVal={egresosPorMetodo.efectivo}
                    balance={balancePorMetodo.efectivo}
                  />
                  <MethodCard
                    method={METHODS[1]}
                    ingresos={ingresosPorMetodo.transferencia}
                    abonosVal={abonosPorMetodo.transferencia}
                    egresosVal={egresosPorMetodo.transferencia}
                    balance={balancePorMetodo.transferencia}
                  />
                  <MethodCard
                    method={METHODS[2]}
                    ingresos={ingresosPorMetodo.datafast}
                    abonosVal={abonosPorMetodo.datafast}
                    egresosVal={egresosPorMetodo.datafast}
                    balance={balancePorMetodo.datafast}
                    isDatafast
                  />
                </SimpleGrid>

                <SectionTitle icon={List}>Detalle de ventas de hoy</SectionTitle>
                <Box overflowX="auto" borderRadius="14px" border={`1px solid ${borderColor}`} mb={3}>
                  <Table size="sm">
                    <Thead>
                      <Tr bg={inputBg}>
                        <Th color={subtitleColor}>Orden</Th>
                        <Th color={subtitleColor}>Paciente</Th>
                        <Th color={subtitleColor}>Armazón</Th>
                        <Th color={subtitleColor}>Luna</Th>
                        <Th color={subtitleColor} isNumeric>Total</Th>
                        <Th color={subtitleColor} isNumeric>Abono</Th>
                        <Th color={subtitleColor} isNumeric>Saldo</Th>
                        <Th color={subtitleColor}>Pago</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {detailLoading ? (
                        <Tr>
                          <Td colSpan={8} textAlign="center" py={8}><Spinner size="sm" color={ACCENT} /></Td>
                        </Tr>
                      ) : detailRecords.length === 0 ? (
                        <Tr>
                          <Td colSpan={8} textAlign="center" py={8} color={subtitleColor}>Todavía no hay ventas registradas hoy.</Td>
                        </Tr>
                      ) : (
                        detailRecords.map((r) => (
                          <Tr key={r.id}>
                            <Td>{r.id}</Td>
                            <Td>{r.patients?.pt_firstname || "Sin nombre"} {r.patients?.pt_lastname || ""}</Td>
                            <Td>{r.inventario?.brand || "—"}</Td>
                            <Td>{r.lens?.lens_type || "—"}</Td>
                            <Td isNumeric>{formatMoney(r.total)}</Td>
                            <Td isNumeric>{formatMoney(r.balance)}</Td>
                            <Td isNumeric>{formatMoney(r.credit)}</Td>
                            <Td>
                              <Badge colorScheme={r.payment_in === "efectivo" ? "green" : r.payment_in === "transferencia" ? "blue" : "purple"} fontSize="10px">
                                {r.payment_in}
                              </Badge>
                            </Td>
                          </Tr>
                        ))
                      )}
                    </Tbody>
                  </Table>
                </Box>

                {detailCount > 0 && (
                  <Flex justify="space-between" align="center" mb={8} flexWrap="wrap" gap={2}>
                    <Text fontSize="xs" color={subtitleColor}>
                      {detailCount} venta{detailCount !== 1 ? "s" : ""} hoy — página {detailPage} de {detailTotalPages}
                    </Text>
                    <HStack spacing={2}>
                      <Button
                        size="sm"
                        variant="outline"
                        borderRadius="10px"
                        leftIcon={<Icon as={ChevronLeft} boxSize="14px" />}
                        onClick={() => setDetailPage((p) => Math.max(1, p - 1))}
                        isDisabled={detailPage <= 1 || detailLoading}
                      >
                        Anterior
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        borderRadius="10px"
                        rightIcon={<Icon as={ChevronRight} boxSize="14px" />}
                        onClick={() => setDetailPage((p) => Math.min(detailTotalPages, p + 1))}
                        isDisabled={detailPage >= detailTotalPages || detailLoading}
                      >
                        Siguiente
                      </Button>
                    </HStack>
                  </Flex>
                )}

                {/* Estado de Datafast — la conciliación real puede tardar días o meses,
                    así que aquí solo se informa el estado; el registro del monto
                    real se hace en su propia pantalla, sin apuro de "hoy mismo". */}
                {ingresosPorMetodo.datafast + abonosPorMetodo.datafast > 0 && (
                  <>
                    <SectionTitle icon={CreditCard}>Estado de Datafast</SectionTitle>
                    <Flex
                      p={4}
                      borderRadius="14px"
                      bg={inputBg}
                      border={`1px solid ${borderColor}`}
                      mb={8}
                      justify="space-between"
                      align="center"
                      flexWrap="wrap"
                      gap={3}
                    >
                      <HStack spacing={3}>
                        {settlement ? (
                          <Badge colorScheme="teal" borderRadius="full" px={3} py={1}>
                            <HStack spacing={1}><Icon as={CheckCircle2} boxSize="12px" /><Text>Conciliado</Text></HStack>
                          </Badge>
                        ) : (
                          <Badge colorScheme="orange" borderRadius="full" px={3} py={1}>Pendiente de conciliar</Badge>
                        )}
                        <Text fontSize="xs" color={subtitleColor}>
                          {settlement
                            ? `Llegaron ${formatMoney(datafastNet)} de ${formatMoney(datafastGross)} en ventas.`
                            : `${formatMoney(datafastGross)} en ventas todavía sin confirmar cuánto llegó al banco.`}
                        </Text>
                      </HStack>
                      <Button
                        as="a"
                        href="/datafast-reconciliation"
                        size="sm"
                        variant="outline"
                        colorScheme="purple"
                        borderRadius="10px"
                      >
                        Ir a Conciliación de Datafast
                      </Button>
                    </Flex>
                  </>
                )}

                {/* Detalle de egresos del día */}
                {egresos.length > 0 && (
                  <>
                    <SectionTitle icon={TrendingDown}>Egresos del día</SectionTitle>
                    <Box overflowX="auto" borderRadius="14px" border={`1px solid ${borderColor}`}>
                      <Table variant="simple" size="sm">
                        <Thead>
                          <Tr>
                            <Th color={subtitleColor}>Especificación</Th>
                            <Th color={subtitleColor}>Método</Th>
                            <Th color={subtitleColor} textAlign="right">Valor</Th>
                          </Tr>
                        </Thead>
                        <Tbody>
                          {egresos.map((e) => (
                            <Tr key={e.id}>
                              <Td>{e.specification || "—"}</Td>
                              <Td>
                                <Badge colorScheme={e.payment_in === "efectivo" ? "teal" : e.payment_in === "transferencia" ? "blue" : "purple"} borderRadius="full" px={2} textTransform="capitalize">
                                  {e.payment_in}
                                </Badge>
                              </Td>
                              <Td textAlign="right" fontWeight="semibold">{formatMoney(e.value)}</Td>
                            </Tr>
                          ))}
                        </Tbody>
                      </Table>
                    </Box>
                  </>
                )}
              </>
            )}
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

export default PatientRecords;
