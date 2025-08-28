import { useState } from "react";
import { Box, Button, Spinner, Text, useToast } from "@chakra-ui/react";
import { generateContractPDF } from "./pdf/pdfGenerator.js";

const PdfLaboratory = ({ formData, targetRef, branchPhone, branchName }) => {
  const toast = useToast();
  const [generating, setGenerating] = useState(false);

  const handleGenerateOnly = async () => {
    setGenerating(true);

    try {
      // Crear objeto de datos para el PDF usando directamente formData
      const salesDataForPDF = {
        date: formData?.date || new Date().toLocaleDateString('es-ES'),
        order_number: formData?.id || Math.floor(Math.random() * 1000),
        frame_details: formData?.inventario?.brand || 'Sin especificar',
        lens_details: formData?.lens?.lens_type || 'Sin especificar',
        observations: formData?.observations || '-'
      };

      // Los datos ya vienen en formData, no necesitamos hacer fetch
      const result = await generateContractPDF(
        formData,           // formData 
        null,              // measureData - ya viene en formData
        null,              // patientData - ya viene en formData  
        null,              // branchData - ya viene en formData
        salesDataForPDF    // salesData
      );

      if (result.success) {
        toast({
          title: "✅ PDF Generado",
          description: "El documento fue creado y descargado exitosamente.",
          status: "success",
          duration: 3000,
          isClosable: true,
        });
      } else {
        throw new Error(result.message || "Error al generar el PDF");
      }

    } catch (error) {
      console.error("Error:", error);
      toast({
        title: "❌ Error",
        description: error.message || "Hubo un problema al generar el documento.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setGenerating(false);
    }
  };

  const handleGenerateAndSend = async () => {
    setGenerating(true);

    try {
      const salesDataForPDF = {
        date: formData?.date || new Date().toLocaleDateString('es-ES'),
        order_number: formData?.id || Math.floor(Math.random() * 1000),
        frame_details: formData?.inventario?.brand || 'Sin especificar',
        lens_details: formData?.lens?.lens_type || 'Sin especificar',
        observations: formData?.observations || '-'
      };

      const result = await generateContractPDF(
        formData,
        null,
        null, 
        null,
        salesDataForPDF
      );

      if (result.success) {
        // Mensaje para WhatsApp
        const message = `📋 *ORDEN DE LABORATORIO ÓPTICO*\n\n` +
          `🏪 *Sucursal:* ${branchName || 'SOS'}\n` +
          `📅 *Fecha:* ${salesDataForPDF.date}\n` +
          `📋 *Orden:* ${salesDataForPDF.order_number}\n\n` +
          `📄 *Documento:* ${result.fileName}\n\n` +
          `Descargar: ${result.pdfUrl}`;

        // Abrir WhatsApp
        if (branchPhone) {
          const cleanPhone = branchPhone.replace(/\D/g, "");
          const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
          window.open(whatsappUrl, "_blank");
        }

        toast({
          title: "✅ PDF Generado y Enviado",
          description: `Documento creado y ${branchPhone ? 'enviado por WhatsApp' : 'listo para descargar'}.`,
          status: "success",
          duration: 3000,
          isClosable: true,
        });

      } else {
        throw new Error(result.message || "Error al generar el PDF");
      }

    } catch (error) {
      console.error("Error:", error);
      toast({
        title: "❌ Error",
        description: error.message || "Hubo un problema al generar el documento.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setGenerating(false);
    }
  };

  return (
    <Box p={4}>
      <Box display="flex" gap={3} flexWrap="wrap">
        <Button 
          onClick={handleGenerateOnly} 
          isLoading={generating}
          colorScheme="blue"
          size="md"
        >
          📄 Generar PDF
        </Button>
        
        {branchPhone && (
          <Button 
            onClick={handleGenerateAndSend} 
            isLoading={generating}
            colorScheme="green"
            size="md"
          >
            📄📱 Generar y Enviar por WhatsApp
          </Button>
        )}
      </Box>
      
      {generating && (
        <Box mt={4} display="flex" alignItems="center">
          <Spinner size="sm" mr={2} color="blue.500" />
          <Text fontSize="sm" color="gray.600">
            Generando PDF, por favor espera...
          </Text>
        </Box>
      )}
    </Box>
  );
};
export default PdfLaboratory;