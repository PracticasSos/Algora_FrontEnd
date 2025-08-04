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
  const [filteredMeasures, setFilteredMeasures] = useState([]);
  const [deliveryDays, setDeliveryDays] = useState(0);
  const [saleRegistered, setSaleRegistered] = useState(false);
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

  return (
    <Box ref={salesRef} w="full" px={4}>
      <Box className="sales-form" display="flex" flexDirection="column" alignItems="center" minHeight="100vh"  p={4}>
        <Heading mb={4} textAlign="center">Contrato de Servicio</Heading>
        <SmartHeader moduleSpecificButton={moduleSpecificButton} />
  
        <Box >
          <SearchHistory onFormDataChange={handlePatientDataChange} initialFormData={{ ...formData, ...saleData, sale_id: saleParamId || saleId }} />
          <MeasuresHistory onFormDataChange={handlePatientDataChange} initialFormData={{...formData, ...saleData} }  saleId={saleParamId || saleId} />
        </Box>
          <Box p={5} >
            <Text fontSize="xl" fontWeight="bold" mb={6} textAlign="center" color="gray.600">
              Detalles de Venta
            </Text>
            <Box
              width="100vw"
              position="relative"
              bg={cardBg}
              py={8}
              mt={8} 
            >
              <Grid  gap={4} alignItems="start">
                <DetailsHistory
                  onFormDataChange={handleFormDataChange} onTotalsChange={handleTotalsChange} initialFormData={{...formData, ...saleData} }  saleId={saleParamId || saleId}
                />
              </Grid>
              </Box>
          </Box>

          <Box mb={[4, 6]}>
            <Text fontSize="xl" fontWeight="bold" mb={6} textAlign="center" color="gray.600" >
              Total
            </Text>
            <Box
            width="100vw"
            position="relative"
            bg={cardBg}
            py={8}
            mt={8}
            >
            <HistoryUI
              frameName={formData.frameName}
              lensName={formData.lensName}
              total_p_frame={totals.total_p_frame}
              total_p_lens={totals.total_p_lens}
              initialFormData={formData}
              onFormDataChange={handleFormDataChange}
            />
            </Box>
          </Box>

          <Box mt={6}>
            <Text
                fontSize="xl"
                fontWeight="bold"
                mb={6}
                textAlign="center"
                color="gray.600"
              >
                Metodo de Pago
              </Text>
              <Box
              width="100vw"
              position="relative"
              bg={cardBg}
              py={8}
              mt={8}
            >
              <TotalHistory
                saleId={saleId}  formData={formData} setFormData={setFormData}
              />  
              </Box>
            </Box>
          
          <Box mt={8}>
            <Text
                fontSize="xl"
                fontWeight="bold"
                mb={6}
                textAlign="center"
                color="gray.600"
              >
                Tiempo de Entrega
              </Text>
            <Box
              width="100vw"
              position="relative"
              bg={cardBg}
              py={8}
              mt={8}
            >
            <Delivery saleData={saleData} setSaleData={setSaleData} />
          </Box> 
          </Box> 
              <Box  mt={8}>
                <Text fontSize="xl" fontWeight="bold" mb={6} textAlign="center" color="gray.600">
                Mensaje
                </Text>
                <Box
                  width="100vw"
                  position="relative"
                  bg={cardBg}
                  py={8}
                  mt={8}
                >
                  <MessageSection
                    selectedBranch={branchName}
                    formData={formData}
                    setFormData={setFormData}
                  />
                </Box>
              </Box>
              
              <Box  mt={8}>
                <Text fontSize="xl" fontWeight="bold" mb={6} textAlign="center" color="gray.600">
                Observación
                </Text>
                <Box
                  width="100vw"
                  position="relative"
                  bg={cardBg}
                  py={8}
                  mt={8}
                >
                  <ObservationSection setFormData={setFormData} />
                </Box>
              </Box>

              <Box mt={8}>
                <Text fontSize="xl" fontWeight="bold" mb={6} textAlign="center" color="gray.600">
                Terminos y Condiciones
                </Text>
                <Box
                  width="100vw"
                  position="relative"
                  bg={cardBg}
                  py={8}
                  mt={8}
                >
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
              
          <Button colorScheme="teal" width="full"  maxWidth="200px" mt={4} onClick={handleSubmit}>
            Registrar Venta
          </Button>
          {saleId && <Pdf formData={pdfData} targetRef={salesRef} />}
      </Box>
    </Box>
  );  
};

export default SalesHistory;
