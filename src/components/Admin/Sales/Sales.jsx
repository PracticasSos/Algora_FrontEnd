import { useState, useEffect, useRef } from "react";
import SearchPatient from "./SearchPatient";
import { supabase } from "../../../api/supabase";
import {
  Box,
  Flex,
  Heading,
  useColorModeValue,
  Container,
  VStack,
  HStack,
  Text,
  Fade,
  useBreakpointValue,
  Button,
  Badge,
} from "@chakra-ui/react";
import {
  FiUser,
  FiShoppingCart,
  FiCreditCard,
  FiFileText,
  FiCheckCircle,
} from "react-icons/fi";
import { Eye as EyeIcon } from "lucide-react";
import Pdf from "./Pdf";
import { useNavigate, useParams } from "react-router-dom";
import { useToast } from "@chakra-ui/react";
import SmartHeader from "../../header/SmartHeader";
import SalesDetailsStep from "./SalesDetailsStep";
import TotalStep from "./TotalStep";
import DeliveryStep from "./DeliveryStep";
import ObservationStep from "./ObservationStep";
import TermsStep from "./TermsStep";
import SaleSection from "./SaleSection";
import SaleSummaryPanel from "./SaleSummaryPanel";
import MeasuresModal from "./MeasuresModal";
import AccessoriesModal from "./AccessoriesModal";
import PaymentModal from "./PaymentModal";

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
    termsAccepted: false,
  });
  const [patientMeasures, setPatientMeasures] = useState([]);
  const [filteredMeasures, setFilteredMeasures] = useState([]);
  const [accessories, setAccessories] = useState([]);
  const [saleRegistered, setSaleRegistered] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [saleId, setSaleId] = useState(null);
  const [pdfGenerated, setPdfGenerated] = useState(false);
  const navigate = useNavigate();
  const salesRef = useRef(null);
  const [branchName, setBranchName] = useState("");
  const [patientName, setPatientName] = useState("");
  const { id } = useParams();
  const toast = useToast();

  // Modales
  const [isMeasuresModalOpen, setIsMeasuresModalOpen] = useState(false);
  const [isAccessoriesModalOpen, setIsAccessoriesModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  // Qué secciones están expandidas (varias pueden estarlo a la vez, no es un wizard)
  const [openSections, setOpenSections] = useState({ patient: true });
  const toggleSection = (key) =>
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));

  const bgColor = useColorModeValue("gray.50", "gray.900");
  const textColor = useColorModeValue("gray.800", "white");
  const mutedTextColor = useColorModeValue("gray.500", "gray.400");
  const accentColor = useColorModeValue("teal.600", "teal.300");
  const containerMaxW = useBreakpointValue({ base: "full", lg: "7xl" });

  useEffect(() => {
    if (id) {
      setSaleData((prev) => ({ ...prev, patient_id: id }));
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

  // Nombre del paciente para mostrarlo en el resumen en vivo (solo lectura, no cambia el flujo de datos)
  useEffect(() => {
    const fetchPatientName = async () => {
      if (!saleData.patient_id) {
        setPatientName("");
        return;
      }
      const { data, error } = await supabase
        .from("patients")
        .select("pt_firstname, pt_lastname")
        .eq("id", saleData.patient_id)
        .single();
      if (!error && data) {
        setPatientName(`${data.pt_firstname} ${data.pt_lastname}`);
      }
    };
    fetchPatientName();
  }, [saleData.patient_id]);

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
      setPatientMeasures(Object.values(latestMeasuresByPatient) || []);
    } catch (err) {
      console.error("Error fetching latest rx_final:", err);
    }
  };

  // Mensaje automático de WhatsApp según la sucursal (configurado en otro panel).
  // No tiene interfaz aquí a propósito: se manda solo, nada que llenar.
  useEffect(() => {
    const fetchMessage = async () => {
      if (!saleData.branchs_id) return;
      const { data, error } = await supabase
        .from("messages")
        .select("content")
        .eq("branch_id", saleData.branchs_id)
        .eq("route", "/sales")
        .single();
      if (!error && data?.content) {
        setFormData((prev) => ({ ...prev, message: data.content }));
      }
    };
    fetchMessage();
  }, [saleData.branchs_id]);

  const handlePatientDataChange = (formData) => {
    setSaleData((prevData) => ({
      ...prevData,
      patient_id: formData.patient_id,
      branchs_id: formData.branchs_id,
      date: formData.date,
      pt_phone: formData.pt_phone,
      brand_id: formData.brand || prevData.brand_id,
      lens_id: formData.lens_type || prevData.lens_id,
    }));

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

  // Cuando se guarda una medida desde el modal (nueva o editada)
  const handleMeasureSaved = (savedRow) => {
    setPatientMeasures((prev) => {
      const withoutOld = prev.filter((m) => m.patient_id !== savedRow.patient_id);
      return [...withoutOld, savedRow];
    });
    setFilteredMeasures([savedRow]);
    setFormData((prev) => ({ ...prev, measure_id: savedRow.id }));
  };

  const handleFormDataChange = (newFormData) => {
    setFormData((prevFormData) => {
      const updated = {
        ...prevFormData,
        ...newFormData,
        observation_text:
          newFormData.observation_text !== undefined
            ? newFormData.observation_text
            : prevFormData.observation_text,
        observation_img:
          newFormData.observation_img !== undefined
            ? newFormData.observation_img
            : prevFormData.observation_img,
      };
      if (JSON.stringify(updated) !== JSON.stringify(prevFormData)) {
        if ("branchs_id" in newFormData) {
          setSaleData((prevSaleData) => ({
            ...prevSaleData,
            branchs_id: newFormData.branchs_id,
          }));
        }
        return updated;
      }
      return prevFormData;
    });

    const saleDataKeys = ["brand_id", "lens_id"];
    const saleDataUpdates = {};
    saleDataKeys.forEach((key) => {
      if (key in newFormData) saleDataUpdates[key] = newFormData[key];
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

  const mergedFormData = {
    ...formData,
    branchs_id: formData.branchs_id && formData.branchs_id !== "" ? formData.branchs_id : saleData.branchs_id,
    patient_id: formData.patient_id && formData.patient_id !== "" ? formData.patient_id : saleData.patient_id,
    brand_id: formData.brand_id && formData.brand_id !== "" ? formData.brand_id : saleData.brand_id,
    lens_id: formData.lens_id && formData.lens_id !== "" ? formData.lens_id : saleData.lens_id,
    date: formData.date && formData.date !== "" ? formData.date : saleData.date,
    delivery_time: formData.delivery_time && formData.delivery_time !== "" ? formData.delivery_time : saleData.delivery_time,
    delivery_datetime: formData.delivery_datetime && formData.delivery_datetime !== "" ? formData.delivery_datetime : saleData.delivery_datetime,
    balance: formData.balance !== undefined && formData.balance !== "" ? formData.balance : saleData.balance,
    credit: formData.credit !== undefined && formData.credit !== "" ? formData.credit : saleData.credit,
    payment_in: formData.payment_in && formData.payment_in !== "" ? formData.payment_in : saleData.payment_in,
    measure_id: formData.measure_id && formData.measure_id !== "" ? formData.measure_id : saleData.measure_id,
    message: formData.message,
    observation_text: formData.observation_text,
    termsMessage: formData.termsMessage,
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    if (!mergedFormData.payment_in) {
      toast({ title: "Error", description: "Por favor, seleccione un método de pago.", status: "error", duration: 5000, isClosable: true });
      setIsSubmitting(false);
      setOpenSections((prev) => ({ ...prev, payment: true }));
      return;
    }
    if (!mergedFormData.branchs_id) {
      toast({ title: "Error", description: "Por favor, seleccione una sucursal.", status: "error", duration: 5000, isClosable: true });
      setIsSubmitting(false);
      setOpenSections((prev) => ({ ...prev, product: true }));
      return;
    }
    const signatureDataUrl = mergedFormData.signature;
    if (!signatureDataUrl) {
      toast({ title: "Falta la firma", description: "El cliente debe firmar para registrar la venta.", status: "error", duration: 5000, isClosable: true });
      setIsSubmitting(false);
      setOpenSections((prev) => ({ ...prev, terms: true }));
      return;
    }

    await supabase.rpc("descontar_stock", {
      p_inventario_id: mergedFormData.brand_id,
      p_cantidad: 1,
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
      total_p_frame: mergedFormData.discount_frame > 0 ? (isNaN(parseFloat(mergedFormData.total_p_frame)) ? null : parseFloat(mergedFormData.total_p_frame)) : null,
      total_p_lens: mergedFormData.discount_lens > 0 ? (isNaN(parseFloat(mergedFormData.total_p_lens)) ? null : parseFloat(mergedFormData.total_p_lens)) : null,
      discount_frame: isNaN(parseFloat(mergedFormData.discount_frame)) ? 0 : parseFloat(mergedFormData.discount_frame),
      discount_lens: isNaN(parseFloat(mergedFormData.discount_lens)) ? 0 : parseFloat(mergedFormData.discount_lens),
      inventario_id: mergedFormData.brand_id || null,
      measure_id: mergedFormData.measure_id || null,
      signature: mergedFormData.signature || null,
      observation_text: mergedFormData.observation_text || null,
      observation_img: mergedFormData.observation_img || null,
    };

    try {
      const { data, error } = await supabase.from("sales").insert([saleDataToSave]).select();
      if (error) throw error;
      setSaleRegistered(true);
      if (data && data.length > 0) {
        const newSaleId = data[0].id;
        setSaleId(newSaleId);
        setPdfGenerated(true);

        // Guardar accesorios (opcional) como partidas separadas, sin tocar sales.total
        if (accessories.length > 0) {
          const itemsToSave = accessories.map((a) => ({
            sale_id: newSaleId,
            source: a.source, // "inventario" o "lens"
            inventario_id: a.source === "inventario" ? a.sourceId : null,
            lens_id: a.source === "lens" ? a.sourceId : null,
            name: a.name,
            quantity: a.quantity,
            unit_price: a.unit_price,
            subtotal: a.unit_price * a.quantity,
          }));
          const { error: itemsError } = await supabase.from("sale_items").insert(itemsToSave);
          if (itemsError) {
            console.error("Error guardando accesorios:", itemsError);
            toast({
              title: "Venta registrada, pero los accesorios no se guardaron",
              description: "Revisa que la tabla sale_items tenga las columnas source y lens_id.",
              status: "warning",
              duration: 6000,
              isClosable: true,
            });
          } else {
            for (const item of accessories) {
              if (item.source === "inventario") {
                await supabase.rpc("descontar_stock", {
                  p_inventario_id: item.sourceId,
                  p_cantidad: item.quantity,
                });
              }
            }
          }
        }

        toast({ title: "¡Venta registrada con éxito!", description: "El contrato ha sido creado correctamente.", status: "success", duration: 5000, isClosable: true, position: "top" });
      }
    } catch (err) {
      console.error("Error al registrar la venta:", err);
      toast({ title: "Error al procesar la venta", description: "Ha ocurrido un error. Por favor, intente nuevamente.", status: "error", duration: 5000, isClosable: true, position: "top" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const pdfData = { ...mergedFormData, id: saleId };

  const handleTotalsChange = (newTotals) => {
    if (
      (newTotals.total_p_frame === 0 && formData.total_p_frame > 0) ||
      (newTotals.total_p_lens === 0 && formData.total_p_lens > 0)
    ) {
      return;
    }
    setTotals((prevTotals) => {
      if (
        prevTotals.total_p_frame !== newTotals.total_p_frame ||
        prevTotals.total_p_lens !== newTotals.total_p_lens ||
        prevTotals.frameName !== newTotals.frameName ||
        prevTotals.lensName !== newTotals.lensName
      ) {
        return { ...prevTotals, ...newTotals };
      }
      return prevTotals;
    });
    setFormData((prev) => {
      if (prev.discount_frame === 0 && prev.discount_lens === 0) {
        const newTotal = Number(prev.p_frame) + Number(prev.p_lens);
        if (prev.total !== newTotal) return { ...prev, total: newTotal };
        return prev;
      }
      let updates = {};
      if (prev.discount_frame > 0 && newTotals.total_p_frame !== undefined) {
        updates.total_p_frame = Number(newTotals.total_p_frame);
      }
      if (prev.discount_lens > 0 && newTotals.total_p_lens !== undefined) {
        updates.total_p_lens = Number(newTotals.total_p_lens);
      }
      if (
        (updates.total_p_frame !== undefined && prev.total_p_frame !== updates.total_p_frame) ||
        (updates.total_p_lens !== undefined && prev.total_p_lens !== updates.total_p_lens)
      ) {
        return { ...prev, ...updates };
      }
      return prev;
    });
  };

  const moduleSpecificButton = null;

  // ----- Estado de cada sección (para el check verde y el resumen cuando está cerrada) -----
  const isPatientComplete = !!saleData.patient_id;
  const isProductComplete = !!saleData.brand_id && !!saleData.lens_id && Number(formData.total) > 0;
  const isPaymentComplete = !!formData.payment_in && !!saleData.delivery_datetime;
  const isTermsComplete = !!formData.signature;

  const discountTotal = (Number(formData.discount_frame) || 0) + (Number(formData.discount_lens) || 0);
  const accessoriesTotal = accessories.reduce((sum, a) => sum + a.unit_price * a.quantity, 0);
  const grandTotal = (Number(formData.total) || 0) + accessoriesTotal;
  const downPayment = Number(formData.balance) || 0;
  const pendingBalance = Math.max(0, grandTotal - downPayment);

  const deliveryText = saleData.delivery_datetime
    ? new Date(saleData.delivery_datetime).toLocaleString("es-EC", { dateStyle: "medium", timeStyle: "short" })
    : "";

  let missingLabel = null;
  if (!formData.payment_in) missingLabel = "Falta seleccionar el método de pago";
  else if (!saleData.branchs_id) missingLabel = "Falta seleccionar la sucursal";
  else if (!formData.signature) missingLabel = "Falta la firma del cliente";

  const currentMeasure = filteredMeasures.length > 0 ? filteredMeasures[0] : null;
  const hasMeasures = !!currentMeasure;

  const sections = [
    {
      key: "patient",
      title: "Paciente y Medidas",
      icon: FiUser,
      isComplete: isPatientComplete,
      summary: isPatientComplete ? patientName || "Paciente seleccionado" : "Busca y selecciona un paciente",
      content: (
        <VStack spacing={4} w="full" align="stretch">
          <SearchPatient onFormDataChange={handlePatientDataChange} initialFormData={saleData} />
          <HStack justify="space-between" p={3} borderRadius="12px" bg={useColorModeValue("gray.50", "whiteAlpha.50")}>
            <HStack>
              <EyeIcon size={18} color={hasMeasures ? "#00A88E" : "#A0AEC0"} />
              <Text fontSize="sm" color={textColor}>
                {hasMeasures ? "Medidas registradas" : "Sin medidas registradas aún"}
              </Text>
              {hasMeasures && <Badge colorScheme="green" borderRadius="full">Listo</Badge>}
            </HStack>
            <Button
              size="sm"
              variant="outline"
              borderRadius="full"
              onClick={() => setIsMeasuresModalOpen(true)}
              isDisabled={!saleData.patient_id}
            >
              {hasMeasures ? "Ver / Editar medidas" : "Registrar medidas"}
            </Button>
          </HStack>
        </VStack>
      ),
    },
    {
      key: "product",
      title: "Producto y Precio",
      icon: FiShoppingCart,
      isComplete: isProductComplete,
      summary: isProductComplete
        ? `${totals.frameName || "Armazón"} · ${totals.lensName || "Luna"} · $${Number(formData.total || 0).toFixed(2)}`
        : "Elige el armazón, la luna y revisa el precio",
      content: (
        <VStack spacing={5} w="full" align="stretch">
          <TotalStep formData={formData} onFormDataChange={handleFormDataChange} />
          <SalesDetailsStep
            formData={formData}
            setFormData={setFormData}
            onTotalsChange={handleTotalsChange}
            accessories={accessories}
            setAccessories={setAccessories}
            onOpenAddMore={() => setIsAccessoriesModalOpen(true)}
          />
        </VStack>
      ),
    },
    {
      key: "payment",
      title: "Pago y Entrega",
      icon: FiCreditCard,
      isComplete: isPaymentComplete,
      summary: isPaymentComplete
        ? `${formData.payment_in} · Entrega: ${deliveryText || "sin definir"}`
        : "Define cómo paga y cuándo se entrega",
      content: (
        <VStack spacing={4} w="full" align="stretch">
          <HStack justify="space-between" p={3} borderRadius="12px" bg={useColorModeValue("gray.50", "whiteAlpha.50")}>
            <Text fontSize="sm" color={textColor}>
              {formData.payment_in ? `Pago: ${formData.payment_in}` : "Sin método de pago"}
              {formData.balance ? ` · Abono $${Number(formData.balance).toFixed(2)}` : ""}
            </Text>
            <Button size="sm" variant="outline" borderRadius="full" onClick={() => setIsPaymentModalOpen(true)}>
              Configurar pago
            </Button>
          </HStack>
          <DeliveryStep saleData={saleData} setSaleData={setSaleData} />
        </VStack>
      ),
    },
    {
      key: "observations",
      title: "Observaciones",
      icon: FiFileText,
      isComplete: !!formData.observation_text,
      isOptional: true,
      summary: "Notas adicionales sobre la venta (opcional)",
      content: <ObservationStep formData={formData} setFormData={setFormData} />,
    },
    {
      key: "terms",
      title: "Términos y Firma",
      icon: FiCheckCircle,
      isComplete: isTermsComplete,
      summary: isTermsComplete ? "Firmado" : "Falta la firma del cliente",
      content: (
        <TermsStep selectedBranch={branchName} formData={formData} setFormData={setFormData} />
      ),
    },
  ];

  return (
    <Box ref={salesRef} minH="100vh" bg={bgColor}>
      <SmartHeader moduleSpecificButton={moduleSpecificButton} />

      <Container maxW={containerMaxW} py={5} px={{ base: 3, md: 5 }}>
        <Fade in={true}>
          <VStack spacing={1} w="full" textAlign="center" mb={5}>
            <Heading size="md" fontWeight="800" bgGradient={`linear(to-r, ${accentColor}, teal.600)`} bgClip="text">
              Nueva Venta
            </Heading>
            <Text fontSize="sm" color={mutedTextColor}>
              Completa lo que necesites, en el orden que prefieras — el total se actualiza en vivo
            </Text>
          </VStack>
        </Fade>

        <Flex align="flex-start" gap={5} direction={{ base: "column", lg: "row" }}>
          <VStack align="stretch" spacing={3} flex="1" minW={0} pb={{ base: "90px", lg: 0 }}>
            {sections.map((section) => (
              <SaleSection
                key={section.key}
                icon={section.icon}
                title={section.title}
                summary={section.summary}
                isComplete={section.isComplete}
                isOptional={section.isOptional}
                isOpen={!!openSections[section.key]}
                onToggle={() => toggleSection(section.key)}
              >
                {section.content}
              </SaleSection>
            ))}
          </VStack>

          <SaleSummaryPanel
            patientName={patientName}
            frameName={totals.frameName}
            lensName={totals.lensName}
            accessories={accessories}
            total={grandTotal}
            discountTotal={discountTotal}
            downPayment={downPayment}
            pendingBalance={pendingBalance}
            deliveryText={deliveryText}
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
            missingLabel={missingLabel}
          />
        </Flex>

        {saleId && (
          <Pdf
            formData={pdfData}
            targetRef={salesRef}
            onPdfUploaded={async (pdfUrl) => {
              const { error } = await supabase.from("sales").update({ pdf_url: pdfUrl }).eq("id", saleId);
              if (error) console.error("Error actualizando pdf_url:", error);
            }}
          />
        )}
      </Container>

      <MeasuresModal
        isOpen={isMeasuresModalOpen}
        onClose={() => setIsMeasuresModalOpen(false)}
        patientId={saleData.patient_id}
        existingMeasure={currentMeasure}
        onSaved={handleMeasureSaved}
      />
      <AccessoriesModal
        isOpen={isAccessoriesModalOpen}
        onClose={() => setIsAccessoriesModalOpen(false)}
        accessories={accessories}
        setAccessories={setAccessories}
      />
      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        formData={formData}
        onFormDataChange={handleFormDataChange}
        grandTotal={grandTotal}
      />
    </Box>
  );
};

export default Sales;
