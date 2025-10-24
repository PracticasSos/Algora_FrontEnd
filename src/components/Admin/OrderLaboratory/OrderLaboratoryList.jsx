import { useState, useEffect } from "react";
import { supabase } from "../../../api/supabase";
import {
  Divider,
  Text,
  Box,
  Button,
  Heading,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Input,
  FormControl,
  FormLabel,
  Select,
  Spinner,
  Flex,
  Icon,
  Tag,
  SimpleGrid,
  useColorModeValue,
  // --- 1. Imports NUEVOS ---
  useToast,
  IconButton,
  HStack,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
} from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";
import SmartHeader from "../../header/SmartHeader";
import {
  FaClinicMedical,
  FaFilter,
  FaPlus,
  FaEye, // <-- NUEVO
  FaTrash, // <-- NUEVO
} from "react-icons/fa";

// --- Diccionarios para traducir el ESTADO ---
const STATUS_MAP = {
  enviado: "Enviado",
  recibido_lab: "Recibido por Laboratorio",
  en_proceso: "En Proceso",
  despachado: "Despachado",
  recibido_optica: "Recibido en Óptica",
  entregado_paciente: "Entregado al Paciente",
  //con_garantia: "En Garantía",
  cancelado: "Cancelado",
};

const STATUS_COLOR_MAP = {
  enviado: "gray",
  recibido_lab: "blue",
  en_proceso: "cyan",
  despachado: "orange",
  recibido_optica: "purple",
  entregado_paciente: "green",
  //con_garantia: "yellow",
  cancelado: "red",
};

// --- Array de estados para los <Select> ---
const STATUS_OPTIONS = Object.entries(STATUS_MAP).map(([key, value]) => ({
  key,
  value,
}));

const OrderLaboratoryList = () => {
  // --- Estados para el historial y filtros ---
  const [orders, setOrders] = useState([]);
  const [labs, setLabs] = useState([]);
  const [branches, setBranches] = useState([]);

  const [filterLab, setFilterLab] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterBranch, setFilterBranch] = useState("");
  const [filterDates, setFilterDates] = useState({
    since: "",
    till: "",
  });

  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // --- 2. Estados NUEVOS para el modal y acciones ---
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure(); // Para el modal
  const [selectedOrder, setSelectedOrder] = useState(null); // Orden a eliminar
  const [isDeleting, setIsDeleting] = useState(false); // Spinner del modal

  // Cargar los filtros (laboratorios y sucursales) al inicio
  useEffect(() => {
    fetchFilterData();
  }, []);

  // Cargar las órdenes cuando se monta el componente
  useEffect(() => {
    fetchOrders();
  }, []);

  // Función para cargar los Select de los filtros
  const fetchFilterData = async () => {
    try {
      const [labsRes, branchesRes] = await Promise.all([
        supabase.from("labs").select("id, name"),
        supabase.from("branchs").select("id, name"),
      ]);

      if (labsRes.error) throw labsRes.error;
      if (branchesRes.error) throw branchesRes.error;

      setLabs(labsRes.data);
      setBranches(branchesRes.data);
    } catch (error) {
      console.error("Error fetching filter data:", error);
    }
  };

  // --- 3. Función de traer ÓRDENES (MODIFICADA) ---
  const fetchOrders = async () => {
    setLoading(true);
    try {
      // Empezamos la consulta en 'lab_orders'
      let query = supabase.from("lab_orders").select(`
        id,
        created_at,
        status,
        pdf_url, 
        patient_id,
        lab_id,
        sale_id,
        patients ( pt_firstname, pt_lastname ),
        labs ( name ),
        sales ( branchs_id ) 
      `);

      // Aplicar filtros dinámicamente
      if (filterLab) {
        query = query.eq("lab_id", filterLab);
      }
      if (filterStatus) {
        query = query.eq("status", filterStatus);
      }
      if (filterBranch) {
        query = query.eq("sales.branchs_id", filterBranch);
      }
      if (filterDates.since) {
        query = query.gte("created_at", `${filterDates.since}T00:00:00`);
      }
      if (filterDates.till) {
        query = query.lte("created_at", `${filterDates.till}T23:59:59`);
      }

      query = query.order("created_at", { ascending: false });

      const { data, error } = await query;

      if (error) throw error;

      const filteredData = data.filter(order => {
        if (filterBranch) {
          return order.sales && order.sales.branchs_id == filterBranch;
        }
        return true;
      });

      setOrders(filteredData);
    } catch (error) {
      console.error("Error fetching orders:", error);
      toast({
        title: "Error al cargar órdenes",
        description: error.message,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  // Manejador para los filtros de fecha
  const handleDateChange = (e) => {
    const { name, value } = e.target;
    setFilterDates((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Navegación a la página de CREAR ORDEN
  const handleCreateOrder = () => {
    navigate("/laboratorio/crear-orden");
  };

  // (Opcional) Manejar clic en una fila para ver detalles
  const handleRowClick = (orderId) => {
    console.log("Ver detalles de la orden:", orderId);
    // navigate(`/laboratorio/orden/${orderId}`);
  };

  // --- 4. Funciones NUEVAS para acciones ---

  /**
   * Actualiza el estado de una orden en la base de datos
   */
  const handleStatusChange = async (orderId, newStatus, e) => {
    e.stopPropagation(); // Evita que se active el handleRowClick

    try {
      const { data, error } = await supabase
        .from("lab_orders")
        .update({ status: newStatus })
        .eq("id", orderId)
        .select()
        .single();

      if (error) throw error;

      // Actualizar la lista localmente (más rápido que un fetch)
      setOrders((prevOrders) =>
        prevOrders.map((order) =>
          order.id === orderId ? { ...order, status: data.status } : order
        )
      );

      toast({
        title: "Estado actualizado",
        description: `La orden #${orderId} ahora está: ${STATUS_MAP[newStatus]}`,
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error("Error updating status:", error);
      toast({
        title: "Error al actualizar",
        description: error.message,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  };

  /**
   * Abre el modal de confirmación para eliminar
   */
  const handleOpenDeleteModal = (order, e) => {
    e.stopPropagation(); // Evita que se active el handleRowClick
    setSelectedOrder(order);
    onOpen();
  };

  /**
   * Elimina la orden de la base de datos
   */
  const handleDeleteOrder = async () => {
    if (!selectedOrder) return;

    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from("lab_orders")
        .delete()
        .eq("id", selectedOrder.id);

      if (error) throw error;

      toast({
        title: "Orden eliminada",
        description: `La orden #${selectedOrder.id} ha sido eliminada.`,
        status: "success",
        duration: 3000,
        isClosable: true,
      });

      onClose();
      fetchOrders(); // Recargar la lista
    } catch (error) {
      console.error("Error deleting order:", error);
      toast({
        title: "Error al eliminar",
        description: error.message,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsDeleting(false);
      setSelectedOrder(null);
    }
  };

  /**
   * Abre el PDF en una nueva pestaña
   */
  const handleViewPdf = (pdfUrl, e) => {
    e.stopPropagation(); // Evita que se active el handleRowClick
    if (pdfUrl) {
      window.open(pdfUrl, "_blank", "noopener,noreferrer");
    } else {
      toast({
        title: "PDF no disponible",
        description: "Esta orden no tiene un PDF adjunto.",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  // Estilos de Chakra
  const bgColor = useColorModeValue("white", "gray.900");
  const textColor = useColorModeValue("gray.800", "white");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const tableBg = useColorModeValue("white", "gray.800");
  const tableHoverBg = useColorModeValue("teal.50", "teal.900");
  const inputBg = useColorModeValue("gray.50", "gray.800");
  const selectBg = useColorModeValue("gray.50", "gray.800");
  const headerBg = useColorModeValue("teal.600", "teal.400");
  const headerText = useColorModeValue("white", "gray.900");

  return (
    <Box p={{ base: 2, md: 8 }} minH="100vh" bg={useColorModeValue("gray.50", "gray.900")}>
      <SmartHeader moduleSpecificButton={null} />
      <Box
        p={{ base: 2, md: 8 }}
        maxW="1300px"
        mx="auto"
        bg={bgColor}
        color={textColor}
        borderRadius="xl"
        boxShadow="lg"
      >
        {/* --- Título y Botón de Crear --- */}
        <Flex justify="space-between" align="center" mb={6}>
          <Flex align="center" gap={3}>
            <Icon as={FaClinicMedical} boxSize={8} color={headerBg} />
            <Heading
              size="md"
              fontWeight="bold"
              color={headerBg}
              letterSpacing="tight"
            >
              Órdenes de Laboratorio
            </Heading>
          </Flex>
          <Button
            leftIcon={<FaPlus />}
            colorScheme="teal"
            onClick={handleCreateOrder}
          >
            Crear Orden
          </Button>
        </Flex>
        <Divider mb={6} />

        {/* --- Filtros (Sin cambios) --- */}
        <Box
          bg={useColorModeValue("gray.50", "gray.800")}
          p={4}
          borderRadius="lg"
          boxShadow="md"
          mb={8}
        >
          <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6}>
            <FormControl>
              <FormLabel color={textColor} fontWeight="bold">Sucursal</FormLabel>
              <Select
                placeholder="Todas las sucursales"
                value={filterBranch}
                onChange={(e) => setFilterBranch(e.target.value)}
                bg={selectBg}
                borderColor={borderColor}
              >
                {branches.map((branch) => (
                  <option key={branch.id} value={branch.id}>
                    {branch.name}
                  </option>
                ))}
              </Select>
            </FormControl>

            <FormControl>
              <FormLabel color={textColor} fontWeight="bold">Laboratorio</FormLabel>
              <Select
                placeholder="Todos los laboratorios"
                value={filterLab}
                onChange={(e) => setFilterLab(e.target.value)}
                bg={selectBg}
                borderColor={borderColor}
              >
                {labs.map((lab) => (
                  <option key={lab.id} value={lab.id}>
                    {lab.name}
                  </option>
                ))}
              </Select>
            </FormControl>

            <FormControl>
              <FormLabel color={textColor} fontWeight="bold">Estado</FormLabel>
              <Select
                placeholder="Todos los estados"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                bg={selectBg}
                borderColor={borderColor}
              >
                {STATUS_OPTIONS.map((status) => (
                  <option key={status.key} value={status.key}>
                    {status.value}
                  </option>
                ))}
              </Select>
            </FormControl>

            <FormControl>
              <FormLabel color={textColor} fontWeight="bold">Desde</FormLabel>
              <Input
                type="date"
                name="since"
                value={filterDates.since}
                onChange={handleDateChange}
                bg={inputBg}
                borderColor={borderColor}
              />
            </FormControl>

            <FormControl>
              <FormLabel color={textColor} fontWeight="bold">Hasta</FormLabel>
              <Input
                type="date"
                name="till"
                value={filterDates.till}
                onChange={handleDateChange}
                bg={inputBg}
                borderColor={borderColor}
              />
            </FormControl>

            <Button
              leftIcon={<FaFilter />}
              colorScheme="teal"
              size="md"
              onClick={fetchOrders}
              alignSelf="flex-end"
              fontWeight="bold"
            >
              Filtrar
            </Button>
          </SimpleGrid>
        </Box>

        {/* --- 5. Tabla de Órdenes (MODIFICADA) --- */}
        {loading ? (
          <Flex justify="center" align="center" minH="200px">
            <Spinner size="md" color={headerBg} thickness="5px" speed="0.7s" />
          </Flex>
        ) : (
          <Box
            w="full"
            mx="auto"
            bg={tableBg}
            borderRadius="lg"
            boxShadow="md"
            overflowX="auto"
          >
            <Table variant="simple">
              <Thead>
                <Tr bg={headerBg}>
                  <Th color={headerText} borderColor={borderColor}>Orden #</Th>
                  <Th color={headerText} borderColor={borderColor}>Fecha Creación</Th>
                  <Th color={headerText} borderColor={borderColor}>Paciente</Th>
                  <Th color={headerText} borderColor={borderColor}>Laboratorio</Th>
                  <Th color={headerText} borderColor={borderColor}>Estado</Th>
                  <Th color={headerText} borderColor={borderColor}>Acciones</Th>
                </Tr>
              </Thead>
              <Tbody>
                {orders.length === 0 ? (
                  <Tr>
                    <Td colSpan={6} textAlign="center" py={8} color="gray.500">
                      <Text fontSize="lg">No se encontraron órdenes con esos filtros.</Text>
                    </Td>
                  </Tr>
                ) : (
                  orders.map((order) => (
                    <Tr
                      key={order.id}
                      onClick={() => handleRowClick(order.id)}
                      cursor="pointer"
                      _hover={{ bg: tableHoverBg, transition: "background 0.2s" }}
                      borderColor={borderColor}
                    >
                      <Td color={textColor} borderColor={borderColor} fontWeight="bold">
                        {order.id}
                      </Td>
                      <Td color={textColor} borderColor={borderColor}>
                        {new Date(order.created_at).toLocaleDateString("es-ES", {
                          year: "numeric",
                          month: "2-digit",
                          day: "2-digit",
                          hour: "2-digit",
                          minute: "2-digit"
                        })}
                      </Td>
                      <Td color={textColor} borderColor={borderColor}>
                        {order.patients?.pt_firstname} {order.patients?.pt_lastname}
                      </Td>
                      <Td color={textColor} borderColor={borderColor}>
                        {order.labs?.name || 'N/A'}
                      </Td>
                      <Td color={textColor} borderColor={borderColor}>
                        {/* --- Select de Estado (NUEVO) --- */}
                        <Select
                          size="sm"
                          value={order.status}
                          minW="160px"
                          bg={selectBg}
                          borderColor={borderColor}
                          // @ts-ignore
                          d colorScheme={STATUS_COLOR_MAP[order.status] || 'gray'}
                          onClick={(e) => e.stopPropagation()} // Evita click en fila
                          onChange={(e) => handleStatusChange(order.id, e.target.value, e)}
                        >
                          {STATUS_OPTIONS.map((status) => (
                            <option key={status.key} value={status.key}>
                              {status.value}
                            </option>
                          ))}
                        </Select>
                      </Td>
                      <Td color={textColor} borderColor={borderColor}>
                        {/* --- Botones de Acción (NUEVO) --- */}
                        <HStack spacing={2}>
                          <IconButton
                            aria-label="Ver PDF"
                            icon={<FaEye />}
                            colorScheme="blue"
                            size="sm"
                            isDisabled={!order.pdf_url} // Se deshabilita si no hay URL
                            onClick={(e) => handleViewPdf(order.pdf_url, e)}
                          />
                          <IconButton
                            aria-label="Eliminar Orden"
                            icon={<FaTrash />}
                            colorScheme="red"
                            size="sm"
                            onClick={(e) => handleOpenDeleteModal(order, e)}
                          />
                        </HStack>
                      </Td>
                    </Tr>
                  ))
                )}
              </Tbody>
            </Table>
          </Box>
        )}
      </Box>

      {/* --- 6. Modal de Confirmación (NUEVO) --- */}
      <Modal isOpen={isOpen} onClose={onClose} isCentered>
        <ModalOverlay />
        <ModalContent bg={bgColor} color={textColor}>
          <ModalHeader>Confirmar Eliminación</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Text>
              ¿Estás seguro de que deseas eliminar la orden{" "}
              <Text as="b" color="red.400">#{selectedOrder?.id}</Text>?
            </Text>
            <Text mt={2} fontSize="sm" color="gray.500">
              Esta acción no se puede deshacer.
            </Text>
          </ModalBody>

          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose} fontWeight="medium">
              Cancelar
            </Button>
            <Button
              colorScheme="red"
              onClick={handleDeleteOrder}
              isLoading={isDeleting}
              loadingText="Eliminando..."
            >
              Eliminar
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default OrderLaboratoryList;