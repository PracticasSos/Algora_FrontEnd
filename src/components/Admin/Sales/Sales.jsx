import { useState, useEffect, useRef } from "react";
import SearchPatient from "./SearchPatient";
import Measures from "./Measures";
import { supabase } from "../../../api/supabase";
import { Box, Heading, useColorModeValue  } from "@chakra-ui/react";
import Pdf from "./Pdf";
import {useNavigate, useParams } from "react-router-dom";
import { useToast } from "@chakra-ui/react";
import SmartHeader from "../../header/SmartHeader";
import SalesDetailsStep from "./SalesDetailsStep";
import TotalStep from "./TotalStep";
import DeliveryStep from "./DeliveryStep";
import MessageStep from "./MessageStep";
import ObservationStep from "./ObservationStep";
import TermsStep from "./TermsStep";
import StepsIndicator from "./StepsIndicator";
import NavigationButtons from "./NavigationButtons";
import PaymentStep from "./PaymentStep";

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
  termsMessage: "",
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
    message: formData.message,
    termsMessage: formData.termsMessage,
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

  await supabase.rpc('descontar_stock', {
    p_inventario_id: mergedFormData.brand_id,
    p_cantidad: 1
  });

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

  const moduleSpecificButton = null;

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
          <SalesDetailsStep
            formData={formData}
            setFormData={setFormData}
            onTotalsChange={handleTotalsChange}
          />
        );
      case 3:
        return (
          <TotalStep
            formData={formData}
            onFormDataChange={handleFormDataChange}
          />
        );
      case 4:
        return (
          <PaymentStep
            formData={formData}
            onFormDataChange={handleFormDataChange}
          />
        );
      case 5:
        return (
          <DeliveryStep
            saleData={saleData}
            setSaleData={setSaleData}
          />
        );
      case 6:
        return (
          <MessageStep
            selectedBranch={branchName}
            formData={formData}
            setFormData={setFormData}
          />
        );
      case 7:
        return (
          <ObservationStep
            setFormData={setFormData}
          />
        );
      case 8:
        return (
          <TermsStep
            selectedBranch={branchName}
            formData={formData}
            setFormData={setFormData}
          />
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
        <StepsIndicator
          totalSteps={totalSteps}
          currentStep={currentStep}
          goToStep={goToStep}
        />
        {renderStepContent()}
        <NavigationButtons
          currentStep={currentStep}
          totalSteps={totalSteps}
          prevStep={prevStep}
          nextStep={nextStep}
          handleSubmit={handleSubmit}
          isSubmitting={isSubmitting}
        />
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
