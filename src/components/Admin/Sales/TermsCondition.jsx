import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import termsText from "./TermsText.md?raw";
import {
  Box,
  Checkbox,
  Text,
  Button,
  Collapse,
  useColorModeValue,
} from "@chakra-ui/react";

const baseMessage = "Acepta las condiciones de no devolución de {{BRANCH}}.";

const TermsCondition = ({ selectedBranch, formData, setFormData }) => {
  const [message, setMessage] = useState(
    baseMessage.replace("{{BRANCH}}", selectedBranch || "VEOPTICS")
  );
  const [isChecked, setIsChecked] = useState(false);
  const [showFullTerms, setShowFullTerms] = useState(false);

  const handleCheckbox = (e) => {
    const checked = e.target.checked;
    setIsChecked(checked);
    setFormData((prev) => ({ ...prev, termsAccepted: checked }));
  };

  const lines = termsText.split("\n");
  const previewLines = lines.slice(0, 3).join("\n");
  const remainingLines = lines.slice(3).join("\n");

  useEffect(() => {
    const updatedMessage = baseMessage.replace("{{BRANCH}}", selectedBranch || "VEOPTICS");
    setMessage(updatedMessage);
  }, [selectedBranch]);

  const boxBg = useColorModeValue('gray.100', 'gray.700');
  const textColor = useColorModeValue('gray.800', 'white');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const selectBg = useColorModeValue('white', 'gray.600');
  const termsBg = useColorModeValue('white', 'gray.600');
  const termsTextColor = useColorModeValue('gray.700', 'gray.200');
  const buttonColor = useColorModeValue('teal.600', 'teal.300');

  return (
    <Box
      bg={boxBg} 
      p={4}
      borderRadius="lg"
      maxW="530px"
      mx="auto"
      mb={4}
    >
      <Box
        bg={termsBg}
        p={3}
        borderRadius="lg"
        shadow="md"
        fontSize="sm"
        lineHeight="1.6"
        color={termsTextColor}
        width="100%"
        mb={3}
        border={`1px solid ${borderColor}`}
      >
        {/* Resumen visible */}
        <Box color={termsTextColor}>
          <ReactMarkdown>{previewLines}</ReactMarkdown>
        </Box>

        {/* Expandible */}
        <Collapse in={showFullTerms} animateOpacity>
          <Box mt={2} color={termsTextColor}>
            <ReactMarkdown>{remainingLines}</ReactMarkdown>
          </Box>
        </Collapse>

        <Button
          variant="link"
          size="sm"
          mt={2}
          color={buttonColor}
          onClick={() => setShowFullTerms(!showFullTerms)}
          fontWeight="bold"
          _hover={{
            color: useColorModeValue('teal.700', 'teal.200')
          }}
        >
          {showFullTerms ? "Leer menos" : "Leer más."}
        </Button>
      </Box>

      <Checkbox
        isChecked={isChecked}
        onChange={handleCheckbox}
        colorScheme="teal"
        fontSize="sm"
      >
        <Text 
          fontSize="sm" 
          color={textColor}
          ml={2}
        >
          Acepta las condiciones de no devolución de {selectedBranch || "VEOPTICS"}.
        </Text>
      </Checkbox>
    </Box>
  );
};

export default TermsCondition;