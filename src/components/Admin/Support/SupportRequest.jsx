import { useEffect, useState, useCallback } from "react";
import { Box, Flex, Heading, Text, Input, Textarea, Button, Badge, VStack, useToast, useColorModeValue, FormControl, FormLabel } from "@chakra-ui/react";
import { LifeBuoy } from "lucide-react";
import { supabase } from "../../../api/supabase";
import { useAuth } from "../../AuthContext";

const ACCENT = "#00A88E";
const STATUS = { open: ["Abierta", "orange"], in_progress: ["En proceso", "blue"], closed: ["Resuelta", "green"] };

/** El Admin de la óptica pide ayuda a soporte; ve sus solicitudes y las respuestas. */
const SupportRequest = () => {
  const { user } = useAuth();
  const toast = useToast();
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [tickets, setTickets] = useState([]);
  const [saving, setSaving] = useState(false);

  const cardBg = useColorModeValue("white", "gray.800");
  const border = useColorModeValue("gray.200", "gray.700");
  const muted = useColorModeValue("gray.500", "gray.400");
  const inputBg = useColorModeValue("gray.50", "gray.700");

  const load = useCallback(async () => {
    const { data } = await supabase.from("support_tickets").select("*").order("created_at", { ascending: false });
    setTickets(data || []);
  }, []);
  useEffect(() => { load(); }, [load]);

  const send = async () => {
    if (subject.trim().length < 3 || description.trim().length < 10) {
      return toast({ title: "Completa el asunto y describe el problema", status: "warning", duration: 3000 });
    }
    setSaving(true);
    const { error } = await supabase.from("support_tickets").insert([{
      subject: subject.trim(),
      description: description.trim(),
      created_by_name: `${user?.firstname || ""} ${user?.lastname || ""}`.trim(),
      created_by_email: user?.email || "",
    }]);
    setSaving(false);
    if (error) return toast({ title: "No se pudo enviar", description: error.message, status: "error" });
    toast({ title: "Solicitud enviada a soporte", status: "success", duration: 3000 });
    setSubject(""); setDescription(""); load();
  };

  return (
    <Box p={{ base: 4, md: 8 }} maxW="900px" mx="auto">
      <Box h="4px" borderRadius="full" bgGradient="linear(to-r, #00A88E, #2DD4BF, #00A88E)" mb={6} />
      <Flex align="center" gap={3} mb={1}>
        <Flex boxSize="44px" borderRadius="14px" bg="#E6FBF6" color={ACCENT} align="center" justify="center"><LifeBuoy size={20} /></Flex>
        <Heading size="lg">Soporte</Heading>
      </Flex>
      <Text color={muted} mb={6}>¿Algo no funciona o necesitas ayuda con el sistema? Cuéntanos y te responderemos aquí mismo.</Text>

      <Box bg={cardBg} border="1px solid" borderColor={border} borderRadius="24px" p={5} mb={6}>
        <VStack spacing={4} align="stretch">
          <FormControl><FormLabel fontSize="xs">Asunto</FormLabel><Input value={subject} onChange={(e) => setSubject(e.target.value)} bg={inputBg} borderRadius="10px" placeholder="Ej: No puedo registrar un egreso" /></FormControl>
          <FormControl><FormLabel fontSize="xs">¿Qué está pasando?</FormLabel><Textarea rows={4} value={description} onChange={(e) => setDescription(e.target.value)} bg={inputBg} borderRadius="10px" placeholder="Describe el problema y en qué pantalla ocurre." /></FormControl>
          <Button alignSelf="flex-end" bg={ACCENT} color="white" _hover={{ bg: "#00967f" }} borderRadius="full" onClick={send} isLoading={saving}>Enviar a soporte</Button>
        </VStack>
      </Box>

      <Text fontWeight="bold" mb={3}>Mis solicitudes</Text>
      {tickets.length === 0 ? <Text fontSize="sm" color={muted}>Aún no has enviado solicitudes.</Text> : tickets.map((t) => (
        <Box key={t.id} bg={cardBg} border="1px solid" borderColor={border} borderRadius="18px" p={4} mb={3}>
          <Flex justify="space-between" align="center" mb={1}>
            <Text fontWeight="semibold">{t.subject}</Text>
            <Badge colorScheme={STATUS[t.status][1]} borderRadius="full" px={2}>{STATUS[t.status][0]}</Badge>
          </Flex>
          <Text fontSize="sm" color={muted} whiteSpace="pre-wrap">{t.description}</Text>
          {t.response && <Box mt={3} p={3} bg={inputBg} borderRadius="12px"><Text fontSize="xs" color={muted}>Respuesta de soporte</Text><Text fontSize="sm" whiteSpace="pre-wrap">{t.response}</Text></Box>}
        </Box>
      ))}
    </Box>
  );
};

export default SupportRequest;
