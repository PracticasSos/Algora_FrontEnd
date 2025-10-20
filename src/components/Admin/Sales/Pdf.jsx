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
        .select("name, address")
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

  // ...existing code...
  const handleGeneratePdf = async () => {
    setGenerating(true);
    try {
      console.log("Datos recibidos en PDF:", formData);

      // comprobar términos (no bloquear; solo avisar si faltan)
      if (!formData?.termsAccepted) {
        toast({
          title: "Aviso",
          description: "No se confirmaron los términos; se generará el PDF de todas formas.",
          status: "warning",
          duration: 4000,
          isClosable: true,
        });
      }

      // aceptar id desde varias propiedades posibles
      const saleIdToUse = formData?.id || formData?.sale_id || formData?.saleId || null;
      if (!saleIdToUse) {
        console.warn("No se encontró el ID de la venta — se generará el PDF pero no se actualizará la URL en la BD.");
        toast({
          title: "Generando sin ID",
          description: "No se encontró el ID de la venta; el PDF se generará pero no se guardará la URL en la venta.",
          status: "info",
          duration: 4000,
          isClosable: true,
        });
      }

      // Obtener todos los datos necesarios
      const measureData = await fetchMeasureData(formData?.measure_id);
      const patientData = await fetchPatientData(formData?.patient_id);
      const branchData = await fetchBranchData(formData?.branchs_id);

      console.log("Datos obtenidos:", { measureData, patientData, branchData });

      // Guardar teléfono del paciente
      setPatientPhone(patientData?.pt_phone || formData?.pt_phone || "");

      // Generar y subir PDF
      const result = await generateContractPDF(formData, measureData, patientData, branchData);

      setPdfUrl(result.pdfUrl);
      setPdfGenerated(true);

      // Si tenemos saleId, actualizar la fila en la BD con la URL del PDF
      if (saleIdToUse && result?.pdfUrl) {
        try {
          const { error: updateError } = await supabase
            .from("sales")
            .update({ pdf_url: result.pdfUrl })
            .eq("id", saleIdToUse);
          if (updateError) {
            console.error("Error actualizando URL del PDF en sales:", updateError);
            toast({
              title: "Advertencia",
              description: "PDF generado pero no se pudo guardar la URL en la venta.",
              status: "warning",
              duration: 4000,
              isClosable: true,
            });
          }
        } catch (dbErr) {
          console.error("Error en la actualización de BD:", dbErr);
        }
      }

      // Llamar callback si existe
      if (onPdfUploaded) {
        onPdfUploaded(result);
      }

      toast({
        title: "¡PDF generado exitosamente!",
        description: "El contrato fue generado, subido y guardado (si se pudo) en la base de datos.",
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
// ...existing code...

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

    // Usar SIEMPRE el mensaje personalizado del MessageSection y reemplazar {{BRANCH}} por el nombre real de la sucursal
    let branchName = formData?.branch_name || "VEOPTICS";
    // Si viene de la consulta de branchs, usar ese nombre
    if (formData?.branchs_id && formData?.branchs_id !== "") {
      branchName = formData?.branch_name || branchName;
    }
    // Reemplazar {{BRANCH}} en el mensaje
    const customMessage = (formData?.message || "").replace(/{{BRANCH}}/g, branchName).trim();
    const fullMessage = `${customMessage}\n\n📄 *Contrato de Servicio:*\n${pdfUrl}`;
    const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(fullMessage)}`;
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