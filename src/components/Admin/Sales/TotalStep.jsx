import { Box, Text, useColorModeValue, Flex, Divider } from "@chakra-ui/react";
import TotalUI from "./TotalUI";

const TotalStep = ({ formData, onFormDataChange, frameName, lensName, total_p_frame, total_p_lens, total }) => {
  const cardBg = useColorModeValue("white", "gray.800");

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
          frameName={frameName || ""}
          lensName={lensName || ""}
          total_p_frame={total_p_frame}
          total_p_lens={total_p_lens}
          total={total}
          initialFormData={formData}
          onFormDataChange={onFormDataChange}
        />
      </Box>
    </Flex>
  );
};

export default TotalStep;
