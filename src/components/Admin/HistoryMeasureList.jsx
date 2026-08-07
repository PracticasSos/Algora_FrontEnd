import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../api/supabase";
import {
  Box, Container, Heading, Text, Table, Thead, Tbody, Tr, Th, Td, Input,
  Flex, HStack, VStack, Icon, Badge, IconButton, Spinner, useColorModeValue,
} from "@chakra-ui/react";
import { History, Search as SearchIcon, ChevronLeft, ChevronRight, ClipboardList } from "lucide-react";
import SmartHeader from "../header/SmartHeader";

const ACCENT = "#00A88E";
const PAGE_SIZE = 10;
// Tope razonable para traer medidas recientes y deducir el orden real
// (paciente con la medida más nueva primero). Cubre holgadamente el uso
// normal de una óptica; si algún día se necesita más, se puede subir.
const FETCH_CAP = 1000;

const HistoryMeasureList = () => {
  const [allPatients, setAllPatients] = useState([]); // ya deduplicados y ordenados
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const navigate = useNavigate();

  useEffect(() => {
    fetchPatientsWithMeasures();
  }, []);

  const fetchPatientsWithMeasures = async () => {
    setLoading(true);
    try {
      // Se ordena por la fecha real de la medida (created_at), no por la
      // fecha de registro del paciente — así el último examen hecho
      // siempre aparece primero, sin depender de un campo editable a mano.
      const { data, error } = await supabase
        .from("rx_final")
        .select(`
          patient_id,
          created_at,
          patients:patients (id, pt_firstname, pt_lastname, pt_ci, pt_occupation, pt_phone)
        `)
        .order("created_at", { ascending: false })
        .limit(FETCH_CAP);

      if (error) throw error;

      const seen = new Set();
      const unique = [];
      (data || []).forEach((rx) => {
        if (!seen.has(rx.patient_id)) {
          seen.add(rx.patient_id);
          unique.push({
            patient_id: rx.patient_id,
            last_measure_at: rx.created_at,
            pt_firstname: rx.patients?.pt_firstname || "",
            pt_lastname: rx.patients?.pt_lastname || "",
            pt_ci: rx.patients?.pt_ci || "",
            pt_occupation: rx.patients?.pt_occupation || "",
            pt_phone: rx.patients?.pt_phone || "",
          });
        }
      });

      setAllPatients(unique);
    } catch (err) {
      console.error("Error cargando historial de medidas:", err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = allPatients.filter((p) => {
    if (!search.trim()) return true;
    const term = search.toLowerCase();
    return (
      p.pt_firstname.toLowerCase().includes(term) ||
      p.pt_lastname.toLowerCase().includes(term) ||
      p.pt_ci.toLowerCase().includes(term)
    );
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleViewHistory = (patientId) => {
    navigate(`/history-measure-list/history-measures/${patientId}`);
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

      <Container maxW="1050px" py={8} px={{ base: 3, md: 6 }}>
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
                align="center"
                justify="center"
                boxSize="44px"
                borderRadius="14px"
                bgGradient="linear(to-br, #00A88E, #00786A)"
                color="white"
                boxShadow="0 6px 16px -4px rgba(0,168,142,0.5)"
              >
                <Icon as={History} boxSize="20px" />
              </Flex>
              <VStack align="start" spacing={0}>
                <Heading size="lg" fontWeight="800" color={useColorModeValue("gray.800", "white")} letterSpacing="tight">
                  Historial de Medidas
                </Heading>
                <Text fontSize="xs" color={subtitleColor}>
                  {allPatients.length} paciente{allPatients.length !== 1 ? "s" : ""} con medidas registradas
                </Text>
              </VStack>
            </HStack>

            <Flex position="relative" mb={5}>
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
            </Flex>

            {loading ? (
              <Flex justify="center" py={16}>
                <Spinner color={ACCENT} />
              </Flex>
            ) : filtered.length === 0 ? (
              <Text textAlign="center" color={subtitleColor} py={12}>
                No se encontraron pacientes con medidas registradas{search ? ` para "${search}"` : ""}.
              </Text>
            ) : (
              <>
                <Box overflowX="auto" borderRadius="14px" border={`1px solid ${borderColor}`}>
                  <Table variant="simple" size="sm">
                    <Thead>
                      <Tr>
                        <Th color={subtitleColor}>Paciente</Th>
                        <Th color={subtitleColor}>Teléfono</Th>
                        <Th color={subtitleColor}>Ocupación</Th>
                        <Th color={subtitleColor}>Última medida</Th>
                        <Th color={subtitleColor} textAlign="right">Acciones</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {pageItems.map((p) => (
                        <Tr
                          key={p.patient_id}
                          cursor="pointer"
                          _hover={{ bg: rowHoverBg }}
                          onClick={() => handleViewHistory(p.patient_id)}
                        >
                          <Td>
                            <Text fontWeight="semibold">{p.pt_firstname} {p.pt_lastname}</Text>
                            <Text fontSize="xs" color={subtitleColor}>{p.pt_ci || "Sin C.I."}</Text>
                          </Td>
                          <Td>{p.pt_phone || "—"}</Td>
                          <Td>{p.pt_occupation || "—"}</Td>
                          <Td>
                            <Badge colorScheme="teal" borderRadius="full" px={2}>
                              {p.last_measure_at ? new Date(p.last_measure_at).toLocaleDateString("es-EC", { day: "2-digit", month: "short", year: "numeric" }) : "—"}
                            </Badge>
                          </Td>
                          <Td textAlign="right" onClick={(e) => e.stopPropagation()}>
                            <IconButton
                              icon={<ClipboardList size={15} />}
                              size="sm"
                              variant="ghost"
                              colorScheme="teal"
                              aria-label="Ver todas sus medidas"
                              title="Ver todas sus medidas"
                              onClick={() => handleViewHistory(p.patient_id)}
                            />
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
    </Box>
  );
};

export default HistoryMeasureList;
