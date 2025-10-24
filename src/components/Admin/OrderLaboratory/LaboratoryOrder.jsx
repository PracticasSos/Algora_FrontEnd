import React, { useEffect, useRef, useState } from "react";
import { supabase } from "../../../api/supabase";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import {
  Box,
  Button,
  Flex,
  Spinner,
  Heading,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  Select,
  SimpleGrid,
  Text,
  useColorModeValue,
  Table,
  Thead,
  Tr,
  Th,
  Tbody,
  Td,
  useToast,
  Image as ChakraImage, // Importado como ChakraImage
} from "@chakra-ui/react";
import PdfLaboratory from "./PdfLaboratory";
import SmartHeader from "../../header/SmartHeader";

const LaboratoryOrder = () => {
  // --- 1. CAMBIO: Capturamos patientId Y saleId ---
  const { patientId, saleId } = useParams();
  const location = useLocation();
  const [salesData, setSalesData] = useState(null);
  const [patientData, setPatientData] = useState(
    location.state?.patientData || null // Mantenemos el state para carga rápida
  );

  // --- (El resto de tus estados se quedan igual) ---
  // --- Estado para la imagen ---
  const [userImage, setUserImage] = useState(null); // Guardará la imagen en Base64
  const [patientsList, setPatientsList] = useState([]);
  const [filteredMeasures, setFilteredMeasures] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSale, setSelectedSale] = useState({ lens: { lens_type: "" } });
  const [labsList, setLabsList] = useState([]);
  const [selectedLab, setSelectedLab] = useState("");
  const [observations, setObservations] = useState("");
  const [lensTypes, setLensTypes] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const salesRef = useRef(null);
  const navigate = useNavigate();
  const [branchPhone, setBranchPhone] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const toast = useToast();

  // --- 2. CAMBIO: Lógica de carga de datos modificada ---

  // Cargar listas estáticas (solo se ejecutan una vez)
  useEffect(() => {
    fetchLabs();
    fetchLens();
  }, []);

  // Cargar la VENTA específica usando el saleId de la URL
  useEffect(() => {
    if (saleId) {
      fetchSalesData(saleId); // Llamar con el ID de la venta
    } else {
      console.error("saleId no encontrado en la URL");
      toast({
        title: "Error",
        description: "No se encontró el ID de la venta.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  }, [saleId]); // Reacciona al cambio de saleId

  // Cargar el PACIENTE específico (si no vino en el 'state' de la navegación)
  useEffect(() => {
    if (patientId && !patientData) {
      fetchPatientData(patientId); // Llamar con el ID del paciente
    } else if (!patientId) {
      console.error("patientId no encontrado en la URL");
    }
  }, [patientId, patientData]); // Reacciona si cambia el ID o si patientData está vacío

  // Cargar el teléfono de la sucursal (esta lógica está perfecta)
  useEffect(() => {
    if (salesData?.branchs_id) {
      fetchBranchPhone();
    }
  }, [salesData]);

  // Verificar usuario (esta lógica está perfecta)
  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem("user"));
    if (!storedUser) {
      console.error("No user found, redirecting to login");
      navigate("/Login");
    } else {
      console.log("Usuario encontrado al cargar:", storedUser);
    }
  }, []); // Solo se ejecuta una vez al montar

  // --- (fetchBranchPhone se queda igual) ---
  const fetchBranchPhone = async () => {
    try {
      const { data, error } = await supabase
        .from("branchs")
        .select("cell")
        .eq("id", salesData.branchs_id)
        .single();

      if (error) throw error;
      setBranchPhone(data?.cell || "");
    } catch (error) {
      console.error("Error fetching branch phone:", error);
    }
  };

  // --- 3. CAMBIO: fetchPatientData ahora acepta un argumento ---
  const fetchPatientData = async (pId) => {
    // Recibe el ID
    if (!pId) {
      // Valida el ID
      console.error("patientId is undefined or invalid.");
      return;
    }
    try {
      const { data, error } = await supabase
        .from("patients")
        .select("*")
        .eq("id", pId) // Usa el ID recibido
        .single();

      if (error) throw error;
      setPatientData(data);
    } catch (error) {
      console.error("Error fetching patient data:", error);
      alert("Error al cargar los datos del paciente.");
    }
  };

  // --- (fetchLabs se queda igual) ---
  const fetchLabs = async () => {
    const { data, error } = await supabase.from("labs").select("id, name");
    if (error) {
      console.error("Error fetching labs:", error);
    } else {
      setLabsList(data);
    }
  };

  // --- (handleSearchChange se queda igual) ---
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  // --- (fetchLens se queda igual) ---
  const fetchLens = async () => {
    const { data, error } = await supabase.from("lens").select("id, lens_type");
    if (error) {
      console.error("Error fetching lens types:", error);
    } else {
      setLensTypes(data);
    }
  };

  // --- 4. CAMBIO: fetchSalesData ahora busca por saleId ---
  const fetchSalesData = async (sId) => {
    // Recibe el ID de la venta
    try {
      const { data, error } = await supabase
        .from("sales")
        .select(
          `
                id,
                date,
                inventario (brand),
                lens:lens_id(lens_type),
                branchs:branchs_id(name),
                measure_id,
                branchs_id,
                patient_id
              `
        )
        .eq("id", sId) // <-- CAMBIO CLAVE: ya no busca por patient_id
        .single(); // Ya no necesitamos limit(1) ni order()

      if (error) throw error;
      setSalesData(data);
      if (data?.measure_id) {
        fetchMeausresFormSales(data.measure_id);
      }

      // Si el paciente no se cargó desde el 'state' de react-router,
      // lo cargamos ahora que tenemos el patient_id de la venta
      if (data?.patient_id && !patientData) {
        fetchPatientData(data.patient_id);
      }
    } catch (error) {
      console.error("Error fetching sales data:", error);
    }
  };

  // --- (El resto del componente NO NECESITA CAMBIOS) ---
  // Todas las funciones de handle, update, y el JSX
  // funcionan perfectamente porque la data de los estados
  // (salesData y patientData) ahora se carga correctamente.

  const updateLensType = async (saleId, lensType) => {
    const { error } = await supabase
      .from("sales")
      .update({ lens_type: lensType })
      .eq("id", saleId);

    if (error) {
      console.error("Error updating lens type in sales:", error);
    } else {
      console.log("Lens type updated successfully!");
    }
  };

  const handleLensChange = (e) => {
    const search = e.target.value.toLowerCase();
    setIsTyping(true);
    setSelectedSale((prevSale) => ({
      ...prevSale,
      lens: { ...(prevSale?.lens || {}), lens_type: search },
    }));
    setSalesData((prevData) => ({
      ...prevData,
      lens: { ...(prevData?.lens || {}), lens_type: search },
    }));
    if (selectedSale?.id) {
      updateLensType(selectedSale.id, search);
    }
  };

  const handleLensSelect = (lens) => {
    setSelectedSale((prevSale) => ({
      ...prevSale,
      lens: { lens_type: lens.lens_type },
    }));

    setSalesData((prevData) => ({
      ...prevData,
      lens: { lens_type: lens.lens_type },
    }));
    if (selectedSale?.id) {
      updateLensType(selectedSale.id, lens.lens_type);
    }
    setIsTyping(false);
  };

  const handleInputFocus = () => {
    setIsTyping(true);
  };

  const handleInputBlur = () => {
    setTimeout(() => {
      setIsTyping(false);
    }, 200);
  };

  const fetchMeausresFormSales = async (measureId) => {
    try {
      if (!measureId) {
        console.error("measure_id is undefined or invalid.");
        return;
      }
      const { data, error } = await supabase
        .from("rx_final")
        .select("*")
        .eq("id", measureId)
        .single();
      if (error) throw error;
      setFilteredMeasures([data]);
    } catch (error) {
      console.error("Error fetching measures data:", error);
    }
  };

  const handleSaveOrder = async (pdfCallback) => {
    if (!selectedLab) {
      toast({
        title: "Campo requerido",
        description: "Por favor, selecciona un laboratorio.",
        status: "warning",
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    // --- CONSOLE.LOG CORREGIDO ---
    console.log("DATOS AL GUARDAR:", {
      saleId: salesData?.id,
      patientId: patientData?.patient_id,// <-- CORREGIDO
      measureId: salesData?.measure_id,
    });
    // --- FIN DEL CONSOLE.LOG ---

    // --- VALIDACIÓN CORREGIDA ---
    if (!salesData?.id || !patientData?.patient_id || !salesData?.measure_id) {
      toast({
        title: "Error de datos",
        description:
          "Faltan datos de la venta o del paciente. Recarga la página.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    setIsSaving(true);

    try {
      const orderData = {
        sale_id: salesData.id,
        lab_id: parseInt(selectedLab, 10),
        patient_id: patientData.patient_id, // <-- CORREGIDO
        rx_final_id: salesData.measure_id,
        observations: observations,
      };

      const { data, error } = await supabase
        .from("lab_orders")
        .insert(orderData)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Orden Guardada",
        description: `La orden ${data.id} ha sido creada con éxito.`,
        status: "success",
        duration: 5000,
        isClosable: true,
      });

      if (pdfCallback) {
        // Le pasamos el ID de la orden que acabamos de crear
        pdfCallback(data.id);
      }

      setTimeout(() => {
        // Esta es la ruta del HISTORIAL (el componente OrderLaboratoryList modificado)
        navigate("/order-laboratory-list");
      }, 1000);
    } catch (error) {
      console.error("Error al guardar la orden de laboratorio:", error);
      toast({
        title: "Error al guardar",
        description: error.message || "No se pudo crear la orden.",
        status: "error",
        duration: 9000,
        isClosable: true,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const filteredPatients = patientsList.filter((patient) => {
    if (searchTerm === "") {
      return true;
    }
    const fullName = `${patient.pt_firstname} ${patient.pt_lastname}`;
    return fullName.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const data = filteredMeasures.length > 0 ? filteredMeasures[0] : {};

  // --- 3. NUEVA FUNCIÓN PARA MANEJAR LA IMAGEN (Esta ya estaba bien) ---
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Opcional: Validar tipo y tamaño
      if (!file.type.startsWith("image/")) {
        toast({
          title: "Archivo no válido",
          description: "Por favor, selecciona una imagen.",
          status: "error",
          duration: 3000,
        });
        return;
      }
      if (file.size > 2 * 1024 * 1024) {
        // Límite de 2MB (ajusta si quieres)
        toast({
          title: "Imagen muy grande",
          description: "El tamaño máximo es 2MB.",
          status: "error",
          duration: 3000,
        });
        return;
      }

      // Usar FileReader para convertir a Base64
      const reader = new FileReader();
      reader.onloadend = () => {
        setUserImage(reader.result); // Guardar la cadena Base64 en el estado
      };
      reader.onerror = (error) => {
        console.error("Error leyendo el archivo:", error);
        toast({
          title: "Error al leer imagen",
          description: "Inténtalo de nuevo.",
          status: "error",
          duration: 3000,
        });
      };
      reader.readAsDataURL(file); // Iniciar la lectura
    }
  };

  const moduleSpecificButton = null;
  const bgColor = useColorModeValue("gray.50", "gray.900");
  const cardBg = useColorModeValue("white", "gray.800");
  const textColor = useColorModeValue("gray.800", "white");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const selectBg = useColorModeValue("white", "gray.700");
  const shadow = useColorModeValue("md", "dark-lg");

  return (
    <Box p={{ base: 2, md: 8 }} minH="100vh" bg={bgColor} color={textColor}>
      <Box
        className="sales-form"
        display="flex"
        flexDirection="column"
        alignItems="center"
        minHeight="100vh"
      >
        <SmartHeader moduleSpecificButton={moduleSpecificButton} />
        <Box w="100%" maxW="800px" mb={4}>
          <Heading
            mt={4}
            mb={2}
            textAlign="center"
            size="lg"
            fontWeight="700"
            color={useColorModeValue("teal.600", "teal.300")}
            pb={2}
          >
            Orden de Laboratorio
          </Heading>
        </Box>
        <Box
          as="form"
          width="100%"
          maxWidth="500px"
          padding={6}
          boxShadow="lg"
          borderRadius="md"
          bg={cardBg}
        >
          {patientData && (
            <Box mb={6} p={4} borderWidth="1px" borderRadius="lg" boxShadow="md">
              <Text fontSize="lg">
                <strong>Sucursal:</strong>{" "}
                {salesData?.branchs?.name || "No disponible"}
              </Text>
              <Text fontSize="lg" mt={2}>
                <strong>Fecha:</strong> {salesData?.date || "No disponible"}
              </Text>
              <Text fontSize="lg" mt={2}>
                <strong>Orden (Venta):</strong> {salesData?.id || "No disponible"}
              </Text>
              <Text fontSize="lg" mt={2}>
                <strong>Paciente:</strong> {patientData?.pt_firstname}{" "}
                {patientData?.pt_lastname}
              </Text>
            </Box>
          )}

          <Box maxW="700px" borderWidth="1px" borderRadius="md" p={4}>
            <Heading size="md" mb={4}>
              RX Final
            </Heading>

            {/* Parte superior: Esfera, Cilindro, Eje, Prisma */}
            <Table size="sm" variant="simple">
              <Thead>
                <Tr>
                  <Th>Ojo</Th>
                  <Th>Esfera</Th>
                  <Th>Cilindro</Th>
                  <Th>Eje</Th>
                  <Th>Prisma</Th>
                </Tr>
              </Thead>
              <Tbody>
                <Tr>
                  <Td>OD</Td>
                  <Td>{data.sphere_right || "N"}</Td>
                  <Td>{data.cylinder_right || ""}</Td>
                  <Td>{data.axis_right || ""}</Td>
                  <Td>{data.prism_right || ""}</Td>
                </Tr>
                <Tr>
                  <Td>OI</Td>
                  <Td>{data.sphere_left || "N"}</Td>
                  <Td>{data.cylinder_left || ""}</Td>
                  <Td>{data.axis_left || ""}</Td>
                  <Td>{data.prism_left || ""}</Td>
                </Tr>
              </Tbody>
            </Table>

            {/* Parte inferior: ADD, AVVL, DNP, ALT */}
            <Table size="sm" mt={6} variant="simple">
              <Thead>
                <Tr>
                  <Th>Ojo</Th>
                  <Th>ADD</Th>
                  <Th>AV VL</Th>
                  <Th>DNP</Th>
                  <Th>ALT</Th>
                </Tr>
              </Thead>
              <Tbody>
                <Tr>
                  <Td>OD</Td>
                  <Td>{data.add_right || "-"}</Td>
                  <Td>{data.av_vl_right || ""}</Td>
                  <Td>{data.dnp_right || ""}</Td>
                  <Td>{data.alt_right || ""}</Td>
                </Tr>
                <Tr>
                  <Td>OI</Td>
                  <Td>{data.add_left || "-"}</Td>
                  <Td>{data.av_vl_left || ""}</Td>
                  <Td>{data.dnp_left || ""}</Td>
                  <Td>{data.alt_left || ""}</Td>
                </Tr>
              </Tbody>
            </Table>
          </Box>

          <Box p={5}>
            <SimpleGrid columns={[1, 2]} spacing={4}>
              <Box padding={4} width="200%" maxWidth="500px" textAlign="left">
                <SimpleGrid columns={1} spacing={4}>
                  <FormControl mb={4}>
                    <FormLabel>Armazón</FormLabel>
                    <Input
                      type="text"
                      value={salesData?.inventario?.brand ?? "Sin marca"}
                      isReadOnly
                      maxWidth="200%"
                    />
                  </FormControl>
                  <FormControl mb={4}>
                    <FormLabel>Tipo de Lentes</FormLabel>
                    <Input
                      type="text"
                      value={salesData?.lens?.lens_type || ""}
                      onChange={handleLensChange}
                      onFocus={handleInputFocus}
                      placeholder="Escribe para buscar..."
                      width="100%"
                    />
                    {isTyping &&
                      salesData?.lens?.lens_type?.trim()?.length > 0 && (
                        <Box
                          border="1px solid #ccc"
                          borderRadius="md"
                          mt={2}
                          maxHeight="150px"
                          overflowY="auto"
                          bg="white"
                          zIndex="10"
                          position="relative"
                          width="100%"
                        >
                          {lensTypes
                            .filter((lens) =>
                              lens.lens_type
                                .toLowerCase()
                                .includes(
                                  salesData?.lens?.lens_type?.toLowerCase()
                                )
                            )
                            .map((lens) => (
                              <Box
                                key={lens.id}
                                padding={2}
                                _hover={{ bg: "teal.100", cursor: "pointer" }}
                                onMouseDown={() => handleLensSelect(lens)}
                              >
                                {lens.lens_type}
                              </Box>
                            ))}
                        </Box>
                      )}
                  </FormControl>

                  <FormControl mb={4} isRequired>
                    <FormLabel>Laboratorio</FormLabel>
                    <Select
                      value={selectedLab}
                      onChange={(e) => setSelectedLab(e.target.value)}
                      width="100%"
                      maxWidth="100%"
                      placeholder="Seleccionar Laboratorio"
                      borderColor={!selectedLab ? "red.300" : undefined}
                    >
                      {/* <option value="">Seleccionar Laboratorio</option> */}
                      {labsList.map((lab) => (
                        <option key={lab.id} value={lab.id}>
                          {lab.name}
                        </option>
                      ))}
                    </Select>
                  </FormControl>

                  <FormControl mb={4}>
                    <FormLabel>Observaciones</FormLabel>
                    <Textarea
                      value={observations}
                      onChange={(e) => setObservations(e.target.value)}
                      placeholder="Ingrese observaciones..."
                      width="100%"
                      maxWidth="100%"
                    />
                  </FormControl>
                  {/* --- 4. AÑADIR NUEVO FORMCONTROL PARA LA IMAGEN --- */}
                  <FormControl>
                    <FormLabel>Agregar Foto (Opcional)</FormLabel>
                    <Input
                      type="file"
                      accept="image/*" // Aceptar solo imágenes
                      onChange={handleImageChange}
                      // Estilos para que parezca un botón (Chakra UI)
                      p={1.5}
                      bg={"gray.100"}
                      border="1px solid"
                      borderColor="gray.300"
                      borderRadius="md"
                      _hover={{ borderColor: "teal.400" }}
                      // Ocultar el input feo y usar el label como "botón"
                      sx={{
                        "::file-selector-button": { display: "none" }, // Ocultar botón por defecto
                      }}
                    />
                    {/* Vista Previa y Botón Eliminar */}
                    {userImage && (
                      <Box
                        mt={4}
                        display="flex"
                        flexDirection="column"
                        alignItems="center"
                        justifyContent="center"
                      >
                        <ChakraImage
                          src={userImage}
                          alt="Vista previa"
                          boxSize="150px"
                          objectFit="contain"
                          mb={2}
                          border="1px solid"
                          borderColor="gray.200"
                          borderRadius="md"
                        />
                        <Button
                          size="sm"
                          colorScheme="red"
                          onClick={() => setUserImage(null)}
                        >
                          Quitar Imagen
                        </Button>
                      </Box>

                    )}
                  </FormControl>
                  {/* --- FIN DEL NUEVO FORMCONTROL --- */}
                </SimpleGrid>
              </Box>
            </SimpleGrid>

            <Box width="100%" padding={4}>
              <SimpleGrid columns={1} spacing={4}>
                {salesData && patientData ? (
                  <PdfLaboratory
                    onSave={handleSaveOrder}
                    isSaving={isSaving}
                    formData={{
                      ...patientData,
                      ...salesData,
                      ...(filteredMeasures[0] || {}),
                      observations: observations,
                      selectedLab: selectedLab,
                      userImage: userImage, // <-- AÑADIDO: Pasa la imagen al PDF
                    }}
                    targetRef={salesRef}
                    branchPhone={branchPhone}
                    branchName={salesData?.branchs?.name}
                  />
                ) : (
                  // Añadimos un Spinner mientras carga la data
                  <Flex justify="center" align="center" minH="100px">
                    <Spinner size="lg" color="teal.500" />
                    <Text ml={4}>Cargando datos de la orden...</Text>
                  </Flex>
                )}
              </SimpleGrid>
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default LaboratoryOrder;