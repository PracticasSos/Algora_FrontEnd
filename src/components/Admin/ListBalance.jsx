import { Box, Button, Flex, Heading, IconButton, Input, Table, Tbody, Td, Thead, Tr, useToast, Th, Select, useColorModeValue, HStack, Text  } from "@chakra-ui/react";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../api/supabase";
import { BiEdit, BiTrash, BiCheck, BiX } from 'react-icons/bi';
import ConfirmDialog from '../../components/UI/ConfirmDialog';
import { FaEye } from 'react-icons/fa';
import SmartHeader from "../header/SmartHeader";

const ListBalance = () => {
    const [listBalance, setListBalance] = useState([]);
    const [search, setSearch] = useState('');
    const [editingId, setEditingId] = useState(null);
    const [editableData, setEditableData] = useState({ balance: "", payment_balance: "" });
    const [isOpen, setIsOpen] = useState(false);
    const [selectedId, setSelectedId] = useState(null);
    const toast = useToast();
    const navigate = useNavigate();

    useEffect(() => {
        fetchListBalance();
    }, []);

    const fetchListBalance = async () => {
        const { data, error } = await supabase
            .from('sales')
            .select('id, date, branchs:branchs_id(name), total, credit, balance, payment_balance, patients:patient_id(pt_firstname, pt_lastname)');
        if (error) {
            toast({ title: 'Error', description: 'Error al obtener los abonos', status: 'error' });
        } else {
            setListBalance(data);
        }
    };

    const handleEdit = (balance) => {
        setEditingId(balance.id);
        setEditableData({ balance: balance.balance, payment_balance: balance.payment_balance });
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setEditableData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSave = async (id) => {
        const { error } = await supabase.from('sales').update(editableData).match({ id });
        if (!error) {
            toast({ title: 'Éxito', description: 'Abono actualizado correctamente.', status: 'success' });
            setEditingId(null);
            fetchListBalance();
        } else {
            toast({ title: 'Error', description: 'No se pudo actualizar el abono.', status: 'error' });
        }
    };

    const openConfirm = (id) => {
        setSelectedId(id);
        setIsOpen(true);
    };

    const handleConfirm = () => {
        setIsOpen(false);
        handleDelete(selectedId);
    };

    const handleCancel = () => setIsOpen(false);

    const handleDelete = async (id) => {
        const { error } = await supabase.from('sales').delete().match({ id });
        if (!error) {
            toast({ title: 'Éxito', description: 'Abono eliminado correctamente.', status: 'success' });
            fetchListBalance();
        } else {
            toast({ title: 'Error', description: 'No se pudo eliminar el abono.', status: 'error' });
        }
    };

    const filteredBalance = listBalance.filter((balance) =>
    (balance.patients?.pt_firstname?.toLowerCase().includes(search.toLowerCase()) ||
    balance.patients?.pt_lastname?.toLowerCase().includes(search.toLowerCase()))
    );

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

    const moduleSpecificButton = (
  <Button 
    onClick={() => handleNavigate('/balance')} 
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
        Registrar Abono
      </Text>
    </HStack>
  </Button>
  );

    const bgColor = useColorModeValue('white', 'gray.800');
    const textColor = useColorModeValue('gray.800', 'white');
    const borderColor = useColorModeValue('gray.200', 'gray.600');
    const tableBg = useColorModeValue('white', 'gray.700');
    const selectBg = useColorModeValue('white', 'gray.700');

    return (
        <Box p={{ base: 2, md: 8 }} minH="100vh" bg={useColorModeValue('gray.50', 'gray.900')}>
      <SmartHeader moduleSpecificButton={moduleSpecificButton} />
        <Box
            p={{ base: 4, md: 8 }}
            maxW="1600px"
            mx="auto"
            color={textColor}
            transition="box-shadow 0.2s"
        >
            <Box w="100%" maxW="1500px" mb={4}>
                <Heading
                    mb={2}
                    textAlign="left"
                    size="lg"
                    fontWeight="800"
                    color={useColorModeValue('teal.600', 'teal.200')}
                    pb={1}
                    letterSpacing="tight"
                >
                    Lista de Abonos
                </Heading>
                <Text fontSize="md" color={useColorModeValue('gray.500', 'gray.400')} mb={2}>
                    Consulta, edita o elimina los abonos registrados.
                </Text>
            </Box>
            <Flex mb={6} align="center" justify="flex-start">
                <Input
                    placeholder="Buscar por nombre de paciente..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    w={{ base: "100%", md: "350px" }}
                    bg={selectBg}
                    borderColor={borderColor}
                    color={textColor}
                    borderRadius="md"
                    px={6}
                    py={2}
                    fontSize="md"
                    boxShadow={useColorModeValue('sm', 'dark-lg')}
                    _placeholder={{ color: useColorModeValue('gray.400', 'gray.500') }}
                    _hover={{
                        borderColor: useColorModeValue('teal.300', 'teal.500'),
                        boxShadow: useColorModeValue('0 0 0 2px #81E6D9', '0 0 0 2px #319795'),
                    }}
                    _focus={{
                        borderColor: useColorModeValue('teal.500', 'teal.300'),
                        boxShadow: useColorModeValue('0 0 0 2px #38B2AC', '0 0 0 2px #4FD1C5'),
                    }}
                    transition="all 0.2s"
                />
            </Flex>
            <Box
                width="100%"
                maxWidth="1500px"
                overflowX="auto"
                borderRadius="lg"
                boxShadow={useColorModeValue('md', 'dark-lg')}
                bg={tableBg}
            >
                <Table variant="simple" size="md">
                    <Thead>
                        <Tr bg={useColorModeValue('teal.50', 'teal.900')}>
                            {['Fecha', 'Paciente', 'Sucursal', 'Total', 'Abono', 'Saldo', 'Pago En', 'Acción'].map((header) => (
                                <Th
                                    key={header}
                                    color={useColorModeValue('teal.700', 'teal.200')}
                                    borderColor={borderColor}
                                    fontWeight="bold"
                                    fontSize="md"
                                    py={3}
                                    letterSpacing="wide"
                                >
                                    {header}
                                </Th>
                            ))}
                        </Tr>
                    </Thead>
                    <Tbody>
                        {filteredBalance.length === 0 ? (
                            <Tr>
                                <Td colSpan={8} textAlign="center" py={8} color={useColorModeValue('gray.400', 'gray.500')}>
                                    No se encontraron abonos.
                                </Td>
                            </Tr>
                        ) : (
                            filteredBalance.map((balance) => (
                                <Tr
                                    key={balance.id}
                                    _hover={{
                                        bg: useColorModeValue('teal.50', 'teal.800'),
                                        transition: 'background 0.2s',
                                    }}
                                >
                                    <Td color={textColor} borderColor={borderColor} fontWeight="medium">
                                        {balance.date}
                                    </Td>
                                    <Td color={textColor} borderColor={borderColor}>
                                        <Text fontWeight="semibold">
                                            {balance.patients.pt_firstname} {balance.patients.pt_lastname}
                                        </Text>
                                    </Td>
                                    <Td color={textColor} borderColor={borderColor}>
                                        {balance.branchs?.name || (
                                            <Text color="gray.400" fontStyle="italic">N/A</Text>
                                        )}
                                    </Td>
                                    <Td color={textColor} borderColor={borderColor}>
                                        <Text fontWeight="bold">${balance.total}</Text>
                                    </Td>
                                    <Td color={textColor} borderColor={borderColor}>
                                        {editingId === balance.id ? (
                                            <Input
                                                name="balance"
                                                value={editableData.balance}
                                                onChange={handleChange}
                                                size="sm"
                                                borderRadius="md"
                                                bg={selectBg}
                                                borderColor={borderColor}
                                                _focus={{ borderColor: 'teal.400' }}
                                            />
                                        ) : (
                                            <Text color="teal.500" fontWeight="bold">
                                                ${balance.balance}
                                            </Text>
                                        )}
                                    </Td>
                                    <Td color={textColor} borderColor={borderColor}>
                                        <Text fontWeight="medium">${balance.credit}</Text>
                                    </Td>
                                    <Td color={textColor} borderColor={borderColor}>
                                        {editingId === balance.id ? (
                                            <Select
                                                name="payment_balance"
                                                value={editableData.payment_balance}
                                                onChange={handleChange}
                                                size="sm"
                                                borderRadius="md"
                                                bg={selectBg}
                                                borderColor={borderColor}
                                                _focus={{ borderColor: 'teal.400' }}
                                            >
                                                <option value="">Seleccione</option>
                                                <option value="efectivo">Efectivo</option>
                                                <option value="datafast">Datafast</option>
                                                <option value="transferencia">Transferencia</option>
                                            </Select>
                                        ) : (
                                            <Text color={balance.payment_balance ? "teal.600" : "gray.400"}>
                                                {balance.payment_balance || 'N/A'}
                                            </Text>
                                        )}
                                    </Td>
                                    <Td textAlign="center" color={textColor} borderColor={borderColor}>
                                        {editingId === balance.id ? (
                                            <HStack spacing={2} justify="center">
                                                <IconButton
                                                    icon={<BiCheck />}
                                                    colorScheme="teal"
                                                    aria-label="Guardar"
                                                    onClick={() => handleSave(balance.id)}
                                                    size="sm"
                                                    borderRadius="full"
                                                    boxShadow="sm"
                                                />
                                                <IconButton
                                                    icon={<BiX />}
                                                    colorScheme="gray"
                                                    aria-label="Cancelar"
                                                    onClick={() => setEditingId(null)}
                                                    size="sm"
                                                    borderRadius="full"
                                                    boxShadow="sm"
                                                />
                                            </HStack>
                                        ) : (
                                            <HStack spacing={2} justify="center">
                                                <IconButton
                                                    icon={<BiEdit />}
                                                    colorScheme="teal"
                                                    aria-label="Editar"
                                                    onClick={() => handleEdit(balance)}
                                                    size="sm"
                                                    borderRadius="full"
                                                    variant="ghost"
                                                    _hover={{ bg: useColorModeValue('teal.100', 'teal.700') }}
                                                />
                                                <IconButton
                                                    icon={<BiTrash />}
                                                    colorScheme="red"
                                                    aria-label="Eliminar"
                                                    onClick={() => openConfirm(balance.id)}
                                                    size="sm"
                                                    borderRadius="full"
                                                    variant="ghost"
                                                    _hover={{ bg: useColorModeValue('red.100', 'red.700') }}
                                                />
                                            </HStack>
                                        )}
                                    </Td>
                                </Tr>
                            ))
                        )}
                    </Tbody>
                </Table>
            </Box>
            <ConfirmDialog
                isOpen={isOpen}
                onClose={handleCancel}
                onConfirm={handleConfirm}
                title="¿Eliminar abono?"
                body="¿Está seguro de que desea eliminar este abono?"
            />
        </Box>
        </Box>
    );
};

export default ListBalance;
