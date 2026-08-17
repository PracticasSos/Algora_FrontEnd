import { useEffect, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { supabase } from "../../api/supabase";
import {
  Box, Container, Heading, Text, Flex, HStack, VStack, Icon, Badge, Spinner,
  useColorModeValue, Button, SimpleGrid, useToast, Table, Thead, Tbody, Tr, Th, Td,
  Modal, ModalOverlay, ModalContent, ModalHeader, ModalCloseButton, ModalBody, ModalFooter,
  RadioGroup, Radio, Input, Select,
} from "@chakra-ui/react";
import { ArrowLeft, PackageCheck, User, Package, CreditCard, Eye, MessageCircle, PenTool, DollarSign } from "lucide-react";
import SmartHeader from "../header/SmartHeader";
import SignaturePadComponent from "./Sales/SignaturePadComponent";
import { generatePickupReceiptPDF } from "./receipts/pickupReceiptGenerator.js";
import { useAuth } from "../AuthContext";

const ACCENT = "#00A88E";

const formatMoney = (value) => {
  const n = parseFloat(value);
  if (isNaN(n)) return "$0.00";
  return `$${n.toLocaleString("es-EC", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const measureFields = [
  { label: "Esfera", key: "sphere" },
  { label: "Cilindro", key: "cylinder" },
  { label: "Eje", key: "axis" },
  { label: "Prisma", key: "prism" },
  { label: "ADD", key: "add" },
  { label: "AV VL", key: "av_vl" },
  { label: "AV VP", key: "av_vp" },
  { label: "DNP", key: "dnp" },
  { label: "ALT", key: "alt" },
];

const Retreats = () => {
  const { saleId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { user } = useAuth();

  const [salesData, setSalesData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [signature, setSignature] = useState(null);
  const [isCompleting, setIsCompleting] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [receiptResult, setReceiptResult] = useState(null);

  // --- Modal de confirmación de retiro + pago opcional ---
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [paymentChoice, setPaymentChoice] = useState("none"); // "none" | "partial" | "full"
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");

  useEffect(() => {
    if (saleId) fetchSale();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [saleId]);

  const fetchSale = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("sales")
        .select(`
          *,
          patients (id, pt_firstname, pt_lastname, pt_ci, pt_phone),
          rx_final:measure_id (*),
          inventario:inventario_id (brand),
          lens:lens_id (lens_type),
          branchs:branchs_id (name)
        `)
        .eq("id", saleId)
        .single();
      if (error) throw error;
      setSalesData(data);
    } catch (err) {
      console.error("Error cargando la venta:", err);
      toast({ title: "Error", description: "No se pudo cargar la venta.", status: "error", duration: 4000, isClosable: true });
    } finally {
      setLoading(false);
    }
  };

  const openConfirmModal = () => {
    setPaymentChoice("none");
    setPaymentAmount("");
    setPaymentMethod("");
    setIsConfirmOpen(true);
  };

  const handleCompletePickup = async () => {
    if (!salesData) return;

    const credit = Number(salesData.credit) || 0;
    let paidNow = 0;

    if (paymentChoice === "full") {
      paidNow = credit;
    } else if (paymentChoice === "partial") {
      paidNow = Math.min(credit, Math.max(0, Number(paymentAmount) || 0));
      if (paidNow <= 0) {
        toast({ title: "Monto inválido", description: "Escribe un abono mayor a 0.", status: "warning", duration: 4000, isClosable: true });
        return;
      }
    }
    if ((paymentChoice === "full" || paymentChoice === "partial") && !paymentMethod) {
      toast({ title: "Falta el método de pago", status: "warning", duration: 4000, isClosable: true });
      return;
    }

    setIsCompleting(true);
    setIsConfirmOpen(false);

    // Si se recibió algo de dinero en este momento, se actualiza el saldo
    // ANTES de marcar el retiro, para que el comprobante ya salga con los
    // números correctos.
    let newBalance = Number(salesData.balance) || 0;
    let newCredit = credit;
    if (paidNow > 0) {
      newBalance += paidNow;
      newCredit = Math.max(0, credit - paidNow);

      const { error: payError } = await supabase
        .from("sales")
        .update({ balance: newBalance, credit: newCredit, payment_balance: paymentMethod })
        .eq("id", salesData.id);

      if (payError) {
        setIsCompleting(false);
        toast({ title: "Error", description: "No se pudo registrar el pago.", status: "error", duration: 5000, isClosable: true });
        return;
      }

      const userName = user ? `${user.firstname || ""} ${user.lastname || ""}`.trim() || user.email : "Desconocido";
      await supabase.from("abono_payments").insert([{
        sale_id: salesData.id,
        patient_id: salesData.patients?.id || null,
        amount: paidNow,
        payment_method: paymentMethod,
      }]);
      // Se deja registro de quién cobró, aparte del monto — útil para el
      // historial de abonos que ya se ve en Créditos.
      console.info(`Pago de ${paidNow} recibido en el retiro por ${userName}`);
    }

    // Retirar el producto y liquidar el saldo son cosas independientes —
    // si no se cobró nada aquí, el saldo pendiente se sigue manejando
    // aparte en Créditos, sin bloquear el retiro.
    const { error } = await supabase
      .from("sales")
      .update({ is_completed: true })
      .eq("id", salesData.id);

    if (error) {
      setIsCompleting(false);
      toast({ title: "Error", description: "No se pudo completar el retiro.", status: "error", duration: 4000, isClosable: true });
      return;
    }

    setSalesData((prev) => ({ ...prev, balance: newBalance, credit: newCredit, is_completed: true }));
    toast({ title: "Retiro completado", status: "success", duration: 3000, isClosable: true });
    setCompleted(true);

    try {
      const { pdfUrl } = await generatePickupReceiptPDF({
        saleId: salesData.id,
        patientName: `${salesData.patients?.pt_firstname || ""} ${salesData.patients?.pt_lastname || ""}`.trim(),
        patientCi: salesData.patients?.pt_ci,
        branchName: salesData.branchs?.name,
        frameName: salesData.inventario?.brand,
        lensName: salesData.lens?.lens_type,
        saleTotal: salesData.total,
        paidSoFar: newBalance,
        pendingBalance: newCredit,
        signatureDataUrl: signature,
      });
      setReceiptResult({ pdfUrl });

      // Se guarda el comprobante en la venta misma, para que quede visible
      // desde el Historial de Venta más adelante, no solo aquí.
      await supabase
        .from("sales")
        .update({ pickup_receipt_url: pdfUrl, pickup_completed_at: new Date().toISOString() })
        .eq("id", salesData.id);
    } catch (err) {
      console.error("Error generando comprobante de retiro:", err);
      toast({
        title: "El retiro se completó, pero el comprobante falló",
        description: "El retiro ya quedó registrado con normalidad.",
        status: "warning",
        duration: 6000,
        isClosable: true,
      });
    } finally {
      setIsCompleting(false);
    }
  };

  const handleSendReceipt = () => {
    if (!receiptResult?.pdfUrl || !salesData?.patients?.pt_phone) return;
    const cleanPhone = salesData.patients.pt_phone.replace(/\D/g, "");
    const mensaje = `Hola ${salesData.patients.pt_firstname}, gracias por retirar tu pedido 🎉. Aquí está tu comprobante de retiro:\n\n${receiptResult.pdfUrl}`;
    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(mensaje)}`, "_blank");
  };

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

  const InfoRow = ({ label, value }) => (
    <Box>
      <Text fontSize="xs" color={subtitleColor} mb={1}>{label}</Text>
      <Text fontSize="sm" fontWeight="medium">{value ?? "—"}</Text>
    </Box>
  );

  return (
    <Box minHeight="100vh" bgGradient={useColorModeValue("linear(to-br, gray.50, teal.50)", "linear(to-br, gray.900, #0d1f1c)")}>
      <SmartHeader moduleSpecificButton={null} />

      <Container maxW="1050px" py={8} px={{ base: 3, md: 6 }}>
        <Button size="sm" variant="ghost" leftIcon={<ArrowLeft size={16} />} mb={3} onClick={() => navigate("/retreats-patients")}>
          Volver a Retiros
        </Button>

        <Box
          borderRadius="24px"
          bg={cardBg}
          border={`1px solid ${borderColor}`}
          boxShadow={useColorModeValue("0 20px 45px -20px rgba(0,168,142,0.25)", "0 20px 45px -20px rgba(0,168,142,0.35)")}
          overflow="hidden"
        >
          <Box h="5px" bgGradient="linear(to-r, #00A88E, #2DD4BF, #00A88E)" />

          {loading ? (
            <Flex justify="center" py={16}><Spinner color={ACCENT} /></Flex>
          ) : !salesData ? (
            <Box p={8}><Text textAlign="center" color={subtitleColor}>No se encontró esta venta.</Text></Box>
          ) : (
            <Box p={{ base: 5, md: 8 }}>
              <HStack spacing={3} mb={6}>
                <Flex align="center" justify="center" boxSize="44px" borderRadius="14px" bgGradient="linear(to-br, #00A88E, #00786A)" color="white" boxShadow="0 6px 16px -4px rgba(0,168,142,0.5)">
                  <Icon as={PackageCheck} boxSize="20px" />
                </Flex>
                <VStack align="start" spacing={0}>
                  <Heading size="lg" fontWeight="800" color={useColorModeValue("gray.800", "white")} letterSpacing="tight">
                    {salesData.patients?.pt_firstname} {salesData.patients?.pt_lastname}
                  </Heading>
                  <Text fontSize="xs" color={subtitleColor}>Venta #{salesData.id} · {salesData.branchs?.name}</Text>
                </VStack>
                {salesData.is_completed && (
                  <Badge colorScheme="teal" borderRadius="full" px={3} py={1} ml="auto">Ya retirado</Badge>
                )}
              </HStack>

              <SectionTitle icon={Package}>Producto</SectionTitle>
              <SimpleGrid columns={{ base: 1, sm: 2 }} spacing={4} mb={6}>
                <InfoRow label="Armazón" value={salesData.inventario?.brand} />
                <InfoRow label="Luna" value={salesData.lens?.lens_type} />
              </SimpleGrid>

              {salesData.rx_final && (
                <>
                  <SectionTitle icon={Eye}>Rx Final</SectionTitle>
                  <Box overflowX="auto" mb={6}>
                    <Table size="sm" variant="simple" minW="700px">
                      <Thead>
                        <Tr>
                          <Th></Th>
                          {measureFields.map(({ label, key }) => <Th key={key} textAlign="center" whiteSpace="nowrap">{label}</Th>)}
                        </Tr>
                      </Thead>
                      <Tbody>
                        {["OD", "OI"].map((eye) => (
                          <Tr key={eye}>
                            <Td fontWeight="bold" color={ACCENT}>{eye}</Td>
                            {measureFields.map(({ key }) => (
                              <Td key={key} textAlign="center">
                                {salesData.rx_final[`${key}_${eye === "OD" ? "right" : "left"}`] || "—"}
                              </Td>
                            ))}
                          </Tr>
                        ))}
                      </Tbody>
                    </Table>
                  </Box>
                </>
              )}

              <SectionTitle icon={CreditCard}>Pago</SectionTitle>
              <SimpleGrid columns={{ base: 2, sm: 3 }} spacing={4} mb={6}>
                <Box p={4} borderRadius="14px" bg={inputBg} border={`1px solid ${borderColor}`} textAlign="center">
                  <Text fontSize="xs" color={subtitleColor} mb={1}>Total</Text>
                  <Text fontWeight="bold" color={ACCENT} fontSize="lg">{formatMoney(salesData.total)}</Text>
                </Box>
                <Box p={4} borderRadius="14px" bg={inputBg} border={`1px solid ${borderColor}`} textAlign="center">
                  <Text fontSize="xs" color={subtitleColor} mb={1}>Abonado</Text>
                  <Text fontWeight="bold" fontSize="lg">{formatMoney(salesData.balance)}</Text>
                </Box>
                <Box p={4} borderRadius="14px" bg={inputBg} border={`1px solid ${borderColor}`} textAlign="center">
                  <Text fontSize="xs" color={subtitleColor} mb={1}>Saldo pendiente</Text>
                  <Badge colorScheme={Number(salesData.credit) > 0 ? "orange" : "teal"} borderRadius="full" px={2} fontSize="sm">
                    {formatMoney(salesData.credit)}
                  </Badge>
                </Box>
              </SimpleGrid>

              {!salesData.is_completed && !completed && (
                <>
                  {Number(salesData.credit) > 0 && (
                    <Box mb={6} p={3} borderRadius="10px" bg="orange.50" border="1px solid" borderColor="orange.200">
                      <Text fontSize="xs" color="orange.700">
                        Este paciente todavía debe {formatMoney(salesData.credit)}. Puede retirar igual — el saldo se sigue gestionando aparte en <b>Créditos</b>, esto no lo bloquea.
                      </Text>
                    </Box>
                  )}

                  <SectionTitle icon={PenTool}>Firma de conformidad (opcional)</SectionTitle>
                  <Box mb={6} maxW="360px">
                    <SignaturePadComponent onSave={(dataUrl) => setSignature(dataUrl)} />
                  </Box>

                  <Button
                    bg={ACCENT}
                    color="white"
                    _hover={{ bg: "#00967f" }}
                    size="lg"
                    borderRadius="12px"
                    w="full"
                    onClick={openConfirmModal}
                    isLoading={isCompleting}
                    loadingText="Completando..."
                  >
                    Confirmar retiro
                  </Button>
                </>
              )}

              {(completed || salesData.is_completed) && (
                <Box p={4} borderRadius="14px" bg={sectionIconBg} textAlign="center">
                  <Icon as={PackageCheck} boxSize="24px" color={ACCENT} mb={1} />
                  <Text fontWeight="bold" color={ACCENT}>Producto entregado</Text>
                  {receiptResult?.pdfUrl && (
                    <VStack spacing={2} mt={3}>
                      <Button as="a" href={receiptResult.pdfUrl} target="_blank" rel="noopener noreferrer" size="sm" variant="outline" colorScheme="teal" w="full" maxW="280px">
                        Ver comprobante
                      </Button>
                      {salesData.patients?.pt_phone && (
                        <Button size="sm" colorScheme="green" leftIcon={<MessageCircle size={15} />} w="full" maxW="280px" onClick={handleSendReceipt}>
                          Enviar comprobante por WhatsApp
                        </Button>
                      )}
                    </VStack>
                  )}
                </Box>
              )}
            </Box>
          )}
        </Box>
      </Container>

      {/* Modal: confirmar retiro + pago opcional */}
      <Modal isOpen={isConfirmOpen} onClose={() => setIsConfirmOpen(false)} isCentered size="sm">
        <ModalOverlay />
        <ModalContent bg={cardBg} borderRadius="20px">
          <ModalHeader fontSize="md">
            <HStack>
              <Icon as={PackageCheck} color={ACCENT} />
              <Text>Confirmar retiro</Text>
            </HStack>
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Text fontSize="sm" mb={4}>
              ¿Confirmas que <b>{salesData?.patients?.pt_firstname} {salesData?.patients?.pt_lastname}</b> retira su pedido ahora?
            </Text>

            {Number(salesData?.credit) > 0 && (
              <Box p={3} borderRadius="12px" bg={inputBg} border={`1px solid ${borderColor}`} mb={2}>
                <Text fontSize="xs" color={subtitleColor} mb={2}>
                  Saldo pendiente: <b>{formatMoney(salesData?.credit)}</b> — ¿recibe algún pago en este momento?
                </Text>
                <RadioGroup value={paymentChoice} onChange={setPaymentChoice}>
                  <VStack align="stretch" spacing={2}>
                    <Radio value="none" colorScheme="teal">No, retira sin pagar (se gestiona en Créditos)</Radio>
                    <Radio value="full" colorScheme="teal">Sí, paga todo el saldo ({formatMoney(salesData?.credit)})</Radio>
                    <Radio value="partial" colorScheme="teal">Sí, hace un abono parcial</Radio>
                  </VStack>
                </RadioGroup>

                {paymentChoice === "partial" && (
                  <Input
                    type="number"
                    mt={2}
                    placeholder="Monto del abono"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    borderRadius="10px"
                    bg={cardBg}
                    borderColor={borderColor}
                    _focus={{ borderColor: ACCENT, boxShadow: `0 0 0 1px ${ACCENT}` }}
                  />
                )}

                {(paymentChoice === "full" || paymentChoice === "partial") && (
                  <Select
                    mt={2}
                    placeholder="Método de pago"
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    borderRadius="10px"
                    bg={cardBg}
                    borderColor={borderColor}
                    _focus={{ borderColor: ACCENT, boxShadow: `0 0 0 1px ${ACCENT}` }}
                  >
                    <option value="efectivo">Efectivo</option>
                    <option value="datafast">Datafast</option>
                    <option value="transferencia">Transferencia</option>
                  </Select>
                )}
              </Box>
            )}
          </ModalBody>
          <ModalFooter gap={2}>
            <Button variant="ghost" size="sm" onClick={() => setIsConfirmOpen(false)}>Cancelar</Button>
            <Button
              size="sm"
              bg={ACCENT}
              color="white"
              _hover={{ bg: "#00967f" }}
              onClick={handleCompletePickup}
              isLoading={isCompleting}
              leftIcon={<DollarSign size={14} />}
            >
              Confirmar retiro
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default Retreats;
