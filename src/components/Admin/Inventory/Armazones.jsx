import { useEffect, useState } from "react";
import { supabase } from "../../../api/supabase";
import {
  Box, Container, Heading, Text, Table, Thead, Tbody, Tr, Th, Td, Input,
  Flex, HStack, VStack, Icon, IconButton, Spinner, useColorModeValue,
  useToast, Button, Badge, Select,
} from "@chakra-ui/react";
import { Search as SearchIcon, Plus, Pencil, Trash2, Check, X, Glasses, ChevronLeft, ChevronRight, AlertTriangle, History } from "lucide-react";
import ConfirmDialog from "../../UI/ConfirmDialog";
import { useAuth } from "../../AuthContext";
import { useNavigate } from "react-router-dom";
import SmartHeader from "../../header/SmartHeader";

const ACCENT = "#00A88E";
const PAGE_SIZE = 10;
const LOW_STOCK_THRESHOLD = 3;

const formatMoney = (value) => {
  const n = parseFloat(value);
  if (isNaN(n)) return "$0.00";
  return `$${n.toLocaleString("es-EC", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const Armazones = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [editingId, setEditingId] = useState(null);
  const [editableData, setEditableData] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [itemToDelete, setItemToDelete] = useState(null);

  const [newBrand, setNewBrand] = useState("");
  const [newPrice, setNewPrice] = useState("");
  const [newQuantity, setNewQuantity] = useState("");
  const [newBranchId, setNewBranchId] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  const [branches, setBranches] = useState([]);
  const [branchFilter, setBranchFilter] = useState("");

  const toast = useToast();

  useEffect(() => {
    fetchInventory();
    fetchBranches();
  }, []);

  const fetchBranches = async () => {
    const { data, error } = await supabase.from("branchs").select("id, name");
    if (!error) setBranches(data || []);
  };

  const branchName = (id) => branches.find((b) => String(b.id) === String(id))?.name || "Sin asignar";

  // Registra cada movimiento (crear/editar/eliminar) con quién y cuándo,
  // para tener control absoluto de lo que pasa en el inventario.
  const logMovement = async (action, oldData, newData, brand) => {
    const userName = user ? `${user.firstname || ""} ${user.lastname || ""}`.trim() || user.email : "Desconocido";
    const { error } = await supabase.from("inventory_movements").insert([{
      inventario_id: newData?.id || oldData?.id || null,
      brand: brand || newData?.brand || oldData?.brand || "—",
      branch_name: branchName((newData || oldData)?.branchs_id),
      action,
      old_data: oldData || null,
      new_data: newData || null,
      user_id: user?.id || null,
      user_name: userName,
    }]);
    if (error) console.error("Error registrando movimiento de inventario:", error);
  };

  const fetchInventory = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("inventario").select("*").order("brand", { ascending: true });
    if (error) {
      toast({ title: "Error", description: "No se pudo cargar el inventario.", status: "error", duration: 5000, isClosable: true });
    } else {
      setItems(data || []);
    }
    setLoading(false);
  };

  const handleAdd = async () => {
    if (!newBrand.trim()) {
      toast({ title: "Falta la marca/modelo", status: "warning", duration: 4000, isClosable: true });
      return;
    }
    if (!newPrice || Number(newPrice) <= 0) {
      toast({ title: "Precio inválido", status: "warning", duration: 4000, isClosable: true });
      return;
    }
    if (newQuantity === "" || Number(newQuantity) < 0) {
      toast({ title: "Cantidad inválida", status: "warning", duration: 4000, isClosable: true });
      return;
    }
    if (!newBranchId) {
      toast({ title: "Falta la sucursal", description: "Indica en qué sucursal está este armazón.", status: "warning", duration: 4000, isClosable: true });
      return;
    }

    setIsAdding(true);
    const { data, error } = await supabase.from("inventario").insert([{
      brand: newBrand.trim(),
      price: Number(newPrice),
      quantity: Number(newQuantity),
      branchs_id: Number(newBranchId),
      category: "armazon",
    }]).select().single();
    setIsAdding(false);

    if (error) {
      toast({ title: "Error", description: error.message, status: "error", duration: 5000, isClosable: true });
    } else {
      await logMovement("creado", null, data, data.brand);
      toast({ title: "Armazón agregado", status: "success", duration: 3000, isClosable: true });
      setNewBrand("");
      setNewPrice("");
      setNewQuantity("");
      setNewBranchId("");
      fetchInventory();
    }
  };

  const [originalItem, setOriginalItem] = useState(null);

  const handleEdit = (item) => {
    setEditingId(item.id);
    setEditableData(item);
    setOriginalItem(item);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setEditableData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async (id) => {
    setIsSaving(true);
    const updatedData = {
      brand: editableData.brand,
      price: Number(editableData.price),
      quantity: Number(editableData.quantity),
      branchs_id: editableData.branchs_id ? Number(editableData.branchs_id) : null,
    };
    const { error } = await supabase
      .from("inventario")
      .update(updatedData)
      .eq("id", id);
    setIsSaving(false);

    if (error) {
      toast({ title: "Error", description: "No se pudo actualizar.", status: "error", duration: 5000, isClosable: true });
    } else {
      await logMovement("editado", originalItem, { id, ...updatedData }, updatedData.brand);
      toast({ title: "Actualizado", status: "success", duration: 3000, isClosable: true });
      setEditingId(null);
      fetchInventory();
    }
  };

  const openConfirm = (item) => {
    setSelectedId(item.id);
    setItemToDelete(item);
    setIsOpen(true);
  };

  const handleDelete = async () => {
    setIsOpen(false);
    const { error } = await supabase.from("inventario").delete().eq("id", selectedId);
    if (error) {
      toast({ title: "Error", description: "No se pudo eliminar.", status: "error", duration: 5000, isClosable: true });
    } else {
      await logMovement("eliminado", itemToDelete, null, itemToDelete?.brand);
      toast({ title: "Eliminado", status: "success", duration: 3000, isClosable: true });
      fetchInventory();
    }
  };

  const filtered = items.filter((item) => {
    if (branchFilter && String(item.branchs_id) !== String(branchFilter)) return false;
    return item.brand?.toLowerCase().includes(search.toLowerCase());
  });
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const lowStockCount = items.filter((i) => Number(i.quantity) <= LOW_STOCK_THRESHOLD).length;

  const cardBg = useColorModeValue("white", "gray.700");
  const inputBg = useColorModeValue("gray.50", "gray.700");
  const borderColor = useColorModeValue("gray.200", "gray.600");
  const subtitleColor = useColorModeValue("gray.500", "gray.400");
  const rowHoverBg = useColorModeValue("gray.50", "whiteAlpha.100");
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
      <SmartHeader
        moduleSpecificButton={
          <Button
            onClick={() => navigate("/inventory-history")}
            bg="whiteAlpha.200"
            color="white"
            size="sm"
            borderRadius="full"
            px={5}
            fontWeight="bold"
            leftIcon={<History size={14} />}
            _hover={{ bg: "whiteAlpha.300" }}
          >
            Ver Historial
          </Button>
        }
      />

      <Container maxW="950px" py={8} px={{ base: 3, md: 6 }}>
        <Box
          borderRadius="24px"
          bg={cardBg}
          border={`1px solid ${borderColor}`}
          boxShadow={useColorModeValue("0 20px 45px -20px rgba(0,168,142,0.25)", "0 20px 45px -20px rgba(0,168,142,0.35)")}
          overflow="hidden"
        >
          <Box h="5px" bgGradient="linear(to-r, #00A88E, #2DD4BF, #00A88E)" />
          <Box p={{ base: 5, md: 8 }}>
            <HStack spacing={3} mb={6}>
              <Flex align="center" justify="center" boxSize="44px" borderRadius="14px" bgGradient="linear(to-br, #00A88E, #00786A)" color="white" boxShadow="0 6px 16px -4px rgba(0,168,142,0.5)">
                <Icon as={Glasses} boxSize="20px" />
              </Flex>
              <VStack align="start" spacing={0}>
                <Heading size="lg" fontWeight="800" color={useColorModeValue("gray.800", "white")} letterSpacing="tight">
                  Inventario de Armazones
                </Heading>
                <Text fontSize="xs" color={subtitleColor}>{items.length} armazón{items.length !== 1 ? "es" : ""} registrado{items.length !== 1 ? "s" : ""}</Text>
              </VStack>
            </HStack>

            {lowStockCount > 0 && (
              <HStack p={3} borderRadius="10px" bg="orange.50" border="1px solid" borderColor="orange.200" mb={5}>
                <Icon as={AlertTriangle} color="orange.500" boxSize="16px" />
                <Text fontSize="xs" color="orange.700">
                  {lowStockCount} armazón{lowStockCount !== 1 ? "es" : ""} con poco stock (3 o menos unidades).
                </Text>
              </HStack>
            )}

            <SectionTitle icon={Plus}>Agregar armazón</SectionTitle>
            <HStack spacing={3} mb={8} align="flex-end" flexWrap="wrap">
              <Box flex="1" minW="220px">
                <Text fontSize="xs" color={subtitleColor} mb={1}>Marca / Modelo</Text>
                <Input
                  value={newBrand}
                  onChange={(e) => setNewBrand(e.target.value)}
                  placeholder="Ej. Ray-Ban Aviador Clásico"
                  borderRadius="10px"
                  bg={inputBg}
                  borderColor={borderColor}
                  _focus={{ borderColor: ACCENT, boxShadow: `0 0 0 1px ${ACCENT}` }}
                />
              </Box>
              <Box minW="110px">
                <Text fontSize="xs" color={subtitleColor} mb={1}>Precio</Text>
                <Input
                  type="number"
                  value={newPrice}
                  onChange={(e) => setNewPrice(e.target.value)}
                  placeholder="0.00"
                  borderRadius="10px"
                  bg={inputBg}
                  borderColor={borderColor}
                  _focus={{ borderColor: ACCENT, boxShadow: `0 0 0 1px ${ACCENT}` }}
                />
              </Box>
              <Box minW="100px">
                <Text fontSize="xs" color={subtitleColor} mb={1}>Stock</Text>
                <Input
                  type="number"
                  value={newQuantity}
                  onChange={(e) => setNewQuantity(e.target.value)}
                  placeholder="0"
                  borderRadius="10px"
                  bg={inputBg}
                  borderColor={borderColor}
                  _focus={{ borderColor: ACCENT, boxShadow: `0 0 0 1px ${ACCENT}` }}
                />
              </Box>
              <Box minW="160px">
                <Text fontSize="xs" color={subtitleColor} mb={1}>Sucursal</Text>
                <Select
                  placeholder="Seleccione"
                  value={newBranchId}
                  onChange={(e) => setNewBranchId(e.target.value)}
                  borderRadius="10px"
                  bg={inputBg}
                  borderColor={borderColor}
                  _focus={{ borderColor: ACCENT, boxShadow: `0 0 0 1px ${ACCENT}` }}
                >
                  {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                </Select>
              </Box>
              <Button bg={ACCENT} color="white" _hover={{ bg: "#00967f" }} borderRadius="10px" onClick={handleAdd} isLoading={isAdding} leftIcon={<Plus size={16} />}>
                Agregar
              </Button>
            </HStack>

            <Flex justify="space-between" align="center" mb={4} flexWrap="wrap" gap={3}>
              <SectionTitle icon={Glasses}>Catálogo</SectionTitle>
              <Select
                placeholder="Todas las sucursales"
                value={branchFilter}
                onChange={(e) => { setBranchFilter(e.target.value); setPage(1); }}
                size="sm"
                maxW="220px"
                borderRadius="10px"
                bg={inputBg}
                borderColor={borderColor}
              >
                {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
              </Select>
            </Flex>
            <Flex position="relative" mb={5}>
              <Icon as={SearchIcon} position="absolute" left="14px" top="12px" color={subtitleColor} zIndex={1} />
              <Input
                placeholder="Buscar marca o modelo..."
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
              <Flex justify="center" py={16}><Spinner color={ACCENT} /></Flex>
            ) : filtered.length === 0 ? (
              <Text textAlign="center" color={subtitleColor} py={12}>No se encontraron armazones.</Text>
            ) : (
              <>
                <Box overflowX="auto" borderRadius="14px" border={`1px solid ${borderColor}`}>
                  <Table variant="simple" size="sm">
                    <Thead>
                      <Tr>
                        <Th color={subtitleColor}>Marca / Modelo</Th>
                        <Th color={subtitleColor}>Sucursal</Th>
                        <Th color={subtitleColor} textAlign="right">Precio</Th>
                        <Th color={subtitleColor} textAlign="center">Stock</Th>
                        <Th color={subtitleColor} textAlign="right">Acciones</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {pageItems.map((item) => (
                        <Tr key={item.id} _hover={{ bg: rowHoverBg }}>
                          <Td>
                            {editingId === item.id ? (
                              <Input name="brand" value={editableData.brand || ""} onChange={handleChange} size="sm" borderRadius="8px" bg={inputBg} borderColor={borderColor} />
                            ) : (
                              <Text fontWeight="medium">{item.brand}</Text>
                            )}
                          </Td>
                          <Td>
                            {editingId === item.id ? (
                              <Select name="branchs_id" value={editableData.branchs_id || ""} onChange={handleChange} size="sm" borderRadius="8px" bg={inputBg} borderColor={borderColor}>
                                {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                              </Select>
                            ) : (
                              <Text fontSize="sm">{branchName(item.branchs_id)}</Text>
                            )}
                          </Td>
                          <Td textAlign="right">
                            {editingId === item.id ? (
                              <Input name="price" type="number" value={editableData.price ?? ""} onChange={handleChange} size="sm" borderRadius="8px" bg={inputBg} borderColor={borderColor} textAlign="right" />
                            ) : (
                              <Text fontWeight="bold" color={ACCENT}>{formatMoney(item.price)}</Text>
                            )}
                          </Td>
                          <Td textAlign="center">
                            {editingId === item.id ? (
                              <Input name="quantity" type="number" value={editableData.quantity ?? ""} onChange={handleChange} size="sm" borderRadius="8px" bg={inputBg} borderColor={borderColor} textAlign="center" maxW="80px" mx="auto" />
                            ) : (
                              <Badge colorScheme={Number(item.quantity) <= LOW_STOCK_THRESHOLD ? "orange" : "teal"} borderRadius="full" px={2}>
                                {item.quantity}
                              </Badge>
                            )}
                          </Td>
                          <Td textAlign="right">
                            {editingId === item.id ? (
                              <HStack justify="flex-end" spacing={1}>
                                <IconButton icon={<Check size={15} />} size="sm" variant="ghost" colorScheme="teal" aria-label="Guardar" onClick={() => handleSave(item.id)} isLoading={isSaving} />
                                <IconButton icon={<X size={15} />} size="sm" variant="ghost" colorScheme="gray" aria-label="Cancelar" onClick={() => setEditingId(null)} />
                              </HStack>
                            ) : (
                              <HStack justify="flex-end" spacing={1}>
                                <IconButton icon={<Pencil size={15} />} size="sm" variant="ghost" colorScheme="teal" aria-label="Editar" onClick={() => handleEdit(item)} />
                                <IconButton icon={<Trash2 size={15} />} size="sm" variant="ghost" colorScheme="red" aria-label="Eliminar" onClick={() => openConfirm(item)} />
                              </HStack>
                            )}
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

      <ConfirmDialog
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onConfirm={handleDelete}
        title="¿Eliminar armazón?"
        body="Esta acción no se puede deshacer."
      />
    </Box>
  );
};

export default Armazones;
