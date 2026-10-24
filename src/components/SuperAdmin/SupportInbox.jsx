import { useEffect, useState, useCallback } from "react";
import { Box, Flex, Heading, Text, Textarea, Button, Badge, HStack, Select, useToast, useColorModeValue } from "@chakra-ui/react";
import { supabase } from "../../api/supabase";

const ACCENT = "#00A88E";
const STATUS = { open: ["Abierta", "orange"], in_progress: ["En proceso", "blue"], closed: ["Resuelta", "green"] };
const fmt = (d) => (d ? new Date(d).toLocaleString("es-EC", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }) : "");

/** Bandeja del SuperAdmin: solicitudes de soporte de todas las ópticas. */
const SupportInbox = () => {
  const toast = useToast();
  const [tickets, setTickets] = useState([]);
  const [tenants, setTenants] = useState({});
  const [filter, setFilter] = useState("open");
  const [drafts, setDrafts] = useState({});
  const cardBg = useColorModeValue("white", "gray.800");
  const border = useColorModeValue("gray.200", "gray.700");
  const muted = useColorModeValue("gray.500", "gray.400");
  const inputBg = useColorModeValue("gray.50", "gray.700");

  const load = useCallback(async () => {
    const { data } = await supabase.from("support_tickets").select("*").order("created_at", { ascending: false });
    setTickets(data || []);
    const { data: t } = await supabase.from("tenants").select("id,name");
    setTenants(Object.fromEntries((t || []).map((x) => [x.id, x.name])));
  }, []);
  useEffect(() => { load(); }, [load]);

  const update = async (t, status) => {
    const response = (drafts[t.id] ?? t.response ?? "").trim();
    const { error } = await supabase.from("support_tickets").update({ status, response: response || null, responded_at: response ? new Date().toISOString() : t.responded_at }).eq("id", t.id);
    if (error) return toast({ title: "No se pudo guardar", description: error.message, status: "error" });
    toast({ title: "Actualizado", status: "success", duration: 2000 });
    load();
  };

  const visible = tickets.filter((t) => filter === "all" || t.status === filter);

  return (
    <Box p={{ base: 4, md: 8 }} maxW="1000px" mx="auto">
      <Box h="4px" borderRadius="full" bgGradient="linear(to-r, #00A88E, #2DD4BF, #00A88E)" mb={6} />
      <Flex justify="space-between" align="center" mb={5} gap={3} wrap="wrap">
        <Box><Heading size="lg">Soporte</Heading><Text color={muted} fontSize="sm">Solicitudes de ayuda de las ópticas.</Text></Box>
        <Select maxW="180px" size="sm" borderRadius="full" value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="open">Abiertas</option><option value="in_progress">En proceso</option><option value="closed">Resueltas</option><option value="all">Todas</option>
        </Select>
      </Flex>
      {visible.length === 0 ? <Text color={muted}>No hay solicitudes en esta vista.</Text> : visible.map((t) => (
        <Box key={t.id} bg={cardBg} border="1px solid" borderColor={border} borderRadius="20px" p={4} mb={3}>
          <Flex justify="space-between" align="start" gap={3} mb={1}>
            <Box>
              <Text fontWeight="bold">{t.subject}</Text>
              <Text fontSize="xs" color={muted}>{tenants[t.tenant_id] || "Óptica"} · {t.created_by_name} · {t.created_by_email} · {fmt(t.created_at)}</Text>
            </Box>
            <Badge colorScheme={STATUS[t.status][1]} borderRadius="full" px={2}>{STATUS[t.status][0]}</Badge>
          </Flex>
          <Text fontSize="sm" whiteSpace="pre-wrap" mb={3}>{t.description}</Text>
          <Textarea rows={2} bg={inputBg} borderRadius="10px" placeholder="Escribe tu respuesta..." value={drafts[t.id] ?? t.response ?? ""} onChange={(e) => setDrafts({ ...drafts, [t.id]: e.target.value })} />
          <HStack mt={3} justify="flex-end">
            {t.status === "open" && <Button size="sm" variant="outline" onClick={() => update(t, "in_progress")}>Marcar en proceso</Button>}
            {t.status !== "closed" && <Button size="sm" bg={ACCENT} color="white" _hover={{ bg: "#00967f" }} onClick={() => update(t, "closed")}>Responder y cerrar</Button>}
          </HStack>
        </Box>
      ))}
    </Box>
  );
};

export default SupportInbox;
