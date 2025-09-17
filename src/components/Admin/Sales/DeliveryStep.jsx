import { Box,Grid,Flex } from "@chakra-ui/react";
import Delivery from "./Delivery";

const DeliveryStep = ({ saleData, setSaleData }) => {

  return (
    <Flex justify="center" align="center" >
      <Box mt={4}>
        <Grid gap={6}>
          <Delivery saleData={saleData} setSaleData={setSaleData} />
        </Grid>
      </Box>
    </Flex>
  );
};

export default DeliveryStep;
