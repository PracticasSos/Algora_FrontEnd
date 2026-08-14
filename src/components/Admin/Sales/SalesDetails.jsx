import { useEffect, useState } from "react";
import { supabase } from "../../../api/supabase";
import {
  Box,
  VStack,
  SimpleGrid,
  Flex,
  FormControl,
  FormLabel,
  Input,
  useColorModeValue,
  Text,
  Icon,
  Button,
  Badge,
  Wrap,
  WrapItem,
  Tag,
  TagLabel,
  TagCloseButton,
  IconButton,
} from "@chakra-ui/react";
import { SearchIcon, SmallAddIcon } from "@chakra-ui/icons";
import { Glasses, Eye, Percent, Wrench } from "lucide-react";
import DiscountModal from "./DiscountModal";

const SalesDetails = ({
  formData = {},
  setFormData = () => {},
  onTotalsChange = () => {},
  accessories = [],
  setAccessories = () => {},
  onOpenAddMore = () => {},
  treatmentsCatalog = [],
  selectedTreatmentIds = [],
  setSelectedTreatmentIds = () => {},
  treatmentPriceOverrides = {},
  setTreatmentPriceOverrides = () => {},
  treatmentsSubtotal = 0,
  treatmentsTotal = 0,
}) => {
  const [searchFrame, setSearchFrame] = useState("");
  const [searchLens, setSearchLens] = useState("");
  const [searchTreatment, setSearchTreatment] = useState("");
  const [isTreatmentFocused, setIsTreatmentFocused] = useState(false);
  const [frameSuggestions, setFrameSuggestions] = useState([]);
  const [lensSuggestions, setLensSuggestions] = useState([]);
  const [isDiscountModalOpen, setIsDiscountModalOpen] = useState(false);

  const [calculatedData, setCalculatedData] = useState({
    p_frame: 0,
    p_lens: 0,
    discount_frame: null,
    discount_lens: null,
    total_p_frame: null,
    total_p_lens: null,
    totalP: 0,
    price: 0,
  });

  const [discountInput, setDiscountInput] = useState({
    discount_frame: "",
    discount_lens: "",
  });

  const formatMoney = (amount) => {
    if (amount === null || amount === undefined || amount === "") return 0;
    return parseFloat(parseFloat(amount).toFixed(2));
  };

  useEffect(() => {
    if (formData.brand && formData.brand !== searchFrame) {
      setSearchFrame(formData.brand);
    }
    if (formData.lens_type_name && formData.lens_type_name !== searchLens) {
      setSearchLens(formData.lens_type_name);
    }
  }, [formData.brand, formData.lens_type_name]);

  const handleSearchFrame = async (e) => {
    const value = e.target.value;
    setSearchFrame(value);
    try {
      let query = supabase
        .from("inventario")
        .select("id, brand, price, quantity")
        .eq("category", "armazon")
        .ilike("brand", `%${value}%`)
        .gt("quantity", 0);
      // Solo se muestra el stock de la sucursal donde se está haciendo
      // esta venta — no tendría sentido vender un armazón que físicamente
      // está en otro local.
      if (formData.branchs_id) {
        query = query.eq("branchs_id", formData.branchs_id);
      }
      const { data, error } = await query;
      if (error) throw error;
      setFrameSuggestions(data || []);
    } catch {
      setFrameSuggestions([]);
    }
  };

  const handleSearchLens = async (e) => {
    const value = e.target.value;
    setSearchLens(value);
    try {
      const { data, error } = await supabase
        .from("lens")
        .select("id, lens_type, lens_price")
        .ilike("lens_type", `%${value}%`);
      if (error) throw error;
      setLensSuggestions(data || []);
    } catch {
      setLensSuggestions([]);
    }
  };

  const handleSuggestionClick = (item, type) => {
    if (type === "frame") {
      setFormData((prev) => ({
        ...prev,
        brand_id: item.id,
        brand: item.brand,
        p_frame: item.price || 0,
      }));
      setSearchFrame(item.brand);
      setFrameSuggestions([]);
      if (onTotalsChange) onTotalsChange({ frameName: item.brand });
    } else {
      setFormData((prev) => ({
        ...prev,
        lens_id: item.id,
        lens_type_name: item.lens_type,
        p_lens: item.lens_price || 0,
      }));
      setSearchLens(item.lens_type);
      setLensSuggestions([]);
      if (onTotalsChange) onTotalsChange({ lensName: item.lens_type });
    }
  };

  useEffect(() => {
    setCalculatedData((prev) => ({
      ...prev,
      p_frame: formData.p_frame || 0,
      p_lens: formData.p_lens || 0,
      discount_frame: formData.discount_frame ?? 0,
      discount_lens: formData.discount_lens ?? 0,
      total_p_frame:
        typeof formData.total_p_frame === "number" && formData.discount_frame > 0
          ? formData.total_p_frame
          : null,
      total_p_lens:
        typeof formData.total_p_lens === "number" && formData.discount_lens > 0
          ? formData.total_p_lens
          : null,
    }));
  }, [formData]);

  useEffect(() => {
    const price = (calculatedData.p_frame || 0) + (calculatedData.p_lens || 0);
    setCalculatedData((prev) => ({ ...prev, price }));
  }, [calculatedData.p_frame, calculatedData.p_lens]);

  const handleDiscountChange = (e) => {
    const { name, value } = e.target;
    setDiscountInput((prev) => ({ ...prev, [name]: value }));

    const discount = parseFloat(value);
    if (!isNaN(discount) && discount > 0 && discount <= 100) {
      if (name === "discount_frame") {
        const total_p_frame = formatMoney(calculatedData.p_frame * (1 - discount / 100));
        setCalculatedData((prev) => ({ ...prev, discount_frame: discount, total_p_frame }));
        setFormData((prev) => ({ ...prev, discount_frame: discount, total_p_frame }));
      } else if (name === "discount_lens") {
        const total_p_lens = formatMoney(calculatedData.p_lens * (1 - discount / 100));
        setCalculatedData((prev) => ({ ...prev, discount_lens: discount, total_p_lens }));
        setFormData((prev) => ({ ...prev, discount_lens: discount, total_p_lens }));
      }
    } else if (value === "" || isNaN(discount) || discount === 0) {
      if (name === "discount_frame") {
        setCalculatedData((prev) => ({ ...prev, discount_frame: 0, total_p_frame: null }));
        setFormData((prev) => {
          const { discount_frame, total_p_frame, ...rest } = prev;
          return { ...rest, discount_frame: 0 };
        });
      } else if (name === "discount_lens") {
        setCalculatedData((prev) => ({ ...prev, discount_lens: 0, total_p_lens: null }));
        setFormData((prev) => {
          const { discount_lens, total_p_lens, ...rest } = prev;
          return { ...rest, discount_lens: 0 };
        });
      }
    }
  };

  // Camino inverso: si escribes el total final directamente, se calcula el
  // % de descuento solo, reutilizando exactamente la misma lógica de arriba.
  const handleFinalPriceChange = (type) => (val) => {
    const base = type === "frame" ? calculatedData.p_frame : calculatedData.p_lens;
    const discountKey = type === "frame" ? "discount_frame" : "discount_lens";
    const totalKey = type === "frame" ? "total_p_frame" : "total_p_lens";

    if (val === "" || Number(base) <= 0) {
      handleDiscountChange({ target: { name: discountKey, value: "" } });
      return;
    }

    // Se guarda el valor EXACTO que se escribió (no uno recalculado desde
    // el % con redondeo) — el % se calcula aparte, solo para mostrarlo.
    const finalNum = formatMoney(Math.max(0, Number(val) || 0));
    const pct = base > 0 ? Math.max(0, Math.min(100, (1 - finalNum / base) * 100)) : 0;

    setDiscountInput((prev) => ({ ...prev, [discountKey]: pct.toFixed(2) }));
    setCalculatedData((prev) => ({ ...prev, [discountKey]: pct, [totalKey]: finalNum }));
    setFormData((prev) => ({ ...prev, [discountKey]: pct, [totalKey]: finalNum }));
  };

  useEffect(() => {
    setDiscountInput({
      discount_frame:
        calculatedData.discount_frame !== null && calculatedData.discount_frame !== undefined
          ? calculatedData.discount_frame.toString()
          : "",
      discount_lens:
        calculatedData.discount_lens !== null && calculatedData.discount_lens !== undefined
          ? calculatedData.discount_lens.toString()
          : "",
    });
  }, [calculatedData.discount_frame, calculatedData.discount_lens]);

  useEffect(() => {
    const totalFrame =
      calculatedData.total_p_frame !== null && calculatedData.total_p_frame !== undefined
        ? formatMoney(calculatedData.total_p_frame)
        : formatMoney(calculatedData.p_frame);
    const totalLens =
      calculatedData.total_p_lens !== null && calculatedData.total_p_lens !== undefined
        ? formatMoney(calculatedData.total_p_lens)
        : formatMoney(calculatedData.p_lens);
    const totalP = totalFrame + totalLens;
    setCalculatedData((prev) => ({ ...prev, totalP: totalP.toString() }));
  }, [
    calculatedData.total_p_frame,
    calculatedData.total_p_lens,
    calculatedData.p_frame,
    calculatedData.p_lens,
    calculatedData.discount_frame,
    calculatedData.discount_lens,
    calculatedData.price,
  ]);

  useEffect(() => {
    if (onTotalsChange) {
      let total_p_frame, total_p_lens, total;
      if ((calculatedData.discount_frame && calculatedData.discount_frame > 0) || (calculatedData.discount_lens && calculatedData.discount_lens > 0)) {
        total_p_frame = formatMoney(calculatedData.discount_frame > 0 ? calculatedData.total_p_frame : calculatedData.p_frame);
        total_p_lens = formatMoney(calculatedData.discount_lens > 0 ? calculatedData.total_p_lens : calculatedData.p_lens);
        total = Number(total_p_frame) + Number(total_p_lens);
      } else {
        total_p_frame = formatMoney(calculatedData.p_frame);
        total_p_lens = formatMoney(calculatedData.p_lens);
        total = Number(total_p_frame) + Number(total_p_lens);
      }
      onTotalsChange({
        frameName: formData.brand || "",
        lensName: formData.lens_type_name || "",
        total_p_frame,
        total_p_lens,
        total,
      });
    }
  }, [
    calculatedData.total_p_frame,
    calculatedData.total_p_lens,
    calculatedData.p_frame,
    calculatedData.p_lens,
    calculatedData.discount_frame,
    calculatedData.discount_lens,
    formData.brand,
    formData.lens_type_name,
  ]);

  const textColor = useColorModeValue("gray.800", "white");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const selectBg = useColorModeValue("white", "gray.700");
  const accentColor = "#00A88E";
  const subtitleColor = useColorModeValue("gray.500", "gray.400");

  const totalDiscountApplied =
    (calculatedData.discount_frame > 0 ? 1 : 0) + (calculatedData.discount_lens > 0 ? 1 : 0);

  const accessoriesTotal = accessories.reduce((sum, a) => sum + a.unit_price * a.quantity, 0);

  return (
    <Box w="100%">
      <VStack spacing={6} w="100%" align="stretch">
        {/* Encabezado con acceso a Descuento y "+ Agregar" */}
        <Flex justify="flex-end" gap={2}>
          <Button
            size="sm"
            variant="outline"
            leftIcon={<Icon as={Percent} boxSize="14px" />}
            borderRadius="full"
            onClick={() => setIsDiscountModalOpen(true)}
          >
            Descuento
            {totalDiscountApplied > 0 && (
              <Badge ml={2} colorScheme="green" borderRadius="full">
                {totalDiscountApplied}
              </Badge>
            )}
          </Button>
          <Button
            size="sm"
            colorScheme="teal"
            variant="outline"
            leftIcon={<SmallAddIcon />}
            borderRadius="full"
            onClick={onOpenAddMore}
          >
            Agregar
          </Button>
        </Flex>

        {/* Frame Section */}
        <Box w="100%">
          <Flex align="center" gap={2} mb={2}>
            <Flex
              align="center"
              justify="center"
              boxSize="28px"
              borderRadius="8px"
              bg={useColorModeValue("#E6FBF6", "rgba(0,168,142,0.15)")}
              color={accentColor}
              flexShrink={0}
            >
              <Icon as={Glasses} boxSize="16px" />
            </Flex>
            <Text fontWeight="bold" fontSize="md" color={accentColor} letterSpacing="wide">
              Armazón
            </Text>
          </Flex>
          <VStack spacing={3} w="100%" align="stretch">
            <FormControl>
              <FormLabel fontSize="sm" fontWeight="semibold">
                Buscar armazón
              </FormLabel>
              <Flex align="center" position="relative">
                <Input
                  name="frame1"
                  placeholder={formData.branchs_id ? "Escribe para buscar..." : "Sin sucursal detectada"}
                  value={searchFrame}
                  onChange={handleSearchFrame}
                  isDisabled={!formData.branchs_id}
                  fontSize="md"
                  height="44px"
                  borderRadius="xl"
                  w="100%"
                  bg={selectBg}
                  borderColor={borderColor}
                  color={textColor}
                  pr="40px"
                  _hover={{ borderColor: accentColor, boxShadow: "sm" }}
                  _focus={{ borderColor: accentColor, boxShadow: "0 0 0 2px #00A88E33" }}
                />
                <Icon as={SearchIcon} position="absolute" right="12px" color={accentColor} />
              </Flex>
              {!formData.branchs_id && (
                <Text fontSize="xs" color="orange.400" mt={1}>
                  Tu usuario no tiene una sucursal asignada — pídele al admin que te la asigne en Configuración de Usuarios.
                </Text>
              )}
              {frameSuggestions.length > 0 && (
                <Box
                  mt={2}
                  borderRadius="md"
                  boxShadow="md"
                  bg={selectBg}
                  border={`1px solid ${borderColor}`}
                  maxH="140px"
                  overflowY="auto"
                  fontSize="sm"
                  zIndex={10}
                  position="absolute"
                  w="calc(100% - 4px)"
                >
                  {frameSuggestions.map((item, index) => (
                    <Box
                      key={index}
                      p={2}
                      _hover={{ bg: accentColor, color: "white", cursor: "pointer" }}
                      transition="background 0.2s"
                      onClick={() => handleSuggestionClick(item, "frame")}
                    >
                      {item.brand}
                    </Box>
                  ))}
                </Box>
              )}
            </FormControl>
            <SimpleGrid columns={2} spacing={3} w="100%">
              <FormControl>
                <FormLabel fontSize="sm" fontWeight="semibold">Valor</FormLabel>
                <Input
                  name="p_frame"
                  type="number"
                  height="44px"
                  borderRadius="xl"
                  value={formatMoney(calculatedData.p_frame)}
                  readOnly
                  fontSize="md"
                  bg={selectBg}
                  borderColor={borderColor}
                  color={textColor}
                  textAlign="center"
                />
              </FormControl>
              <FormControl>
                <FormLabel fontSize="sm" fontWeight="semibold">Total</FormLabel>
                <Input
                  name="total_p_frame"
                  type="text"
                  value={`$${formatMoney(
                    calculatedData.discount_frame > 0 ? calculatedData.total_p_frame : calculatedData.p_frame
                  ).toFixed(2)}`}
                  readOnly
                  fontSize="md"
                  height="44px"
                  borderRadius="xl"
                  bg={selectBg}
                  borderColor={borderColor}
                  color={calculatedData.discount_frame > 0 ? "green.500" : textColor}
                  fontWeight={calculatedData.discount_frame > 0 ? "bold" : "normal"}
                  textAlign="center"
                />
              </FormControl>
            </SimpleGrid>
          </VStack>
        </Box>

        {/* Lens Section */}
        <Box w="100%">
          <Flex align="center" gap={2} mb={2}>
            <Flex
              align="center"
              justify="center"
              boxSize="28px"
              borderRadius="8px"
              bg={useColorModeValue("#E6FBF6", "rgba(0,168,142,0.15)")}
              color={accentColor}
              flexShrink={0}
            >
              <Icon as={Eye} boxSize="16px" />
            </Flex>
            <Text fontWeight="bold" fontSize="md" color={accentColor} letterSpacing="wide">
              Lunas
            </Text>
          </Flex>
          <VStack spacing={3} w="100%" align="stretch">
            <FormControl>
              <FormLabel fontSize="sm" fontWeight="semibold">Buscar lente</FormLabel>
              <Flex align="center" position="relative">
                <Input
                  name="lens1"
                  placeholder="Escribe para buscar..."
                  value={searchLens}
                  onChange={handleSearchLens}
                  fontSize="md"
                  height="44px"
                  borderRadius="xl"
                  w="100%"
                  bg={selectBg}
                  borderColor={borderColor}
                  color={textColor}
                  pr="40px"
                  _hover={{ borderColor: accentColor, boxShadow: "sm" }}
                  _focus={{ borderColor: accentColor, boxShadow: "0 0 0 2px #00A88E33" }}
                />
                <Icon as={SearchIcon} position="absolute" right="12px" color={accentColor} />
              </Flex>
              {lensSuggestions.length > 0 && (
                <Box
                  mt={2}
                  borderRadius="md"
                  boxShadow="md"
                  bg={selectBg}
                  border={`1px solid ${borderColor}`}
                  maxH="140px"
                  overflowY="auto"
                  fontSize="sm"
                  zIndex={10}
                  position="absolute"
                  w="100%"
                >
                  {lensSuggestions.map((item, index) => (
                    <Box
                      key={index}
                      p={2}
                      _hover={{ bg: accentColor, color: "white", cursor: "pointer" }}
                      transition="background 0.2s"
                      onClick={() => handleSuggestionClick(item, "lens")}
                    >
                      {item.lens_type}
                    </Box>
                  ))}
                </Box>
              )}
            </FormControl>
            <SimpleGrid columns={2} spacing={3} w="100%">
              <FormControl>
                <FormLabel fontSize="sm" fontWeight="semibold">Valor</FormLabel>
                <Input
                  name="p_lens"
                  type="number"
                  value={formatMoney(calculatedData.p_lens)}
                  readOnly
                  fontSize="md"
                  height="44px"
                  borderRadius="xl"
                  bg={selectBg}
                  borderColor={borderColor}
                  color={textColor}
                  textAlign="center"
                />
              </FormControl>
              <FormControl>
                <FormLabel fontSize="sm" fontWeight="semibold">Total</FormLabel>
                <Input
                  name="total_p_lens"
                  type="text"
                  value={`$${formatMoney(
                    calculatedData.discount_lens > 0 ? calculatedData.total_p_lens : calculatedData.p_lens
                  ).toFixed(2)}`}
                  readOnly
                  fontSize="md"
                  height="44px"
                  borderRadius="xl"
                  bg={selectBg}
                  borderColor={borderColor}
                  color={calculatedData.discount_lens > 0 ? "green.500" : textColor}
                  fontWeight={calculatedData.discount_lens > 0 ? "bold" : "normal"}
                  textAlign="center"
                />
              </FormControl>
            </SimpleGrid>
          </VStack>
        </Box>

        {/* Treatments Section — mismo estilo que Armazón y Lunas */}
        <Box w="100%">
          <Flex align="center" gap={2} mb={2}>
            <Flex
              align="center"
              justify="center"
              boxSize="28px"
              borderRadius="8px"
              bg={useColorModeValue("#E6FBF6", "rgba(0,168,142,0.15)")}
              color={accentColor}
              flexShrink={0}
            >
              <Icon as={Wrench} boxSize="16px" />
            </Flex>
            <Text fontWeight="bold" fontSize="md" color={accentColor} letterSpacing="wide">
              Tratamientos
            </Text>
          </Flex>
          <VStack spacing={3} w="100%" align="stretch">
            <FormControl position="relative">
              <FormLabel fontSize="sm" fontWeight="semibold">Buscar tratamiento</FormLabel>
              <Flex align="center" position="relative">
                <Input
                  placeholder="Escribe para buscar..."
                  value={searchTreatment}
                  onChange={(e) => setSearchTreatment(e.target.value)}
                  onFocus={() => setIsTreatmentFocused(true)}
                  onBlur={() => setTimeout(() => setIsTreatmentFocused(false), 150)}
                  fontSize="md"
                  height="44px"
                  borderRadius="xl"
                  w="100%"
                  bg={selectBg}
                  borderColor={borderColor}
                  color={textColor}
                  pr="40px"
                  _hover={{ borderColor: accentColor, boxShadow: "sm" }}
                  _focus={{ borderColor: accentColor, boxShadow: "0 0 0 2px #00A88E33" }}
                  isDisabled={treatmentsCatalog.length === 0}
                />
                <Icon as={SearchIcon} position="absolute" right="12px" color={accentColor} />
              </Flex>
              {treatmentsCatalog.length === 0 && (
                <Text fontSize="xs" color={subtitleColor} mt={1}>
                  No hay tratamientos activos en el catálogo (Inventario → Tratamientos).
                </Text>
              )}
              {isTreatmentFocused && searchTreatment.trim().length > 0 && (
                <Box
                  mt={2}
                  borderRadius="md"
                  boxShadow="md"
                  bg={selectBg}
                  border={`1px solid ${borderColor}`}
                  maxH="160px"
                  overflowY="auto"
                  fontSize="sm"
                  zIndex={10}
                  position="absolute"
                  w="calc(100% - 4px)"
                >
                  {treatmentsCatalog
                    .filter((t) => t.name.toLowerCase().includes(searchTreatment.toLowerCase()))
                    .map((t) => {
                      const isSelected = selectedTreatmentIds.includes(t.id);
                      return (
                        <Flex
                          key={t.id}
                          justify="space-between"
                          p={2}
                          _hover={{ bg: accentColor, color: "white", cursor: "pointer" }}
                          transition="background 0.2s"
                          onMouseDown={() => {
                            setSelectedTreatmentIds(
                              isSelected
                                ? selectedTreatmentIds.filter((id) => id !== t.id)
                                : [...selectedTreatmentIds, t.id]
                            );
                            setSearchTreatment("");
                          }}
                        >
                          <Text>{isSelected ? "✓ " : ""}{t.name}</Text>
                          <Text fontWeight="bold">${Number(t.price).toFixed(2)}</Text>
                        </Flex>
                      );
                    })}
                  {treatmentsCatalog.filter((t) => t.name.toLowerCase().includes(searchTreatment.toLowerCase())).length === 0 && (
                    <Text p={2} color={subtitleColor}>Sin resultados.</Text>
                  )}
                </Box>
              )}
            </FormControl>

            {/* Tratamientos elegidos — el precio se edita desde el botón
                "Descuento" de arriba (junto con armazón y luna), aquí solo
                se ve el resultado. */}
            {selectedTreatmentIds.length > 0 && (
              <VStack spacing={2} align="stretch">
                {selectedTreatmentIds.map((id) => {
                  const t = treatmentsCatalog.find((tr) => tr.id === id);
                  if (!t) return null;
                  const basePrice = Number(t.price);
                  const rawOverride = treatmentPriceOverrides[id];
                  const finalPrice =
                    rawOverride !== undefined && rawOverride !== ""
                      ? Number(rawOverride)
                      : basePrice;
                  const discountPct =
                    basePrice > 0 && finalPrice < basePrice
                      ? Math.round((1 - finalPrice / basePrice) * 100)
                      : 0;
                  return (
                    <Flex
                      key={id}
                      align="center"
                      gap={2}
                      p={2}
                      borderRadius="lg"
                      bg={useColorModeValue("gray.50", "whiteAlpha.50")}
                      flexWrap="wrap"
                    >
                      <Text flex="1" minW="120px" fontSize="sm" fontWeight="semibold">
                        {t.name}
                      </Text>
                      {discountPct > 0 && (
                        <>
                          <Text fontSize="xs" color={subtitleColor} textDecoration="line-through">
                            ${basePrice.toFixed(2)}
                          </Text>
                          <Badge colorScheme="green" borderRadius="full" px={2}>
                            -{discountPct}%
                          </Badge>
                        </>
                      )}
                      <Text fontSize="sm" fontWeight="bold" color={accentColor}>
                        ${finalPrice.toFixed(2)}
                      </Text>
                      <IconButton
                        aria-label="Quitar tratamiento"
                        icon={<Text fontSize="sm">✕</Text>}
                        size="xs"
                        variant="ghost"
                        colorScheme="red"
                        onClick={() => {
                          setSelectedTreatmentIds(selectedTreatmentIds.filter((tid) => tid !== id));
                          const rest = { ...treatmentPriceOverrides };
                          delete rest[id];
                          setTreatmentPriceOverrides(rest);
                        }}
                      />
                    </Flex>
                  );
                })}
                <Flex justify="flex-end" pt={1}>
                  <Text fontSize="sm" fontWeight="bold" color={accentColor}>
                    Total tratamientos: ${treatmentsTotal.toFixed(2)}
                  </Text>
                </Flex>
              </VStack>
            )}
          </VStack>
        </Box>

        {/* Accesorios agregados (si hay) */}
        {accessories.length > 0 && (
          <Box>
            <Text fontSize="xs" fontWeight="bold" textTransform="uppercase" color={subtitleColor} mb={2}>
              Agregado a la venta
            </Text>
            <Wrap>
              {accessories.map((a) => (
                <WrapItem key={`${a.source}-${a.sourceId}`}>
                  <Tag borderRadius="full" py={2} px={3} bg={useColorModeValue("gray.100", "whiteAlpha.100")}>
                    <TagLabel fontSize="sm">
                      {a.name} {a.quantity > 1 ? `x${a.quantity}` : ""} · ${(a.unit_price * a.quantity).toFixed(2)}
                    </TagLabel>
                    <TagCloseButton
                      onClick={() =>
                        setAccessories((prev) =>
                          prev.filter((x) => !(x.source === a.source && x.sourceId === a.sourceId))
                        )
                      }
                    />
                  </Tag>
                </WrapItem>
              ))}
            </Wrap>
          </Box>
        )}

        {/* Totals */}
        <Box
          w="100%"
          mt={2}
          p={4}
          bg={useColorModeValue("#E6FBF6", "rgba(0,168,142,0.15)")}
          borderRadius="xl"
          border={`1px solid ${accentColor}`}
          textAlign="center"
        >
          <Text fontWeight="bold" fontSize="xl" color={accentColor}>
            Total a pagar: ${(Number(calculatedData.totalP) + accessoriesTotal + treatmentsTotal).toFixed(2)}
          </Text>
          {(accessoriesTotal > 0 || treatmentsTotal > 0) && (
            <Text fontSize="xs" color={subtitleColor} mt={1}>
              {[
                accessoriesTotal > 0 ? `$${accessoriesTotal.toFixed(2)} en accesorios` : null,
                treatmentsTotal > 0 ? `$${treatmentsTotal.toFixed(2)} en tratamientos` : null,
              ].filter(Boolean).join(" · ")}
            </Text>
          )}
        </Box>
      </VStack>

      <DiscountModal
        isOpen={isDiscountModalOpen}
        onClose={() => setIsDiscountModalOpen(false)}
        discountFrame={discountInput.discount_frame}
        discountLens={discountInput.discount_lens}
        onChangeDiscountFrame={handleDiscountChange}
        onChangeDiscountLens={handleDiscountChange}
        frameName={formData.brand}
        lensName={formData.lens_type_name}
        frameBasePrice={calculatedData.p_frame}
        lensBasePrice={calculatedData.p_lens}
        frameFinalPrice={calculatedData.discount_frame > 0 ? calculatedData.total_p_frame : calculatedData.p_frame}
        lensFinalPrice={calculatedData.discount_lens > 0 ? calculatedData.total_p_lens : calculatedData.p_lens}
        onChangeFrameFinal={handleFinalPriceChange("frame")}
        onChangeLensFinal={handleFinalPriceChange("lens")}
        treatmentsCatalog={treatmentsCatalog}
        selectedTreatmentIds={selectedTreatmentIds}
        treatmentPriceOverrides={treatmentPriceOverrides}
        setTreatmentPriceOverrides={setTreatmentPriceOverrides}
      />
    </Box>
  );
};

export default SalesDetails;
