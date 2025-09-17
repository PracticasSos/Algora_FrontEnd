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
  Text,
  useColorModeValue,
  VStack,
  HStack,
  Divider,
  Icon,
} from "@chakra-ui/react";
import { FaEye } from "react-icons/fa";

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

const Measures = ({
  initialFormData = {},
  onFormDataChange,
  filteredMeasures = [],
}) => {
  const [formData, setFormData] = useState(initialFormData);

  useEffect(() => {
    if (filteredMeasures.length > 0) {
      const measureData = filteredMeasures[0];
      const updatedFormData = { ...formData };

      Object.keys(fieldLabels).forEach((field) => {
        ["right", "left"].forEach((side) => {
          const key = `${field}_${side}`;
          if (measureData[key] !== undefined) {
            updatedFormData[key] = measureData[key];
          }
        });
      });

      setFormData(updatedFormData);

      if (
        onFormDataChange &&
        JSON.stringify(updatedFormData) !== JSON.stringify(initialFormData)
      ) {
        onFormDataChange(updatedFormData);
      }
    }
  }, [filteredMeasures, initialFormData, onFormDataChange]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

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

  return (
    <Box
      mt={0}
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
        Medidas Oftalmológicas
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
              {Object.keys(fieldLabels).map((field) => (
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
                    <Text color={eyeColors[prefix]}>
                      {side}
                    </Text>
                  </HStack>
                </Td>
                {Object.keys(fieldLabels).map((field) => (
                  <Td key={field} px={4} py={3}>
                    <Input
                      name={`${field}_${prefix}`}
                      value={
                        filteredMeasures.length > 0
                          ? filteredMeasures[0][`${field}_${prefix}`] || ""
                          : formData[`${field}_${prefix}`] || ""
                      }
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
                  {Object.keys(fieldLabels).map((name) => (
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
    </Box>
  );
};

export default Measures;
