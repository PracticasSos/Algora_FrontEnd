import { useState } from "react";
import { supabase } from "../../api/supabase";
import {
  Box, Button, Container, Heading, Text, FormControl, FormLabel, Input,
  Flex, HStack, VStack, Icon, useColorModeValue, useToast,
} from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";
import { Eye, List, Aperture } from "lucide-react";
import SmartHeader from "../header/SmartHeader";

const ACCENT = "#00A88E";

const RegisterLens = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const [formData, setFormData] = useState({ lens_type: "", lens_price: "" });
  const [isSaving, setIsSaving] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleReset = () => setFormData({ lens_type: "", lens_price: "" });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.lens_type.trim()) {
      toast({ title: "Falta el nombre de la luna", status: "warning", duration: 4000, isClosable: true });
      return;
    }
    if (!formData.lens_price || Number(formData.lens_price) <= 0) {
      toast({ title: "Precio inválido", description: "Ingresa un precio mayor a 0.", status: "warning", duration: 4000, isClosable: true });
      return;
    }

    setIsSaving(true);
    const { error } = await supabase.from("lens").insert([{ lens_type: formData.lens_type.trim(), lens_price: Number(formData.lens_price) }]);
    setIsSaving(false);

    if (error) {
      toast({ title: "Error", description: "Ocurrió un error: " + error.message, status: "error", duration: 5000, isClosable: true });
    } else {
      toast({ title: "Luna registrada", description: "Se guardó correctamente.", status: "success", duration: 4000, isClosable: true });
      handleReset();
    }
  };

  const cardBg = useColorModeValue("white", "gray.700");
  const inputBg = useColorModeValue("gray.50", "gray.700");
  const borderColor = useColorModeValue("gray.200", "gray.600");
  const subtitleColor = useColorModeValue("gray.500", "gray.400");

  const moduleSpecificButton = (
    <Button
      onClick={() => navigate("/list-lens")}
      bg={ACCENT}
      color="white"
      size="sm"
      borderRadius="full"
      px={5}
      fontWeight="bold"
      leftIcon={<List size={14} />}
      _hover={{ bg: "#00967f" }}
    >
      Listar Lunas
    </Button>
  );

  return (
    <Box minHeight="100vh" bgGradient={useColorModeValue("linear(to-br, gray.50, teal.50)", "linear(to-br, gray.900, #0d1f1c)")}>
      <SmartHeader moduleSpecificButton={moduleSpecificButton} />

      <Container maxW="520px" py={8} px={{ base: 3, md: 6 }}>
        <Box
          borderRadius="24px"
          bg={cardBg}
          border={`1px solid ${borderColor}`}
          boxShadow={useColorModeValue("0 20px 45px -20px rgba(0,168,142,0.25)", "0 20px 45px -20px rgba(0,168,142,0.35)")}
          overflow="hidden"
        >
          <Box h="5px" bgGradient="linear(to-r, #00A88E, #2DD4BF, #00A88E)" />
          <Box p={{ base: 5, md: 8 }}>
            <HStack spacing={3} mb={6}>
              <Flex align="center" justify="center" boxSize="44px" borderRadius="14px" bgGradient="linear(to-br, #00A88E, #00786A)" color="white" boxShadow="0 6px 16px -4px rgba(0,168,142,0.5)">
                <Icon as={Aperture} boxSize="20px" />
              </Flex>
              <VStack align="start" spacing={0}>
                <Heading size="lg" fontWeight="800" color={useColorModeValue("gray.800", "white")} letterSpacing="tight">
                  Registrar Luna
                </Heading>
                <Text fontSize="xs" color={subtitleColor}>Agrega un nuevo tipo de luna al catálogo</Text>
              </VStack>
            </HStack>

            <Box as="form" onSubmit={handleSubmit}>
              <VStack spacing={4} align="stretch" mb={6}>
                <FormControl isRequired>
                  <FormLabel fontSize="xs" color={subtitleColor}>Tipo de luna</FormLabel>
                  <Input
                    name="lens_type"
                    value={formData.lens_type}
                    onChange={handleChange}
                    placeholder="Ej. Monofocal CR39 Antireflejo"
                    borderRadius="10px"
                    bg={inputBg}
                    borderColor={borderColor}
                    _focus={{ borderColor: ACCENT, boxShadow: `0 0 0 1px ${ACCENT}` }}
                  />
                </FormControl>
                <FormControl isRequired>
                  <FormLabel fontSize="xs" color={subtitleColor}>Precio</FormLabel>
                  <Input
                    name="lens_price"
                    type="number"
                    value={formData.lens_price}
                    onChange={handleChange}
                    placeholder="0.00"
                    borderRadius="10px"
                    bg={inputBg}
                    borderColor={borderColor}
                    _focus={{ borderColor: ACCENT, boxShadow: `0 0 0 1px ${ACCENT}` }}
                  />
                </FormControl>
              </VStack>

              <Flex justify="flex-end" gap={3}>
                <Button variant="ghost" onClick={handleReset}>Limpiar</Button>
                <Button type="submit" bg={ACCENT} color="white" _hover={{ bg: "#00967f" }} borderRadius="12px" px={8} isLoading={isSaving}>
                  Guardar
                </Button>
              </Flex>
            </Box>
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

export default RegisterLens;
