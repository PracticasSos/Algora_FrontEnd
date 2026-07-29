import { useEffect, useState } from "react";
import {
  Box,
  Button,
  SimpleGrid,
  useToast,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  useDisclosure,
  Text,
  Flex,
  Spinner,
} from "@chakra-ui/react";
import { generateCertificatePDF } from "./certificate/pdf/pdfGenerator";
import { supabase } from "../../api/supabase";
import CertificatePreviewModal from "./CertificatePreviewModal";


const PdfMeasures = ({ formData, selectedPatient, doctorData, tenantId, doctorSeal, doctorName, doctorCi, doctorSenescyt, footerInfo }) => {
  const [logoBase64, setLogoBase64] = useState(null);
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [modalMessage, setModalMessage] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [pdfUrl, setPdfUrl] = useState(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  useEffect(() => {
    if (!tenantId) return;
    const fetchLogo = async () => {
      const { data, error } = await supabase
        .from('logos')
        .select('logo_url')
        .eq('tenant_id', tenantId)
        .single();
      if (error) {
        console.error('Error al obtener el logo:', error);
        return;
      }
      const convertImageToBase64 = async (imageUrl) => {
        try {
          const response = await fetch(imageUrl, { mode: 'cors' });
          const blob = await response.blob();
          return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.readAsDataURL(blob);
          });
        } catch (error) {
          console.error('Error al convertir la imagen a base64:', error);
          return null;
        }
      };
      const base64Image = await convertImageToBase64(data.logo_url);
      if (base64Image) {
        setLogoBase64(base64Image);
      }
    };
    fetchLogo();
  }, [tenantId]);

  const handleDownloadPdf = async () => {
    if (!formData || !selectedPatient) {
      toast({
        title: "Error",
        description: "Faltan datos del formulario o paciente seleccionado.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return null;
    }

    setLoading(true);
    setIsGenerating(true);
    setModalMessage("Generando certificado de agudeza visual...");
    onOpen();

    try {
      const result = await generateCertificatePDF(
        { ...formData, doctor_name: doctorName, doctor_ci: doctorCi, doctor_senescyt: doctorSenescyt },
        selectedPatient,
        doctorData,
        logoBase64,
        doctorSeal,
        footerInfo
      );

      if (result.success) {
        setPdfUrl(result.pdfUrl);
        setModalMessage("✅ Se generó correctamente el certificado de agudeza visual.");
        
        toast({
          title: "Certificado generado",
          description: result.message,
          status: "success",
          duration: 3000,
          isClosable: true,
        });

        return result.pdfUrl;
      } else {
        throw new Error(result.message);
      }

    } catch (error) {
      console.error("Error al generar PDF:", error);
      
      setModalMessage("❌ Error al generar el certificado.");
      
      toast({
        title: "Error",
        description: error.message || "No se pudo generar el certificado PDF.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
      
      return null;
    } finally {
      setLoading(false);
      setIsGenerating(false);
    }
  };

  const sendWhatsAppMessage = async () => {
    const patient = selectedPatient;

    if (!patient?.pt_phone) {
      toast({
        title: "Error",
        description: "No hay número de teléfono del paciente.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    let currentPdfUrl = pdfUrl;
    
    if (!currentPdfUrl) {
      setModalMessage("Generando certificado para envío por WhatsApp...");
      onOpen();
      currentPdfUrl = await handleDownloadPdf();
      if (!currentPdfUrl) return;
    }

    const message = formData.message || "Aquí tienes tu certificado de agudeza visual.";
    const phoneNumber = patient.pt_phone.replace(/\D/g, "");

    if (phoneNumber.length < 8) {
      toast({
        title: "Error",
        description: "Número de teléfono inválido.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(
      `${message}\n\nPuedes descargar tu certificado de agudeza visual aquí: ${currentPdfUrl}`
    )}`;
    
    window.open(whatsappUrl, "_blank");

    setModalMessage("✅ El certificado ha sido enviado por WhatsApp.");
    
    toast({
      title: "WhatsApp abierto",
      description: "Se abrió WhatsApp con el mensaje y el enlace del certificado.",
      status: "success",
      duration: 3000,
      isClosable: true,
    });
  };

  const handlePreviewCertificate = () => {
    if (!formData || !selectedPatient) {
      toast({
        title: "Error",
        description: "Faltan datos del formulario o paciente seleccionado.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    setIsPreviewOpen(true);
  };

  const handleConfirmGenerateFromPreview = async () => {
    const url = await handleDownloadPdf();
    if (url) setIsPreviewOpen(false);
  };

  return (
    <>
      <SimpleGrid>
        <Box p={5}>
          <Flex gap={3} wrap="wrap">
            <Button
              onClick={handlePreviewCertificate}
              variant="outline"
              colorScheme="teal"
              size="md"
            >
              Vista previa
            </Button>

            <Button 
              onClick={handleDownloadPdf} 
              colorScheme="blue"
              isLoading={loading}
              loadingText="Generando..."
              size="md"
            >
              Generar Certificado
            </Button>
            
            <Button 
              onClick={sendWhatsAppMessage} 
              colorScheme="green"
              isLoading={loading}
              loadingText="Enviando..."
              size="md"
            >
              Enviar por WhatsApp
            </Button>
          </Flex>
        </Box>
      </SimpleGrid>

      {/* Modal de estado */}
      <Modal isOpen={isOpen} onClose={onClose} isCentered>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            {isGenerating ? "Generando certificado..." : "Certificado de Agudeza Visual"}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {isGenerating ? (
              <Flex align="center" justify="center" py={8} direction="column">
                <Spinner size="xl" thickness="4px" color="teal.500" />
                <Text mt={4} textAlign="center" color="gray.600">
                  Por favor espera mientras se genera tu certificado...
                </Text>
              </Flex>
            ) : (
              <Box py={4}>
                <Text fontSize="md">{modalMessage}</Text>
                {pdfUrl && (
                  <Box mt={4} p={3} bg="gray.50" borderRadius="md">
                    <Text fontSize="sm" color="gray.600">
                      URL del certificado:
                    </Text>
                    <Text 
                      fontSize="xs" 
                      color="blue.500" 
                      wordBreak="break-all"
                      mt={1}
                    >
                      {pdfUrl}
                    </Text>
                  </Box>
                )}
              </Box>
            )}
          </ModalBody>
          {!isGenerating && (
            <ModalFooter>
              <Button colorScheme="teal" onClick={onClose}>
                Cerrar
              </Button>
            </ModalFooter>
          )}
        </ModalContent>
      </Modal>

      <CertificatePreviewModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        formData={{ ...formData, doctor_name: doctorName, doctor_ci: doctorCi, doctor_senescyt: doctorSenescyt }}
        selectedPatient={selectedPatient}
        logoBase64={logoBase64}
        doctorSeal={doctorSeal}
        onConfirmGenerate={handleConfirmGenerateFromPreview}
        isGenerating={loading}
      />
    </>
  );
};

export default PdfMeasures;