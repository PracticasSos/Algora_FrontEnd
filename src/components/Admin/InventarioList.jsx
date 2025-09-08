import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../api/supabase.js";
import { Box, Button, Heading, Input, Table, Tbody, Text, Td, Th, Thead, Tr, Select, useToast, useColorModeValue, HStack } from "@chakra-ui/react";
import { FaEye } from 'react-icons/fa';
import SmartHeader from "../header/SmartHeader.jsx";
import GenerateInventoryReport from "./Inventory/Report.jsx";

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
    const filteredInventory = inventoryList.filter((item) => item.branchs_id === Number(branchFilter));  
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

  const bgColor = useColorModeValue('white', 'gray.800');
  const textColor = useColorModeValue('gray.800', 'white');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const tableBg = useColorModeValue('white', 'gray.700');
  const tableHoverBg = useColorModeValue('gray.100', 'gray.600');
  const selectBg = useColorModeValue('white', 'gray.700');

  const handleNavigate = (route = null) => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (route) {
        navigate(route);
        return;
    }
    if (!user || !user.role_id) {
        navigate('/LoginForm');
        return;
    }
    switch (user.role_id) {
        case 1:
            navigate('/Admin');
            break;
        case 2:
            navigate('/Optometra');
            break;
        case 3:
            navigate('/Vendedor');
            break;
        case 4:
            navigate('/SuperAdmin');
            break;
        default:
            navigate('/');
    }
  };

  return (
    <Box 
      p={6} 
      maxW="1300px" 
      mx="auto" 
      bg={bgColor}
      color={textColor}
      minH="100vh"
    >
      <SmartHeader moduleSpecificButton={moduleSpecificButton} />
      <Box w="100%" maxW= "800px" mb={4}>
            <Heading 
                mb={4} 
                textAlign="left" 
                size="md"
                fontWeight="700"
                color={useColorModeValue('teal.600', 'teal.300')}
                pb={2}
            >
                Listar Inventario
            </Heading>
            </Box>
      <Box w="50%" mx="auto" display="block">
      <Select placeholder="Filtrar por sucursal" onChange={(e) => setBranchFilter(parseInt(e.target.value))} mt={4} mb={4}
        bg={selectBg}
                  borderColor={borderColor}
                  color={textColor}
                  _hover={{
                    borderColor: useColorModeValue('gray.300', 'gray.500')
                  }}
                  _focus={{
                    borderColor: useColorModeValue('blue.500', 'blue.300'),
                    boxShadow: useColorModeValue('0 0 0 1px blue.500', '0 0 0 1px blue.300')
                  }}
        >
        {branches.map((branch) => (
          <option key={branch.id} value={branch.id}>{branch.name}</option>
        ))}
      </Select>
      </Box>
      {branchFilter && inventoryList.filter(item => item.branchs_id === Number(branchFilter)).length === 0 ? (
        <Text textAlign="center" color="gray.500">No hay inventario para esta sucursal</Text>
      ) : (
        branchFilter && (
          <>
            <Input
              placeholder="Buscar por marca"
              value={search}
              onChange={handleSearchChange}
              mt={4}
              mb={4}
              bg={selectBg}
              borderColor={borderColor}
              color={textColor}
              _hover={{
                borderColor: useColorModeValue('gray.300', 'gray.500')
              }}
              _focus={{
                borderColor: useColorModeValue('blue.500', 'blue.300'),
                boxShadow: useColorModeValue('0 0 0 1px blue.500', '0 0 0 1px blue.300')
              }}
            />
            <Box width="100%" maxWidth="1500px"  overflowX="auto">
              <Table bg={tableBg}  borderRadius="md" overflow="hidden">
                <Thead>
                  <Tr bg={useColorModeValue('gray.50', 'gray.600')}>
                    <Th color={textColor} borderColor={borderColor}>Marca</Th>
                    <Th color={textColor} borderColor={borderColor}>Cantidad</Th>
                    <Th color={textColor} borderColor={borderColor}>Precio</Th>
                    <Th color={textColor} borderColor={borderColor}>Sucursal</Th>
                    <Th color={textColor} borderColor={borderColor}>Acciones</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {inventoryList
                    .filter(item => item.branchs_id === Number(branchFilter)) 
                    .filter(item => item.brand.toLowerCase().includes(search.toLowerCase()))
                    .map((item) => (
                      <Tr key={item.id} onClick={(e) => { if (editingId && editingId !== item.id) setEditingId(null); e.stopPropagation(); }} cursor="pointer" _hover={{ bg: tableHoverBg }} borderColor={borderColor}>
                        <Td color={textColor} borderColor={borderColor}>
                          {editingId === item.id ? (
                            <Input value={editableData.brand} onChange={(e) => handleChange(e, "brand")} />
                          ) : (
                            item.brand
                          )}
                        </Td>
                        <Td color={textColor} borderColor={borderColor}>
                          {editingId === item.id ? (
                            <Input type="number" value={editableData.quantity} onChange={(e) => handleChange(e, "quantity")} />
                          ) : (
                            item.quantity
                          )}
                        </Td>
                        <Td color={textColor} borderColor={borderColor}>
                          {editingId === item.id ? (
                            <Input type="number" value={editableData.price} onChange={(e) => handleChange(e, "price")} />
                          ) : (
                            item.price
                          )}
                        </Td>
                        <Td color={textColor} borderColor={borderColor}>{item.branchs?.name || "N/A"}</Td>
                        <Td color={textColor} borderColor={borderColor}>
                          {editingId === item.id ? (
                            <Button colorScheme="green" size="sm" onClick={() => handleSave(item.id)}>Guardar</Button>
                          ) : (
                            <Button colorScheme="teal" size="sm" mr={2} onClick={() => handleEdit(item.id, item)}>Editar</Button>
                          )}
                          <Button colorScheme="red" size="sm" onClick={() => handleDelete(item.id)}>Eliminar</Button>
                        </Td>
                      </Tr>
                    ))}
                </Tbody>
              </Table>
              <Box mt={4} p={2} borderRadius="md" textAlign="right"
                bg={selectBg}
          borderColor={borderColor}
          color={textColor}
          _hover={{
            borderColor: useColorModeValue('gray.300', 'gray.500')
          }}
          _focus={{
            borderColor: useColorModeValue('blue.500', 'blue.300'),
            boxShadow: useColorModeValue('0 0 0 1px blue.500', '0 0 0 1px blue.300')
          }}
              >
                <Text fontSize="lg" fontWeight="bold">Stock total en esta sucursal: {totalStock}</Text>
              </Box>
              <GenerateInventoryReport branchFilter={branchFilter} inventoryList={inventoryList} />

            </Box>
          </>
        )
      )}
    </Box>
  );
};

export default InventarioList;
