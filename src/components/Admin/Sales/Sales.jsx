import { useState, useEffect, useRef } from "react";
import SearchPatient from "./SearchPatient";
import Measures from "./Measures";
import { supabase } from "../../../api/supabase";
import { 
  Box, 
  Heading, 
  useColorModeValue, 
  Container,
  VStack,
  HStack,
  Text,
  Progress,
  Fade,
  ScaleFade,
  useBreakpointValue,
  Card,
  CardBody,
  Badge,
  Divider,
  Icon
} from "@chakra-ui/react";
import { 
  FiUser, 
  FiShoppingCart, 
  FiPercent, 
  FiCreditCard, 
  FiTruck, 
  FiMessageSquare, 
  FiFileText, 
  FiCheckCircle 
} from "react-icons/fi";
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

  // Estados para animaciones y transiciones
  const [isStepChanging, setIsStepChanging] = useState(false);
  const [stepDirection, setStepDirection] = useState('forward');

  useEffect(() => {
    const setContext = async () => {
      try {
        if (saleData.branchs_id) {
          await supabase.rpc("set_branch", { branch_id: saleData.branchs_id });
        }
        await supabase.rpc("set_route", { route: "/sales" });
      } catch (err) {
        console.error("Error configurando contexto de mensajes:", err.message);
      }
    };
    setContext();
  }, [saleData.branchs_id]);

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

  // Colores y estilos responsivos
  const bgColor = useColorModeValue('gray.50', 'gray.900');
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const shadowColor = useColorModeValue('rgba(0,0,0,0.1)', 'rgba(0,0,0,0.3)');
  const accentColor = useColorModeValue('teal.500', 'teal.300');
  const textColor = useColorModeValue('gray.700', 'gray.200');
  const mutedTextColor = useColorModeValue('gray.500', 'gray.400');

  const containerMaxW = useBreakpointValue({ base: 'full', md: '6xl' });
  const cardPadding = useBreakpointValue({ base: 4, md: 8 });

  // Configuración de pasos con iconos y títulos
  const stepConfig = [
    { 
      title: "Información del Paciente", 
      icon: FiUser, 
      description: "Datos del cliente y medidas" 
    },
    { 
      title: "Detalles de Venta", 
      icon: FiShoppingCart, 
      description: "Selección de productos" 
    },
    { 
      title: "Cálculo Total", 
      icon: FiPercent, 
      description: "Precios y descuentos" 
    },
    { 
      title: "Método de Pago", 
      icon: FiCreditCard, 
      description: "Forma de pago" 
    },
    { 
      title: "Entrega", 
      icon: FiTruck, 
      description: "Fecha y hora de entrega" 
    },
    { 
      title: "Mensaje", 
      icon: FiMessageSquare, 
      description: "Mensaje personalizado" 
    },
    { 
      title: "Observaciones", 
      icon: FiFileText, 
      description: "Notas adicionales" 
    },
    { 
      title: "Términos y Firma", 
      icon: FiCheckCircle, 
      description: "Aceptación y firma digital" 
    }
  ];

  const handleFormDataChange = (newFormData) => {
    setFormData((prevFormData) => {
    const updated = { ...prevFormData, ...newFormData };
    if (JSON.stringify(updated) !== JSON.stringify(prevFormData)) {
      if ('branchs_id' in newFormData) {
        setSaleData((prevSaleData) => ({
          ...prevSaleData,
          branchs_id: newFormData.branchs_id
        }));
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

  // Funciones de navegación mejoradas con animaciones
  const nextStep = () => {
    if (currentStep < totalSteps) {
      setIsStepChanging(true);
      setStepDirection('forward');
      setTimeout(() => {
        setCurrentStep(currentStep + 1);
        setIsStepChanging(false);
      }, 200);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setIsStepChanging(true);
      setStepDirection('backward');
      setTimeout(() => {
        setCurrentStep(currentStep - 1);
        setIsStepChanging(false);
      }, 200);
    }
  };

  const goToStep = (step) => {
    if (step !== currentStep) {
      setIsStepChanging(true);
      setStepDirection(step > currentStep ? 'forward' : 'backward');
      setTimeout(() => {
        setCurrentStep(step);
        setIsStepChanging(false);
      }, 200);
    }
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
    total_p_frame:
      mergedFormData.discount_frame > 0
        ? (isNaN(parseFloat(mergedFormData.total_p_frame)) ? null : parseFloat(mergedFormData.total_p_frame))
        : null,
    total_p_lens:
      mergedFormData.discount_lens > 0
        ? (isNaN(parseFloat(mergedFormData.total_p_lens)) ? null : parseFloat(mergedFormData.total_p_lens))
        : null,
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
        title: "¡Venta registrada con éxito!",
        description: "El contrato ha sido creado correctamente.",
        status: "success",
        duration: 5000,
        isClosable: true,
        position: "top"
      });
    }
  } catch (err) {
    console.error("Error al registrar la venta:", err);
    toast({
      title: "Error al procesar la venta",
      description: "Ha ocurrido un error. Por favor, intente nuevamente.",
      status: "error",
      duration: 5000,
      isClosable: true,
      position: "top"
    });
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
      // Ignora actualizaciones automáticas con totales en 0 si ya existen valores previos
      if (
        (totals.total_p_frame === 0 && formData.total_p_frame > 0) ||
        (totals.total_p_lens === 0 && formData.total_p_lens > 0)
      ) {
        console.log('[handleTotalsChange] Ignorado: totales en 0 pero ya existen valores previos');
        return;
      }
    // Solo actualiza los campos si realmente cambiaron, nunca limpia ni reinicia
    console.log('[handleTotalsChange] Totals recibidos:', totals);
    setTotals((prevTotals) => {
      if (
        prevTotals.total_p_frame !== totals.total_p_frame ||
        prevTotals.total_p_lens !== totals.total_p_lens ||
        prevTotals.frameName !== totals.frameName ||
        prevTotals.lensName !== totals.lensName
      ) {
        console.log('[handleTotalsChange] Actualizando totals:', { ...prevTotals, ...totals });
        return { ...prevTotals, ...totals };
      }
      return prevTotals;
    });
    setFormData((prev) => {
      // Si no hay descuento, pasa el valor de p_frame + p_lens a total
      if (prev.discount_frame === 0 && prev.discount_lens === 0) {
        const newTotal = Number(prev.p_frame) + Number(prev.p_lens);
        if (prev.total !== newTotal) {
          console.log('[handleTotalsChange] Actualizando total sin descuento:', newTotal);
          return {
            ...prev,
            total: newTotal,
          };
        }
        return prev;
      }
      // ...lógica anterior para descuentos...
      let updates = {};
      if (prev.discount_frame > 0 && totals.total_p_frame !== undefined) {
        updates.total_p_frame = Number(totals.total_p_frame);
      }
      if (prev.discount_lens > 0 && totals.total_p_lens !== undefined) {
        updates.total_p_lens = Number(totals.total_p_lens);
      }
      if (
        (updates.total_p_frame !== undefined && prev.total_p_frame !== updates.total_p_frame) ||
        (updates.total_p_lens !== undefined && prev.total_p_lens !== updates.total_p_lens)
      ) {
        console.log('[handleTotalsChange] Actualizando formData:', { ...prev, ...updates });
        return {
          ...prev,
          ...updates,
        };
      }
      console.log('[handleTotalsChange] No se actualiza formData, valores iguales o sin descuento:', prev);
      return prev;
    });
  };

  const moduleSpecificButton = null;

  // Función mejorada para renderizar el contenido con animaciones
  const renderStepContent = () => {
    const content = (() => {
      switch (currentStep) {
        case 1:
          return (
            <VStack spacing={6} w="full">
              <SearchPatient onFormDataChange={handlePatientDataChange} initialFormData={saleData} />
              <Measures initialFormData={saleData} filteredMeasures={filteredMeasures} />
            </VStack>
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
          console.log('[Sales] Valores enviados a TotalUI:', {
            frameName: totals.frameName,
            lensName: totals.lensName,
            total_p_frame: totals.total_p_frame,
            total_p_lens: totals.total_p_lens,
            total: totals.total,
            formData,
          });
          return (
            <TotalStep
              formData={formData}
              onFormDataChange={handleFormDataChange}
              frameName={totals.frameName}
              lensName={totals.lensName}
              total_p_frame={totals.total_p_frame}
              total_p_lens={totals.total_p_lens}
              total={totals.total}
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
              selectedBranch={saleData.branchs_id}
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
    })();

    return (
      <ScaleFade 
        in={!isStepChanging} 
        initialScale={0.95}
        unmountOnExit
      >
        <Card
          shadow="lg"
          bg={cardBg}
          borderWidth="1px"
          borderColor={borderColor}
          borderRadius="2xl"
          overflow="hidden"
          minH="400px"
        >
          <CardBody p={cardPadding}>
            {content}
          </CardBody>
        </Card>
      </ScaleFade>
    );
  };

  // Componente mejorado del indicador de progreso
  const EnhancedStepsIndicator = () => {
    const progressPercentage = ((currentStep - 1) / (totalSteps - 1)) * 100;

    return (
      <Card
        bg={cardBg}
        shadow="md"
        borderRadius="xl"
        borderWidth="1px"
        borderColor={borderColor}
        mb={8}
        overflow="hidden"
      >
        <CardBody p={6}>
          <VStack spacing={4} w="full">
            <HStack justify="space-between" w="full">
              <VStack align="start" spacing={1}>
                <HStack>
                  <Icon 
                    as={stepConfig[currentStep - 1]?.icon} 
                    color={accentColor} 
                    boxSize={5}
                  />
                  <Heading size="md" color={textColor}>
                    {stepConfig[currentStep - 1]?.title}
                  </Heading>
                </HStack>
                <Text fontSize="sm" color={mutedTextColor}>
                  {stepConfig[currentStep - 1]?.description}
                </Text>
              </VStack>
              <Badge 
                colorScheme="teal" 
                variant="subtle" 
                px={3} 
                py={1} 
                borderRadius="full"
                fontSize="sm"
              >
                {currentStep} de {totalSteps}
              </Badge>
            </HStack>
            
            <Box w="full">
              <Progress 
                value={progressPercentage} 
                colorScheme="teal"
                bg={useColorModeValue('gray.100', 'gray.700')}
                borderRadius="full"
                size="sm"
                hasStripe
                isAnimated
              />
            </Box>

            <HStack 
              justify="space-between" 
              w="full" 
              spacing={2}
              flexWrap="wrap"
            >
              {stepConfig.map((step, index) => {
                const stepNumber = index + 1;
                const isActive = stepNumber === currentStep;
                const isCompleted = stepNumber < currentStep;
                
                return (
                  <VStack 
                    key={stepNumber}
                    spacing={1}
                    cursor="pointer"
                    onClick={() => goToStep(stepNumber)}
                    transition="all 0.2s"
                    _hover={{ transform: 'translateY(-2px)' }}
                    minW="80px"
                  >
                    <Box
                      w={8}
                      h={8}
                      borderRadius="full"
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                      bg={
                        isCompleted 
                          ? accentColor
                          : isActive 
                          ? accentColor
                          : useColorModeValue('gray.200', 'gray.600')
                      }
                      color={
                        isCompleted || isActive 
                          ? 'white' 
                          : useColorModeValue('gray.500', 'gray.400')
                      }
                      fontSize="sm"
                      fontWeight="bold"
                      transition="all 0.3s"
                    >
                      {isCompleted ? (
                        <Icon as={FiCheckCircle} boxSize={4} />
                      ) : (
                        stepNumber
                      )}
                    </Box>
                    <Text
                      fontSize="xs"
                      color={
                        isActive 
                          ? accentColor
                          : isCompleted
                          ? textColor
                          : mutedTextColor
                      }
                      fontWeight={isActive ? 'semibold' : 'normal'}
                      textAlign="center"
                      lineHeight={1.2}
                    >
                      {step.title.length > 10 ? 
                        `${step.title.substring(0, 10)}...` : 
                        step.title
                      }
                    </Text>
                  </VStack>
                );
              })}
            </HStack>
          </VStack>
        </CardBody>
      </Card>
    );
  };

  return (
    <Box 
      ref={salesRef} 
      minH="100vh" 
      bg={bgColor}
      transition="all 0.3s ease"
    >
      <Container maxW={containerMaxW} py={6}>
        <VStack spacing={6} w="full">
          <SmartHeader moduleSpecificButton={moduleSpecificButton} />
          
          <Fade in={true}>
            <VStack spacing={2} w="full" textAlign="center">
              <Heading 
                size="md"
                fontWeight="800"
                bgGradient={`linear(to-r, ${accentColor}, teal.600)`}
                bgClip="text"
                letterSpacing="-0.02em"
              >
                Contrato de Servicio
              </Heading>
              <Text 
                fontSize="md" 
                color={mutedTextColor}
                fontWeight="400"
              >
                Complete la información paso a paso para generar el contrato
              </Text>
              <Divider my={2} />
            </VStack>
          </Fade>

          <EnhancedStepsIndicator />
          
          <Box w="full">
            {renderStepContent()}
          </Box>

          <NavigationButtons
            currentStep={currentStep}
            totalSteps={totalSteps}
            prevStep={prevStep}
            nextStep={nextStep}
            handleSubmit={handleSubmit}
            isSubmitting={isSubmitting}
          />

          {saleId && (
            <Pdf 
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
            />
          )}
        </VStack>
      </Container>
    </Box>
  );
};

export default Sales;