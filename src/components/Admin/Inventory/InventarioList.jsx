import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../../api/supabase.js";
import {
  Box,
  Button,
  Heading,
  Input,
  Table,
  Tbody,
  Text,
  Td,
  Th,
  Thead,
  Tr,
  Select,
  useToast,
  useColorModeValue,
  HStack,
  Flex,
  Spacer,
  IconButton,
  Tooltip,
  Divider,
  Stack,
} from "@chakra-ui/react";
import { FaEye, FaEdit, FaTrash, FaSave } from "react-icons/fa";
import SmartHeader from "../../header/SmartHeader.jsx";
import GenerateInventoryReport from "./Report.jsx";

const InventarioList = () => {
  const [inventoryList, setInventoryList] = useState([]);
  const [search, setSearch] = useState("");
  const [totalStock, setTotalStock] = useState(0);
  const [branchFilter, setBranchFilter] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editableData, setEditableData] = useState({});
  const [branches, setBranches] = useState([]);
  const navigate = useNavigate();
  const toast = useToast();

  useEffect(() => {
    fetchInventory();
    fetchBranches();
  }, []);

  useEffect(() => {
    calculateTotalStock();
  }, [inventoryList, branchFilter]);

  const fetchInventory = async () => {
    const { data, error } = await supabase
      .from("inventario")
      .select("id, price, brand, quantity, branchs_id, branchs(name)");

    if (error) {
      console.error("Error fetching inventory:", error);
    } else {
      setInventoryList(data);
    }
  };

  const fetchBranches = async () => {
    const { data, error } = await supabase.from("branchs").select("id, name");
    if (!error) {
      setBranches(data);
    }
  };

  const calculateTotalStock = () => {
    if (!branchFilter) {
      setTotalStock(0);
      return;
    }
    const filteredInventory = inventoryList.filter(
      (item) => item.branchs_id === Number(branchFilter)
    );
    const total = filteredInventory.reduce((acc, item) => acc + item.quantity, 0);
    setTotalStock(total);
  };

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
  };

  const handleDelete = async (id) => {
    const { error } = await supabase.from("inventario").delete().match({ id });
    if (error) {
      toast({
        title: "Error",
        description: "No se pudo eliminar el inventario.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } else {
      toast({
        title: "Éxito",
        description: "Inventario eliminado correctamente.",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      fetchInventory();
    }
  };

  const handleEdit = (id, item) => {
    setEditingId(id);
    setEditableData(item);
  };

  const handleChange = (e, field) => {
    setEditableData({ ...editableData, [field]: e.target.value });
  };

  const handleSave = async (id) => {
    const { error } = await supabase
      .from("inventario")
      .update({
        brand: editableData.brand,
        quantity: editableData.quantity,
        price: editableData.price,
        branchs_id: editableData.branchs_id,
      })
      .match({ id });

    if (error) {
      toast({
        title: "Error",
        description: "No se pudo actualizar el inventario.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } else {
      toast({
        title: "Éxito",
        description: "Inventario actualizado correctamente.",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      setEditingId(null);
      fetchInventory();
    }
  };

  const moduleSpecificButton = (
    <Button
      onClick={() => handleNavigate('/Inventory')}
      bg={useColorModeValue(
        'rgba(255, 255, 255, 0.8)',
        'rgba(255, 255, 255, 0.1)'
      )}
      backdropFilter="blur(10px)"
      border="1px solid"
      borderColor={useColorModeValue(
        'rgba(56, 178, 172, 0.3)',
        'rgba(56, 178, 172, 0.5)'
      )}
      color={useColorModeValue('teal.600', 'teal.300')}
      size="sm"
      borderRadius="15px"
      px={4}
      _hover={{
        bg: useColorModeValue(
          'rgba(56, 178, 172, 0.1)',
          'rgba(56, 178, 172, 0.2)'
        ),
        borderColor: 'teal.400',
        transform: 'translateY(-1px)',
      }}
      transition="all 0.2s"
    >
      <HStack spacing={2} align="center" justify="center">
        <FaEye size="14px" />
        <Text fontWeight="600" lineHeight="1" m={0}>
          Registrar Inventario
        </Text>
      </HStack>
    </Button>
  );

  const bgColor = useColorModeValue("gray.50", "gray.900");
  const textColor = useColorModeValue("gray.800", "gray.100");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const tableBg = useColorModeValue("white", "gray.800");
  const tableHoverBg = useColorModeValue("teal.50", "teal.900");
  const selectBg = useColorModeValue("white", "gray.800");

  const handleNavigate = (route = null) => {
    const user = JSON.parse(localStorage.getItem("user"));
    if (route) {
      navigate(route);
      return;
    }
    if (!user || !user.role_id) {
      navigate("/LoginForm");
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

  return (
    <Box w="100%" bg={bgColor}
      color={textColor}>
      <Box
        p={{ base: 2, md: 8 }}
        mx="auto"
        bg={bgColor}
        color={textColor}
        minH="100vh"
        w="80%"
      >
        <SmartHeader moduleSpecificButton={moduleSpecificButton} />
        <Flex
          direction={{ base: "column", md: "row" }}
          align="center"
          justify="space-between"
          mb={6}
          gap={4}
        >
          <Heading
            textAlign="left"
            size="lg"
            fontWeight="extrabold"
            color={useColorModeValue("teal.700", "teal.200")}
            letterSpacing="tight"
          >
            Inventario
          </Heading>
          <Box minW="250px" >
            <Select
              placeholder="Filtrar por sucursal"
              onChange={(e) => setBranchFilter(parseInt(e.target.value))}
              bg={selectBg}
              borderColor={borderColor}
              color={textColor}
              size="md"
              borderRadius="full"
              boxShadow="sm"
              _hover={{
                borderColor: useColorModeValue("teal.300", "teal.500"),
              }}
              _focus={{
                borderColor: useColorModeValue("teal.500", "teal.300"),
                boxShadow: useColorModeValue(
                  "0 0 0 1px teal.500",
                  "0 0 0 1px teal.300"
                ),
              }}
            >
              {branches.map((branch) => (
                <option key={branch.id} value={branch.id}>
                  {branch.name}
                </option>
              ))}
            </Select>
          </Box>
        </Flex>
        <Divider mb={4} />
        {branchFilter &&
          inventoryList.filter((item) => item.branchs_id === Number(branchFilter))
            .length === 0 ? (
          <Box py={10}>
            <Text textAlign="center" color="gray.400" fontSize="xl">
              No hay inventario para esta sucursal
            </Text>
          </Box>
        ) : (
          branchFilter && (
            <>
              <Flex
                mb={4}
                align="center"
                justify="space-between"
                direction={{ base: "column", md: "row" }}
                gap={4}
              >
                <Input
                  placeholder="Buscar por marca"
                  value={search}
                  onChange={handleSearchChange}
                  bg={selectBg}
                  borderColor={borderColor}
                  color={textColor}
                  fontWeight="medium"
                  size="md"
                  borderRadius="full"
                  boxShadow="sm"
                  maxW="350px"
                  _hover={{
                    borderColor: useColorModeValue("teal.300", "teal.500"),
                  }}
                  _focus={{
                    borderColor: useColorModeValue("teal.500", "teal.300"),
                    boxShadow: useColorModeValue(
                      "0 0 0 1px teal.500",
                      "0 0 0 1px teal.300"
                    ),
                  }}
                />
                <Box>
                  <Text
                    fontSize="md"
                    fontWeight="bold"
                    color={useColorModeValue("teal.700", "teal.200")}
                    bg={useColorModeValue("teal.50", "teal.900")}
                    px={4}
                    py={2}
                    borderRadius="full"
                    boxShadow="sm"
                    display="inline-block"
                  >
                    Stock total: {totalStock}
                  </Text>
                </Box>
              </Flex>
              <Box
                width="100%"
                overflowX="auto"
                borderRadius="xl"
                boxShadow="lg"
                bg={tableBg}
                p={2}
              >
                <Table variant="simple" size="md">
                  <Thead>
                    <Tr bg={useColorModeValue("teal.100", "teal.800")}>
                      <Th color={textColor} borderColor={borderColor} py={3}>
                        Marca
                      </Th>
                      <Th color={textColor} borderColor={borderColor} py={3}>
                        Cantidad
                      </Th>
                      <Th color={textColor} borderColor={borderColor} py={3}>
                        Precio
                      </Th>
                      <Th color={textColor} borderColor={borderColor} py={3}>
                        Sucursal
                      </Th>
                      <Th color={textColor} borderColor={borderColor} py={3}>
                        Acciones
                      </Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {inventoryList
                      .filter((item) => item.branchs_id === Number(branchFilter))
                      .filter((item) =>
                        item.brand.toLowerCase().includes(search.toLowerCase())
                      )
                      .map((item) => (
                        <Tr
                          key={item.id}
                          onClick={(e) => {
                            if (editingId && editingId !== item.id)
                              setEditingId(null);
                            e.stopPropagation();
                          }}
                          cursor="pointer"
                          _hover={{ bg: tableHoverBg }}
                          borderColor={borderColor}
                          transition="background 0.2s"
                        >
                          <Td color={textColor} borderColor={borderColor}>
                            {editingId === item.id ? (
                              <Input
                                value={editableData.brand}
                                onChange={(e) => handleChange(e, "brand")}
                                size="sm"
                                borderRadius="md"
                                bg={useColorModeValue("gray.50", "gray.700")}
                              />
                            ) : (
                              <Text fontWeight="semibold">{item.brand}</Text>
                            )}
                          </Td>
                          <Td color={textColor} borderColor={borderColor}>
                            {editingId === item.id ? (
                              <Input
                                type="number"
                                value={editableData.quantity}
                                onChange={(e) => handleChange(e, "quantity")}
                                size="sm"
                                borderRadius="md"
                                bg={useColorModeValue("gray.50", "gray.700")}
                              />
                            ) : (
                              <Text>{item.quantity}</Text>
                            )}
                          </Td>
                          <Td color={textColor} borderColor={borderColor}>
                            {editingId === item.id ? (
                              <Input
                                type="number"
                                value={editableData.price}
                                onChange={(e) => handleChange(e, "price")}
                                size="sm"
                                borderRadius="md"
                                bg={useColorModeValue("gray.50", "gray.700")}
                              />
                            ) : (
                              <Text>${item.price}</Text>
                            )}
                          </Td>
                          <Td color={textColor} borderColor={borderColor}>
                            <Text>{item.branchs?.name || "N/A"}</Text>
                          </Td>
                          <Td color={textColor} borderColor={borderColor}>
                            <Stack direction="row" spacing={2}>
                              {editingId === item.id ? (
                                <Tooltip label="Guardar" hasArrow>
                                  <IconButton
                                    icon={<FaSave />}
                                    colorScheme="green"
                                    size="sm"
                                    onClick={() => handleSave(item.id)}
                                    aria-label="Guardar"
                                    borderRadius="md"
                                  />
                                </Tooltip>
                              ) : (
                                <Tooltip label="Editar" hasArrow>
                                  <IconButton
                                    icon={<FaEdit />}
                                    colorScheme="teal"
                                    size="sm"
                                    onClick={() => handleEdit(item.id, item)}
                                    aria-label="Editar"
                                    borderRadius="md"
                                  />
                                </Tooltip>
                              )}
                              <Tooltip label="Eliminar" hasArrow>
                                <IconButton
                                  icon={<FaTrash />}
                                  colorScheme="red"
                                  size="sm"
                                  onClick={() => handleDelete(item.id)}
                                  aria-label="Eliminar"
                                  borderRadius="md"
                                />
                              </Tooltip>
                            </Stack>
                          </Td>
                        </Tr>
                      ))}
                  </Tbody>
                </Table>

              </Box>
              <Box mt={6} >
                <GenerateInventoryReport
                  branchFilter={branchFilter}
                  inventoryList={inventoryList}
                />
              </Box>
            </>
          )
        )}
      </Box>
    </Box>
  );
};

export default InventarioList;
