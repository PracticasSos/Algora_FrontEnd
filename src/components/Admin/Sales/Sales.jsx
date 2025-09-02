import React, { useState, useEffect, useRef } from "react";
import SearchPatient from "./SearchPatient";
import Measures from "./Measures";
import { supabase } from "../../../api/supabase";
import { Box, Heading, Button, Text, Grid, useColorModeValue  } from "@chakra-ui/react";
import Total from "./Total";
import Pdf from "./Pdf";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import SignaturePadComponent from "./SignaturePadComponent";
import { useToast } from "@chakra-ui/react";
import Delivery from "./Delivery";
import SalesDetails from "./SalesDetails";
import TotalUI from "./TotalUI";
import MessageSection from "./MenssageSection";
import ObservationSection from "./ObservationSection";
import TermsCondition from "./TermsCondition";
import SmartHeader from "../../header/SmartHeader";


const Sales = () => {
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
    payment_in: "",
    message: "",
    measure_id: "",
    signature: "",
    termsAccepted: false
  });
  const [patientMeasures, setPatientMeasures] = useState([]);
  const [filteredMeasures, setFilteredMeasures] = useState([]);
  const [saleRegistered, setSaleRegistered] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [saleId, setSaleId] = useState(null);
  const [pdfGenerated, setPdfGenerated] = useState(false);
  const navigate = useNavigate();
  const salesRef = useRef(null);
  const [branchName, setBranchName] = useState("");
  const { id } = useParams();
  const toast = useToast();
  // Nuevo estado para controlar las páginas
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 8; 

  const handleFormDataChange = (newFormData) => {
    setFormData((prevFormData) => {
      // Solo actualiza si los valores realmente cambian
      const updated = { ...prevFormData, ...newFormData };
      if (JSON.stringify(updated) !== JSON.stringify(prevFormData)) {
        // Si el cambio incluye termsAccepted, actualiza ese campo
        if ('termsAccepted' in newFormData) {
          updated.termsAccepted = newFormData.termsAccepted;
        }
        return updated;
      }
      return prevFormData;
    });

    // Extraer solo las claves relevantes para saleData
    const saleDataKeys = ["brand_id", "lens_id"];
    const saleDataUpdates = {};

    saleDataKeys.forEach((key) => {
      if (key in newFormData) {
        saleDataUpdates[key] = newFormData[key];
      }
    });

    if (Object.keys(saleDataUpdates).length > 0) {
      setSaleData((prevSaleData) => {
        const updatedSale = { ...prevSaleData, ...saleDataUpdates };
        if (JSON.stringify(updatedSale) !== JSON.stringify(prevSaleData)) {
          return updatedSale;
        }
        return prevSaleData;
      });
    }
  };

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

 useEffect(() => {
    if (id) {
      setSaleData((prev) => ({
        ...prev,
        patient_id: id,
      }));
      
      // Cargar las medidas del paciente cuando se recibe el ID por parámetro
      if (patientMeasures.length > 0) {
        const patientLatestMeasures = patientMeasures.filter(
          (measure) => measure.patient_id === id
        );
        setFilteredMeasures(patientLatestMeasures);

        if (patientLatestMeasures.length > 0) {
          const latestMeasure = patientLatestMeasures[0];
          setFormData((prevFormData) => ({
            ...prevFormData,
            measure_id: latestMeasure.id,
          }));
        }
      }
    }
  }, [id, patientMeasures]);
// ...existing code...


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
    fetchLatestRxFinal();
  }, []);

  const fetchLatestRxFinal = async () => {
    try {
      const { data, error } = await supabase
        .from("rx_final")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      const latestMeasuresByPatient = {};
      data.forEach((measure) => {
        if (
          !latestMeasuresByPatient[measure.patient_id] ||
          new Date(measure.created_at) >
            new Date(latestMeasuresByPatient[measure.patient_id].created_at)
        ) {
          latestMeasuresByPatient[measure.patient_id] = measure;
        }
      });

      const latestMeasuresArray = Object.values(latestMeasuresByPatient);
      setPatientMeasures(latestMeasuresArray || []);
    } catch (err) {
      console.error("Error fetching latest rx_final:", err);
    }
  };

  const handlePatientDataChange = (formData) => {
    setSaleData((prevData) => {
      const updatedData = {
        ...prevData,
        patient_id: formData.patient_id,
        branchs_id: formData.branchs_id,
        date: formData.date,
        pt_phone: formData.pt_phone,
        brand_id: formData.brand || prevData.brand_id,
        lens_id: formData.lens_type || prevData.lens_id,
      };
      return updatedData;
    });

    if (formData.patient_id) {
      const patientLatestMeasures = patientMeasures.filter(
        (measure) => measure.patient_id === formData.patient_id
      );
      setFilteredMeasures(patientLatestMeasures);

      if (patientLatestMeasures.length > 0) {
        const latestMeasure = patientLatestMeasures[0];
        setFormData((prevFormData) => ({
          ...prevFormData,
          measure_id: latestMeasure.id,
        }));
      }
    }
  };
  

    // mergedFormData disponible en todo el componente
  const mergedFormData = {
    ...formData,
    branchs_id: formData.branchs_id && formData.branchs_id !== "" ? formData.branchs_id : saleData.branchs_id,
    patient_id: formData.patient_id && formData.patient_id !== "" ? formData.patient_id : saleData.patient_id,
    brand_id: formData.brand_id && formData.brand_id !== "" ? formData.brand_id : saleData.brand_id,
    lens_id: formData.lens_id && formData.lens_id !== "" ? formData.lens_id : saleData.lens_id,
    date: formData.date && formData.date !== "" ? formData.date : saleData.date,
    delivery_time: formData.delivery_time && formData.delivery_time !== "" ? formData.delivery_time : saleData.delivery_time,
    delivery_datetime: formData.delivery_datetime && formData.delivery_datetime !== "" ? formData.delivery_datetime : saleData.delivery_datetime,
    balance: (formData.balance !== undefined && formData.balance !== "") ? formData.balance : saleData.balance,
    credit: (formData.credit !== undefined && formData.credit !== "") ? formData.credit : saleData.credit,
    payment_in: formData.payment_in && formData.payment_in !== "" ? formData.payment_in : saleData.payment_in,
    measure_id: formData.measure_id && formData.measure_id !== "" ? formData.measure_id : saleData.measure_id,
  };
  const handleSubmit = async () => {
  if (isSubmitting) return;
  setIsSubmitting(true);


  if (!mergedFormData.payment_in) {
    toast({
      title: "Error",
      description: "Por favor, seleccione un método de pago.",
      status: "error",
      duration: 5000,
      isClosable: true,
    });
    setIsSubmitting(false);
    return;
  }
  if (!mergedFormData.branchs_id) {
    toast({
      title: "Error",
      description: "Por favor, seleccione una sucursal.",
      status: "error",
      duration: 5000,
      isClosable: true,
    });
    setIsSubmitting(false);
    return;
  }
  const signatureDataUrl = mergedFormData.signature;
  if (!signatureDataUrl) {
    console.error("La firma no ha sido proporcionada.");
    setIsSubmitting(false);
    return;
  }

  if (mergedFormData.brand_id) {
    const { data: frame, error } = await supabase
      .from("inventario")
      .select("quantity")
      .eq("id", mergedFormData.brand_id)
      .single();
    if (error || !frame) {
      console.error("Error obteniendo cantidad:", error);
      setIsSubmitting(false);
      return;
    }
    if (frame.quantity > 0) {
      const { error: updateError } = await supabase
        .from("inventario")
        .update({ quantity: frame.quantity - 1 })
        .eq("id", mergedFormData.brand_id);
      if (updateError) {
        console.error("Error actualizando cantidad:", updateError);
      }
    } else {
      console.log("No hay suficiente cantidad para el armazón seleccionado.");
      setIsSubmitting(false);
      return;
    }
  }

  const saleDataToSave = {
    date: mergedFormData.date,
    delivery_time: mergedFormData.delivery_time,
    delivery_datetime: mergedFormData.delivery_datetime,
    p_frame: isNaN(parseFloat(mergedFormData.p_frame)) ? 0 : parseFloat(mergedFormData.p_frame),
    p_lens: isNaN(parseFloat(mergedFormData.p_lens)) ? 0 : parseFloat(mergedFormData.p_lens),
    price: isNaN(parseFloat(mergedFormData.total)) ? 0 : parseFloat(mergedFormData.total),
    total: isNaN(parseFloat(mergedFormData.total)) ? 0 : parseFloat(mergedFormData.total),
    credit: isNaN(parseFloat(mergedFormData.credit)) ? 0 : parseFloat(mergedFormData.credit),
    balance: isNaN(parseFloat(mergedFormData.balance)) ? 0 : parseFloat(mergedFormData.balance),
    payment_in: mergedFormData.payment_in,
    patient_id: mergedFormData.patient_id || null,
    lens_id: mergedFormData.lens_id || null,
    branchs_id: mergedFormData.branchs_id,
    total_p_frame: isNaN(parseFloat(mergedFormData.total_p_frame)) ? 0 : parseFloat(mergedFormData.total_p_frame),
    total_p_lens: isNaN(parseFloat(mergedFormData.total_p_lens)) ? 0 : parseFloat(mergedFormData.total_p_lens),
    discount_frame: isNaN(parseFloat(mergedFormData.discount_frame)) ? 0 : parseFloat(mergedFormData.discount_frame),
    discount_lens: isNaN(parseFloat(mergedFormData.discount_lens)) ? 0 : parseFloat(mergedFormData.discount_lens),
    inventario_id: mergedFormData.brand_id || null,
    measure_id: mergedFormData.measure_id || null,
    signature: mergedFormData.signature || null,
  };

  try {
    console.log("Valor de mergedFormData.date:", mergedFormData.date);
    console.log("Objeto saleDataToSave:", saleDataToSave);

    const { data, error } = await supabase
      .from("sales")
      .insert([saleDataToSave])
      .select();
    if (error) throw error;
    setSaleRegistered(true);
    if (data && data.length > 0) {
      setSaleId(data[0].id);
      setPdfGenerated(true);
      toast({
        title: "Venta registrada con éxito.",
        description: "La venta ha sido guardada correctamente.",
        status: "success",
        duration: 5000,
        isClosable: true,
      });
  // Limpiar formulario SOLO después de que el PDF se haya generado y subido
  // Esto lo puedes hacer en el callback onPdfUploaded del componente Pdf
    }
  } catch (err) {
    console.error("Error al registrar la venta:", err);
  } finally {
    setIsSubmitting(false);
  }
};

  const pdfData = {
    ...mergedFormData,
    id: saleId,
  };

  const handleSaveSignature = (signatureDataUrl) => {
    setFormData((prev) => ({
      ...prev,
      signature: signatureDataUrl,
    }));
  };

  const handleTotalsChange = (totals) => {
    // Solo actualiza los campos si realmente cambiaron, nunca limpia ni reinicia
    setTotals((prevTotals) => {
      if (
        prevTotals.total_p_frame !== totals.total_p_frame ||
        prevTotals.total_p_lens !== totals.total_p_lens ||
        prevTotals.frameName !== totals.frameName ||
        prevTotals.lensName !== totals.lensName
      ) {
        return { ...prevTotals, ...totals };
      }
      return prevTotals;
    });
    setFormData((prev) => {
      const newTotalFrame = totals.total_p_frame !== undefined ? Number(totals.total_p_frame) : prev.total_p_frame;
      const newTotalLens = totals.total_p_lens !== undefined ? Number(totals.total_p_lens) : prev.total_p_lens;
      if (
        prev.total_p_frame !== newTotalFrame ||
        prev.total_p_lens !== newTotalLens
      ) {
        return {
          ...prev,
          total_p_frame: newTotalFrame,
          total_p_lens: newTotalLens,
        };
      }
      return prev;
    });
  };


  const handleNavigate = (route = null) => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (route) {
      navigate(route);
      return;
    }
    if (!user || !user.role_id) {
      navigate('/Login');
      return;
    }
    switch (user.role_id) {
      case 1:
        navigate('/Admin');
        break;
      case 2:
        navigate('/Optometra');
        break;
      case 3:
        navigate('/Vendedor');
        break;
      default:
        navigate('/');
    }
  };
  const moduleSpecificButton = null;

  const cardBg = useColorModeValue(
    'rgba(207, 202, 202, 0.5)', // Light: tarjetas blancas
    'rgba(48, 44, 44, 0.2)' // Dark: tu fondo actual
  );


  // Función para renderizar el contenido según el paso actual
  const renderStepContent = () => {
    
    switch (currentStep) {
      case 1:
        return (
          <Box>
            <SearchPatient onFormDataChange={handlePatientDataChange} initialFormData={saleData} />
            <Measures initialFormData={saleData} filteredMeasures={filteredMeasures} />
          </Box>
        );
      case 2:
        return (
          <Box p={5}>
            <Text fontSize="xl" fontWeight="bold" mb={6} textAlign="center" color="gray.600">
              Detalles de Venta
            </Text>
            <Box width="100vw" position="relative" bg={cardBg} py={8} mt={8}>
              <Grid gap={4} alignItems="start">
                <SalesDetails
                  formData={formData}
                  setFormData={setFormData}
                  onTotalsChange={handleTotalsChange}
                />
              </Grid>
            </Box>
          </Box>
        );
      case 3:
        return (
          <Box mb={[4, 6]}>
            <Text fontSize="xl" fontWeight="bold" mb={6} textAlign="center" color="gray.600">
              Total
            </Text>
            <Box width="100vw" position="relative" bg={cardBg} py={8} mt={8}>
              <TotalUI
                frameName={formData.brand || ""}
                lensName={formData.lens_type_name || ""}
                total_p_frame={formData.total_p_frame}
                total_p_lens={formData.total_p_lens}
                initialFormData={formData}
                onFormDataChange={handleFormDataChange}
              />
            </Box>
          </Box>
        );
      case 4:
        return (
          <Box mt={6}>
            <Text fontSize="xl" fontWeight="bold" mb={6} textAlign="center" color="gray.600">
              Método de Pago
            </Text>
            <Box width="100vw" position="relative" bg={cardBg} py={8} mt={8}>
              <Total
                formData={formData}
                setFormData={handleFormDataChange}
              />
            </Box>
          </Box>
        );
      case 5:
        return (
          <Box mt={8}>
            <Text fontSize="xl" fontWeight="bold" mb={6} textAlign="center" color="gray.600">
              Tiempo de Entrega
            </Text>
            <Box width="100vw" position="relative" bg={cardBg} py={8} mt={8}>
              <Delivery saleData={saleData} setSaleData={setSaleData} />
            </Box>
          </Box>
        );
      case 6:
        return (
          <Box mt={8}>
            <Text fontSize="xl" fontWeight="bold" mb={6} textAlign="center" color="gray.600">
              Mensaje
            </Text>
            <Box width="100vw" position="relative" bg={cardBg} py={8} mt={8}>
              <MessageSection
                selectedBranch={branchName}
                formData={formData}
                setFormData={setFormData}
              />
            </Box>
          </Box>
        );
      case 7:
        return (
          <Box mt={8}>
            <Text fontSize="xl" fontWeight="bold" mb={6} textAlign="center" color="gray.600">
              Observación
            </Text>
            <Box width="100vw" position="relative" bg={cardBg} py={8} mt={8}>
              <ObservationSection setFormData={setFormData} />
            </Box>
          </Box>
        );
      case 8:
        return (
          <Box mt={8}>
            <Text fontSize="xl" fontWeight="bold" mb={6} textAlign="center" color="gray.600">
              Términos y Condiciones
            </Text>
            <Box width="100vw" position="relative" bg={cardBg} py={8} mt={8}>
              <TermsCondition
                selectedBranch={branchName}
                formData={formData}
                setFormData={setFormData}
              />
              <SignaturePadComponent
                onSave={(signatureDataUrl) =>
                  setFormData((prev) => ({
                    ...prev,
                    signature: signatureDataUrl,
                  }))
                }
              />
            </Box>
          </Box>
        );
      default:
        return null;
    }
  };
  
  

  return (
    <Box ref={salesRef} w="full" px={4}>
      <Box className="sales-form" display="flex" flexDirection="column" alignItems="center" minHeight="100vh" p={4}>
        <SmartHeader moduleSpecificButton={moduleSpecificButton} />
          <Box w="100%" maxW="800px" mb={4}>
        <Heading 
          textAlign="left" 
          size="md"
          fontWeight="700"
          color={useColorModeValue('teal.600', 'teal.300')}
          pb={2}
        >
          Contrato de Servicio
        </Heading>
      </Box>
        {/* Indicador de pasos */}
        <Box mb={6} display="flex" justifyContent="center" flexWrap="wrap" gap={2}>
          {Array.from({ length: totalSteps }, (_, i) => i + 1).map((step) => (
            <Button
              key={step}
              size="sm"
              colorScheme={currentStep === step ? "teal" : "gray"}
              variant={currentStep === step ? "solid" : "outline"}
              onClick={() => goToStep(step)}
            >
              {step}
            </Button>
          ))}
        </Box>
          
        {/* Contenido del paso actual */}
        {renderStepContent()}

        {/* Botones de navegación */}
        <Box mt={6} display="flex" justifyContent="space-between" width="100%" maxWidth="400px" gap={4}>
          <Button
            onClick={prevStep}
            isDisabled={currentStep === 1}
            colorScheme="gray"
          >
            Anterior
          </Button>
          
          {currentStep === totalSteps ? (
            <Button colorScheme="teal" onClick={handleSubmit} isDisabled={isSubmitting}>
              {isSubmitting ? "Registrando..." : "Registrar Venta"}
            </Button>
          ) : (
            <Button onClick={nextStep} colorScheme="teal">
              Siguiente
            </Button>
          )}
        </Box>
        {saleId && <Pdf 
          formData={pdfData} 
          targetRef={salesRef} 
          onPdfUploaded={async (pdfUrl) => {
            const { error } = await supabase
              .from('sales')
              .update({ pdf_url: pdfUrl })
              .eq('id', saleId);
            if (error) {
              console.error('Error actualizando pdf_url:', error);
            } else {
              console.log('PDF URL actualizado correctamente');
            }
          }}
        />}
      </Box>
    </Box>
  );
};

export default Sales;
