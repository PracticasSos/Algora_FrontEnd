import { Box, Button } from "@chakra-ui/react";

const StepsIndicator = ({ totalSteps, currentStep, goToStep }) => (
  <Box mb={6} display="flex" justifyContent="center" flexWrap="wrap" gap={2}>
    {Array.from({ length: totalSteps }, (_, i) => i + 1).map((step) => (
      <Button
        key={step}
        size="sm"
        colorScheme={currentStep === step ? "teal" : "gray"}
        variant={currentStep === step ? "solid" : "outline"}
        onClick={() => goToStep(step)}
      >
        {step}
      </Button>
    ))}
  </Box>
);

export default StepsIndicator;
