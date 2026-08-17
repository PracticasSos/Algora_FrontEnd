import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../../api/supabase";
import {
  Box, Container, Heading, Text, Flex, HStack, VStack, Icon, Badge, Spinner,
  useColorModeValue, Button, SimpleGrid, Input, FormControl, FormLabel, useToast,
  AlertDialog, AlertDialogOverlay, AlertDialogContent, AlertDialogHeader,
  AlertDialogBody, AlertDialogFooter, Image as ChakraImage,
} from "@chakra-ui/react";
import { ArrowLeft, ShoppingBag, User, CreditCard, FileText, MessageCircle, Package, Pencil, PackageCheck, FlaskConical, RotateCcw, AlertTriangle, Wrench, Camera, RefreshCw, X } from "lucide-react";
import SmartHeader from "../header/SmartHeader";
import { useAuth } from "../AuthContext";
import { generateContractPDF } from "./Sales/pdf/pdfGenerator.js";

const ACCENT = "#00A88E";

const formatMoney = (value) => {
  const n = parseFloat(value);
  if (isNaN(n)) return "$0.00";
  return `$${n.toLocaleString("es-EC", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const SaleDetail = () => {
  const { saleId, patientId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { user } = useAuth();
  const isAdmin = user?.role_id === 1;

  const [sale, setSale] = useState(null);
  const [isRevertingPickup, setIsRevertingPickup] = useState(false);
  const [isRevertConfirmOpen, setIsRevertConfirmOpen] = useState(false);
  const cancelRevertRef = useRef();
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // --- Edición de producto ---
  const [searchFrame, setSearchFrame] = useState("");
  const [frameResults, setFrameResults] = useState([]);
  const [searchLens, setSearchLens] = useState("");
  const [lensResults, setLensResults] = useState([]);
  const [editData, setEditData] = useState(null);

  // --- Tratamientos ---
  const [treatmentsCatalog, setTreatmentsCatalog] = useState([]);
  const [saleTreatments, setSaleTreatments] = useState([]);
  const [selectedTreatmentIds, setSelectedTreatmentIds] = useState([]);
  const [treatmentSearch, setTreatmentSearch] = useState("");
  const [isTreatmentFocused, setIsTreatmentFocused] = useState(false);

  // --- Foto de armazón (por si no se tomó al momento de vender) ---
  const [framePhotoFile, setFramePhotoFile] = useState(null);
  const [framePhotoPreview, setFramePhotoPreview] = useState(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  // --- Regenerar comprobante ---
  const [isRegeneratingPdf, setIsRegeneratingPdf] = useState(false);

  useEffect(() => {
    fetchSale();
    fetchTreatmentsCatalog();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [saleId]);

  const fetchTreatmentsCatalog = async () => {
    const { data, error } = await supabase.from("treatments").select("*").eq("active", true).order("name");
    if (!error) setTreatmentsCatalog(data || []);
  };

  const fetchSaleTreatments = async () => {
    const { data, error } = await supabase.from("sale_treatments").select("*").eq("sale_id", saleId);
    if (!error) setSaleTreatments(data || []);
  };

  const fetchSale = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("sales")
      .select(`
        *,
        patients (pt_firstname, pt_lastname, pt_ci, pt_phone),
        branchs (name, address),
        inventario (id, brand, price),
        lens:lens_id (id, lens_type, lens_price)
      `)
      .eq("id", saleId)
      .maybeSingle();

    if (error) {
      console.error("Error cargando la venta:", error);
    } else {
      setSale(data);
    }
    fetchSaleTreatments();
    setLoading(false);
  };

  const handleRevertPickup = async () => {
    setIsRevertConfirmOpen(false);
    setIsRevertingPickup(true);
    const { error } = await supabase
      .from("sales")
      .update({ is_completed: false, pickup_receipt_url: null, pickup_completed_at: null })
      .eq("id", saleId);
    setIsRevertingPickup(false);

    if (error) {
      toast({ title: "Error", description: "No se pudo revertir el retiro.", status: "error", duration: 5000, isClosable: true });
    } else {
      toast({ title: "Retiro revertido", description: "El producto vuelve a aparecer como pendiente en Retiros.", status: "success", duration: 4000, isClosable: true });
      fetchSale();
    }
  };

  const startEditing = () => {
    setEditData({
      inventario_id: sale.inventario_id,
      brand: sale.inventario?.brand || "",
      p_frame: sale.inventario?.price || 0,
      lens_id: sale.lens_id,
      lens_type: sale.lens?.lens_type || "",
      p_lens: sale.lens?.lens_price || 0,
      discount_frame: sale.discount_frame || 0,
      discount_lens: sale.discount_lens || 0,
      balance: sale.balance || 0,
    });
    setSearchFrame(sale.inventario?.brand || "");
    setSearchLens(sale.lens?.lens_type || "");
    setSelectedTreatmentIds(saleTreatments.map((t) => t.treatment_id));
    setFramePhotoFile(null);
    setFramePhotoPreview(sale.frame_photo_url || null);
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setIsEditing(false);
    setEditData(null);
    setFrameResults([]);
    setLensResults([]);
    setFramePhotoFile(null);
    setFramePhotoPreview(null);
    setTreatmentSearch("");
  };

  const handleFrameSearch = async (value) => {
    setSearchFrame(value);
    if (!value.trim()) { setFrameResults([]); return; }
    const { data } = await supabase
      .from("inventario")
      .select("id, brand, price, quantity")
      .ilike("brand", `%${value}%`)
      .gt("quantity", 0)
      .limit(8);
    setFrameResults(data || []);
  };

  const handleLensSearch = async (value) => {
    setSearchLens(value);
    if (!value.trim()) { setLensResults([]); return; }
    const { data } = await supabase
      .from("lens")
      .select("id, lens_type, lens_price")
      .ilike("lens_type", `%${value}%`)
      .limit(8);
    setLensResults(data || []);
  };

  const selectFrame = (item) => {
    setEditData((prev) => ({ ...prev, inventario_id: item.id, brand: item.brand, p_frame: item.price || 0 }));
    setSearchFrame(item.brand);
    setFrameResults([]);
  };

  const selectLens = (item) => {
    setEditData((prev) => ({ ...prev, lens_id: item.id, lens_type: item.lens_type, p_lens: item.lens_price || 0 }));
    setSearchLens(item.lens_type);
    setLensResults([]);
  };

  // Mismo cálculo correcto que ya usamos en Ventas: el total SIEMPRE se
  // recalcula sumando los montos con descuento aplicado (si hay descuento),
  // nunca se queda pegado en un total viejo.
  const computeTotals = () => {
    const frameDiscounted = editData.discount_frame > 0
      ? editData.p_frame * (1 - editData.discount_frame / 100)
      : editData.p_frame;
    const lensDiscounted = editData.discount_lens > 0
      ? editData.p_lens * (1 - editData.discount_lens / 100)
      : editData.p_lens;
    return {
      total_p_frame: editData.discount_frame > 0 ? frameDiscounted : null,
      total_p_lens: editData.discount_lens > 0 ? lensDiscounted : null,
      total: frameDiscounted + lensDiscounted,
    };
  };

  const handleSave = async () => {
    setIsSaving(true);
    const { total_p_frame, total_p_lens, total } = computeTotals();
    // El abono ahora también es editable (solo admin) — por si se
    // equivocaron al registrarlo. El saldo pendiente siempre se recalcula
    // a partir de ESE abono, no del que tenía guardado originalmente.
    const newBalance = Math.max(0, Number(editData.balance) || 0);
    const newCredit = Math.max(0, total - newBalance);

    // Si se eligió una foto nueva del armazón, se sube primero.
    let framePhotoUrl = sale.frame_photo_url || null;
    if (framePhotoFile) {
      setIsUploadingPhoto(true);
      const ext = framePhotoFile.name.split(".").pop();
      const fileName = `frame-${saleId}-${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage.from("sales").upload(fileName, framePhotoFile, { upsert: true });
      setIsUploadingPhoto(false);
      if (uploadError) {
        setIsSaving(false);
        toast({ title: "Error subiendo la foto", description: uploadError.message, status: "error", duration: 5000, isClosable: true });
        return;
      }
      const { data: urlData } = supabase.storage.from("sales").getPublicUrl(fileName);
      framePhotoUrl = urlData?.publicUrl || framePhotoUrl;
    }

    const { error } = await supabase
      .from("sales")
      .update({
        inventario_id: editData.inventario_id,
        lens_id: editData.lens_id,
        discount_frame: editData.discount_frame,
        discount_lens: editData.discount_lens,
        total_p_frame,
        total_p_lens,
        total,
        balance: newBalance,
        credit: newCredit,
        frame_photo_url: framePhotoUrl,
      })
      .eq("id", saleId);

    if (error) {
      setIsSaving(false);
      toast({ title: "Error", description: "No se pudo actualizar la venta.", status: "error", duration: 4000, isClosable: true });
      return;
    }

    // Tratamientos: se reemplazan por completo (borra los que había, mete
    // los que quedaron marcados) — más simple y seguro que comparar cuáles
    // cambiaron uno por uno.
    const { error: deleteTreatmentsError } = await supabase.from("sale_treatments").delete().eq("sale_id", saleId);
    if (deleteTreatmentsError) {
      console.error("Error limpiando tratamientos:", deleteTreatmentsError);
    }
    if (selectedTreatmentIds.length > 0) {
      const rows = selectedTreatmentIds.map((tId) => {
        const t = treatmentsCatalog.find((tr) => tr.id === tId);
        return {
          sale_id: saleId,
          treatment_id: tId,
          treatment_name: t?.name || "Tratamiento",
          price: Number(t?.price) || 0,
        };
      });
      const { error: insertTreatmentsError } = await supabase.from("sale_treatments").insert(rows);
      if (insertTreatmentsError) {
        console.error("Error guardando tratamientos:", insertTreatmentsError);
      }
    }

    setIsSaving(false);
    toast({ title: "Venta actualizada", status: "success", duration: 3000, isClosable: true });
    setIsEditing(false);
    fetchSale();
  };

  const handleRegeneratePdf = async () => {
    setIsRegeneratingPdf(true);
    try {
      let measureData = null;
      if (sale.measure_id) {
        const { data } = await supabase.from("rx_final").select("*").eq("id", sale.measure_id).single();
        measureData = data;
      }

      const patientData = {
        pt_firstname: sale.patients?.pt_firstname,
        pt_lastname: sale.patients?.pt_lastname,
        pt_phone: sale.patients?.pt_phone,
      };
      const branchData = { name: sale.branchs?.name, address: sale.branchs?.address };

      const formData = {
        id: sale.id,
        date: sale.date,
        // Se usa el precio que quedó GUARDADO en la venta (sale.p_frame /
        // sale.p_lens) — no el precio actual del inventario, que puede
        // haber cambiado desde que se hizo esta venta.
        p_frame: sale.p_frame ?? sale.inventario?.price ?? 0,
        discount_frame: sale.discount_frame || 0,
        total_p_frame: sale.total_p_frame ?? sale.p_frame ?? sale.inventario?.price ?? 0,
        p_lens: sale.p_lens ?? sale.lens?.lens_price ?? 0,
        discount_lens: sale.discount_lens || 0,
        total_p_lens: sale.total_p_lens ?? sale.p_lens ?? sale.lens?.lens_price ?? 0,
        total: sale.total,
        credit: sale.credit,
        balance: sale.balance,
        payment_in: sale.payment_in,
        delivery_time: sale.delivery_time,
        branch_name: sale.branchs?.name,
        observation_img: sale.frame_photo_url || null,
        // Se regenera con los términos ya aceptados — la venta ya se
        // había completado con esa confirmación la primera vez.
        termsAccepted: true,
      };

      const result = await generateContractPDF(formData, measureData, patientData, branchData);
      toast({ title: "Comprobante regenerado", description: "El PDF se actualizó con los datos más recientes.", status: "success", duration: 4000, isClosable: true });
      fetchSale();
    } catch (err) {
      console.error("Error regenerando el comprobante:", err);
      toast({ title: "Error", description: err.message || "No se pudo regenerar el comprobante.", status: "error", duration: 6000, isClosable: true });
    } finally {
      setIsRegeneratingPdf(false);
    }
  };

  const handleSendWhatsApp = () => {
    if (!sale?.pdf_url || !sale?.patients?.pt_phone) return;
    const mensaje = `Hola ${sale.patients.pt_firstname}, aquí está su comprobante de venta: ${sale.pdf_url}`;
    window.open(`https://wa.me/${sale.patients.pt_phone}?text=${encodeURIComponent(mensaje)}`, "_blank");
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

  const previewTotals = isEditing && editData ? computeTotals() : null;

  return (
    <Box minHeight="100vh" bgGradient={useColorModeValue("linear(to-br, gray.50, teal.50)", "linear(to-br, gray.900, #0d1f1c)")}>
      <SmartHeader moduleSpecificButton={null} />

      <Container maxW="1050px" py={8} px={{ base: 3, md: 6 }}>
        <Button
          size="sm"
          variant="ghost"
          leftIcon={<ArrowLeft size={16} />}
          mb={3}
          onClick={() => navigate(patientId ? `/history-clinic/patient-history/${patientId}` : "/history-clinic")}
        >
          Volver
        </Button>

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

          {loading ? (
            <Flex justify="center" py={16}>
              <Spinner color={ACCENT} />
            </Flex>
          ) : !sale ? (
            <Box p={8}>
              <Text textAlign="center" color={subtitleColor}>No se encontró esta venta.</Text>
            </Box>
          ) : (
            <Box p={{ base: 5, md: 8 }}>
              <Flex justify="space-between" align="center" mb={6} flexWrap="wrap" gap={3}>
                <HStack spacing={3}>
                  <Flex
                    align="center" justify="center" boxSize="44px" borderRadius="14px"
                    bgGradient="linear(to-br, #00A88E, #00786A)" color="white"
                    boxShadow="0 6px 16px -4px rgba(0,168,142,0.5)"
                  >
                    <Icon as={ShoppingBag} boxSize="20px" />
                  </Flex>
                  <VStack align="start" spacing={0}>
                    <Heading size="lg" fontWeight="800" color={useColorModeValue("gray.800", "white")} letterSpacing="tight">
                      Venta #{sale.id}
                    </Heading>
                    <Text fontSize="xs" color={subtitleColor}>
                      {sale.date ? new Date(sale.date).toLocaleDateString("es-EC", { day: "2-digit", month: "long", year: "numeric" }) : "—"}
                    </Text>
                  </VStack>
                </HStack>
                <HStack>
                  {sale.is_refund && <Badge colorScheme="red" borderRadius="full" px={3} py={1}>Reembolsada</Badge>}
                  <Button
                    size="sm"
                    variant="outline"
                    colorScheme="purple"
                    leftIcon={<FlaskConical size={14} />}
                    onClick={() => navigate(`/order-laboratory-list/laboratory-order/${sale.patient_id}/${sale.id}`, { state: { patientData: sale.patients } })}
                  >
                    Crear Orden de Laboratorio
                  </Button>
                  {isAdmin && !isEditing && (
                    <Button size="sm" variant="outline" colorScheme="teal" leftIcon={<Pencil size={14} />} onClick={startEditing}>
                      Editar venta
                    </Button>
                  )}
                </HStack>
              </Flex>

              <SectionTitle icon={User}>Paciente y sucursal</SectionTitle>
              <SimpleGrid columns={{ base: 1, sm: 2 }} spacing={4} mb={6}>
                <InfoRow label="Paciente" value={`${sale.patients?.pt_firstname || ""} ${sale.patients?.pt_lastname || ""}`} />
                <InfoRow label="C.I." value={sale.patients?.pt_ci} />
                <InfoRow label="Teléfono" value={sale.patients?.pt_phone} />
                <InfoRow label="Sucursal" value={sale.branchs?.name} />
              </SimpleGrid>

              <SectionTitle icon={Package}>Producto</SectionTitle>

              {!isEditing ? (
                <SimpleGrid columns={{ base: 1, sm: 2 }} spacing={4} mb={6}>
                  <Box p={4} borderRadius="14px" bg={inputBg} border={`1px solid ${borderColor}`}>
                    <Text fontSize="xs" color={subtitleColor} mb={1}>Armazón</Text>
                    <Text fontWeight="semibold">{sale.inventario?.brand || "No registrado"}</Text>
                    <Text fontSize="sm" color={subtitleColor}>
                      {sale.discount_frame > 0
                        ? <>{formatMoney(sale.p_frame ?? sale.inventario?.price)} → <Text as="span" color={ACCENT} fontWeight="bold">{formatMoney(sale.total_p_frame)}</Text> ({sale.discount_frame}% desc.)</>
                        : formatMoney(sale.p_frame ?? sale.inventario?.price)}
                    </Text>
                    {sale.frame_photo_url && (
                      <ChakraImage src={sale.frame_photo_url} alt="Armazón" mt={2} boxSize="60px" objectFit="cover" borderRadius="8px" border={`1px solid ${borderColor}`} />
                    )}
                  </Box>
                  <Box p={4} borderRadius="14px" bg={inputBg} border={`1px solid ${borderColor}`}>
                    <Text fontSize="xs" color={subtitleColor} mb={1}>Luna</Text>
                    <Text fontWeight="semibold">{sale.lens?.lens_type || "No registrada"}</Text>
                    <Text fontSize="sm" color={subtitleColor}>
                      {sale.discount_lens > 0
                        ? <>{formatMoney(sale.p_lens ?? sale.lens?.lens_price)} → <Text as="span" color={ACCENT} fontWeight="bold">{formatMoney(sale.total_p_lens)}</Text> ({sale.discount_lens}% desc.)</>
                        : formatMoney(sale.p_lens ?? sale.lens?.lens_price)}
                    </Text>
                  </Box>
                  {saleTreatments.length > 0 && (
                    <Box p={4} borderRadius="14px" bg={inputBg} border={`1px solid ${borderColor}`} gridColumn={{ sm: "span 2" }}>
                      <Text fontSize="xs" color={subtitleColor} mb={2}>Tratamientos</Text>
                      <HStack flexWrap="wrap" spacing={2}>
                        {saleTreatments.map((t) => (
                          <Badge key={t.id} colorScheme="teal" borderRadius="full" px={2} py={1}>
                            {t.treatment_name} · {formatMoney(t.price)}
                          </Badge>
                        ))}
                      </HStack>
                    </Box>
                  )}
                </SimpleGrid>
              ) : (
                <Box p={4} borderRadius="14px" bg={inputBg} border={`1px solid ${ACCENT}`} mb={6}>
                  <SimpleGrid columns={{ base: 1, sm: 2 }} spacing={4} mb={4}>
                    <FormControl position="relative">
                      <FormLabel fontSize="xs" color={subtitleColor}>Armazón</FormLabel>
                      <Input
                        value={searchFrame}
                        onChange={(e) => handleFrameSearch(e.target.value)}
                        placeholder="Buscar armazón..."
                        size="sm"
                        borderRadius="10px"
                        bg={cardBg}
                        borderColor={borderColor}
                      />
                      {frameResults.length > 0 && (
                        <Box position="absolute" zIndex={10} w="100%" mt={1} bg={cardBg} border={`1px solid ${borderColor}`} borderRadius="10px" boxShadow="md" maxH="160px" overflowY="auto">
                          {frameResults.map((item) => (
                            <Box key={item.id} p={2} _hover={{ bg: sectionIconBg, cursor: "pointer" }} onClick={() => selectFrame(item)}>
                              <Text fontSize="sm">{item.brand} — {formatMoney(item.price)}</Text>
                            </Box>
                          ))}
                        </Box>
                      )}
                      <Text fontSize="xs" color={subtitleColor} mt={1}>Precio base: {formatMoney(editData.p_frame)}</Text>
                    </FormControl>
                    <FormControl>
                      <FormLabel fontSize="xs" color={subtitleColor}>Descuento armazón (%)</FormLabel>
                      <Input
                        type="number"
                        value={editData.discount_frame}
                        onChange={(e) => setEditData((prev) => ({ ...prev, discount_frame: Number(e.target.value) || 0 }))}
                        size="sm"
                        borderRadius="10px"
                        bg={cardBg}
                        borderColor={borderColor}
                      />
                    </FormControl>
                  </SimpleGrid>
                  <SimpleGrid columns={{ base: 1, sm: 2 }} spacing={4}>
                    <FormControl position="relative">
                      <FormLabel fontSize="xs" color={subtitleColor}>Luna</FormLabel>
                      <Input
                        value={searchLens}
                        onChange={(e) => handleLensSearch(e.target.value)}
                        placeholder="Buscar luna..."
                        size="sm"
                        borderRadius="10px"
                        bg={cardBg}
                        borderColor={borderColor}
                      />
                      {lensResults.length > 0 && (
                        <Box position="absolute" zIndex={10} w="100%" mt={1} bg={cardBg} border={`1px solid ${borderColor}`} borderRadius="10px" boxShadow="md" maxH="160px" overflowY="auto">
                          {lensResults.map((item) => (
                            <Box key={item.id} p={2} _hover={{ bg: sectionIconBg, cursor: "pointer" }} onClick={() => selectLens(item)}>
                              <Text fontSize="sm">{item.lens_type} — {formatMoney(item.lens_price)}</Text>
                            </Box>
                          ))}
                        </Box>
                      )}
                      <Text fontSize="xs" color={subtitleColor} mt={1}>Precio base: {formatMoney(editData.p_lens)}</Text>
                    </FormControl>
                    <FormControl>
                      <FormLabel fontSize="xs" color={subtitleColor}>Descuento luna (%)</FormLabel>
                      <Input
                        type="number"
                        value={editData.discount_lens}
                        onChange={(e) => setEditData((prev) => ({ ...prev, discount_lens: Number(e.target.value) || 0 }))}
                        size="sm"
                        borderRadius="10px"
                        bg={cardBg}
                        borderColor={borderColor}
                      />
                    </FormControl>
                  </SimpleGrid>

                  <Box mt={4} pt={4} borderTop={`1px solid ${borderColor}`}>
                    <HStack spacing={2} mb={2}>
                      <Icon as={Wrench} boxSize="14px" color={ACCENT} />
                      <Text fontSize="xs" fontWeight="bold" color={ACCENT} textTransform="uppercase">
                        Tratamientos
                      </Text>
                    </HStack>

                    {selectedTreatmentIds.length > 0 && (
                      <HStack flexWrap="wrap" spacing={2} mb={2}>
                        {selectedTreatmentIds.map((id) => {
                          const t = treatmentsCatalog.find((tr) => tr.id === id);
                          if (!t) return null;
                          return (
                            <HStack key={id} spacing={1} bg="rgba(0,168,142,0.12)" border={`1px solid ${ACCENT}`} borderRadius="full" pl={3} pr={1} py={1}>
                              <Text fontSize="xs" fontWeight="semibold">{t.name}</Text>
                              <Text fontSize="xs" color={ACCENT} fontWeight="bold">${Number(t.price).toFixed(2)}</Text>
                              <Icon
                                as={X}
                                boxSize="12px"
                                cursor="pointer"
                                onClick={() => setSelectedTreatmentIds((prev) => prev.filter((tid) => tid !== id))}
                              />
                            </HStack>
                          );
                        })}
                      </HStack>
                    )}

                    <Box position="relative" maxW="320px">
                      <Input
                        placeholder="Buscar tratamiento para agregar..."
                        size="sm"
                        value={treatmentSearch}
                        onChange={(e) => setTreatmentSearch(e.target.value)}
                        onFocus={() => setIsTreatmentFocused(true)}
                        onBlur={() => setTimeout(() => setIsTreatmentFocused(false), 150)}
                        borderRadius="10px"
                        bg={cardBg}
                        borderColor={borderColor}
                      />
                      {isTreatmentFocused && treatmentSearch.trim().length > 0 && (
                        <Box position="absolute" zIndex={10} w="100%" mt={1} bg={cardBg} border={`1px solid ${borderColor}`} borderRadius="10px" boxShadow="md" maxH="180px" overflowY="auto">
                          {treatmentsCatalog
                            .filter((t) => t.name.toLowerCase().includes(treatmentSearch.toLowerCase()))
                            .map((t) => {
                              const isSelected = selectedTreatmentIds.includes(t.id);
                              return (
                                <HStack
                                  key={t.id}
                                  justify="space-between"
                                  p={2}
                                  cursor="pointer"
                                  _hover={{ bg: inputBg }}
                                  onMouseDown={() => {
                                    setSelectedTreatmentIds((prev) => (isSelected ? prev.filter((id) => id !== t.id) : [...prev, t.id]));
                                    setTreatmentSearch("");
                                  }}
                                >
                                  <Text fontSize="sm">{isSelected ? "✓ " : ""}{t.name}</Text>
                                  <Text fontSize="sm" fontWeight="bold" color={ACCENT}>${Number(t.price).toFixed(2)}</Text>
                                </HStack>
                              );
                            })}
                        </Box>
                      )}
                    </Box>
                  </Box>

                  <Box mt={4} pt={4} borderTop={`1px solid ${borderColor}`}>
                    <HStack spacing={2} mb={2}>
                      <Icon as={Camera} boxSize="14px" color={ACCENT} />
                      <Text fontSize="xs" fontWeight="bold" color={ACCENT} textTransform="uppercase">
                        Foto del armazón (por si no se tomó al vender)
                      </Text>
                    </HStack>
                    <HStack align="flex-start" spacing={4}>
                      {framePhotoPreview && (
                        <ChakraImage src={framePhotoPreview} alt="Armazón" boxSize="70px" objectFit="cover" borderRadius="10px" border={`1px solid ${borderColor}`} />
                      )}
                      <VStack align="start" spacing={1}>
                        <Input
                          type="file"
                          accept="image/*"
                          size="sm"
                          p={1}
                          borderRadius="10px"
                          bg={cardBg}
                          borderColor={borderColor}
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            setFramePhotoFile(file);
                            setFramePhotoPreview(URL.createObjectURL(file));
                          }}
                        />
                        <Text fontSize="10px" color={subtitleColor}>Se guarda al hacer clic en "Guardar cambios".</Text>
                      </VStack>
                    </HStack>
                  </Box>

                  <Box mt={4} pt={4} borderTop={`1px solid ${borderColor}`}>
                    <HStack spacing={2} mb={2}>
                      <Icon as={CreditCard} boxSize="14px" color="orange.400" />
                      <Text fontSize="xs" fontWeight="bold" color="orange.400" textTransform="uppercase">
                        Corregir abono (solo si se equivocaron al registrarlo)
                      </Text>
                    </HStack>
                    <FormControl maxW="220px">
                      <FormLabel fontSize="xs" color={subtitleColor}>Abono ya pagado</FormLabel>
                      <Input
                        type="number"
                        value={editData.balance}
                        onChange={(e) => setEditData((prev) => ({ ...prev, balance: e.target.value }))}
                        size="sm"
                        borderRadius="10px"
                        bg={cardBg}
                        borderColor={borderColor}
                      />
                    </FormControl>
                  </Box>

                  {previewTotals && (
                    <Box mt={4} p={3} borderRadius="10px" bg={sectionIconBg}>
                      <Text fontSize="sm" fontWeight="bold" color={ACCENT}>
                        Nuevo total: {formatMoney(previewTotals.total)}
                      </Text>
                      <Text fontSize="xs" color={subtitleColor}>
                        Abono: {formatMoney(editData.balance)} · Saldo pendiente nuevo: {formatMoney(Math.max(0, previewTotals.total - (Number(editData.balance) || 0)))}
                      </Text>
                    </Box>
                  )}

                  <HStack mt={4} justify="flex-end">
                    <Button size="sm" variant="ghost" onClick={cancelEditing}>Cancelar</Button>
                    <Button size="sm" bg={ACCENT} color="white" _hover={{ bg: "#00967f" }} onClick={handleSave} isLoading={isSaving}>
                      Guardar cambios
                    </Button>
                  </HStack>
                </Box>
              )}

              <SectionTitle icon={CreditCard}>Pago</SectionTitle>
              <SimpleGrid columns={{ base: 2, sm: 4 }} spacing={4} mb={6}>
                <Box p={4} borderRadius="14px" bg={inputBg} border={`1px solid ${borderColor}`} textAlign="center">
                  <Text fontSize="xs" color={subtitleColor} mb={1}>Total</Text>
                  <Text fontWeight="bold" color={ACCENT} fontSize="lg">{formatMoney(sale.total)}</Text>
                </Box>
                <Box p={4} borderRadius="14px" bg={inputBg} border={`1px solid ${borderColor}`} textAlign="center">
                  <Text fontSize="xs" color={subtitleColor} mb={1}>Abono</Text>
                  <Text fontWeight="bold" fontSize="lg">{formatMoney(sale.balance)}</Text>
                </Box>
                <Box p={4} borderRadius="14px" bg={inputBg} border={`1px solid ${borderColor}`} textAlign="center">
                  <Text fontSize="xs" color={subtitleColor} mb={1}>Saldo</Text>
                  <Badge colorScheme={Number(sale.credit) > 0 ? "orange" : "teal"} borderRadius="full" px={2} fontSize="sm">
                    {formatMoney(sale.credit)}
                  </Badge>
                </Box>
                <Box p={4} borderRadius="14px" bg={inputBg} border={`1px solid ${borderColor}`} textAlign="center">
                  <Text fontSize="xs" color={subtitleColor} mb={1}>Método</Text>
                  <Text fontWeight="medium">{sale.payment_in || "—"}</Text>
                </Box>
              </SimpleGrid>

              {(sale.observation_text || sale.delivery_time) && (
                <>
                  <SectionTitle icon={FileText}>Otros datos</SectionTitle>
                  <SimpleGrid columns={{ base: 1, sm: 2 }} spacing={4} mb={6}>
                    {sale.delivery_time !== undefined && sale.delivery_time !== null && (
                      <InfoRow label="Tiempo de entrega" value={`${sale.delivery_time} día(s)`} />
                    )}
                    {sale.observation_text && (
                      <InfoRow label="Observación" value={sale.observation_text} />
                    )}
                  </SimpleGrid>
                </>
              )}

              <SectionTitle icon={FileText}>Comprobante</SectionTitle>
              {sale.pdf_url ? (
                <HStack spacing={3} flexWrap="wrap">
                  <Button
                    as="a"
                    href={sale.pdf_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    size="sm"
                    variant="outline"
                    colorScheme="teal"
                    leftIcon={<FileText size={15} />}
                  >
                    Ver PDF
                  </Button>
                  {sale.patients?.pt_phone && (
                    <Button
                      size="sm"
                      colorScheme="green"
                      leftIcon={<MessageCircle size={15} />}
                      onClick={handleSendWhatsApp}
                    >
                      Enviar por WhatsApp
                    </Button>
                  )}
                  {isAdmin && (
                    <Button
                      size="sm"
                      variant="outline"
                      colorScheme="orange"
                      leftIcon={<RefreshCw size={14} />}
                      onClick={handleRegeneratePdf}
                      isLoading={isRegeneratingPdf}
                      loadingText="Regenerando..."
                    >
                      Regenerar comprobante
                    </Button>
                  )}
                </HStack>
              ) : (
                <VStack align="start" spacing={3}>
                  <Text fontSize="sm" color={subtitleColor}>
                    No se generó un comprobante en PDF para esta venta.
                  </Text>
                  {isAdmin && (
                    <Button
                      size="sm"
                      bg={ACCENT}
                      color="white"
                      _hover={{ bg: "#00967f" }}
                      leftIcon={<RefreshCw size={14} />}
                      onClick={handleRegeneratePdf}
                      isLoading={isRegeneratingPdf}
                      loadingText="Generando..."
                    >
                      Generar comprobante ahora
                    </Button>
                  )}
                </VStack>
              )}
              {isEditing && (
                <Text fontSize="xs" color={subtitleColor} mt={3}>
                  Nota: si cambias el armazón o la luna, el PDF existente no se actualiza automáticamente — genera uno nuevo si el paciente lo necesita.
                </Text>
              )}

              <Box mt={6}>
                <SectionTitle icon={PackageCheck}>Retiro</SectionTitle>
                {sale.is_completed ? (
                  <Box p={4} borderRadius="14px" bg={sectionIconBg}>
                    <HStack spacing={2} mb={3}>
                      <Badge colorScheme="teal" borderRadius="full" px={3} py={1}>Retirado</Badge>
                      {sale.pickup_completed_at && (
                        <Text fontSize="xs" color={subtitleColor}>
                          {new Date(sale.pickup_completed_at).toLocaleString("es-EC", { day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                        </Text>
                      )}
                    </HStack>

                    {sale.pickup_receipt_url && (
                      <Button
                        as="a"
                        href={sale.pickup_receipt_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        size="sm"
                        variant="outline"
                        colorScheme="teal"
                        leftIcon={<FileText size={15} />}
                      >
                        Ver comprobante de retiro
                      </Button>
                    )}

                    {isAdmin && (
                      <Box mt={4} pt={4} borderTop={`1px solid ${borderColor}`}>
                        <Text fontSize="xs" color={subtitleColor} mb={2}>
                          ¿Se entregó por error a otra persona? Esto lo regresa a "pendiente de retirar".
                        </Text>
                        <Button
                          size="sm"
                          variant="ghost"
                          colorScheme="red"
                          leftIcon={<RotateCcw size={14} />}
                          onClick={() => setIsRevertConfirmOpen(true)}
                        >
                          Deshacer retiro
                        </Button>
                      </Box>
                    )}
                  </Box>
                ) : (
                  <HStack p={4} borderRadius="14px" bg={inputBg} border={`1px solid ${borderColor}`}>
                    <Badge colorScheme="orange" borderRadius="full" px={3} py={1}>Aún no retirado</Badge>
                    <Text fontSize="xs" color={subtitleColor}>El producto todavía no ha salido de la óptica.</Text>
                  </HStack>
                )}
              </Box>
            </Box>
          )}
        </Box>
      </Container>

      {/* Confirmación para deshacer un retiro */}
      <AlertDialog isOpen={isRevertConfirmOpen} leastDestructiveRef={cancelRevertRef} onClose={() => setIsRevertConfirmOpen(false)} isCentered>
        <AlertDialogOverlay backdropFilter="blur(2px)">
          <AlertDialogContent borderRadius="20px" mx={4} overflow="hidden">
            <Box h="4px" bg="red.400" />
            <AlertDialogHeader pb={2}>
              <HStack spacing={3}>
                <Flex align="center" justify="center" boxSize="40px" borderRadius="12px" bg={useColorModeValue("red.50", "rgba(229,62,62,0.15)")} color="red.500">
                  <Icon as={AlertTriangle} boxSize="18px" />
                </Flex>
                <Text fontSize="md" fontWeight="bold">Deshacer retiro</Text>
              </HStack>
            </AlertDialogHeader>
            <AlertDialogBody>
              <Text fontSize="sm" color={subtitleColor}>
                Esto marca la venta como <b>"pendiente de retirar"</b> otra vez — vuelve a aparecer en la lista de Retiros, y el comprobante generado se elimina.
              </Text>
            </AlertDialogBody>
            <AlertDialogFooter gap={2}>
              <Button ref={cancelRevertRef} variant="ghost" size="sm" onClick={() => setIsRevertConfirmOpen(false)}>
                Cancelar
              </Button>
              <Button
                colorScheme="red"
                size="sm"
                borderRadius="10px"
                onClick={handleRevertPickup}
                isLoading={isRevertingPickup}
              >
                Sí, deshacer
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </Box>
  );
};

export default SaleDetail;
