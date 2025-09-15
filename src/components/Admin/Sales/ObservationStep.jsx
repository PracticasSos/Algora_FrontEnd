import { Box, Text, useColorModeValue } from "@chakra-ui/react";
import ObservationSection from "./ObservationSection";

const ObservationStep = ({ setFormData }) => {
  const cardBg = useColorModeValue(
    'rgba(207, 202, 202, 0.5)',
    'rgba(48, 44, 44, 0.2)'
  );
  return (
    <Box mt={8}>
      <Text fontSize="xl" fontWeight="bold" mb={6} textAlign="center" color="gray.600">
        Observación
      </Text>
      <Box width="100vw" position="relative" bg={cardBg} py={8} mt={8}>
        <ObservationSection setFormData={setFormData} />
      </Box>
    </Box>
  );
};

export default ObservationStep;
