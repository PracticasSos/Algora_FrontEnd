import { useEffect, useState, useMemo } from "react";
import ReactMarkdown from "react-markdown";
import termsText from "./TermsText.md?raw";
import {
  Box,
  Checkbox,
  Text,
  Button,
  Collapse,
  useColorModeValue,
  Divider,
  Icon,
  Flex,
} from "@chakra-ui/react";
import { FaChevronDown, FaChevronUp } from "react-icons/fa";

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

  // Reemplaza todas las apariciones de "veoptics" (cualquier caso) por la sucursal seleccionada
  const branchDisplay = selectedBranch || "VEOPTICS";
  const replacedTerms = useMemo(
    () => termsText.replace(/veoptics/gi, branchDisplay),
    [branchDisplay]
  );

  const lines = replacedTerms.split("\n");
  const previewLines = lines.slice(0, 3).join("\n");
  const remainingLines = lines.slice(3).join("\n");

  useEffect(() => {
    const updatedMessage = baseMessage.replace("{{BRANCH}}", selectedBranch || "VEOPTICS");
    setMessage(updatedMessage);
  }, [selectedBranch]);

  const boxBg = useColorModeValue('white', 'gray.800');
  const textColor = useColorModeValue('gray.900', 'gray.100');
  const borderColor = useColorModeValue('teal.300', 'teal.600');
  const termsBg = useColorModeValue('gray.50', 'gray.700');
  const termsTextColor = useColorModeValue('gray.800', 'gray.200');
  const buttonColor = useColorModeValue('teal.600', 'teal.300');
  const shadow = useColorModeValue('lg', 'dark-lg');

  return (
    <Box
      bg={boxBg}
      p={{ base: 4, md: 6 }}
      borderRadius="2xl"
      maxW="540px"
      mx="auto"
      mb={6}
      boxShadow={shadow}
      border={`1.5px solid ${borderColor}`}
      transition="box-shadow 0.2s"
    >
      <Flex align="center" mb={2}>
        <Icon as={FaChevronDown} color={buttonColor} boxSize={5} mr={2} />
        <Text fontWeight="bold" fontSize="lg" color={textColor}>
          Términos y condiciones
        </Text>
      </Flex>
      <Divider mb={3} />

      <Box
        bg={termsBg}
        p={4}
        borderRadius="xl"
        fontSize="md"
        lineHeight="1.7"
        color={termsTextColor}
        width="100%"
        mb={3}
        border={`1px solid ${borderColor}`}
        boxShadow="sm"
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
          variant="ghost"
          size="sm"
          mt={2}
          color={buttonColor}
          onClick={() => setShowFullTerms(!showFullTerms)}
          fontWeight="bold"
          rightIcon={
            showFullTerms ? (
              <Icon as={FaChevronUp} boxSize={4} />
            ) : (
              <Icon as={FaChevronDown} boxSize={4} />
            )
          }
          _hover={{
            bg: useColorModeValue('teal.50', 'teal.900'),
            color: useColorModeValue('teal.700', 'teal.200')
          }}
          transition="background 0.2s"
        >
          {showFullTerms ? "Leer menos" : "Leer más"}
        </Button>
      </Box>

      <Divider mb={3} />

      <Checkbox
        isChecked={isChecked}
        onChange={handleCheckbox}
        colorScheme="teal"
        fontSize="md"
        size="lg"
        display="flex"
        alignItems="center"
        mb={1}
      >
        <Text
          fontSize="md"
          color={textColor}
          ml={2}
          fontWeight="medium"
        >
          {message}
        </Text>
      </Checkbox>
    </Box>
  );
};

export default TermsCondition;