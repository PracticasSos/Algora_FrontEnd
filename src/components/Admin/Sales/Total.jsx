import {
  Box,
  FormControl,
  FormLabel,
  Input,
  SimpleGrid,
  Img,
  Text,
  useColorModeValue,
} from "@chakra-ui/react";

const Total = ({ formData, setFormData }) => {

  // Calcular los valores directamente en el render
  const totalFrame = formData.total_p_frame > 0 ? formData.total_p_frame : formData.p_frame || 0;
  const totalLens = formData.total_p_lens > 0 ? formData.total_p_lens : formData.p_lens || 0;
  const total = Number(totalFrame) + Number(totalLens);
  const balance = formData.balance === '' ? 0 : parseFloat(formData.balance);
  const credit = isNaN(balance) ? total : total - balance;

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

  return (
    <Box w="100vw" display="flex" justifyContent="center" alignItems="center">
      <Box
        w="100%"
        maxW="1000px"
        px={[2, 4, 6]}
        transform={{
          base: "scale(0.8)",
          sm: "scale(0.9)",
          md: "scale(0.95)",
          lg: "scale(1)",
        }}
        transformOrigin="top center"
      >
        <Box display="flex" flexDirection="column" alignItems="center" p={4}>
          <SimpleGrid columns={[3, 3]} spacing={4} mb={6}>
            {[
              { src: "/assets/iconometodoefectivo.png",  value: "efectivo" },
              { src: "/assets/iconometodotargeta.png", value: "datafas" },
              { src: "/assets/iconometododatafast.png", value: "transferencia" },
            ].map(({ src, alt, value }) => (
              <Box
                key={value}
                border={isSelected(value) ? "4px solid #3182CE" : "2px solid transparent"}
                borderRadius="md"
                overflow="hidden"
                cursor="pointer"
                onClick={() => handleImageSelect(value)}
                transition="all 0.2s"
              >
                <Img
                  src={src}
                  alt={alt}
                  boxSize={["140px", "180px", "200px", "250px"]}
                  objectFit="cover"
                  mx="auto"
                />
                <Text textAlign="center" mt={1} fontWeight="semibold">
                  {alt}
                </Text>
              </Box>
            ))}
          </SimpleGrid>

          {!formData.payment_in && (
            <Box color="red.500" fontSize="sm" mb={4}>
              Debes seleccionar un método de pago.
            </Box>
          )}

          <Box w="100%" maxW="250px" mx="auto">
            <SimpleGrid columns={1} spacing={4}>
              <FormControl>
                <FormLabel>Total</FormLabel>
                <Input
                  type="number"
                  name="total"
                  placeholder="$150"
                  height="45px"
                  borderRadius="full"
                  value={Number(total).toFixed(2)}
                  isReadOnly
                  bg={selectBg}
                  borderColor={borderColor}
                  color={textColor}
                  _hover={{
                    borderColor: useColorModeValue('gray.300', 'gray.500')
                  }}
                  _focus={{
                    borderColor: useColorModeValue('blue.500', 'blue.300'),
                    boxShadow: useColorModeValue('0 0 0 1px blue.500', '0 0 0 1px blue.300')
                  }}
                />
              </FormControl>

              <FormControl>
                <FormLabel>Abono</FormLabel>
                <Input
                  type="number"
                  name="balance"
                  height="45px"
                  borderRadius="full"
                  value={formData.balance === 0 || formData.balance === '0' ? '' : formData.balance ?? ''}
                  onChange={handleCreditChange}
                  placeholder="Abono"
                  bg={selectBg}
                  borderColor={borderColor}
                  color={textColor}
                  _hover={{
                    borderColor: useColorModeValue('gray.300', 'gray.500')
                  }}
                  _focus={{
                    borderColor: useColorModeValue('blue.500', 'blue.300'),
                    boxShadow: useColorModeValue('0 0 0 1px blue.500', '0 0 0 1px blue.300')
                  }}
                />
              </FormControl>

              <FormControl>
                <FormLabel>Saldo</FormLabel>
                <Input
                  type="number"
                  name="credit"
                  placeholder="$20"
                  borderRadius="full"
                  height="45px"
                  value={Number(credit).toFixed(2)}
                  isReadOnly
                  bg={selectBg}
                  borderColor={borderColor}
                  color={textColor}
                  _hover={{
                    borderColor: useColorModeValue('gray.300', 'gray.500')
                  }}
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
    </Box>
  );
};

export default Total;
