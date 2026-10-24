import { useEffect, useMemo, useState } from "react";
import {
  Box, Flex, Text, Heading, SimpleGrid, Button, Badge, Icon, Skeleton,
  useColorModeValue,
} from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";
import { UserPlus, Users, ClipboardList, History, FileText, Stethoscope, CheckCircle2, Clock } from "lucide-react";
import { supabase } from "../../api/supabase";
import { useAuth } from "../AuthContext";

const ACCENT = "#00A88E";

const quickLinks = [
  { label: "Registrar Paciente", path: "/register-patient", icon: UserPlus },
  { label: "Registrar Medidas", path: "/measures-final", icon: ClipboardList },
  { label: "Historial de Medidas", path: "/history-measure-list", icon: History },
  { label: "Lista de Pacientes", path: "/list-patients", icon: Users },
  { label: "Certificado", path: "/print-certificate", icon: FileText },
];

const dayBounds = () => {
  const d = new Date();
  const y = d.getFullYear(), m = String(d.getMonth() + 1).padStart(2, "0"), day = String(d.getDate()).padStart(2, "0");
  return {
    start: new Date(`${y}-${m}-${day}T00:00:00`).toISOString(),
    end: new Date(`${y}-${m}-${day}T23:59:59.999`).toISOString(),
  };
};

/**
 * Inicio del Optometra: pacientes del día separados en "por atender"
 * (registrados hoy y sin medidas todavía) y "atendidos" (ya tienen medidas hoy).
 */
const OptionsOptometra = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [patients, setPatients] = useState([]);
  const [measuredIds, setMeasuredIds] = useState(new Set());
  const [loading, setLoading] = useState(true);

  const cardBg = useColorModeValue("white", "gray.800");
  const border = useColorModeValue("gray.200", "gray.700");
  const muted = useColorModeValue("gray.500", "gray.400");
  const rowHover = useColorModeValue("gray.50", "whiteAlpha.100");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const { start, end } = dayBounds();
      let pq = supabase.from("patients").select("*").gte("created_at", start).lte("created_at", end).order("created_at", { ascending: false });
      if (user?.branch_id) pq = pq.eq("branchs_id", user.branch_id);
      const { data: pats, error } = await pq;
      setPatients(error ? [] : pats || []);

      const { data: meas } = await supabase.from("rx_final").select("patient_id").gte("created_at", start).lte("created_at", end);
      setMeasuredIds(new Set((meas || []).map((m) => m.patient_id)));
      setLoading(false);
    };
    load();
  }, [user?.branch_id]);

  const { pending, done } = useMemo(() => ({
    pending: patients.filter((p) => !measuredIds.has(p.id)),
    done: patients.filter((p) => measuredIds.has(p.id)),
  }), [patients, measuredIds]);

  const name = user?.user_metadata?.firstname || user?.firstname || "";
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Buenos días" : hour < 19 ? "Buenas tardes" : "Buenas noches";
  const timeOf = (p) => (p.created_at ? new Date(p.created_at).toLocaleTimeString("es-EC", { hour: "2-digit", minute: "2-digit" }) : "");
  const fullName = (p) => `${p.pt_firstname || ""} ${p.pt_lastname || ""}`.trim() || "Paciente";

  const PatientRow = ({ p, isDone }) => (
    <Flex align="center" justify="space-between" gap={3} px={3} py={3} borderRadius="14px" _hover={{ bg: rowHover }} transition="background .15s">
      <Flex align="center" gap={3} minW={0}>
        <Flex boxSize="38px" borderRadius="12px" align="center" justify="center" bg={isDone ? "green.50" : "#E6FBF6"} color={isDone ? "green.500" : ACCENT} flexShrink={0}>
          <Icon as={isDone ? CheckCircle2 : Clock} boxSize="18px" />
        </Flex>
        <Box minW={0}>
          <Text fontWeight="semibold" fontSize="sm" noOfLines={1}>{fullName(p)}</Text>
          <Text fontSize="xs" color={muted}>Llegó {timeOf(p)}{p.pt_phone ? ` · ${p.pt_phone}` : ""}</Text>
        </Box>
      </Flex>
      {isDone ? (
        <Button size="xs" variant="ghost" onClick={() => navigate("/history-measure-list")}>Ver medidas</Button>
      ) : (
        <Button size="xs" bg={ACCENT} color="white" borderRadius="full" _hover={{ bg: "#00967f" }} leftIcon={<Stethoscope size={13} />} onClick={() => navigate("/measures-final", { state: { patient: p } })}>
          Atender
        </Button>
      )}
    </Flex>
  );

  return (
    <Box p={{ base: 4, md: 8 }} maxW="1200px" mx="auto">
      <Box h="4px" borderRadius="full" bgGradient="linear(to-r, #00A88E, #2DD4BF, #00A88E)" mb={6} />
      <Heading size="lg" mb={1}>{greeting}{name ? `, ${name}` : ""}</Heading>
      <Text color={muted} mb={6}>
        {new Date().toLocaleDateString("es-EC", { weekday: "long", day: "numeric", month: "long" })}
      </Text>

      <SimpleGrid columns={{ base: 2, md: 3 }} spacing={4} mb={6}>
        {[
          { label: "Por atender", value: pending.length, color: ACCENT },
          { label: "Atendidos hoy", value: done.length, color: "#38A169" },
          { label: "Pacientes del día", value: patients.length, color: "#3182CE" },
        ].map((k) => (
          <Box key={k.label} bg={cardBg} border="1px solid" borderColor={border} borderRadius="20px" p={5}>
            <Text fontSize="xs" color={muted}>{k.label}</Text>
            <Skeleton isLoaded={!loading} mt={1}><Text fontSize="3xl" fontWeight="extrabold" color={k.color}>{k.value}</Text></Skeleton>
          </Box>
        ))}
      </SimpleGrid>

      <Flex gap={3} wrap="wrap" mb={6}>
        {quickLinks.map((q) => (
          <Button key={q.path} variant="outline" borderRadius="full" size="sm" leftIcon={<q.icon size={15} />} borderColor={border} _hover={{ borderColor: ACCENT, color: ACCENT }} onClick={() => navigate(q.path)}>
            {q.label}
          </Button>
        ))}
      </Flex>

      <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={5}>
        <Box bg={cardBg} border="1px solid" borderColor={border} borderRadius="24px" overflow="hidden">
          <Box h="4px" bg={ACCENT} />
          <Flex justify="space-between" align="center" p={4} pb={2}>
            <Text fontWeight="bold">Por atender</Text>
            <Badge colorScheme="teal" borderRadius="full" px={2}>{pending.length}</Badge>
          </Flex>
          <Box px={2} pb={3}>
            {loading ? <Skeleton h="120px" m={2} borderRadius="14px" /> : pending.length === 0 ? (
              <Text fontSize="sm" color={muted} p={4}>No hay pacientes esperando. Cuando registren uno nuevo aparecerá aquí.</Text>
            ) : pending.map((p) => <PatientRow key={p.id} p={p} />)}
          </Box>
        </Box>

        <Box bg={cardBg} border="1px solid" borderColor={border} borderRadius="24px" overflow="hidden">
          <Box h="4px" bg="#38A169" />
          <Flex justify="space-between" align="center" p={4} pb={2}>
            <Text fontWeight="bold">Atendidos hoy</Text>
            <Badge colorScheme="green" borderRadius="full" px={2}>{done.length}</Badge>
          </Flex>
          <Box px={2} pb={3}>
            {loading ? <Skeleton h="120px" m={2} borderRadius="14px" /> : done.length === 0 ? (
              <Text fontSize="sm" color={muted} p={4}>Todavía no se han registrado medidas hoy.</Text>
            ) : done.map((p) => <PatientRow key={p.id} p={p} isDone />)}
          </Box>
        </Box>
      </SimpleGrid>
    </Box>
  );
};

export default OptionsOptometra;
