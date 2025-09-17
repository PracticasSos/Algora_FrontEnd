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
import { supabase } from "../../../api/supabase";
import { FaStore, FaCalendarAlt, FaGlasses, FaCircle } from "react-icons/fa";

const TotalUI = ({
  frameName = "",
  lensName = "",
  total_p_frame = "",
  total_p_lens = "",
  onFormDataChange,
  initialFormData = {},
}) => {
  const [branches, setBranches] = useState([]);

  useEffect(() => {
    fetchData("branchs", setBranches);
  }, []);

  const fetchData = async (table, setData) => {
    const { data, error } = await supabase.from(table).select("*");
    if (error) {
      console.error(`Error fetching ${table}:`, error);
    } else {
      setData(data);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    onFormDataChange({ [name]: value });
  };

  const total =
    (parseFloat(total_p_frame) || 0) + (parseFloat(total_p_lens) || 0);

  const textColor = useColorModeValue("gray.800", "white");
  const borderColor = useColorModeValue("gray.200", "gray.600");
  const selectBg = useColorModeValue("white", "gray.700");
  const cardBg = useColorModeValue("white", "gray.800");
  const shadow = useColorModeValue("lg", "dark-lg");

  return (
    <Box
      w="100%"
      maxW="1000px"
      mx="auto"
      px={[4, 2]}
      transition="box-shadow 0.2s"
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
                onChange={(e) => onFormDataChange({ date: e.target.value })}
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
          <Box
            p={3}
          >
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
          <Box
            p={3}
          >
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
          <Box
            p={3}
          >
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
          <Box
            p={3}
          >
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

export default TotalUI;
