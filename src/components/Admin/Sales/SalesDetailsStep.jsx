import { Box, Grid, Text, useColorModeValue } from "@chakra-ui/react";
import SalesDetails from "./SalesDetails";

const SalesDetailsStep = ({ formData, setFormData, onTotalsChange }) => {
  const cardBg = useColorModeValue(
    'rgba(207, 202, 202, 0.5)',
    'rgba(48, 44, 44, 0.2)'
  );
  return (
    <Box p={5}>
      <Text fontSize="xl" fontWeight="bold" mb={6} textAlign="center" color="gray.600">
        Detalles de Venta
      </Text>
      <Box width="100vw" position="relative" bg={cardBg} py={8} mt={8}>
        <Grid gap={4} alignItems="start">
          <SalesDetails
            formData={formData}
            setFormData={setFormData}
            onTotalsChange={onTotalsChange}
          />
        </Grid>
      </Box>
    </Box>
  );
};

export default SalesDetailsStep;
