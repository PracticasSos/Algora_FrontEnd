import { useEffect, useRef, useState } from "react";
import { supabase } from "../../../api/supabase";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import {
  Box, Container, Heading, Text, Flex, HStack, VStack, Icon, Badge, Input,
  Select, Textarea, SimpleGrid, Spinner, useColorModeValue, useToast,
  Table, Thead, Tbody, Tr, Th, Td, Button, Image as ChakraImage, FormControl, FormLabel,
} from "@chakra-ui/react";
import { ArrowLeft, FlaskConical, User, Eye, Package, Beaker, Camera, X } from "lucide-react";
import PdfLaboratory from "./PdfLaboratory";
import SmartHeader from "../../header/SmartHeader";

const ACCENT = "#00A88E";

const measureFields = [
  { label: "Esfera", key: "sphere" },
  { label: "Cilindro", key: "cylinder" },
  { label: "Eje", key: "axis" },
  { label: "Prisma", key: "prism" },
  { label: "ADD", key: "add" },
  { label: "AV VL", key: "av_vl" },
  { label: "DNP", key: "dnp" },
  { label: "ALT", key: "alt" },
];

const LaboratoryOrder = () => {
  const { patientId, saleId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const toast = useToast();

  const [salesData, setSalesData] = useState(null);
  const [patientData, setPatientData] = useState(location.state?.patientData || null);
  const [userImage, setUserImage] = useState(null);
  const [filteredMeasures, setFilteredMeasures] = useState([]);
  const [selectedSale, setSelectedSale] = useState({ lens: { lens_type: "" } });
  const [labsList, setLabsList] = useState([]);
  const [selectedLab, setSelectedLab] = useState("");
  const [observations, setObservations] = useState("");
  const [lensTypes, setLensTypes] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [branchPhone, setBranchPhone] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const salesRef = useRef(null);

  useEffect(() => {
    fetchLabs();
    fetchLens();
  }, []);

  useEffect(() => {
    if (saleId) {
      fetchSalesData(saleId);
    } else {
      toast({ title: "Error", description: "No se encontró el ID de la venta.", status: "error", duration: 5000, isClosable: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [saleId]);

  useEffect(() => {
    if (patientId && !patientData) fetchPatientData(patientId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patientId, patientData]);

  useEffect(() => {
    if (salesData?.branchs_id) fetchBranchPhone();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [salesData]);

  const fetchBranchPhone = async () => {
    try {
      const { data, error } = await supabase.from("branchs").select("cell").eq("id", salesData.branchs_id).single();
      if (error) throw error;
      setBranchPhone(data?.cell || "");
    } catch (error) {
      console.error("Error cargando teléfono de sucursal:", error);
    }
  };

  const fetchPatientData = async (pId) => {
    if (!pId) return;
    try {
      const { data, error } = await supabase.from("patients").select("*").eq("id", pId).single();
      if (error) throw error;
      setPatientData(data);
    } catch (error) {
      console.error("Error cargando paciente:", error);
      toast({ title: "Error", description: "No se pudo cargar los datos del paciente.", status: "error", duration: 5000, isClosable: true });
    }
  };

  const fetchLabs = async () => {
    const { data, error } = await supabase.from("labs").select("id, name");
    if (!error) setLabsList(data || []);
  };

  const fetchLens = async () => {
    const { data, error } = await supabase.from("lens").select("id, lens_type");
    if (!error) setLensTypes(data || []);
  };

  const fetchSalesData = async (sId) => {
    try {
      const { data, error } = await supabase
        .from("sales")
        .select(`
          id, date, inventario (brand), lens:lens_id(lens_type),
          branchs:branchs_id(name), measure_id, branchs_id, patient_id
        `)
        .eq("id", sId)
        .single();
      if (error) throw error;
      setSalesData(data);
      if (data?.measure_id) fetchMeasuresFromSales(data.measure_id);
      if (data?.patient_id && !patientData) fetchPatientData(data.patient_id);
    } catch (error) {
      console.error("Error cargando la venta:", error);
    }
  };

  const fetchMeasuresFromSales = async (measureId) => {
    if (!measureId) return;
    try {
      const { data, error } = await supabase.from("rx_final").select("*").eq("id", measureId).single();
      if (error) throw error;
      setFilteredMeasures([data]);
    } catch (error) {
      console.error("Error cargando medidas:", error);
    }
  };

  const updateLensType = async (saleId, lensType) => {
    const { error } = await supabase.from("sales").update({ lens_type: lensType }).eq("id", saleId);
    if (error) console.error("Error actualizando tipo de luna:", error);
  };

  const handleLensChange = (e) => {
    const search = e.target.value;
    setIsTyping(true);
    setSelectedSale((prev) => ({ ...prev, lens: { ...(prev?.lens || {}), lens_type: search } }));
    setSalesData((prev) => ({ ...prev, lens: { ...(prev?.lens || {}), lens_type: search } }));
    if (selectedSale?.id) updateLensType(selectedSale.id, search);
  };

  const handleLensSelect = (lens) => {
    setSelectedSale((prev) => ({ ...prev, lens: { lens_type: lens.lens_type } }));
    setSalesData((prev) => ({ ...prev, lens: { lens_type: lens.lens_type } }));
    if (selectedSale?.id) updateLensType(selectedSale.id, lens.lens_type);
    setIsTyping(false);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast({ title: "Archivo no válido", description: "Selecciona una imagen.", status: "error", duration: 3000 });
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast({ title: "Imagen muy grande", description: "El tamaño máximo es 2MB.", status: "error", duration: 3000 });
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => setUserImage(reader.result);
    reader.onerror = () => toast({ title: "Error al leer imagen", status: "error", duration: 3000 });
    reader.readAsDataURL(file);
  };

  const handleSaveOrder = async (pdfCallback) => {
    if (!selectedLab) {
      toast({ title: "Campo requerido", description: "Selecciona un laboratorio.", status: "warning", duration: 5000, isClosable: true });
      return;
    }

    // El patient_id correcto y confiable viene de salesData (la tabla
    // patients no tiene ese campo, solo "id" — usarlo de ahí causaba que
    // esta validación fallara siempre).
    if (!salesData?.id || !salesData?.patient_id || !salesData?.measure_id) {
      toast({ title: "Error de datos", description: "Faltan datos de la venta o del paciente. Recarga la página.", status: "error", duration: 5000, isClosable: true });
      return;
    }

    setIsSaving(true);
    try {
      const orderData = {
        sale_id: salesData.id,
        lab_id: parseInt(selectedLab, 10),
        patient_id: salesData.patient_id,
        rx_final_id: salesData.measure_id,
        observations,
      };

      const { data, error } = await supabase.from("lab_orders").insert(orderData).select().single();
      if (error) throw error;

      toast({ title: "Orden guardada", description: `La orden #${data.id} ha sido creada con éxito.`, status: "success", duration: 5000, isClosable: true });

      // Se espera a que el PDF termine de generarse antes de seguir — antes
      // se navegaba de vuelta a la lista 1 segundo después sin esperar,
      // así que nunca daba tiempo de ver el botón para abrir el PDF.
      if (pdfCallback) await pdfCallback(data.id);
    } catch (error) {
      console.error("Error al guardar la orden:", error);
      toast({ title: "Error al guardar", description: error.message || "No se pudo crear la orden.", status: "error", duration: 9000, isClosable: true });
    } finally {
      setIsSaving(false);
    }
  };

  const data = filteredMeasures.length > 0 ? filteredMeasures[0] : {};

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

  return (
    <Box minHeight="100vh" bgGradient={useColorModeValue("linear(to-br, gray.50, teal.50)", "linear(to-br, gray.900, #0d1f1c)")}>
      <SmartHeader moduleSpecificButton={null} />

      <Container maxW="1050px" py={8} px={{ base: 3, md: 6 }}>
        <Button size="sm" variant="ghost" leftIcon={<ArrowLeft size={16} />} mb={3} onClick={() => navigate("/order-laboratory-list")}>
          Volver a Órdenes
        </Button>

        <Box
          borderRadius="24px"
          bg={cardBg}
          border={`1px solid ${borderColor}`}
          boxShadow={useColorModeValue("0 20px 45px -20px rgba(0,168,142,0.25)", "0 20px 45px -20px rgba(0,168,142,0.35)")}
          overflow="hidden"
        >
          <Box h="5px" bgGradient="linear(to-r, #00A88E, #2DD4BF, #00A88E)" />

          {!salesData || !patientData ? (
            <Flex justify="center" align="center" py={20} gap={3}>
              <Spinner color={ACCENT} />
              <Text color={subtitleColor}>Cargando datos de la orden...</Text>
            </Flex>
          ) : (
            <Box p={{ base: 5, md: 8 }}>
              <HStack spacing={3} mb={6}>
                <Flex align="center" justify="center" boxSize="44px" borderRadius="14px" bgGradient="linear(to-br, #00A88E, #00786A)" color="white" boxShadow="0 6px 16px -4px rgba(0,168,142,0.5)">
                  <Icon as={FlaskConical} boxSize="20px" />
                </Flex>
                <VStack align="start" spacing={0}>
                  <Heading size="lg" fontWeight="800" color={useColorModeValue("gray.800", "white")} letterSpacing="tight">
                    Orden de Laboratorio
                  </Heading>
                  <Text fontSize="xs" color={subtitleColor}>Venta #{salesData?.id} · {salesData?.branchs?.name}</Text>
                </VStack>
              </HStack>

              <SectionTitle icon={User}>Paciente y venta</SectionTitle>
              <SimpleGrid columns={{ base: 2, md: 4 }} spacing={4} mb={6}>
                <Box>
                  <Text fontSize="xs" color={subtitleColor} mb={1}>Paciente</Text>
                  <Text fontSize="sm" fontWeight="semibold">{patientData?.pt_firstname} {patientData?.pt_lastname}</Text>
                </Box>
                <Box>
                  <Text fontSize="xs" color={subtitleColor} mb={1}>Sucursal</Text>
                  <Text fontSize="sm" fontWeight="semibold">{salesData?.branchs?.name || "—"}</Text>
                </Box>
                <Box>
                  <Text fontSize="xs" color={subtitleColor} mb={1}>Fecha</Text>
                  <Text fontSize="sm" fontWeight="semibold">{salesData?.date || "—"}</Text>
                </Box>
                <Box>
                  <Text fontSize="xs" color={subtitleColor} mb={1}>Armazón</Text>
                  <Text fontSize="sm" fontWeight="semibold">{salesData?.inventario?.brand ?? "Sin marca"}</Text>
                </Box>
              </SimpleGrid>

              <SectionTitle icon={Eye}>RX Final</SectionTitle>
              <Box overflowX="auto" mb={6}>
                <Table size="sm" variant="simple" minW="640px">
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
                            {data[`${key}_${eye === "OD" ? "right" : "left"}`] || "—"}
                          </Td>
                        ))}
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              </Box>

              <SectionTitle icon={Beaker}>Detalles de la orden</SectionTitle>
              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4} mb={3}>
                <FormControl position="relative">
                  <FormLabel fontSize="xs" color={subtitleColor}>Tipo de luna</FormLabel>
                  <Input
                    value={salesData?.lens?.lens_type || ""}
                    onChange={handleLensChange}
                    onFocus={() => setIsTyping(true)}
                    onBlur={() => setTimeout(() => setIsTyping(false), 200)}
                    placeholder="Escribe para buscar..."
                    borderRadius="10px"
                    bg={inputBg}
                    borderColor={borderColor}
                    _focus={{ borderColor: ACCENT, boxShadow: `0 0 0 1px ${ACCENT}` }}
                  />
                  {isTyping && salesData?.lens?.lens_type?.trim()?.length > 0 && (
                    <Box position="absolute" zIndex={10} w="100%" mt={1} bg={cardBg} border={`1px solid ${borderColor}`} borderRadius="10px" boxShadow="md" maxH="150px" overflowY="auto">
                      {lensTypes
                        .filter((l) => l.lens_type.toLowerCase().includes((salesData?.lens?.lens_type || "").toLowerCase()))
                        .map((lens) => (
                          <Box key={lens.id} p={2} _hover={{ bg: sectionIconBg, cursor: "pointer" }} onMouseDown={() => handleLensSelect(lens)}>
                            <Text fontSize="sm">{lens.lens_type}</Text>
                          </Box>
                        ))}
                    </Box>
                  )}
                </FormControl>

                <FormControl isRequired>
                  <FormLabel fontSize="xs" color={subtitleColor}>Laboratorio</FormLabel>
                  <Select
                    placeholder="Seleccionar laboratorio"
                    value={selectedLab}
                    onChange={(e) => setSelectedLab(e.target.value)}
                    borderRadius="10px"
                    bg={inputBg}
                    borderColor={!selectedLab ? "red.300" : borderColor}
                    _focus={{ borderColor: ACCENT, boxShadow: `0 0 0 1px ${ACCENT}` }}
                  >
                    {labsList.map((lab) => <option key={lab.id} value={lab.id}>{lab.name}</option>)}
                  </Select>
                </FormControl>
              </SimpleGrid>

              <FormControl mb={4}>
                <FormLabel fontSize="xs" color={subtitleColor}>Observaciones</FormLabel>
                <Textarea
                  value={observations}
                  onChange={(e) => setObservations(e.target.value)}
                  placeholder="Ingrese observaciones..."
                  borderRadius="10px"
                  bg={inputBg}
                  borderColor={borderColor}
                  _focus={{ borderColor: ACCENT, boxShadow: `0 0 0 1px ${ACCENT}` }}
                />
              </FormControl>

              <FormControl mb={6}>
                <FormLabel fontSize="xs" color={subtitleColor}>Agregar foto (opcional)</FormLabel>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  p={1.5}
                  borderRadius="10px"
                  bg={inputBg}
                  borderColor={borderColor}
                />
                {userImage && (
                  <VStack mt={3} spacing={2}>
                    <ChakraImage src={userImage} alt="Vista previa" boxSize="140px" objectFit="contain" border={`1px solid ${borderColor}`} borderRadius="10px" />
                    <Button size="xs" colorScheme="red" variant="outline" leftIcon={<X size={12} />} onClick={() => setUserImage(null)}>
                      Quitar imagen
                    </Button>
                  </VStack>
                )}
              </FormControl>

              <Box pt={4} borderTop={`1px solid ${borderColor}`}>
                <PdfLaboratory
                  onSave={handleSaveOrder}
                  isSaving={isSaving}
                  formData={{
                    ...patientData,
                    ...salesData,
                    ...(filteredMeasures[0] || {}),
                    observations,
                    selectedLab,
                    userImage,
                  }}
                  targetRef={salesRef}
                  branchPhone={branchPhone}
                  branchName={salesData?.branchs?.name}
                />
              </Box>
            </Box>
          )}
        </Box>
      </Container>
    </Box>
  );
};

export default LaboratoryOrder;
