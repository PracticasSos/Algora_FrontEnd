import {
  FormControl,
  FormLabel,
  Input,
  Box,
  Text,
  useColorModeValue,
  useToast,
  VStack,
  Icon,
  Flex,
  Divider,
} from "@chakra-ui/react";
import { CalendarIcon, TimeIcon } from "@chakra-ui/icons";
import { useEffect, useState } from "react";

const Delivery = ({ saleData, setSaleData }) => {
  const [deliveryDays, setDeliveryDays] = useState(null);
  const [selectedDateText, setSelectedDateText] = useState("");
  const [miniDateTime, setMinDateTime] = useState("");
  const toast = useToast();

  useEffect(() => {
    const now = new Date();
    const localNow = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
    const formatted = localNow.toISOString().slice(0, 16);
    setMinDateTime(formatted);
  }, []);

  const handleDateChange = (e) => {
    if (!e.target.value) {
      setDeliveryDays(null);
      setSelectedDateText("");
      setSaleData((prev) => ({
        ...prev,
        delivery_time: null,
        delivery_datetime: null,
      }));
      return;
    }
    const selectedDateTime = new Date(e.target.value);
    const now = new Date();
    if (selectedDateTime < now) {
      toast({
        title: "Fecha inválida",
        description: "No se puede seleccionar una fecha anterior a la actual.",
        status: "error",
        duration: 4000,
        isClosable: true,
        position: "top",
      });
      e.target.value = "";
      setDeliveryDays(null);
      setSelectedDateText("");
      setSaleData((prev) => ({
        ...prev,
        delivery_time: null,
        delivery_datetime: null,
      }));
      return;
    }
    const diffInMs = selectedDateTime.getTime() - now.getTime();
    const diffInHours = diffInMs / (1000 * 60 * 60);
    const diffInDays = Math.ceil(diffInHours / 24);
    setDeliveryDays(diffInDays);
    const formatted = selectedDateTime.toLocaleString("es-ES", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
    setSelectedDateText(formatted);
    setSaleData((prev) => ({
      ...prev,
      delivery_time: `${diffInDays} día${diffInDays !== 1 ? "s" : ""}`,
      delivery_datetime: selectedDateTime.toISOString(),
      delivery_formatted: formatted,
    }));
  };

  // Colores adaptativos
  const boxBg = useColorModeValue("white", "gray.800");
  const boxShadow = useColorModeValue("0 4px 24px rgba(0,0,0,0.08)", "0 4px 24px rgba(0,0,0,0.32)");
  const boxColor = useColorModeValue("gray.700", "white");
  const textColor = useColorModeValue("gray.800", "white");
  const secondaryTextColor = useColorModeValue("gray.600", "gray.300");
  const labelColor = useColorModeValue("teal.600", "teal.300");
  const borderColor = useColorModeValue("teal.200", "teal.600");
  const selectBg = useColorModeValue("gray.50", "gray.700");

  return (
    <Box
      bg={boxBg}
      p={{ base: 6, md: 8 }}
      borderRadius="2xl"
      color={boxColor}
      mx="auto"
      maxW="480px"
      textAlign="center"
      boxShadow={boxShadow}
      border="1px solid"
      borderColor={borderColor}
      transition="box-shadow 0.2s"
    >
      <VStack spacing={6} align="stretch">
        <Flex align="center" justify="center" mb={2}>
          <Icon as={CalendarIcon} boxSize={7} color="teal.400" mr={2} />
          <Text fontSize="2xl" fontWeight="bold" color={labelColor}>
            Programar entrega
          </Text>
        </Flex>
        <Divider borderColor={borderColor} />
        <FormControl w="100%">
          <FormLabel fontSize="md" color={labelColor} fontWeight="semibold" mb={2}>
            Selecciona fecha y hora
          </FormLabel>
          <Input
            type="datetime-local"
            name="delivery_date"
            min={miniDateTime}
            onChange={handleDateChange}
            value={saleData.delivery_datetime ? saleData.delivery_datetime.slice(0, 16) : ""}
            focusBorderColor="teal.500"
            borderRadius="lg"
            height="48px"
            pl={4}
            pr={4}
            bg={selectBg}
            borderColor={borderColor}
            color={textColor}
            fontSize="md"
            fontWeight="medium"
            _hover={{
              borderColor: useColorModeValue("teal.300", "teal.500"),
              boxShadow: useColorModeValue("0 0 0 2px teal.100", "0 0 0 2px teal.700"),
            }}
            _focus={{
              borderColor: useColorModeValue("teal.500", "teal.300"),
              boxShadow: useColorModeValue("0 0 0 2px teal.200", "0 0 0 2px teal.600"),
            }}
            transition="all 0.2s"
          />
        </FormControl>
        <Box mt={2}>
          {deliveryDays !== null ? (
            <VStack spacing={2}>
              <Flex align="center" justify="center">
                <Icon as={TimeIcon} boxSize={5} color="teal.400" mr={2} />
                <Text fontSize="lg" fontWeight="semibold" color={textColor}>
                  Entrega en {deliveryDays} día{deliveryDays !== 1 ? "s" : ""}
                </Text>
              </Flex>
              <Text fontSize="sm" color={secondaryTextColor} mt={1}>
                <b>Fecha seleccionada:</b> {selectedDateText}
              </Text>
            </VStack>
          ) : (
            <Text fontSize="sm" color={secondaryTextColor}>
              Selecciona una fecha y hora para ver el tiempo estimado de entrega.
            </Text>
          )}
        </Box>
      </VStack>
    </Box>
  );
};

export default Delivery;