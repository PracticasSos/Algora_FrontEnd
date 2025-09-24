import { Box, Flex, Grid } from "@chakra-ui/react";
import ObservationSection from "./ObservationSection";

const ObservationStep = ({ formData, setFormData }) => {

  return (
    <Flex justify="center" align="center" >
      <Box mt={4}>
        <Grid gap={6}>
          <ObservationSection formData={formData} setFormData={setFormData} />
        </Grid>
      </Box>
    </Flex>
  );
};

export default ObservationStep;
