import { useEffect, useState } from "react";
import { supabase } from "../../api/supabase";
import {
  Box, Container, Heading, Text, Table, Thead, Tbody, Tr, Th, Td, Input, Select,
  Flex, HStack, VStack, Icon, Badge, IconButton, Spinner, useColorModeValue,
  Modal, ModalOverlay, ModalContent, ModalHeader, ModalCloseButton, ModalBody, ModalFooter,
  FormControl, FormLabel, Button, useToast, SimpleGrid, Textarea,
} from "@chakra-ui/react";
import {
  CreditCard, Search as SearchIcon, ChevronLeft, ChevronRight,
  MessageCircle, DollarSign, User, History, Calendar,
} from "lucide-react";
import SmartHeader from "../header/SmartHeader";
import { generateReceiptPDF } from "./receipts/receiptGenerator.js";

const ACCENT = "#00A88E";
const PAGE_SIZE = 10;
const FETCH_CAP = 1000;

const formatMoney = (value) => {
  const n = parseFloat(value);
  if (isNaN(n)) return "$0.00";
  return `$${n.toLocaleString("es-EC", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const defaultReminderTemplate =
  "Hola {nombre} 👋, te recordamos que tienes un saldo pendiente de {saldo} por tu compra en {sucursal} del {fecha}. Cuando puedas, puedes acercarte o contactarnos para coordinar el pago. ¡Gracias!";

const Balance = () => {
  const [allSales, setAllSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [onlyPending, setOnlyPending] = useState(true);

  const [selectedSale, setSelectedSale] = useState(null);
  const [isPayOpen, setIsPayOpen] = useState(false);
  const [abonoAmount, setAbonoAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isGeneratingReceipt, setIsGeneratingReceipt] = useState(false);
  const [receiptResult, setReceiptResult] = useState(null); // { pdfUrl, abono, newBalance, newCredit }

  const [isReminderOpen, setIsReminderOpen] = useState(false);
  const [reminderText, setReminderText] = useState("");
  const [reminderSale, setReminderSale] = useState(null);

  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [historySale, setHistorySale] = useState(null);
  const [historyPayments, setHistoryPayments] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const toast = useToast();

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
      const { data, error } = await supabase
        .from("sales")
        .select(`
          id, date, total, credit, balance, payment_balance, branchs_id, is_refund,
          patients (id, pt_firstname, pt_lastname, pt_ci, pt_phone),
          branchs (name)
        `)
        .eq("is_refund", false)
        .order("date", { ascending: false })
        .order("id", { ascending: false })
        .limit(FETCH_CAP);

      if (error) throw error;
      setAllSales(data || []);
    } catch (err) {
      console.error("Error cargando créditos:", err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = allSales.filter((sale) => {
    if (onlyPending && Number(sale.credit) <= 0) return false;
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
  const totalPendiente = filtered.reduce((sum, s) => sum + Number(s.credit || 0), 0);

  // --- Registrar abono ---
  const openPay = (sale) => {
    setSelectedSale(sale);
    setAbonoAmount("");
    setPaymentMethod("");
    setReceiptResult(null);
    setIsPayOpen(true);
  };

  const handleRegisterAbono = async () => {
    const abono = parseFloat(abonoAmount) || 0;
    if (abono <= 0 || abono > Number(selectedSale.credit)) {
      toast({ title: "Monto inválido", description: "El abono debe ser mayor a 0 y no superar el saldo pendiente.", status: "warning", duration: 4000, isClosable: true });
      return;
    }
    if (!paymentMethod) {
      toast({ title: "Falta el método de pago", status: "warning", duration: 4000, isClosable: true });
      return;
    }

    setIsSaving(true);
    const previousBalance = Number(selectedSale.balance || 0);
    const newBalance = previousBalance + abono;
    const newCredit = Number(selectedSale.credit || 0) - abono;

    const { error } = await supabase
      .from("sales")
      .update({ balance: newBalance, credit: newCredit, payment_balance: paymentMethod })
      .eq("id", selectedSale.id);

    setIsSaving(false);

    if (error) {
      toast({ title: "Error", description: "No se pudo registrar el abono.", status: "error", duration: 4000, isClosable: true });
      return;
    }

    // Se guarda también como un pago individual con su fecha exacta — antes
    // solo se actualizaba el acumulado y se perdía el detalle de cada abono.
    const { error: paymentLogError } = await supabase.from("abono_payments").insert([{
      sale_id: selectedSale.id,
      patient_id: selectedSale.patients?.id || null,
      amount: abono,
      payment_method: paymentMethod,
    }]);
    if (paymentLogError) {
      console.error("Error guardando el historial del abono:", paymentLogError);
    }

    toast({ title: "Abono registrado", status: "success", duration: 3000, isClosable: true });
    fetchSales();

    // Se genera el comprobante automáticamente — si falla, el abono ya
    // quedó guardado igual, solo se avisa que el comprobante no se pudo hacer.
    setIsGeneratingReceipt(true);
    try {
      const { pdfUrl } = await generateReceiptPDF({
        saleId: selectedSale.id,
        patientName: `${selectedSale.patients?.pt_firstname || ""} ${selectedSale.patients?.pt_lastname || ""}`.trim(),
        patientCi: selectedSale.patients?.pt_ci,
        branchName: selectedSale.branchs?.name,
        saleTotal: selectedSale.total,
        previousBalance,
        abonoToday: abono,
        newBalance,
        newCredit,
        paymentMethod,
      });
      setReceiptResult({ pdfUrl, abono, newBalance, newCredit });
    } catch (err) {
      console.error("Error generando comprobante:", err);
      toast({
        title: "El abono se guardó, pero el comprobante falló",
        description: "Puedes seguir usando el sistema normalmente; el pago ya quedó registrado.",
        status: "warning",
        duration: 6000,
        isClosable: true,
      });
    } finally {
      setIsGeneratingReceipt(false);
    }
  };

  const handleSendReceiptWhatsApp = () => {
    if (!receiptResult?.pdfUrl || !selectedSale?.patients?.pt_phone) return;
    const cleanPhone = selectedSale.patients.pt_phone.replace(/\D/g, "");
    const mensaje = `Hola ${selectedSale.patients.pt_firstname}, aquí tienes tu comprobante de abono de ${formatMoney(receiptResult.abono)}. Tu saldo pendiente ahora es ${formatMoney(receiptResult.newCredit)}.\n\n${receiptResult.pdfUrl}`;
    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(mensaje)}`, "_blank");
  };

  // --- Recordatorio por WhatsApp ---
  const buildReminderMessage = (sale) => {
    return defaultReminderTemplate
      .replace("{nombre}", sale.patients?.pt_firstname || "")
      .replace("{saldo}", formatMoney(sale.credit))
      .replace("{sucursal}", sale.branchs?.name || "nuestra óptica")
      .replace("{fecha}", sale.date ? new Date(sale.date).toLocaleDateString("es-EC") : "");
  };

  const openReminder = (sale) => {
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

  // --- Historial de abonos de una venta ---
  const openHistory = async (sale) => {
    setHistorySale(sale);
    setIsHistoryOpen(true);
    setLoadingHistory(true);
    const { data, error } = await supabase
      .from("abono_payments")
      .select("id, amount, payment_method, paid_at")
      .eq("sale_id", sale.id)
      .order("paid_at", { ascending: false });
    if (!error) setHistoryPayments(data || []);
    setLoadingHistory(false);
  };

  const cardBg = useColorModeValue("white", "gray.700");
  const inputBg = useColorModeValue("gray.50", "gray.700");
  const borderColor = useColorModeValue("gray.200", "gray.600");
  const subtitleColor = useColorModeValue("gray.500", "gray.400");
  const sectionIconBg = useColorModeValue("#E6FBF6", "rgba(0,168,142,0.15)");
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
            <Flex justify="space-between" align="center" mb={5} flexWrap="wrap" gap={3}>
              <HStack spacing={3}>
                <Flex
                  align="center" justify="center" boxSize="44px" borderRadius="14px"
                  bgGradient="linear(to-br, #00A88E, #00786A)" color="white"
                  boxShadow="0 6px 16px -4px rgba(0,168,142,0.5)"
                >
                  <Icon as={CreditCard} boxSize="20px" />
                </Flex>
                <VStack align="start" spacing={0}>
                  <Heading size="lg" fontWeight="800" color={useColorModeValue("gray.800", "white")} letterSpacing="tight">
                    Créditos
                  </Heading>
                  <Text fontSize="xs" color={subtitleColor}>
                    {filtered.length} venta{filtered.length !== 1 ? "s" : ""} · {formatMoney(totalPendiente)} pendiente en total
                  </Text>
                </VStack>
              </HStack>
              <Button
                size="sm"
                variant={onlyPending ? "solid" : "outline"}
                bg={onlyPending ? ACCENT : "transparent"}
                color={onlyPending ? "white" : ACCENT}
                borderColor={ACCENT}
                _hover={{ bg: onlyPending ? "#00967f" : sectionIconBg }}
                borderRadius="full"
                onClick={() => { setOnlyPending((v) => !v); setPage(1); }}
              >
                {onlyPending ? "Mostrando solo con saldo" : "Mostrando todas"}
              </Button>
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
                No se encontraron ventas{onlyPending ? " con saldo pendiente" : ""}{search ? ` para "${search}"` : ""}.
              </Text>
            ) : (
              <>
                <Box overflowX="auto" borderRadius="14px" border={`1px solid ${borderColor}`}>
                  <Table variant="simple" size="sm">
                    <Thead>
                      <Tr>
                        <Th color={subtitleColor}>Paciente</Th>
                        <Th color={subtitleColor}>Sucursal</Th>
                        <Th color={subtitleColor} textAlign="right">Total</Th>
                        <Th color={subtitleColor} textAlign="right">Abono</Th>
                        <Th color={subtitleColor} textAlign="right">Saldo</Th>
                        <Th color={subtitleColor} textAlign="right">Acciones</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {pageItems.map((sale) => (
                        <Tr key={sale.id} _hover={{ bg: rowHoverBg }}>
                          <Td>
                            <Text fontWeight="semibold">{sale.patients?.pt_firstname} {sale.patients?.pt_lastname}</Text>
                            <Text fontSize="xs" color={subtitleColor}>{sale.date ? new Date(sale.date).toLocaleDateString("es-EC") : "—"}</Text>
                          </Td>
                          <Td>{sale.branchs?.name || "—"}</Td>
                          <Td textAlign="right" fontWeight="semibold">{formatMoney(sale.total)}</Td>
                          <Td textAlign="right" color={subtitleColor}>{formatMoney(sale.balance)}</Td>
                          <Td textAlign="right">
                            <Badge colorScheme={Number(sale.credit) > 0 ? "orange" : "teal"} borderRadius="full" px={2}>
                              {formatMoney(sale.credit)}
                            </Badge>
                          </Td>
                          <Td textAlign="right">
                            <HStack justify="flex-end" spacing={1}>
                              <IconButton
                                icon={<History size={15} />}
                                size="sm"
                                variant="ghost"
                                colorScheme="blue"
                                aria-label="Ver historial de abonos"
                                title="Ver historial de abonos"
                                onClick={() => openHistory(sale)}
                              />
                              {Number(sale.credit) > 0 && sale.patients?.pt_phone && (
                                <IconButton
                                  icon={<MessageCircle size={15} />}
                                  size="sm"
                                  variant="ghost"
                                  colorScheme="green"
                                  aria-label="Recordar por WhatsApp"
                                  title="Recordar saldo por WhatsApp"
                                  onClick={() => openReminder(sale)}
                                />
                              )}
                              {Number(sale.credit) > 0 && (
                                <IconButton
                                  icon={<DollarSign size={15} />}
                                  size="sm"
                                  variant="ghost"
                                  colorScheme="teal"
                                  aria-label="Registrar abono"
                                  title="Registrar abono"
                                  onClick={() => openPay(sale)}
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

      {/* Modal: registrar abono */}
      <Modal isOpen={isPayOpen} onClose={() => setIsPayOpen(false)} isCentered size="sm">
        <ModalOverlay />
        <ModalContent bg={cardBg} borderRadius="20px">
          <ModalHeader fontSize="md">
            <HStack>
              <Icon as={DollarSign} color={ACCENT} />
              <Text>Registrar abono</Text>
            </HStack>
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            {selectedSale && !receiptResult && (
              <VStack align="stretch" spacing={4}>
                <Box>
                  <HStack spacing={2} mb={1}>
                    <Icon as={User} boxSize="14px" color={subtitleColor} />
                    <Text fontWeight="semibold">{selectedSale.patients?.pt_firstname} {selectedSale.patients?.pt_lastname}</Text>
                  </HStack>
                  <Text fontSize="sm" color={subtitleColor}>Saldo pendiente: <b>{formatMoney(selectedSale.credit)}</b></Text>
                </Box>
                <FormControl>
                  <FormLabel fontSize="sm">Monto del abono</FormLabel>
                  <Input
                    type="number"
                    value={abonoAmount}
                    onChange={(e) => setAbonoAmount(e.target.value)}
                    placeholder="0.00"
                    borderRadius="10px"
                    bg={inputBg}
                    borderColor={borderColor}
                    _focus={{ borderColor: ACCENT, boxShadow: `0 0 0 1px ${ACCENT}` }}
                  />
                </FormControl>
                <FormControl>
                  <FormLabel fontSize="sm">Método de pago</FormLabel>
                  <Select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    placeholder="Seleccione"
                    borderRadius="10px"
                    bg={inputBg}
                    borderColor={borderColor}
                    _focus={{ borderColor: ACCENT, boxShadow: `0 0 0 1px ${ACCENT}` }}
                  >
                    <option value="efectivo">Efectivo</option>
                    <option value="datafast">Datafast</option>
                    <option value="transferencia">Transferencia</option>
                  </Select>
                </FormControl>
              </VStack>
            )}

            {isGeneratingReceipt && (
              <VStack py={6} spacing={3}>
                <Spinner color={ACCENT} />
                <Text fontSize="sm" color={subtitleColor}>Generando comprobante...</Text>
              </VStack>
            )}

            {receiptResult && !isGeneratingReceipt && (
              <VStack align="stretch" spacing={4}>
                <Box p={4} borderRadius="14px" bg={sectionIconBg} textAlign="center">
                  <Icon as={DollarSign} boxSize="24px" color={ACCENT} mb={1} />
                  <Text fontWeight="bold" color={ACCENT}>Abono registrado</Text>
                  <Text fontSize="sm" color={subtitleColor} mt={1}>
                    {formatMoney(receiptResult.abono)} recibidos · Nuevo saldo: <b>{formatMoney(receiptResult.newCredit)}</b>
                  </Text>
                </Box>
                {receiptResult.pdfUrl ? (
                  <VStack spacing={2}>
                    <Button
                      as="a"
                      href={receiptResult.pdfUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      size="sm"
                      variant="outline"
                      colorScheme="teal"
                      w="full"
                    >
                      Ver comprobante
                    </Button>
                    {selectedSale?.patients?.pt_phone && (
                      <Button
                        size="sm"
                        colorScheme="green"
                        leftIcon={<MessageCircle size={15} />}
                        w="full"
                        onClick={handleSendReceiptWhatsApp}
                      >
                        Enviar comprobante por WhatsApp
                      </Button>
                    )}
                  </VStack>
                ) : (
                  <Text fontSize="xs" color={subtitleColor} textAlign="center">
                    El abono se guardó, pero no se pudo generar el comprobante.
                  </Text>
                )}
              </VStack>
            )}
          </ModalBody>
          <ModalFooter gap={2}>
            {!receiptResult ? (
              <>
                <Button variant="ghost" size="sm" onClick={() => setIsPayOpen(false)}>Cancelar</Button>
                <Button size="sm" bg={ACCENT} color="white" _hover={{ bg: "#00967f" }} onClick={handleRegisterAbono} isLoading={isSaving || isGeneratingReceipt}>
                  Registrar
                </Button>
              </>
            ) : (
              <Button size="sm" variant="outline" w="full" onClick={() => setIsPayOpen(false)}>
                Cerrar
              </Button>
            )}
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Modal: recordatorio por WhatsApp */}
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

      {/* Modal: historial de abonos */}
      <Modal isOpen={isHistoryOpen} onClose={() => setIsHistoryOpen(false)} isCentered size="md">
        <ModalOverlay />
        <ModalContent bg={cardBg} borderRadius="20px">
          <ModalHeader fontSize="md">
            <HStack>
              <Icon as={History} color="blue.400" />
              <Text>Historial de abonos</Text>
            </HStack>
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            {historySale && (
              <>
                <HStack spacing={2} mb={1}>
                  <Icon as={User} boxSize="14px" color={subtitleColor} />
                  <Text fontWeight="semibold">
                    {historySale.patients?.pt_firstname} {historySale.patients?.pt_lastname}
                  </Text>
                </HStack>
                <Text fontSize="xs" color={subtitleColor} mb={4}>Venta #{historySale.id} · Total {formatMoney(historySale.total)}</Text>

                {/* Barra de progreso: cuánto de la compra ya está pagado */}
                {(() => {
                  const total = Number(historySale.total) || 0;
                  const paid = Number(historySale.balance) || 0;
                  const pct = total > 0 ? Math.min(100, Math.round((paid / total) * 100)) : 0;
                  return (
                    <Box mb={5}>
                      <Flex justify="space-between" mb={1}>
                        <Text fontSize="xs" color={subtitleColor}>Pagado: {formatMoney(paid)}</Text>
                        <Text fontSize="xs" fontWeight="bold" color={pct >= 100 ? ACCENT : "orange.400"}>{pct}%</Text>
                      </Flex>
                      <Box w="100%" h="10px" borderRadius="full" bg={inputBg} overflow="hidden">
                        <Box
                          h="100%"
                          w={`${pct}%`}
                          bgGradient="linear(to-r, #00A88E, #2DD4BF)"
                          borderRadius="full"
                          transition="width 0.4s ease"
                        />
                      </Box>
                      <Text fontSize="xs" color={subtitleColor} mt={1}>
                        {pct >= 100 ? "Cuenta saldada 🎉" : `Faltan ${formatMoney(historySale.credit)}`}
                      </Text>
                    </Box>
                  );
                })()}

                <Text fontSize="xs" fontWeight="bold" color={subtitleColor} textTransform="uppercase" letterSpacing="wide" mb={2}>
                  Pagos registrados
                </Text>

                {loadingHistory ? (
                  <Flex justify="center" py={8}>
                    <Spinner color={ACCENT} size="sm" />
                  </Flex>
                ) : historyPayments.length === 0 ? (
                  <Text fontSize="sm" color={subtitleColor} textAlign="center" py={6}>
                    Todavía no hay abonos individuales registrados para esta venta.
                    {Number(historySale.balance) > 0 && " (El abono inicial se registró antes de activar este historial.)"}
                  </Text>
                ) : (
                  <VStack align="stretch" spacing={0} maxH="260px" overflowY="auto" pr={1}>
                    {historyPayments.map((p, idx) => (
                      <HStack key={p.id} align="flex-start" spacing={3} position="relative" pb={4}>
                        <VStack spacing={0} align="center">
                          <Box boxSize="10px" borderRadius="full" bg={ACCENT} mt="4px" flexShrink={0} />
                          {idx < historyPayments.length - 1 && (
                            <Box w="2px" flex="1" bg={borderColor} minH="30px" />
                          )}
                        </VStack>
                        <Box flex="1" pb={1}>
                          <Flex justify="space-between" align="center">
                            <Text fontWeight="bold" color={ACCENT}>{formatMoney(p.amount)}</Text>
                            <Text fontSize="xs" color={subtitleColor}>
                              {new Date(p.paid_at).toLocaleDateString("es-EC", { day: "2-digit", month: "short", year: "numeric" })}
                            </Text>
                          </Flex>
                          <HStack spacing={1} mt={0.5}>
                            <Icon as={Calendar} boxSize="10px" color={subtitleColor} />
                            <Text fontSize="xs" color={subtitleColor} textTransform="capitalize">
                              {p.payment_method || "—"} · {new Date(p.paid_at).toLocaleTimeString("es-EC", { hour: "2-digit", minute: "2-digit" })}
                            </Text>
                          </HStack>
                        </Box>
                      </HStack>
                    ))}
                  </VStack>
                )}
              </>
            )}
          </ModalBody>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default Balance;
