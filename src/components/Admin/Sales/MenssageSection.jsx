import { Box, FormControl, Textarea, Text, Icon, useColorModeValue } from "@chakra-ui/react";
import { FiMessageSquare } from "react-icons/fi";

const MessageSection = ({ selectedBranch, formData, setFormData }) => {
  const boxBg = useColorModeValue('white', 'gray.800');
  const textColor = useColorModeValue('gray.900', 'gray.100');
  const borderColor = useColorModeValue('gray.300', 'gray.700');
  const selectBg = useColorModeValue('gray.50', 'gray.700');
  const labelColor = useColorModeValue('blue.600', 'blue.300');

  return (
    <Box
      bg={boxBg}
      borderRadius="xl"
      p={6}
      mb={6}
      maxW="540px"
      mx="auto"
      boxShadow={useColorModeValue('lg', 'dark-lg')}
      border="1px solid"
      borderColor={borderColor}
      transition="box-shadow 0.2s"
      _hover={{ boxShadow: useColorModeValue('xl', 'outline') }}
    >
      <FormControl>
        <Text
          fontWeight="bold"
          fontSize="lg"
          mb={2}
          color={labelColor}
          display="flex"
          alignItems="center"
          gap={2}
        >
          <Icon as={FiMessageSquare} boxSize={5} />
          Mensaje
        </Text>
        <Textarea
          borderRadius="lg"
          value={formData.message || ""}
          onChange={(e) => {
            setFormData((prev) => ({ ...prev, message: e.target.value }));
          }}
          minHeight="120px"
          minWidth="350px"
          resize="vertical"
          bg={selectBg}
          borderColor={borderColor}
          color={textColor}
          fontSize="md"
          placeholder="Escribe aquí tu mensaje..."
          _placeholder={{ color: useColorModeValue('gray.400', 'gray.500') }}
          _hover={{
            borderColor: useColorModeValue('blue.300', 'blue.500'),
            boxShadow: useColorModeValue('0 0 0 2px blue.100', '0 0 0 2px blue.900')
          }}
          _focus={{
            borderColor: useColorModeValue('blue.500', 'blue.300'),
            boxShadow: useColorModeValue('0 0 0 2px blue.200', '0 0 0 2px blue.700')
          }}
          transition="all 0.2s"
        />
      </FormControl>
    </Box>
  );
};

export default MessageSection;
