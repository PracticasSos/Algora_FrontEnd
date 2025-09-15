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

  const boxBg = useColorModeValue("gray.100", "gray.700");
  const textColor = useColorModeValue("gray.800", "white");
  const borderColor = useColorModeValue("gray.200", "gray.600");
  const selectBg = useColorModeValue("white", "gray.600");

  return (
    <Box p={6}  mx="auto">
      <SmartHeader moduleSpecificButton={moduleSpecificButton} />
      <Heading size="lg" mb={4} textAlign="center">Gestión de Mensajes</Heading>
      
      <VStack spacing={4} align="stretch" maxW="800px" mx="auto">
        <Box>
          <Text fontWeight="bold" mb={2}>Selecciona una sucursal:</Text>
          <Select
            placeholder="Selecciona una sucursal"
            value={selectedBranch || ""}
            onChange={(e) => {
              setSelectedBranch(Number(e.target.value));
              setEditingId(null);
            }}
            bg={selectBg}
            borderColor={borderColor}
          >
            {branches.map(branch => (
              <option key={branch.id} value={branch.id}>{branch.name}</option>
            ))}
          </Select>
        </Box>

        <Box>
          <Text fontWeight="bold" mb={2}>Selecciona una ruta (interfaz):</Text>
          <Select
            placeholder="Selecciona una ruta"
            value={selectedRoute}
            onChange={(e) => {
              setSelectedRoute(e.target.value);
              setEditingId(null);
            }}
            bg={selectBg}
            borderColor={borderColor}
          >
            {predefinedRoutes.map(route => (
              <option key={route.value} value={route.value}>{route.label}</option>
            ))}
          </Select>
        </Box>

        <Textarea
          placeholder="Escribe un mensaje..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          rows={5}
          bg={selectBg}
          borderColor={borderColor}
        />

        <Button
          colorScheme="teal"
          onClick={handleSave}
          isLoading={loading}
          alignSelf="flex-end"
          isDisabled={!selectedBranch || !selectedRoute}
        >
          {editingId ? "Actualizar Mensaje" : "Guardar Mensaje"}
        </Button>

        <Divider my={4} />
        <Heading size="md" mt={6}>Mensajes Guardados</Heading>
        {loading && <Spinner />}
        {!loading && messages.length === 0 && (
          <Text>No hay mensajes guardados para esta sucursal y ruta.</Text>
        )}
        {!loading && messages.map((msg) => (
          <Flex
            key={msg.id}
            p={4}
            boxShadow="md"
            borderRadius="md"
            justify="space-between"
            align="center"
            bg={boxBg}
            border={`1px solid ${borderColor}`}
            mb={2}
          >
            <Box>
              <Text fontWeight="semibold" color="teal.500">Ruta: {getRouteLabel(msg.route)}</Text>
              <Text whiteSpace="pre-wrap">{msg.content}</Text>
            </Box>
            <Box>
              <IconButton icon={<EditIcon />} size="sm" mr={2} onClick={() => handleEdit(msg)} />
              <IconButton icon={<DeleteIcon />} size="sm" colorScheme="red" onClick={() => handleDelete(msg.id)} />
            </Box>
          </Flex>
        ))}
      </VStack>
    </Box>
  );
};

export default MessageManager;
