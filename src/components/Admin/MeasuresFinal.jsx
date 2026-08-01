import { useState, useEffect } from "react";
import { supabase } from "../../api/supabase";
import {
  Box, Button, Container, FormControl, FormLabel, Input, SimpleGrid, Heading,
  Table, Thead, Tbody, Tr, Th, Td, Textarea, RadioGroup,
  Radio, Stack, Checkbox, Text, useColorModeValue,
  HStack, VStack, useToast, Alert, AlertIcon, Icon, Badge, Flex, Collapse
} from "@chakra-ui/react";
import { useNavigate, useParams } from "react-router-dom";
import { FaEye } from 'react-icons/fa';
import { User, Eye, MessageSquare, Sparkles, ScanLine, ShieldCheck } from 'lucide-react';
import SmartHeader from "../header/SmartHeader";
import SignaturePadComponent from "./Sales/SignaturePadComponent";
import ScanRxModal from "./ScanRxModal";

const ACCENT = '#00A88E';

// Líneas estándar de la carta Jaeger, de más fina (J1) a más gruesa (J20).
// El doctor elige hasta qué línea pudo leer el paciente, en vez de un simple
// aprobado/no aprobado — así queda un dato clínico real, no solo binario.
const JAEGER_LINES = ["J1", "J2", "J3", "J4", "J5", "J6", "J7"];
// Umbral clínico común: J1-J5 se considera visión cercana funcional para
// lectura normal. Se usa solo para completar el campo "Aprobado/No Aprobado"
// que ya usa el certificado, sin pedirle al doctor llenarlo dos veces.
const deriveNearVisionApproval = (line) => {
  if (!line) return "";
  const n = parseInt(line.replace("J", ""), 10);
  if (isNaN(n)) return "";
  return n <= 5 ? "Aprobado" : "No Aprobado";
};

const STORAGE_KEY = 'measuresFinalFormData';

const defaultInitialState = {
  patient_id: "",
  sphere_right: "",
  cylinder_right: "",
  axis_right: "",
  prism_right: "",
  add_right: "",
  av_vl_right: "",
  av_vp_right: "",
  dnp_right: "",
  alt_right: "",
  sphere_left: "",
  cylinder_left: "",
  axis_left: "",
  prism_left: "",
  add_left: "",
  av_vl_left: "",
  av_vp_left: "",
  dnp_left: "",
  alt_left: "",
  diagnosis: "",
  near_vision: "",
  near_vision_line: "",
  needs_lenses_near: false,
  far_vision: "",
  needs_lenses_far: false,
  color_perception: null,
  color_issues: "",
  informed_consent: false,
  informed_consent_signature: "",
  clinical_history_consent: false,
  created_at: ""
};

const getInitialFormData = () => {
  const savedData = sessionStorage.getItem(STORAGE_KEY);
  if (savedData) {
    try {
      return JSON.parse(savedData);
    } catch (e) {
      console.error("Error al parsear datos de sessionStorage", e);
      sessionStorage.removeItem(STORAGE_KEY);
      return defaultInitialState;
    }
  }
  return defaultInitialState;
};

const MeasuresFinal = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const { id } = useParams();

  const [formData, setFormData] = useState(getInitialFormData);
  const [patients, setPatients] = useState([]);
  const [filteredPatients, setFilteredPatients] = useState([]);
  const [searchTermPatients, setSearchTermPatients] = useState("");
  const [showColorIssuesInput, setShowColorIssuesInput] = useState(
    () => !!getInitialFormData().color_issues
  );
  const [error, setError] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isScanOpen, setIsScanOpen] = useState(false);
  const [lastSavedPatientId, setLastSavedPatientId] = useState(null);
  const [showConsentText, setShowConsentText] = useState(false);

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

  useEffect(() => {
    if (JSON.stringify(formData) !== JSON.stringify(defaultInitialState)) {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(formData));
    }
  }, [formData]);

  // Si la URL trae un paciente específico (ej. vienes de "Guardar y Continuar
  // a Medidas") y es DISTINTO al que hay en el formulario, siempre se
  // prioriza el de la URL y se empieza en limpio. Antes, si quedaba un
  // patient_id viejo pegado de una sesión anterior sin guardar, este bloqueo
  // nunca dejaba entrar al paciente nuevo — ese era el bug.
  useEffect(() => {
    if (id && patients.length > 0 && String(formData.patient_id) !== String(id)) {
      const found = patients.find(p => String(p.id) === String(id));
      if (found) {
        setFormData({ ...defaultInitialState, patient_id: found.id });
        setSearchTermPatients(`${found.pt_firstname} ${found.pt_lastname}`);
        setFilteredPatients([]);
        setShowColorIssuesInput(false);
      }
    }
  }, [id, patients]);

  useEffect(() => {
    fetchData('patients', data => {
      setPatients(data);
      setFilteredPatients(data);

      if (id) return; // si hay id en la URL, lo maneja el efecto de arriba

      const currentPatientId = getInitialFormData().patient_id;
      if (currentPatientId) {
        const found = data.find(p => String(p.id) === String(currentPatientId));
        if (found) {
          setSearchTermPatients(`${found.pt_firstname} ${found.pt_lastname}`);
          setFilteredPatients([]);
        }
      }
    });
  }, []);

  const fetchData = async (table, setter) => {
    try {
      const { data, error } = await supabase.from(table).select("*");
      if (error) throw error;
      setter(data);
    } catch (err) {
      console.error(`Error fetching ${table}:`, err);
      setError(`Error al obtener los datos de ${table}`);
      toast({
        title: "Error",
        description: `No se pudieron obtener los datos de ${table}.`,
        status: "error",
        variant: "left-accent",
        duration: 5000,
        isClosable: true,
        containerStyle: { borderRadius: "14px", overflow: "hidden" },
      });
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSearchPatients = (e) => {
    const searchTerm = e.target.value.toLowerCase();
    setSearchTermPatients(searchTerm);
    setFilteredPatients(
      patients.filter((patient) => {
        const fullname = `${patient.pt_firstname} ${patient.pt_lastname}`.toLowerCase();
        return fullname.includes(searchTerm) || patient.pt_ci?.toLowerCase().includes(searchTerm);
      })
    );
  };

  const handlePatientSelect = (patient) => {
    // Cambiar de paciente a mano también empieza en limpio, para no
    // arrastrar medidas de la persona anterior por accidente.
    setFormData({ ...defaultInitialState, patient_id: patient.id });
    setSearchTermPatients(`${patient.pt_firstname} ${patient.pt_lastname}`);
    setFilteredPatients([]);
    setShowColorIssuesInput(false);
  };

  // Aplica los valores ya revisados/corregidos del modal de escaneo a la
  // tabla principal. Solo llena los campos que el optómetra dejó con datos;
  // si un campo del escaneo viene vacío, no borra lo que ya había escrito.
  const handleApplyScan = (scannedGrid) => {
    setFormData((prev) => {
      const updated = { ...prev };
      Object.entries(scannedGrid).forEach(([key, value]) => {
        if (value !== "") updated[key] = value;
      });
      return updated;
    });
    toast({
      title: "Valores aplicados",
      description: "Revisa la tabla una vez más antes de guardar.",
      status: "info",
      variant: "left-accent",
      duration: 4000,
      isClosable: true,
      containerStyle: { borderRadius: "14px", overflow: "hidden" },
    });
  };

  const handleNearVisionLineChange = (line) => {
    setFormData(prev => ({
      ...prev,
      near_vision_line: line,
      near_vision: deriveNearVisionApproval(line),
    }));
  };

  // Sugerencia automática de diagnóstico basada en reglas ópticas estándar
  // (sin IA de pago ni servicio externo — gratis e instantáneo). El doctor
  // siempre puede editar o borrar el texto sugerido.
  const suggestDiagnosis = () => {
    const parseVal = (v) => {
      if (v === undefined || v === null || v === "") return 0;
      const n = parseFloat(String(v).replace(",", "."));
      return isNaN(n) ? 0 : n;
    };
    const sphereR = parseVal(formData.sphere_right);
    const sphereL = parseVal(formData.sphere_left);
    const cylR = parseVal(formData.cylinder_right);
    const cylL = parseVal(formData.cylinder_left);

    const describeEye = (sphere, cyl) => {
      const parts = [];
      if (sphere <= -0.25) {
        parts.push(sphere <= -6 ? "Miopía alta" : sphere <= -3 ? "Miopía moderada" : "Miopía leve");
      } else if (sphere >= 0.25) {
        parts.push(sphere >= 5 ? "Hipermetropía alta" : sphere >= 2 ? "Hipermetropía moderada" : "Hipermetropía leve");
      }
      if (Math.abs(cyl) >= 0.25) parts.push("Astigmatismo");
      return parts.length ? parts.join(" y ") : "Emetropía";
    };

    const odDiagnosis = describeEye(sphereR, cylR);
    const oiDiagnosis = describeEye(sphereL, cylL);

    let text;
    if (odDiagnosis === "Emetropía" && oiDiagnosis === "Emetropía") {
      text = "Paciente presenta Emetropía en ambos ojos. Se recomienda control anual.";
    } else if (odDiagnosis === oiDiagnosis) {
      text = `Paciente presenta ${odDiagnosis} en ambos ojos. Se recomienda uso de corrección óptica y control periódico.`;
    } else {
      text = `Ojo derecho (O.D): ${odDiagnosis}. Ojo izquierdo (O.I): ${oiDiagnosis}. Se recomienda uso de corrección óptica y control periódico.`;
    }

    setFormData(prev => ({ ...prev, diagnosis: text }));
    toast({
      title: "Sugerencia generada",
      description: "Revísala y ajústala según tu criterio profesional.",
      status: "info",
      variant: "left-accent",
      duration: 4000,
      isClosable: true,
      containerStyle: { borderRadius: "14px", overflow: "hidden" },
    });
  };

  const handleSubmit = async () => {
    if (isSaving) return; // bloqueo real contra doble guardado
    if (!formData.patient_id) {
      toast({
        title: "Falta seleccionar paciente",
        description: "Busca y selecciona un paciente antes de guardar.",
        status: "warning",
        variant: "left-accent",
        duration: 5000,
        isClosable: true,
        containerStyle: { borderRadius: "14px", overflow: "hidden" },
      });
      return;
    }
    if (!formData.informed_consent || !formData.informed_consent_signature) {
      toast({
        title: "Falta el consentimiento informado",
        description: "El paciente debe aceptar y firmar el consentimiento informado antes de guardar.",
        status: "warning",
        variant: "left-accent",
        duration: 5000,
        isClosable: true,
        containerStyle: { borderRadius: "14px", overflow: "hidden" },
      });
      return;
    }

    setIsSaving(true);
    const newFormData = { ...formData, created_at: new Date().toISOString() };

    try {
      const { data, error } = await supabase.from("rx_final").insert([newFormData]);
      if (error) throw error;

      // Marcar al paciente como "atendido hoy" para que aparezca primero en
      // la Lista de Pacientes — se actualiza tanto la fecha (date) como la
      // marca de tiempo exacta. Si esto falla, ahora sí se avisa (antes
      // fallaba en silencio y nadie se enteraba).
      const todayStr = new Date().toISOString().slice(0, 10);
      const { error: patientUpdateError } = await supabase
        .from("patients")
        .update({
          date: todayStr,
          last_visit_at: new Date().toISOString(),
        })
        .eq("id", formData.patient_id);

      if (patientUpdateError) {
        console.error("Error actualizando la fecha del paciente:", patientUpdateError);
        toast({
          title: "Medida guardada, pero...",
          description: "No se pudo actualizar la fecha del paciente en la lista. Avísale al soporte técnico.",
          status: "warning",
          variant: "left-accent",
          duration: 6000,
          isClosable: true,
          containerStyle: { borderRadius: "14px", overflow: "hidden" },
        });
      }

      toast({
        title: "¡Medidas registradas!",
        description: "Se guardaron correctamente.",
        status: "success",
        variant: "left-accent",
        duration: 4000,
        isClosable: true,
        containerStyle: { borderRadius: "14px", overflow: "hidden" },
      });

      // Se guarda aparte quién fue el paciente atendido, ANTES de limpiar el
      // formulario — así "Realizar Venta" lo sigue teniendo disponible
      // aunque el resto de los campos ya se hayan reiniciado.
      setLastSavedPatientId(formData.patient_id);

      sessionStorage.removeItem(STORAGE_KEY);
      setFormData(defaultInitialState);
      setSearchTermPatients("");
      setShowColorIssuesInput(false);
    } catch (err) {
      console.error("Error al registrar medidas:", err.message);
      toast({
        title: "Error",
        description: "Hubo un error al registrar las medidas.",
        status: "error",
        variant: "left-accent",
        duration: 5000,
        isClosable: true,
        containerStyle: { borderRadius: "14px", overflow: "hidden" },
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleNavigate = (route = null) => {
    if (route) {
      navigate(route);
      return;
    }
    navigate('/admin');
  };

  const moduleSpecificButton = null;

  const cardBg = useColorModeValue('white', 'gray.700');
  const inputBg = useColorModeValue('gray.50', 'gray.700');
  const focusBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const subtitleColor = useColorModeValue('gray.500', 'gray.400');
  const sectionIconBg = useColorModeValue('#E6FBF6', 'rgba(0,168,142,0.15)');

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

  const selectedPatient = patients.find(p => String(p.id) === String(formData.patient_id));

  return (
    <Box
      minHeight="100vh"
      bgGradient={useColorModeValue('linear(to-br, gray.50, teal.50)', 'linear(to-br, gray.900, #0d1f1c)')}
    >
      <SmartHeader moduleSpecificButton={moduleSpecificButton} />

      <Container maxW="1100px" py={8} px={{ base: 3, md: 6 }}>
        {error && (
          <Alert status="error" mb={4} borderRadius="12px">
            <AlertIcon />
            {error}
          </Alert>
        )}

        <Box
          as="form"
          onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}
          width="100%"
          borderRadius="24px"
          bg={cardBg}
          border={`1px solid ${borderColor}`}
          boxShadow={useColorModeValue(
            '0 20px 45px -20px rgba(0,168,142,0.25)',
            '0 20px 45px -20px rgba(0,168,142,0.35)'
          )}
          overflow="hidden"
        >
          <Box h="5px" bgGradient="linear(to-r, #00A88E, #2DD4BF, #00A88E)" />
          <Box p={{ base: 5, md: 10 }}>
            <HStack spacing={3} mb={1}>
              <Flex
                align="center"
                justify="center"
                boxSize="44px"
                borderRadius="14px"
                bgGradient="linear(to-br, #00A88E, #00786A)"
                color="white"
                boxShadow="0 6px 16px -4px rgba(0,168,142,0.5)"
              >
                <Icon as={Eye} boxSize="20px" />
              </Flex>
              <Heading size="lg" fontWeight="800" color={useColorModeValue('gray.800', 'white')} letterSpacing="tight">
                Registrar Medidas
              </Heading>
            </HStack>
            <Text fontSize="sm" color={subtitleColor} mb={6} ml={{ base: 0, md: '56px' }}>
              Busca al paciente, completa la refracción y el diagnóstico.
            </Text>

            {/* --- Paciente --- */}
            <Box mb={8}>
              <SectionTitle icon={User}>Paciente</SectionTitle>
              <FormControl id="patient-search" position="relative">
                <FormLabel fontWeight="semibold" fontSize="sm">Buscar paciente</FormLabel>
                <Input
                  type="text"
                  placeholder="Nombre o cédula..."
                  value={searchTermPatients}
                  onChange={handleSearchPatients}
                  size="lg"
                  borderRadius="12px"
                  bg={inputBg}
                  borderColor={borderColor}
                  _focus={{ borderColor: ACCENT, boxShadow: `0 0 0 1px ${ACCENT}`, bg: focusBg }}
                />
                {searchTermPatients && filteredPatients.length > 0 && (
                  <Box
                    border={`1px solid ${borderColor}`}
                    borderRadius="12px"
                    mt={2}
                    maxHeight="200px"
                    overflowY="auto"
                    bg={cardBg}
                    boxShadow="md"
                    position="absolute"
                    w="100%"
                    zIndex={10}
                  >
                    {filteredPatients.map((patient) => (
                      <Box
                        key={patient.id}
                        p={3}
                        _hover={{ bg: sectionIconBg, cursor: "pointer" }}
                        onClick={() => handlePatientSelect(patient)}
                        borderBottom={`1px solid ${borderColor}`}
                      >
                        <HStack>
                          <Icon as={FaEye} color={ACCENT} />
                          <Text fontWeight="500">{patient.pt_firstname} {patient.pt_lastname}</Text>
                          <Badge colorScheme="teal" ml={2}>{patient.pt_ci}</Badge>
                        </HStack>
                      </Box>
                    ))}
                  </Box>
                )}
              </FormControl>
              {selectedPatient && (
                <HStack mt={3} p={3} borderRadius="12px" bg={sectionIconBg}>
                  <Icon as={FaEye} color={ACCENT} />
                  <Text fontWeight="semibold" color={ACCENT}>
                    {selectedPatient.pt_firstname} {selectedPatient.pt_lastname}
                  </Text>
                  <Badge colorScheme="teal">{selectedPatient.pt_ci}</Badge>
                </HStack>
              )}
            </Box>

            {/* --- Refracción (Rx Final) --- */}
            <Box mb={8}>
              <SectionTitle icon={Eye}>Refracción — Rx Final</SectionTitle>
              <Flex justify="flex-end" mb={2}>
                <Button
                  size="sm"
                  variant="outline"
                  colorScheme="teal"
                  leftIcon={<Icon as={ScanLine} boxSize="14px" />}
                  onClick={() => setIsScanOpen(true)}
                >
                  Escanear receta
                </Button>
              </Flex>

              <Box display={{ base: "none", lg: "block" }} overflowX="auto">
                <Table size="md" variant="simple" minW="920px">
                  <Thead>
                    <Tr>
                      <Th w="70px" whiteSpace="nowrap">Rx Final</Th>
                      {measureFields.map(({ label, key }) => (
                        <Th key={key} textAlign="center" fontSize="xs" color={subtitleColor} whiteSpace="nowrap">{label}</Th>
                      ))}
                    </Tr>
                  </Thead>
                  <Tbody>
                    {['OD', 'OI'].map((eye) => (
                      <Tr key={eye}>
                        <Td fontWeight="bold" color={ACCENT}>{eye}</Td>
                        {measureFields.map(({ key }) => (
                          <Td key={key} p={1}>
                            <Input
                              name={`${key}_${eye === 'OD' ? 'right' : 'left'}`}
                              value={formData[`${key}_${eye === 'OD' ? 'right' : 'left'}`] || ""}
                              onChange={handleChange}
                              size="md"
                              minW="80px"
                              textAlign="center"
                              borderRadius="10px"
                              bg={inputBg}
                              borderColor={borderColor}
                              _focus={{ borderColor: ACCENT, boxShadow: `0 0 0 1px ${ACCENT}` }}
                            />
                          </Td>
                        ))}
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              </Box>

              <VStack display={{ base: "flex", lg: "none" }} spacing={4} align="stretch">
                {['OD', 'OI'].map((eye) => (
                  <Box key={eye} p={4} borderRadius="14px" border={`1px solid ${borderColor}`} bg={inputBg}>
                    <Text fontWeight="bold" mb={3} color={ACCENT}>{eye === 'OD' ? 'Ojo Derecho (OD)' : 'Ojo Izquierdo (OI)'}</Text>
                    <SimpleGrid columns={3} spacing={3}>
                      {measureFields.map(({ label, key }) => (
                        <FormControl key={key}>
                          <FormLabel fontSize="xs" color={subtitleColor} mb={1}>{label}</FormLabel>
                          <Input
                            name={`${key}_${eye === 'OD' ? 'right' : 'left'}`}
                            value={formData[`${key}_${eye === 'OD' ? 'right' : 'left'}`] || ""}
                            onChange={handleChange}
                            size="sm"
                            textAlign="center"
                            borderRadius="10px"
                            bg={cardBg}
                            borderColor={borderColor}
                            _focus={{ borderColor: ACCENT, boxShadow: `0 0 0 1px ${ACCENT}` }}
                          />
                        </FormControl>
                      ))}
                    </SimpleGrid>
                  </Box>
                ))}
              </VStack>
            </Box>

            {/* --- Diagnóstico --- */}
            <Box mb={8}>
              <Flex justify="space-between" align="center" mb={4} flexWrap="wrap" gap={2}>
                <SectionTitle icon={MessageSquare}>Diagnóstico</SectionTitle>
              </Flex>
              <Flex justify="flex-end" mb={2}>
                <Button
                  size="sm"
                  variant="outline"
                  colorScheme="teal"
                  leftIcon={<Icon as={Sparkles} boxSize="14px" />}
                  onClick={suggestDiagnosis}
                >
                  Sugerir diagnóstico
                </Button>
              </Flex>
              <Textarea
                placeholder="Escriba el diagnóstico, o use 'Sugerir diagnóstico' como punto de partida"
                value={formData.diagnosis}
                onChange={(e) => setFormData(prev => ({ ...prev, diagnosis: e.target.value }))}
                borderRadius="12px"
                size="lg"
                minH="100px"
                bg={inputBg}
                borderColor={borderColor}
                _focus={{ borderColor: ACCENT, boxShadow: `0 0 0 1px ${ACCENT}`, bg: focusBg }}
              />
            </Box>

            {/* --- Pruebas visuales --- */}
            <Box mb={8}>
              <SectionTitle icon={Eye}>Pruebas de capacidad visual</SectionTitle>

              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
                <Box p={4} borderRadius="14px" bg={inputBg} border={`1px solid ${borderColor}`}>
                  <Text fontWeight="bold" mb={1} color={ACCENT}>Visión cercana</Text>
                  <Text fontSize="xs" color={subtitleColor} mb={3}>
                    Toca hasta qué línea de la carta Jaeger pudo leer.
                  </Text>
                  <Flex wrap="wrap" gap={2} mb={3}>
                    {JAEGER_LINES.map((line) => {
                      const isSelected = formData.near_vision_line === line;
                      return (
                        <Box
                          key={line}
                          as="button"
                          type="button"
                          onClick={() => handleNearVisionLineChange(line)}
                          boxSize="38px"
                          borderRadius="10px"
                          border={isSelected ? `2px solid ${ACCENT}` : `1px solid ${borderColor}`}
                          bg={isSelected ? sectionIconBg : cardBg}
                          color={isSelected ? ACCENT : undefined}
                          fontWeight={isSelected ? "bold" : "medium"}
                          fontSize="sm"
                          _hover={{ borderColor: ACCENT }}
                          transition="all 0.15s ease"
                        >
                          {line.replace("J", "")}
                        </Box>
                      );
                    })}
                    <Box
                      as="button"
                      type="button"
                      onClick={() => handleNearVisionLineChange("No lee")}
                      px={3}
                      h="38px"
                      borderRadius="10px"
                      border={formData.near_vision_line === "No lee" ? `2px solid #E53E3E` : `1px solid ${borderColor}`}
                      bg={formData.near_vision_line === "No lee" ? "red.50" : cardBg}
                      color={formData.near_vision_line === "No lee" ? "red.500" : undefined}
                      fontWeight="medium"
                      fontSize="xs"
                      _hover={{ borderColor: "red.400" }}
                      transition="all 0.15s ease"
                    >
                      No lee
                    </Box>
                  </Flex>
                  <Checkbox
                    isChecked={formData.needs_lenses_near}
                    onChange={(e) => setFormData(prev => ({ ...prev, needs_lenses_near: e.target.checked }))}
                    colorScheme="teal"
                  >
                    Precisa lentes
                  </Checkbox>
                </Box>

                <Box p={4} borderRadius="14px" bg={inputBg} border={`1px solid ${borderColor}`}>
                  <Text fontWeight="bold" mb={1} color={ACCENT}>Visión lejana</Text>
                  <Text fontSize="xs" color={subtitleColor} mb={3}>Escala de Snellen.</Text>
                  <RadioGroup
                    value={formData.far_vision}
                    onChange={(val) => setFormData(prev => ({ ...prev, far_vision: val }))}
                    mb={3}
                  >
                    <Stack spacing={2}>
                      <Radio value="20/20" colorScheme="teal">20/20 o superior</Radio>
                      <Radio value="Menor a 20/20" colorScheme="red">Menor a 20/20</Radio>
                    </Stack>
                  </RadioGroup>
                  <Checkbox
                    isChecked={formData.needs_lenses_far}
                    onChange={(e) => setFormData(prev => ({ ...prev, needs_lenses_far: e.target.checked }))}
                    colorScheme="teal"
                  >
                    Precisa lentes
                  </Checkbox>
                </Box>
              </SimpleGrid>

              <Box mt={4} p={4} borderRadius="14px" bg={inputBg} border={`1px solid ${borderColor}`}>
                <Text fontWeight="bold" mb={2} color={ACCENT}>Percepción de colores</Text>
                <RadioGroup
                  value={formData.color_perception === null ? "" : formData.color_perception ? "good" : "bad"}
                  onChange={(val) => setFormData(prev => ({ ...prev, color_perception: val === "good" }))}
                >
                  <Stack spacing={3}>
                    <Radio value="good" colorScheme="teal">
                      Demuestra capacidad para distinguir y diferenciar los colores.
                    </Radio>
                    <Box>
                      <Radio value="bad" colorScheme="red">
                        Presenta dificultad para distinguir los siguientes colores:
                      </Radio>
                      {formData.color_perception === false && (
                        <Input
                          placeholder="Ej. rojo, verde..."
                          value={formData.color_issues}
                          onChange={(e) => setFormData(prev => ({ ...prev, color_issues: e.target.value }))}
                          mt={2}
                          ml={6}
                          w="calc(100% - 24px)"
                          borderRadius="10px"
                          bg={cardBg}
                          borderColor={borderColor}
                          _focus={{ borderColor: ACCENT, boxShadow: `0 0 0 1px ${ACCENT}` }}
                        />
                      )}
                    </Box>
                  </Stack>
                </RadioGroup>
              </Box>
            </Box>

            {/* --- Consentimiento Informado --- */}
            <Box mb={8}>
              <SectionTitle icon={ShieldCheck}>Consentimiento informado</SectionTitle>
              <Box p={4} borderRadius="14px" bg={inputBg} border={`1px solid ${borderColor}`} mb={4}>
                <Text fontSize="sm" color={subtitleColor} mb={3}>
                  El paciente debe leer, aceptar y firmar antes de guardar el examen.
                </Text>
                <Box mb={3}>
                  <Button
                    size="xs"
                    variant="link"
                    colorScheme="teal"
                    onClick={() => setShowConsentText((v) => !v)}
                  >
                    {showConsentText ? 'Ocultar detalle' : 'Leer el consentimiento completo'}
                  </Button>
                </Box>
                <Collapse in={showConsentText} animateOpacity>
                  <Box
                    fontSize="xs"
                    color={subtitleColor}
                    bg={cardBg}
                    border={`1px solid ${borderColor}`}
                    borderRadius="10px"
                    p={3}
                    mb={3}
                    maxH="160px"
                    overflowY="auto"
                  >
                    Declaro que he sido informado(a) de manera clara sobre el procedimiento de
                    evaluación optométrica que se me va a realizar (refracción, pruebas de agudeza
                    visual y percepción de colores), sus objetivos y alcances. Entiendo que los
                    resultados obtenidos servirán como base para una recomendación óptica y/o
                    referencia médica si fuera necesario. He tenido la oportunidad de resolver mis
                    dudas y otorgo mi consentimiento voluntario para la realización de este examen.
                  </Box>
                </Collapse>
                <Checkbox
                  mt={1}
                  isChecked={formData.informed_consent}
                  onChange={(e) => setFormData(prev => ({ ...prev, informed_consent: e.target.checked }))}
                  colorScheme="teal"
                  mb={3}
                >
                  He leído y acepto el consentimiento informado para este examen. *
                </Checkbox>

                <Text fontSize="xs" fontWeight="semibold" color={subtitleColor} mb={1}>
                  Firma del paciente
                </Text>
                <SignaturePadComponent
                  onSave={(signatureDataUrl) =>
                    setFormData(prev => ({ ...prev, informed_consent_signature: signatureDataUrl }))
                  }
                />
              </Box>

              <Box p={4} borderRadius="14px" bg={inputBg} border={`1px solid ${borderColor}`}>
                <Checkbox
                  isChecked={formData.clinical_history_consent}
                  onChange={(e) => setFormData(prev => ({ ...prev, clinical_history_consent: e.target.checked }))}
                  colorScheme="teal"
                >
                  Autorizo que mis medidas y resultados se registren en un historial clínico para futuras consultas.
                </Checkbox>
                <Text fontSize="xs" color={subtitleColor} mt={1}>
                  Esta autorización es independiente del consentimiento del examen — es opcional, pero recomendada para dar mejor seguimiento a su salud visual.
                </Text>
              </Box>
            </Box>

            <Stack direction={{ base: "column", sm: "row" }} spacing={3} justify="flex-end" pt={2} borderTop={`1px solid ${borderColor}`} mt={2}>
              {!formData.patient_id && lastSavedPatientId && (
                <Text fontSize="xs" color={subtitleColor} alignSelf="center" mr="auto">
                  Continuar venta de: {(() => {
                    const p = patients.find((pt) => String(pt.id) === String(lastSavedPatientId));
                    return p ? `${p.pt_firstname} ${p.pt_lastname}` : 'paciente recién atendido';
                  })()}
                </Text>
              )}
              <Button
                variant="outline"
                onClick={() => handleNavigate(`/sales/${formData.patient_id || lastSavedPatientId}`)}
                isDisabled={!formData.patient_id && !lastSavedPatientId}
                size="lg"
                borderRadius="12px"
                px={8}
              >
                Realizar Venta
              </Button>
              <Button
                type="submit"
                bg={ACCENT}
                color="white"
                _hover={{ bg: '#00967f' }}
                size="lg"
                borderRadius="12px"
                px={8}
                isLoading={isSaving}
                loadingText="Guardando..."
                isDisabled={isSaving}
              >
                Guardar Medidas
              </Button>
            </Stack>
          </Box>
        </Box>
      </Container>

      <ScanRxModal
        isOpen={isScanOpen}
        onClose={() => setIsScanOpen(false)}
        onApply={handleApplyScan}
      />
    </Box>
  );
};

export default MeasuresFinal;
