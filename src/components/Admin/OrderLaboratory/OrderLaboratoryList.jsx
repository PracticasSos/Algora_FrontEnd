import { useState, useEffect } from "react";
import { supabase } from "../../../api/supabase";
import {
  Box, Container, Heading, Text, Table, Thead, Tbody, Tr, Th, Td, Input,
  Select, Flex, HStack, VStack, Icon, Badge, IconButton, Spinner,
  useColorModeValue, useToast, useDisclosure, Modal, ModalOverlay,
  ModalContent, ModalHeader, ModalCloseButton, ModalBody, ModalFooter,
  Button, SimpleGrid,
} from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";
import SmartHeader from "../../header/SmartHeader";
import {
  FlaskConical, Search as SearchIcon, ChevronLeft, ChevronRight,
  Eye, Trash2, Plus, Building2, Beaker,
} from "lucide-react";

const ACCENT = "#00A88E";
const PAGE_SIZE = 10;
const FETCH_CAP = 1000;

const STATUS_MAP = {
  enviado: "Enviado",
  recibido_lab: "Recibido por Laboratorio",
  en_proceso: "En Proceso",
  despachado: "Despachado",
  recibido_optica: "Recibido en Óptica",
  entregado_paciente: "Entregado al Paciente",
  cancelado: "Cancelado",
};

const STATUS_COLOR_MAP = {
  enviado: "gray",
  recibido_lab: "blue",
  en_proceso: "cyan",
  despachado: "orange",
  recibido_optica: "purple",
  entregado_paciente: "teal",
  cancelado: "red",
};

const STATUS_OPTIONS = Object.entries(STATUS_MAP).map(([key, value]) => ({ key, value }));

const OrderLaboratoryList = () => {
  const [allOrders, setAllOrders] = useState([]);
  const [labs, setLabs] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterLab, setFilterLab] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterBranch, setFilterBranch] = useState("");
  const [page, setPage] = useState(1);

  const navigate = useNavigate();
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchFilterData();
    fetchOrders();
  }, []);

  const fetchFilterData = async () => {
    try {
      const [labsRes, branchesRes] = await Promise.all([
        supabase.from("labs").select("id, name"),
        supabase.from("branchs").select("id, name"),
      ]);
      if (labsRes.error) throw labsRes.error;
      if (branchesRes.error) throw branchesRes.error;
      setLabs(labsRes.data || []);
      setBranches(branchesRes.data || []);
    } catch (error) {
      console.error("Error cargando filtros:", error);
    }
  };

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("lab_orders")
        .select(`
          id, created_at, status, pdf_url, patient_id, lab_id, sale_id,
          patients ( pt_firstname, pt_lastname ),
          labs ( name ),
          sales ( branchs_id )
        `)
        .order("created_at", { ascending: false })
        .limit(FETCH_CAP);

      if (error) throw error;
      setAllOrders(data || []);
    } catch (error) {
      console.error("Error cargando órdenes:", error);
      toast({ title: "Error al cargar órdenes", description: error.message, status: "error", duration: 5000, isClosable: true });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOrder = () => {
    // La ruta real para crear una orden necesita un paciente y una venta
    // específicos (/order-laboratory-list/laboratory-order/:patientId/:saleId)
    // — se guía al usuario a elegir la venta desde ahí primero.
    toast({
      title: "Elige la venta primero",
      description: "Selecciona la venta del paciente para la que quieres crear la orden de laboratorio.",
      status: "info",
      duration: 5000,
      isClosable: true,
    });
    navigate("/history-clinic");
  };

  const handleStatusChange = async (orderId, newStatus, e) => {
    e.stopPropagation();
    try {
      const { data, error } = await supabase
        .from("lab_orders")
        .update({ status: newStatus })
        .eq("id", orderId)
        .select()
        .single();
      if (error) throw error;
      setAllOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status: data.status } : o)));
      toast({ title: "Estado actualizado", description: `La orden #${orderId} ahora está: ${STATUS_MAP[newStatus]}`, status: "success", duration: 3000, isClosable: true });
    } catch (error) {
      console.error("Error actualizando estado:", error);
      toast({ title: "Error al actualizar", description: error.message, status: "error", duration: 5000, isClosable: true });
    }
  };

  const handleOpenDeleteModal = (order, e) => {
    e.stopPropagation();
    setSelectedOrder(order);
    onOpen();
  };

  const handleDeleteOrder = async () => {
    if (!selectedOrder) return;
    setIsDeleting(true);
    try {
      const { error } = await supabase.from("lab_orders").delete().eq("id", selectedOrder.id);
      if (error) throw error;
      toast({ title: "Orden eliminada", description: `La orden #${selectedOrder.id} ha sido eliminada.`, status: "success", duration: 3000, isClosable: true });
      onClose();
      fetchOrders();
    } catch (error) {
      console.error("Error eliminando orden:", error);
      toast({ title: "Error al eliminar", description: error.message, status: "error", duration: 5000, isClosable: true });
    } finally {
      setIsDeleting(false);
      setSelectedOrder(null);
    }
  };

  const handleViewPdf = (pdfUrl, e) => {
    e.stopPropagation();
    if (pdfUrl) {
      window.open(pdfUrl, "_blank", "noopener,noreferrer");
    } else {
      toast({ title: "PDF no disponible", description: "Esta orden no tiene un PDF adjunto.", status: "warning", duration: 3000, isClosable: true });
    }
  };

  const branchName = (id) => branches.find((b) => String(b.id) === String(id))?.name || "—";

  const filtered = allOrders.filter((o) => {
    if (filterLab && String(o.lab_id) !== String(filterLab)) return false;
    if (filterStatus && o.status !== filterStatus) return false;
    if (filterBranch && String(o.sales?.branchs_id) !== String(filterBranch)) return false;
    if (!search.trim()) return true;
    const term = search.toLowerCase();
    return (
      o.patients?.pt_firstname?.toLowerCase().includes(term) ||
      o.patients?.pt_lastname?.toLowerCase().includes(term) ||
      String(o.id).includes(term)
    );
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const cardBg = useColorModeValue("white", "gray.700");
  const inputBg = useColorModeValue("gray.50", "gray.700");
  const borderColor = useColorModeValue("gray.200", "gray.600");
  const subtitleColor = useColorModeValue("gray.500", "gray.400");
  const sectionIconBg = useColorModeValue("#E6FBF6", "rgba(0,168,142,0.15)");
  const rowHoverBg = useColorModeValue("gray.50", "whiteAlpha.100");

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

      <Container maxW="1200px" py={8} px={{ base: 3, md: 6 }}>
        <Box
          borderRadius="24px"
          bg={cardBg}
          border={`1px solid ${borderColor}`}
          boxShadow={useColorModeValue("0 20px 45px -20px rgba(0,168,142,0.25)", "0 20px 45px -20px rgba(0,168,142,0.35)")}
          overflow="hidden"
        >
          <Box h="5px" bgGradient="linear(to-r, #00A88E, #2DD4BF, #00A88E)" />
          <Box p={{ base: 5, md: 8 }}>
            <Flex justify="space-between" align="center" mb={6} flexWrap="wrap" gap={3}>
              <HStack spacing={3}>
                <Flex align="center" justify="center" boxSize="44px" borderRadius="14px" bgGradient="linear(to-br, #00A88E, #00786A)" color="white" boxShadow="0 6px 16px -4px rgba(0,168,142,0.5)">
                  <Icon as={FlaskConical} boxSize="20px" />
                </Flex>
                <VStack align="start" spacing={0}>
                  <Heading size="lg" fontWeight="800" color={useColorModeValue("gray.800", "white")} letterSpacing="tight">
                    Órdenes de Laboratorio
                  </Heading>
                  <Text fontSize="xs" color={subtitleColor}>{filtered.length} orden{filtered.length !== 1 ? "es" : ""}</Text>
                </VStack>
              </HStack>
              <Button leftIcon={<Plus size={16} />} bg={ACCENT} color="white" _hover={{ bg: "#00967f" }} borderRadius="12px" onClick={handleCreateOrder}>
                Crear Orden
              </Button>
            </Flex>

            <SectionTitle icon={SearchIcon}>Filtros</SectionTitle>
            <SimpleGrid columns={{ base: 1, md: 4 }} spacing={4} mb={6}>
              <Box position="relative" gridColumn={{ md: "span 1" }}>
                <Icon as={SearchIcon} position="absolute" left="14px" top="12px" color={subtitleColor} zIndex={1} />
                <Input
                  placeholder="Paciente o # de orden..."
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                  pl="40px"
                  borderRadius="12px"
                  bg={inputBg}
                  borderColor={borderColor}
                  _focus={{ borderColor: ACCENT, boxShadow: `0 0 0 1px ${ACCENT}` }}
                />
              </Box>
              <Select placeholder="Todas las sucursales" value={filterBranch} onChange={(e) => { setFilterBranch(e.target.value); setPage(1); }} borderRadius="12px" bg={inputBg} borderColor={borderColor} _focus={{ borderColor: ACCENT, boxShadow: `0 0 0 1px ${ACCENT}` }}>
                {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
              </Select>
              <Select placeholder="Todos los laboratorios" value={filterLab} onChange={(e) => { setFilterLab(e.target.value); setPage(1); }} borderRadius="12px" bg={inputBg} borderColor={borderColor} _focus={{ borderColor: ACCENT, boxShadow: `0 0 0 1px ${ACCENT}` }}>
                {labs.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
              </Select>
              <Select placeholder="Todos los estados" value={filterStatus} onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }} borderRadius="12px" bg={inputBg} borderColor={borderColor} _focus={{ borderColor: ACCENT, boxShadow: `0 0 0 1px ${ACCENT}` }}>
                {STATUS_OPTIONS.map((s) => <option key={s.key} value={s.key}>{s.value}</option>)}
              </Select>
            </SimpleGrid>

            {loading ? (
              <Flex justify="center" py={16}><Spinner color={ACCENT} /></Flex>
            ) : filtered.length === 0 ? (
              <Text textAlign="center" color={subtitleColor} py={12}>No se encontraron órdenes con esos filtros.</Text>
            ) : (
              <>
                <Box overflowX="auto" borderRadius="14px" border={`1px solid ${borderColor}`}>
                  <Table variant="simple" size="sm">
                    <Thead>
                      <Tr>
                        <Th color={subtitleColor}>Orden</Th>
                        <Th color={subtitleColor}>Paciente</Th>
                        <Th color={subtitleColor}>Laboratorio</Th>
                        <Th color={subtitleColor}>Estado</Th>
                        <Th color={subtitleColor} textAlign="right">Acciones</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {pageItems.map((order) => (
                        <Tr key={order.id} _hover={{ bg: rowHoverBg }}>
                          <Td>
                            <Text fontWeight="bold">#{order.id}</Text>
                            <Text fontSize="xs" color={subtitleColor}>
                              {new Date(order.created_at).toLocaleDateString("es-EC", { day: "2-digit", month: "short", year: "numeric" })}
                            </Text>
                          </Td>
                          <Td>{order.patients?.pt_firstname} {order.patients?.pt_lastname}</Td>
                          <Td>
                            <HStack spacing={1}>
                              <Icon as={Beaker} boxSize="12px" color={subtitleColor} />
                              <Text fontSize="sm">{order.labs?.name || "—"}</Text>
                            </HStack>
                          </Td>
                          <Td>
                            <Select
                              size="sm"
                              value={order.status}
                              minW="170px"
                              borderRadius="8px"
                              bg={inputBg}
                              borderColor={borderColor}
                              onClick={(e) => e.stopPropagation()}
                              onChange={(e) => handleStatusChange(order.id, e.target.value, e)}
                            >
                              {STATUS_OPTIONS.map((s) => <option key={s.key} value={s.key}>{s.value}</option>)}
                            </Select>
                          </Td>
                          <Td textAlign="right">
                            <HStack justify="flex-end" spacing={1}>
                              <Badge colorScheme={STATUS_COLOR_MAP[order.status] || "gray"} borderRadius="full" px={2} display={{ base: "none", lg: "inline-flex" }}>
                                {STATUS_MAP[order.status]}
                              </Badge>
                              <IconButton
                                aria-label="Ver PDF"
                                icon={<Eye size={15} />}
                                size="sm"
                                variant="ghost"
                                colorScheme="teal"
                                isDisabled={!order.pdf_url}
                                onClick={(e) => handleViewPdf(order.pdf_url, e)}
                              />
                              <IconButton
                                aria-label="Eliminar orden"
                                icon={<Trash2 size={15} />}
                                size="sm"
                                variant="ghost"
                                colorScheme="red"
                                onClick={(e) => handleOpenDeleteModal(order, e)}
                              />
                            </HStack>
                          </Td>
                        </Tr>
                      ))}
                    </Tbody>
                  </Table>
                </Box>

                <Flex justify="space-between" align="center" mt={5} flexWrap="wrap" gap={3}>
                  <Text fontSize="xs" color={subtitleColor}>Página {page} de {totalPages} · {filtered.length} en total</Text>
                  <HStack>
                    <IconButton icon={<ChevronLeft size={16} />} size="sm" variant="outline" borderRadius="full" isDisabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))} aria-label="Anterior" />
                    <Text fontSize="sm" fontWeight="semibold" minW="30px" textAlign="center">{page}</Text>
                    <IconButton icon={<ChevronRight size={16} />} size="sm" variant="outline" borderRadius="full" isDisabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))} aria-label="Siguiente" />
                  </HStack>
                </Flex>
              </>
            )}
          </Box>
        </Box>
      </Container>

      <Modal isOpen={isOpen} onClose={onClose} isCentered>
        <ModalOverlay />
        <ModalContent bg={cardBg} borderRadius="16px">
          <ModalHeader fontSize="lg" color="red.500">Confirmar eliminación</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Text>¿Seguro que deseas eliminar la orden <Text as="b" color="red.400">#{selectedOrder?.id}</Text>?</Text>
            <Text mt={2} fontSize="sm" color={subtitleColor}>Esta acción no se puede deshacer.</Text>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose}>Cancelar</Button>
            <Button colorScheme="red" onClick={handleDeleteOrder} isLoading={isDeleting} loadingText="Eliminando..." borderRadius="10px">
              Eliminar
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default OrderLaboratoryList;
