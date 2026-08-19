import { useEffect, useState, Fragment } from "react";
import { supabase } from "../../api/supabase";
import {
  Box, Container, Heading, Text, Flex, HStack, VStack, Icon, Badge, Select,
  useColorModeValue, Spinner, Input, Button, useToast, Table, Thead, Tbody, Tr, Th, Td,
  IconButton, Collapse,
} from "@chakra-ui/react";
import { CreditCard, Clock, CheckCircle2, ChevronDown, ChevronRight, ChevronLeft, User } from "lucide-react";
import SmartHeader from "../header/SmartHeader";

const ACCENT = "#00A88E";
const PAGE_SIZE = 8;

const formatMoney = (value) => {
  const n = parseFloat(value);
  if (isNaN(n)) return "$0.00";
  return `$${n.toLocaleString("es-EC", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const DatafastReconciliation = () => {
  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState("");
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState([]); // días con ventas datafast sin conciliar
  const [reconciled, setReconciled] = useState([]); // ya conciliados
  const [inputs, setInputs] = useState({}); // valores que se están escribiendo
  const [savingKey, setSavingKey] = useState(null);
  const [expandedKey, setExpandedKey] = useState(null); // qué fila muestra el detalle de ventas
  const [pendingPage, setPendingPage] = useState(1);
  const [reconciledPage, setReconciledPage] = useState(1);
  const toast = useToast();

  useEffect(() => {
    fetchBranches();
  }, []);

  useEffect(() => {
    fetchAll();
    setPendingPage(1);
    setReconciledPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedBranch]);

  const fetchBranches = async () => {
    const { data, error } = await supabase.from("branchs").select("id, name");
    if (!error) setBranches(data || []);
  };

  const fetchAll = async () => {
    setLoading(true);
    try {
      let salesQuery = supabase
        .from("sales")
        .select("id, date, total, branchs_id, branchs(name), patients(pt_firstname, pt_lastname)")
        .eq("payment_in", "datafast")
        .eq("is_refund", false);
      if (selectedBranch) salesQuery = salesQuery.eq("branchs_id", selectedBranch);

      let settlementsQuery = supabase.from("datafast_settlements").select("*");
      if (selectedBranch) settlementsQuery = settlementsQuery.eq("branchs_id", selectedBranch);

      const [salesRes, settlementsRes] = await Promise.all([salesQuery, settlementsQuery]);

      if (salesRes.error) throw salesRes.error;
      if (settlementsRes.error) throw settlementsRes.error;

      // Agrupar ventas datafast por sucursal + día, guardando también cada
      // venta individual (paciente y monto) para poder mostrar el detalle.
      const groups = {};
      (salesRes.data || []).forEach((s) => {
        const key = `${s.branchs_id}_${s.date}`;
        if (!groups[key]) {
          groups[key] = { branchs_id: s.branchs_id, branchName: s.branchs?.name || "—", date: s.date, gross: 0, count: 0, sales: [] };
        }
        groups[key].gross += Number(s.total) || 0;
        groups[key].count += 1;
        groups[key].sales.push({
          id: s.id,
          total: Number(s.total) || 0,
          patientName: `${s.patients?.pt_firstname || ""} ${s.patients?.pt_lastname || ""}`.trim() || "Sin paciente",
        });
      });

      const settlementsMap = {};
      (settlementsRes.data || []).forEach((s) => {
        settlementsMap[`${s.branchs_id}_${s.settlement_date}`] = s;
      });

      const pendingList = [];
      const reconciledList = [];

      Object.entries(groups).forEach(([key, group]) => {
        const settlement = settlementsMap[key];
        if (settlement) {
          reconciledList.push({ ...group, key, net: Number(settlement.net_amount), settlementId: settlement.id });
        } else {
          pendingList.push({ ...group, key });
        }
      });

      pendingList.sort((a, b) => new Date(b.date) - new Date(a.date));
      reconciledList.sort((a, b) => new Date(b.date) - new Date(a.date));

      setPending(pendingList);
      setReconciled(reconciledList);
    } catch (err) {
      console.error("Error cargando conciliación de Datafast:", err);
      toast({ title: "Error", description: "No se pudo cargar la información.", status: "error", duration: 4000, isClosable: true });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (group) => {
    const net = parseFloat(inputs[group.key]);
    if (isNaN(net) || net < 0) {
      toast({ title: "Monto inválido", description: "Escribe el monto real que llegó a la cuenta.", status: "warning", duration: 4000, isClosable: true });
      return;
    }

    setSavingKey(group.key);
    const { error } = await supabase.from("datafast_settlements").upsert(
      {
        branchs_id: group.branchs_id,
        settlement_date: group.date,
        gross_amount: group.gross,
        net_amount: net,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "branchs_id,settlement_date,tenant_id" }
    );
    setSavingKey(null);

    if (error) {
      console.error("Error guardando conciliación:", error);
      toast({ title: "Error", description: "No se pudo guardar.", status: "error", duration: 5000, isClosable: true });
    } else {
      toast({ title: "Conciliado", description: "Se guardó el monto real de ese día.", status: "success", duration: 3000, isClosable: true });
      fetchAll();
    }
  };

  const cardBg = useColorModeValue("white", "gray.700");
  const inputBg = useColorModeValue("gray.50", "gray.700");
  const borderColor = useColorModeValue("gray.200", "gray.600");
  const subtitleColor = useColorModeValue("gray.500", "gray.400");
  const sectionIconBg = useColorModeValue("#E6FBF6", "rgba(0,168,142,0.15)");
  const rowHoverBg = useColorModeValue("gray.50", "whiteAlpha.100");
  const detailBg = useColorModeValue("gray.50", "whiteAlpha.50");

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

  // Fila de detalle: lista de ventas/pacientes que componen ese día
  const SalesDetailRow = ({ group, colSpan }) => (
    <Tr>
      <Td colSpan={colSpan} p={0} border="none">
        <Collapse in={expandedKey === group.key} animateOpacity>
          <Box p={3} bg={detailBg} borderTop={`1px dashed ${borderColor}`}>
            <Text fontSize="10px" color={subtitleColor} textTransform="uppercase" mb={2}>
              {group.count} venta{group.count !== 1 ? "s" : ""} ese día
            </Text>
            <VStack align="stretch" spacing={1}>
              {group.sales.map((s) => (
                <HStack key={s.id} justify="space-between" fontSize="xs">
                  <HStack spacing={1}>
                    <Icon as={User} boxSize="11px" color={subtitleColor} />
                    <Text>{s.patientName}</Text>
                  </HStack>
                  <Text fontWeight="semibold">{formatMoney(s.total)}</Text>
                </HStack>
              ))}
            </VStack>
          </Box>
        </Collapse>
      </Td>
    </Tr>
  );

  const totalPendiente = pending.reduce((sum, g) => sum + g.gross, 0);

  const pendingTotalPages = Math.max(1, Math.ceil(pending.length / PAGE_SIZE));
  const pendingPageItems = pending.slice((pendingPage - 1) * PAGE_SIZE, pendingPage * PAGE_SIZE);
  const reconciledTotalPages = Math.max(1, Math.ceil(reconciled.length / PAGE_SIZE));
  const reconciledPageItems = reconciled.slice((reconciledPage - 1) * PAGE_SIZE, reconciledPage * PAGE_SIZE);

  const PaginationBar = ({ page, totalPages, onChange, total }) => (
    <Flex justify="space-between" align="center" mt={3} flexWrap="wrap" gap={3}>
      <Text fontSize="xs" color={subtitleColor}>Página {page} de {totalPages} · {total} en total</Text>
      <HStack>
        <IconButton icon={<ChevronLeft size={16} />} size="sm" variant="outline" borderRadius="full" isDisabled={page <= 1} onClick={() => onChange((p) => Math.max(1, p - 1))} aria-label="Anterior" />
        <Text fontSize="sm" fontWeight="semibold" minW="30px" textAlign="center">{page}</Text>
        <IconButton icon={<ChevronRight size={16} />} size="sm" variant="outline" borderRadius="full" isDisabled={page >= totalPages} onClick={() => onChange((p) => Math.min(totalPages, p + 1))} aria-label="Siguiente" />
      </HStack>
    </Flex>
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
            <Flex justify="space-between" align="center" mb={6} flexWrap="wrap" gap={3}>
              <HStack spacing={3}>
                <Flex align="center" justify="center" boxSize="44px" borderRadius="14px" bgGradient="linear(to-br, #00A88E, #00786A)" color="white" boxShadow="0 6px 16px -4px rgba(0,168,142,0.5)">
                  <Icon as={CreditCard} boxSize="20px" />
                </Flex>
                <VStack align="start" spacing={0}>
                  <Heading size="lg" fontWeight="800" color={useColorModeValue("gray.800", "white")} letterSpacing="tight">
                    Conciliación de Datafast
                  </Heading>
                  <Text fontSize="xs" color={subtitleColor}>
                    Registra el monto real cuando llegue a la cuenta — puede tardar días o meses, no hay apuro.
                  </Text>
                </VStack>
              </HStack>
              <Select
                placeholder="Todas las sucursales"
                value={selectedBranch}
                onChange={(e) => setSelectedBranch(e.target.value)}
                maxW="240px"
                borderRadius="12px"
                bg={inputBg}
                borderColor={borderColor}
                _focus={{ borderColor: ACCENT, boxShadow: `0 0 0 1px ${ACCENT}` }}
              >
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </Select>
            </Flex>

            {loading ? (
              <Flex justify="center" py={16}><Spinner color={ACCENT} /></Flex>
            ) : (
              <>
                {pending.length > 0 && (
                  <Box mb={4} p={3} borderRadius="10px" bg="orange.50" border="1px solid" borderColor="orange.200">
                    <Text fontSize="xs" color="orange.700">
                      {pending.length} día(s) pendientes de conciliar · {formatMoney(totalPendiente)} en bruto todavía sin confirmar
                    </Text>
                  </Box>
                )}

                <SectionTitle icon={Clock}>Pendientes de conciliar</SectionTitle>
                {pending.length === 0 ? (
                  <Text fontSize="sm" color={subtitleColor} mb={8}>🎉 No hay días pendientes de conciliar.</Text>
                ) : (
                  <>
                    <Box overflowX="auto" borderRadius="14px" border={`1px solid ${borderColor}`}>
                      <Table variant="simple" size="sm">
                        <Thead>
                          <Tr>
                            <Th w="30px"></Th>
                            <Th color={subtitleColor}>Fecha</Th>
                            <Th color={subtitleColor}>Sucursal</Th>
                            <Th color={subtitleColor} textAlign="center">Ventas</Th>
                            <Th color={subtitleColor} textAlign="right">Bruto</Th>
                            <Th color={subtitleColor}>Monto real</Th>
                            <Th color={subtitleColor}></Th>
                          </Tr>
                        </Thead>
                        <Tbody>
                          {pendingPageItems.map((group) => (
                            <Fragment key={group.key}>
                              <Tr _hover={{ bg: rowHoverBg }}>
                                <Td>
                                  <IconButton
                                    icon={expandedKey === group.key ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                                    size="xs"
                                    variant="ghost"
                                    aria-label="Ver detalle"
                                    onClick={() => setExpandedKey(expandedKey === group.key ? null : group.key)}
                                  />
                                </Td>
                                <Td>{new Date(`${group.date}T00:00:00`).toLocaleDateString("es-EC", { day: "2-digit", month: "short", year: "numeric" })}</Td>
                                <Td>{group.branchName}</Td>
                                <Td textAlign="center"><Badge borderRadius="full" px={2}>{group.count}</Badge></Td>
                                <Td textAlign="right" fontWeight="semibold">{formatMoney(group.gross)}</Td>
                                <Td>
                                  <Input
                                    type="number"
                                    step="0.01"
                                    placeholder="0.00"
                                    size="sm"
                                    maxW="130px"
                                    value={inputs[group.key] || ""}
                                    onChange={(e) => setInputs((prev) => ({ ...prev, [group.key]: e.target.value }))}
                                    borderRadius="8px"
                                    bg={inputBg}
                                    borderColor={borderColor}
                                    _focus={{ borderColor: ACCENT, boxShadow: `0 0 0 1px ${ACCENT}` }}
                                  />
                                </Td>
                                <Td>
                                  <Button
                                    size="sm"
                                    bg={ACCENT}
                                    color="white"
                                    _hover={{ bg: "#00967f" }}
                                    borderRadius="8px"
                                    onClick={() => handleSave(group)}
                                    isLoading={savingKey === group.key}
                                  >
                                    Guardar
                                  </Button>
                                </Td>
                              </Tr>
                              <SalesDetailRow group={group} colSpan={7} />
                            </Fragment>
                          ))}
                        </Tbody>
                      </Table>
                    </Box>
                    {pendingTotalPages > 1 && (
                      <PaginationBar page={pendingPage} totalPages={pendingTotalPages} onChange={setPendingPage} total={pending.length} />
                    )}
                    <Box mb={8} />
                  </>
                )}

                <SectionTitle icon={CheckCircle2}>Ya conciliados</SectionTitle>
                {reconciled.length === 0 ? (
                  <Text fontSize="sm" color={subtitleColor}>Todavía no hay días conciliados.</Text>
                ) : (
                  <>
                    <Box overflowX="auto" borderRadius="14px" border={`1px solid ${borderColor}`}>
                      <Table variant="simple" size="sm">
                        <Thead>
                          <Tr>
                            <Th w="30px"></Th>
                            <Th color={subtitleColor}>Fecha</Th>
                            <Th color={subtitleColor}>Sucursal</Th>
                            <Th color={subtitleColor} textAlign="right">Bruto</Th>
                            <Th color={subtitleColor} textAlign="right">Real</Th>
                            <Th color={subtitleColor} textAlign="right">Comisión</Th>
                          </Tr>
                        </Thead>
                        <Tbody>
                          {reconciledPageItems.map((group) => (
                            <Fragment key={group.key}>
                              <Tr _hover={{ bg: rowHoverBg }}>
                                <Td>
                                  <IconButton
                                    icon={expandedKey === group.key ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                                    size="xs"
                                    variant="ghost"
                                    aria-label="Ver detalle"
                                    onClick={() => setExpandedKey(expandedKey === group.key ? null : group.key)}
                                  />
                                </Td>
                                <Td>{new Date(`${group.date}T00:00:00`).toLocaleDateString("es-EC", { day: "2-digit", month: "short", year: "numeric" })}</Td>
                                <Td>{group.branchName}</Td>
                                <Td textAlign="right">{formatMoney(group.gross)}</Td>
                                <Td textAlign="right" fontWeight="bold" color={ACCENT}>{formatMoney(group.net)}</Td>
                                <Td textAlign="right" color="orange.400">-{formatMoney(group.gross - group.net)}</Td>
                              </Tr>
                              <SalesDetailRow group={group} colSpan={6} />
                            </Fragment>
                          ))}
                        </Tbody>
                      </Table>
                    </Box>
                    {reconciledTotalPages > 1 && (
                      <PaginationBar page={reconciledPage} totalPages={reconciledTotalPages} onChange={setReconciledPage} total={reconciled.length} />
                    )}
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

export default DatafastReconciliation;
