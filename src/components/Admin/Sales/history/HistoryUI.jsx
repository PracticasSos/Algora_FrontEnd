import { useEffect, useState } from "react";
import {
  Box,
  Grid,
  GridItem,
  Flex,
  FormControl,
  FormLabel,
  Select,
  Input,
  useColorModeValue,
  Text,
  Divider,
  Icon,
} from "@chakra-ui/react";
import { FaStore, FaCalendarAlt, FaGlasses, FaCircle } from "react-icons/fa";
import { supabase } from "../../../../api/supabase";

const HistoryUI = ({
  frameName = "",
  lensName = "",
  total_p_frame = "",
  total_p_lens = "",
  onFormDataChange,
  initialFormData = {},
}) => {
  const [branches, setBranches] = useState([]);
  const [formData, setFormData] = useState(initialFormData);

  useEffect(() => {
    fetchData("branchs", setBranches);
  }, []);

  useEffect(() => {
    setFormData(initialFormData);
  }, [initialFormData]);

  useEffect(() => {
    if (initialFormData.sale_id) {
      fetchSaleById(initialFormData.sale_id);
    }
    // eslint-disable-next-line
  }, [initialFormData.sale_id]);

  const fetchData = async (table, setData) => {
    const { data, error } = await supabase.from(table).select("*");
    if (error) {
      console.error(`Error fetching ${table}:`, error);
    } else {
      setData(data);
    }
  };

  const fetchSaleById = async (saleId) => {
    const { data, error } = await supabase
      .from("sales")
      .select("branchs_id, date")
      .eq("id", saleId)
      .single();

    if (error) {
      console.error("Error fetching sale data:", error);
    } else if (data) {
      const updated = {
        ...formData,
        branchs_id: data.branchs_id,
        date: data.date,
      };
      setFormData(updated);
      onFormDataChange(updated);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    const updated = { ...formData, [name]: value };
    setFormData(updated);
    onFormDataChange(updated);
  };

  const total = (parseFloat(total_p_frame) || 0) + (parseFloat(total_p_lens) || 0);

  const textColor = useColorModeValue("gray.800", "white");
  const borderColor = useColorModeValue("gray.200", "gray.600");
  const selectBg = useColorModeValue("white", "gray.700");

  return (
    <Box
      w="90%"
      maxW="900px"
      mx="auto"
      bg={useColorModeValue("white", "gray.800")}
      borderRadius="2xl"
      boxShadow={useColorModeValue("lg", "dark-lg")}
      borderWidth={1}
      borderColor={borderColor}
      transition="box-shadow 0.2s"
      p={8}
    >
      <Text
        fontWeight="bold"
        fontSize="xl"
        mb={4}
        color={useColorModeValue("blue.700", "blue.300")}
        textAlign="center"
        letterSpacing="wide"
      >
        Resumen de Venta
      </Text>
      <Divider mb={6} />

      <Grid
        templateColumns={{ base: "1fr", md: "repeat(2, 1fr)" }}
        gap={5}
        w="100%"
      >
        {/* Fecha */}
        <GridItem colSpan={2}>
          <Flex align="center" gap={3}>
            <Icon as={FaCalendarAlt} color="blue.400" boxSize={5} />
            <FormControl>
              <FormLabel htmlFor="date" mb="1" fontSize="sm">
                Fecha
              </FormLabel>
              <Input
                id="date"
                type="date"
                name="date"
                value={initialFormData.date || ""}
                onChange={e => onFormDataChange({ date: e.target.value })}
                h="44px"
                borderRadius="lg"
                fontSize="md"
                bg={selectBg}
                borderColor={borderColor}
                color={textColor}
                _hover={{
                  borderColor: useColorModeValue("blue.300", "blue.500"),
                }}
                _focus={{
                  borderColor: useColorModeValue("blue.500", "blue.300"),
                  boxShadow: useColorModeValue(
                    "0 0 0 2px blue.200",
                    "0 0 0 2px blue.700"
                  ),
                }}
              />
            </FormControl>
          </Flex>
        </GridItem>

        {/* Sucursal */}
        <GridItem colSpan={2}>
          <Flex align="center" gap={3}>
            <Icon as={FaStore} color="green.400" boxSize={5} />
            <FormControl isRequired>
              <FormLabel fontSize="sm">Sucursal</FormLabel>
              <Select
                name="branchs_id"
                value={initialFormData.branchs_id || ""}
                onChange={handleChange}
                h="44px"
                borderRadius="lg"
                fontSize="md"
                bg={selectBg}
                borderColor={borderColor}
                color={textColor}
                _hover={{
                  borderColor: useColorModeValue("green.300", "green.500"),
                }}
                _focus={{
                  borderColor: useColorModeValue("green.500", "green.300"),
                  boxShadow: useColorModeValue(
                    "0 0 0 2px green.200",
                    "0 0 0 2px green.700"
                  ),
                }}
              >
                <option value="">Seleccione una sucursal</option>
                {branches.map((branch) => (
                  <option key={branch.id} value={branch.id}>
                    {branch.name || branch.id}
                  </option>
                ))}
              </Select>
            </FormControl>
          </Flex>
        </GridItem>

        {/* Armazón */}
        <GridItem>
          <Box p={3}>
            <Flex align="center" gap={2} mb={2}>
              <Icon as={FaGlasses} color="blue.400" boxSize={4} />
              <FormLabel fontSize="sm" mb="0">
                Armazón
              </FormLabel>
            </Flex>
            <Input
              name="frame1"
              value={frameName}
              isReadOnly
              minW="120px"
              h="40px"
              borderRadius="md"
              fontSize="md"
              bg={selectBg}
              borderColor={borderColor}
              color={textColor}
              _hover={{
                borderColor: useColorModeValue("blue.300", "blue.500"),
              }}
              _focus={{
                borderColor: useColorModeValue("blue.500", "blue.300"),
                boxShadow: useColorModeValue(
                  "0 0 0 2px blue.200",
                  "0 0 0 2px blue.700"
                ),
              }}
            />
          </Box>
        </GridItem>

        {/* Total Armazón */}
        <GridItem>
          <Box p={3}>
            <Flex align="center" gap={2} mb={2}>
              <Icon as={FaCircle} color="blue.400" boxSize={4} />
              <FormLabel fontSize="sm" mb="0">
                Total Armazón
              </FormLabel>
            </Flex>
            <Input
              name="total_p_frame"
              value={Number(total_p_frame ?? 0).toFixed(2)}
              isReadOnly
              h="40px"
              borderRadius="md"
              fontSize="md"
              bg={selectBg}
              borderColor={borderColor}
              color={textColor}
              _hover={{
                borderColor: useColorModeValue("blue.300", "blue.500"),
              }}
              _focus={{
                borderColor: useColorModeValue("blue.500", "blue.300"),
                boxShadow: useColorModeValue(
                  "0 0 0 2px blue.200",
                  "0 0 0 2px blue.700"
                ),
              }}
            />
          </Box>
        </GridItem>

        {/* Lunas */}
        <GridItem>
          <Box p={3}>
            <Flex align="center" gap={2} mb={2}>
              <Icon as={FaCircle} color="purple.400" boxSize={4} />
              <FormLabel fontSize="sm" mb="0">
                Lunas
              </FormLabel>
            </Flex>
            <Input
              name="lens1"
              value={lensName}
              isReadOnly
              minW="120px"
              h="40px"
              borderRadius="md"
              fontSize="md"
              bg={selectBg}
              borderColor={borderColor}
              color={textColor}
              _hover={{
                borderColor: useColorModeValue("purple.300", "purple.500"),
              }}
              _focus={{
                borderColor: useColorModeValue("purple.500", "purple.300"),
                boxShadow: useColorModeValue(
                  "0 0 0 2px purple.200",
                  "0 0 0 2px purple.700"
                ),
              }}
            />
          </Box>
        </GridItem>

        {/* Total Lunas */}
        <GridItem>
          <Box p={3}>
            <Flex align="center" gap={2} mb={2}>
              <Icon as={FaCircle} color="purple.400" boxSize={4} />
              <FormLabel fontSize="sm" mb="0">
                Total Lunas
              </FormLabel>
            </Flex>
            <Input
              name="total_p_lens"
              value={Number(total_p_lens ?? 0).toFixed(2)}
              isReadOnly
              h="40px"
              borderRadius="md"
              fontSize="md"
              bg={selectBg}
              borderColor={borderColor}
              color={textColor}
              _hover={{
                borderColor: useColorModeValue("purple.300", "purple.500"),
              }}
              _focus={{
                borderColor: useColorModeValue("purple.500", "purple.300"),
                boxShadow: useColorModeValue(
                  "0 0 0 2px purple.200",
                  "0 0 0 2px purple.700"
                ),
              }}
            />
          </Box>
        </GridItem>

        {/* Total General */}
        <GridItem colSpan={2}>
          <Box
            mt={4}
            p={4}
            borderRadius="2xl"
            bg={useColorModeValue("green.50", "green.900")}
            boxShadow="md"
            textAlign="center"
          >
            <Text fontWeight="bold" fontSize="lg" color="green.600" mb={2}>
              Total a Pagar
            </Text>
            <Input
              name="total"
              value={Number(total).toFixed(2)}
              isReadOnly
              h="48px"
              borderRadius="xl"
              fontSize="2xl"
              fontWeight="bold"
              bg={selectBg}
              borderColor={borderColor}
              color={useColorModeValue("green.700", "green.300")}
              textAlign="center"
              _hover={{
                borderColor: useColorModeValue("green.300", "green.500"),
              }}
              _focus={{
                borderColor: useColorModeValue("green.500", "green.300"),
                boxShadow: useColorModeValue(
                  "0 0 0 2px green.200",
                  "0 0 0 2px green.700"
                ),
              }}
            />
          </Box>
        </GridItem>
      </Grid>
    </Box>
  );
};

export default HistoryUI;