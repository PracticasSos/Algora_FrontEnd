import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../api/supabase";
import {
  Box, Container, Heading, Text, Table, Thead, Tbody, Tr, Th, Td, Input, Select,
  Flex, HStack, VStack, Icon, Badge, IconButton, Spinner, useColorModeValue,
  Modal, ModalOverlay, ModalContent, ModalHeader, ModalCloseButton, ModalBody, ModalFooter,
  Button, Textarea,
} from "@chakra-ui/react";
import { Receipt, Search as SearchIcon, ChevronLeft, ChevronRight, Eye, MessageCircle } from "lucide-react";
import SmartHeader from "../header/SmartHeader";

const ACCENT = "#00A88E";
const PAGE_SIZE = 10;
const FETCH_CAP = 1000;

const formatMoney = (value) => {
  const n = parseFloat(value);
  if (isNaN(n)) return "$0.00";
  return `$${n.toLocaleString("es-EC", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const HistoryClinic = () => {
  const [allSales, setAllSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [messageTemplate, setMessageTemplate] = useState("Hola {nombre}, aquí está su comprobante de venta: {pdf_url}");
  const [isReminderOpen, setIsReminderOpen] = useState(false);
  const [reminderText, setReminderText] = useState("");
  const [reminderRow, setReminderRow] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchBranches();
    fetchSales();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchBranches = async () => {
    const { data, error } = await supabase.from("branchs").select("id, name");
    if (!error) setBranches(data || []);
  };

  const fetchSales = async () => {
    setLoading(true);
    try {
      // Últimas ventas primero, sin importar la sucursal — el filtro de
      // sucursal es opcional, no obligatorio como antes.
      const { data, error } = await supabase
        .from("sales")
        .select(`
          id, date, total, credit, balance, pdf_url, branchs_id,
          patients (id, pt_firstname, pt_lastname, pt_ci, pt_phone)
        `)
        .order("date", { ascending: false })
        .order("id", { ascending: false })
        .limit(FETCH_CAP);

      if (error) throw error;
      setAllSales(data || []);
    } catch (err) {
      console.error("Error cargando historial de ventas:", err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = allSales.filter((sale) => {
    if (selectedBranch && String(sale.branchs_id) !== String(selectedBranch)) return false;
    if (!search.trim()) return true;
    const term = search.toLowerCase();
    const p = sale.patients;
    if (!p) return false;
    return (
      p.pt_firstname?.toLowerCase().includes(term) ||
      p.pt_lastname?.toLowerCase().includes(term) ||
      p.pt_ci?.toLowerCase().includes(term)
    );
  });

  // Se agrupa por paciente — antes salía una fila por cada venta, y un
  // paciente con 3 compras aparecía 3 veces. Ahora sale una sola vez, con
  // el resumen de todas sus compras; el detalle completo se ve al entrar.
  const patientsMap = {};
  filtered.forEach((sale) => {
    const pid = sale.patients?.id;
    if (!pid) return;
    if (!patientsMap[pid]) {
      patientsMap[pid] = {
        patient: sale.patients,
        salesCount: 0,
        totalSpent: 0,
        totalPending: 0,
        lastDate: sale.date,
        lastBranchId: sale.branchs_id,
        lastPdfUrl: sale.pdf_url,
      };
    }
    const p = patientsMap[pid];
    p.salesCount += 1;
    p.totalSpent += Number(sale.total) || 0;
    p.totalPending += Number(sale.credit) || 0;
    // filtered ya viene ordenado por fecha desc, así que la primera venta
    // que se encuentra por paciente es la más reciente.
  });

  // JavaScript reordena solo las llaves de objeto que son numéricas (como
  // el id del paciente), de menor a mayor — así que aunque la consulta ya
  // venía ordenada por fecha, ese orden se perdía al agrupar. Se ordena
  // de nuevo, explícitamente, por la venta más reciente de cada paciente.
  const patientRows = Object.values(patientsMap).sort(
    (a, b) => new Date(b.lastDate) - new Date(a.lastDate)
  );

  const totalPages = Math.max(1, Math.ceil(patientRows.length / PAGE_SIZE));
  const pageItems = patientRows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const branchName = (branchId) => branches.find((b) => String(b.id) === String(branchId))?.name || "—";

  const handleViewPatient = (row) => {
    if (!row.patient?.id) return;
    navigate(`/history-clinic/patient-history/${row.patient.id}`, { state: { patientData: row.patient } });
  };

  const openReminder = (row) => {
    if (!row.lastPdfUrl || !row.patient?.pt_phone) return;
    let mensaje = messageTemplate.replace("{nombre}", row.patient.pt_firstname || "");
    mensaje = mensaje.includes("{pdf_url}") ? mensaje.replace("{pdf_url}", row.lastPdfUrl) : `${mensaje} ${row.lastPdfUrl}`;
    setReminderRow(row);
    setReminderText(mensaje);
    setIsReminderOpen(true);
  };

  const handleSendWhatsApp = () => {
    if (!reminderRow?.patient?.pt_phone) return;
    const cleanPhone = reminderRow.patient.pt_phone.replace(/\D/g, "");
    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(reminderText)}`, "_blank");
    setIsReminderOpen(false);
  };

  const cardBg = useColorModeValue("white", "gray.700");
  const inputBg = useColorModeValue("gray.50", "gray.700");
  const borderColor = useColorModeValue("gray.200", "gray.600");
  const subtitleColor = useColorModeValue("gray.500", "gray.400");
  const rowHoverBg = useColorModeValue("gray.50", "whiteAlpha.100");

  return (
    <Box minHeight="100vh" bgGradient={useColorModeValue("linear(to-br, gray.50, teal.50)", "linear(to-br, gray.900, #0d1f1c)")}>
      <SmartHeader moduleSpecificButton={null} />

      <Container maxW="1100px" py={8} px={{ base: 3, md: 6 }}>
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
            <HStack spacing={3} mb={5}>
              <Flex
                align="center" justify="center" boxSize="44px" borderRadius="14px"
                bgGradient="linear(to-br, #00A88E, #00786A)" color="white"
                boxShadow="0 6px 16px -4px rgba(0,168,142,0.5)"
              >
                <Icon as={Receipt} boxSize="20px" />
              </Flex>
              <VStack align="start" spacing={0}>
                <Heading size="lg" fontWeight="800" color={useColorModeValue("gray.800", "white")} letterSpacing="tight">
                  Historial de Venta
                </Heading>
                <Text fontSize="xs" color={subtitleColor}>
                  {patientRows.length} paciente{patientRows.length !== 1 ? "s" : ""} · {allSales.length} venta{allSales.length !== 1 ? "s" : ""} en total
                </Text>
              </VStack>
            </HStack>

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

            {loading ? (
              <Flex justify="center" py={16}>
                <Spinner color={ACCENT} />
              </Flex>
            ) : patientRows.length === 0 ? (
              <Text textAlign="center" color={subtitleColor} py={12}>
                No se encontraron pacientes{search ? ` para "${search}"` : ""}.
              </Text>
            ) : (
              <>
                <Box overflowX="auto" borderRadius="14px" border={`1px solid ${borderColor}`}>
                  <Table variant="simple" size="sm">
                    <Thead>
                      <Tr>
                        <Th color={subtitleColor}>Paciente</Th>
                        <Th color={subtitleColor}>Última compra</Th>
                        <Th color={subtitleColor}>Sucursal</Th>
                        <Th color={subtitleColor} textAlign="center">Compras</Th>
                        <Th color={subtitleColor} textAlign="right">Total gastado</Th>
                        <Th color={subtitleColor} textAlign="right">Saldo</Th>
                        <Th color={subtitleColor} textAlign="right">Acciones</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {pageItems.map((row) => (
                        <Tr
                          key={row.patient.id}
                          cursor="pointer"
                          _hover={{ bg: rowHoverBg }}
                          onClick={() => handleViewPatient(row)}
                        >
                          <Td>
                            <Text fontWeight="semibold">
                              {row.patient?.pt_firstname} {row.patient?.pt_lastname}
                            </Text>
                            <Text fontSize="xs" color={subtitleColor}>{row.patient?.pt_ci || "Sin C.I."}</Text>
                          </Td>
                          <Td>{row.lastDate ? new Date(row.lastDate).toLocaleDateString("es-EC") : "—"}</Td>
                          <Td>{branchName(row.lastBranchId)}</Td>
                          <Td textAlign="center">
                            <Badge borderRadius="full" px={2}>{row.salesCount}</Badge>
                          </Td>
                          <Td textAlign="right" fontWeight="semibold">{formatMoney(row.totalSpent)}</Td>
                          <Td textAlign="right">
                            <Badge colorScheme={row.totalPending > 0 ? "orange" : "teal"} borderRadius="full" px={2}>
                              {formatMoney(row.totalPending)}
                            </Badge>
                          </Td>
                          <Td textAlign="right" onClick={(e) => e.stopPropagation()}>
                            <HStack justify="flex-end" spacing={1}>
                              <IconButton
                                icon={<Eye size={15} />}
                                size="sm"
                                variant="ghost"
                                colorScheme="teal"
                                aria-label="Ver historial"
                                onClick={() => handleViewPatient(row)}
                              />
                              {row.lastPdfUrl && row.patient?.pt_phone && (
                                <IconButton
                                  icon={<MessageCircle size={15} />}
                                  size="sm"
                                  variant="ghost"
                                  colorScheme="green"
                                  aria-label="Enviar por WhatsApp"
                                  title="Enviar por WhatsApp"
                                  onClick={() => openReminder(row)}
                                />
                              )}
                            </HStack>
                          </Td>
                        </Tr>
                      ))}
                    </Tbody>
                  </Table>
                </Box>

                <Flex justify="space-between" align="center" mt={5} flexWrap="wrap" gap={3}>
                  <Text fontSize="xs" color={subtitleColor}>
                    Página {page} de {totalPages} · {patientRows.length} paciente{patientRows.length !== 1 ? "s" : ""}
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
          </Box>
        </Box>
      </Container>

      {/* Modal: mensaje editable antes de enviar */}
      <Modal isOpen={isReminderOpen} onClose={() => setIsReminderOpen(false)} isCentered size="md">
        <ModalOverlay />
        <ModalContent bg={cardBg} borderRadius="20px">
          <ModalHeader fontSize="md">
            <HStack>
              <Icon as={MessageCircle} color="green.500" />
              <Text>Enviar comprobante</Text>
            </HStack>
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            {reminderRow && (
              <Text fontSize="sm" fontWeight="semibold" mb={3}>
                {reminderRow.patient?.pt_firstname} {reminderRow.patient?.pt_lastname}
              </Text>
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
            <Button size="sm" colorScheme="green" leftIcon={<MessageCircle size={15} />} onClick={handleSendWhatsApp}>
              Enviar por WhatsApp
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default HistoryClinic;
