import { Box, FormControl, Textarea, useColorModeValue } from "@chakra-ui/react";

const MessageSection = ({ selectedBranch, formData, setFormData }) => {

  const boxBg = useColorModeValue('gray.100', 'gray.700');
  const textColor = useColorModeValue('gray.800', 'white');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const selectBg = useColorModeValue('white', 'gray.600');

  return (
    <Box bg={boxBg} borderRadius="md" p={4} mb={4} maxW="530px" mx="auto" >
      <FormControl>
        <Textarea
          borderRadius="md"
          value={formData.message || ""}
          onChange={(e) => {
            setFormData((prev) => ({ ...prev, message: e.target.value }));
          }}
          minHeight="100px"
          resize="vertical"
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
    </Box>
  );
};

export default MessageSection;
