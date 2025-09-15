import { Box, Text, useColorModeValue } from "@chakra-ui/react";
import Total from "./Total";

const PaymentStep = ({ formData, onFormDataChange }) => {
  const cardBg = useColorModeValue(
    'rgba(207, 202, 202, 0.5)',
    'rgba(48, 44, 44, 0.2)'
  );
  return (
    <Box mt={6}>
      <Text fontSize="xl" fontWeight="bold" mb={6} textAlign="center" color="gray.600">
        Método de Pago
      </Text>
      <Box width="100vw" position="relative" bg={cardBg} py={8} mt={8}>
        <Total
          formData={formData}
          setFormData={onFormDataChange}
        />
      </Box>
    </Box>
  );
};

export default PaymentStep;
