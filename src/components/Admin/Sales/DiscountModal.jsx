import { useState, useEffect } from "react";
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  Button,
  FormControl,
  FormLabel,
  Input,
  InputGroup,
  InputRightElement,
  VStack,
  Text,
  useColorModeValue,
} from "@chakra-ui/react";

/**
 * Modal para aplicar % de descuento a armazón y/o luna.
 * Recibe los mismos handlers que ya existían (handleDiscountChange) para no
 * duplicar la lógica de cálculo de SalesDetails.
 */
const DiscountModal = ({
  isOpen,
  onClose,
  discountFrame,
  discountLens,
  onChangeDiscountFrame,
  onChangeDiscountLens,
  frameName,
  lensName,
}) => {
  const bgColor = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.600");

  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered size="sm">
      <ModalOverlay />
      <ModalContent bg={bgColor} borderRadius="20px">
        <ModalHeader fontSize="md">Aplicar descuento</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack spacing={4} align="stretch">
            <FormControl>
              <FormLabel fontSize="sm" fontWeight="semibold">
                Armazón {frameName ? `· ${frameName}` : ""}
              </FormLabel>
              <InputGroup>
                <Input
                  type="number"
                  name="discount_frame"
                  placeholder="0"
                  value={discountFrame || ""}
                  onChange={onChangeDiscountFrame}
                  borderColor={borderColor}
                  borderRadius="lg"
                />
                <InputRightElement pointerEvents="none" color="gray.400">%</InputRightElement>
              </InputGroup>
            </FormControl>

            <FormControl>
              <FormLabel fontSize="sm" fontWeight="semibold">
                Luna {lensName ? `· ${lensName}` : ""}
              </FormLabel>
              <InputGroup>
                <Input
                  type="number"
                  name="discount_lens"
                  placeholder="0"
                  value={discountLens || ""}
                  onChange={onChangeDiscountLens}
                  borderColor={borderColor}
                  borderRadius="lg"
                />
                <InputRightElement pointerEvents="none" color="gray.400">%</InputRightElement>
              </InputGroup>
            </FormControl>

            <Text fontSize="xs" color="gray.500">
              Deja en 0 o vacío si no aplica descuento.
            </Text>
          </VStack>
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

export default DiscountModal;
