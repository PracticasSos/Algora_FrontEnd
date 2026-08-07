import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../api/supabase";
import {
  Box, Container, Heading, Text, Table, Thead, Tbody, Tr, Th, Td, Input, Select,
  Flex, HStack, VStack, Icon, Badge, IconButton, Spinner, useColorModeValue,
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

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const branchName = (branchId) => branches.find((b) => String(b.id) === String(branchId))?.name || "—";

  const handleViewSale = (sale) => {
    if (!sale.patients?.id) return;
    navigate(`/history-clinic/patient-history/${sale.patients.id}`, { state: { patientData: sale.patients } });
  };

  const handleSendWhatsApp = (sale) => {
    if (!sale.pdf_url || !sale.patients?.pt_phone) return;
    let mensaje = messageTemplate.replace("{nombre}", sale.patients.pt_firstname || "");
    mensaje = mensaje.includes("{pdf_url}") ? mensaje.replace("{pdf_url}", sale.pdf_url) : `${mensaje} ${sale.pdf_url}`;
    const url = `https://wa.me/${sale.patients.pt_phone}?text=${encodeURIComponent(mensaje)}`;
    window.open(url, "_blank");
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
                  {allSales.length} venta{allSales.length !== 1 ? "s" : ""} registrada{allSales.length !== 1 ? "s" : ""}
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
            ) : filtered.length === 0 ? (
              <Text textAlign="center" color={subtitleColor} py={12}>
                No se encontraron ventas{search ? ` para "${search}"` : ""}.
              </Text>
            ) : (
              <>
                <Box overflowX="auto" borderRadius="14px" border={`1px solid ${borderColor}`}>
                  <Table variant="simple" size="sm">
                    <Thead>
                      <Tr>
                        <Th color={subtitleColor}>Paciente</Th>
                        <Th color={subtitleColor}>Fecha</Th>
                        <Th color={subtitleColor}>Sucursal</Th>
                        <Th color={subtitleColor} textAlign="right">Total</Th>
                        <Th color={subtitleColor} textAlign="right">Saldo</Th>
                        <Th color={subtitleColor} textAlign="right">Acciones</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {pageItems.map((sale) => (
                        <Tr
                          key={sale.id}
                          cursor="pointer"
                          _hover={{ bg: rowHoverBg }}
                          onClick={() => handleViewSale(sale)}
                        >
                          <Td>
                            <Text fontWeight="semibold">
                              {sale.patients?.pt_firstname} {sale.patients?.pt_lastname}
                            </Text>
                            <Text fontSize="xs" color={subtitleColor}>{sale.patients?.pt_ci || "Sin C.I."}</Text>
                          </Td>
                          <Td>{sale.date ? new Date(sale.date).toLocaleDateString("es-EC") : "—"}</Td>
                          <Td>{branchName(sale.branchs_id)}</Td>
                          <Td textAlign="right" fontWeight="semibold">{formatMoney(sale.total)}</Td>
                          <Td textAlign="right">
                            <Badge colorScheme={Number(sale.credit) > 0 ? "orange" : "teal"} borderRadius="full" px={2}>
                              {formatMoney(sale.credit)}
                            </Badge>
                          </Td>
                          <Td textAlign="right" onClick={(e) => e.stopPropagation()}>
                            <HStack justify="flex-end" spacing={1}>
                              <IconButton
                                icon={<Eye size={15} />}
                                size="sm"
                                variant="ghost"
                                colorScheme="teal"
                                aria-label="Ver venta"
                                onClick={() => handleViewSale(sale)}
                              />
                              {sale.pdf_url && sale.patients?.pt_phone && (
                                <IconButton
                                  icon={<MessageCircle size={15} />}
                                  size="sm"
                                  variant="ghost"
                                  colorScheme="green"
                                  aria-label="Enviar por WhatsApp"
                                  title="Enviar por WhatsApp"
                                  onClick={() => handleSendWhatsApp(sale)}
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
    </Box>
  );
};

export default HistoryClinic;
