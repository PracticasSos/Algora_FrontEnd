import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  Heading,
  SimpleGrid,
  useColorModeValue,
  Text,
  HStack,
  VStack,
  Flex,
  Icon,
  IconButton,
  InputGroup,
  InputLeftElement,
  Badge,
  Divider,
  Spinner,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  useDisclosure,
  useToast,
  AlertDialog,
  AlertDialogOverlay,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogBody,
  AlertDialogFooter,
} from "@chakra-ui/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "../../api/supabase.js";
import SmartHeader from "../header/SmartHeader.jsx";
import {
  FlaskConical,
  Plus,
  Search,
  Pencil,
  Trash2,
  Phone,
  Mail,
  FileText,
  MapPin,
  Sparkles,
  PowerOff,
  RotateCcw,
  Archive,
} from "lucide-react";

const ACCENT = "#00A88E";
const EMPTY_FORM = { name: "", address: "", email: "", cell: "", ruc: "" };

/** Título de sección con ícono + línea degradada, igual al patrón usado en el resto del sistema. */
const SectionTitle = ({ icon, children, sectionIconBg }) => (
  <Flex align="center" gap={3} mb={4}>
    <Flex align="center" justify="center" boxSize="26px" borderRadius="8px" bg={sectionIconBg} color={ACCENT} flexShrink={0}>
      <Icon as={icon} boxSize="13px" />
    </Flex>
    <Text fontWeight="bold" fontSize="xs" letterSpacing="wide" textTransform="uppercase" color={ACCENT} whiteSpace="nowrap">
      {children}
    </Text>
    <Box flex="1" h="1px" bgGradient={`linear(to-r, ${sectionIconBg}, transparent)`} />
  </Flex>
);

const Lab = () => {
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose } = useDisclosure();
  const cancelRef = useRef();

  const [labs, setLabs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [showInactive, setShowInactive] = useState(false);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [pendingAction, setPendingAction] = useState(null); // { id, mode: 'deactivate' | 'delete' }

  const pageBg = useColorModeValue("gray.50", "gray.900");
  const cardBg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const inputBg = useColorModeValue("gray.50", "gray.700");
  const subtitleColor = useColorModeValue("gray.600", "gray.400");
  const sectionIconBg = useColorModeValue("#E6FBF6", "rgba(0,168,142,0.15)");
  const headingColor = useColorModeValue("gray.800", "white");

  const fetchLabs = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("labs").select("*").order("name", { ascending: true });
    if (error) {
      toast({ title: "Error al cargar laboratorios", description: error.message, status: "error", duration: 5000, isClosable: true, position: "top" });
    } else {
      setLabs(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchLabs();
    // eslint-disable-next-line
  }, []);

  const filteredLabs = useMemo(() => {
    const term = search.trim().toLowerCase();
    const matches = (l) =>
      !term ||
      l.name?.toLowerCase().includes(term) ||
      l.address?.toLowerCase().includes(term) ||
      l.email?.toLowerCase().includes(term);
    return labs.filter(matches);
  }, [labs, search]);

  const activeLabs = useMemo(() => filteredLabs.filter((l) => l.active !== false), [filteredLabs]);
  const inactiveLabs = useMemo(() => filteredLabs.filter((l) => l.active === false), [filteredLabs]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const openCreateModal = () => {
    setEditingId(null);
    setFormData(EMPTY_FORM);
    onOpen();
  };

  const openEditModal = (lab) => {
    setEditingId(lab.id);
    setFormData({
      name: lab.name || "",
      address: lab.address || "",
      email: lab.email || "",
      cell: lab.cell || "",
      ruc: lab.ruc || "",
    });
    onOpen();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.address || !formData.email || !formData.cell || !formData.ruc) {
      toast({ title: "Campos incompletos", description: "Todos los campos son obligatorios.", status: "warning", duration: 4000, isClosable: true, position: "top" });
      return;
    }
    setSaving(true);

    if (editingId) {
      const { error } = await supabase.from("labs").update(formData).eq("id", editingId);
      setSaving(false);
      if (error) {
        toast({ title: "Error al actualizar", description: error.message, status: "error", duration: 5000, isClosable: true, position: "top" });
        return;
      }
      toast({ title: "Laboratorio actualizado", status: "success", duration: 3500, isClosable: true, position: "top" });
    } else {
      const { error } = await supabase.from("labs").insert([formData]);
      setSaving(false);
      if (error) {
        toast({ title: "Error al registrar", description: error.message, status: "error", duration: 5000, isClosable: true, position: "top" });
        return;
      }
      toast({ title: "Laboratorio registrado con éxito", status: "success", duration: 3500, isClosable: true, position: "top" });
    }

    onClose();
    setFormData(EMPTY_FORM);
    setEditingId(null);
    fetchLabs();
  };

  const confirmDeactivate = (id) => {
    setPendingAction({ id, mode: "deactivate" });
    onDeleteOpen();
  };

  const confirmPermanentDelete = (id) => {
    setPendingAction({ id, mode: "delete" });
    onDeleteOpen();
  };

  const handleReactivate = async (id) => {
    const { error } = await supabase.from("labs").update({ active: true }).eq("id", id);
    if (error) {
      toast({ title: "Error al reactivar", description: error.message, status: "error", duration: 5000, isClosable: true, position: "top" });
      return;
    }
    toast({ title: "Laboratorio reactivado", status: "success", duration: 3000, isClosable: true, position: "top" });
    fetchLabs();
  };

  const handleConfirmedAction = async () => {
    if (!pendingAction) return;
    const { id, mode } = pendingAction;

    if (mode === "deactivate") {
      const { error } = await supabase.from("labs").update({ active: false }).eq("id", id);
      onDeleteClose();
      setPendingAction(null);
      if (error) {
        toast({ title: "Error al desactivar", description: error.message, status: "error", duration: 5000, isClosable: true, position: "top" });
        return;
      }
      toast({ title: "Laboratorio desactivado", description: "Ya no aparecerá en el listado principal. Puedes reactivarlo cuando quieras.", status: "info", duration: 4500, isClosable: true, position: "top" });
      fetchLabs();
      return;
    }

    // mode === "delete": borrado definitivo, solo debería usarse en laboratorios
    // ya desactivados y sin uso real. Si tiene registros asociados (órdenes,
    // etc.), la base de datos lo va a rechazar — mostramos un mensaje claro
    // en vez del error técnico de Postgres.
    const { error } = await supabase.from("labs").delete().eq("id", id);
    onDeleteClose();
    setPendingAction(null);
    if (error) {
      const isReferenced = error.code === "23503" || error.code === "23502" || /constraint/i.test(error.message || "");
      toast({
        title: "No se puede eliminar",
        description: isReferenced
          ? "Este laboratorio tiene órdenes u otros registros asociados. Déjalo desactivado en vez de eliminarlo — así conservas ese historial."
          : error.message,
        status: "warning",
        duration: 6000,
        isClosable: true,
        position: "top",
      });
      return;
    }
    toast({ title: "Laboratorio eliminado definitivamente", status: "info", duration: 3000, isClosable: true, position: "top" });
    fetchLabs();
  };

  return (
    <Box minH="100vh" bg={pageBg} pb={12}>
      <SmartHeader />

      <Box maxW="1100px" mx="auto" px={{ base: 4, md: 6 }} pt={8}>
        {/* Encabezado */}
        <Flex justify="space-between" align="center" mb={6} flexWrap="wrap" gap={3}>
          <HStack spacing={3}>
            <Flex
              align="center" justify="center" boxSize="44px" borderRadius="14px"
              bgGradient="linear(to-br, #00A88E, #00786A)" color="white"
              boxShadow="0 6px 16px -4px rgba(0,168,142,0.5)"
            >
              <Icon as={FlaskConical} boxSize="20px" />
            </Flex>
            <VStack align="start" spacing={0}>
              <HStack>
                <Heading size="lg" fontWeight="800" color={headingColor} letterSpacing="tight">
                  Laboratorios
                </Heading>
                <Icon as={Sparkles} color={ACCENT} boxSize="16px" />
              </HStack>
              <Text fontSize="xs" color={subtitleColor}>
                Registra y administra los laboratorios aliados de Veoptics
              </Text>
            </VStack>
          </HStack>
          <Button
            leftIcon={<Plus size={16} />}
            bg={ACCENT}
            color="white"
            _hover={{ bg: "#00967f" }}
            borderRadius="12px"
            onClick={openCreateModal}
          >
            Nuevo laboratorio
          </Button>
        </Flex>

        {/* Buscador */}
        <Flex mb={5} gap={3} align="center" flexWrap="wrap">
          <InputGroup maxW="360px">
            <InputLeftElement pointerEvents="none">
              <Icon as={Search} boxSize="14px" color={subtitleColor} />
            </InputLeftElement>
            <Input
              placeholder="Buscar por nombre, dirección o correo..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              bg={cardBg}
              borderColor={borderColor}
              borderRadius="12px"
            />
          </InputGroup>
          <Badge
            bg={sectionIconBg}
            color={ACCENT}
            borderRadius="full"
            px={3}
            py={1}
            fontSize="xs"
            fontWeight="bold"
          >
            {activeLabs.length} {activeLabs.length === 1 ? "activo" : "activos"}
          </Badge>
          {inactiveLabs.length > 0 && (
            <Button
              size="sm"
              variant="ghost"
              leftIcon={<Archive size={14} />}
              color={subtitleColor}
              onClick={() => setShowInactive((prev) => !prev)}
              borderRadius="10px"
            >
              {showInactive ? "Ocultar" : "Ver"} inactivos ({inactiveLabs.length})
            </Button>
          )}
        </Flex>

        {/* Listado */}
        {loading ? (
          <Flex justify="center" py={16}>
            <Spinner color={ACCENT} />
          </Flex>
        ) : activeLabs.length === 0 ? (
          <Flex
            direction="column" align="center" justify="center" py={16}
            bg={cardBg} borderRadius="24px" border={`1px dashed ${borderColor}`}
          >
            <Icon as={FlaskConical} boxSize="32px" color={subtitleColor} mb={3} />
            <Text color={subtitleColor} fontWeight="semibold">
              {search ? "No se encontraron laboratorios con ese criterio" : "Todavía no has registrado ningún laboratorio"}
            </Text>
            {!search && (
              <Button mt={4} size="sm" leftIcon={<Plus size={14} />} variant="outline" borderColor={ACCENT} color={ACCENT} borderRadius="10px" onClick={openCreateModal}>
                Registrar el primero
              </Button>
            )}
          </Flex>
        ) : (
          <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={5}>
            {activeLabs.map((lab) => (
              <Box
                key={lab.id}
                bg={cardBg}
                borderRadius="24px"
                border={`1px solid ${borderColor}`}
                overflow="hidden"
                transition="all 0.2s ease"
                _hover={{ transform: "translateY(-3px)", boxShadow: "xl", borderColor: ACCENT }}
              >
                <Box h="4px" bgGradient="linear(to-r, #00A88E, #2DD4BF, #00A88E)" />
                <Box p={5}>
                  <Flex justify="space-between" align="flex-start" mb={3}>
                    <VStack align="start" spacing={0} maxW="75%">
                      <Text fontWeight="800" fontSize="md" color={headingColor} noOfLines={1}>
                        {lab.name}
                      </Text>
                      <HStack spacing={1} color={subtitleColor}>
                        <Icon as={MapPin} boxSize="11px" />
                        <Text fontSize="xs" noOfLines={1}>{lab.address}</Text>
                      </HStack>
                    </VStack>
                    <HStack spacing={1}>
                      <IconButton
                        icon={<Pencil size={14} />}
                        aria-label="Editar laboratorio"
                        size="sm"
                        variant="ghost"
                        color={ACCENT}
                        _hover={{ bg: sectionIconBg }}
                        onClick={() => openEditModal(lab)}
                      />
                      <IconButton
                        icon={<PowerOff size={14} />}
                        aria-label="Desactivar laboratorio"
                        title="Desactivar"
                        size="sm"
                        variant="ghost"
                        color="orange.400"
                        _hover={{ bg: "orange.50" }}
                        onClick={() => confirmDeactivate(lab.id)}
                      />
                    </HStack>
                  </Flex>
                  <Divider borderColor={borderColor} mb={3} />
                  <VStack align="start" spacing={2}>
                    <HStack spacing={2} color={subtitleColor}>
                      <Icon as={Phone} boxSize="12px" />
                      <Text fontSize="xs">{lab.cell}</Text>
                    </HStack>
                    <HStack spacing={2} color={subtitleColor}>
                      <Icon as={Mail} boxSize="12px" />
                      <Text fontSize="xs" noOfLines={1}>{lab.email}</Text>
                    </HStack>
                    <HStack spacing={2} color={subtitleColor}>
                      <Icon as={FileText} boxSize="12px" />
                      <Text fontSize="xs">RUC {lab.ruc}</Text>
                    </HStack>
                  </VStack>
                </Box>
              </Box>
            ))}
          </SimpleGrid>
        )}

        {/* Inactivos — colapsado por defecto, se reactivan o se eliminan definitivamente aquí */}
        {showInactive && inactiveLabs.length > 0 && (
          <Box mt={8}>
            <SectionTitle icon={Archive} sectionIconBg={sectionIconBg}>Laboratorios inactivos</SectionTitle>
            <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={5}>
              {inactiveLabs.map((lab) => (
                <Box
                  key={lab.id}
                  bg={cardBg}
                  borderRadius="24px"
                  border={`1px solid ${borderColor}`}
                  overflow="hidden"
                  opacity={0.65}
                >
                  <Box h="4px" bg={borderColor} />
                  <Box p={5}>
                    <Flex justify="space-between" align="flex-start" mb={3}>
                      <VStack align="start" spacing={0} maxW="70%">
                        <Text fontWeight="800" fontSize="md" color={headingColor} noOfLines={1}>
                          {lab.name}
                        </Text>
                        <HStack spacing={1} color={subtitleColor}>
                          <Icon as={MapPin} boxSize="11px" />
                          <Text fontSize="xs" noOfLines={1}>{lab.address}</Text>
                        </HStack>
                      </VStack>
                      <HStack spacing={1}>
                        <IconButton
                          icon={<RotateCcw size={14} />}
                          aria-label="Reactivar laboratorio"
                          title="Reactivar"
                          size="sm"
                          variant="ghost"
                          color={ACCENT}
                          _hover={{ bg: sectionIconBg }}
                          onClick={() => handleReactivate(lab.id)}
                        />
                        <IconButton
                          icon={<Trash2 size={14} />}
                          aria-label="Eliminar definitivamente"
                          title="Eliminar definitivamente"
                          size="sm"
                          variant="ghost"
                          color="red.400"
                          _hover={{ bg: "red.50" }}
                          onClick={() => confirmPermanentDelete(lab.id)}
                        />
                      </HStack>
                    </Flex>
                    <Badge colorScheme="orange" fontSize="10px" borderRadius="full">Inactivo</Badge>
                  </Box>
                </Box>
              ))}
            </SimpleGrid>
          </Box>
        )}
      </Box>

      {/* Modal Crear / Editar */}
      <Modal isOpen={isOpen} onClose={onClose} isCentered size="lg">
        <ModalOverlay backdropFilter="blur(4px)" />
        <ModalContent borderRadius="24px" overflow="hidden" mx={4}>
          <Box h="5px" bgGradient="linear(to-r, #00A88E, #2DD4BF, #00A88E)" />
          <ModalHeader color={headingColor} fontWeight="800">
            {editingId ? "Editar laboratorio" : "Nuevo laboratorio"}
          </ModalHeader>
          <ModalCloseButton />
          <form onSubmit={handleSubmit}>
            <ModalBody pb={2}>
              <SectionTitle icon={FlaskConical} sectionIconBg={sectionIconBg}>Datos generales</SectionTitle>
              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                <FormControl isRequired>
                  <FormLabel fontWeight="semibold" fontSize="sm" color={subtitleColor}>Nombre</FormLabel>
                  <Input name="name" value={formData.name} onChange={handleChange} placeholder="Ej: Laboratorio Óptico Central" bg={inputBg} borderColor={borderColor} borderRadius="10px" _focus={{ borderColor: ACCENT, boxShadow: `0 0 0 1px ${ACCENT}` }} />
                </FormControl>
                <FormControl isRequired>
                  <FormLabel fontWeight="semibold" fontSize="sm" color={subtitleColor}>RUC</FormLabel>
                  <Input name="ruc" value={formData.ruc} onChange={handleChange} placeholder="1234567890001" bg={inputBg} borderColor={borderColor} borderRadius="10px" _focus={{ borderColor: ACCENT, boxShadow: `0 0 0 1px ${ACCENT}` }} />
                </FormControl>
                <FormControl isRequired gridColumn={{ md: "1 / -1" }}>
                  <FormLabel fontWeight="semibold" fontSize="sm" color={subtitleColor}>Dirección</FormLabel>
                  <Input name="address" value={formData.address} onChange={handleChange} placeholder="Ej: Av. Solano 4-56" bg={inputBg} borderColor={borderColor} borderRadius="10px" _focus={{ borderColor: ACCENT, boxShadow: `0 0 0 1px ${ACCENT}` }} />
                </FormControl>
                <FormControl isRequired>
                  <FormLabel fontWeight="semibold" fontSize="sm" color={subtitleColor}>Correo</FormLabel>
                  <Input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="laboratorio@email.com" bg={inputBg} borderColor={borderColor} borderRadius="10px" _focus={{ borderColor: ACCENT, boxShadow: `0 0 0 1px ${ACCENT}` }} />
                </FormControl>
                <FormControl isRequired>
                  <FormLabel fontWeight="semibold" fontSize="sm" color={subtitleColor}>Teléfono</FormLabel>
                  <Input name="cell" value={formData.cell} onChange={handleChange} placeholder="0999999999" bg={inputBg} borderColor={borderColor} borderRadius="10px" _focus={{ borderColor: ACCENT, boxShadow: `0 0 0 1px ${ACCENT}` }} />
                </FormControl>
              </SimpleGrid>
            </ModalBody>
            <ModalFooter gap={3}>
              <Button variant="ghost" onClick={onClose} borderRadius="10px">Cancelar</Button>
              <Button
                type="submit"
                bg={ACCENT}
                color="white"
                _hover={{ bg: "#00967f" }}
                borderRadius="10px"
                isLoading={saving}
                loadingText="Guardando..."
              >
                {editingId ? "Guardar cambios" : "Registrar"}
              </Button>
            </ModalFooter>
          </form>
        </ModalContent>
      </Modal>

      {/* Confirmación de desactivar / eliminar definitivo */}
      <AlertDialog isOpen={isDeleteOpen} leastDestructiveRef={cancelRef} onClose={onDeleteClose} isCentered>
        <AlertDialogOverlay>
          <AlertDialogContent borderRadius="20px" mx={4}>
            <AlertDialogHeader fontWeight="800">
              {pendingAction?.mode === "delete" ? "Eliminar definitivamente" : "Desactivar laboratorio"}
            </AlertDialogHeader>
            <AlertDialogBody>
              {pendingAction?.mode === "delete"
                ? "Esta acción no se puede deshacer. Si el laboratorio tiene órdenes u otros registros asociados, el sistema no permitirá eliminarlo."
                : "El laboratorio dejará de aparecer en el listado principal, pero conserva todo su historial. Puedes reactivarlo cuando quieras."}
            </AlertDialogBody>
            <AlertDialogFooter gap={3}>
              <Button ref={cancelRef} variant="ghost" onClick={onDeleteClose} borderRadius="10px">Cancelar</Button>
              <Button
                colorScheme={pendingAction?.mode === "delete" ? "red" : "orange"}
                onClick={handleConfirmedAction}
                borderRadius="10px"
              >
                {pendingAction?.mode === "delete" ? "Eliminar" : "Desactivar"}
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </Box>
  );
};

export default Lab;
