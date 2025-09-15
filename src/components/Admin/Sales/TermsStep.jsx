import { Box, Text, useColorModeValue } from "@chakra-ui/react";
import TermsCondition from "./TermsCondition";
import SignaturePadComponent from "./SignaturePadComponent";

const TermsStep = ({ selectedBranch, formData, setFormData }) => {
  const cardBg = useColorModeValue(
    'rgba(207, 202, 202, 0.5)',
    'rgba(48, 44, 44, 0.2)'
  );
  return (
    <Box mt={8}>
      <Text fontSize="xl" fontWeight="bold" mb={6} textAlign="center" color="gray.600">
        Términos y Condiciones
      </Text>
      <Box width="100vw" position="relative" bg={cardBg} py={8} mt={8}>
        <TermsCondition
          selectedBranch={selectedBranch}
          formData={formData}
          setFormData={setFormData}
        />
        <SignaturePadComponent
          onSave={(signatureDataUrl) =>
            setFormData((prev) => ({
              ...prev,
              signature: signatureDataUrl,
            }))
          }
        />
      </Box>
    </Box>
  );
};

export default TermsStep;
