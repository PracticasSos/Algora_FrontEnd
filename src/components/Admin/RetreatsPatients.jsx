import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../api/supabase";
import {
  Box, Container, Heading, Text, Table, Thead, Tbody, Tr, Th, Td, Input, Select,
  Flex, HStack, VStack, Icon, Badge, IconButton, Spinner, useColorModeValue,
  Modal, ModalOverlay, ModalContent, ModalHeader, ModalCloseButton, ModalBody, ModalFooter,
  Button, Textarea,
} from "@chakra-ui/react";
import {
  PackageCheck, Search as SearchIcon, ChevronLeft, ChevronRight,
  MessageCircle, Clock, Eye,
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

// Estado del retiro según la fecha prometida de entrega
const statusFor = (deliveryDatetime) => {
  if (!deliveryDatetime) return { label: "Sin fecha", color: "gray" };
  const diffMs = new Date(deliveryDatetime).getTime() - Date.now();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return { label: `Atrasado ${Math.abs(diffDays)}d`, color: "red" };
  if (diffDays === 0) return { label: "Listo hoy", color: "orange" };
  return { label: `En ${diffDays}d`, color: "teal" };
};

const RetreatsPatients = () => {
  const [allSales, setAllSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const [isReminderOpen, setIsReminderOpen] = useState(false);
  const [reminderText, setReminderText] = useState("");
  const [reminderSale, setReminderSale] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    fetchBranches();
    fetchPending();
  }, []);

  const fetchBranches = async () => {
    const { data, error } = await supabase.from("branchs").select("id, name");
    if (!error) setBranches(data || []);
  };

  const fetchPending = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("sales")
        .select(`
          id, date, total, balance, credit, branchs_id, delivery_datetime,
          patients (id, pt_firstname, pt_lastname, pt_ci, pt_phone),
          branchs (name),
          inventario:inventario_id (brand),
          lens:lens_id (lens_type)
        `)
        .eq("is_completed", false)
        .eq("is_refund", false)
        .order("date", { ascending: false })
        .order("id", { ascending: false })
        .limit(FETCH_CAP);

      if (error) throw error;
      setAllSales(data || []);
    } catch (err) {
      console.error("Error cargando retiros pendientes:", err);
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

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const overdueCount = filtered.filter((s) => s.delivery_datetime && new Date(s.delivery_datetime) < new Date()).length;

  const goToPickup = (sale) => {
    navigate(`/retreats-patients/retreats/${sale.id}`, {
      state: { patientData: sale.patients, selectedDate: sale.date },
    });
  };

  const buildReminderMessage = (sale) => {
    const status = statusFor(sale.delivery_datetime);
    const listo = status.color === "red" || status.color === "orange" ? "ya está listo" : "estará listo pronto";
    return `Hola ${sale.patients?.pt_firstname} 👋, tu pedido en ${sale.branchs?.name || "nuestra óptica"} ${listo} para retirar. ${sale.credit > 0 ? `Recuerda que tienes un saldo pendiente de ${formatMoney(sale.credit)} para completar en el retiro.` : ""} ¡Te esperamos!`;
  };

  const openReminder = (sale) => {
    if (!sale.patients?.pt_phone) return;
    setReminderSale(sale);
    setReminderText(buildReminderMessage(sale));
    setIsReminderOpen(true);
  };

  const handleSendReminder = () => {
    if (!reminderSale?.patients?.pt_phone) return;
    const cleanPhone = reminderSale.patients.pt_phone.replace(/\D/g, "");
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
            <Flex justify="space-between" align="center" mb={6} flexWrap="wrap" gap={3}>
              <HStack spacing={3}>
                <Flex
                  align="center" justify="center" boxSize="44px" borderRadius="14px"
                  bgGradient="linear(to-br, #00A88E, #00786A)" color="white"
                  boxShadow="0 6px 16px -4px rgba(0,168,142,0.5)"
                >
                  <Icon as={PackageCheck} boxSize="20px" />
                </Flex>
                <VStack align="start" spacing={0}>
                  <Heading size="lg" fontWeight="800" color={useColorModeValue("gray.800", "white")} letterSpacing="tight">
                    Retiros
                  </Heading>
                  <Text fontSize="xs" color={subtitleColor}>
                    {filtered.length} pendiente{filtered.length !== 1 ? "s" : ""}
                  </Text>
                </VStack>
              </HStack>
              {overdueCount > 0 && (
                <Badge colorScheme="red" borderRadius="full" px={3} py={1} fontSize="xs">
                  {overdueCount} atrasado{overdueCount !== 1 ? "s" : ""}
                </Badge>
              )}
            </Flex>

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
            ) : filtered.length === 0 ? (
              <Text textAlign="center" color={subtitleColor} py={12}>
                🎉 No hay retiros pendientes{search ? ` para "${search}"` : ""}.
              </Text>
            ) : (
              <>
                <Box overflowX="auto" borderRadius="14px" border={`1px solid ${borderColor}`}>
                  <Table variant="simple" size="sm">
                    <Thead>
                      <Tr>
                        <Th color={subtitleColor}>Paciente</Th>
                        <Th color={subtitleColor}>Producto</Th>
                        <Th color={subtitleColor}>Sucursal</Th>
                        <Th color={subtitleColor} textAlign="right">Saldo</Th>
                        <Th color={subtitleColor}>Estado</Th>
                        <Th color={subtitleColor} textAlign="right">Acciones</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {pageItems.map((sale) => {
                        const status = statusFor(sale.delivery_datetime);
                        return (
                          <Tr key={sale.id} cursor="pointer" _hover={{ bg: rowHoverBg }} onClick={() => goToPickup(sale)}>
                            <Td>
                              <Text fontWeight="semibold">{sale.patients?.pt_firstname} {sale.patients?.pt_lastname}</Text>
                              <Text fontSize="xs" color={subtitleColor}>{sale.patients?.pt_ci || "Sin C.I."}</Text>
                            </Td>
                            <Td fontSize="xs">{sale.inventario?.brand || "Sin marca"} · {sale.lens?.lens_type || "—"}</Td>
                            <Td>{sale.branchs?.name || "—"}</Td>
                            <Td textAlign="right">
                              <Badge colorScheme={Number(sale.credit) > 0 ? "orange" : "teal"} borderRadius="full" px={2}>
                                {formatMoney(sale.credit)}
                              </Badge>
                            </Td>
                            <Td>
                              <Badge colorScheme={status.color} borderRadius="full" px={2}>
                                <HStack spacing={1}>
                                  <Icon as={Clock} boxSize="10px" />
                                  <Text>{status.label}</Text>
                                </HStack>
                              </Badge>
                            </Td>
                            <Td textAlign="right" onClick={(e) => e.stopPropagation()}>
                              <HStack justify="flex-end" spacing={1}>
                                {sale.patients?.pt_phone && (
                                  <IconButton
                                    icon={<MessageCircle size={15} />}
                                    size="sm"
                                    variant="ghost"
                                    colorScheme="green"
                                    aria-label="Avisar por WhatsApp"
                                    title="Avisar por WhatsApp"
                                    onClick={() => openReminder(sale)}
                                  />
                                )}
                                <IconButton
                                  icon={<Eye size={15} />}
                                  size="sm"
                                  variant="ghost"
                                  colorScheme="teal"
                                  aria-label="Completar retiro"
                                  title="Completar retiro"
                                  onClick={() => goToPickup(sale)}
                                />
                              </HStack>
                            </Td>
                          </Tr>
                        );
                      })}
                    </Tbody>
                  </Table>
                </Box>

                <Flex justify="space-between" align="center" mt={5} flexWrap="wrap" gap={3}>
                  <Text fontSize="xs" color={subtitleColor}>
                    Página {page} de {totalPages} · {filtered.length} en total
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

      {/* Modal: recordatorio editable */}
      <Modal isOpen={isReminderOpen} onClose={() => setIsReminderOpen(false)} isCentered size="md">
        <ModalOverlay />
        <ModalContent bg={cardBg} borderRadius="20px">
          <ModalHeader fontSize="md">
            <HStack>
              <Icon as={MessageCircle} color="green.500" />
              <Text>Avisar retiro disponible</Text>
            </HStack>
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <Text fontSize="xs" color={subtitleColor} mb={2}>
              Puedes editar el mensaje antes de enviarlo.
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

export default RetreatsPatients;
