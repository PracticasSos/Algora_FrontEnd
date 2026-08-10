import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../api/supabase";
import {
  Box, Container, Heading, Text, Input, Flex, HStack, VStack, Icon, Badge,
  IconButton, Spinner, useColorModeValue, Modal, ModalOverlay, ModalContent,
  ModalHeader, ModalCloseButton, ModalBody, ModalFooter, Select, Button,
  useToast, Checkbox, SimpleGrid, Divider, Avatar,
} from "@chakra-ui/react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import {
  Users, Search as SearchIcon, Pencil, ShieldCheck, MapPin, Mail,
  UserCog, Sparkles, Building2, KeyRound, UserPlus, Send,
} from "lucide-react";
import SmartHeader from "../header/SmartHeader";
import { adminNavSections } from "../../config/adminNavConfig";

const ACCENT = "#00A88E";

// Solo estos roles se pueden ASIGNAR desde aquí — "Superusuario" (u otro
// rol especial) queda fuera por ahora, se trabajará en eso más adelante.
// Si alguien ya tenía ese rol asignado, igual se sigue mostrando su
// nombre correctamente (esto solo filtra las opciones para elegir).
const ALLOWED_ROLE_NAMES = ["Admin", "Optometra", "Vendedor"];
const ROLE_COLORS = ["#00A88E", "#2B6CB0", "#805AD5", "#DD6B20", "#D53F8C", "#38B2AC"];
const ROLE_GRADIENTS = [
  "linear(to-br, #00A88E, #00786A)",
  "linear(to-br, #2B6CB0, #1A4E85)",
  "linear(to-br, #805AD5, #5B3A9E)",
  "linear(to-br, #DD6B20, #A8500F)",
  "linear(to-br, #D53F8C, #9F2D6B)",
];

const initials = (u) => `${(u.firstname || "?")[0] || ""}${(u.lastname || "")[0] || ""}`.toUpperCase();

const UserManagement = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [branches, setBranches] = useState([]);
  const [roles, setRoles] = useState([]);
  const [permCounts, setPermCounts] = useState({}); // user_id -> cantidad de permisos personalizados
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [editRole, setEditRole] = useState("");
  const [editBranch, setEditBranch] = useState("");
  const [editPermissions, setEditPermissions] = useState([]);
  const [useCustomPermissions, setUseCustomPermissions] = useState(false);
  const [loadingPerms, setLoadingPerms] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const toast = useToast();

  useEffect(() => {
    fetchUsers();
    fetchBranches();
    fetchRoles();
    fetchPermCounts();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("users")
      .select("id, firstname, lastname, email, role_id, branch_id")
      .order("firstname", { ascending: true });
    if (error) {
      console.error("Error cargando usuarios:", error);
    } else {
      setUsers(data || []);
    }
    setLoading(false);
  };

  const fetchBranches = async () => {
    const { data, error } = await supabase.from("branchs").select("id, name");
    if (!error) setBranches(data || []);
  };

  const fetchRoles = async () => {
    const { data, error } = await supabase.from("role").select("*");
    if (!error) setRoles(data || []);
  };

  const fetchPermCounts = async () => {
    const { data, error } = await supabase.from("user_permissions").select("user_id");
    if (error) return;
    const counts = {};
    (data || []).forEach((p) => { counts[p.user_id] = (counts[p.user_id] || 0) + 1; });
    setPermCounts(counts);
  };

  const branchName = (id) => branches.find((b) => String(b.id) === String(id))?.name || "Sin asignar";
  const roleName = (id) => roles.find((r) => String(r.id) === String(id))?.role_name || "Sin rol";
  const roleColorIndex = (id) => {
    const idx = roles.findIndex((r) => String(r.id) === String(id));
    return idx === -1 ? ROLE_COLORS.length - 1 : idx % ROLE_COLORS.length;
  };

  const filtered = users.filter((u) => {
    if (!search.trim()) return true;
    const term = search.toLowerCase();
    return (
      u.firstname?.toLowerCase().includes(term) ||
      u.lastname?.toLowerCase().includes(term) ||
      u.email?.toLowerCase().includes(term)
    );
  });

  // --- Datos para la gráfica de distribución por rol ---
  const roleDistribution = roles
    .map((r) => ({
      name: r.role_name,
      value: users.filter((u) => String(u.role_id) === String(r.id)).length,
    }))
    .filter((r) => r.value > 0);

  const branchesCovered = new Set(users.filter((u) => u.branch_id).map((u) => u.branch_id)).size;
  const withCustomPerms = Object.keys(permCounts).length;

  const openEdit = async (u) => {
    setEditingUser(u);
    setEditRole(String(u.role_id || ""));
    setEditBranch(String(u.branch_id || ""));
    setIsEditOpen(true);
    setLoadingPerms(true);

    const { data, error } = await supabase
      .from("user_permissions")
      .select("route")
      .eq("user_id", u.id);

    setLoadingPerms(false);

    if (error) {
      console.error("Error cargando permisos:", error);
      setUseCustomPermissions(false);
      setEditPermissions([]);
    } else {
      const routes = (data || []).map((p) => p.route);
      setUseCustomPermissions(routes.length > 0);
      setEditPermissions(routes);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);

    const { error: userError } = await supabase
      .from("users")
      .update({
        role_id: editRole ? Number(editRole) : null,
        branch_id: editBranch ? Number(editBranch) : null,
      })
      .eq("id", editingUser.id);

    if (userError) {
      setIsSaving(false);
      toast({ title: "Error", description: "No se pudo actualizar rol/sucursal.", status: "error", duration: 5000, isClosable: true });
      return;
    }

    const { error: deleteError } = await supabase
      .from("user_permissions")
      .delete()
      .eq("user_id", editingUser.id);

    if (deleteError) {
      setIsSaving(false);
      toast({ title: "Error", description: "No se pudieron limpiar los permisos anteriores.", status: "error", duration: 5000, isClosable: true });
      return;
    }

    if (useCustomPermissions && editPermissions.length > 0) {
      const { data: sessionData } = await supabase.auth.getSession();
      const tenantId = sessionData?.session?.user?.user_metadata?.tenant_id;
      const rows = editPermissions.map((route) => ({ user_id: editingUser.id, route, tenant_id: tenantId }));

      const { error: insertError } = await supabase.from("user_permissions").insert(rows);
      if (insertError) {
        setIsSaving(false);
        toast({ title: "Error", description: "No se pudieron guardar los permisos nuevos.", status: "error", duration: 5000, isClosable: true });
        return;
      }
    }

    setIsSaving(false);
    toast({ title: "Usuario actualizado", status: "success", duration: 3000, isClosable: true });
    setIsEditOpen(false);
    fetchUsers();
    fetchPermCounts();
  };

  const [isSendingReset, setIsSendingReset] = useState(false);

  const handleSendPasswordReset = async () => {
    if (!editingUser?.email) return;
    setIsSendingReset(true);
    const { error } = await supabase.auth.resetPasswordForEmail(editingUser.email);
    setIsSendingReset(false);

    if (error) {
      toast({ title: "Error", description: "No se pudo enviar el correo de recuperación.", status: "error", duration: 5000, isClosable: true });
    } else {
      toast({
        title: "Correo enviado",
        description: `Se envió un link de recuperación de contraseña a ${editingUser.email}.`,
        status: "success",
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const togglePermission = (path) => {
    setEditPermissions((prev) =>
      prev.includes(path) ? prev.filter((p) => p !== path) : [...prev, path]
    );
  };

  const cardBg = useColorModeValue("white", "gray.700");
  const inputBg = useColorModeValue("gray.50", "gray.700");
  const borderColor = useColorModeValue("gray.200", "gray.600");
  const subtitleColor = useColorModeValue("gray.500", "gray.400");
  const sectionIconBg = useColorModeValue("#E6FBF6", "rgba(0,168,142,0.15)");
  const tooltipBg = useColorModeValue("#fff", "#2D3748");
  const userCardBg = useColorModeValue("gray.50", "gray.750");

  const SectionTitle = ({ icon, children }) => (
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

  return (
    <Box minHeight="100vh" bgGradient={useColorModeValue("linear(to-br, gray.50, teal.50)", "linear(to-br, gray.900, #0d1f1c)")}>
      <SmartHeader moduleSpecificButton={null} />

      <Container maxW="1200px" py={8} px={{ base: 3, md: 6 }}>
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
                <Flex
                  align="center" justify="center" boxSize="44px" borderRadius="14px"
                  bgGradient="linear(to-br, #00A88E, #00786A)" color="white"
                  boxShadow="0 6px 16px -4px rgba(0,168,142,0.5)"
                  position="relative"
                >
                  <Icon as={UserCog} boxSize="20px" />
                </Flex>
                <VStack align="start" spacing={0}>
                  <HStack>
                    <Heading size="lg" fontWeight="800" color={useColorModeValue("gray.800", "white")} letterSpacing="tight">
                      Configuración de Usuarios
                    </Heading>
                    <Icon as={Sparkles} color={ACCENT} boxSize="16px" />
                  </HStack>
                  <Text fontSize="xs" color={subtitleColor}>
                    Sucursales, roles y permisos, todo en un solo lugar
                  </Text>
                </VStack>
              </HStack>
              <Button
                leftIcon={<UserPlus size={16} />}
                bg={ACCENT}
                color="white"
                _hover={{ bg: "#00967f" }}
                borderRadius="12px"
                onClick={() => navigate("/register")}
              >
                Registrar nuevo usuario
              </Button>
            </Flex>

            {loading ? (
              <Flex justify="center" py={16}><Spinner color={ACCENT} /></Flex>
            ) : (
              <>
                {/* KPIs */}
                <SimpleGrid columns={{ base: 2, md: 4 }} spacing={4} mb={6}>
                  <KpiCard icon={Users} label="Usuarios totales" value={users.length} gradient={ROLE_GRADIENTS[0]} />
                  <KpiCard icon={Building2} label="Sucursales cubiertas" value={`${branchesCovered}/${branches.length}`} gradient={ROLE_GRADIENTS[1]} />
                  <KpiCard icon={KeyRound} label="Con permisos a medida" value={withCustomPerms} gradient={ROLE_GRADIENTS[2]} />
                  <KpiCard icon={ShieldCheck} label="Roles activos" value={roleDistribution.length} gradient={ROLE_GRADIENTS[3]} />
                </SimpleGrid>

                {/* Gráfica de distribución por rol */}
                {roleDistribution.length > 0 && (
                  <Flex
                    p={4}
                    borderRadius="16px"
                    bg={inputBg}
                    border={`1px solid ${borderColor}`}
                    mb={6}
                    align="center"
                    gap={6}
                    flexWrap="wrap"
                  >
                    <Box h="140px" w="140px" flexShrink={0}>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={roleDistribution} dataKey="value" nameKey="name" innerRadius={35} outerRadius={60} paddingAngle={3}>
                            {roleDistribution.map((entry, idx) => (
                              <Cell key={entry.name} fill={ROLE_COLORS[idx % ROLE_COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip contentStyle={{ background: tooltipBg, border: `1px solid ${borderColor}`, borderRadius: "10px", fontSize: "12px" }} />
                        </PieChart>
                      </ResponsiveContainer>
                    </Box>
                    <VStack align="start" spacing={2} flex="1" minW="180px">
                      <Text fontSize="xs" fontWeight="bold" color={subtitleColor} textTransform="uppercase">Distribución por rol</Text>
                      {roleDistribution.map((r, idx) => (
                        <HStack key={r.name} spacing={2} fontSize="sm">
                          <Box boxSize="10px" borderRadius="full" bg={ROLE_COLORS[idx % ROLE_COLORS.length]} />
                          <Text>{r.name}</Text>
                          <Text color={subtitleColor}>({r.value})</Text>
                        </HStack>
                      ))}
                    </VStack>
                  </Flex>
                )}

                <SectionTitle icon={Users}>Todos los usuarios</SectionTitle>

                <Flex position="relative" mb={5}>
                  <Icon as={SearchIcon} position="absolute" left="14px" top="12px" color={subtitleColor} zIndex={1} />
                  <Input
                    placeholder="Buscar por nombre, apellido o correo..."
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

                {filtered.length === 0 ? (
                  <Text textAlign="center" color={subtitleColor} py={12}>No se encontraron usuarios.</Text>
                ) : (
                  <SimpleGrid columns={{ base: 1, sm: 2, lg: 3 }} spacing={4}>
                    {filtered.map((u) => {
                      const colorIdx = roleColorIndex(u.role_id);
                      const hasCustom = !!permCounts[u.id];
                      return (
                        <Box
                          key={u.id}
                          p={4}
                          borderRadius="16px"
                          bg={userCardBg}
                          border={`1px solid ${borderColor}`}
                          position="relative"
                          transition="all 0.2s ease"
                          _hover={{ transform: "translateY(-3px)", boxShadow: "lg", borderColor: ROLE_COLORS[colorIdx] }}
                        >
                          <IconButton
                            icon={<Pencil size={13} />}
                            size="xs"
                            variant="ghost"
                            colorScheme="teal"
                            aria-label="Editar usuario"
                            position="absolute"
                            top={2}
                            right={2}
                            onClick={() => openEdit(u)}
                          />
                          <HStack spacing={3} mb={3}>
                            <Avatar
                              name={initials(u)}
                              size="md"
                              bg={ROLE_COLORS[colorIdx]}
                              color="white"
                              fontWeight="bold"
                              getInitials={() => initials(u)}
                            />
                            <Box minW={0}>
                              <Text fontWeight="bold" fontSize="sm" noOfLines={1}>{u.firstname} {u.lastname}</Text>
                              <HStack spacing={1}>
                                <Icon as={Mail} boxSize="10px" color={subtitleColor} />
                                <Text fontSize="xs" color={subtitleColor} noOfLines={1}>{u.email}</Text>
                              </HStack>
                            </Box>
                          </HStack>

                          <HStack spacing={2} mb={2} flexWrap="wrap">
                            <Badge bg={ROLE_COLORS[colorIdx]} color="white" borderRadius="full" px={2} fontSize="10px">
                              {roleName(u.role_id)}
                            </Badge>
                            {hasCustom && (
                              <Badge colorScheme="purple" borderRadius="full" px={2} fontSize="10px">
                                {permCounts[u.id]} permiso{permCounts[u.id] !== 1 ? "s" : ""} a medida
                              </Badge>
                            )}
                          </HStack>

                          <HStack spacing={1}>
                            <Icon as={MapPin} boxSize="12px" color={subtitleColor} />
                            <Text fontSize="xs" color={subtitleColor}>{branchName(u.branch_id)}</Text>
                          </HStack>
                        </Box>
                      );
                    })}
                  </SimpleGrid>
                )}
              </>
            )}
          </Box>
        </Box>
      </Container>

      {/* Modal de edición */}
      <Modal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} size={{ base: "full", md: "xl" }} isCentered>
        <ModalOverlay backdropFilter="blur(2px)" />
        <ModalContent bg={cardBg} borderRadius={{ base: 0, md: "20px" }}>
          <ModalHeader fontSize="md">
            <HStack>
              <Avatar name={editingUser ? initials(editingUser) : ""} size="sm" bg={ACCENT} color="white" getInitials={() => (editingUser ? initials(editingUser) : "")} />
              <Text>{editingUser?.firstname} {editingUser?.lastname}</Text>
            </HStack>
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <Box p={3} borderRadius="10px" bg={inputBg} border={`1px solid ${borderColor}`} mb={5}>
              <Flex justify="space-between" align="center" flexWrap="wrap" gap={2}>
                <Box>
                  <Text fontSize="xs" color={subtitleColor} mb={1}>Correo (inicio de sesión)</Text>
                  <Text fontSize="sm" fontWeight="medium">{editingUser?.email}</Text>
                </Box>
                <Button
                  size="xs"
                  variant="outline"
                  colorScheme="blue"
                  leftIcon={<Send size={12} />}
                  onClick={handleSendPasswordReset}
                  isLoading={isSendingReset}
                >
                  Enviar link de recuperación
                </Button>
              </Flex>
              <Text fontSize="10px" color={subtitleColor} mt={2}>
                El correo no se puede editar desde aquí (cambia el inicio de sesión) — para actualizarlo hay que hacerlo con más cuidado desde el propio usuario o soporte técnico.
              </Text>
            </Box>

            <SimpleGrid columns={{ base: 1, sm: 2 }} spacing={4} mb={5}>
              <Box>
                <Text fontSize="xs" color={subtitleColor} mb={1}>Rol</Text>
                <Select
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value)}
                  borderRadius="10px"
                  bg={inputBg}
                  borderColor={borderColor}
                  _focus={{ borderColor: ACCENT, boxShadow: `0 0 0 1px ${ACCENT}` }}
                >
                  <option value="">Sin rol</option>
                  {roles.filter((r) => ALLOWED_ROLE_NAMES.includes(r.role_name)).map((r) => <option key={r.id} value={r.id}>{r.role_name}</option>)}
                </Select>
              </Box>
              <Box>
                <Text fontSize="xs" color={subtitleColor} mb={1}>Sucursal</Text>
                <Select
                  value={editBranch}
                  onChange={(e) => setEditBranch(e.target.value)}
                  placeholder="Sin asignar"
                  borderRadius="10px"
                  bg={inputBg}
                  borderColor={borderColor}
                  _focus={{ borderColor: ACCENT, boxShadow: `0 0 0 1px ${ACCENT}` }}
                >
                  {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                </Select>
              </Box>
            </SimpleGrid>

            <Divider mb={4} />

            <HStack spacing={2} mb={3}>
              <Icon as={ShieldCheck} color={ACCENT} boxSize="16px" />
              <Text fontWeight="bold" fontSize="sm">Permisos de acceso</Text>
            </HStack>

            {loadingPerms ? (
              <Flex justify="center" py={6}><Spinner color={ACCENT} size="sm" /></Flex>
            ) : (
              <>
                <Checkbox
                  isChecked={useCustomPermissions}
                  onChange={(e) => setUseCustomPermissions(e.target.checked)}
                  colorScheme="teal"
                  mb={3}
                >
                  Personalizar qué pantallas puede ver (si no, ve todo según su rol)
                </Checkbox>

                {useCustomPermissions && (
                  <Box maxH="320px" overflowY="auto" pr={2}>
                    {adminNavSections.map((section) => (
                      <Box key={section.id} mb={3}>
                        <Text fontSize="xs" fontWeight="bold" color={subtitleColor} textTransform="uppercase" mb={1}>
                          {section.title}
                        </Text>
                        <SimpleGrid columns={{ base: 1, sm: 2 }} spacing={1}>
                          {section.items.map((item) => (
                            <Checkbox
                              key={item.path}
                              size="sm"
                              isChecked={editPermissions.includes(item.path)}
                              onChange={() => togglePermission(item.path)}
                              colorScheme="teal"
                            >
                              {item.label}
                            </Checkbox>
                          ))}
                        </SimpleGrid>
                      </Box>
                    ))}
                  </Box>
                )}
              </>
            )}
          </ModalBody>
          <ModalFooter gap={2}>
            <Button variant="ghost" size="sm" onClick={() => setIsEditOpen(false)}>Cancelar</Button>
            <Button size="sm" bg={ACCENT} color="white" _hover={{ bg: "#00967f" }} onClick={handleSave} isLoading={isSaving}>
              Guardar cambios
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default UserManagement;
