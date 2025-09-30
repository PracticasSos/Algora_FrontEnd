import { useEffect, useState } from "react";
import { supabase } from "../../../api/supabase";
import {
  Box,
  VStack,
  SimpleGrid,
  Flex,
  Img,
  FormControl,
  FormLabel,
  Input,
  useColorModeValue,
  Text,
  Divider,
  Icon,
} from "@chakra-ui/react";
import { SearchIcon } from "@chakra-ui/icons";

const SalesDetails = ({
  formData = {},
  setFormData = () => {},
  onTotalsChange = () => {},
}) => {
  const [searchFrame, setSearchFrame] = useState("");
  const [searchLens, setSearchLens] = useState("");
  const [frames, setFrames] = useState([]);
  const [lenses, setLenses] = useState([]);
  const [frameSuggestions, setFrameSuggestions] = useState([]);
  const [lensSuggestions, setLensSuggestions] = useState([]);

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

  // Estado local para los inputs editables de totales
  const [totalInput, setTotalInput] = useState({
    total_p_frame: "",
    total_p_lens: "",
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

  useEffect(() => {
    fetchData("lens", setLenses);
    fetchData("inventario", setFrames);
  }, []);

  const fetchData = async (table, setData) => {
    const { data, error } = await supabase.from(table).select("*");
    if (error) {
      console.error(`Error fetching ${table}:`, error);
    } else {
      setData(data);
    }
  };

  const handleSearchFrame = async (e) => {
    const value = e.target.value;
    setSearchFrame(value);
    try {
      const { data, error } = await supabase
        .from("inventario")
        .select("id, brand, price, quantity")
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
      if (onTotalsChange) {
        onTotalsChange({
          frameName: item.brand,
        });
      }
    } else {
      setFormData((prev) => ({
        ...prev,
        lens_id: item.id,
        lens_type_name: item.lens_type,
        p_lens: item.lens_price || 0,
      }));
      setSearchLens(item.lens_type);
      setLensSuggestions([]);
      if (onTotalsChange) {
        onTotalsChange({
          lensName: item.lens_type,
        });
      }
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
        const total_p_frame = formatMoney(
          calculatedData.p_frame * (1 - discount / 100)
        );
        setCalculatedData((prev) => ({
          ...prev,
          discount_frame: discount,
          total_p_frame,
        }));
        setFormData((prev) => ({
          ...prev,
          discount_frame: discount,
          total_p_frame: total_p_frame,
        }));
      } else if (name === "discount_lens") {
        const total_p_lens = formatMoney(
          calculatedData.p_lens * (1 - discount / 100)
        );
        setCalculatedData((prev) => ({
          ...prev,
          discount_lens: discount,
          total_p_lens,
        }));
        setFormData((prev) => ({
          ...prev,
          discount_lens: discount,
          total_p_lens: total_p_lens,
        }));
      }
    } else if (value === "" || isNaN(discount) || discount === 0) {
      // Si el usuario borra el campo o pone 0, elimina el total y el descuento
      if (name === "discount_frame") {
        setCalculatedData((prev) => ({
          ...prev,
          discount_frame: 0,
          total_p_frame: null,
        }));
        setFormData((prev) => {
          const { discount_frame, total_p_frame, ...rest } = prev;
          return { ...rest, discount_frame: 0 };
        });
      } else if (name === "discount_lens") {
        setCalculatedData((prev) => ({
          ...prev,
          discount_lens: 0,
          total_p_lens: null,
        }));
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
        calculatedData.discount_frame !== null &&
        calculatedData.discount_frame !== undefined
          ? calculatedData.discount_frame.toString()
          : "",
      discount_lens:
        calculatedData.discount_lens !== null &&
        calculatedData.discount_lens !== undefined
          ? calculatedData.discount_lens.toString()
          : "",
    });
  }, [calculatedData.discount_frame, calculatedData.discount_lens]);

  // Sincroniza el estado local de los totales con los datos calculados
  useEffect(() => {
    setTotalInput({
      total_p_frame:
        calculatedData.total_p_frame !== null && calculatedData.total_p_frame !== undefined
          ? calculatedData.total_p_frame.toString()
          : "",
      total_p_lens:
        calculatedData.total_p_lens !== null && calculatedData.total_p_lens !== undefined
          ? calculatedData.total_p_lens.toString()
          : "",
    });
  }, [calculatedData.total_p_frame, calculatedData.total_p_lens]);

  const handleTotalChange = (e) => {
    const { name, value } = e.target;
    // Permite edición libre
    setTotalInput((prev) => ({ ...prev, [name]: value }));
  };

  // Formatea y aplica el valor solo al perder el foco
  const handleTotalBlur = (e) => {
    const { name, value } = e.target;
    if (name === "total_p_frame" || name === "total_p_lens") {
      if (value === "") {
        // Si el usuario borra el campo, NO modificar nada, mantener el último valor válido
        return;
      }
      const totalValue = formatMoney(value);
      if (!isNaN(totalValue)) {
        if (name === "total_p_frame") {
          const discount_frame =
            calculatedData.p_frame > 0
              ? parseFloat(
                  (100 - (totalValue / calculatedData.p_frame) * 100).toFixed(2)
                )
              : calculatedData.discount_frame;
          setCalculatedData((prev) => ({
            ...prev,
            total_p_frame: totalValue,
            discount_frame: discount_frame,
          }));
          setFormData((prev) => ({
            ...prev,
            total_p_frame: totalValue,
            discount_frame: discount_frame,
          }));
          setTotalInput((prev) => ({ ...prev, total_p_frame: totalValue.toFixed(2) }));
        } else {
          const discount_lens =
            calculatedData.p_lens > 0
              ? parseFloat(
                  (100 - (totalValue / calculatedData.p_lens) * 100).toFixed(2)
                )
              : calculatedData.discount_lens;
          setCalculatedData((prev) => ({
            ...prev,
            total_p_lens: totalValue,
            discount_lens: discount_lens,
          }));
          setFormData((prev) => ({
            ...prev,
            total_p_lens: totalValue,
            discount_lens: discount_lens,
          }));
          setTotalInput((prev) => ({ ...prev, total_p_lens: totalValue.toFixed(2) }));
        }
      }
    }
  };

  useEffect(() => {
    const totalFrame =
      calculatedData.total_p_frame !== null &&
      calculatedData.total_p_frame !== undefined
        ? formatMoney(calculatedData.total_p_frame)
        : formatMoney(calculatedData.p_frame);

    const totalLens =
      calculatedData.total_p_lens !== null &&
      calculatedData.total_p_lens !== undefined
        ? formatMoney(calculatedData.total_p_lens)
        : formatMoney(calculatedData.p_lens);

    const totalP = totalFrame + totalLens;

    setCalculatedData((prev) => ({
      ...prev,
      totalP: totalP.toString(),
    }));
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
        // Si no hay descuento, manda p_frame y p_lens como total
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

  const bgColor = useColorModeValue("white", "gray.900");
  const cardBg = useColorModeValue("gray.50", "gray.800");
  const textColor = useColorModeValue("gray.800", "white");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const selectBg = useColorModeValue("white", "gray.700");
  const accentColor = useColorModeValue("blue.500", "blue.300");

  return (
    <Box w="100vw" bg={bgColor} >
      <Box
        w="90%"
        maxW="900px"
        mx="auto"
        h="100%"
        borderRadius="2xl"
        p={[4, 8]}
        border={`1px solid ${borderColor}`}
      >
        <VStack spacing={8} w="100%">
          {/* Frame Section */}
          <Box w="100%">
            <Text
              fontWeight="bold"
              fontSize="lg"
              mb={2}
              color={accentColor}
              letterSpacing="wide"
            >
              Armazón
            </Text>
            <Divider mb={4} />
            <SimpleGrid
              templateColumns={["80px 1fr"]}
              spacing={6}
              alignItems="center"
              w="100%"
            >
              <Flex justify="center" align="center">
                <Img
                  src="/assets/inventario.jpg"
                  alt="Armazón"
                  objectFit="cover"
                  borderRadius="xl"
                  w={["80px", "100px"]}
                  h={["80px", "100px"]}
                  boxShadow="md"
                  border={`2px solid ${accentColor}`}
                />
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
                      _hover={{
                        borderColor: accentColor,
                        boxShadow: "sm",
                      }}
                      _focus={{
                        borderColor: accentColor,
                        boxShadow: "0 0 0 2px #3182ce33",
                      }}
                    />
                    <Icon
                      as={SearchIcon}
                      position="absolute"
                      right="12px"
                      color={accentColor}
                    />
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
                      w="90%"
                    >
                      {frameSuggestions.map((item, index) => (
                        <Box
                          key={index}
                          p={2}
                          _hover={{
                            bg: accentColor,
                            color: "white",
                            cursor: "pointer",
                          }}
                          transition="background 0.2s"
                          onClick={() => handleSuggestionClick(item, "frame", 1)}
                        >
                          {item.brand}
                        </Box>
                      ))}
                    </Box>
                  )}
                </FormControl>
                <SimpleGrid columns={3} spacing={2} w="100%">
                  <FormControl>
                    <FormLabel fontSize="sm" fontWeight="semibold">
                      Valor
                    </FormLabel>
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
                      _hover={{
                        borderColor: accentColor,
                        boxShadow: "sm",
                      }}
                      _focus={{
                        borderColor: accentColor,
                        boxShadow: "0 0 0 2px #3182ce33",
                      }}
                    />
                  </FormControl>
                  <FormControl>
                    <FormLabel fontSize="sm" fontWeight="semibold">
                      Desc %
                    </FormLabel>
                    <Input
                      name="discount_frame"
                      type="number"
                      value={discountInput.discount_frame || ""}
                      onChange={handleDiscountChange}
                      fontSize="md"
                      height="44px"
                      borderRadius="xl"
                      bg={selectBg}
                      borderColor={borderColor}
                      color={textColor}
                      textAlign="center"
                      _hover={{
                        borderColor: accentColor,
                        boxShadow: "sm",
                      }}
                      _focus={{
                        borderColor: accentColor,
                        boxShadow: "0 0 0 2px #3182ce33",
                      }}
                    />
                  </FormControl>
                  <FormControl>
                    <FormLabel fontSize="sm" fontWeight="semibold">
                      Total
                    </FormLabel>
                    <Input
                      name="total_p_frame"
                      type="number"
                      value={totalInput.total_p_frame}
                      onChange={handleTotalChange}
                      onBlur={handleTotalBlur}
                      fontSize="md"
                      height="44px"
                      borderRadius="xl"
                      bg={selectBg}
                      borderColor={borderColor}
                      color={textColor}
                      textAlign="center"
                      _hover={{
                        borderColor: accentColor,
                        boxShadow: "sm",
                      }}
                      _focus={{
                        borderColor: accentColor,
                        boxShadow: "0 0 0 2px #3182ce33",
                      }}
                    />
                  </FormControl>
                </SimpleGrid>
              </VStack>
            </SimpleGrid>
          </Box>

          {/* Lens Section */}
          <Box w="100%">
            <Text
              fontWeight="bold"
              fontSize="lg"
              mb={2}
              color={accentColor}
              letterSpacing="wide"
            >
              Lunas
            </Text>
            <Divider mb={4} />
            <SimpleGrid
              templateColumns={["80px 1fr"]}
              spacing={6}
              alignItems="center"
              w="100%"
            >
              <Flex justify="center" align="center">
                <Img
                  src="/assets/lunas.jpg"
                  alt="Lunas"
                  objectFit="cover"
                  borderRadius="xl"
                  w={["80px", "100px"]}
                  h={["80px", "100px"]}
                  boxShadow="md"
                  border={`2px solid ${accentColor}`}
                />
              </Flex>
              <VStack spacing={3} w="100%" align="stretch">
                <FormControl>
                  <FormLabel fontSize="sm" fontWeight="semibold">
                    Buscar lente
                  </FormLabel>
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
                      _hover={{
                        borderColor: accentColor,
                        boxShadow: "sm",
                      }}
                      _focus={{
                        borderColor: accentColor,
                        boxShadow: "0 0 0 2px #3182ce33",
                      }}
                    />
                    <Icon
                      as={SearchIcon}
                      position="absolute"
                      right="12px"
                      color={accentColor}
                    />
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
                          _hover={{
                            bg: accentColor,
                            color: "white",
                            cursor: "pointer",
                          }}
                          transition="background 0.2s"
                          onClick={() => handleSuggestionClick(item, "lens", 1)}
                        >
                          {item.lens_type}
                        </Box>
                      ))}
                    </Box>
                  )}
                </FormControl>
                <SimpleGrid columns={3} spacing={2} w="100%">
                  <FormControl>
                    <FormLabel fontSize="sm" fontWeight="semibold">
                      Valor
                    </FormLabel>
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
                      _hover={{
                        borderColor: accentColor,
                        boxShadow: "sm",
                      }}
                      _focus={{
                        borderColor: accentColor,
                        boxShadow: "0 0 0 2px #3182ce33",
                      }}
                    />
                  </FormControl>
                  <FormControl>
                    <FormLabel fontSize="sm" fontWeight="semibold">
                      Desc %
                    </FormLabel>
                    <Input
                      name="discount_lens"
                      type="number"
                      value={discountInput.discount_lens || ""}
                      onChange={handleDiscountChange}
                      fontSize="md"
                      height="44px"
                      borderRadius="xl"
                      bg={selectBg}
                      borderColor={borderColor}
                      color={textColor}
                      textAlign="center"
                      _hover={{
                        borderColor: accentColor,
                        boxShadow: "sm",
                      }}
                      _focus={{
                        borderColor: accentColor,
                        boxShadow: "0 0 0 2px #3182ce33",
                      }}
                    />
                  </FormControl>
                  <FormControl>
                    <FormLabel fontSize="sm" fontWeight="semibold">
                      Total
                    </FormLabel>
                    <Input
                      name="total_p_lens"
                      type="number"
                      value={totalInput.total_p_lens}
                      onChange={handleTotalChange}
                      onBlur={handleTotalBlur}
                      fontSize="md"
                      height="44px"
                      borderRadius="xl"
                      bg={selectBg}
                      borderColor={borderColor}
                      color={textColor}
                      textAlign="center"
                      _hover={{
                        borderColor: accentColor,
                        boxShadow: "sm",
                      }}
                      _focus={{
                        borderColor: accentColor,
                        boxShadow: "0 0 0 2px #3182ce33",
                      }}
                    />
                  </FormControl>
                </SimpleGrid>
              </VStack>
            </SimpleGrid>
          </Box>

          {/* Totals */}
          <Box
            w="100%"
            mt={6}
            p={4}
            bg={useColorModeValue("blue.50", "blue.900")}
            borderRadius="xl"
            boxShadow="md"
            border={`1px solid ${accentColor}`}
            textAlign="center"
          >
            <Text fontWeight="bold" fontSize="xl" color={accentColor}>
              Total a pagar: ${Number(calculatedData.totalP).toFixed(2)}
            </Text>
          </Box>
        </VStack>
      </Box>
    </Box>
  );
};

export default SalesDetails;
