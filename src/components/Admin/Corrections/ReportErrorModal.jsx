import { useState } from "react";
import {
  Modal, ModalOverlay, ModalContent, ModalHeader, ModalCloseButton, ModalBody, ModalFooter,
  Button, Text, VStack, HStack, Box, Select, Textarea, Input, Icon, SimpleGrid, useToast,
  useColorModeValue, Image as ChakraImage, FormControl, FormLabel,
} from "@chakra-ui/react";
import { AlertTriangle, Camera, X } from "lucide-react";
import { supabase } from "../../../api/supabase";
import { useAuth } from "../../AuthContext";

const ACCENT = "#00A88E";
const MAX_FILES = 4;

export const REQUEST_TYPES = [
  { value: "abono", label: "Monto de abono equivocado" },
  { value: "metodo_pago", label: "Método de pago equivocado" },
  { value: "cliente", label: "Cliente / paciente equivocado" },
  { value: "precio_tratamiento", label: "Precio, descuento o tratamiento" },
  { value: "otro", label: "Otro" },
];

/**
 * El vendedor NO cambia nada: envía una solicitud al admin con lo que pasó
 * y evidencias (fotos). El admin la revisa y, si procede, hace la corrección.
 */
const ReportErrorModal = ({ isOpen, onClose, sale, onCreated }) => {
  const { user } = useAuth();
  const toast = useToast();
  const [type, setType] = useState("");
  const [expected, setExpected] = useState("");
  const [description, setDescription] = useState("");
  const [files, setFiles] = useState([]);
  const [saving, setSaving] = useState(false);

  const cardBg = useColorModeValue("white", "gray.800");
  const inputBg = useColorModeValue("gray.50", "gray.700");
  const borderColor = useColorModeValue("gray.200", "gray.600");

  const reset = () => { setType(""); setExpected(""); setDescription(""); setFiles([]); };
  const close = () => { reset(); onClose(); };

  const handleFiles = (e) => {
    const picked = Array.from(e.target.files || []).filter((f) => f.type.startsWith("image/"));
    setFiles((prev) => [...prev, ...picked].slice(0, MAX_FILES));
    e.target.value = "";
  };

  const handleSubmit = async () => {
    if (!type) return toast({ title: "Elige el tipo de error", status: "warning", duration: 3000 });
    if (description.trim().length < 10) return toast({ title: "Cuéntale al admin qué pasó (mínimo una frase).", status: "warning", duration: 3500 });

    setSaving(true);
    try {
      const urls = [];
      for (let i = 0; i < files.length; i++) {
        const f = files[i];
        const ext = (f.name.split(".").pop() || "jpg").toLowerCase();
        const path = `corrections/${sale.id}-${Date.now()}-${i}.${ext}`;
        const { error: upErr } = await supabase.storage.from("sales").upload(path, f, { contentType: f.type, upsert: false });
        if (upErr) throw upErr;
        const { data } = supabase.storage.from("sales").getPublicUrl(path);
        if (data?.publicUrl) urls.push(data.publicUrl);
      }

      const { error } = await supabase.from("correction_requests").insert([{
        sale_id: sale.id,
        patient_id: sale.patient_id || null,
        branchs_id: sale.branchs_id || user?.branch_id || null,
        requested_by: user?.id || null,
        requested_by_name: `${user?.firstname || user?.user_metadata?.firstname || ""} ${user?.lastname || user?.user_metadata?.lastname || ""}`.trim() || user?.email || "",
        request_type: type,
        expected_value: expected.trim() || null,
        description: description.trim(),
        evidence_urls: urls,
      }]);
      if (error) throw error;

      toast({ title: "Solicitud enviada", description: "El admin la revisará y te responderá.", status: "success", duration: 4000, isClosable: true });
      reset();
      onCreated?.();
      onClose();
    } catch (err) {
      console.error("Error enviando solicitud:", err);
      toast({ title: "No se pudo enviar", description: err.message || "Intenta de nuevo.", status: "error", duration: 5000, isClosable: true });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={close} isCentered size="lg" scrollBehavior="inside">
      <ModalOverlay backdropFilter="blur(2px)" />
      <ModalContent bg={cardBg} borderRadius="20px" overflow="hidden">
        <Box h="4px" bg="orange.400" />
        <ModalHeader fontSize="md">
          <HStack spacing={2}>
            <Icon as={AlertTriangle} color="orange.400" boxSize="18px" />
            <Text>Reportar error en la venta #{sale?.id}</Text>
          </HStack>
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <Text fontSize="sm" color="gray.500" mb={4}>
            No se modifica nada todavía: el admin recibe tu aviso, revisa las evidencias y hace el cambio si corresponde.
          </Text>
          <VStack spacing={4} align="stretch">
            <FormControl isRequired>
              <FormLabel fontSize="xs">¿Qué tipo de error fue?</FormLabel>
              <Select placeholder="Selecciona..." value={type} onChange={(e) => setType(e.target.value)} bg={inputBg} borderColor={borderColor} borderRadius="10px">
                {REQUEST_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </Select>
            </FormControl>
            <FormControl>
              <FormLabel fontSize="xs">¿Cómo debería quedar? (opcional)</FormLabel>
              <Input value={expected} onChange={(e) => setExpected(e.target.value)} placeholder="Ej: $50 por transferencia, no en efectivo" bg={inputBg} borderColor={borderColor} borderRadius="10px" />
            </FormControl>
            <FormControl isRequired>
              <FormLabel fontSize="xs">¿Qué pasó?</FormLabel>
              <Textarea rows={4} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe lo ocurrido con el mayor detalle posible." bg={inputBg} borderColor={borderColor} borderRadius="10px" />
            </FormControl>
            <Box>
              <FormLabel fontSize="xs">Evidencias (hasta {MAX_FILES} fotos)</FormLabel>
              <SimpleGrid columns={{ base: 2, sm: 4 }} spacing={3}>
                {files.map((f, i) => (
                  <Box key={i} position="relative" borderRadius="12px" overflow="hidden" border={`1px solid ${borderColor}`} h="90px">
                    <ChakraImage src={URL.createObjectURL(f)} w="100%" h="100%" objectFit="cover" />
                    <Box as="button" position="absolute" top="4px" right="4px" bg="blackAlpha.700" color="white" borderRadius="full" p="3px" onClick={() => setFiles(files.filter((_, j) => j !== i))}>
                      <X size={12} />
                    </Box>
                  </Box>
                ))}
                {files.length < MAX_FILES && (
                  <Box as="label" cursor="pointer" h="90px" borderRadius="12px" border="2px dashed" borderColor={borderColor} display="flex" flexDirection="column" alignItems="center" justifyContent="center" color="gray.500" _hover={{ borderColor: ACCENT, color: ACCENT }}>
                    <Camera size={20} />
                    <Text fontSize="xs" mt={1}>Agregar</Text>
                    <input type="file" accept="image/*" multiple hidden onChange={handleFiles} />
                  </Box>
                )}
              </SimpleGrid>
            </Box>
          </VStack>
        </ModalBody>
        <ModalFooter gap={2}>
          <Button variant="ghost" size="sm" onClick={close}>Cancelar</Button>
          <Button size="sm" bg={ACCENT} color="white" _hover={{ bg: "#00967f" }} borderRadius="10px" onClick={handleSubmit} isLoading={saving}>
            Enviar al admin
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default ReportErrorModal;
