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
        <Box 
        p={6} 
        maxW="1300px" 
        mx="auto" 
        bg={bgColor}
        color={textColor}
        minH="100vh"
      >
            <SmartHeader moduleSpecificButton={moduleSpecificButton} />
            <Box w="100%" maxW= "1500px" mb={4}>
                        <Heading 
                            mb={4} 
                            textAlign="left" 
                            size="md"
                            fontWeight="700"
                            color={useColorModeValue('teal.600', 'teal.300')}
                            pb={2}
                        >
                            Lista de Abonos
                        </Heading>
                        </Box>
            <Input placeholder='Buscar Abono...' value={search} onChange={(e) => setSearch(e.target.value)} mb={4} w="50%" mx="auto" display="block" 
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
                            {['Fecha', 'Paciente', 'Sucursal', 'Total', 'Abono', 'Saldo', 'Pago En', 'Acción'].map((header) => (
                                <Th key={header} color={textColor} borderColor={borderColor}>{header}</Th>
                            ))}
                        </Tr>
                    </Thead>
                    <Tbody>
                        {filteredBalance.map((balance) => (
                            <Tr>
                                <Td color={textColor} borderColor={borderColor}>{balance.date}</Td>
                                <Td color={textColor} borderColor={borderColor}>{balance.patients.pt_firstname} {balance.patients.pt_lastname}</Td>
                                <Td color={textColor} borderColor={borderColor}>{balance.branchs?.name || 'N/A'}</Td>
                                <Td color={textColor} borderColor={borderColor}>{balance.total}</Td>
                                <Td color={textColor} borderColor={borderColor}>
                                    {editingId === balance.id ? (
                                        <Input name="balance" value={editableData.balance} onChange={handleChange} />
                                    ) : (
                                        balance.balance
                                    )}
                                </Td>
                                <Td color={textColor} borderColor={borderColor}>{balance.credit}</Td>
                                <Td color={textColor} borderColor={borderColor}>
                                    {editingId === balance.id ? (
                                        <Select name="payment_balance" value={editableData.payment_balance} onChange={handleChange}>
                                            <option value="">Seleccione</option>
                                            <option value="efectivo">Efectivo</option>
                                            <option value="datafast">Datafast</option>
                                            <option value="transferencia">Transferencia</option>
                                        </Select>
                                    ) : (
                                        balance.payment_balance || 'N/A'
                                    )}
                                </Td>
                                <Td textAlign="center" color={textColor} borderColor={borderColor}>
                                    {editingId === balance.id ? (
                                        <>
                                            <IconButton icon={<BiCheck />} colorScheme="green" onClick={() => handleSave(balance.id)} mr={2} />
                                            <IconButton icon={<BiX />} colorScheme="red" onClick={() => setEditingId(null)} />
                                        </>
                                    ) : (
                                        <>
                                            <IconButton icon={<BiEdit />} colorScheme="blue" onClick={() => handleEdit(balance)} mr={2} />
                                            <IconButton icon={<BiTrash />} colorScheme="red" onClick={() => openConfirm(balance.id)} />
                                        </>
                                    )}
                                </Td>
                            </Tr>
                        ))}
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
    );
};

export default ListBalance;
