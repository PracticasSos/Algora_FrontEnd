import { useState, useEffect } from "react";
import { supabase } from "../../../api/supabase";
import {
  Box,
  Textarea,
  Button,
  Heading,
  useToast,
  Flex,
  Text,
  Divider,
  useColorModeValue,
  Icon,
} from "@chakra-ui/react";
import { FaEdit, FaSave, FaUndo } from "react-icons/fa";
import SmartHeader from "../../header/SmartHeader";

const TermsManager = ({ tenantId }) => {
  const [terms, setTerms] = useState("");
  const [hasExistingTerms, setHasExistingTerms] = useState(false);
  const [editing, setEditing] = useState(true);
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  // Obtener tenant desde prop o directamente desde localStorage (síncrono y simple)
  const [resolvedTenantId] = useState(() => {
    if (tenantId) return tenantId;
    try {
      const stored = localStorage.getItem("user");
      if (stored) {
        const parsed = JSON.parse(stored);
        return parsed?.user_metadata?.tenant_id || parsed?.tenant_id || null;
      }
    } catch (err) {
      console.warn("No se pudo leer user de localStorage:", err);
    }
    return null;
  });

  const bgBox = useColorModeValue("white", "gray.800");
  const headingColor = useColorModeValue("teal.700", "teal.300");
  const borderColor = useColorModeValue("teal.300", "teal.600");
  const textColor = useColorModeValue("gray.700", "gray.100");
  const shadow = useColorModeValue("md", "dark-lg");

  useEffect(() => {
    const fetchTerms = async () => {
      if (!resolvedTenantId) {
        console.warn("No se encontró tenant_id en localStorage ni en props.");
        return;
      }
      const { data, error } = await supabase
        .from("terms")
        .select("terms_text")
        .eq("tenant_id", resolvedTenantId)
        .single();

      if (data?.terms_text) {
        setTerms(data.terms_text);
        setHasExistingTerms(true);
        setEditing(false);
      } else {
        setEditing(true);
      }

      if (error && error.code !== "PGRST116") console.error(error);
    };

    fetchTerms();
  }, [resolvedTenantId]);

  const handleSave = async () => {
    if (!resolvedTenantId) {
      toast({ title: "Error", description: "No se encontró el tenant_id", status: "error" });
      return;
    }

    if (!terms.trim()) {
      toast({ title: "Campo vacío", description: "Escribe los términos antes de guardar.", status: "warning" });
      return;
    }

    setLoading(true);

    const { error } = await supabase
      .from("terms")
      .upsert({ tenant_id: resolvedTenantId, terms_text: terms });

    setLoading(false);

    if (error) {
      toast({
        title: "Error al guardar",
        status: "error",
        description: error.message,
      });
    } else {
      toast({
        title: hasExistingTerms ? "Términos actualizados" : "Términos guardados",
        status: "success",
      });
      setEditing(false);
      setHasExistingTerms(true);
    }
  };

  const bgColor = useColorModeValue("gray.50", "gray.900");
  const cardBg = useColorModeValue("white", "gray.800");
  const moduleSpecificButton = null;

  return (
    <Box p={{ base: 2, md: 8 }} minH="100vh" bg={bgColor} color={textColor}>
      <SmartHeader moduleSpecificButton={moduleSpecificButton} />

      <Text color={textColor} textAlign="center" mb={5}>
        Aquí puedes registrar o modificar los términos y condiciones específicos de tu óptica.
      </Text>

      <Divider mb={5} />

      <Box p={6} borderRadius="2xl" boxShadow={shadow} bg={cardBg}>
        <Textarea
          value={terms}
          onChange={(e) => setTerms(e.target.value)}
          placeholder="Escribe los términos y condiciones de la óptica..."
          isDisabled={!editing}
          minH="300px"
          fontSize="md"
          color={textColor}
          borderColor={borderColor}
          borderWidth="1.5px"
          borderRadius="xl"
          p={4}
          _focus={{
            borderColor: "teal.400",
            boxShadow: "0 0 0 2px rgba(56,178,172,0.4)",
          }}
          transition="all 0.2s"
          mb={4}
        />

        <Flex justify="center" gap={4}>
          {!editing ? (
            <Button leftIcon={<FaEdit />} colorScheme="teal" variant="solid" onClick={() => setEditing(true)}>
              Editar términos
            </Button>
          ) : (
            <>
              <Button leftIcon={<FaSave />} colorScheme="teal" variant="solid" isLoading={loading} onClick={handleSave}>
                {hasExistingTerms ? "Actualizar" : "Guardar"}
              </Button>
              <Button leftIcon={<FaUndo />} variant="outline" colorScheme="gray" onClick={() => setEditing(false)}>
                Cancelar
              </Button>
            </>
          )}
        </Flex>
      </Box>
    </Box>
  );
};

export default TermsManager;
// ...existing code...