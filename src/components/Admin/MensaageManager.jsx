import { useEffect, useState } from "react";
import {
  Box,
  Button,
  Textarea,
  VStack,
  Heading,
  useToast,
  Spinner,
  Flex,
  IconButton,
  Text,
  useColorModeValue,
  Select,
  Divider,
  Card,
  CardBody,
  CardHeader,
  CardFooter,
  HStack,
  Badge,
  Tooltip,
} from "@chakra-ui/react";
import { supabase } from "../../api/supabase";
import { EditIcon, DeleteIcon } from "@chakra-ui/icons";
import { useNavigate } from "react-router-dom";
import SmartHeader from "../header/SmartHeader";

const MessageManager = () => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const toast = useToast();
  const [tenantId, setTenantId] = useState(null);
  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState(null);
  const [selectedRoute, setSelectedRoute] = useState("");
  const navigate = useNavigate();

  const predefinedRoutes = [
    { value: "/retreats-patients", label: "Retiros" },
    { value: "/sales", label: "Ventas" },
    { value: "/balances-patient", label: "Saldos" },
  ];

  const getRouteLabel = (route) => {
    const found = predefinedRoutes.find(r => r.value === route);
    return found ? found.label : route;
  };

  useEffect(() => {
    getTenantId();
    fetchBranches();
    // eslint-disable-next-line
  }, []);

  const getTenantId = async () => {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) throw error;
      const tid = user?.user_metadata?.tenant_id;
      if (!tid) throw new Error("El usuario no tiene tenant_id.");
      setTenantId(tid);
    } catch (error) {
      toast({ title: "Error al obtener tenant_id", description: error.message, status: "error" });
    }
  };

  const fetchBranches = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("branchs").select("id, name");
    if (error) {
      toast({ title: "Error al obtener sucursales", status: "error" });
    } else {
      setBranches(data);
    }
    setLoading(false);
  };

  const fetchMessages = async () => {
    if (!selectedBranch || !selectedRoute) {
      setMessages([]);
      return;
    }
    setLoading(true);
    const { data, error } = await supabase
      .from("messages")
      .select("id, content, branch_id, route")
      .eq("branch_id", selectedBranch)
      .eq("route", selectedRoute);

    if (error) {
      toast({ title: "Error al obtener mensajes", status: "error" });
    } else {
      setMessages(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (selectedBranch && selectedRoute) {
      fetchMessages();
    }
    // eslint-disable-next-line
  }, [selectedBranch, selectedRoute]);

  const handleSave = async () => {
    if (!newMessage.trim() || !selectedBranch || !selectedRoute) return;
    setLoading(true);

    if (editingId) {
      const { error } = await supabase
        .from("messages")
        .update({ content: newMessage, branch_id: selectedBranch, route: selectedRoute })
        .eq("id", editingId);

      if (error) {
        toast({ title: "Error al actualizar", status: "error" });
      } else {
        toast({ title: "Mensaje actualizado", status: "success" });
        setEditingId(null);
      }
    } else {
      const { error } = await supabase
        .from("messages")
        .insert({ content: newMessage, tenant_id: tenantId, branch_id: selectedBranch, route: selectedRoute });

      if (error) {
        toast({ title: "Error al guardar", description: error.message, status: "error" });
      } else {
        toast({ title: "Mensaje guardado", status: "success" });
      }
    }

    setNewMessage("");
    fetchMessages();
    setLoading(false);
  };

  const handleEdit = (message) => {
    setNewMessage(message.content);
    setEditingId(message.id);
    setSelectedBranch(message.branch_id);
    setSelectedRoute(message.route);
  };

  const handleDelete = async (id) => {
    setLoading(true);
    const { error } = await supabase.from("messages").delete().eq("id", id);
    if (error) {
      toast({ title: "Error al eliminar", status: "error" });
    } else {
      toast({ title: "Mensaje eliminado", status: "success" });
      fetchMessages();
    }
    setLoading(false);
  };

  const moduleSpecificButton = null;

  const boxBg = useColorModeValue("gray.50", "gray.800");
  const textColor = useColorModeValue("gray.800", "white");
  const borderColor = useColorModeValue("gray.200", "gray.600");
  const selectBg = useColorModeValue("white", "gray.700");
  const cardBg = useColorModeValue("white", "gray.700");

  return (
    <Box p={{ base: 2, md: 6 }} mx="auto" minHeight="100vh" bg={useColorModeValue("gray.50", "gray.900")}>
      <SmartHeader moduleSpecificButton={moduleSpecificButton} />
      <Heading mt="4" size="lg" mb={6} textAlign="center" color="teal.600" letterSpacing="tight">
        Gestión de Mensajes
      </Heading>

      <Card bg={cardBg} boxShadow="lg" borderRadius="xl" mb={8} maxW="900px" mx="auto">
        <CardHeader pb={0}>
          <Heading size="md" color="teal.500" mb={2}>Nuevo Mensaje</Heading>
        </CardHeader>
        <CardBody>
          <VStack spacing={4} align="stretch">
            <Box>
              <Text fontWeight="bold" mb={1}>Sucursal</Text>
              <Select
                placeholder="Selecciona una sucursal"
                value={selectedBranch || ""}
                onChange={(e) => {
                  setSelectedBranch(Number(e.target.value));
                  setEditingId(null);
                }}
                bg={selectBg}
                borderColor={borderColor}
                size="md"
                fontWeight="medium"
                _focus={{ borderColor: "teal.400" }}
              >
                {branches.map(branch => (
                  <option key={branch.id} value={branch.id}>{branch.name}</option>
                ))}
              </Select>
            </Box>

            <Box>
              <Text fontWeight="bold" mb={1}>Ruta (interfaz)</Text>
              <Select
                placeholder="Selecciona una ruta"
                value={selectedRoute}
                onChange={(e) => {
                  setSelectedRoute(e.target.value);
                  setEditingId(null);
                }}
                bg={selectBg}
                borderColor={borderColor}
                size="md"
                fontWeight="medium"
                _focus={{ borderColor: "teal.400" }}
              >
                {predefinedRoutes.map(route => (
                  <option key={route.value} value={route.value}>{route.label}</option>
                ))}
              </Select>
            </Box>

            <Box>
              <Text fontWeight="bold" mb={1}>Mensaje</Text>
              <Textarea
                placeholder="Escribe un mensaje..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                rows={5}
                bg={selectBg}
                borderColor={borderColor}
                size="md"
                _focus={{ borderColor: "teal.400" }}
                resize="vertical"
              />
            </Box>
          </VStack>
        </CardBody>
        <CardFooter pt={0} justify="flex-end">
          <Button
            colorScheme="teal"
            onClick={handleSave}
            isLoading={loading}
            isDisabled={!selectedBranch || !selectedRoute}
            px={8}
            borderRadius="full"
            fontWeight="bold"
            shadow="md"
          >
            {editingId ? "Actualizar Mensaje" : "Guardar Mensaje"}
          </Button>
        </CardFooter>
      </Card>

      <Divider my={4} />

      <Heading size="md" mt={6} mb={4} color="teal.600" letterSpacing="tight" maxW={900} mx="auto" textAlign="center">
        Mensajes Guardados
      </Heading>

      {loading && <Spinner size="lg" color="teal.500" mt={4} />}
      {!loading && messages.length === 0 && (
        <Text color="gray.500" textAlign="center" mt={6}>
          No hay mensajes guardados para esta sucursal y ruta.
        </Text>
      )}

      <VStack spacing={4} align="stretch" mt={2} maxW={900} mx="auto">
        {!loading && messages.map((msg) => (
          <Card
            key={msg.id}
            bg="white"
            border={`1px solid ${borderColor}`}
            borderRadius="lg"
            boxShadow="sm"
            _hover={{ boxShadow: "md", borderColor: "teal.300" }}
            transition="all 0.2s"
          >
            <CardBody py={3} px={4}>
              <Flex justify="space-between" align="flex-start">
                <Box flex="1">
                  <HStack mb={1}>
                    <Badge colorScheme="teal" fontSize="0.85em">
                      {getRouteLabel(msg.route)}
                    </Badge>
                  </HStack>
                  <Text fontWeight="medium" color={textColor} whiteSpace="pre-wrap" fontSize="md">
                    {msg.content}
                  </Text>
                </Box>
                <HStack spacing={1} ml={4}>
                  <Tooltip label="Editar" hasArrow>
                    <IconButton
                      icon={<EditIcon />}
                      size="sm"
                      variant="ghost"
                      colorScheme="teal"
                      aria-label="Editar"
                      onClick={() => handleEdit(msg)}
                    />
                  </Tooltip>
                  <Tooltip label="Eliminar" hasArrow>
                    <IconButton
                      icon={<DeleteIcon />}
                      size="sm"
                      variant="ghost"
                      colorScheme="red"
                      aria-label="Eliminar"
                      onClick={() => handleDelete(msg.id)}
                    />
                  </Tooltip>
                </HStack>
              </Flex>
            </CardBody>
          </Card>
        ))}
      </VStack>
    </Box>
  );
};

export default MessageManager;
