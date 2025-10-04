import { useEffect, useState } from "react";
import {
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Input,
  Box,
  Heading,
  SimpleGrid,
  FormControl,
  FormLabel,
  useToast,
  Button,
  Text,
  VStack,
  HStack,
  Divider,
  useColorModeValue,
  Icon,
} from "@chakra-ui/react";
import { FaEye } from "react-icons/fa";
import { supabase } from "../../../../api/supabase";

const fields = [
  "sphere",
  "cylinder",
  "axis",
  "prism",
  "add",
  "av_vl",
  "av_vp",
  "dnp",
  "alt",
];

const fieldLabels = {
  sphere: "Esfera",
  cylinder: "Cilindro",
  axis: "Eje",
  prism: "Prisma",
  add: "ADD",
  av_vl: "AV VL",
  av_vp: "AV VP",
  dnp: "DNP",
  alt: "ALT",
};

const MeasuresHistory = ({ saleId, onFormDataChange, initialFormData = {} }) => {
  const [formData, setFormData] = useState(initialFormData);
  const [measureId, setMeasureId] = useState(null);
  const [hasChanges, setHasChanges] = useState(false);

  const toast = useToast();

  // UI colors and styles
  const boxBg = useColorModeValue("white", "gray.800");
  const boxShadow = useColorModeValue("lg", "dark-lg");
  const tableHeadBg = useColorModeValue("gray.50", "gray.700");
  const tableBorder = useColorModeValue("gray.200", "gray.600");
  const inputBg = useColorModeValue("gray.100", "gray.700");
  const inputFocus = useColorModeValue("blue.500", "blue.300");
  const labelColor = useColorModeValue("gray.600", "gray.300");
  const eyeColors = {
    right: useColorModeValue("blue.400", "blue.300"),
    left: useColorModeValue("pink.400", "pink.300"),
  };

  useEffect(() => {
    const fetchMeasureIdFromSale = async () => {
      if (!saleId) return;

      const { data, error } = await supabase
        .from("sales")
        .select("measure_id")
        .eq("id", saleId)
        .single();

      if (error) {
        console.error("Error al obtener measure_id:", error);
      } else {
        setMeasureId(data.measure_id);
      }
    };

    fetchMeasureIdFromSale();
  }, [saleId]);

  useEffect(() => {
    const fetchRxData = async () => {
      if (!measureId) return;

      const { data, error } = await supabase
        .from("rx_final")
        .select("*")
        .eq("id", measureId)
        .single();

      if (error) {
        console.error("Error al obtener datos de medida:", error);
      } else {
        const updatedFormData = {};
        fields.forEach((field) => {
          ["right", "left"].forEach((side) => {
            const key = `${field}_${side}`;
            updatedFormData[key] = data[key] || "";
          });
        });
        setFormData(updatedFormData);
      }
    };

    fetchRxData();
  }, [measureId]);

  useEffect(() => {
    if (onFormDataChange && Object.keys(formData).length > 0) {
      onFormDataChange(formData);
    }
    const changed = JSON.stringify(formData) !== JSON.stringify(initialFormData);
    setHasChanges(changed);
  }, [formData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const updateRxData = async () => {
    if (!measureId || !hasChanges) return;

    const { error } = await supabase
      .from("rx_final")
      .update(formData)
      .eq("id", measureId);

    if (error) {
      console.error("Error al actualizar las medidas:", error);
      toast({
        title: "Error",
        description: "No se pudieron actualizar las medidas.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } else {
      toast({
        title: "Medidas actualizadas",
        description: "Las medidas se han guardado correctamente.",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      setHasChanges(false);
    }
  };

  return (
    <Box
      mt={4}
      mb={6}
      px={[2, 6]}
      py={[4, 6]}
      bg={boxBg}
      borderRadius="xl"
      boxShadow={boxShadow}
      borderWidth={1}
      borderColor={tableBorder}
      maxW="container.lg"
      mx="auto"
    >
      <Heading
        size="md"
        mb={6}
        textAlign="center"
        color={useColorModeValue("blue.700", "blue.200")}
        letterSpacing="wide"
      >
        Historial de Medidas Oftalmológicas
      </Heading>

      {/* Desktop Table */}
      <Box display={{ base: "none", lg: "block" }} mb={4}>
        <Table variant="simple" size="md" borderRadius="lg" overflow="hidden">
          <Thead bg={tableHeadBg}>
            <Tr>
              <Th
                fontSize="md"
                color={labelColor}
                textAlign="center"
                px={4}
                py={3}
              >
                Rx Final
              </Th>
              {fields.map((field) => (
                <Th
                  key={field}
                  fontSize="md"
                  color={labelColor}
                  textAlign="center"
                  px={4}
                  py={3}
                >
                  {fieldLabels[field]}
                </Th>
              ))}
            </Tr>
          </Thead>
          <Tbody>
            {[
              { side: "OD", prefix: "right" },
              { side: "OI", prefix: "left" },
            ].map(({ side, prefix }) => (
              <Tr key={prefix} _hover={{ bg: useColorModeValue("gray.50", "gray.700") }}>
                <Td textAlign="center" fontWeight="bold" px={4} py={3}>
                  <HStack justify="center" spacing={2}>
                    <Icon as={FaEye} color={eyeColors[prefix]} />
                    <Text color={eyeColors[prefix]}>{side}</Text>
                  </HStack>
                </Td>
                {fields.map((field) => (
                  <Td key={field} px={4} py={3}>
                    <Input
                      name={`${field}_${prefix}`}
                      value={formData[`${field}_${prefix}`] || ""}
                      onChange={handleChange}
                      fontSize="md"
                      bg={inputBg}
                      borderRadius="md"
                      borderColor={tableBorder}
                      _focus={{
                        borderColor: inputFocus,
                        boxShadow: `0 0 0 1px ${inputFocus}`,
                        bg: useColorModeValue("white", "gray.600"),
                      }}
                      textAlign="center"
                      transition="all 0.2s"
                    />
                  </Td>
                ))}
              </Tr>
            ))}
          </Tbody>
        </Table>
      </Box>

      {/* Mobile Cards */}
      <Box display={{ base: "block", lg: "none" }} mb={4}>
        <VStack spacing={6}>
          {["OD", "OI"].map((eye) => {
            const prefix = eye === "OD" ? "right" : "left";
            return (
              <Box
                key={eye}
                w="100%"
                p={4}
                borderRadius="xl"
                boxShadow={boxShadow}
                bg={boxBg}
                borderWidth={1}
                borderColor={tableBorder}
              >
                <HStack mb={3} spacing={3}>
                  <Icon as={FaEye} boxSize={6} color={eyeColors[prefix]} />
                  <Text
                    fontSize="lg"
                    fontWeight="bold"
                    color={eyeColors[prefix]}
                  >
                    {eye === "OD"
                      ? "Ojo Derecho (OD)"
                      : "Ojo Izquierdo (OI)"}
                  </Text>
                </HStack>
                <Divider mb={4} />
                <SimpleGrid columns={2} spacing={4}>
                  {fields.map((name) => (
                    <FormControl key={name}>
                      <FormLabel
                        fontSize="sm"
                        color={labelColor}
                        mb={1}
                        fontWeight="semibold"
                        letterSpacing="wide"
                      >
                        {fieldLabels[name]}
                      </FormLabel>
                      <Input
                        name={`${name}_${prefix}`}
                        value={formData[`${name}_${prefix}`] || ""}
                        onChange={handleChange}
                        borderRadius="md"
                        bg={inputBg}
                        borderColor={tableBorder}
                        color={useColorModeValue("gray.800", "white")}
                        fontSize="md"
                        _hover={{
                          borderColor: useColorModeValue("gray.300", "gray.500"),
                        }}
                        _focus={{
                          borderColor: inputFocus,
                          boxShadow: `0 0 0 1px ${inputFocus}`,
                          bg: useColorModeValue("white", "gray.600"),
                        }}
                        textAlign="center"
                        transition="all 0.2s"
                      />
                    </FormControl>
                  ))}
                </SimpleGrid>
              </Box>
            );
          })}
        </VStack>
      </Box>

      <Box mt={4} textAlign="center">
        <Button
          onClick={updateRxData}
          isDisabled={!hasChanges}
          colorScheme="blue"
          size="lg"
          borderRadius="full"
          px={8}
          boxShadow="md"
        >
          Actualizar Medidas
        </Button>
      </Box>
    </Box>
  );
};

export default MeasuresHistory;
