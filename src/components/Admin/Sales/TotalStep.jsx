import { Box, Text, useColorModeValue, Flex, Divider } from "@chakra-ui/react";
import TotalUI from "./TotalUI";

const TotalStep = ({ formData, onFormDataChange }) => {
  const cardBg = useColorModeValue("white", "gray.800");
  const shadow = useColorModeValue("lg", "dark-lg");
  const borderColor = useColorModeValue("gray.200", "gray.700");

  return (
    <Flex
      direction="column"
      align="center"
      justify="center"
      minH="60vh"
      px={[2, 4]}
      mx="auto"
    >
      <Box
        width="100%"
        bg={cardBg}
        py={[6, 8]}
        px={[4, 6]}
      >
        <TotalUI
          frameName={formData.brand || ""}
          lensName={formData.lens_type_name || ""}
          total_p_frame={formData.total_p_frame}
          total_p_lens={formData.total_p_lens}
          initialFormData={formData}
          onFormDataChange={onFormDataChange}
        />
      </Box>
    </Flex>
  );
};

export default TotalStep;
