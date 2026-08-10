import React, { useEffect, useState } from "react";
import { supabase } from "../../api/supabase";
import {
  Box, Container, Heading, Table, Thead, Tbody, Tr, Th, Td,
  Select, Button, Badge, SimpleGrid, Input,
  useColorModeValue, useToast, Flex, HStack, VStack, Icon, Text, Spinner,
} from "@chakra-ui/react";
import { TrendingDown, Plus, User, MapPin } from "lucide-react";
import SmartHeader from "../header/SmartHeader";
import { useAuth } from "../AuthContext";

const ACCENT = "#00A88E";
const todayStr = () => new Date().toLocaleDateString("en-CA");

const Egresos = () => {
  const { user } = useAuth();
  const [records, setRecords] = useState([]);
  const [branches, setBranches] = useState([]);
  const [labs, setLabs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const toast = useToast();

  // La sucursal y el encargado ya no se preguntan — se toman directo de
  // la sesión de quien inició sesión, así no hay margen de error.
  const myBranchId = user?.branch_id || "";

  const [newEgreso, setNewEgreso] = useState({
    lab_id: "",
    value: 0,
    payment_in: "",
    specification: "",
  });

  useEffect(() => {
    fetchBranches();
    fetchLabs();
  }, []);

  useEffect(() => {
    if (myBranchId) fetchEgresos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [myBranchId]);

  const fetchBranches = async () => {
    const { data, error } = await supabase.from("branchs").select("id, name");
    if (!error) setBranches(data || []);
  };

  const fetchLabs = async () => {
    const { data, error } = await supabase.from("labs").select("id, name");
    if (!error) setLabs(data || []);
  };

  const fetchEgresos = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("egresos")
      .select(`id, records, date, value, specification, payment_in, users (firstname), labs (name), branchs (name)`)
      .eq("date", todayStr())
      .eq("branchs_id", myBranchId)
      .order("id", { ascending: false });

    if (error) {
      console.error("Error fetching egresos:", error);
    } else {
      setRecords(data || []);
    }
    setLoading(false);
  };

  const handleInputChange = (field, value) => {
    setNewEgreso((prev) => ({ ...prev, [field]: value }));
  };

  const handleSaveEgreso = async () => {
    if (!myBranchId) {
      toast({ title: "Sin sucursal asignada", description: "Tu usuario no tiene una sucursal asignada — pídele al admin que te la asigne en Configuración de Usuarios.", status: "warning", duration: 6000, isClosable: true });
      return;
    }
    if (!newEgreso.value || Number(newEgreso.value) <= 0) {
      toast({ title: "Valor inválido", description: "El monto del egreso debe ser mayor a 0.", status: "warning", duration: 4000, isClosable: true });
      return;
    }
    if (!newEgreso.payment_in) {
      toast({ title: "Falta el método de pago", status: "warning", duration: 4000, isClosable: true });
      return;
    }

    setIsSaving(true);
    const { error } = await supabase.from("egresos").insert({
      ...newEgreso,
      user_id: user.id,
      branchs_id: myBranchId,
      date: todayStr(),
    });
    setIsSaving(false);

    if (error) {
      toast({ title: "Error", description: "No se pudo registrar el egreso: " + error.message, status: "error", duration: 5000, isClosable: true });
      return;
    }

    toast({ title: "Egreso registrado", status: "success", duration: 3000, isClosable: true });
    setNewEgreso({ lab_id: "", value: 0, payment_in: "", specification: "" });
    fetchEgresos();
  };

  const cardBg = useColorModeValue("white", "gray.700");
  const inputBg = useColorModeValue("gray.50", "gray.700");
  const borderColor = useColorModeValue("gray.200", "gray.600");
  const subtitleColor = useColorModeValue("gray.500", "gray.400");
  const sectionIconBg = useColorModeValue("#E6FBF6", "rgba(0,168,142,0.15)");
  const rowHoverBg = useColorModeValue("gray.50", "whiteAlpha.100");

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

  const totalHoy = records.reduce((sum, r) => sum + (Number(r.value) || 0), 0);

  return (
    <Box minHeight="100vh" bgGradient={useColorModeValue("linear(to-br, gray.50, teal.50)", "linear(to-br, gray.900, #0d1f1c)")}>
      <SmartHeader moduleSpecificButton={null} />

      <Container maxW="1150px" py={8} px={{ base: 3, md: 6 }}>
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
                  <Icon as={TrendingDown} boxSize="20px" />
                </Flex>
                <VStack align="start" spacing={0}>
                  <Heading size="lg" fontWeight="800" color={useColorModeValue("gray.800", "white")} letterSpacing="tight">
                    Egresos
                  </Heading>
                  <Text fontSize="xs" color={subtitleColor}>Salidas de dinero registradas hoy</Text>
                </VStack>
              </HStack>
              <VStack align="end" spacing={0}>
                <HStack spacing={1} fontSize="xs" color={subtitleColor}>
                  <Icon as={MapPin} boxSize="12px" />
                  <Text>{branches.find((b) => String(b.id) === String(myBranchId))?.name || "Sin sucursal asignada"}</Text>
                </HStack>
                <HStack spacing={1} fontSize="xs" color={subtitleColor}>
                  <Icon as={User} boxSize="12px" />
                  <Text>{user?.firstname || user?.email}</Text>
                </HStack>
              </VStack>
            </Flex>

            {!myBranchId ? (
              <Text textAlign="center" color={subtitleColor} py={12}>
                Tu usuario no tiene una sucursal asignada. Pídele a un administrador que te la asigne en Configuración de Usuarios.
              </Text>
            ) : (
              <>
                <SectionTitle icon={TrendingDown}>Egresos de hoy</SectionTitle>
                {loading ? (
                  <Flex justify="center" py={10}><Spinner color={ACCENT} /></Flex>
                ) : (
                  <>
                    <Box overflowX="auto" borderRadius="14px" border={`1px solid ${borderColor}`} mb={2}>
                      <Table variant="simple" size="sm">
                        <Thead>
                          <Tr>
                            <Th color={subtitleColor}>Encargado</Th>
                            <Th color={subtitleColor}>Laboratorio</Th>
                            <Th color={subtitleColor}>Especificación</Th>
                            <Th color={subtitleColor}>Método</Th>
                            <Th color={subtitleColor} textAlign="right">Valor</Th>
                          </Tr>
                        </Thead>
                        <Tbody>
                          {records.length === 0 ? (
                            <Tr><Td colSpan={5} textAlign="center" py={8} color={subtitleColor}>No hay egresos registrados hoy.</Td></Tr>
                          ) : (
                            records.map((r) => (
                              <Tr key={r.id} _hover={{ bg: rowHoverBg }}>
                                <Td>{r.users?.firstname || "—"}</Td>
                                <Td>{r.labs?.name || "—"}</Td>
                                <Td>{r.specification || "—"}</Td>
                                <Td>
                                  <Badge colorScheme={r.payment_in === "efectivo" ? "teal" : r.payment_in === "transferencia" ? "blue" : "purple"} borderRadius="full" px={2} textTransform="capitalize">
                                    {r.payment_in}
                                  </Badge>
                                </Td>
                                <Td textAlign="right" fontWeight="semibold">${Number(r.value).toFixed(2)}</Td>
                              </Tr>
                            ))
                          )}
                        </Tbody>
                      </Table>
                    </Box>
                    {records.length > 0 && (
                      <Text fontSize="xs" color={subtitleColor} textAlign="right" mb={8}>
                        Total del día: <Text as="span" fontWeight="bold" color="red.400">${totalHoy.toFixed(2)}</Text>
                      </Text>
                    )}
                  </>
                )}

                <SectionTitle icon={Plus}>Agregar nuevo egreso</SectionTitle>
                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4} mb={4}>
                  <Select
                    placeholder="Laboratorio (opcional)"
                    value={newEgreso.lab_id}
                    onChange={(e) => handleInputChange("lab_id", e.target.value)}
                    borderRadius="10px"
                    bg={inputBg}
                    borderColor={borderColor}
                    _focus={{ borderColor: ACCENT, boxShadow: `0 0 0 1px ${ACCENT}` }}
                  >
                    {labs.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
                  </Select>

                  <Input
                    placeholder="Valor"
                    type="number"
                    value={newEgreso.value === 0 ? "" : newEgreso.value}
                    onChange={(e) => handleInputChange("value", e.target.value)}
                    borderRadius="10px"
                    bg={inputBg}
                    borderColor={borderColor}
                    _focus={{ borderColor: ACCENT, boxShadow: `0 0 0 1px ${ACCENT}` }}
                  />

                  <Select
                    placeholder="Método de pago"
                    value={newEgreso.payment_in}
                    onChange={(e) => handleInputChange("payment_in", e.target.value)}
                    borderRadius="10px"
                    bg={inputBg}
                    borderColor={borderColor}
                    _focus={{ borderColor: ACCENT, boxShadow: `0 0 0 1px ${ACCENT}` }}
                  >
                    <option value="efectivo">Efectivo</option>
                    <option value="datafast">Datafast</option>
                    <option value="transferencia">Transferencia</option>
                  </Select>

                  <Input
                    placeholder="Especificación"
                    value={newEgreso.specification}
                    onChange={(e) => handleInputChange("specification", e.target.value)}
                    borderRadius="10px"
                    bg={inputBg}
                    borderColor={borderColor}
                    _focus={{ borderColor: ACCENT, boxShadow: `0 0 0 1px ${ACCENT}` }}
                  />
                </SimpleGrid>

                <Button
                  bg={ACCENT}
                  color="white"
                  _hover={{ bg: "#00967f" }}
                  size="lg"
                  borderRadius="12px"
                  leftIcon={<Plus size={16} />}
                  onClick={handleSaveEgreso}
                  isLoading={isSaving}
                  w={{ base: "100%", md: "auto" }}
                >
                  Guardar Egreso
                </Button>
              </>
            )}
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

export default Egresos;
