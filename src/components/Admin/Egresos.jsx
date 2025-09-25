import React, { useEffect, useState } from "react";
import { supabase } from "../../api/supabase";
import { useNavigate } from "react-router-dom";
import {
  Box, Heading, Table, Thead, Tbody, Tr, Th, Td,
  Select, Button, Badge, SimpleGrid, Input,
  useColorModeValue, useToast, Flex, Stack, Divider, Icon
} from "@chakra-ui/react";
import { AddIcon } from "@chakra-ui/icons";
import SmartHeader from "../header/SmartHeader";

const Egresos = () => {
  const [records, setRecords] = useState([]);
  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState("");
  const [users, setUsers] = useState([]);
  const [labs, setLabs] = useState([]);
  const navigate = useNavigate();
  const toast = useToast();

  const [newEgreso, setNewEgreso] = useState({
    user_id: "",
    records: "",
    lab_id: "",
    value: 0,
    payment_in: "",
    specification: "",
    branchs_id: ""
  });

  useEffect(() => {
    fetchBranches();
    fetchUsers();
    fetchLabs();
  }, []);

  useEffect(() => {
    if (selectedBranch) fetchEgresos();
  }, [selectedBranch]);

  const fetchBranches = async () => {
    const { data, error } = await supabase.from("branchs").select("id, name");
    if (error) {
      console.error("Error fetching branches:", error);
      return;
    }
    setBranches(data || []);
  };

  const fetchUsers = async () => {
    const { data, error } = await supabase.from("users").select("id, firstname");
    if (error) {
      console.error("Error fetching users:", error);
      return;
    }
    setUsers(data || []);
  };

  const fetchLabs = async () => {
    const { data, error } = await supabase.from("labs").select("id, name");
    if (error) {
      console.error("Error fetching labs:", error);
      return;
    }
    setLabs(data || []);
  };

  const fetchEgresos = async () => {
    const today = new Date().toLocaleDateString("en-CA");
    const { data, error } = await supabase
      .from("egresos")
      .select(`id, records, date, value, specification, payment_in, users (firstname), labs (name), branchs (name)`)
      .eq("date", today)
      .eq("branchs_id", selectedBranch);

    if (error) {
      console.error("Error fetching egresos:", error);
      return;
    }
    setRecords(data || []);
  };

  const handleInputChange = (field, value) => {
    setNewEgreso((prev) => ({ ...prev, [field]: value }));
  };

  const handleSaveEgreso = async () => {
    if (!newEgreso.branchs_id) {
      toast({
        title: "Sucursal requerida",
        description: "Por favor, seleccione una sucursal para guardar el egreso.",
        status: "warning",
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    const today = new Date().toLocaleDateString("en-CA");
    const { data, error } = await supabase.from("egresos").insert({
      ...newEgreso,
      date: today,
    });

    if (error) {
      console.error("Error saving egreso:", error);
      toast({
        title: "Error",
        description: "No se pudo registrar el egreso: " + error.message,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
      return;
    } else {
      toast({
        title: "Éxito",
        description: "¡Egreso registrado con éxito!",
        status: "success",
        duration: 5000,
        isClosable: true,
      });
    }

    setNewEgreso({
      user_id: "",
      records: "",
      lab_id: "",
      branchs_id: "",
      value: 0,
      payment_in: "",
      specification: "",
    });
    fetchEgresos();
  };

  const handleNavigate = (route = null) => {
    const user = JSON.parse(localStorage.getItem("user"));
    if (route) {
      navigate(route);
      return;
    }
    if (!user || !user.role_id) {
      navigate("/login-form");
      return;
    }
    switch (user.role_id) {
      case 1:
        navigate("/Admin");
        break;
      case 2:
        navigate("/Optometra");
        break;
      case 3:
        navigate("/Vendedor");
        break;
      case 4:
        navigate("/SuperAdmin");
        break;
      default:
        navigate("/");
    }
  };

  const bgColor = useColorModeValue('gray.50', 'gray.900');
  const cardBg = useColorModeValue('white', 'gray.800');
  const textColor = useColorModeValue('gray.800', 'white');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const selectBg = useColorModeValue('white', 'gray.700');
  const shadow = useColorModeValue('md', 'dark-lg');

  const moduleSpecificButton = null;

  return (
    <Box p={{ base: 2, md: 8 }} minH="100vh" bg={bgColor} color={textColor}>
      <SmartHeader moduleSpecificButton={moduleSpecificButton} />
      <Box
        p={[2, 4, 6]}
        maxW="1300px"
        mx="auto"
        boxShadow={shadow}
        borderRadius="2xl"
        bg={cardBg}
      >
        <Flex
          mb={6}
          align="center"
          justify="space-between"
          direction={{ base: "column", md: "row" }}
          gap={4}
        >
          <Heading
            textAlign="left"
            size="lg"
            fontWeight="800"
            color={useColorModeValue("teal.700", "teal.200")}
            letterSpacing="tight"
          >
            Egresos
          </Heading>
          <Select
            placeholder="Seleccione una sucursal"
            value={selectedBranch}
            onChange={(e) => setSelectedBranch(e.target.value)}
            bg={selectBg}
            borderColor={borderColor}
            color={textColor}
            maxW={{ base: "100%", md: "300px" }}
            boxShadow="sm"
            _hover={{
              borderColor: useColorModeValue("gray.300", "gray.500"),
            }}
            _focus={{
              borderColor: useColorModeValue("blue.500", "blue.300"),
              boxShadow: useColorModeValue(
                "0 0 0 1px blue.500",
                "0 0 0 1px blue.300"
              ),
            }}
          >
            {branches.map((branch) => (
              <option key={branch.id} value={branch.id}>
                {branch.name}
              </option>
            ))}
          </Select>
        </Flex>

        <Box
          overflowX="auto"
          borderRadius="lg"
          boxShadow="base"
          bg={useColorModeValue("gray.50", "gray.800")}
          mb={8}
        >
          <Table variant="simple" size="md" width="100%">
            <Thead bg={useColorModeValue("teal.50", "teal.900")}>
              <Tr>
                <Th>Orden</Th>
                <Th>Fecha</Th>
                <Th>Encargado</Th>
                <Th>Laboratorio</Th>
                <Th>Valor</Th>
                <Th>Especificación</Th>
                <Th>Sucursal</Th>
                <Th>Pago</Th>
              </Tr>
            </Thead>
            <Tbody>
              {records.length === 0 ? (
                <Tr>
                  <Td colSpan={8} textAlign="center" py={8} color="gray.400">
                    No hay egresos registrados para hoy.
                  </Td>
                </Tr>
              ) : (
                records.map((record) => (
                  <Tr key={record.id} _hover={{ bg: useColorModeValue("gray.100", "gray.700") }}>
                    <Td fontWeight="bold">{record.id}</Td>
                    <Td>{record.date}</Td>
                    <Td>{record.users?.firstname || "Sin encargado"}</Td>
                    <Td>{record.labs?.name || "Sin laboratorio"}</Td>
                    <Td>
                      <Badge colorScheme="purple" fontSize="1em" px={2}>
                        ${record.value}
                      </Badge>
                    </Td>
                    <Td>{record.specification}</Td>
                    <Td>{record.branchs?.name || "Sin Sucursal"}</Td>
                    <Td>
                      <Badge
                        colorScheme={
                          record.payment_in === "efectivo"
                            ? "green"
                            : record.payment_in === "transferencia"
                            ? "blue"
                            : "orange"
                        }
                        px={2}
                        fontSize="1em"
                      >
                        {record.payment_in}
                      </Badge>
                    </Td>
                  </Tr>
                ))
              )}
            </Tbody>
          </Table>
        </Box>

        <Divider mb={8} />

        <Box
          bg={useColorModeValue("gray.50", "gray.800")}
          p={[4, 6]}
          borderRadius="xl"
          boxShadow="md"
          mx="auto"
        >
          <Flex align="center" mb={4} gap={2}>
            <Icon as={AddIcon} color="teal.400" />
            <Heading size="md" color="teal.600" fontWeight="700">
              Agregar Nuevo Egreso
            </Heading>
          </Flex>

          <Stack
            direction={{ base: "column", md: "row" }}
            spacing={6}
            align="flex-start"
            justify="space-between"
            width="100%"
          >
            <SimpleGrid
              columns={{ base: 1, md: 2 }}
              spacing={4}
              flex="1"
              width="100%"
            >
              <Select
                placeholder="Seleccione Encargado"
                value={newEgreso.user_id}
                onChange={(e) => handleInputChange("user_id", e.target.value)}
                bg={selectBg}
                borderColor={borderColor}
                color={textColor}
                width="100%"
                _hover={{
                  borderColor: useColorModeValue("gray.300", "gray.500"),
                }}
                _focus={{
                  borderColor: useColorModeValue("blue.500", "blue.300"),
                  boxShadow: useColorModeValue(
                    "0 0 0 1px blue.500",
                    "0 0 0 1px blue.300"
                  ),
                }}
              >
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.firstname}
                  </option>
                ))}
              </Select>

              <Select
                placeholder="Seleccione Laboratorio"
                value={newEgreso.lab_id}
                onChange={(e) => handleInputChange("lab_id", e.target.value)}
                bg={selectBg}
                borderColor={borderColor}
                color={textColor}
                width="100%"
                _hover={{
                  borderColor: useColorModeValue("gray.300", "gray.500"),
                }}
                _focus={{
                  borderColor: useColorModeValue("blue.500", "blue.300"),
                  boxShadow: useColorModeValue(
                    "0 0 0 1px blue.500",
                    "0 0 0 1px blue.300"
                  ),
                }}
              >
                {labs.map((lab) => (
                  <option key={lab.id} value={lab.id}>
                    {lab.name}
                  </option>
                ))}
              </Select>

              <Select
                placeholder="Seleccione una sucursal"
                value={newEgreso.branchs_id}
                onChange={(e) => handleInputChange("branchs_id", e.target.value)}
                bg={selectBg}
                borderColor={borderColor}
                color={textColor}
                width="100%"
                _hover={{
                  borderColor: useColorModeValue("gray.300", "gray.500"),
                }}
                _focus={{
                  borderColor: useColorModeValue("blue.500", "blue.300"),
                  boxShadow: useColorModeValue(
                    "0 0 0 1px blue.500",
                    "0 0 0 1px blue.300"
                  ),
                }}
              >
                {branches.map((branch) => (
                  <option key={branch.id} value={branch.id}>
                    {branch.name}
                  </option>
                ))}
              </Select>

              <Input
                placeholder="Valor"
                type="number"
                value={newEgreso.value === 0 ? "" : newEgreso.value}
                onChange={(e) => handleInputChange("value", e.target.value)}
                bg={selectBg}
                borderColor={borderColor}
                color={textColor}
                width="100%"
                _hover={{
                  borderColor: useColorModeValue("gray.300", "gray.500"),
                }}
                _focus={{
                  borderColor: useColorModeValue("blue.500", "blue.300"),
                  boxShadow: useColorModeValue(
                    "0 0 0 1px blue.500",
                    "0 0 0 1px blue.300"
                  ),
                }}
              />

              <Select
                placeholder="Método de Pago"
                value={newEgreso.payment_in}
                onChange={(e) => handleInputChange("payment_in", e.target.value)}
                bg={selectBg}
                borderColor={borderColor}
                color={textColor}
                width="100%"
                _hover={{
                  borderColor: useColorModeValue("gray.300", "gray.500"),
                }}
                _focus={{
                  borderColor: useColorModeValue("blue.500", "blue.300"),
                  boxShadow: useColorModeValue(
                    "0 0 0 1px blue.500",
                    "0 0 0 1px blue.300"
                  ),
                }}
              >
                <option value="efectivo">Efectivo</option>
                <option value="datafast">Datafast</option>
                <option value="transferencia">Transferencia</option>
              </Select>

              <Input
                placeholder="Especificación"
                value={newEgreso.specification}
                onChange={(e) => handleInputChange("specification", e.target.value)}
                bg={selectBg}
                borderColor={borderColor}
                color={textColor}
                width="100%"
                _hover={{
                  borderColor: useColorModeValue("gray.300", "gray.500"),
                }}
                _focus={{
                  borderColor: useColorModeValue("blue.500", "blue.300"),
                  boxShadow: useColorModeValue(
                    "0 0 0 1px blue.500",
                    "0 0 0 1px blue.300"
                  ),
                }}
              />
            </SimpleGrid>
            <Button
              colorScheme="teal"
              size="lg"
              alignSelf={{ base: "stretch", md: "flex-end" }}
              leftIcon={<AddIcon />}
              mt={[4, 0]}
              px={8}
              fontWeight="bold"
              boxShadow="md"
              onClick={handleSaveEgreso}
              _hover={{ bg: "teal.600" }}
            >
              Guardar Egreso
            </Button>
          </Stack>
        </Box>
      </Box>
    </Box>
  );
};

export default Egresos;
