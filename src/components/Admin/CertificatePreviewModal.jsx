import { useMemo } from "react";
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  Button,
  Box,
  useColorModeValue,
} from "@chakra-ui/react";
import { buildCertificateHtml } from "./certificate/pdf/pdfGenerator";

const CertificatePreviewModal = ({
  isOpen,
  onClose,
  formData,
  selectedPatient,
  logoBase64,
  doctorSeal,
  onConfirmGenerate,
  isGenerating,
}) => {
  const bgColor = useColorModeValue("white", "gray.800");

  const html = useMemo(() => {
    if (!isOpen) return "";
    return buildCertificateHtml(formData, selectedPatient, null, logoBase64, doctorSeal);
  }, [isOpen, formData, selectedPatient, logoBase64, doctorSeal]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} size={{ base: "full", md: "4xl" }} isCentered>
      <ModalOverlay />
      <ModalContent bg={bgColor} borderRadius={{ base: 0, md: "20px" }} h={{ base: "100%", md: "90vh" }}>
        <ModalHeader fontSize="md">Vista previa del certificado</ModalHeader>
        <ModalCloseButton />
        <ModalBody p={0} overflow="hidden">
          <Box as="iframe" srcDoc={html} w="100%" h="100%" border="none" bg="white" />
        </ModalBody>
        <ModalFooter gap={3}>
          <Button variant="ghost" onClick={onClose}>Seguir editando</Button>
          <Button
            bg="#00A88E"
            color="white"
            _hover={{ bg: "#00967f" }}
            onClick={onConfirmGenerate}
            isLoading={isGenerating}
          >
            Generar y descargar
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default CertificatePreviewModal;
