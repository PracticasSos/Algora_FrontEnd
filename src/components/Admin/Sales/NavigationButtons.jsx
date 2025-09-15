import { Box, Button } from "@chakra-ui/react";

const NavigationButtons = ({ currentStep, totalSteps, prevStep, nextStep, handleSubmit, isSubmitting }) => (
  <Box mt={6} display="flex" justifyContent="space-between" width="100%" maxWidth="400px" gap={4}>
    <Button
      onClick={prevStep}
      isDisabled={currentStep === 1}
      colorScheme="gray"
    >
      Anterior
    </Button>
    {currentStep === totalSteps ? (
      <Button colorScheme="teal" onClick={handleSubmit} isDisabled={isSubmitting}>
        {isSubmitting ? "Registrando..." : "Registrar Venta"}
      </Button>
    ) : (
      <Button onClick={nextStep} colorScheme="teal">
        Siguiente
      </Button>
    )}
  </Box>
);

export default NavigationButtons;
