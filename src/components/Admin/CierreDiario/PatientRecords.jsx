import { useEffect, useState, useCallback } from "react";
import { supabase } from "../../../api/supabase";
import {
  Box, Container, Heading, Text, Flex, HStack, VStack, Icon, Badge, Select,
  SimpleGrid, useColorModeValue, Spinner, Input, Button, useToast, Table,
  Thead, Tbody, Tr, Th, Td,
} from "@chakra-ui/react";
import {
  DollarSign, Banknote, ArrowLeftRight, CreditCard, TrendingDown,
  Scale, CheckCircle2,
} from "lucide-react";
import SmartHeader from "../../header/SmartHeader";

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
  const [refunds, setRefunds] = useState([]);
  const [settlement, setSettlement] = useState(null); // conciliación de datafast ya guardada, si existe

  const toast = useToast();
  const today = todayStr();
  // Los límites del día se calculan en hora LOCAL y se convierten a UTC de
  // verdad (no se manda el texto crudo) — así una venta de la noche no se
  // "escapa" al día siguiente al comparar contra la hora del servidor.
  const dayStartUTC = new Date(`${today}T00:00:00`).toISOString();
  const dayEndUTC = new Date(`${today}T23:59:59.999`).toISOString();

  useEffect(() => {
    fetchBranches();
  }, []);

  useEffect(() => {
    if (selectedBranch) fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedBranch]);

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
      const [salesRes, abonosRes, egresosRes, settlementRes, refundsRes] = await Promise.all([
        supabase
          .from("sales")
          .select("id, total, balance, credit, payment_in, is_refund, patients(pt_firstname, pt_lastname)")
          .eq("branchs_id", selectedBranch)
          .eq("date", today),
        supabase
          .from("abono_payments")
          .select("id, sale_id, amount, payment_method, paid_at, sales!inner(branchs_id, patients(pt_firstname, pt_lastname))")
          .eq("sales.branchs_id", selectedBranch)
          .gte("paid_at", dayStartUTC)
          .lte("paid_at", dayEndUTC),
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
        supabase
          .from("refunds")
          .select("id, refund_amount, payment_method, refund_date, sales!inner(branchs_id, patients(pt_firstname, pt_lastname))")
          .eq("sales.branchs_id", selectedBranch)
          .gte("refund_date", dayStartUTC)
          .lte("refund_date", dayEndUTC),
      ]);

      setSales(salesRes.data || []);
      setAbonos(abonosRes.data || []);
      setEgresos(egresosRes.data || []);
      setSettlement(settlementRes.data || null);
      setRefunds(refundsRes.data || []);
    } catch (err) {
      console.error("Error cargando el cierre diario:", err);
      toast({ title: "Error", description: "No se pudo cargar el cierre del día.", status: "error", duration: 4000, isClosable: true });
    } finally {
      setLoading(false);
    }
  }, [selectedBranch, today, toast]);

  // --- Totales por método ---
  // El "ingreso" del día es el dinero REAL que entró en cada venta de hoy
  // (su abono inicial: sale.balance), no el total supuesto de la venta.
  // Una venta de $135 sin abono no deja nada en caja hoy — solo cuenta lo
  // que efectivamente se cobró.
  // "Ventas del día" ahora es solo informativo (cuántas se hicieron, y por
  // cuánto en total) — el DINERO real cobrado, sea al momento de vender o
  // después en un retiro/abono, viene únicamente de abono_payments más
  // abajo. Así nunca se cuenta dos veces ni con el método equivocado.
  let ventasCount = 0;
  let ventasTotalSinCobrar = 0;
  sales.filter((s) => !s.is_refund).forEach((s) => {
    ventasCount += 1;
    ventasTotalSinCobrar += Number(s.total) || 0;
  });

  const abonosPorMetodo = emptyMethods();
  abonos.forEach((a) => {
    const method = (a.payment_method || "").toLowerCase();
    if (method in abonosPorMetodo) abonosPorMetodo[method] += Number(a.amount) || 0;
  });

  // Abonos agrupados por venta, en orden cronológico — el primero de cada
  // grupo es el que se dio AL MOMENTO de vender (se registra apenas se
  // crea la venta); los que vienen después son abonos/retiros
  // posteriores, que solo se muestran en la tabla de Abonos de abajo,
  // para no repetir el mismo dinero en dos lugares.
  const abonosPorVenta = {};
  abonos.forEach((a) => {
    if (!a.sale_id) return;
    if (!abonosPorVenta[a.sale_id]) abonosPorVenta[a.sale_id] = [];
    abonosPorVenta[a.sale_id].push(a);
  });
  Object.values(abonosPorVenta).forEach((list) => list.sort((a, b) => new Date(a.paid_at) - new Date(b.paid_at)));

  // IDs de los abonos "iniciales" (el primero de cada venta) — se usan
  // para no repetirlos en la tabla de Abonos, ya que esos se muestran en
  // Ventas del día.
  const initialAbonoIds = new Set(
    Object.values(abonosPorVenta).map((list) => list[0]?.id).filter(Boolean)
  );

  const egresosPorMetodo = emptyMethods();
  egresos.forEach((e) => {
    const method = (e.payment_in || "").toLowerCase();
    if (method in egresosPorMetodo) egresosPorMetodo[method] += Number(e.value) || 0;
  });

  // Un reembolso es dinero que sale de la caja, igual que un egreso — se
  // resta del método por el que se devolvió.
  const refundsPorMetodo = emptyMethods();
  refunds.forEach((r) => {
    const method = (r.payment_method || "").toLowerCase();
    if (method in refundsPorMetodo) refundsPorMetodo[method] += Number(r.refund_amount) || 0;
  });

  const datafastGross = abonosPorMetodo.datafast;
  const datafastNet = settlement ? Number(settlement.net_amount) : datafastGross;
  const datafastFee = settlement ? datafastGross - datafastNet : 0;

  const balancePorMetodo = {
    efectivo: abonosPorMetodo.efectivo - egresosPorMetodo.efectivo - refundsPorMetodo.efectivo,
    transferencia: abonosPorMetodo.transferencia - egresosPorMetodo.transferencia - refundsPorMetodo.transferencia,
    datafast: datafastNet - egresosPorMetodo.datafast - refundsPorMetodo.datafast,
  };
  const balanceTotal = balancePorMetodo.efectivo + balancePorMetodo.transferencia + balancePorMetodo.datafast;
  const totalRefunds = refundsPorMetodo.efectivo + refundsPorMetodo.transferencia + refundsPorMetodo.datafast;

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

  const MethodCard = ({ method, abonosVal, egresosVal, refundsVal, balance, isDatafast }) => (
    <Box p={4} borderRadius="14px" bg={inputBg} border={`1px solid ${borderColor}`}>
      <HStack spacing={2} mb={2}>
        <Icon as={method.icon} boxSize="16px" color={method.color} />
        <Text fontWeight="bold" fontSize="sm">{method.label}</Text>
      </HStack>
      <VStack align="stretch" spacing={1} fontSize="xs" color={subtitleColor} mb={2}>
        <Flex justify="space-between"><Text>Cobrado (venta + abonos)</Text><Text fontWeight="medium">{formatMoney(abonosVal)}</Text></Flex>
        <Flex justify="space-between"><Text>Egresos</Text><Text fontWeight="medium" color="red.400">-{formatMoney(egresosVal)}</Text></Flex>
        {refundsVal > 0 && (
          <Flex justify="space-between"><Text>Reembolsos</Text><Text fontWeight="medium" color="red.400">-{formatMoney(refundsVal)}</Text></Flex>
        )}
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
                <SimpleGrid columns={{ base: 2, md: totalRefunds > 0 ? 5 : 4 }} spacing={4} mb={6}>
                  <Box p={4} borderRadius="14px" bg={inputBg} border={`1px solid ${borderColor}`}>
                    <Text fontSize="xs" color={subtitleColor} textTransform="uppercase" mb={1}>Ventas realizadas</Text>
                    <Text fontWeight="800" fontSize="xl">{ventasCount}</Text>
                    <Text fontSize="10px" color={subtitleColor} mt={1}>{formatMoney(ventasTotalSinCobrar)} en total</Text>
                  </Box>
                  <Box p={4} borderRadius="14px" bg={inputBg} border={`1px solid ${borderColor}`}>
                    <Text fontSize="xs" color={subtitleColor} textTransform="uppercase" mb={1}>Dinero cobrado hoy</Text>
                    <Text fontWeight="800" fontSize="xl" color={ACCENT}>{formatMoney(totalAbonos)}</Text>
                    <Text fontSize="10px" color={subtitleColor} mt={1}>al vender + retiros + abonos</Text>
                  </Box>
                  <Box p={4} borderRadius="14px" bg={inputBg} border={`1px solid ${borderColor}`}>
                    <Text fontSize="xs" color={subtitleColor} textTransform="uppercase" mb={1}>Egresos de hoy</Text>
                    <Text fontWeight="800" fontSize="xl" color="red.400">{formatMoney(totalEgresos)}</Text>
                  </Box>
                  {totalRefunds > 0 && (
                    <Box p={4} borderRadius="14px" bg={inputBg} border={`1px solid ${borderColor}`}>
                      <Text fontSize="xs" color={subtitleColor} textTransform="uppercase" mb={1}>Reembolsos</Text>
                      <Text fontWeight="800" fontSize="xl" color="red.400">{formatMoney(totalRefunds)}</Text>
                    </Box>
                  )}
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
                    abonosVal={abonosPorMetodo.efectivo}
                    egresosVal={egresosPorMetodo.efectivo}
                    refundsVal={refundsPorMetodo.efectivo}
                    balance={balancePorMetodo.efectivo}
                  />
                  <MethodCard
                    method={METHODS[1]}
                    abonosVal={abonosPorMetodo.transferencia}
                    egresosVal={egresosPorMetodo.transferencia}
                    refundsVal={refundsPorMetodo.transferencia}
                    balance={balancePorMetodo.transferencia}
                  />
                  <MethodCard
                    method={METHODS[2]}
                    abonosVal={abonosPorMetodo.datafast}
                    egresosVal={egresosPorMetodo.datafast}
                    refundsVal={refundsPorMetodo.datafast}
                    balance={balancePorMetodo.datafast}
                    isDatafast
                  />
                </SimpleGrid>

                {/* Estado de Datafast — la conciliación real puede tardar días o meses,
                    así que aquí solo se informa el estado; el registro del monto
                    real se hace en su propia pantalla, sin apuro de "hoy mismo". */}
                {datafastGross > 0 && (
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

                {/* Desglose de ventas del día */}
                {sales.filter((s) => !s.is_refund).length > 0 && (
                  <>
                    <SectionTitle icon={DollarSign}>Ventas del día</SectionTitle>
                    <Box overflowX="auto" borderRadius="14px" border={`1px solid ${borderColor}`} mb={8}>
                      <Table variant="simple" size="sm">
                        <Thead>
                          <Tr>
                            <Th color={subtitleColor}>Paciente</Th>
                            <Th color={subtitleColor} textAlign="right">Total venta</Th>
                            <Th color={subtitleColor}>Método</Th>
                            <Th color={subtitleColor} textAlign="right">Abono al vender</Th>
                          </Tr>
                        </Thead>
                        <Tbody>
                          {sales.filter((s) => !s.is_refund).map((s) => {
                            // Solo el PRIMER abono de la venta (el que se
                            // dio al momento de vender) — lo que se pague
                            // después ya se ve solo en Abonos de abajo.
                            const initialPayment = (abonosPorVenta[s.id] || [])[0];
                            return (
                              <Tr key={s.id}>
                                <Td>{s.patients?.pt_firstname} {s.patients?.pt_lastname}</Td>
                                <Td textAlign="right" color={subtitleColor}>{formatMoney(s.total)}</Td>
                                <Td>
                                  {initialPayment ? (
                                    <Badge colorScheme={initialPayment.payment_method === "efectivo" ? "teal" : initialPayment.payment_method === "transferencia" ? "blue" : "purple"} borderRadius="full" px={2} textTransform="capitalize">
                                      {initialPayment.payment_method}
                                    </Badge>
                                  ) : (
                                    <Text fontSize="xs" color={subtitleColor}>—</Text>
                                  )}
                                </Td>
                                <Td textAlign="right" fontWeight="semibold" color={ACCENT}>
                                  {initialPayment ? formatMoney(initialPayment.amount) : formatMoney(0)}
                                </Td>
                              </Tr>
                            );
                          })}
                        </Tbody>
                      </Table>
                      <Text fontSize="10px" color={subtitleColor} p={2}>
                        "Abono al vender" es solo lo que se dio en el momento de la venta. Cualquier pago posterior (retiro, abono aparte) se ve únicamente en "Abonos del día" de abajo, para no repetir el mismo dinero dos veces.
                      </Text>
                    </Box>
                  </>
                )}

                {/* Desglose de abonos del día — solo los posteriores a la
                    venta (el abono inicial ya se ve arriba, en Ventas). */}
                {abonos.filter((a) => !initialAbonoIds.has(a.id)).length > 0 && (
                  <>
                    <SectionTitle icon={Banknote}>Abonos del día</SectionTitle>
                    <Box overflowX="auto" borderRadius="14px" border={`1px solid ${borderColor}`} mb={8}>
                      <Table variant="simple" size="sm">
                        <Thead>
                          <Tr>
                            <Th color={subtitleColor}>Hora</Th>
                            <Th color={subtitleColor}>Paciente</Th>
                            <Th color={subtitleColor}>Método</Th>
                            <Th color={subtitleColor} textAlign="right">Monto</Th>
                          </Tr>
                        </Thead>
                        <Tbody>
                          {abonos.filter((a) => !initialAbonoIds.has(a.id)).map((a) => (
                            <Tr key={a.id}>
                              <Td>{new Date(a.paid_at).toLocaleTimeString("es-EC", { hour: "2-digit", minute: "2-digit" })}</Td>
                              <Td>{a.sales?.patients?.pt_firstname} {a.sales?.patients?.pt_lastname}</Td>
                              <Td>
                                <Badge colorScheme={a.payment_method === "efectivo" ? "teal" : a.payment_method === "transferencia" ? "blue" : "purple"} borderRadius="full" px={2} textTransform="capitalize">
                                  {a.payment_method}
                                </Badge>
                              </Td>
                              <Td textAlign="right" fontWeight="semibold" color={ACCENT}>{formatMoney(a.amount)}</Td>
                            </Tr>
                          ))}
                        </Tbody>
                      </Table>
                      <Text fontSize="10px" color={subtitleColor} p={2}>
                        El total de "Dinero cobrado hoy" arriba sí suma todo — este abono inicial de cada venta, más estos pagos posteriores.
                      </Text>
                    </Box>
                  </>
                )}

                {/* Desglose de reembolsos del día */}
                {refunds.length > 0 && (
                  <>
                    <SectionTitle icon={TrendingDown}>Reembolsos del día</SectionTitle>
                    <Box overflowX="auto" borderRadius="14px" border={`1px solid ${borderColor}`} mb={8}>
                      <Table variant="simple" size="sm">
                        <Thead>
                          <Tr>
                            <Th color={subtitleColor}>Hora</Th>
                            <Th color={subtitleColor}>Paciente</Th>
                            <Th color={subtitleColor}>Método</Th>
                            <Th color={subtitleColor} textAlign="right">Monto</Th>
                          </Tr>
                        </Thead>
                        <Tbody>
                          {refunds.map((r) => (
                            <Tr key={r.id}>
                              <Td>{new Date(r.refund_date).toLocaleTimeString("es-EC", { hour: "2-digit", minute: "2-digit" })}</Td>
                              <Td>{r.sales?.patients?.pt_firstname} {r.sales?.patients?.pt_lastname}</Td>
                              <Td>
                                <Badge colorScheme={r.payment_method === "efectivo" ? "teal" : r.payment_method === "transferencia" ? "blue" : "purple"} borderRadius="full" px={2} textTransform="capitalize">
                                  {r.payment_method}
                                </Badge>
                              </Td>
                              <Td textAlign="right" fontWeight="semibold" color="red.400">-{formatMoney(r.refund_amount)}</Td>
                            </Tr>
                          ))}
                        </Tbody>
                      </Table>
                    </Box>
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
