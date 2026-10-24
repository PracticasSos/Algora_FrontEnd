import { useEffect, useState, useCallback } from "react";
import { Box, Flex, Text, Badge, Button, HStack, VStack, Link, Image as ChakraImage, useColorModeValue } from "@chakra-ui/react";
import { AlertTriangle } from "lucide-react";
import { supabase } from "../../../api/supabase";
import { REQUEST_TYPES } from "./ReportErrorModal";
import ReportErrorModal from "./ReportErrorModal";

const STATUS = { pending: ["Pendiente", "orange"], approved: ["Aprobada", "green"], rejected: ["Rechazada", "red"] };

/**
 * Botón "Reportar error" + historial de solicitudes de ESTA venta.
 * Lo ven vendedor/optómetra (para reportar y seguir su estado) y el admin
 * (para ver qué se pidió mientras corrige).
 */
const SaleCorrectionPanel = ({ sale, canReport = true }) => {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const bg = useColorModeValue("orange.50", "rgba(237,137,54,0.08)");
  const border = useColorModeValue("orange.200", "orange.700");

  const load = useCallback(async () => {
    if (!sale?.id) return;
    const { data } = await supabase.from("correction_requests").select("*").eq("sale_id", sale.id).order("created_at", { ascending: false });
    setItems(data || []);
  }, [sale?.id]);

  useEffect(() => { load(); }, [load]);

  return (
    <Box mb={5}>
      {canReport && (
        <Button size="sm" variant="outline" colorScheme="orange" leftIcon={<AlertTriangle size={14} />} onClick={() => setOpen(true)}>
          Reportar error al admin
        </Button>
      )}
      {items.length > 0 && (
        <VStack align="stretch" spacing={2} mt={3}>
          {items.map((r) => (
            <Box key={r.id} bg={bg} border="1px solid" borderColor={border} borderRadius="14px" p={3}>
              <Flex justify="space-between" align="center" gap={2} mb={1}>
                <Text fontSize="sm" fontWeight="semibold">{REQUEST_TYPES.find((t) => t.value === r.request_type)?.label || r.request_type}</Text>
                <Badge colorScheme={STATUS[r.status][1]} borderRadius="full" px={2}>{STATUS[r.status][0]}</Badge>
              </Flex>
              <Text fontSize="xs" whiteSpace="pre-wrap">{r.description}</Text>
              {r.evidence_urls?.length > 0 && (
                <HStack mt={2} spacing={2}>
                  {r.evidence_urls.map((u) => <Link key={u} href={u} isExternal><ChakraImage src={u} boxSize="44px" objectFit="cover" borderRadius="8px" /></Link>)}
                </HStack>
              )}
              {r.admin_response && <Text fontSize="xs" mt={2}><b>Respuesta del admin:</b> {r.admin_response}</Text>}
            </Box>
          ))}
        </VStack>
      )}
      <ReportErrorModal isOpen={open} onClose={() => setOpen(false)} sale={sale} onCreated={load} />
    </Box>
  );
};

export default SaleCorrectionPanel;
