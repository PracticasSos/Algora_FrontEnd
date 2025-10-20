import React, { useState, useEffect, useRef } from "react";
import SearchHistory from "./SearchHistory";
import MeasuresHistory from "./MeausresHistory";
import { supabase } from "../../../../api/supabase";
import { Box, Heading, Button, Text, Grid, useColorModeValue } from "@chakra-ui/react";
import TotalHistory from "./TotalHistory";
import Pdf from "../Pdf";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import SignaturePadComponent from "../SignaturePadComponent";
import { useToast } from "@chakra-ui/react";
import DetailsHistory from "./DetailsHistory";
import HistoryUI from "./HistoryUI";
import Delivery from "../Delivery";
import MessageSection from "../MenssageSection";
import ObservationSection from "../ObservationSection";
import TermsCondition from "../TermsCondition";
import SmartHeader from "../../../header/SmartHeader";

const SalesHistory = () => {
  const [deliveryDays, setDeliveryDays] = useState(0);
  const [saleId, setSaleId] = useState(null);
  const [branchName, setBranchName] = useState("");
  const [patientData, setPatientData] = useState(null);
  const salesRef = useRef(null);
  const hasFetchedPatient = useRef(false);
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  const { patientId, saleId: saleParamId } = useParams();
  const isEditing = Boolean(saleParamId);
  const currentUser = typeof window !== "undefined" ? JSON.parse(localStorage.getItem("user") || "null") : null;
  const isAdmin = currentUser?.role_id === 1;
    // Nuevo estado para controlar las páginas
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 8; 

  const [saleData, setSaleData] = useState({
    patient_id: "",
    branchs_id: "",
    date: "",
    pt_phone: "",
    brand_id: "", 
    lens_id: "", 
    delivery_time: "",
    delivery_datetime: "",
    p_frame: 0,
    p_lens: 0,
  });
  const [totals, setTotals] = useState({
      frameName: "",
      lensName: "",
      total_p_frame: "",
      total_p_lens: "",
    });
  const [formData, setFormData] = useState({
    p_frame: 0,
    p_lens: 0,
    discount_frame: 0,
    discount_lens: 0,
    total_p_frame: 0,
    total_p_lens: 0,
    total: 0,
    credit: 0,
    balance: 0,
    payment_in: 0,
    message: "",
    measure_id: "",
    signature: ""
  });

  useEffect(() => {
    if (saleData?.patient_id && !hasFetchedPatient.current) {
      fetchPatient(saleData.patient_id);
      hasFetchedPatient.current = true;
    }
  }, [saleData.patient_id]);  
  

  // Función para navegar entre pasos
  const nextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const goToStep = (step) => {
    setCurrentStep(step);
  };

  const fetchPatient = async (patientId) => {
    if (!patientId) return;
  
    try {
      const { data, error } = await supabase
        .from("patients")
        .select("*")
        .eq("id", patientId)
        .single();
  
      if (error) {
        console.error("Error al obtener datos del paciente:", error);
        return;
      }
      setPatientData((prevData) => {
        if (JSON.stringify(prevData) !== JSON.stringify(data)) {
          return data;
        }
        return prevData;
      });
    } catch (err) {
      console.error("Error al obtener datos del paciente:", err);
    }
  };

  const handleFormDataChange = (newFormData) => {
    setFormData((prevFormData) => ({
      ...prevFormData,
      ...newFormData,
    }));

    const saleDataUpdates = {};

    if (newFormData.brand_id !== undefined) {
      saleDataUpdates.brand_id = newFormData.brand_id;
    }

    if (newFormData.lens_id !== undefined) {
      saleDataUpdates.lens_id = newFormData.lens_id;
    }

    if (Object.keys(saleDataUpdates).length > 0) {
      setSaleData((prevSaleData) => ({
        ...prevSaleData,
        ...saleDataUpdates,
      }));
    }
  };

  useEffect(() => {
    if (saleParamId && !saleId) {
      fetchSaleData(saleParamId);
    } else if (saleData.sale_id && !saleId) {
      fetchSaleData(saleData.sale_id);
    }
  }, [saleParamId, saleData.sale_id, saleId]); 
  


  const fetchSaleData = async (id) => {
    try {
      const { data, error } = await supabase
        .from("sales")
        .select("*")
        .eq("id", id)
        .single();
  
      if (error) throw error;

      setFormData({
        ...formData,
        p_frame: data.p_frame,
        p_lens: data.p_lens,
        discount_frame: data.discount_frame,
        discount_lens: data.discount_lens,
        total_p_frame: data.total_p_frame,
        total_p_lens: data.total_p_lens,
        total: data.total,
        credit: data.credit,
        balance: data.balance,
        payment_in: data.payment_in,
        message: data.message,
        measure_id: data.measure_id,
        signature: data.signature
      });
  
      setSaleData({
        ...saleData,
        patient_id: data.patient_id,
        branchs_id: data.branchs_id,
        date: data.date,
        pt_phone: "", 
        brand_id: data.inventario_id,
        lens_id: data.lens_id,
        delivery_time: data.delivery_time
      });
  
      setSaleId(id);
    } catch (err) {
      console.error("Error cargando venta existente:", err);
    }
  };

  useEffect(() => {
    const fetchBranchName = async () => {
        if (!saleData.branchs_id) return;
        
        const { data, error } = await supabase
            .from("branchs")
            .select("name")
            .eq("id", saleData.branchs_id)
            .single();
        
        if (error) {
            console.error("Error obteniendo nombre de sucursal:", error);
            return;
        }

        setBranchName(data?.name || "VEOPTICS");
    };

    fetchBranchName();
  }, [saleData.branchs_id]);
  
  useEffect(() => {
    if (saleData?.measure_id) {
      fetchMeasureById(saleData.measure_id);
    }
  }, [saleData.measure_id]);
  

  const fetchMeasureById = async (measureId) => {
    try {
      const { data, error } = await supabase
        .from("rx_final")
        .select("*")
        .eq("id", measureId)
        .single();
  
      if (error) throw error;
  
      setSelectedMeasure(data);
    } catch (err) {
      console.error("Error obteniendo medida clínica:", err);
    }
  };
  

    const handlePatientDataChange = (updatedData) => {
        setSaleData((prevData) => ({
            ...prevData,
            ...updatedData,
        }));
        if (updatedData.patient_id) {
            fetchPatient(updatedData.patient_id);
        }
    };
  
  const handleDateChange = (e) => {
    const selectedDate = new Date(e.target.value);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const differenceInTime = selectedDate.getTime() - today.getTime();
    let differenceInDays = Math.ceil(differenceInTime / (1000 * 3600 * 24));

    if (differenceInDays > 0) {
      differenceInDays += 1;
    }
    setDeliveryDays(differenceInDays);
    setSaleData((prev) => ({
      ...prev,
      delivery_time: differenceInDays,
    }));
  };

  const handleSubmit = async () => {
    if (!isAdmin) {
      toast({
        title: "Acceso denegado",
        description: "Solo administradores pueden editar ventas.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
      return;
    }
    const signatureDataUrl = formData.signature;

    if (!signatureDataUrl) {
        console.error("La firma no ha sido proporcionada.");
        return;
    }

    const nuevoBrandId = formData.brand_id;
    const originalBrandId = saleData.brand_id;

    if (nuevoBrandId && nuevoBrandId !== originalBrandId) {
        const { data: oldFrame, error: oldError } = await supabase
            .from("inventario")
            .select("quantity")
            .eq("id", originalBrandId)
            .single();

        if (!oldError && oldFrame) {
            await supabase
                .from("inventario")
                .update({ quantity: oldFrame.quantity + 1 })
                .eq("id", originalBrandId);
        }
        const { data: newFrame, error: newError } = await supabase
            .from("inventario")
            .select("quantity")
            .eq("id", nuevoBrandId)
            .single();

        if (newError || !newFrame) {
            console.error("Error obteniendo cantidad del nuevo armazón:", newError);
            return;
        }

        if (newFrame.quantity > 0) {
            const { error: updateError } = await supabase
                .from("inventario")
                .update({ quantity: newFrame.quantity - 1 })
                .eq("id", nuevoBrandId);

            if (updateError) {
                console.error("Error actualizando cantidad del nuevo armazón:", updateError);
                return;
            }
        } else {
            console.log("No hay suficiente stock para el nuevo armazón.");
            return;
        }
    }

    const saleDataToSave = {
        date: saleData.date,
        delivery_time: saleData.delivery_time,
        p_frame: isNaN(parseFloat(formData.p_frame)) ? 0 : parseFloat(formData.p_frame),
        p_lens: isNaN(parseFloat(formData.p_lens)) ? 0 : parseFloat(formData.p_lens),
        price: isNaN(parseFloat(formData.total)) ? 0 : parseFloat(formData.total),
        total: isNaN(parseFloat(formData.total)) ? 0 : parseFloat(formData.total),
        credit: isNaN(parseFloat(formData.credit)) ? 0 : parseFloat(formData.credit),
        balance: isNaN(parseFloat(formData.balance)) ? 0 : parseFloat(formData.balance),
        payment_in: formData.payment_in,
        patient_id: saleData.patient_id || null,
        lens_id: saleData.lens_id || null,
        branchs_id: saleData.branchs_id || null,
        total_p_frame: isNaN(parseFloat(formData.total_p_frame)) ? 0 : parseFloat(formData.total_p_frame),
        total_p_lens: isNaN(parseFloat(formData.total_p_lens)) ? 0 : parseFloat(formData.total_p_lens),
        discount_frame: isNaN(parseFloat(formData.discount_frame)) ? 0 : parseFloat(formData.discount_frame),
        discount_lens: isNaN(parseFloat(formData.discount_lens)) ? 0 : parseFloat(formData.discount_lens),
        inventario_id: saleData.brand_id || null,
        measure_id: formData.measure_id || null,
    };

    try {
        if (saleId) {
            const { error } = await supabase
                .from("sales")
                .update(saleDataToSave)
                .eq("id", saleId);

            if (error) throw error;

            toast({
                title: "Venta actualizada con éxito.",
                description: "La venta ha sido actualizada correctamente.",
                status: "success",
                duration: 5000,
                isClosable: true,
            });
        } else {
            console.error("No se encontró un ID de venta para actualizar.");
        }
    } catch (err) {
        console.error("Error al actualizar la venta:", err);
    }
};

  const pdfData = {
    ...saleData,
    ...formData,
    sale_id: saleId,
    sale_id: saleParamId || saleId,
  };

  const handleGeneratePdf = async () => {
    const saleIdToUse = formData?.sale_id || props?.saleParamId || null;
    if (!saleIdToUse) {
      console.error("No se encontró el ID de la venta para actualizar la URL del PDF");
      // mostrar toast o feedback al usuario en vez de seguir
      return;
    }
  };


  const handleSaveSignature = (signatureDataUrl) => {
    setFormData((prev) => ({
      ...prev,
      signature: signatureDataUrl,
    }));
  };

  const handleTotalsChange = (totals) => {
  setTotals(totals);
  setFormData((prev) => ({
    ...prev,
    total_p_frame: Number(totals.total_p_frame ?? prev.p_frame ?? 0),
    total_p_lens: Number(totals.total_p_lens ?? prev.p_lens ?? 0),
  }));
  };


  const moduleSpecificButton = null;

  // Función para renderizar contenido por paso
  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <Box>
            <SearchHistory onFormDataChange={handlePatientDataChange} initialFormData={{ ...formData, ...saleData, sale_id: saleParamId || saleId }} />
            <MeasuresHistory onFormDataChange={handlePatientDataChange} initialFormData={{...formData, ...saleData} }  saleId={saleParamId || saleId} />
          </Box>
        );
      case 2:
        return (
          <Box  >
            <Box >
              <DetailsHistory  isEditable={isAdmin} onFormDataChange={handleFormDataChange} onTotalsChange={handleTotalsChange} initialFormData={{...formData, ...saleData} } saleId={saleParamId || saleId} />
            </Box>
          </Box>
        );
      case 3:
        return (
          <Box >
            <Box >
              <HistoryUI  isEditable={isAdmin} frameName={formData.frameName} lensName={formData.lensName} total_p_frame={totals.total_p_frame} total_p_lens={totals.total_p_lens} initialFormData={formData} onFormDataChange={handleFormDataChange} />
            </Box>
          </Box>
        );
      case 4:
        return (
          <Box >
            <Box>
              <TotalHistory isEditable={isAdmin} saleId={saleId} formData={formData} setFormData={setFormData} />
            </Box>
          </Box>
        );
      case 5:
        return (
          <Box >
            <Box height="380px" >
              <Delivery isEditable={isAdmin} saleData={saleData} setSaleData={setSaleData} />
            </Box>
          </Box>
        );
      case 6:
        return (
          <Box mt={8}>
            <Box height="350px">
              <MessageSection selectedBranch={branchName} formData={formData} setFormData={setFormData} />
            </Box>
          </Box>
        );
      case 7:
        return (
          <Box mt={8}>
            <Box height="350px">
              <ObservationSection isEditable={isAdmin} setFormData={setFormData} />
            </Box>
          </Box>
        );
      case 8:
        return (
          <Box >
            <Box >
              <TermsCondition selectedBranch={branchName} formData={formData} setFormData={setFormData} />
              <SignaturePadComponent onSave={(signatureDataUrl) => setFormData((prev) => ({ ...prev, signature: signatureDataUrl }))} />
            </Box>
          </Box>
        );
        default:
        return null;
    }
  };

  return (
    <Box ref={salesRef} w="full" px={[0, 2, 4]} bg={useColorModeValue("gray.50", "gray.900")} >
      <Box
        className="sales-form"
        display="flex"
        flexDirection="column"
        alignItems="center"
        p={[2, 4, 8]}
        mx="auto"
        bg={useColorModeValue("gray.50", "gray.900")}
      >
        <SmartHeader moduleSpecificButton={moduleSpecificButton} />

        {/* Heading alineado a la izquierda */}
        <Box w="90%" mb={4}>
          <Heading
            textAlign="left"
            size="lg"
            fontWeight="extrabold"
            color={useColorModeValue("teal.700", "teal.200")}
            borderBottom="3px solid"
            borderColor={useColorModeValue("teal.300", "teal.600")}
            pb={2}
            letterSpacing="wide"
          >
            Contrato de Servicio
          </Heading>
        </Box>

        {/* Indicador de pasos */}
        <Box mb={8} w="100%" maxW="700px">
          <Grid
            templateColumns={`repeat(${totalSteps}, 1fr)`}
            gap={2}
            alignItems="center"
            justifyContent="center"
          >
            {Array.from({ length: totalSteps }, (_, i) => i + 1).map((step) => (
              <Button
                key={step}
                size="sm"
                colorScheme={currentStep === step ? "teal" : "gray"}
                variant={currentStep === step ? "solid" : "outline"}
                onClick={() => goToStep(step)}
                borderRadius="full"
                fontWeight="bold"
                boxShadow={currentStep === step ? "md" : "none"}
                transition="all 0.2s"
                _hover={{
                  transform: "scale(1.08)",
                  boxShadow: "lg",
                }}
              >
                {step}
              </Button>
            ))}
          </Grid>
          <Box mt={2} textAlign="center">
            <Text fontSize="sm" color="white">
              Paso {currentStep} de {totalSteps}
            </Text>
          </Box>
        </Box>

        {/* Contenido del paso actual */}
        <Box w="100%"   transition="all 0.3s">
          {renderStepContent()}
        </Box>

        {/* Botones de navegación */}
        <Box
          mt={8}
          display="flex"
          justifyContent="space-between"
          width="100%"
          maxWidth="400px"
          gap={4}
        >
          <Button
            onClick={prevStep}
            isDisabled={currentStep === 1}
            colorScheme="gray"
            variant="outline"
            leftIcon={<span style={{ fontWeight: "bold" }}>←</span>}
            _hover={{ bg: useColorModeValue("gray.100", "gray.700") }}
          >
            Anterior
          </Button>
          {currentStep === totalSteps ? (
            <Button
              colorScheme="teal"
              onClick={handleSubmit}
              fontWeight="bold"
              px={8}
              boxShadow="md"
              _hover={{ bg: isAdmin ? "teal.600" : undefined }}
              isDisabled={!isAdmin}
            >
              Actualizar Venta
              {isAdmin ? "Actualizar Venta" : "Solo visualización"}
            </Button>
          ) : (
            <Button
              onClick={nextStep}
              colorScheme="teal"
              fontWeight="bold"
              px={8}
              rightIcon={<span style={{ fontWeight: "bold" }}>→</span>}
              boxShadow="md"
              _hover={{ bg: "teal.600" }}
            >
              Siguiente
            </Button>
          )}
        </Box>

        {saleId && (
          <Box mt={10} w="100%" >
            <Pdf formData={pdfData} targetRef={salesRef} />
          </Box>
        )}
        {(saleParamId || saleId) && (
          <Box mt={10} w="100%" >
            <Pdf formData={pdfData} targetRef={salesRef} />
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default SalesHistory;
