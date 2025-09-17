import { Box, Grid, Text, useColorModeValue, Divider, Flex } from "@chakra-ui/react";
import SalesDetails from "./SalesDetails";

const SalesDetailsStep = ({ formData, setFormData, onTotalsChange }) => {

  return (
    <Flex justify="center" align="center" >
      <Box>
        <Grid gap={6}>
          <SalesDetails
            formData={formData}
            setFormData={setFormData}
            onTotalsChange={onTotalsChange}
          />
        </Grid>
      </Box>
    </Flex>
  );
};

export default SalesDetailsStep;
