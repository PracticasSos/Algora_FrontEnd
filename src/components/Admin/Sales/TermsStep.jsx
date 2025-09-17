import { Box, Flex, Grid} from "@chakra-ui/react";
import TermsCondition from "./TermsCondition";
import SignaturePadComponent from "./SignaturePadComponent";

const TermsStep = ({ selectedBranch, formData, setFormData }) => {

  return (
    <Flex justify="center" align="center" >
      <Box mt={2}>
        <Grid gap={6}>
          <TermsCondition
            selectedBranch={selectedBranch}
            formData={formData}
            setFormData={setFormData}
          />
          <SignaturePadComponent
            onSave={(signatureDataUrl) =>
              setFormData((prev) => ({
                ...prev,
                signature: signatureDataUrl,
              }))
            }
          />
        </Grid>
      </Box>
    </Flex>
  );
};

export default TermsStep;
