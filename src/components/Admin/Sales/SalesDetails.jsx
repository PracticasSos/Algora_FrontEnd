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
} from "@chakra-ui/react";
import { SearchIcon, SmallAddIcon } from "@chakra-ui/icons";
import { Glasses, Eye, Percent } from "lucide-react";
import DiscountModal from "./DiscountModal";

const SalesDetails = ({
  formData = {},
  setFormData = () => {},
  onTotalsChange = () => {},
  accessories = [],
  setAccessories = () => {},
  onOpenAddMore = () => {},
}) => {
  const [searchFrame, setSearchFrame] = useState("");
  const [searchLens, setSearchLens] = useState("");
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
      const { data, error } = await supabase
        .from("inventario")
        .select("id, brand, price, quantity")
        .eq("category", "armazon")
        .ilike("brand", `%${value}%`)
        .gt("quantity", 0);
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
  const accentColor = useColorModeValue("blue.500", "blue.300");
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
              bg={useColorModeValue("blue.50", "blue.900")}
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
                  placeholder="Escribe para buscar..."
                  value={searchFrame}
                  onChange={handleSearchFrame}
                  fontSize="md"
                  height="44px"
                  borderRadius="xl"
                  w="100%"
                  bg={selectBg}
                  borderColor={borderColor}
                  color={textColor}
                  pr="40px"
                  _hover={{ borderColor: accentColor, boxShadow: "sm" }}
                  _focus={{ borderColor: accentColor, boxShadow: "0 0 0 2px #3182ce33" }}
                />
                <Icon as={SearchIcon} position="absolute" right="12px" color={accentColor} />
              </Flex>
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
              bg={useColorModeValue("blue.50", "blue.900")}
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
                  _focus={{ borderColor: accentColor, boxShadow: "0 0 0 2px #3182ce33" }}
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
          bg={useColorModeValue("blue.50", "blue.900")}
          borderRadius="xl"
          border={`1px solid ${accentColor}`}
          textAlign="center"
        >
          <Text fontWeight="bold" fontSize="xl" color={accentColor}>
            Total a pagar: ${(Number(calculatedData.totalP) + accessoriesTotal).toFixed(2)}
          </Text>
          {accessoriesTotal > 0 && (
            <Text fontSize="xs" color={subtitleColor} mt={1}>
              (incluye ${accessoriesTotal.toFixed(2)} en accesorios)
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
      />
    </Box>
  );
};

export default SalesDetails;
