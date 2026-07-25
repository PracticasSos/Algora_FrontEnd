import { useState } from "react";
import {
  Box,
  Input,
  InputGroup,
  InputLeftElement,
  Icon,
  VStack,
  HStack,
  Text,
  IconButton,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  useColorModeValue,
  Divider,
} from "@chakra-ui/react";
import { SearchIcon } from "@chakra-ui/icons";
import { FiTrash2, FiPackage } from "react-icons/fi";
import { supabase } from "../../../api/supabase";

const formatMoney = (value) => `$${(parseFloat(value) || 0).toFixed(2)}`;

/**
 * Lista de accesorios (estuches, gafas de sol, líquido limpiador, etc.) agregados
 * a la venta actual. Cada accesorio se guarda como una fila en `sale_items`
 * al registrar la venta (ver handleSubmit en Sales.jsx). No modifica el total
 * de armazón+luna que ya usan los reportes de Caja/Balance/Historial.
 */
const AccessoriesSection = ({ accessories, setAccessories }) => {
  const [search, setSearch] = useState("");
  const [suggestions, setSuggestions] = useState([]);

  const borderColor = useColorModeValue("gray.200", "gray.700");
  const bgColor = useColorModeValue("white", "gray.900");
  const textColor = useColorModeValue("gray.800", "white");
  const subtitleColor = useColorModeValue("gray.500", "gray.400");
  const highlightBg = useColorModeValue("blue.50", "blue.900");

  const handleSearchChange = async (e) => {
    const value = e.target.value;
    setSearch(value);
    if (!value) {
      setSuggestions([]);
      return;
    }
    try {
      const [inventarioRes, lensRes] = await Promise.all([
        supabase
          .from("inventario")
          .select("id, brand, price, quantity")
          .eq("category", "accesorio")
          .ilike("brand", `%${value}%`)
          .gt("quantity", 0),
        supabase
          .from("lens")
          .select("id, lens_type, lens_price")
          .ilike("lens_type", `%${value}%`),
      ]);

      if (inventarioRes.error) throw inventarioRes.error;
      if (lensRes.error) throw lensRes.error;

      const fromInventario = (inventarioRes.data || []).map((item) => ({
        source: "inventario",
        id: item.id,
        name: item.brand,
        price: item.price,
        stock: item.quantity,
      }));
      const fromLens = (lensRes.data || []).map((item) => ({
        source: "lens",
        id: item.id,
        name: item.lens_type,
        price: item.lens_price,
        stock: null, // esta tabla no controla stock (arreglos, plaquetas, etc.)
      }));

      setSuggestions([...fromInventario, ...fromLens]);
    } catch (err) {
      console.error("Error buscando accesorios:", err);
      setSuggestions([]);
    }
  };

  const addAccessory = (item) => {
    setAccessories((prev) => {
      const existing = prev.find((a) => a.source === item.source && a.sourceId === item.id);
      if (existing) {
        return prev.map((a) =>
          a.source === item.source && a.sourceId === item.id
            ? { ...a, quantity: a.quantity + 1 }
            : a
        );
      }
      return [
        ...prev,
        {
          source: item.source, // "inventario" o "lens"
          sourceId: item.id,
          name: item.name,
          unit_price: item.price || 0,
          quantity: 1,
          maxStock: item.stock, // null cuando viene de "lens" (sin control de stock)
        },
      ];
    });
    setSearch("");
    setSuggestions([]);
  };

  const updateQuantity = (source, sourceId, quantity) => {
    setAccessories((prev) =>
      prev.map((a) => (a.source === source && a.sourceId === sourceId ? { ...a, quantity } : a))
    );
  };

  const removeAccessory = (source, sourceId) => {
    setAccessories((prev) => prev.filter((a) => !(a.source === source && a.sourceId === sourceId)));
  };

  const accessoriesTotal = accessories.reduce(
    (sum, a) => sum + a.unit_price * a.quantity,
    0
  );

  return (
    <VStack align="stretch" spacing={4} w="full">
      <Box position="relative">
        <InputGroup>
          <InputLeftElement pointerEvents="none">
            <Icon as={SearchIcon} color="gray.400" />
          </InputLeftElement>
          <Input
            placeholder="Buscar estuche, arreglo, plaqueta, gafas de sol..."
            value={search}
            onChange={handleSearchChange}
            borderRadius="xl"
            bg={bgColor}
          />
        </InputGroup>
        {search && suggestions.length > 0 && (
          <Box
            border={`1px solid ${borderColor}`}
            borderRadius="lg"
            mt={2}
            maxHeight="220px"
            overflowY="auto"
            bg={bgColor}
            boxShadow="md"
            zIndex={10}
            position="absolute"
            width="100%"
          >
            {suggestions.map((item) => (
              <HStack
                key={`${item.source}-${item.id}`}
                px={4}
                py={3}
                justify="space-between"
                _hover={{ bg: highlightBg, cursor: "pointer" }}
                onClick={() => addAccessory(item)}
              >
                <Text fontWeight="medium" color={textColor}>{item.name}</Text>
                <Text fontSize="sm" color={subtitleColor}>
                  {formatMoney(item.price)}
                  {item.stock !== null ? ` · stock ${item.stock}` : ""}
                </Text>
              </HStack>
            ))}
          </Box>
        )}
        {search && suggestions.length === 0 && (
          <Text fontSize="xs" color={subtitleColor} mt={1}>
            No se encontraron accesorios con ese nombre (o no quedan en stock).
          </Text>
        )}
      </Box>

      {accessories.length > 0 && (
        <VStack align="stretch" spacing={2} divider={<Divider />}>
          {accessories.map((a) => (
            <HStack key={`${a.source}-${a.sourceId}`} justify="space-between">
              <Box flex="1" minW={0}>
                <Text fontSize="sm" fontWeight="medium" color={textColor} noOfLines={1}>
                  {a.name}
                </Text>
                <Text fontSize="xs" color={subtitleColor}>{formatMoney(a.unit_price)} c/u</Text>
              </Box>
              <NumberInput
                size="sm"
                w="90px"
                min={1}
                max={a.maxStock ?? 99}
                value={a.quantity}
                onChange={(_, val) => updateQuantity(a.source, a.sourceId, isNaN(val) ? 1 : val)}
              >
                <NumberInputField borderRadius="lg" />
                <NumberInputStepper>
                  <NumberIncrementStepper />
                  <NumberDecrementStepper />
                </NumberInputStepper>
              </NumberInput>
              <Text fontSize="sm" fontWeight="semibold" color={textColor} minW="70px" textAlign="right">
                {formatMoney(a.unit_price * a.quantity)}
              </Text>
              <IconButton
                aria-label="Quitar"
                icon={<FiTrash2 />}
                size="sm"
                variant="ghost"
                colorScheme="red"
                onClick={() => removeAccessory(a.source, a.sourceId)}
              />
            </HStack>
          ))}
        </VStack>
      )}

      {accessories.length === 0 && (
        <HStack color={subtitleColor} fontSize="sm">
          <FiPackage />
          <Text>Aún no has agregado accesorios (es opcional).</Text>
        </HStack>
      )}

      {accessories.length > 0 && (
        <HStack justify="space-between" pt={2} borderTop="1px solid" borderColor={borderColor}>
          <Text fontWeight="bold" fontSize="sm" color={textColor}>Subtotal accesorios</Text>
          <Text fontWeight="bold" color="#00A88E">{formatMoney(accessoriesTotal)}</Text>
        </HStack>
      )}
    </VStack>
  );
};

export default AccessoriesSection;
