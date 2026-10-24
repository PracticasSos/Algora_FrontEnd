import { useEffect, useMemo, useState } from "react";
import {
  Box, Flex, Text, Heading, Badge, Button, HStack, VStack, SimpleGrid, Select, Textarea, Icon, Skeleton,
  Modal, ModalOverlay, ModalContent, ModalHeader, ModalCloseButton, ModalBody, ModalFooter,
  Image as ChakraImage, Link, useToast, useColorModeValue, Tabs, TabList, Tab,
} from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";
import { Inbox, CheckCircle2, XCircle, ExternalLink, AlertTriangle } from "lucide-react";
import { supabase } from "../../../api/supabase";
import { useAuth } from "../../AuthContext";
import { REQUEST_TYPES } from "./ReportErrorModal";

const ACCENT = "#00A88E";
const STATUS = {
  pending: { label: "Pendiente", color: "orange" },
  approved: { label: "Aprobada", color: "green" },
  rejected: { label: "Rechazada", color: "red" },
};
const typeLabel = (v) => REQUEST_TYPES.find((t) => t.value === v)?.label || v;
const fmtDate = (d) => (d ? new Date(d).toLocaleString("es-EC", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }) : "");
const money = (v) => `$${(Number(v) || 0).toFixed(2)}`;

const CorrectionRequests = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [requests, setRequests] = useState([]);
  const [sales, setSales] = useState({});
  const [branches, setBranches] = useState({});
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState(0); // 0 pendientes, 1 aprobadas, 2 rechazadas, 3 todas
  const [branchFilter, setBranchFilter] = useState("");
  const [selected, setSelected] = useState(null);
  const [response, setResponse] = useState("");
  const [saving, setSaving] = useState(false);

  const cardBg = useColorModeValue("white", "gray.800");
  const border = useColorModeValue("gray.200", "gray.700");
  const muted = useColorModeValue("gray.500", "gray.400");
  const rowHover = useColorModeValue("gray.50", "whiteAlpha.100");
  const inputBg = useColorModeValue("gray.50", "gray.700");

  const isAdmin = [1, 4].includes(Number(user?.role_id));

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("correction_requests").select("*").order("created_at", { ascending: false });
    if (error) {
      toast({ title: "No se pudieron cargar las solicitudes", description: error.message, status: "error" });
      setRequests([]); setLoading(false); return;
    }
    setRequests(data || []);
    const ids = [...new Set((data || []).map((r) => r.sale_id))];
    if (ids.length) {
      const { data: s } = await supabase.from("sales").select("id,total,balance,credit,patient_id,patients(pt_firstname,pt_lastname)").in("id", ids);
      setSales(Object.fromEntries((s || []).map((x) => [x.id, x])));
    }
    const { data: b } = await supabase.from("branchs").select("id,name");
    setBranches(Object.fromEntries((b || []).map((x) => [x.id, x.name])));
    setLoading(false);
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  const counts = useMemo(() => ({
    pending: requests.filter((r) => r.status === "pending").length,
    approved: requests.filter((r) => r.status === "approved").length,
    rejected: requests.filter((r) => r.status === "rejected").length,
  }), [requests]);

  const visible = useMemo(() => {
    const st = ["pending", "approved", "rejected", null][tab];
    return requests.filter((r) => (!st || r.status === st) && (!branchFilter || String(r.branchs_id) === String(branchFilter)));
  }, [requests, tab, branchFilter]);

  const patientName = (r) => {
    const p = sales[r.sale_id]?.patients;
    return p ? `${p.pt_firstname || ""} ${p.pt_lastname || ""}`.trim() : "Paciente";
  };

  const resolve = async (status, goFix) => {
    if (status === "rejected" && response.trim().length < 5) {
      return toast({ title: "Escribe el motivo del rechazo", status: "warning", duration: 3000 });
    }
    setSaving(true);
    const { error } = await supabase.from("correction_requests").update({
      status,
      admin_response: response.trim() || null,
      resolved_by: user?.id || null,
      resolved_by_name: `${user?.firstname || ""} ${user?.lastname || ""}`.trim() || user?.email || "",
      resolved_at: new Date().toISOString(),
    }).eq("id", selected.id);
    setSaving(false);
    if (error) return toast({ title: "No se pudo guardar", description: error.message, status: "error" });

    toast({ title: status === "approved" ? "Solicitud aprobada" : "Solicitud rechazada", status: "success", duration: 3000 });
    const sale = sales[selected.sale_id];
    const target = goFix && sale ? `/history-clinic/patient-history/${sale.patient_id}/sales-history/${sale.id}` : null;
    setSelected(null); setResponse("");
    if (target) navigate(target, { state: { startEditing: true } });
    else load();
  };

  if (!isAdmin) return <Box p={8}><Text>Esta pantalla es solo para administradores.</Text></Box>;

  return (
    <Box p={{ base: 4, md: 8 }} maxW="1100px" mx="auto">
      <Box h="4px" borderRadius="full" bgGradient="linear(to-r, #00A88E, #2DD4BF, #00A88E)" mb={6} />
      <Flex justify="space-between" align={{ base: "start", md: "center" }} direction={{ base: "column", md: "row" }} gap={3} mb={5}>
        <Box>
          <Heading size="lg">Solicitudes de corrección</Heading>
          <Text color={muted} fontSize="sm">Errores que reportan los vendedores y optómetras para que los revises.</Text>
        </Box>
        <Select maxW="220px" size="sm" borderRadius="full" placeholder="Todas las sucursales" value={branchFilter} onChange={(e) => setBranchFilter(e.target.value)}>
          {Object.entries(branches).map(([id, name]) => <option key={id} value={id}>{name}</option>)}
        </Select>
      </Flex>

      <SimpleGrid columns={3} spacing={4} mb={5}>
        {[["Pendientes", counts.pending, "orange.400"], ["Aprobadas", counts.approved, ACCENT], ["Rechazadas", counts.rejected, "red.400"]].map(([l, v, c]) => (
          <Box key={l} bg={cardBg} border="1px solid" borderColor={border} borderRadius="20px" p={4}>
            <Text fontSize="xs" color={muted}>{l}</Text>
            <Text fontSize="3xl" fontWeight="extrabold" color={c}>{v}</Text>
          </Box>
        ))}
      </SimpleGrid>

      <Tabs index={tab} onChange={setTab} variant="soft-rounded" colorScheme="teal" size="sm" mb={4}>
        <TabList gap={1} flexWrap="wrap">
          <Tab>Pendientes</Tab><Tab>Aprobadas</Tab><Tab>Rechazadas</Tab><Tab>Todas</Tab>
        </TabList>
      </Tabs>

      <Box bg={cardBg} border="1px solid" borderColor={border} borderRadius="24px" overflow="hidden">
        {loading ? <Skeleton h="200px" /> : visible.length === 0 ? (
          <VStack py={12} spacing={2} color={muted}>
            <Icon as={Inbox} boxSize="32px" />
            <Text fontSize="sm">No hay solicitudes en esta vista.</Text>
          </VStack>
        ) : visible.map((r) => (
          <Flex key={r.id} align="center" justify="space-between" gap={3} px={5} py={4} cursor="pointer" _hover={{ bg: rowHover }} borderBottom="1px solid" borderColor={border} onClick={() => { setSelected(r); setResponse(r.admin_response || ""); }}>
            <Box minW={0}>
              <HStack spacing={2} mb={1} flexWrap="wrap">
                <Badge colorScheme={STATUS[r.status].color} borderRadius="full" px={2}>{STATUS[r.status].label}</Badge>
                <Text fontWeight="semibold" fontSize="sm">{typeLabel(r.request_type)}</Text>
              </HStack>
              <Text fontSize="sm" noOfLines={1}>{patientName(r)} · Venta #{r.sale_id}</Text>
              <Text fontSize="xs" color={muted} noOfLines={1}>{r.description}</Text>
            </Box>
            <Box textAlign="right" flexShrink={0}>
              <Text fontSize="xs" fontWeight="semibold">{r.requested_by_name || "—"}</Text>
              <Text fontSize="xs" color={muted}>{branches[r.branchs_id] || ""}</Text>
              <Text fontSize="xs" color={muted}>{fmtDate(r.created_at)}</Text>
            </Box>
          </Flex>
        ))}
      </Box>

      <Modal isOpen={!!selected} onClose={() => setSelected(null)} isCentered size="xl" scrollBehavior="inside">
        <ModalOverlay backdropFilter="blur(2px)" />
        {selected && (
          <ModalContent bg={cardBg} borderRadius="20px" overflow="hidden">
            <Box h="4px" bg={selected.status === "pending" ? "orange.400" : STATUS[selected.status].color + ".400"} />
            <ModalHeader fontSize="md">
              <HStack spacing={2}>
                <Icon as={AlertTriangle} color="orange.400" boxSize="18px" />
                <Text>{typeLabel(selected.request_type)} · Venta #{selected.sale_id}</Text>
              </HStack>
            </ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <SimpleGrid columns={{ base: 1, sm: 2 }} spacing={3} mb={4}>
                <Box bg={inputBg} borderRadius="12px" p={3}><Text fontSize="xs" color={muted}>Paciente</Text><Text fontSize="sm" fontWeight="semibold">{patientName(selected)}</Text></Box>
                <Box bg={inputBg} borderRadius="12px" p={3}><Text fontSize="xs" color={muted}>Reportó</Text><Text fontSize="sm" fontWeight="semibold">{selected.requested_by_name || "—"} · {fmtDate(selected.created_at)}</Text></Box>
                <Box bg={inputBg} borderRadius="12px" p={3}><Text fontSize="xs" color={muted}>Total / abonado / pendiente</Text><Text fontSize="sm" fontWeight="semibold">{money(sales[selected.sale_id]?.total)} · {money(sales[selected.sale_id]?.balance)} · {money(sales[selected.sale_id]?.credit)}</Text></Box>
                <Box bg={inputBg} borderRadius="12px" p={3}><Text fontSize="xs" color={muted}>Cómo debería quedar</Text><Text fontSize="sm" fontWeight="semibold">{selected.expected_value || "No indicó"}</Text></Box>
              </SimpleGrid>

              <Text fontSize="xs" color={muted} mb={1}>Lo que pasó</Text>
              <Text fontSize="sm" mb={4} whiteSpace="pre-wrap">{selected.description}</Text>

              {selected.evidence_urls?.length > 0 && (
                <>
                  <Text fontSize="xs" color={muted} mb={2}>Evidencias</Text>
                  <SimpleGrid columns={{ base: 2, sm: 4 }} spacing={3} mb={4}>
                    {selected.evidence_urls.map((u) => (
                      <Link key={u} href={u} isExternal><ChakraImage src={u} h="90px" w="100%" objectFit="cover" borderRadius="12px" border="1px solid" borderColor={border} /></Link>
                    ))}
                  </SimpleGrid>
                </>
              )}

              {selected.status === "pending" ? (
                <>
                  <Text fontSize="xs" color={muted} mb={1}>Respuesta para quien reportó (obligatoria si rechazas)</Text>
                  <Textarea rows={3} value={response} onChange={(e) => setResponse(e.target.value)} bg={inputBg} borderRadius="10px" />
                </>
              ) : (
                <Box bg={inputBg} borderRadius="12px" p={3}>
                  <Text fontSize="xs" color={muted}>Resuelta por {selected.resolved_by_name || "—"} · {fmtDate(selected.resolved_at)}</Text>
                  <Text fontSize="sm">{selected.admin_response || "Sin comentario."}</Text>
                </Box>
              )}
            </ModalBody>
            <ModalFooter gap={2} flexWrap="wrap">
              <Button
                size="sm" variant="ghost" leftIcon={<ExternalLink size={14} />}
                onClick={() => { const s = sales[selected.sale_id]; if (s) navigate(`/history-clinic/patient-history/${s.patient_id}/sales-history/${s.id}`); }}
              >
                Ver venta
              </Button>
              {selected.status === "pending" && (
                <>
                  <Button size="sm" colorScheme="red" variant="outline" leftIcon={<XCircle size={14} />} isLoading={saving} onClick={() => resolve("rejected")}>Rechazar</Button>
                  <Button size="sm" bg={ACCENT} color="white" _hover={{ bg: "#00967f" }} leftIcon={<CheckCircle2 size={14} />} isLoading={saving} onClick={() => resolve("approved", true)}>
                    Aprobar y corregir
                  </Button>
                </>
              )}
            </ModalFooter>
          </ModalContent>
        )}
      </Modal>
    </Box>
  );
};

export default CorrectionRequests;
