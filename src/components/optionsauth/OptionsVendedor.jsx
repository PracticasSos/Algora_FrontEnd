import { useEffect, useMemo, useState } from "react";
import {
  Box, Flex, Text, Heading, SimpleGrid, Button, Badge, Skeleton, HStack, Icon, Link, useColorModeValue,
} from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";
import { ShoppingCart, Banknote, CreditCard, ArrowRightLeft, PackageCheck, Wallet, MessageCircle, FileText, AlertTriangle } from "lucide-react";
import { supabase } from "../../api/supabase";
import { useAuth } from "../AuthContext";

const ACCENT = "#00A88E";
const money = (v) => `$${(Number(v) || 0).toLocaleString("es-EC", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const localDay = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};
const daysSince = (date) => (date ? Math.max(0, Math.floor((Date.now() - new Date(date).getTime()) / 86400000)) : 0);
const pname = (s) => `${s.patients?.pt_firstname || ""} ${s.patients?.pt_lastname || ""}`.trim() || "Paciente";
const STATUS = { pending: ["Pendiente", "orange"], approved: ["Aprobada", "green"], rejected: ["Rechazada", "red"] };

const METHODS = [
  { key: "efectivo", label: "Efectivo", icon: Banknote },
  { key: "transferencia", label: "Transferencia", icon: ArrowRightLeft },
  { key: "datafast", label: "Datafast", icon: CreditCard },
];

/** Inicio del Vendedor: caja del día, retiros, cobros pendientes y últimas ventas. */
const OptionsVendedor = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [abonos, setAbonos] = useState([]);
  const [salesToday, setSalesToday] = useState([]);
  const [open, setOpen] = useState([]);
  const [recent, setRecent] = useState([]);
  const [requests, setRequests] = useState([]);

  const cardBg = useColorModeValue("white", "gray.800");
  const border = useColorModeValue("gray.200", "gray.700");
  const muted = useColorModeValue("gray.500", "gray.400");
  const rowHover = useColorModeValue("gray.50", "whiteAlpha.100");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const day = localDay();
      const startUTC = new Date(`${day}T00:00:00`).toISOString();
      const endUTC = new Date(`${day}T23:59:59.999`).toISOString();
      const branch = user?.branch_id;

      let aq = supabase.from("abono_payments").select("amount,payment_method,sales!inner(branchs_id)").gte("paid_at", startUTC).lte("paid_at", endUTC);
      if (branch) aq = aq.eq("sales.branchs_id", branch);

      let tq = supabase.from("sales").select("id,total").gte("date", day).lte("date", `${day}T23:59:59`);
      if (branch) tq = tq.eq("branchs_id", branch);

      let oq = supabase.from("sales").select("id,date,total,balance,credit,is_completed,is_refund,patient_id,patients(pt_firstname,pt_lastname,pt_phone)").eq("is_completed", false).order("date", { ascending: true }).limit(200);
      if (branch) oq = oq.eq("branchs_id", branch);

      let rq = supabase.from("sales").select("id,date,total,credit,pdf_url,patient_id,patients(pt_firstname,pt_lastname)").order("id", { ascending: false }).limit(5);
      if (branch) rq = rq.eq("branchs_id", branch);

      const [a, t, o, r] = await Promise.all([aq, tq, oq, rq]);
      setAbonos(a.data || []);
      setSalesToday(t.data || []);
      setOpen((o.data || []).filter((s) => !s.is_refund));
      setRecent(r.data || []);

      if (user?.id) {
        const { data: q } = await supabase.from("correction_requests").select("id,sale_id,status,request_type,admin_response,created_at").eq("requested_by", user.id).order("created_at", { ascending: false }).limit(3);
        setRequests(q || []);
      }
      setLoading(false);
    };
    load();
  }, [user?.branch_id, user?.id]);

  const byMethod = useMemo(() => {
    const m = { efectivo: 0, transferencia: 0, datafast: 0 };
    abonos.forEach((x) => { m[x.payment_method] = (m[x.payment_method] || 0) + (Number(x.amount) || 0); });
    return m;
  }, [abonos]);
  const totalCollected = Object.values(byMethod).reduce((s, v) => s + v, 0);
  const soldToday = salesToday.reduce((s, x) => s + (Number(x.total) || 0), 0);
  const toCollect = open.filter((s) => Number(s.credit) > 0);
  const totalPending = toCollect.reduce((s, x) => s + Number(x.credit), 0);

  const whatsapp = (s) => {
    const phone = (s.patients?.pt_phone || "").replace(/\D/g, "");
    if (phone.length < 10) return;
    const msg = `Hola ${s.patients?.pt_firstname || ""}, te recordamos que tienes un saldo pendiente de ${money(s.credit)} por tus lentes. ¡Te esperamos!`;
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, "_blank");
  };

  const name = user?.user_metadata?.firstname || user?.firstname || "";
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Buenos días" : hour < 19 ? "Buenas tardes" : "Buenas noches";

  const Panel = ({ title, count, color, children }) => (
    <Box bg={cardBg} border="1px solid" borderColor={border} borderRadius="24px" overflow="hidden">
      <Box h="4px" bg={color} />
      <Flex justify="space-between" align="center" p={4} pb={2}>
        <Text fontWeight="bold">{title}</Text>
        {count !== undefined && <Badge borderRadius="full" px={2}>{count}</Badge>}
      </Flex>
      <Box px={2} pb={3}>{children}</Box>
    </Box>
  );
  const Empty = ({ children }) => <Text fontSize="sm" color={muted} p={4}>{children}</Text>;

  return (
    <Box p={{ base: 4, md: 8 }} maxW="1200px" mx="auto">
      <Box h="4px" borderRadius="full" bgGradient="linear(to-r, #00A88E, #2DD4BF, #00A88E)" mb={6} />
      <Flex justify="space-between" align={{ base: "start", md: "center" }} direction={{ base: "column", md: "row" }} gap={4} mb={6}>
        <Box>
          <Heading size="lg">{greeting}{name ? `, ${name}` : ""}</Heading>
          <Text color={muted}>{new Date().toLocaleDateString("es-EC", { weekday: "long", day: "numeric", month: "long" })}</Text>
        </Box>
        <Button size="lg" bg={ACCENT} color="white" _hover={{ bg: "#00967f" }} borderRadius="full" px={8} leftIcon={<ShoppingCart size={18} />} onClick={() => navigate("/sales")}>
          Nueva Venta
        </Button>
      </Flex>

      <SimpleGrid columns={{ base: 2, md: 4 }} spacing={4} mb={4}>
        {[
          { label: "Cobrado hoy", value: money(totalCollected), color: ACCENT },
          { label: "Ventas de hoy", value: `${salesToday.length} · ${money(soldToday)}`, color: "#3182CE" },
          { label: "Pendientes de retiro", value: open.length, color: "#DD6B20" },
          { label: "Por cobrar", value: money(totalPending), color: "#E53E3E" },
        ].map((k) => (
          <Box key={k.label} bg={cardBg} border="1px solid" borderColor={border} borderRadius="20px" p={4}>
            <Text fontSize="xs" color={muted}>{k.label}</Text>
            <Skeleton isLoaded={!loading} mt={1}><Text fontSize={{ base: "lg", md: "xl" }} fontWeight="extrabold" color={k.color}>{k.value}</Text></Skeleton>
          </Box>
        ))}
      </SimpleGrid>

      <SimpleGrid columns={{ base: 1, sm: 3 }} spacing={3} mb={6}>
        {METHODS.map((m) => (
          <Flex key={m.key} align="center" gap={3} bg={cardBg} border="1px solid" borderColor={border} borderRadius="16px" px={4} py={3}>
            <Flex boxSize="36px" borderRadius="10px" bg="#E6FBF6" color={ACCENT} align="center" justify="center"><Icon as={m.icon} boxSize="16px" /></Flex>
            <Box>
              <Text fontSize="xs" color={muted}>{m.label}</Text>
              <Skeleton isLoaded={!loading}><Text fontWeight="bold">{money(byMethod[m.key])}</Text></Skeleton>
            </Box>
          </Flex>
        ))}
      </SimpleGrid>

      <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={5} mb={5}>
        <Panel title="Pendientes de retiro" count={open.length} color="#DD6B20">
          {loading ? <Skeleton h="120px" m={2} borderRadius="14px" /> : open.length === 0 ? <Empty>No hay lentes pendientes de entregar.</Empty> : open.slice(0, 6).map((s) => (
            <Flex key={s.id} align="center" justify="space-between" gap={3} px={3} py={3} borderRadius="14px" _hover={{ bg: rowHover }}>
              <HStack spacing={3} minW={0}>
                <Flex boxSize="38px" borderRadius="12px" bg="orange.50" color="orange.500" align="center" justify="center" flexShrink={0}><Icon as={PackageCheck} boxSize="18px" /></Flex>
                <Box minW={0}>
                  <Text fontWeight="semibold" fontSize="sm" noOfLines={1}>{pname(s)}</Text>
                  <Text fontSize="xs" color={muted}>Venta #{s.id} · {Number(s.credit) > 0 ? `cobrar ${money(s.credit)}` : "pagado completo"}</Text>
                </Box>
              </HStack>
              <Button size="xs" bg={ACCENT} color="white" borderRadius="full" _hover={{ bg: "#00967f" }} onClick={() => navigate(`/retreats-patients/retreats/${s.id}`)}>Entregar</Button>
            </Flex>
          ))}
          {open.length > 6 && <Button variant="ghost" size="xs" w="full" onClick={() => navigate("/retreats-patients")}>Ver los {open.length} pendientes</Button>}
        </Panel>

        <Panel title="Clientes con saldo pendiente" count={toCollect.length} color="#E53E3E">
          {loading ? <Skeleton h="120px" m={2} borderRadius="14px" /> : toCollect.length === 0 ? <Empty>Nadie debe nada. ¡Todo al día!</Empty> : toCollect.slice(0, 6).map((s) => (
            <Flex key={s.id} align="center" justify="space-between" gap={3} px={3} py={3} borderRadius="14px" _hover={{ bg: rowHover }}>
              <Box minW={0}>
                <Text fontWeight="semibold" fontSize="sm" noOfLines={1}>{pname(s)}</Text>
                <Text fontSize="xs" color={muted}>{money(s.credit)} · hace {daysSince(s.date)} días</Text>
              </Box>
              <Button size="xs" variant="outline" colorScheme="green" borderRadius="full" leftIcon={<MessageCircle size={13} />} isDisabled={!s.patients?.pt_phone} onClick={() => whatsapp(s)}>Recordar</Button>
            </Flex>
          ))}
          {toCollect.length > 6 && <Button variant="ghost" size="xs" w="full" onClick={() => navigate("/balance")}>Ver todos en Créditos</Button>}
        </Panel>
      </SimpleGrid>

      <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={5}>
        <Panel title="Últimas ventas" color="#3182CE">
          {loading ? <Skeleton h="120px" m={2} borderRadius="14px" /> : recent.length === 0 ? <Empty>Aún no hay ventas.</Empty> : recent.map((s) => (
            <Flex key={s.id} align="center" justify="space-between" gap={3} px={3} py={3} borderRadius="14px" _hover={{ bg: rowHover }} cursor="pointer" onClick={() => navigate(`/history-clinic/patient-history/${s.patient_id}/sales-history/${s.id}`)}>
              <Box minW={0}>
                <Text fontWeight="semibold" fontSize="sm" noOfLines={1}>{pname(s)}</Text>
                <Text fontSize="xs" color={muted}>#{s.id} · {money(s.total)} · {Number(s.credit) > 0 ? `debe ${money(s.credit)}` : "pagada"}</Text>
              </Box>
              {s.pdf_url && <Link href={s.pdf_url} isExternal onClick={(e) => e.stopPropagation()}><Icon as={FileText} color={ACCENT} /></Link>}
            </Flex>
          ))}
        </Panel>

        <Panel title="Mis reportes al admin" color="orange.400">
          {requests.length === 0 ? <Empty>Si te equivocas en un cobro, entra a la venta y usa “Reportar error al admin”.</Empty> : requests.map((r) => (
            <Flex key={r.id} align="center" justify="space-between" gap={3} px={3} py={3} borderRadius="14px" _hover={{ bg: rowHover }}>
              <HStack spacing={3} minW={0}>
                <Icon as={AlertTriangle} color="orange.400" boxSize="16px" />
                <Box minW={0}>
                  <Text fontSize="sm" fontWeight="semibold">Venta #{r.sale_id}</Text>
                  <Text fontSize="xs" color={muted} noOfLines={1}>{r.admin_response || "Esperando respuesta del admin"}</Text>
                </Box>
              </HStack>
              <Badge colorScheme={STATUS[r.status][1]} borderRadius="full" px={2}>{STATUS[r.status][0]}</Badge>
            </Flex>
          ))}
        </Panel>
      </SimpleGrid>
    </Box>
  );
};

export default OptionsVendedor;
