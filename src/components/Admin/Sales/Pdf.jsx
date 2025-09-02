import { useState } from "react";
import {
  Box,
  Button,
  useToast,
  Spinner,
  Text,
  VStack,
  HStack,
  Icon,
  useColorModeValue,
} from "@chakra-ui/react";
import { FaWhatsapp, FaDownload, FaCheck } from "react-icons/fa";
import { supabase } from "../../../api/supabase";
import { generateContractPDF } from "./pdf/pdfGenerator.js";

const Pdf = ({ formData, onPdfUploaded }) => {
  const toast = useToast();
  const [generating, setGenerating] = useState(false);
  const [pdfGenerated, setPdfGenerated] = useState(false);
  const [pdfUrl, setPdfUrl] = useState(null);
  const [patientPhone, setPatientPhone] = useState("");

  const boxBg = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  const fetchMeasureData = async (measureId) => {
    if (!measureId) return null;
    
    try {
      const { data, error } = await supabase
        .from("rx_final")
        .select("*")
        .eq("id", measureId)
        .single();
      
      if (error) {
        console.error("Error fetching measure data:", error);
        return null;
      }
      
      return data;
    } catch (error) {
      console.error("Error in fetchMeasureData:", error);
      return null;
    }
  };

  const fetchPatientData = async (patientId) => {
    if (!patientId) return null;
    
    try {
      const { data, error } = await supabase
        .from("patients")
        .select("pt_firstname, pt_lastname, pt_phone")
        .eq("id", patientId)
        .single();
      
      if (error) {
        console.error("Error fetching patient data:", error);
        return null;
      }
      
      return data;
    } catch (error) {
      console.error("Error in fetchPatientData:", error);
      return null;
    }
  };

  const fetchBranchData = async (branchId) => {
    if (!branchId) return null;
    
    try {
      const { data, error } = await supabase
        .from("branchs")
        .select("name")
        .eq("id", branchId)
        .single();
      
      if (error) {
        console.error("Error fetching branch data:", error);
        return null;
      }
      
      return data;
    } catch (error) {
      console.error("Error in fetchBranchData:", error);
      return null;
    }
  };

  const handleGeneratePdf = async () => {
    setGenerating(true);
    try {
      console.log("Datos recibidos en PDF:", formData);
      // Verificar términos aceptados
      if (!formData?.termsAccepted) {
        throw new Error('Debe aceptar los términos y condiciones antes de generar el PDF');
      }

      // Verificar que existe el ID de la venta
      if (!formData?.id) {
        throw new Error('No se encontró el ID de la venta para actualizar la URL del PDF');
      }

      // Obtener todos los datos necesarios
      const measureData = await fetchMeasureData(formData?.measure_id);
      const patientData = await fetchPatientData(formData?.patient_id);
      const branchData = await fetchBranchData(formData?.branchs_id);

      console.log("Datos obtenidos:", { measureData, patientData, branchData });

      // Guardar teléfono del paciente
      setPatientPhone(patientData?.pt_phone || formData?.pt_phone || "");

      // Generar, subir PDF y actualizar URL en BD
      const result = await generateContractPDF(formData, measureData, patientData, branchData);

      setPdfUrl(result.pdfUrl);
      setPdfGenerated(true);

      // Llamar callback si existe
      if (onPdfUploaded) {
        onPdfUploaded(result);
      }

      toast({
        title: "¡PDF generado exitosamente!",
        description: "El contrato fue generado, subido y guardado en la base de datos.",
        status: "success",
        duration: 4000,
        isClosable: true,
      });

    } catch (error) {
      console.error("Error generando PDF:", error);
      toast({
        title: "Error",
        description: error.message || "No se pudo generar el PDF.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setGenerating(false);
    }
  };

    const handleSendWhatsApp = () => {
    if (!pdfUrl || !patientPhone) {
      toast({
        title: "Error",
        description: pdfUrl ? "Falta el teléfono del paciente." : "No hay PDF generado.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    // Limpiar número de teléfono (solo números)
    const cleanPhone = patientPhone.replace(/\D/g, '');
    
    // Verificar que tenga al menos 10 dígitos
    if (cleanPhone.length < 10) {
      toast({
        title: "Teléfono inválido",
        description: "El número de teléfono debe tener al menos 10 dígitos.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    // USAR EL MENSAJE DESDE MessageSection (formData.message)
    const messageFromSection = formData?.message || "";
    
    // Si no hay mensaje personalizado, usar uno por defecto
    const fallbackMessage = "¡Hola! 👋 Muchas gracias por confiar en nosotros. Te adjuntamos el contrato de servicio.";
    
    // Usar el mensaje del MessageSection o el fallback si está vacío
    const customMessage = messageFromSection.trim() || fallbackMessage;
    
    // Crear mensaje completo para WhatsApp
    const fullMessage = `${customMessage}\n\n📄 *Contrato de Servicio:*\n${pdfUrl}`;
    
    // Crear URL de WhatsApp
    const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(fullMessage)}`;
    
    // Abrir WhatsApp
    window.open(whatsappUrl, '_blank');

    toast({
      title: "WhatsApp abierto ✅",
      description: "Se envió el mensaje personalizado del MessageSection.",
      status: "success",
      duration: 3000,
      isClosable: true,
    });
  };

  return (
    <Box 
      bg={boxBg} 
      border="1px solid" 
      borderColor={borderColor} 
      borderRadius="xl" 
      p={10}
      maxW="600px"
      mx="auto"
    >
      <VStack spacing={4}>
        {/* Botón Generar PDF */}
        <Button 
          onClick={handleGeneratePdf} 
          isLoading={generating}
          colorScheme="blue"
          size="lg"
          width="100%"
          leftIcon={<Icon as={pdfGenerated ? FaCheck : FaDownload} />}
          isDisabled={pdfGenerated}
        >
          {generating ? "Generando PDF..." : pdfGenerated ? "PDF Generado ✓" : "Generar PDF"}
        </Button>

        {/* Loading indicator */}
        {generating && (
          <HStack>
            <Spinner size="sm" color="blue.500" />
            <Text fontSize="sm" color="gray.600">
              Generando PDF y guardando en base de datos...
            </Text>
          </HStack>
        )}

        {/* Botón WhatsApp */}
        {pdfGenerated && pdfUrl && (
          <Button
            onClick={handleSendWhatsApp}
            colorScheme="green"
            size="lg"
            width="100%"
            leftIcon={<Icon as={FaWhatsapp} />}
          >
            Enviar por WhatsApp
          </Button>
        )}

        {/* Info del teléfono */}
        {pdfGenerated && patientPhone && (
          <Text fontSize="sm" color="gray.600" textAlign="center">
            📱 Enviar a: {patientPhone}
          </Text>
        )}

        {/* URL guardada en BD */}
        {pdfGenerated && pdfUrl && (
          <Box 
            p={3} 
            bg="green.50" 
            borderRadius="md" 
            width="100%"
            border="1px solid"
            borderColor="green.200"
          >
            <Text fontSize="xs" color="green.700" wordBreak="break-all">
              ✅ PDF guardado en BD: {pdfUrl}
            </Text>
          </Box>
        )}
      </VStack>
    </Box>
  );
};

export default Pdf;