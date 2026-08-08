import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../api/supabase";
import {
  Box, Container, Heading, Text, Table, Thead, Tbody, Tr, Th, Td, Input,
  Flex, HStack, VStack, Icon, Badge, IconButton, Spinner, useColorModeValue,
  SimpleGrid, Button, Select, Modal, ModalOverlay, ModalContent, ModalHeader,
  ModalCloseButton, ModalBody, ModalFooter, Textarea,
} from "@chakra-ui/react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";
import {
  Users, Search as SearchIcon, ChevronLeft, ChevronRight,
  MessageCircle, AlertTriangle, TrendingDown, Wallet,
} from "lucide-react";
import SmartHeader from "../header/SmartHeader";

const ACCENT = "#00A88E";
const PAGE_SIZE = 10;
const FETCH_CAP = 1000;

const formatMoney = (value) => {
  const n = parseFloat(value);
  if (isNaN(n)) return "$0.00";
  return `$${n.toLocaleString("es-EC", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const daysSince = (dateStr) => {
  if (!dateStr) return 0;
  const diff = Date.now() - new Date(dateStr).getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
};

// Nivel de urgencia según hace cuánto viene arrastrando la deuda más vieja
const urgencyFor = (days) => {
  if (days >= 60) return { label: "Urgente", color: "red", bg: "red.50" };
  if (days >= 30) return { label: "Moderado", color: "orange", bg: "orange.50" };
  return { label: "Reciente", color: "teal", bg: "teal.50" };
};

const BalancesPatient = () => {
  const [rawSales, setRawSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState("");

  const [isReminderOpen, setIsReminderOpen] = useState(false);
  const [reminderText, setReminderText] = useState("");
  const [reminderDebtor, setReminderDebtor] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    fetchDebts();
    fetchBranches();
  }, []);

  const fetchBranches = async () => {
    const { data, error } = await supabase.from("branchs").select("id, name");
    if (!error) setBranches(data || []);
  };

  const fetchDebts = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("sales")
        .select(`
          id, date, credit, branchs_id,
          patients (id, pt_firstname, pt_lastname, pt_ci, pt_phone),
          branchs (name)
        `)
        .gt("credit", 0)
        .eq("is_refund", false)
        .order("date", { ascending: true })
        .limit(FETCH_CAP);

      if (error) throw error;
      setRawSales(data || []);
    } catch (err) {
      console.error("Error cargando saldos:", err);
    } finally {
      setLoading(false);
    }
  };

  // Se agrupa por paciente: suma de todo lo que debe, y la venta más
  // antigua sin pagar (para saber hace cuánto arrastra la deuda). Si hay
  // una sucursal elegida, solo se cuentan las ventas de esa sucursal.
  const salesInScope = selectedBranch
    ? rawSales.filter((s) => String(s.branchs_id) === String(selectedBranch))
    : rawSales;

  const patientsMap = {};
  salesInScope.forEach((sale) => {
    const pid = sale.patients?.id;
    if (!pid) return;
    if (!patientsMap[pid]) {
      patientsMap[pid] = {
        patient: sale.patients,
        totalDebt: 0,
        salesCount: 0,
        oldestDate: sale.date,
        branches: new Set(),
      };
    }
    patientsMap[pid].totalDebt += Number(sale.credit) || 0;
    patientsMap[pid].salesCount += 1;
    patientsMap[pid].branches.add(sale.branchs?.name || "—");
    if (new Date(sale.date) < new Date(patientsMap[pid].oldestDate)) {
      patientsMap[pid].oldestDate = sale.date;
    }
  });

  const debtors = Object.values(patientsMap)
    .map((d) => ({ ...d, daysOld: daysSince(d.oldestDate), branches: [...d.branches].join(", ") }))
    .sort((a, b) => b.totalDebt - a.totalDebt); // el que más debe, primero

  const filtered = debtors.filter((d) => {
    if (!search.trim()) return true;
    const term = search.toLowerCase();
    return (
      d.patient.pt_firstname?.toLowerCase().includes(term) ||
      d.patient.pt_lastname?.toLowerCase().includes(term) ||
      d.patient.pt_ci?.toLowerCase().includes(term)
    );
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const totalDeuda = debtors.reduce((sum, d) => sum + d.totalDebt, 0);
  const urgentCount = debtors.filter((d) => d.daysOld >= 60).length;
  const promedioDeuda = debtors.length > 0 ? totalDeuda / debtors.length : 0;

  // Deuda agrupada por sucursal, para la gráfica
  const branchTotals = {};
  salesInScope.forEach((sale) => {
    const name = sale.branchs?.name || "Sin sucursal";
    branchTotals[name] = (branchTotals[name] || 0) + (Number(sale.credit) || 0);
  });
  const chartData = Object.entries(branchTotals).map(([name, total]) => ({ name, total: Number(total.toFixed(2)) }));

  const buildReminderMessage = (debtor) => {
    return `Hola ${debtor.patient.pt_firstname} 👋, te escribimos de la óptica para recordarte que tienes un saldo pendiente de ${formatMoney(debtor.totalDebt)}${debtor.salesCount > 1 ? ` (repartido en ${debtor.salesCount} compras)` : ""}. Cuando puedas, contáctanos para coordinar el pago. ¡Gracias!`;
  };

  const openReminder = (debtor) => {
    if (!debtor.patient?.pt_phone) return;
    setReminderDebtor(debtor);
    setReminderText(buildReminderMessage(debtor));
    setIsReminderOpen(true);
  };

  const handleSendReminder = () => {
    if (!reminderDebtor?.patient?.pt_phone) return;
    const cleanPhone = reminderDebtor.patient.pt_phone.replace(/\D/g, "");
    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(reminderText)}`, "_blank");
    setIsReminderOpen(false);
  };

  const goToPatient = (debtor) => {
    navigate(`/history-clinic/patient-history/${debtor.patient.id}`, { state: { patientData: debtor.patient } });
  };

  const cardBg = useColorModeValue("white", "gray.700");
  const inputBg = useColorModeValue("gray.50", "gray.700");
  const borderColor = useColorModeValue("gray.200", "gray.600");
  const subtitleColor = useColorModeValue("gray.500", "gray.400");
  const sectionIconBg = useColorModeValue("#E6FBF6", "rgba(0,168,142,0.15)");
  const rowHoverBg = useColorModeValue("gray.50", "whiteAlpha.100");
  const tooltipBg = useColorModeValue("#fff", "#2D3748");

  const KpiCard = ({ icon, label, value, accentColor = ACCENT }) => (
    <Box
      p={4}
      borderRadius="14px"
      bg={inputBg}
      border={`1px solid ${borderColor}`}
      transition="all 0.2s ease"
      _hover={{ transform: "translateY(-2px)", boxShadow: "md", borderColor: accentColor }}
    >
      <HStack spacing={2} mb={1}>
        <Icon as={icon} boxSize="14px" color={accentColor} />
        <Text fontSize="xs" color={subtitleColor} textTransform="uppercase" letterSpacing="wide">{label}</Text>
      </HStack>
      <Text fontSize="xl" fontWeight="800" color={accentColor}>{value}</Text>
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
          boxShadow={useColorModeValue(
            "0 20px 45px -20px rgba(0,168,142,0.25)",
            "0 20px 45px -20px rgba(0,168,142,0.35)"
          )}
          overflow="hidden"
        >
          <Box h="5px" bgGradient="linear(to-r, #00A88E, #2DD4BF, #00A88E)" />
          <Box p={{ base: 5, md: 8 }}>
            <HStack spacing={3} mb={6}>
              <Flex
                align="center" justify="center" boxSize="44px" borderRadius="14px"
                bgGradient="linear(to-br, #00A88E, #00786A)" color="white"
                boxShadow="0 6px 16px -4px rgba(0,168,142,0.5)"
              >
                <Icon as={Wallet} boxSize="20px" />
              </Flex>
              <VStack align="start" spacing={0}>
                <Heading size="lg" fontWeight="800" color={useColorModeValue("gray.800", "white")} letterSpacing="tight">
                  Saldos — Radar de Cobranza
                </Heading>
                <Text fontSize="xs" color={subtitleColor}>
                  Quién debe más, y hace cuánto tiempo
                </Text>
              </VStack>
            </HStack>

            {loading ? (
              <Flex justify="center" py={16}>
                <Spinner color={ACCENT} />
              </Flex>
            ) : (
              <>
                {/* KPIs */}
                <SimpleGrid columns={{ base: 2, md: 3 }} spacing={4} mb={6}>
                  <KpiCard icon={TrendingDown} label="Deuda total" value={formatMoney(totalDeuda)} />
                  <KpiCard icon={AlertTriangle} label="Casos urgentes (+60 días)" value={urgentCount} accentColor="#DC2626" />
                  <KpiCard icon={Users} label="Deuda promedio" value={formatMoney(promedioDeuda)} />
                </SimpleGrid>

                {/* Gráfica por sucursal */}
                {chartData.length > 0 && (
                  <Box mb={6} p={4} borderRadius="14px" bg={inputBg} border={`1px solid ${borderColor}`}>
                    <Text fontSize="xs" fontWeight="bold" color={subtitleColor} textTransform="uppercase" letterSpacing="wide" mb={2}>
                      Deuda pendiente por sucursal
                    </Text>
                    <Box h="180px">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" stroke={borderColor} />
                          <XAxis dataKey="name" fontSize={11} stroke={subtitleColor} />
                          <YAxis fontSize={11} stroke={subtitleColor} />
                          <Tooltip
                            formatter={(value) => formatMoney(value)}
                            contentStyle={{ background: tooltipBg, border: `1px solid ${borderColor}`, borderRadius: "10px", fontSize: "12px" }}
                          />
                          <Bar dataKey="total" fill={ACCENT} radius={[6, 6, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </Box>
                  </Box>
                )}

                <Flex gap={3} mb={5} flexWrap="wrap">
                  <Box position="relative" flex="1" minW="240px">
                    <Icon as={SearchIcon} position="absolute" left="14px" top="12px" color={subtitleColor} zIndex={1} />
                    <Input
                      placeholder="Buscar por nombre, apellido o cédula..."
                      value={search}
                      onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                      pl="40px"
                      size="lg"
                      borderRadius="12px"
                      bg={inputBg}
                      borderColor={borderColor}
                      _focus={{ borderColor: ACCENT, boxShadow: `0 0 0 1px ${ACCENT}` }}
                    />
                  </Box>
                  <Select
                    placeholder="Todas las sucursales"
                    value={selectedBranch}
                    onChange={(e) => { setSelectedBranch(e.target.value); setPage(1); }}
                    size="lg"
                    maxW="220px"
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

                {filtered.length === 0 ? (
                  <Text textAlign="center" color={subtitleColor} py={12}>
                    {search ? `No hay pacientes con deuda para "${search}".` : "🎉 Nadie tiene saldo pendiente ahora mismo."}
                  </Text>
                ) : (
                  <>
                    <Box overflowX="auto" borderRadius="14px" border={`1px solid ${borderColor}`}>
                      <Table variant="simple" size="sm">
                        <Thead>
                          <Tr>
                            <Th color={subtitleColor}>Paciente</Th>
                            <Th color={subtitleColor}>Sucursal</Th>
                            <Th color={subtitleColor} textAlign="center">Compras pendientes</Th>
                            <Th color={subtitleColor} textAlign="right">Debe en total</Th>
                            <Th color={subtitleColor}>Urgencia</Th>
                            <Th color={subtitleColor} textAlign="right">Acciones</Th>
                          </Tr>
                        </Thead>
                        <Tbody>
                          {pageItems.map((d) => {
                            const urgency = urgencyFor(d.daysOld);
                            return (
                              <Tr
                                key={d.patient.id}
                                cursor="pointer"
                                _hover={{ bg: rowHoverBg }}
                                onClick={() => goToPatient(d)}
                              >
                                <Td>
                                  <Text fontWeight="semibold">{d.patient.pt_firstname} {d.patient.pt_lastname}</Text>
                                  <Text fontSize="xs" color={subtitleColor}>{d.patient.pt_ci || "Sin C.I."}</Text>
                                </Td>
                                <Td fontSize="xs">{d.branches}</Td>
                                <Td textAlign="center">
                                  <Badge borderRadius="full" px={2}>{d.salesCount}</Badge>
                                </Td>
                                <Td textAlign="right" fontWeight="bold" color={ACCENT}>{formatMoney(d.totalDebt)}</Td>
                                <Td>
                                  <Badge colorScheme={urgency.color} borderRadius="full" px={2}>
                                    {urgency.label} · {d.daysOld}d
                                  </Badge>
                                </Td>
                                <Td textAlign="right" onClick={(e) => e.stopPropagation()}>
                                  {d.patient.pt_phone && (
                                    <IconButton
                                      icon={<MessageCircle size={15} />}
                                      size="sm"
                                      variant="ghost"
                                      colorScheme="green"
                                      aria-label="Recordar por WhatsApp"
                                      title="Recordar por WhatsApp"
                                      onClick={() => openReminder(d)}
                                    />
                                  )}
                                </Td>
                              </Tr>
                            );
                          })}
                        </Tbody>
                      </Table>
                    </Box>

                    <Flex justify="space-between" align="center" mt={5} flexWrap="wrap" gap={3}>
                      <Text fontSize="xs" color={subtitleColor}>
                        Página {page} de {totalPages} · {filtered.length} paciente{filtered.length !== 1 ? "s" : ""} con deuda
                      </Text>
                      <HStack>
                        <IconButton
                          icon={<ChevronLeft size={16} />}
                          size="sm"
                          variant="outline"
                          borderRadius="full"
                          isDisabled={page <= 1}
                          onClick={() => setPage((p) => Math.max(1, p - 1))}
                          aria-label="Anterior"
                        />
                        <Text fontSize="sm" fontWeight="semibold" minW="30px" textAlign="center">{page}</Text>
                        <IconButton
                          icon={<ChevronRight size={16} />}
                          size="sm"
                          variant="outline"
                          borderRadius="full"
                          isDisabled={page >= totalPages}
                          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                          aria-label="Siguiente"
                        />
                      </HStack>
                    </Flex>
                  </>
                )}
              </>
            )}
          </Box>
        </Box>
      </Container>

      {/* Modal: recordatorio editable antes de enviar */}
      <Modal isOpen={isReminderOpen} onClose={() => setIsReminderOpen(false)} isCentered size="md">
        <ModalOverlay />
        <ModalContent bg={cardBg} borderRadius="20px">
          <ModalHeader fontSize="md">
            <HStack>
              <Icon as={MessageCircle} color="green.500" />
              <Text>Recordatorio de saldo</Text>
            </HStack>
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            {reminderDebtor && (
              <>
                <Text fontSize="sm" fontWeight="semibold" mb={1}>
                  {reminderDebtor.patient?.pt_firstname} {reminderDebtor.patient?.pt_lastname}
                </Text>
                <Text fontSize="xs" color={subtitleColor} mb={3}>
                  Debe en total: <b>{formatMoney(reminderDebtor.totalDebt)}</b>
                  {reminderDebtor.salesCount > 1 ? ` (en ${reminderDebtor.salesCount} compras)` : ""}
                </Text>
              </>
            )}
            <Text fontSize="xs" color={subtitleColor} mb={2}>
              Puedes editar el mensaje antes de enviarlo. Se abrirá WhatsApp con este texto ya listo.
            </Text>
            <Textarea
              value={reminderText}
              onChange={(e) => setReminderText(e.target.value)}
              minH="140px"
              borderRadius="10px"
              bg={inputBg}
              borderColor={borderColor}
              _focus={{ borderColor: "green.400", boxShadow: "0 0 0 1px #38A169" }}
            />
          </ModalBody>
          <ModalFooter gap={2}>
            <Button variant="ghost" size="sm" onClick={() => setIsReminderOpen(false)}>Cancelar</Button>
            <Button size="sm" colorScheme="green" leftIcon={<MessageCircle size={15} />} onClick={handleSendReminder}>
              Enviar por WhatsApp
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default BalancesPatient;
