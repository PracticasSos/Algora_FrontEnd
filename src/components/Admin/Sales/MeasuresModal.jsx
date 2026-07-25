import { useEffect, useState } from "react";
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  Button,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Input,
  Box,
  VStack,
  HStack,
  Text,
  SimpleGrid,
  FormControl,
  FormLabel,
  useColorModeValue,
  useToast,
  Icon,
} from "@chakra-ui/react";
import { FaEye } from "react-icons/fa";
import { supabase } from "../../../api/supabase";

const fieldLabels = {
  sphere: "Esfera",
  cylinder: "Cilindro",
  axis: "Eje",
  prism: "Prisma",
  add: "ADD",
  av_vl: "AV VL",
  av_vp: "AV VP",
  dnp: "DNP",
  alt: "ALT",
};

const emptyMeasure = () => {
  const base = {};
  Object.keys(fieldLabels).forEach((field) => {
    base[`${field}_right`] = "";
    base[`${field}_left`] = "";
  });
  return base;
};

/**
 * Modal para ver y editar las medidas oftalmológicas del paciente.
 * A diferencia del componente viejo (Measures.jsx), esto SÍ guarda los
 * cambios en la tabla rx_final (antes solo se veían, nunca se persistían).
 */
const MeasuresModal = ({ isOpen, onClose, patientId, existingMeasure, onSaved }) => {
  const [values, setValues] = useState(emptyMeasure());
  const [isSaving, setIsSaving] = useState(false);
  const toast = useToast();

  useEffect(() => {
    if (isOpen) {
      const base = emptyMeasure();
      if (existingMeasure) {
        Object.keys(base).forEach((key) => {
          if (existingMeasure[key] !== undefined && existingMeasure[key] !== null) {
            base[key] = existingMeasure[key];
          }
        });
      }
      setValues(base);
    }
  }, [isOpen, existingMeasure]);

  const handleChange = (key, value) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    if (!patientId) {
      toast({ title: "Selecciona primero un paciente", status: "warning", duration: 3000 });
      return;
    }
    setIsSaving(true);
    try {
      let savedRow;
      if (existingMeasure?.id) {
        const { data, error } = await supabase
          .from("rx_final")
          .update(values)
          .eq("id", existingMeasure.id)
          .select()
          .single();
        if (error) throw error;
        savedRow = data;
      } else {
        const { data, error } = await supabase
          .from("rx_final")
          .insert([{ patient_id: patientId, ...values }])
          .select()
          .single();
        if (error) throw error;
        savedRow = data;
      }
      toast({ title: "Medidas guardadas", status: "success", duration: 3000 });
      onSaved(savedRow);
      onClose();
    } catch (err) {
      console.error("Error guardando medidas:", err);
      toast({
        title: "No se pudo guardar",
        description: err.message,
        status: "error",
        duration: 5000,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const bgColor = useColorModeValue("white", "gray.800");
  const inputBg = useColorModeValue("gray.50", "gray.700");
  const borderColor = useColorModeValue("gray.200", "gray.600");
  const eyeColors = {
    right: useColorModeValue("blue.500", "blue.300"),
    left: useColorModeValue("pink.500", "pink.300"),
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size={{ base: "full", md: "3xl" }} isCentered>
      <ModalOverlay />
      <ModalContent bg={bgColor} borderRadius={{ base: 0, md: "20px" }}>
        <ModalHeader fontSize="md">Medidas oftalmológicas</ModalHeader>
        <ModalCloseButton />
        <ModalBody pb={6}>
          {/* Tabla en escritorio */}
          <Box display={{ base: "none", md: "block" }} overflowX="auto">
            <Table size="sm">
              <Thead>
                <Tr>
                  <Th></Th>
                  {Object.keys(fieldLabels).map((field) => (
                    <Th key={field} textAlign="center" fontSize="xs">
                      {fieldLabels[field]}
                    </Th>
                  ))}
                </Tr>
              </Thead>
              <Tbody>
                {[
                  { side: "OD", prefix: "right" },
                  { side: "OI", prefix: "left" },
                ].map(({ side, prefix }) => (
                  <Tr key={prefix}>
                    <Td fontWeight="bold">
                      <HStack spacing={1}>
                        <Icon as={FaEye} color={eyeColors[prefix]} boxSize={3.5} />
                        <Text color={eyeColors[prefix]} fontSize="sm">{side}</Text>
                      </HStack>
                    </Td>
                    {Object.keys(fieldLabels).map((field) => (
                      <Td key={field} p={1}>
                        <Input
                          size="sm"
                          textAlign="center"
                          borderRadius="md"
                          bg={inputBg}
                          borderColor={borderColor}
                          value={values[`${field}_${prefix}`] || ""}
                          onChange={(e) => handleChange(`${field}_${prefix}`, e.target.value)}
                        />
                      </Td>
                    ))}
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </Box>

          {/* Tarjetas en celular */}
          <VStack spacing={4} display={{ base: "flex", md: "none" }} align="stretch">
            {["OD", "OI"].map((eye) => {
              const prefix = eye === "OD" ? "right" : "left";
              return (
                <Box key={eye} p={3} borderRadius="14px" border={`1px solid ${borderColor}`}>
                  <HStack mb={2}>
                    <Icon as={FaEye} color={eyeColors[prefix]} />
                    <Text fontWeight="bold" color={eyeColors[prefix]}>
                      {eye === "OD" ? "Ojo Derecho" : "Ojo Izquierdo"}
                    </Text>
                  </HStack>
                  <SimpleGrid columns={3} spacing={2}>
                    {Object.keys(fieldLabels).map((field) => (
                      <FormControl key={field}>
                        <FormLabel fontSize="10px" mb={0.5}>{fieldLabels[field]}</FormLabel>
                        <Input
                          size="sm"
                          textAlign="center"
                          borderRadius="md"
                          bg={inputBg}
                          borderColor={borderColor}
                          value={values[`${field}_${prefix}`] || ""}
                          onChange={(e) => handleChange(`${field}_${prefix}`, e.target.value)}
                        />
                      </FormControl>
                    ))}
                  </SimpleGrid>
                </Box>
              );
            })}
          </VStack>
        </ModalBody>
        <ModalFooter gap={3}>
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button bg="#00A88E" color="white" _hover={{ bg: "#00967f" }} onClick={handleSave} isLoading={isSaving}>
            Guardar medidas
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default MeasuresModal;
