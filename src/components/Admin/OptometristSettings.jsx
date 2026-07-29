import { useEffect, useState } from "react";
import {
  Box,
  Container,
  Text,
  VStack,
  HStack,
  Input,
  Select,
  Button,
  useColorModeValue,
  useToast,
  Spinner,
  Avatar,
} from "@chakra-ui/react";
import { supabase } from "../../api/supabase";
import SmartHeader from "../header/SmartHeader";

const titleOptions = ["Opt.", "Dr.", "Dra.", "Lic.", "Lic. Óptico"];

/**
 * Configuración de cómo aparecen los optómetras (role_id = 2) en el
 * certificado de agudeza visual: título profesional (Opt., Dr., etc.),
 * cédula y registro SENECYT. Estos son los mismos datos que ya se imprimen
 * automáticamente al elegir al profesional en el selector de sello.
 */
const OptometristSettings = () => {
  const [optometrists, setOptometrists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);
  const toast = useToast();

  const cardBg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.600");
  const textColor = useColorModeValue("gray.800", "white");
  const subtitleColor = useColorModeValue("gray.500", "gray.400");

  useEffect(() => {
    loadOptometrists();
  }, []);

  const loadOptometrists = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("users")
      .select("id, firstname, lastname, ci, senescyt, professional_title")
      .eq("role_id", 2)
      .order("firstname", { ascending: true });

    if (error) {
      console.error("Error cargando optómetras:", error);
      toast({ title: "No se pudo cargar la lista", status: "error", duration: 4000 });
    } else {
      setOptometrists(data || []);
    }
    setLoading(false);
  };

  const updateField = (id, field, value) => {
    setOptometrists((prev) =>
      prev.map((o) => (o.id === id ? { ...o, [field]: value } : o))
    );
  };

  const handleSave = async (opt) => {
    setSavingId(opt.id);
    const { error } = await supabase
      .from("users")
      .update({
        professional_title: opt.professional_title,
        ci: opt.ci,
        senescyt: opt.senescyt,
      })
      .eq("id", opt.id);

    if (error) {
      console.error("Error guardando:", error);
      toast({ title: "No se pudo guardar", description: error.message, status: "error", duration: 5000 });
    } else {
      toast({ title: "Guardado", status: "success", duration: 2500 });
    }
    setSavingId(null);
  };

  return (
    <Box minH="100vh" bg={useColorModeValue("gray.50", "gray.900")}>
      <SmartHeader />
      <Container maxW="3xl" py={8}>
        <Text fontSize="xl" fontWeight="bold" color={textColor} mb={1}>
          Optómetras
        </Text>
        <Text fontSize="sm" color={subtitleColor} mb={6}>
          Define cómo aparece cada profesional en el certificado de agudeza visual:
          título (Opt., Dr., etc.), cédula y registro SENECYT.
        </Text>

        {loading ? (
          <Spinner />
        ) : optometrists.length === 0 ? (
          <Text color={subtitleColor}>No hay usuarios con rol de Optometra registrados todavía.</Text>
        ) : (
          <VStack align="stretch" spacing={4}>
            {optometrists.map((opt) => (
              <Box
                key={opt.id}
                bg={cardBg}
                border={`1px solid ${borderColor}`}
                borderRadius="16px"
                p={5}
              >
                <HStack mb={4}>
                  <Avatar size="sm" name={`${opt.firstname} ${opt.lastname}`} />
                  <Text fontWeight="bold" color={textColor}>
                    {opt.firstname} {opt.lastname}
                  </Text>
                </HStack>

                <HStack spacing={3} align="flex-end" flexWrap="wrap">
                  <Box minW="120px">
                    <Text fontSize="xs" color={subtitleColor} mb={1}>Título</Text>
                    <Select
                      size="sm"
                      borderRadius="lg"
                      value={opt.professional_title || "Opt."}
                      onChange={(e) => updateField(opt.id, "professional_title", e.target.value)}
                    >
                      {titleOptions.map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </Select>
                  </Box>
                  <Box flex="1" minW="140px">
                    <Text fontSize="xs" color={subtitleColor} mb={1}>Cédula</Text>
                    <Input
                      size="sm"
                      borderRadius="lg"
                      value={opt.ci || ""}
                      onChange={(e) => updateField(opt.id, "ci", e.target.value)}
                      placeholder="0102030405"
                    />
                  </Box>
                  <Box flex="1" minW="160px">
                    <Text fontSize="xs" color={subtitleColor} mb={1}>Registro SENECYT</Text>
                    <Input
                      size="sm"
                      borderRadius="lg"
                      value={opt.senescyt || ""}
                      onChange={(e) => updateField(opt.id, "senescyt", e.target.value)}
                      placeholder="1234-56-789012"
                    />
                  </Box>
                  <Button
                    size="sm"
                    bg="#00A88E"
                    color="white"
                    _hover={{ bg: "#00967f" }}
                    onClick={() => handleSave(opt)}
                    isLoading={savingId === opt.id}
                  >
                    Guardar
                  </Button>
                </HStack>

                <Text fontSize="xs" color={subtitleColor} mt={3}>
                  Así se verá: <b>{opt.professional_title || "Opt."} {opt.firstname} {opt.lastname}</b>
                  {opt.ci ? ` · C.I. ${opt.ci}` : ""}
                  {opt.senescyt ? ` · Reg. SENESCYT: ${opt.senescyt}` : ""}
                </Text>
              </Box>
            ))}
          </VStack>
        )}
      </Container>
    </Box>
  );
};

export default OptometristSettings;
