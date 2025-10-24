import { useState } from "react";
import { Box, Button, Spinner, Text, useToast } from "@chakra-ui/react";
import { generateContractPDF } from "./pdf/pdfGenerator.js";
import { supabase } from "../../../api/supabase"; // <-- 1. IMPORTAR SUPABASE

// --- ACEPTAR LAS NUEVAS PROPS: onSave y isSaving ---
const PdfLaboratory = ({
  formData,
  targetRef,
  branchPhone,
  branchName,
  onSave,
  isSaving,
}) => {
  const toast = useToast();
  const [generating, setGenerating] = useState(false);

  /**
   * Lógica centralizada para generar el PDF.
   * Esta será la función que pasaremos como "callback" a onSave.
   */
  const generatePdfLogic = async () => {
    const salesDataForPDF = {
      date: formData?.date || new Date().toLocaleDateString("es-ES"),
      order_number: formData?.id || Math.floor(Math.random() * 1000),
      frame_details: formData?.inventario?.brand || "Sin especificar",
      lens_details: formData?.lens?.lens_type || "Sin especificar",
      observations: formData?.observations || "-",
    };

    const result = await generateContractPDF(
      formData, // formData
      null, // measureData - ya viene en formData
      null, // patientData - ya viene en formData
      null, // branchData - ya viene en formData
      salesDataForPDF // salesData
    );

    if (!result.success) {
      throw new Error(result.message || "Error al generar el PDF");
    }

    return { result, salesDataForPDF };
  };

  /**
   * Manejador para el botón "Guardar y Generar PDF"
   */
  const handleSaveAndGenerate = async () => {
    // 1. Definimos la función de callback que SÓLO genera el PDF
    const pdfCallback = async (orderId) => { // <-- 2. RECIBIR EL orderId
      setGenerating(true);
      try {
        // 3. Capturar el resultado
        const { result } = await generatePdfLogic(); 
        
        // --- 4. AÑADIR EL UPDATE ---
        if (result.pdfUrl && orderId) {
          const { error } = await supabase
            .from('lab_orders')
            .update({ pdf_url: result.pdfUrl })
            .eq('id', orderId);
          if (error) {
             // Opcional: notificar si falla el guardado del link
             console.error("Error al guardar el link del PDF:", error);
          }
        }
        // --- FIN DEL UPDATE ---

        toast({
          title: "✅ PDF Generado",
          description: "El documento fue creado y descargado exitosamente.",
          status: "success",
          duration: 3000,
          isClosable: true,
        });
      } catch (error) {
        console.error("Error generando PDF:", error);
        toast({
          title: "❌ Error de PDF",
          description: error.message || "Hubo un problema al generar el documento.",
          status: "error",
          duration: 3000,
          isClosable: true,
        });
      } finally {
        setGenerating(false);
      }
    };

    // 5. Llamamos a onSave y le pasamos el callback
    await onSave(pdfCallback);
  };

  /**
   * Manejador para el botón "Guardar, Generar y Enviar"
   */
  const handleSaveAndSend = async () => {
    // 1. Definimos la función de callback que GENERA Y ENVÍA A WHATSAPP
    const pdfCallback = async (orderId) => { // <-- 2. RECIBIR EL orderId
      setGenerating(true);
      try {
        // Ejecutamos la lógica de PDF y capturamos los datos
        const { result, salesDataForPDF } = await generatePdfLogic();

        // --- 3. AÑADIR EL UPDATE ---
        if (result.pdfUrl && orderId) {
          const { error } = await supabase
            .from('lab_orders')
            .update({ pdf_url: result.pdfUrl })
            .eq('id', orderId);
           if (error) {
             console.error("Error al guardar el link del PDF:", error);
           }
        }
        // --- FIN DEL UPDATE ---

        // Lógica de WhatsApp
        const message =
          `📋 *ORDEN DE LABORATORIO ÓPTICO*\n\n` +
          `🏪 *Sucursal:* ${branchName || "SOS"}\n` +
          `📅 *Fecha:* ${salesDataForPDF.date}\n` +
          `📋 *Orden (Venta):* ${salesDataForPDF.order_number}\n\n` +
          `📄 *Documento:* ${result.fileName}\n\n` +
          `Descargar: ${result.pdfUrl}`;

        if (branchPhone) {
          const cleanPhone = branchPhone.replace(/\D/g, "");
          const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(
            message
          )}`;
          window.open(whatsappUrl, "_blank");
        }

        toast({
          title: "✅ PDF Generado y Listo para Enviar",
          description: `Documento creado y ${
            branchPhone ? "enviado a WhatsApp" : "listo para descargar"
          }.`,
          status: "success",
          duration: 3000,
          isClosable: true,
        });
      } catch (error) {
        console.error("Error generando/enviando PDF:", error);
        toast({
          title: "❌ Error de PDF/Envío",
          description: error.message || "Hubo un problema al generar o enviar.",
          status: "error",
          duration: 3000,
          isClosable: true,
        });
      } finally {
        setGenerating(false);
      }
    };

    // 4. Llamamos a onSave y le pasamos el callback
    await onSave(pdfCallback);
  };

  return (
    <Box p={4}>
      <Box display="flex" gap={3} flexWrap="wrap" justifyContent="center">
        <Button
          onClick={handleSaveAndGenerate}
          isLoading={isSaving || generating}
          loadingText={isSaving ? "Guardando..." : "Generando..."}
          colorScheme="blue"
          size="md"
        >
          Guardar y Generar PDF
        </Button>

        {/* BOTON POR SI EN UN FUTURO QUEREMOS MANDAR LA ORDEN DIRECTAMNETE */}

        {/* {branchPhone && (
          <Button
            onClick={handleSaveAndSend}
            isLoading={isSaving || generating}
            loadingText={isSaving ? "Guardando..." : "Generando..."}
            colorScheme="green"
            size="md"
          >
            Guardar, Generar y Enviar
          </Button>
        )} */}
      </Box>

      {(isSaving || generating) && (
        <Box mt={4} display="flex" alignItems="center" justifyContent="center">
          <Spinner size="sm" mr={2} color="blue.500" />
          <Text fontSize="sm" color="gray.600">
            {isSaving
              ? "Guardando orden en la base de datos..."
              : "Generando PDF, por favor espera..."}
          </Text>
        </Box>
      )}
    </Box>
  );
};
export default PdfLaboratory;