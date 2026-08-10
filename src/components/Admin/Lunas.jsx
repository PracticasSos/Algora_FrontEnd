import { useEffect, useState } from "react";
import { supabase } from "../../api/supabase";
import {
  Box, Container, Heading, Text, Table, Thead, Tbody, Tr, Th, Td, Input,
  Flex, HStack, VStack, Icon, IconButton, Spinner, useColorModeValue,
  useToast, Button,
} from "@chakra-ui/react";
import { Search as SearchIcon, Plus, Pencil, Trash2, Check, X, Aperture, ChevronLeft, ChevronRight } from "lucide-react";
import ConfirmDialog from "../UI/ConfirmDialog";
import SmartHeader from "../header/SmartHeader";

const ACCENT = "#00A88E";
const PAGE_SIZE = 10;

const formatMoney = (value) => {
  const n = parseFloat(value);
  if (isNaN(n)) return "$0.00";
  return `$${n.toLocaleString("es-EC", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const Lunas = () => {
  const [lens, setLens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [editingId, setEditingId] = useState(null);
  const [editableData, setEditableData] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedId, setSelectedId] = useState(null);

  const [newType, setNewType] = useState("");
  const [newPrice, setNewPrice] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  const toast = useToast();

  useEffect(() => {
    fetchLens();
  }, []);

  const fetchLens = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("lens").select("*").order("lens_type", { ascending: true });
    if (error) {
      toast({ title: "Error", description: "No se pudieron cargar las lunas.", status: "error", duration: 5000, isClosable: true });
    } else {
      setLens(data || []);
    }
    setLoading(false);
  };

  const handleAdd = async () => {
    if (!newType.trim()) {
      toast({ title: "Falta el tipo de luna", status: "warning", duration: 4000, isClosable: true });
      return;
    }
    if (!newPrice || Number(newPrice) <= 0) {
      toast({ title: "Precio inválido", description: "Ingresa un precio mayor a 0.", status: "warning", duration: 4000, isClosable: true });
      return;
    }

    setIsAdding(true);
    const { error } = await supabase.from("lens").insert([{ lens_type: newType.trim(), lens_price: Number(newPrice) }]);
    setIsAdding(false);

    if (error) {
      toast({ title: "Error", description: error.message, status: "error", duration: 5000, isClosable: true });
    } else {
      toast({ title: "Luna agregada", status: "success", duration: 3000, isClosable: true });
      setNewType("");
      setNewPrice("");
      fetchLens();
    }
  };

  const handleEdit = (item) => {
    setEditingId(item.id);
    setEditableData(item);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setEditableData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async (id) => {
    setIsSaving(true);
    const { error } = await supabase
      .from("lens")
      .update({ lens_type: editableData.lens_type, lens_price: Number(editableData.lens_price) })
      .eq("id", id);
    setIsSaving(false);

    if (error) {
      toast({ title: "Error", description: "No se pudo actualizar.", status: "error", duration: 5000, isClosable: true });
    } else {
      toast({ title: "Actualizado", status: "success", duration: 3000, isClosable: true });
      setEditingId(null);
      fetchLens();
    }
  };

  const openConfirm = (id) => {
    setSelectedId(id);
    setIsOpen(true);
  };

  const handleDelete = async () => {
    setIsOpen(false);
    const { error } = await supabase.from("lens").delete().eq("id", selectedId);
    if (error) {
      toast({ title: "Error", description: "No se pudo eliminar.", status: "error", duration: 5000, isClosable: true });
    } else {
      toast({ title: "Eliminada", status: "success", duration: 3000, isClosable: true });
      fetchLens();
    }
  };

  const filtered = lens.filter((item) => item.lens_type?.toLowerCase().includes(search.toLowerCase()));
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

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
      <SmartHeader moduleSpecificButton={null} />

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
                <Icon as={Aperture} boxSize="20px" />
              </Flex>
              <VStack align="start" spacing={0}>
                <Heading size="lg" fontWeight="800" color={useColorModeValue("gray.800", "white")} letterSpacing="tight">
                  Lunas
                </Heading>
                <Text fontSize="xs" color={subtitleColor}>{lens.length} tipo{lens.length !== 1 ? "s" : ""} registrado{lens.length !== 1 ? "s" : ""}</Text>
              </VStack>
            </HStack>

            <SectionTitle icon={Plus}>Agregar luna</SectionTitle>
            <HStack spacing={3} mb={8} align="flex-end" flexWrap="wrap">
              <Box flex="1" minW="220px">
                <Text fontSize="xs" color={subtitleColor} mb={1}>Tipo de luna</Text>
                <Input
                  value={newType}
                  onChange={(e) => setNewType(e.target.value)}
                  placeholder="Ej. Monofocal CR39 Antireflejo"
                  borderRadius="10px"
                  bg={inputBg}
                  borderColor={borderColor}
                  _focus={{ borderColor: ACCENT, boxShadow: `0 0 0 1px ${ACCENT}` }}
                />
              </Box>
              <Box minW="120px">
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
              <Button bg={ACCENT} color="white" _hover={{ bg: "#00967f" }} borderRadius="10px" onClick={handleAdd} isLoading={isAdding} leftIcon={<Plus size={16} />}>
                Agregar
              </Button>
            </HStack>

            <SectionTitle icon={Aperture}>Catálogo</SectionTitle>
            <Flex position="relative" mb={5}>
              <Icon as={SearchIcon} position="absolute" left="14px" top="12px" color={subtitleColor} zIndex={1} />
              <Input
                placeholder="Buscar tipo de luna..."
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
              <Text textAlign="center" color={subtitleColor} py={12}>No se encontraron lunas.</Text>
            ) : (
              <>
                <Box overflowX="auto" borderRadius="14px" border={`1px solid ${borderColor}`}>
                  <Table variant="simple" size="sm">
                    <Thead>
                      <Tr>
                        <Th color={subtitleColor}>Tipo de luna</Th>
                        <Th color={subtitleColor} textAlign="right">Precio</Th>
                        <Th color={subtitleColor} textAlign="right">Acciones</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {pageItems.map((item) => (
                        <Tr key={item.id} _hover={{ bg: rowHoverBg }}>
                          <Td>
                            {editingId === item.id ? (
                              <Input name="lens_type" value={editableData.lens_type || ""} onChange={handleChange} size="sm" borderRadius="8px" bg={inputBg} borderColor={borderColor} />
                            ) : (
                              <Text fontWeight="medium">{item.lens_type}</Text>
                            )}
                          </Td>
                          <Td textAlign="right">
                            {editingId === item.id ? (
                              <Input name="lens_price" type="number" value={editableData.lens_price ?? ""} onChange={handleChange} size="sm" borderRadius="8px" bg={inputBg} borderColor={borderColor} textAlign="right" />
                            ) : (
                              <Text fontWeight="bold" color={ACCENT}>{formatMoney(item.lens_price)}</Text>
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
                                <IconButton icon={<Trash2 size={15} />} size="sm" variant="ghost" colorScheme="red" aria-label="Eliminar" onClick={() => openConfirm(item.id)} />
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
        title="¿Eliminar luna?"
        body="Esta acción no se puede deshacer."
      />
    </Box>
  );
};

export default Lunas;
