import { Box, Text, useColorModeValue,Flex,Grid } from "@chakra-ui/react";
import Total from "./Total";

const PaymentStep = ({ formData, onFormDataChange }) => {

  return (
    <Flex justify="center" align="center" >
    <Box>
      <Grid gap={6}>
        <Total
          formData={formData}
          setFormData={onFormDataChange}
        />
       </Grid>
    </Box>
    </Flex>
  );
};

export default PaymentStep;
