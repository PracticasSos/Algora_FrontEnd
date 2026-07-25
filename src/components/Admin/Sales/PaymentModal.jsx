import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  Button,
  useColorModeValue,
} from "@chakra-ui/react";
import Total from "./Total";

const PaymentModal = ({ isOpen, onClose, formData, onFormDataChange }) => {
  const bgColor = useColorModeValue("white", "gray.800");

  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered size={{ base: "full", md: "sm" }}>
      <ModalOverlay />
      <ModalContent bg={bgColor} borderRadius={{ base: 0, md: "20px" }}>
        <ModalHeader fontSize="md">Método de pago</ModalHeader>
        <ModalCloseButton />
        <ModalBody pb={6}>
          <Total formData={formData} setFormData={onFormDataChange} />
        </ModalBody>
        <ModalFooter>
          <Button bg="#00A88E" color="white" _hover={{ bg: "#00967f" }} onClick={onClose} w="full">
            Listo
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default PaymentModal;
