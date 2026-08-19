import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../../api/supabase";
import {
  Box, Container, Heading, Text, Flex, HStack, VStack, Icon, Badge, Spinner,
  useColorModeValue, Button, SimpleGrid, IconButton,
  Modal, ModalOverlay, ModalContent, ModalHeader, ModalCloseButton, ModalBody, FormControl, FormLabel,
} from "@chakra-ui/react";
import { ArrowLeft, Eye, ClipboardList, ChevronLeft, ChevronRight, FileText } from "lucide-react";
import SmartHeader from "../header/SmartHeader";

const ACCENT = "#00A88E";
const PAGE_SIZE = 5;

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

const CLINICAL_FIELDS = [
  { key: "pt_ci", label: "C.I." },
  { key: "sexo", label: "Sexo" },
  { key: "pt_birthdate", label: "Fecha de nacimiento" },
  { key: "pt_age", label: "Edad" },
  { key: "pt_phone", label: "Teléfono" },
  { key: "pt_email", label: "Correo" },
  { key: "pt_address", label: "Dirección" },
  { key: "pt_city", label: "Ciudad" },
  { key: "pt_occupation", label: "Ocupación" },
  { key: "date", label: "Fecha de registro" },
];

const HistoryMeasures = () => {
  const { patientId } = useParams();
  const [measures, setMeasures] = useState([]);
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [isClinicalOpen, setIsClinicalOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patientId]);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [measuresRes, patientRes] = await Promise.all([
        supabase.from("rx_final").select("*").eq("patient_id", patientId).order("created_at", { ascending: false }),
        supabase.from("patients").select("*, users(firstname, lastname), branchs(name)").eq("id", patientId).maybeSingle(),
      ]);
      if (measuresRes.error) throw measuresRes.error;
      setMeasures(measuresRes.data || []);
      setPatient(patientRes.data || null);
    } catch (err) {
      console.error("Error cargando historial:", err);
    } finally {
      setLoading(false);
    }
  };

  const totalPages = Math.max(1, Math.ceil(measures.length / PAGE_SIZE));
  const pageItems = measures.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

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
        <Button
          size="sm"
          variant="ghost"
          leftIcon={<ArrowLeft size={16} />}
          mb={3}
          onClick={() => navigate("/history-measure-list")}
        >
          Volver al historial
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
          <Box p={{ base: 5, md: 8 }}>
            <Flex justify="space-between" align="center" mb={5} flexWrap="wrap" gap={3}>
              <HStack spacing={3}>
                <Flex
                  align="center" justify="center" boxSize="44px" borderRadius="14px"
                  bgGradient="linear(to-br, #00A88E, #00786A)" color="white"
                  boxShadow="0 6px 16px -4px rgba(0,168,142,0.5)"
                >
                  <Icon as={Eye} boxSize="20px" />
                </Flex>
                <VStack align="start" spacing={0}>
                  <Heading size="lg" fontWeight="800" color={useColorModeValue("gray.800", "white")} letterSpacing="tight">
                    {loading ? "Cargando..." : patient ? `${patient.pt_firstname} ${patient.pt_lastname}` : "Paciente"}
                  </Heading>
                  <Text fontSize="xs" color={subtitleColor}>
                    {measures.length} examen{measures.length !== 1 ? "es" : ""} registrado{measures.length !== 1 ? "s" : ""}
                  </Text>
                </VStack>
              </HStack>
              <Button
                size="sm"
                variant="outline"
                colorScheme="teal"
                leftIcon={<FileText size={15} />}
                onClick={() => setIsClinicalOpen(true)}
                isDisabled={!patient}
              >
                Ver historia clínica
              </Button>
            </Flex>

            {loading ? (
              <Flex justify="center" py={16}>
                <Spinner color={ACCENT} />
              </Flex>
            ) : measures.length === 0 ? (
              <Text textAlign="center" color={subtitleColor} py={12}>
                Este paciente todavía no tiene medidas registradas.
              </Text>
            ) : (
              <>
                <SectionTitle icon={ClipboardList}>Exámenes realizados</SectionTitle>
                <VStack spacing={4} align="stretch">
                  {pageItems.map((measure) => (
                    <Box key={measure.id} p={4} borderRadius="14px" bg={inputBg} border={`1px solid ${borderColor}`}>
                      <Flex justify="space-between" align="center" mb={3} flexWrap="wrap" gap={2}>
                        <Badge colorScheme="teal" borderRadius="full" px={3} py={1}>
                          {new Date(measure.created_at).toLocaleDateString("es-EC", { day: "2-digit", month: "long", year: "numeric" })}
                        </Badge>
                        {measure.diagnosis && (
                          <Text fontSize="xs" color={subtitleColor} noOfLines={1} maxW="60%">
                            {measure.diagnosis}
                          </Text>
                        )}
                      </Flex>

                      <Box overflowX="auto">
                        <SimpleGrid columns={11} minW="700px" fontSize="xs" gap={1} mb={1} color={subtitleColor} fontWeight="bold">
                          <Box></Box>
                          {measureFields.map(({ label, key }) => (
                            <Box key={key} textAlign="center">{label}</Box>
                          ))}
                        </SimpleGrid>
                        {["OD", "OI"].map((eye) => (
                          <SimpleGrid key={eye} columns={11} minW="700px" fontSize="sm" gap={1} py={1}>
                            <Box fontWeight="bold" color={ACCENT}>{eye}</Box>
                            {measureFields.map(({ key }) => (
                              <Box key={key} textAlign="center">
                                {measure[`${key}_${eye === "OD" ? "right" : "left"}`] || "—"}
                              </Box>
                            ))}
                          </SimpleGrid>
                        ))}
                      </Box>

                      <HStack mt={3} spacing={4} flexWrap="wrap" fontSize="xs" color={subtitleColor}>
                        {measure.near_vision_line && <Text>Jaeger: J{measure.near_vision_line.replace("J", "")}</Text>}
                        {measure.far_vision && <Text>Visión lejana: {measure.far_vision}</Text>}
                        {measure.color_perception !== null && (
                          <Text>Colores: {measure.color_perception ? "Distingue bien" : `Dificultad (${measure.color_issues || "—"})`}</Text>
                        )}
                      </HStack>
                    </Box>
                  ))}
                </VStack>

                {totalPages > 1 && (
                  <Flex justify="space-between" align="center" mt={5} flexWrap="wrap" gap={3}>
                    <Text fontSize="xs" color={subtitleColor}>
                      Página {page} de {totalPages}
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
                )}
              </>
            )}
          </Box>
        </Box>
      </Container>

      {/* Modal de historia clínica completa */}
      <Modal isOpen={isClinicalOpen} onClose={() => setIsClinicalOpen(false)} size={{ base: "full", md: "xl" }} isCentered>
        <ModalOverlay />
        <ModalContent bg={cardBg} borderRadius={{ base: 0, md: "20px" }}>
          <ModalHeader fontSize="md">
            Historia clínica — {patient?.pt_firstname} {patient?.pt_lastname}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <SimpleGrid columns={{ base: 1, sm: 2 }} spacing={4} mb={4}>
              {CLINICAL_FIELDS.map(({ key, label }) => (
                <FormControl key={key}>
                  <FormLabel fontSize="xs" color={subtitleColor} mb={1}>{label}</FormLabel>
                  <Text fontSize="sm" fontWeight="medium">{patient?.[key] || "—"}</Text>
                </FormControl>
              ))}
            </SimpleGrid>
            <FormControl mb={3}>
              <FormLabel fontSize="xs" color={subtitleColor} mb={1}>Razón de consulta</FormLabel>
              <Text fontSize="sm">{patient?.pt_consultation_reason || "—"}</Text>
            </FormControl>
            <FormControl mb={3}>
              <FormLabel fontSize="xs" color={subtitleColor} mb={1}>Recomendaciones</FormLabel>
              <Text fontSize="sm">{patient?.pt_recommendations || "—"}</Text>
            </FormControl>
            <HStack spacing={4} mt={4} pt={4} borderTop={`1px solid ${borderColor}`} flexWrap="wrap">
              <Badge colorScheme={patient?.pt_data_consent ? "teal" : "red"} borderRadius="full" px={3} py={1}>
                {patient?.pt_data_consent ? "Consentimiento de datos ✓" : "Sin consentimiento de datos"}
              </Badge>
              {patient?.branchs?.name && (
                <Badge colorScheme="purple" borderRadius="full" px={3} py={1}>
                  Registrado en {patient.branchs.name}
                </Badge>
              )}
              {patient?.users && (
                <Badge colorScheme="blue" borderRadius="full" px={3} py={1}>
                  Por {patient.users.firstname} {patient.users.lastname}
                </Badge>
              )}
            </HStack>
          </ModalBody>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default HistoryMeasures;
