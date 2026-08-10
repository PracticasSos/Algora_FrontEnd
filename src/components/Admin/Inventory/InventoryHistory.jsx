import { useEffect, useState } from "react";
import { supabase } from "../../../api/supabase";
import {
  Box, Container, Heading, Text, Table, Thead, Tbody, Tr, Th, Td, Input,
  Flex, HStack, VStack, Icon, Badge, IconButton, Spinner, useColorModeValue, Button,
} from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";
import { Search as SearchIcon, ChevronLeft, ChevronRight, History, ArrowLeft, Plus, Pencil, Trash2, ShoppingCart } from "lucide-react";

const ACCENT = "#00A88E";
const PAGE_SIZE = 15;

const formatMoney = (value) => {
  if (value === null || value === undefined) return "—";
  const n = parseFloat(value);
  if (isNaN(n)) return "—";
  return `$${n.toLocaleString("es-EC", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const ACTION_META = {
  creado: { label: "Creado", color: "teal", icon: Plus },
  editado: { label: "Editado", color: "orange", icon: Pencil },
  eliminado: { label: "Eliminado", color: "red", icon: Trash2 },
  "salida por venta": { label: "Vendido", color: "purple", icon: ShoppingCart },
};

// Compara old_data vs new_data y devuelve solo los campos que cambiaron
const getChanges = (oldData, newData) => {
  if (!oldData || !newData) return [];
  const fields = [
    { key: "brand", label: "Marca" },
    { key: "price", label: "Precio", money: true },
    { key: "quantity", label: "Stock" },
  ];
  return fields
    .filter((f) => String(oldData[f.key]) !== String(newData[f.key]))
    .map((f) => ({
      label: f.label,
      before: f.money ? formatMoney(oldData[f.key]) : oldData[f.key],
      after: f.money ? formatMoney(newData[f.key]) : newData[f.key],
    }));
};

const InventoryHistory = () => {
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const navigate = useNavigate();

  useEffect(() => {
    fetchMovements();
  }, []);

  const fetchMovements = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("inventory_movements")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(500);
    if (!error) setMovements(data || []);
    setLoading(false);
  };

  const filtered = movements.filter((m) => {
    if (!search.trim()) return true;
    const term = search.toLowerCase();
    return m.brand?.toLowerCase().includes(term) || m.user_name?.toLowerCase().includes(term);
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const cardBg = useColorModeValue("white", "gray.700");
  const inputBg = useColorModeValue("gray.50", "gray.700");
  const borderColor = useColorModeValue("gray.200", "gray.600");
  const subtitleColor = useColorModeValue("gray.500", "gray.400");
  const rowHoverBg = useColorModeValue("gray.50", "whiteAlpha.100");

  return (
    <Box minHeight="100vh" bgGradient={useColorModeValue("linear(to-br, gray.50, teal.50)", "linear(to-br, gray.900, #0d1f1c)")}>
      <Container maxW="1000px" py={8} px={{ base: 3, md: 6 }}>
        <Button size="sm" variant="ghost" leftIcon={<ArrowLeft size={16} />} mb={3} onClick={() => navigate("/inventory")}>
          Volver a Armazones
        </Button>

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
                <Icon as={History} boxSize="20px" />
              </Flex>
              <VStack align="start" spacing={0}>
                <Heading size="lg" fontWeight="800" color={useColorModeValue("gray.800", "white")} letterSpacing="tight">
                  Historial de Inventario
                </Heading>
                <Text fontSize="xs" color={subtitleColor}>Quién hizo cada cambio, y qué cambió exactamente</Text>
              </VStack>
            </HStack>

            <Flex position="relative" mb={5}>
              <Icon as={SearchIcon} position="absolute" left="14px" top="12px" color={subtitleColor} zIndex={1} />
              <Input
                placeholder="Buscar por armazón o usuario..."
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
              <Text textAlign="center" color={subtitleColor} py={12}>No hay movimientos registrados todavía.</Text>
            ) : (
              <>
                <VStack align="stretch" spacing={3}>
                  {pageItems.map((m) => {
                    const meta = ACTION_META[m.action] || { label: m.action, color: "gray", icon: History };
                    const changes = m.action === "editado" ? getChanges(m.old_data, m.new_data) : [];
                    return (
                      <Box key={m.id} p={4} borderRadius="14px" bg={inputBg} border={`1px solid ${borderColor}`}>
                        <Flex justify="space-between" align="center" mb={2} flexWrap="wrap" gap={2}>
                          <HStack spacing={2}>
                            <Badge colorScheme={meta.color} borderRadius="full" px={2}>
                              <HStack spacing={1}><Icon as={meta.icon} boxSize="10px" /><Text>{meta.label}</Text></HStack>
                            </Badge>
                            <Text fontWeight="bold">{m.brand}</Text>
                          </HStack>
                          <Text fontSize="xs" color={subtitleColor}>
                            {m.user_name} · {new Date(m.created_at).toLocaleString("es-EC", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                          </Text>
                        </Flex>

                        {m.action === "creado" && m.new_data && (
                          <Text fontSize="xs" color={subtitleColor}>
                            Precio: {formatMoney(m.new_data.price)} · Stock inicial: {m.new_data.quantity}
                          </Text>
                        )}

                        {m.action === "eliminado" && m.old_data && (
                          <Text fontSize="xs" color={subtitleColor}>
                            Tenía: {formatMoney(m.old_data.price)} · Stock: {m.old_data.quantity}
                          </Text>
                        )}

                        {m.action === "salida por venta" && (
                          <Text fontSize="xs" color={subtitleColor}>
                            Se descontó {m.new_data?.cantidad_vendida || 1} unidad(es) por una venta registrada.
                          </Text>
                        )}

                        {m.action === "editado" && changes.length > 0 && (
                          <VStack align="stretch" spacing={1} mt={2}>
                            {changes.map((c) => (
                              <HStack key={c.label} fontSize="xs" spacing={2}>
                                <Text color={subtitleColor} minW="60px">{c.label}:</Text>
                                <Text color="red.400" textDecoration="line-through">{c.before}</Text>
                                <Text color={subtitleColor}>→</Text>
                                <Text color={ACCENT} fontWeight="bold">{c.after}</Text>
                              </HStack>
                            ))}
                          </VStack>
                        )}
                      </Box>
                    );
                  })}
                </VStack>

                <Flex justify="space-between" align="center" mt={5} flexWrap="wrap" gap={3}>
                  <Text fontSize="xs" color={subtitleColor}>Página {page} de {totalPages} · {filtered.length} movimiento{filtered.length !== 1 ? "s" : ""}</Text>
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
    </Box>
  );
};

export default InventoryHistory;
