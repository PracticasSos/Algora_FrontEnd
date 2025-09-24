import React, { useEffect, useState } from 'react';
import { supabase } from '../../api/supabase';
import {
  Box, Button, Heading, Table, Thead, Tbody, Tr, Th, Td, Input, Text, HStack, useToast, IconButton, useColorModeValue
} from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import { BiEdit, BiTrash, BiCheck, BiX } from 'react-icons/bi';
import ConfirmDialog from '../../components/UI/ConfirmDialog';
import { FaEye } from 'react-icons/fa';
import SmartHeader from '../header/SmartHeader';

const ListLab = () => {
    const [labs, setLabs] = useState([]);
    const [search, setSearch] = useState('');
    const [editingId, setEditingId] = useState(null);
    const [editableData, setEditableData] = useState({});
    const [isOpen, setIsOpen] = useState(false);
    const [selectedId, setSelectedId] = useState(null);
    const toast = useToast();
    const navigate = useNavigate();

    useEffect(() => {
        fetchLabs();
    }, []);

    const fetchLabs = async () => {
        const { data, error } = await supabase
            .from('labs')
            .select('*');

        if (error) {
            toast({ title: 'Error', description: 'Error al obtener los Laboratorios', status: 'error' });
        } else {
            setLabs(data);
        }
    };

    const handleEdit = (id, lab) => {
        setEditingId(id);
        setEditableData(lab);
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setEditableData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSave = async (id) => {
        const { error } = await supabase.from('labs').update(editableData).match({ id });
        if (!error) {
            toast({ title: 'Éxito', description: 'Laboratorio actualizado correctamente.', status: 'success' });
            setEditingId(null);
            fetchLabs();
        } else {
            toast({ title: 'Error', description: 'No se pudo actualizar el Laboratorio.', status: 'error' });
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
        const { error } = await supabase.from('labs').delete().match({ id });       
        if (!error) {
            toast({ title: 'Éxito', description: 'Laboratorio eliminado correctamente.', status: 'success' });
            fetchLabs();
        } else {
            toast({ title: 'Error', description: 'No se pudo eliminar el Laboratorio.', status: 'error' });
        }
    };

    const filteredLabs = labs.filter((lab) => 
        [lab.name].some((field) => field.toLowerCase().includes(search.toLowerCase()))
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
        onClick={() => handleNavigate('/labs')} 
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
            Registrar Laboratorio
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
                <Input placeholder='Buscar Laboratorio...' value={search} onChange={(e) => setSearch(e.target.value)} mb={4}  w="50%" mx="auto" display="block" 
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
                                {['Nombre', 'Dirección', 'Correo', 'Celular', 'RUC', 'Acciones'].map((header) => (
                                    <Th key={header} color={textColor} borderColor={borderColor}>{header}</Th>     
                                ))}
                            </Tr>
                        </Thead>
                        <Tbody>
                            {filteredLabs.map((lab) => (
                                <Tr key={lab.id} cursor="pointer" _hover={{ bg: tableHoverBg }} borderColor={borderColor}>
                                    {[
                                        'name', 'address', 'email', 'cell', 'ruc'
                                    ].map((field) => (
                                        <Td key={field} color={textColor} borderColor={borderColor}>
                                            {editingId === lab.id ? (
                                                <Input
                                                    name={field}
                                                    value={editableData[field] || ''}
                                                    onChange={handleChange}
                                                />
                                            ) : (
                                                lab[field] || 'N/A'
                                            )}
                                        </Td>
                                    ))}
                                    <Td textAlign="center" color={textColor} borderColor={borderColor}>
                                        {editingId === lab.id ? (
                                            <>
                                                <IconButton icon={<BiCheck />} colorScheme="green" onClick={() => handleSave(lab.id)} mr={2} />
                                                <IconButton icon={<BiX />} colorScheme="gray" onClick={() => setEditingId(null)} />
                                            </>
                                        ) : (
                                            <>
                                                <IconButton icon={<BiEdit />} colorScheme="yellow" onClick={() => handleEdit(lab.id, lab)} mr={2} />
                                                <IconButton icon={<BiTrash />} colorScheme="red" onClick={() => openConfirm(lab.id)} />
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
                    title="¿Eliminar laboratorio?"
                    body="Estas seguro de que deseas eliminar este laboratorio? "
                />
        </Box>
    );
};

export default ListLab;
