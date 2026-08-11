import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../api/supabase";
import {
  Box, Container, Heading, Text, Flex, HStack, VStack, Icon, Badge,
  IconButton, Spinner, useColorModeValue, SimpleGrid, Divider, Avatar,
  Button, Select, Input, useToast, useDisclosure,
  Modal, ModalOverlay, ModalContent, ModalHeader, ModalCloseButton, ModalBody, ModalFooter,
  AlertDialog, AlertDialogOverlay, AlertDialogContent, AlertDialogHeader, AlertDialogBody, AlertDialogFooter,
} from "@chakra-ui/react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Cell,
} from "recharts";
import {
  Building2, Users, ShieldCheck, Store, Plus, Pencil, PowerOff, RotateCcw,
  Mail, MapPin, Sparkles, AlertTriangle, Send, UserPlus, TrendingUp, Search as SearchIcon,
} from "lucide-react";
import { useRef } from "react";
import SmartHeader from "../header/SmartHeader";

const ACCENT = "#00A88E";
const BAR_COLORS = ["#00A88E", "#2B6CB0", "#805AD5", "#DD6B20", "#D53F8C", "#38B2AC", "#D69E2E"];

const initials = (u) => `${(u?.firstname || "?")[0] || ""}${(u?.lastname || "")[0] || ""}`.toUpperCase();
const formatMoney = (n) => `$${Number(n || 0).toFixed(2)}`;

const SectionTitle = ({ icon, children, sectionIconBg }) => (
  <Flex align="center" gap={3} mb={4}>
    <Flex align="center" justify="center" boxSize="30px" borderRadius="10px" bg={sectionIconBg} color={ACCENT} flexShrink={0}>
      <Icon as={icon} boxSize="15px" />
    </Flex>
    <Text fontWeight="bold" fontSize="sm" letterSpacing="wide" textTransform="uppercase" color={ACCENT} whiteSpace="nowrap">
      {children}
    </Text>
    <Box flex="1" h="1px" bgGradient={`linear(to-r, ${sectionIconBg}, transparent)`} />
  </Flex>
);

// A nivel de módulo (fuera de SuperAdminOpticas) a propósito — si viviera
// dentro del componente, cada tecla presionada recrearía la función y
// React desmontaría/remontaría el <Input>, perdiendo el foco (el mismo
// bug que corregimos en Register.jsx).
const Field = ({ label, name, type = "text", value, onChange, inputBg, borderColor }) => (
  <Box>
    <Text fontSize="xs" color="gray.500" mb={1}>{label}</Text>
    <Input
      type={type}
      name={name}
      value={value}
      onChange={onChange}
      size="sm"
      borderRadius="10px"
      bg={inputBg}
      borderColor={borderColor}
      _focus={{ borderColor: ACCENT, boxShadow: `0 0 0 1px ${ACCENT}` }}
    />
  </Box>
);

const KpiCard = ({ icon, label, value, gradient }) => (
  <Box
    p={4}
    borderRadius="16px"
    bgGradient={gradient}
    color="white"
    position="relative"
    overflow="hidden"
    transition="all 0.2s ease"
    _hover={{ transform: "translateY(-2px)", boxShadow: "lg" }}
  >
    <Icon as={icon} boxSize="60px" position="absolute" right="-10px" bottom="-10px" opacity={0.15} />
    <Icon as={icon} boxSize="18px" mb={2} opacity={0.9} />
    <Text fontSize="xs" opacity={0.85} textTransform="uppercase" letterSpacing="wide">{label}</Text>
    <Text fontSize="2xl" fontWeight="800">{value}</Text>
  </Box>
);

const SuperAdminOpticas = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const cancelRef = useRef();

  const [branches, setBranches] = useState([]);
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [salesByBranch, setSalesByBranch] = useState({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const { isOpen: isAssignOpen, onOpen: onAssignOpen, onClose: onAssignClose } = useDisclosure();
  const { isOpen: isStatusOpen, onOpen: onStatusOpen, onClose: onStatusClose } = useDisclosure();
  const [assignBranch, setAssignBranch] = useState(null);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isSendingReset, setIsSendingReset] = useState(false);
  const [pendingStatus, setPendingStatus] = useState(null); // { branch, mode: 'deactivate' | 'reactivate' }

  // true = crear una cuenta de Admin nueva (caso normal); false = elegir
  // un usuario ya existente y reasignarlo a esta óptica.
  const [createMode, setCreateMode] = useState(true);
  const EMPTY_ADMIN_FORM = { firstname: "", lastname: "", ci: "", birthdate: "", age: "", phone_number: "", username: "", email: "", password: "" };
  const [newAdminForm, setNewAdminForm] = useState(EMPTY_ADMIN_FORM);

  const cardBg = useColorModeValue("white", "gray.700");
  const inputBg = useColorModeValue("gray.50", "gray.700");
  const borderColor = useColorModeValue("gray.200", "gray.600");
  const subtitleColor = useColorModeValue("gray.500", "gray.400");
  const sectionIconBg = useColorModeValue("#E6FBF6", "rgba(0,168,142,0.15)");
  const headingColor = useColorModeValue("gray.800", "white");
  const tooltipBg = useColorModeValue("#fff", "#2D3748");

  const fetchAll = async () => {
    setLoading(true);
    const [branchesRes, usersRes, rolesRes, salesRes] = await Promise.all([
      supabase.from("branchs").select("*").order("name", { ascending: true }),
      supabase.from("users").select("id, firstname, lastname, email, role_id, branch_id").order("firstname", { ascending: true }),
      supabase.from("role").select("*"),
      supabase.from("sales").select("total, branchs_id, is_refund"),
    ]);

    if (branchesRes.error || usersRes.error || rolesRes.error) {
      toast({ title: "Error al cargar datos", description: branchesRes.error?.message || usersRes.error?.message || rolesRes.error?.message, status: "error", duration: 5000, isClosable: true, position: "top" });
    }

    setBranches(branchesRes.data || []);
    setUsers(usersRes.data || []);
    setRoles(rolesRes.data || []);

    const totals = {};
    (salesRes.data || []).forEach((s) => {
      if (s.is_refund) return;
      totals[s.branchs_id] = (totals[s.branchs_id] || 0) + Number(s.total || 0);
    });
    setSalesByBranch(totals);

    setLoading(false);
  };

  useEffect(() => {
    fetchAll();
    // eslint-disable-next-line
  }, []);

  const adminRoleId = useMemo(() => roles.find((r) => r.role_name === "Admin")?.id, [roles]);

  // Un admin por sucursal (el primero encontrado); si hay más de uno se
  // muestra el conteo extra como aviso, pero no se oculta la información.
  const adminsByBranch = useMemo(() => {
    const map = {};
    users
      .filter((u) => String(u.role_id) === String(adminRoleId) && u.branch_id)
      .forEach((u) => {
        if (!map[u.branch_id]) map[u.branch_id] = [];
        map[u.branch_id].push(u);
      });
    return map;
  }, [users, adminRoleId]);

  const searchedBranches = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return branches;
    return branches.filter((b) => {
      const admins = adminsByBranch[b.id] || [];
      return (
        b.name?.toLowerCase().includes(term) ||
        admins.some((a) => `${a.firstname} ${a.lastname}`.toLowerCase().includes(term) || a.email?.toLowerCase().includes(term))
      );
    });
  }, [branches, search, adminsByBranch]);

  const activeBranches = useMemo(() => searchedBranches.filter((b) => b.active !== false), [searchedBranches]);
  const inactiveBranches = useMemo(() => searchedBranches.filter((b) => b.active === false), [searchedBranches]);

  // --- KPIs globales (sobre TODAS las sucursales activas, no solo las filtradas por búsqueda) ---
  const allActive = useMemo(() => branches.filter((b) => b.active !== false), [branches]);
  const branchesWithAdmin = allActive.filter((b) => (adminsByBranch[b.id] || []).length > 0).length;
  const branchesWithoutAdmin = allActive.length - branchesWithAdmin;
  const totalSales = Object.values(salesByBranch).reduce((sum, v) => sum + v, 0);

  const chartData = allActive.map((b) => ({
    name: b.name,
    ventas: Number((salesByBranch[b.id] || 0).toFixed(2)),
  }));

  const openAssign = (branch) => {
    setAssignBranch(branch);
    const current = (adminsByBranch[branch.id] || [])[0];
    setSelectedUserId(current ? String(current.id) : "");
    setNewAdminForm(EMPTY_ADMIN_FORM);
    setCreateMode(true);
    onAssignOpen();
  };

  const handleNewAdminChange = (e) => {
    const { name, value } = e.target;
    setNewAdminForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleCreateAdmin = async () => {
    if (!assignBranch || !adminRoleId) return;

    const required = ["firstname", "lastname", "ci", "birthdate", "age", "phone_number", "username", "email", "password"];
    const missing = required.find((f) => !newAdminForm[f]);
    if (missing) {
      toast({ title: "Faltan datos", description: "Completa todos los campos para crear la cuenta.", status: "warning", duration: 4500, isClosable: true, position: "top" });
      return;
    }

    setIsSaving(true);

    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !sessionData.session) {
      setIsSaving(false);
      toast({ title: "Error", description: "No se pudo obtener la sesión actual.", status: "error", duration: 5000, isClosable: true, position: "top" });
      return;
    }

    // Se usa la misma función edge que Register.jsx (register-employee), que
    // crea el login real además del registro — así el Admin nuevo puede
    // entrar de inmediato con el correo y contraseña que se le asignen aquí.
    const employeeData = {
      email: newAdminForm.email.trim(),
      password: newAdminForm.password,
      firstname: newAdminForm.firstname,
      lastname: newAdminForm.lastname,
      username: newAdminForm.username,
      age: parseInt(newAdminForm.age),
      birthdate: newAdminForm.birthdate,
      check_in_date: new Date().toISOString().split("T")[0],
      ci: newAdminForm.ci,
      phone_number: newAdminForm.phone_number,
      branch_id: assignBranch.id,
      role_id: adminRoleId,
      title: "",
      sello_url: null,
    };

    const { data, error } = await supabase.functions.invoke("register-employee", {
      body: employeeData,
      headers: { Authorization: `Bearer ${sessionData.session.access_token}` },
    });

    setIsSaving(false);

    if (error || (data && !data.success)) {
      let description = "Error al crear la cuenta. Intenta de nuevo.";
      const errorMessage = (error?.message || data?.error || "").toLowerCase();
      if (errorMessage.includes("unique constraint")) {
        if (errorMessage.includes("users_ci_key")) description = "La C.I. ya está registrada.";
        else if (errorMessage.includes("users_email_key")) description = "Este correo ya está en uso.";
        else if (errorMessage.includes("unique_username")) description = "Este nombre de usuario ya existe.";
        else if (errorMessage.includes("users_phone_number_key")) description = "Este celular ya está registrado.";
      }
      toast({ title: "Error al crear cuenta", description, status: "error", duration: 6000, isClosable: true, position: "top" });
      return;
    }

    toast({ title: "Admin creado", description: `${newAdminForm.firstname} ${newAdminForm.lastname} ya puede iniciar sesión y administrar ${assignBranch.name}.`, status: "success", duration: 5000, isClosable: true, position: "top" });
    onAssignClose();
    fetchAll();
  };

  const handleAssign = async () => {
    if (!selectedUserId || !assignBranch || !adminRoleId) return;
    setIsSaving(true);
    const { error } = await supabase
      .from("users")
      .update({ role_id: adminRoleId, branch_id: assignBranch.id })
      .eq("id", selectedUserId);
    setIsSaving(false);
    if (error) {
      toast({ title: "Error al asignar", description: error.message, status: "error", duration: 5000, isClosable: true, position: "top" });
      return;
    }
    toast({ title: "Admin asignado", description: `Ahora administra ${assignBranch.name}.`, status: "success", duration: 4000, isClosable: true, position: "top" });
    onAssignClose();
    fetchAll();
  };

  const handleSendReset = async (email) => {
    if (!email) return;
    setIsSendingReset(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    setIsSendingReset(false);
    if (error) {
      toast({ title: "Error", description: "No se pudo enviar el correo de recuperación.", status: "error", duration: 5000, isClosable: true, position: "top" });
    } else {
      toast({ title: "Correo enviado", description: `Se envió un link de recuperación a ${email}.`, status: "success", duration: 4500, isClosable: true, position: "top" });
    }
  };

  const openStatusConfirm = (branch, mode) => {
    setPendingStatus({ branch, mode });
    onStatusOpen();
  };

  const handleConfirmStatus = async () => {
    if (!pendingStatus) return;
    const { branch, mode } = pendingStatus;
    const { error } = await supabase.from("branchs").update({ active: mode !== "deactivate" ? true : false }).eq("id", branch.id);
    onStatusClose();
    setPendingStatus(null);
    if (error) {
      toast({ title: "Error", description: "No se pudo actualizar el estado de la óptica.", status: "error", duration: 5000, isClosable: true, position: "top" });
      return;
    }
    toast({
      title: mode === "deactivate" ? "Óptica desactivada" : "Óptica reactivada",
      status: mode === "deactivate" ? "info" : "success",
      duration: 3500,
      isClosable: true,
      position: "top",
    });
    fetchAll();
  };

  const eligibleUsers = users.filter((u) => u.id); // todos: cualquiera puede promoverse a Admin de una óptica

  const BranchCard = ({ branch }) => {
    const admins = adminsByBranch[branch.id] || [];
    const primaryAdmin = admins[0];
    const extraCount = admins.length - 1;
    const isActive = branch.active !== false;

    return (
      <Box
        bg={cardBg}
        borderRadius="24px"
        border={`1px solid ${borderColor}`}
        overflow="hidden"
        opacity={isActive ? 1 : 0.65}
        transition="all 0.2s ease"
        _hover={{ transform: "translateY(-3px)", boxShadow: "xl", borderColor: isActive ? ACCENT : borderColor }}
      >
        <Box h="4px" bg={isActive ? undefined : borderColor} bgGradient={isActive ? "linear(to-r, #00A88E, #2DD4BF, #00A88E)" : undefined} />
        <Box p={5}>
          <Flex justify="space-between" align="flex-start" mb={3}>
            <VStack align="start" spacing={0} maxW="70%">
              <HStack>
                <Text fontWeight="800" fontSize="md" color={headingColor} noOfLines={1}>{branch.name}</Text>
                {!isActive && <Badge colorScheme="orange" fontSize="9px" borderRadius="full">Inactiva</Badge>}
              </HStack>
              <HStack spacing={1} color={subtitleColor}>
                <Icon as={MapPin} boxSize="11px" />
                <Text fontSize="xs" noOfLines={1}>{branch.address}</Text>
              </HStack>
            </VStack>
            <IconButton
              icon={isActive ? <PowerOff size={14} /> : <RotateCcw size={14} />}
              aria-label={isActive ? "Desactivar óptica" : "Reactivar óptica"}
              title={isActive ? "Desactivar" : "Reactivar"}
              size="sm"
              variant="ghost"
              color={isActive ? "orange.400" : ACCENT}
              _hover={{ bg: isActive ? "orange.50" : sectionIconBg }}
              onClick={() => openStatusConfirm(branch, isActive ? "deactivate" : "reactivate")}
            />
          </Flex>

          <Divider borderColor={borderColor} mb={3} />

          {/* Admin asignado */}
          {primaryAdmin ? (
            <Flex justify="space-between" align="center" mb={2}>
              <HStack spacing={2} minW={0}>
                <Avatar
                  size="sm"
                  name={initials(primaryAdmin)}
                  bg={ACCENT}
                  color="white"
                  fontWeight="bold"
                  getInitials={() => initials(primaryAdmin)}
                />
                <Box minW={0}>
                  <Text fontSize="sm" fontWeight="semibold" noOfLines={1}>{primaryAdmin.firstname} {primaryAdmin.lastname}</Text>
                  <HStack spacing={1}>
                    <Icon as={Mail} boxSize="10px" color={subtitleColor} />
                    <Text fontSize="10px" color={subtitleColor} noOfLines={1}>{primaryAdmin.email}</Text>
                  </HStack>
                </Box>
              </HStack>
              <HStack spacing={0}>
                <IconButton
                  icon={<Send size={12} />}
                  aria-label="Enviar link de recuperación"
                  title="Enviar link de recuperación"
                  size="xs"
                  variant="ghost"
                  color={subtitleColor}
                  isLoading={isSendingReset}
                  onClick={() => handleSendReset(primaryAdmin.email)}
                />
                <IconButton
                  icon={<Pencil size={12} />}
                  aria-label="Reasignar admin"
                  title="Reasignar"
                  size="xs"
                  variant="ghost"
                  color={ACCENT}
                  onClick={() => openAssign(branch)}
                />
              </HStack>
            </Flex>
          ) : (
            <Flex justify="space-between" align="center" mb={2} p={2} borderRadius="10px" bg={useColorModeValue("orange.50", "rgba(221,107,32,0.12)")}>
              <HStack spacing={2}>
                <Icon as={AlertTriangle} color="orange.400" boxSize="14px" />
                <Text fontSize="xs" color="orange.500" fontWeight="semibold">Sin Admin asignado</Text>
              </HStack>
              <Button size="xs" leftIcon={<UserPlus size={12} />} bg={ACCENT} color="white" _hover={{ bg: "#00967f" }} borderRadius="8px" onClick={() => openAssign(branch)}>
                Asignar
              </Button>
            </Flex>
          )}
          {extraCount > 0 && (
            <Text fontSize="10px" color={subtitleColor} mb={2}>+{extraCount} usuario{extraCount !== 1 ? "s" : ""} más con rol Admin en esta óptica</Text>
          )}

          <Divider borderColor={borderColor} mb={2} />

          <HStack justify="space-between">
            <HStack spacing={1} color={subtitleColor}>
              <Icon as={TrendingUp} boxSize="12px" />
              <Text fontSize="xs">Ventas totales</Text>
            </HStack>
            <Text fontSize="sm" fontWeight="800" color={ACCENT}>{formatMoney(salesByBranch[branch.id])}</Text>
          </HStack>
        </Box>
      </Box>
    );
  };

  return (
    <Box minHeight="100vh" bgGradient={useColorModeValue("linear(to-br, gray.50, teal.50)", "linear(to-br, gray.900, #0d1f1c)")}>
      <SmartHeader moduleSpecificButton={null} />

      <Container maxW="1300px" py={8} px={{ base: 3, md: 6 }}>
        <Box
          borderRadius="24px"
          bg={cardBg}
          border={`1px solid ${borderColor}`}
          boxShadow={useColorModeValue("0 20px 45px -20px rgba(0,168,142,0.25)", "0 20px 45px -20px rgba(0,168,142,0.35)")}
          overflow="hidden"
        >
          <Box h="5px" bgGradient="linear(to-r, #00A88E, #2DD4BF, #00A88E)" />
          <Box p={{ base: 5, md: 8 }}>
            <Flex justify="space-between" align="center" mb={6} flexWrap="wrap" gap={3}>
              <HStack spacing={3}>
                <Flex align="center" justify="center" boxSize="44px" borderRadius="14px" bgGradient="linear(to-br, #00A88E, #00786A)" color="white" boxShadow="0 6px 16px -4px rgba(0,168,142,0.5)">
                  <Icon as={Store} boxSize="20px" />
                </Flex>
                <VStack align="start" spacing={0}>
                  <HStack>
                    <Heading size="lg" fontWeight="800" color={headingColor} letterSpacing="tight">Panel de Ópticas</Heading>
                    <Icon as={Sparkles} color={ACCENT} boxSize="16px" />
                  </HStack>
                  <Text fontSize="xs" color={subtitleColor}>Cada óptica, su Admin y sus ventas, todo desde un solo lugar</Text>
                </VStack>
              </HStack>
              <Button leftIcon={<Plus size={16} />} bg={ACCENT} color="white" _hover={{ bg: "#00967f" }} borderRadius="12px" onClick={() => navigate("/branch")}>
                Nueva óptica
              </Button>
            </Flex>

            {loading ? (
              <Flex justify="center" py={16}><Spinner color={ACCENT} /></Flex>
            ) : (
              <>
                {/* KPIs */}
                <SimpleGrid columns={{ base: 2, md: 4 }} spacing={4} mb={6}>
                  <KpiCard icon={Store} label="Ópticas activas" value={allActive.length} gradient="linear(to-br, #00A88E, #00786A)" />
                  <KpiCard icon={ShieldCheck} label="Con Admin asignado" value={branchesWithAdmin} gradient="linear(to-br, #2B6CB0, #1A4E85)" />
                  <KpiCard
                    icon={AlertTriangle}
                    label="Sin Admin"
                    value={branchesWithoutAdmin}
                    gradient={branchesWithoutAdmin > 0 ? "linear(to-br, #DD6B20, #A8500F)" : "linear(to-br, #805AD5, #5B3A9E)"}
                  />
                  <KpiCard icon={TrendingUp} label="Ventas totales" value={formatMoney(totalSales)} gradient="linear(to-br, #D53F8C, #9F2D6B)" />
                </SimpleGrid>

                {/* Comparativa de ventas por óptica */}
                {chartData.length > 0 && (
                  <Box p={4} borderRadius="16px" bg={inputBg} border={`1px solid ${borderColor}`} mb={6}>
                    <Text fontSize="xs" fontWeight="bold" color={subtitleColor} textTransform="uppercase" mb={3}>Ventas totales por óptica</Text>
                    <Box h="220px">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke={borderColor} />
                          <XAxis dataKey="name" fontSize={11} stroke={subtitleColor} />
                          <YAxis fontSize={11} stroke={subtitleColor} />
                          <RechartsTooltip
                            contentStyle={{ background: tooltipBg, border: `1px solid ${borderColor}`, borderRadius: "10px", fontSize: "12px" }}
                            formatter={(value) => formatMoney(value)}
                          />
                          <Bar dataKey="ventas" radius={[8, 8, 0, 0]}>
                            {chartData.map((entry, idx) => (
                              <Cell key={entry.name} fill={BAR_COLORS[idx % BAR_COLORS.length]} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </Box>
                  </Box>
                )}

                <SectionTitle icon={Building2} sectionIconBg={sectionIconBg}>Ópticas</SectionTitle>

                <Flex position="relative" mb={5}>
                  <Icon as={SearchIcon} position="absolute" left="14px" top="12px" color={subtitleColor} zIndex={1} />
                  <Input
                    placeholder="Buscar óptica o Admin por nombre/correo..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    pl="40px"
                    size="lg"
                    borderRadius="12px"
                    bg={inputBg}
                    borderColor={borderColor}
                    _focus={{ borderColor: ACCENT, boxShadow: `0 0 0 1px ${ACCENT}` }}
                  />
                </Flex>

                {activeBranches.length === 0 ? (
                  <Text textAlign="center" color={subtitleColor} py={12}>
                    {search ? "No se encontraron ópticas con ese criterio." : "Todavía no hay ópticas registradas."}
                  </Text>
                ) : (
                  <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={5}>
                    {activeBranches.map((b) => <BranchCard key={b.id} branch={b} />)}
                  </SimpleGrid>
                )}

                {inactiveBranches.length > 0 && (
                  <Box mt={8}>
                    <SectionTitle icon={PowerOff} sectionIconBg={sectionIconBg}>Ópticas inactivas</SectionTitle>
                    <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={5}>
                      {inactiveBranches.map((b) => <BranchCard key={b.id} branch={b} />)}
                    </SimpleGrid>
                  </Box>
                )}
              </>
            )}
          </Box>
        </Box>
      </Container>

      {/* Modal: crear Admin nuevo (o reasignar uno existente) */}
      <Modal isOpen={isAssignOpen} onClose={onAssignClose} size={{ base: "full", md: "lg" }} isCentered scrollBehavior="inside">
        <ModalOverlay backdropFilter="blur(2px)" />
        <ModalContent bg={cardBg} borderRadius={{ base: 0, md: "20px" }}>
          <ModalHeader fontSize="md">
            {createMode ? "Crear Admin" : "Asignar usuario existente"} — {assignBranch?.name}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <HStack spacing={2} mb={4}>
              <Button
                size="xs"
                variant={createMode ? "solid" : "outline"}
                bg={createMode ? ACCENT : "transparent"}
                color={createMode ? "white" : ACCENT}
                borderColor={ACCENT}
                borderRadius="full"
                onClick={() => setCreateMode(true)}
              >
                Crear cuenta nueva
              </Button>
              <Button
                size="xs"
                variant={!createMode ? "solid" : "outline"}
                bg={!createMode ? ACCENT : "transparent"}
                color={!createMode ? "white" : ACCENT}
                borderColor={ACCENT}
                borderRadius="full"
                onClick={() => setCreateMode(false)}
              >
                Ya tiene cuenta
              </Button>
            </HStack>

            {createMode ? (
              <>
                <Text fontSize="xs" color={subtitleColor} mb={4}>
                  Se crea una cuenta de Admin nueva, ya lista para iniciar sesión y administrar esta óptica.
                </Text>
                <SimpleGrid columns={2} spacing={3} mb={3}>
                  <Field label="Nombre" name="firstname" value={newAdminForm.firstname} onChange={handleNewAdminChange} inputBg={inputBg} borderColor={borderColor} />
                  <Field label="Apellido" name="lastname" value={newAdminForm.lastname} onChange={handleNewAdminChange} inputBg={inputBg} borderColor={borderColor} />
                  <Field label="C.I." name="ci" value={newAdminForm.ci} onChange={handleNewAdminChange} inputBg={inputBg} borderColor={borderColor} />
                  <Field label="Fecha de nacimiento" name="birthdate" type="date" value={newAdminForm.birthdate} onChange={handleNewAdminChange} inputBg={inputBg} borderColor={borderColor} />
                  <Field label="Edad" name="age" type="number" value={newAdminForm.age} onChange={handleNewAdminChange} inputBg={inputBg} borderColor={borderColor} />
                  <Field label="Celular" name="phone_number" value={newAdminForm.phone_number} onChange={handleNewAdminChange} inputBg={inputBg} borderColor={borderColor} />
                  <Field label="Nombre de usuario" name="username" value={newAdminForm.username} onChange={handleNewAdminChange} inputBg={inputBg} borderColor={borderColor} />
                  <Field label="Correo" name="email" type="email" value={newAdminForm.email} onChange={handleNewAdminChange} inputBg={inputBg} borderColor={borderColor} />
                </SimpleGrid>
                <Field label="Contraseña" name="password" type="password" value={newAdminForm.password} onChange={handleNewAdminChange} inputBg={inputBg} borderColor={borderColor} />
              </>
            ) : (
              <>
                <Text fontSize="xs" color={subtitleColor} mb={3}>
                  Elige un usuario existente para que administre esta óptica. Si ese usuario ya administra otra óptica, será reasignado aquí.
                </Text>
                <Select
                  placeholder="Selecciona un usuario"
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  borderRadius="10px"
                  bg={inputBg}
                  borderColor={borderColor}
                  _focus={{ borderColor: ACCENT, boxShadow: `0 0 0 1px ${ACCENT}` }}
                >
                  {eligibleUsers.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.firstname} {u.lastname} — {u.email}
                    </option>
                  ))}
                </Select>
              </>
            )}
          </ModalBody>
          <ModalFooter gap={2}>
            <Button variant="ghost" size="sm" onClick={onAssignClose}>Cancelar</Button>
            {createMode ? (
              <Button size="sm" bg={ACCENT} color="white" _hover={{ bg: "#00967f" }} onClick={handleCreateAdmin} isLoading={isSaving} loadingText="Creando...">
                Crear Admin
              </Button>
            ) : (
              <Button size="sm" bg={ACCENT} color="white" _hover={{ bg: "#00967f" }} onClick={handleAssign} isLoading={isSaving} isDisabled={!selectedUserId}>
                Guardar
              </Button>
            )}
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Confirmación desactivar / reactivar óptica */}
      <AlertDialog isOpen={isStatusOpen} leastDestructiveRef={cancelRef} onClose={onStatusClose} isCentered>
        <AlertDialogOverlay>
          <AlertDialogContent borderRadius="20px" mx={4}>
            <AlertDialogHeader fontWeight="800">
              {pendingStatus?.mode === "deactivate" ? "Desactivar óptica" : "Reactivar óptica"}
            </AlertDialogHeader>
            <AlertDialogBody>
              {pendingStatus?.mode === "deactivate"
                ? `${pendingStatus?.branch?.name} dejará de aparecer como activa en todo el sistema, pero conserva su historial (ventas, usuarios, etc.). Puedes reactivarla cuando quieras.`
                : `${pendingStatus?.branch?.name} volverá a estar activa y disponible en todo el sistema.`}
            </AlertDialogBody>
            <AlertDialogFooter gap={3}>
              <Button ref={cancelRef} variant="ghost" onClick={onStatusClose} borderRadius="10px">Cancelar</Button>
              <Button
                colorScheme={pendingStatus?.mode === "deactivate" ? "orange" : "teal"}
                onClick={handleConfirmStatus}
                borderRadius="10px"
              >
                {pendingStatus?.mode === "deactivate" ? "Desactivar" : "Reactivar"}
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </Box>
  );
};

export default SuperAdminOpticas;
