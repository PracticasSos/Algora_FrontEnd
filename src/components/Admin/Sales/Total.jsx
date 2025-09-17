import {
  Box,
  FormControl,
  FormLabel,
  Input,
  SimpleGrid,
  Img,
  Text,
  useColorModeValue,
  Heading,
  Divider,
  Tooltip,
} from "@chakra-ui/react";
import React from "react";

const paymentMethods = [
  { src: "/assets/iconometodoefectivo.png", alt: "Efectivo", value: "efectivo" },
  { src: "/assets/iconometodotargeta.png", alt: "Tarjeta", value: "datafast" },
  { src: "/assets/iconometododatafast.png", alt: "Transferencia", value: "transferencia" },
];

const Total = ({ formData, setFormData }) => {
  const totalFrame = formData.total_p_frame > 0 ? formData.total_p_frame : formData.p_frame || 0;
  const totalLens = formData.total_p_lens > 0 ? formData.total_p_lens : formData.p_lens || 0;
  const total = Number(totalFrame) + Number(totalLens);
  const balance = formData.balance === '' ? 0 : parseFloat(formData.balance);
  const credit = isNaN(balance) ? total : total - balance;

  React.useEffect(() => {
    setFormData({
      ...formData,
      total,
      credit,
    });
    // eslint-disable-next-line
  }, [total, credit]);

  const handleCreditChange = (e) => {
    const value = e.target.value;
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setFormData({
        ...formData,
        balance: value,
      });
    }
  };

  const handleImageSelect = (method) => {
    setFormData({
      ...formData,
      payment_in: method,
    });
  };

  const isSelected = (method) => formData.payment_in === method;

  const textColor = useColorModeValue('gray.800', 'white');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const selectBg = useColorModeValue('white', 'gray.700');
  const cardBg = useColorModeValue('white', 'gray.800');
  const shadow = useColorModeValue('lg', 'dark-lg');

  return (
    <Box w="100vw" display="flex" justifyContent="center" alignItems="center" >
      <Box
        w="100%"
        maxW="800px"
        px={[2, 4, 6]}
        py={4}
      >
        <Heading size="lg" textAlign="center" mb={2} color={useColorModeValue('blue.700', 'blue.300')}>
          Pago de Venta
        </Heading>
        <Text textAlign="center" fontSize="md" color={useColorModeValue('gray.600', 'gray.400')} mb={6}>
          Selecciona el método de pago y revisa el resumen.
        </Text>
        <Divider mb={6} />

        <SimpleGrid columns={3} spacing={4} mb={6}>
          {paymentMethods.map(({ src, alt, value }) => (
            <Tooltip label={alt} key={value} hasArrow>
              <Box
                border={isSelected(value) ? "3px solid #3182CE" : `2px solid ${borderColor}`}
                borderRadius="xl"
                overflow="hidden"
                cursor="pointer"
                bg={isSelected(value) ? useColorModeValue('blue.50', 'blue.900') : selectBg}
                boxShadow={isSelected(value) ? "md" : "sm"}
                onClick={() => handleImageSelect(value)}
                transition="all 0.2s"
                p={2}
                _hover={{
                  boxShadow: "xl",
                  borderColor: "#3182CE",
                  bg: useColorModeValue('blue.50', 'blue.900'),
                }}
                display="flex"
                flexDirection="column"
                alignItems="center"
              >
                <Img
                  src={src}
                  alt={alt}
                  boxSize={["70px", "90px", "100px"]}
                  objectFit="contain"
                  mb={2}
                  filter={isSelected(value) ? "none" : "grayscale(60%)"}
                  transition="filter 0.2s"
                />
                <Text fontWeight="bold" fontSize="sm" color={isSelected(value) ? "blue.600" : textColor}>
                  {alt}
                </Text>
              </Box>
            </Tooltip>
          ))}
        </SimpleGrid>

        {!formData.payment_in && (
          <Box color="red.500" fontSize="sm" mb={4} textAlign="center">
            Debes seleccionar un método de pago.
          </Box>
        )}

        <Box w="90%" mx="auto">
          <SimpleGrid columns={1} spacing={5}>
            <FormControl>
              <FormLabel fontWeight="bold" color={useColorModeValue('gray.700', 'gray.300')}>Total</FormLabel>
              <Input
                type="number"
                name="total"
                placeholder="$150"
                height="50px"
                borderRadius="xl"
                fontWeight="bold"
                fontSize="lg"
                value={Number(total).toFixed(2)}
                isReadOnly
                bg={useColorModeValue('gray.100', 'gray.700')}
                borderColor={borderColor}
                color={textColor}
                textAlign="right"
                _hover={{ borderColor: useColorModeValue('gray.300', 'gray.500') }}
                _focus={{
                  borderColor: useColorModeValue('blue.500', 'blue.300'),
                  boxShadow: useColorModeValue('0 0 0 1px blue.500', '0 0 0 1px blue.300')
                }}
              />
            </FormControl>

            <FormControl>
              <FormLabel fontWeight="bold" color={useColorModeValue('gray.700', 'gray.300')}>Abono</FormLabel>
              <Input
                type="number"
                name="balance"
                height="50px"
                borderRadius="xl"
                fontWeight="bold"
                fontSize="lg"
                value={formData.balance === 0 || formData.balance === '0' ? '' : formData.balance ?? ''}
                onChange={handleCreditChange}
                placeholder="Abono $"
                bg={selectBg}
                borderColor={borderColor}
                color={textColor}
                textAlign="right"
                _hover={{ borderColor: useColorModeValue('gray.300', 'gray.500') }}
                _focus={{
                  borderColor: useColorModeValue('blue.500', 'blue.300'),
                  boxShadow: useColorModeValue('0 0 0 1px blue.500', '0 0 0 1px blue.300')
                }}
              />
            </FormControl>

            <FormControl>
              <FormLabel fontWeight="bold" color={useColorModeValue('gray.700', 'gray.300')}>Saldo</FormLabel>
              <Input
                type="number"
                name="credit"
                placeholder="$20"
                borderRadius="xl"
                height="50px"
                fontWeight="bold"
                fontSize="lg"
                value={Number(credit).toFixed(2)}
                isReadOnly
                bg={useColorModeValue('gray.100', 'gray.700')}
                borderColor={borderColor}
                color={textColor}
                textAlign="right"
                _hover={{ borderColor: useColorModeValue('gray.300', 'gray.500') }}
                _focus={{
                  borderColor: useColorModeValue('blue.500', 'blue.300'),
                  boxShadow: useColorModeValue('0 0 0 1px blue.500', '0 0 0 1px blue.300')
                }}
              />
            </FormControl>
          </SimpleGrid>
        </Box>
      </Box>
    </Box>
  );
};

export default Total;
