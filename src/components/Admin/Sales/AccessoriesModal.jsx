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
import AccessoriesSection from "./AccessoriesSection";

const AccessoriesModal = ({ isOpen, onClose, accessories, setAccessories }) => {
  const bgColor = useColorModeValue("white", "gray.800");

  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered size={{ base: "full", md: "md" }}>
      <ModalOverlay />
      <ModalContent bg={bgColor} borderRadius={{ base: 0, md: "20px" }}>
        <ModalHeader fontSize="md">Agregar producto o accesorio</ModalHeader>
        <ModalCloseButton />
        <ModalBody pb={6}>
          <AccessoriesSection accessories={accessories} setAccessories={setAccessories} />
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

export default AccessoriesModal;
