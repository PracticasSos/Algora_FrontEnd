import { VStack } from "@chakra-ui/react";
import TermsCondition from "./TermsCondition";
import SignaturePadComponent from "./SignaturePadComponent";

const TermsStep = ({ selectedBranch, formData, setFormData }) => (
  <VStack align="stretch" spacing={5} w="full">
    <TermsCondition selectedBranch={selectedBranch} formData={formData} setFormData={setFormData} />
    <SignaturePadComponent
      onSave={(signatureDataUrl) =>
        setFormData((prev) => ({ ...prev, signature: signatureDataUrl }))
      }
    />
  </VStack>
);

export default TermsStep;
