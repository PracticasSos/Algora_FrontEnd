import { 
  Box, Flex, FormControl, FormLabel, Input, SimpleGrid, useToast, VStack, Img, useColorModeValue, Text, Divider, Icon 
} from "@chakra-ui/react";
import { SearchIcon } from "@chakra-ui/icons";
import { useEffect, useState } from "react";
import { supabase } from "../../../../api/supabase";

const DetailsHistory = ({ saleId,  onTotalsChange, onFormDataChange, initialFormData = {} }) => {
  const [searchFrame, setSearchFrame] = useState("");
  const [searchLens, setSearchLens] = useState("");
  const [frameSuggestions, setFrameSuggestions] = useState([]);
  const [lensSuggestions, setLensSuggestions] = useState([]);
  const toast = useToast();

  const [formData, setFormData] = useState({
    inventario_id: null,
    p_frame: 0,
    lens_id: null,
    lens_type_name: "",
    p_lens: 0
  });

  const [calculatedData, setCalculatedData] = useState({
    p_frame: 0,
    p_lens: 0,
    discount_frame: 0,
    discount_lens: 0,
    total_p_frame: 0,
    total_p_lens: 0,
    totalP: 0,
    price: 0,
  });

  

  const [originalInventoryId, setOriginalInventoryId] = useState(null); 

  useEffect(() => {
  if (onTotalsChange) {
    onTotalsChange({
      total_p_frame: calculatedData.total_p_frame,
      total_p_lens: calculatedData.total_p_lens,
    });
  }
}, [calculatedData.total_p_frame, calculatedData.total_p_lens]);

  useEffect(() => {
    const fetchSaleItems = async () => {
      const idToUse = saleId || initialFormData.sale_id;
      if (!idToUse) return;

      const { data, error } = await supabase
        .from("sales")
        .select(`
          inventario_id,
          p_frame,
          lens_id,
          p_lens,
          discount_frame,
          discount_lens,
          total_p_frame,
          total_p_lens,
          inventario ( brand ),
          lens ( lens_type ),
          branchs_id,
          date
        `)
        .eq("id", idToUse)
        .single();
      if (error) {
        console.error("Error al obtener datos de la venta:", error);
        return;
      }

      const loadedData = {
      inventario_id: data.inventario_id ?? null,
      p_frame: data.p_frame ?? 0,
      lens_id: data.lens_id ?? null,
      lens_type_name: data.lens?.lens_type ?? "",
      p_lens: data.p_lens ?? 0,
      discount_frame: data.discount_frame ?? 0,
      discount_lens: data.discount_lens ?? 0,
      total_p_frame: data.total_p_frame ?? 0,
      total_p_lens: data.total_p_lens ?? 0,
      frameName: data.inventario?.brand ?? "",
      lensName: data.lens?.lens_type ?? "",
      branchs_id: data.branchs_id ?? "",
      date: data.date ?? "",
    };

      setFormData(loadedData);
      setOriginalInventoryId(data.inventario_id); 
      setSearchFrame(data.inventario?.brand ?? "");
      setSearchLens(data.lens?.lens_type ?? "");
      onFormDataChange && onFormDataChange(loadedData);
    };

    fetchSaleItems();
  }, [saleId, initialFormData.sale_id]);

  const updateInventoryStock = async (newId, oldId) => {
    try {
      if (newId && newId !== oldId) {
        if (oldId) {
          await supabase.rpc("adjust_inventory", {
            id_param: oldId,
            change_amount: 1,
          });
        }
        await supabase.rpc("adjust_inventory", {
          id_param: newId,
          change_amount: -1,
        });
      }
    } catch (error) {
      console.error("Error al ajustar inventario:", error);
      toast({
        title: "Error de inventario",
        description: "No se pudo actualizar el stock.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const updateFormData = async (updatedData) => {
  // Combina el estado actual con los cambios
  const newFormData = { ...formData, ...updatedData };

  // Si cambió el armazón, actualiza el stock
  if (
    updatedData.inventario_id &&
    updatedData.inventario_id !== formData.inventario_id
  ) {
    await updateInventoryStock(updatedData.inventario_id, formData.inventario_id);
  }

  // Actualiza el estado local y en el padre
  setFormData(newFormData);
  onFormDataChange && onFormDataChange(newFormData);

  // Limpia campos de solo UI antes de enviar a la base
  const { lens_type_name, frameName, lensName, ...dataToUpdate } = newFormData;
  dataToUpdate.lens_id = Number(dataToUpdate.lens_id) || null;
  dataToUpdate.inventario_id = Number(dataToUpdate.inventario_id) || null;

  // Envía el objeto completo a la base de datos
  const { error } = await supabase
    .from("sales")
    .update(dataToUpdate)
    .eq("id", saleId);

    if (error) {
      console.error("Error al actualizar la venta:", error);
      toast({
        title: "Error",
        description: "No se pudo actualizar la venta.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } else {
      toast({
        title: "Guardado",
        description: "Datos actualizados correctamente.",
        status: "success",
        duration: 2000,
        isClosable: true,
      });
    }
  };

  const handleSearchFrame = async (e) => {
    const value = e.target.value;
    setSearchFrame(value);
    const { data, error } = await supabase
      .from("inventario")
      .select("id, brand, price, quantity")
      .ilike("brand", `%${value}%`)
      .gt("quantity", 0);

    if (!error && data) setFrameSuggestions(data);
  };

  const handleSearchLens = async (e) => {
    const value = e.target.value;
    setSearchLens(value);
    const { data, error } = await supabase
      .from("lens")
      .select("id, lens_type, lens_price")
      .ilike("lens_type", `%${value}%`);

    if (!error && data) setLensSuggestions(data);
  };

  const handleSuggestionClick = async (item, type) => {
    let updatedData = {};
    if (type === "frame") {
      updatedData = {
        inventario_id: item.id,
        frameName: item.brand || "",
        p_frame: item.price ?? 0,
      };
      setSearchFrame(item.brand || "");
      setFrameSuggestions([]);
    } else if (type === "lens") {
      updatedData = {
        lens_id: item.id,
        lens_type_name: item.lens_type || "",
        p_lens: item.lens_price ?? 0,
      };
      setSearchLens(item.lens_type || "");
      setLensSuggestions([]);
    }

    await updateFormData(updatedData);
  };


  useEffect(() => {
    setCalculatedData((prevState) => ({
      ...prevState,
      p_frame: formData.p_frame || 0,
      p_lens: formData.p_lens || 0,
      discount_frame: formData.discount_frame || 0,
      discount_lens: formData.discount_lens || 0,
      total_p_frame: formData.total_p_frame || 0,
      total_p_lens: formData.total_p_lens || 0,
    }));
  }, [formData]);

  useEffect(() => {
    const price = (calculatedData.p_frame || 0) + (calculatedData.p_lens || 0);
    setCalculatedData((prevState) => ({ ...prevState, price }));
  }, [calculatedData.p_frame, calculatedData.p_lens]);

  const handleDiscountChange = (e) => {
    const { name, value } = e.target;
  
    if (value === "") {
      setCalculatedData((prevState) => ({
        ...prevState,
        [name]: "",
      }));
      return;
    }
  
    const discount = parseFloat(value) || 0;
  
    if (name === "discount_frame") {
      const total_p_frame = calculatedData.p_frame - (calculatedData.p_frame * discount / 100);
      setCalculatedData((prevState) => ({
        ...prevState,
        discount_frame: discount,
        total_p_frame: parseFloat(total_p_frame.toFixed(2)),
      }));
    } else if (name === "discount_lens") {
      const total_p_lens = calculatedData.p_lens - (calculatedData.p_lens * discount / 100);
      setCalculatedData((prevState) => ({
        ...prevState,
        discount_lens: discount,
        total_p_lens: parseFloat(total_p_lens.toFixed(2)),
      }));
    }
  };
  

  const handleTotalChange = (e) => {
    const { name, value } = e.target;
  
    if (value === "") {
      setCalculatedData((prevState) => ({
        ...prevState,
        [name]: "",
      }));
      return;
    }
  
    const parsed = parseFloat(value);
  
    if (!isNaN(parsed)) {
      if (name === "total_p_frame") {
        const discount_frame = calculatedData.p_frame > 0
          ? 100 - ((parsed / calculatedData.p_frame) * 100)
          : 0;
        setCalculatedData((prevState) => ({
          ...prevState,
          total_p_frame: parsed,
          discount_frame: parseFloat(discount_frame.toFixed(2)),
        }));
      } else if (name === "total_p_lens") {
        const discount_lens = calculatedData.p_lens > 0
          ? 100 - ((parsed / calculatedData.p_lens) * 100)
          : 0;
        setCalculatedData((prevState) => ({
          ...prevState,
          total_p_lens: parsed,
          discount_lens: parseFloat(discount_lens.toFixed(2)),
        }));
      }
    }
  };
  

  useEffect(() => {
    const totalP = (calculatedData.total_p_frame || 0) + (calculatedData.total_p_lens || 0);

    setCalculatedData((prevState) => ({
      ...prevState,
      totalP: totalP.toFixed(2),
    }));

    setFormData((prevState) => ({
      ...prevState,
      discount_frame: calculatedData.discount_frame,
      discount_lens: calculatedData.discount_lens,
      total_p_frame: calculatedData.total_p_frame,
      total_p_lens: calculatedData.total_p_lens,
      total: parseFloat(totalP),
      price: calculatedData.price.toFixed(2),
    }));

    const updateSale = async () => {
      if (!formData.id) return;
      await supabase.from("sales").update({
        discount_frame: calculatedData.discount_frame,
        discount_lens: calculatedData.discount_lens,
        total_p_frame: calculatedData.total_p_frame,
        total_p_lens: calculatedData.total_p_lens,
        total: parseFloat(totalP),
        price: parseFloat(calculatedData.price.toFixed(2)),
      }).eq("id", formData.id);
    };

    const timeout = setTimeout(updateSale, 800);
    return () => clearTimeout(timeout);
  }, [calculatedData.discount_frame, calculatedData.discount_lens, calculatedData.total_p_frame, calculatedData.total_p_lens]);

   // Colores y estilos
  const bgColor = useColorModeValue("white", "gray.900");
  const cardBg = useColorModeValue("gray.50", "gray.800");
  const textColor = useColorModeValue("gray.800", "white");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const selectBg = useColorModeValue("white", "gray.700");
  const accentColor = useColorModeValue("blue.500", "blue.300");

  return (
    <Box w="100%" bg={useColorModeValue("gray.50", "gray.900")}>
      <Box
        maxW="900px"
        mx="auto"
        h="100%"
        borderRadius="2xl"
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
                      type="text"
                      placeholder="Escribe para buscar..."
                      value={searchFrame || ""}
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
                      {frameSuggestions.map((item) => (
                        <Box
                          key={item.id}
                          p={2}
                          _hover={{
                            bg: accentColor,
                            color: "white",
                            cursor: "pointer",
                          }}
                          transition="background 0.2s"
                          onClick={() => handleSuggestionClick(item, "frame")}
                        >
                          {item.brand} - ${item.price}
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
                      value={calculatedData.p_frame.toFixed(2)}
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
                      value={calculatedData.discount_frame === 0 ? "" : calculatedData.discount_frame ?? ""}
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
                      value={calculatedData.total_p_frame === 0 ? "" : calculatedData.total_p_frame ?? ""}
                      onChange={handleTotalChange}
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
                      value={searchLens || ""}
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
                      {lensSuggestions.map((item) => (
                        <Box
                          key={item.id}
                          p={2}
                          _hover={{
                            bg: accentColor,
                            color: "white",
                            cursor: "pointer",
                          }}
                          transition="background 0.2s"
                          onClick={() => handleSuggestionClick(item, "lens")}
                        >
                          {item.lens_type} - ${item.lens_price}
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
                      value={calculatedData.p_lens.toFixed(2)}
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
                      value={calculatedData.discount_lens === 0 ? "" : calculatedData.discount_lens ?? ""}
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
                      value={calculatedData.total_p_lens === 0 ? "" : calculatedData.total_p_lens ?? ""}
                      onChange={handleTotalChange}
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

export default DetailsHistory;
