import { Box, Text, useColorModeValue } from "@chakra-ui/react";
import TotalUI from "./TotalUI";

const TotalStep = ({ formData, onFormDataChange }) => {
  const cardBg = useColorModeValue(
    'rgba(207, 202, 202, 0.5)',
    'rgba(48, 44, 44, 0.2)'
  );
  return (
    <Box mb={[4, 6]}>
      <Text fontSize="xl" fontWeight="bold" mb={6} textAlign="center" color="gray.600">
        Total
      </Text>
      <Box width="100vw" position="relative" bg={cardBg} py={8} mt={8}>
        <TotalUI
          frameName={formData.brand || ""}
          lensName={formData.lens_type_name || ""}
          total_p_frame={formData.total_p_frame}
          total_p_lens={formData.total_p_lens}
          initialFormData={formData}
          onFormDataChange={onFormDataChange}
        />
      </Box>
    </Box>
  );
};

export default TotalStep;
