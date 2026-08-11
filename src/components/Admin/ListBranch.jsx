import React, { useEffect, useState } from 'react';
import { supabase } from '../../api/supabase';
import {
    Box, Button, Heading, Table, Thead, Tbody, Tr, Th, Td, Input, useToast, Text, HStack, IconButton, useColorModeValue, Flex, Spacer, Badge
} from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import { BiEdit, BiTrash, BiCheck, BiX, BiPowerOff, BiRefresh } from 'react-icons/bi';
import ConfirmDialog from '../../components/UI/ConfirmDialog';
import { FaEye } from 'react-icons/fa';
import SmartHeader from '../header/SmartHeader';

const ListBranch = () => {
    const [branch, setBranch] = useState([]);
    const [search, setSearch] = useState('');
    const [editingId, setEditingId] = useState(null);
    const [editableData, setEditableData] = useState({});
    const [isOpen, setIsOpen] = useState(false);
    const [selectedId, setSelectedId] = useState(null);
    const [confirmMode, setConfirmMode] = useState('deactivate'); // 'deactivate' | 'delete'
    const [showInactive, setShowInactive] = useState(false);
    const toast = useToast();
    const navigate = useNavigate();

    useEffect(() => {
        fetchBranch();
    }, []);

    const fetchBranch = async () => {
        const { data, error } = await supabase
            .from('branchs')
            .select('*');
        if (error) {
            toast({ title: 'Error', description: 'Error al obtener las sucursales', status: 'error' });
        } else {
            setBranch(data);
        }
    };

    const handleEdit = (id, branch) => {
        setEditingId(id);
        setEditableData(branch);
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setEditableData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSave = async (id) => {
        const { error } = await supabase.from('branchs').update(editableData).match({ id });
        if (!error) {
            toast({ title: 'Éxito', description: 'Sucursal actualizada correctamente.', status: 'success' });
            setEditingId(null);
            fetchBranch();
        } else {
            toast({ title: 'Error', description: 'No se pudo actualizar la sucursal.', status: 'error' });
        }
    };

    const openConfirm = (id, mode = 'deactivate') => {
        setSelectedId(id);
        setConfirmMode(mode);
        setIsOpen(true);
    };

    const handleConfirm = () => {
        setIsOpen(false);
        if (confirmMode === 'delete') {
            handleDelete(selectedId);
        } else {
            handleDeactivate(selectedId);
        }
    };

    const handleCancel = () => setIsOpen(false);

    const handleDeactivate = async (id) => {
        const { error } = await supabase.from('branchs').update({ active: false }).match({ id });
        if (!error) {
            toast({ title: 'Sucursal desactivada', description: 'Ya no aparecerá en el listado principal. Puedes reactivarla cuando quieras.', status: 'info' });
            fetchBranch();
        } else {
            toast({ title: 'Error', description: 'No se pudo desactivar la sucursal.', status: 'error' });
        }
    };

    const handleReactivate = async (id) => {
        const { error } = await supabase.from('branchs').update({ active: true }).match({ id });
        if (!error) {
            toast({ title: 'Sucursal reactivada', status: 'success' });
            fetchBranch();
        } else {
            toast({ title: 'Error', description: 'No se pudo reactivar la sucursal.', status: 'error' });
        }
    };

    const handleDelete = async (id) => {
        const { error } = await supabase.from('branchs').delete().match({ id });
        if (!error) {
            toast({ title: 'Éxito', description: 'Sucursal eliminada correctamente.', status: 'success' });
            fetchBranch();
        } else {
            // Si la sucursal tiene ventas, gastos u otros registros asociados, la
            // base de datos rechaza el borrado — mostramos un mensaje claro en
            // vez del error técnico de Postgres.
            const isReferenced = error.code === '23503' || error.code === '23502' || /constraint/i.test(error.message || '');
            toast({
                title: 'No se puede eliminar',
                description: isReferenced
                    ? 'Esta sucursal tiene ventas, gastos u otros registros asociados. Déjala desactivada en vez de eliminarla.'
                    : 'No se pudo eliminar la sucursal.',
                status: 'warning',
                duration: 6000,
            });
        }
    };

    const searchedBranches = branch.filter((b) =>
        [b.name].some((field) =>
            (field || '').toLowerCase().includes(search.toLowerCase())
        )
    );
    const activeBranches = searchedBranches.filter((b) => b.active !== false);
    const inactiveBranches = searchedBranches.filter((b) => b.active === false);

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
            onClick={() => handleNavigate('/branch')} 
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
                    Registrar Sucursal
                </Text>
            </HStack>
        </Button>
    );

    const bgColor = useColorModeValue('gray.50', 'gray.900');
    const textColor = useColorModeValue('gray.800', 'white');
    const borderColor = useColorModeValue('gray.200', 'gray.700');
    const tableBg = useColorModeValue('white', 'gray.800');
    const tableHoverBg = useColorModeValue('teal.50', 'teal.900');
    const selectBg = useColorModeValue('white', 'gray.700');

    return (
        <Box p={{ base: 2, md: 8 }} minH="100vh" bg={useColorModeValue('gray.50', 'gray.900')}>
      <SmartHeader moduleSpecificButton={moduleSpecificButton} />
        <Box
            p={{ base: 2, md: 6 }}
            mx="auto"
            bg={bgColor}
            color={textColor}
        >
            <Flex
                direction={{ base: 'column', md: 'row' }}
                align="center"
                justify="space-between"
                mb={6}
                w="100%"
            >
                <Heading
                    textAlign="left"
                    size="lg"
                    fontWeight="800"
                    color={useColorModeValue('teal.700', 'teal.300')}
                    pb={2}
                    letterSpacing="tight"
                >
                    Lista de Sucursales
                </Heading>
                <Spacer />
                {inactiveBranches.length > 0 && (
                    <Button
                        size="sm"
                        variant="outline"
                        colorScheme="orange"
                        borderRadius="full"
                        mr={3}
                        onClick={() => setShowInactive((prev) => !prev)}
                    >
                        {showInactive ? 'Ocultar' : 'Ver'} inactivas ({inactiveBranches.length})
                    </Button>
                )}
                <Input
                    placeholder="Buscar sucursal..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    w={{ base: '100%', md: '350px' }}
                    bg={selectBg}
                    borderColor={borderColor}
                    color={textColor}
                    borderRadius="full"
                    boxShadow="sm"
                    _hover={{
                        borderColor: useColorModeValue('teal.400', 'teal.300'),
                        boxShadow: "md"
                    }}
                    _focus={{
                        borderColor: useColorModeValue('blue.500', 'blue.300'),
                        boxShadow: useColorModeValue('0 0 0 2px teal.200', '0 0 0 2px teal.700')
                    }}
                    transition="all 0.2s"
                />
            </Flex>
            <Box width="100%" overflowX="auto" borderRadius="xl" boxShadow="lg">
                <Table bg={tableBg} borderRadius="md" overflow="hidden" variant="striped" colorScheme="White">
                    <Thead>
                        <Tr bg={useColorModeValue('teal.100', 'teal.800')}>
                            {['Nombre', 'Dirección', 'Correo', 'Teléfono', 'RUC', 'Acciones'].map((header) => (
                                <Th
                                    key={header}
                                    color={textColor}
                                    borderColor={borderColor}
                                    fontWeight="bold"
                                    fontSize="md"
                                    py={3}
                                    textAlign="center"
                                    letterSpacing="wide"
                                >
                                    {header}
                                </Th>
                            ))}
                        </Tr>
                    </Thead>
                    <Tbody>
                        {activeBranches.length === 0 ? (
                            <Tr>
                                <Td colSpan={6} textAlign="center" py={8}>
                                    <Badge colorScheme="red" fontSize="lg" px={4} py={2} borderRadius="md">
                                        No se encontraron sucursales.
                                    </Badge>
                                </Td>
                            </Tr>
                        ) : (
                            activeBranches.map((branch) => (
                                <Tr
                                    key={branch.id}
                                    cursor="pointer"
                                    _hover={{ bg: tableHoverBg, transition: "background 0.2s" }}
                                    borderColor={borderColor}
                                    transition="all 0.2s"
                                >
                                    {['name', 'address', 'email', 'cell', 'ruc'].map((field) => (
                                        <Td
                                            key={field}
                                            color={textColor}
                                            borderColor={borderColor}
                                            textAlign="center"
                                            fontSize="md"
                                            py={3}
                                        >
                                            {editingId === branch.id ? (
                                                <Input
                                                    name={field}
                                                    value={editableData[field]}
                                                    onChange={handleChange}
                                                    size="sm"
                                                    borderRadius="md"
                                                    bg={useColorModeValue('gray.100', 'gray.700')}
                                                    borderColor={useColorModeValue('teal.300', 'teal.700')}
                                                    _focus={{
                                                        borderColor: useColorModeValue('teal.500', 'teal.300'),
                                                        boxShadow: useColorModeValue('0 0 0 1px teal.500', '0 0 0 1px teal.300')
                                                    }}
                                                />
                                            ) : (
                                                branch[field] || <Badge colorScheme="yellow">N/A</Badge>
                                            )}
                                        </Td>
                                    ))}
                                    <Td textAlign="center" color={textColor} borderColor={borderColor} py={3}>
                                        {editingId === branch.id ? (
                                            <HStack spacing={2} justify="center">
                                                <IconButton
                                                    icon={<BiCheck />}
                                                    colorScheme="green"
                                                    onClick={() => handleSave(branch.id)}
                                                    size="sm"
                                                    aria-label="Guardar"
                                                />
                                                <IconButton
                                                    icon={<BiX />}
                                                    colorScheme="gray"
                                                    onClick={() => setEditingId(null)}
                                                    size="sm"
                                                    aria-label="Cancelar"
                                                />
                                            </HStack>
                                        ) : (
                                            <HStack spacing={2} justify="center">
                                                <IconButton
                                                    icon={<BiEdit />}
                                                    colorScheme="yellow"
                                                    onClick={() => handleEdit(branch.id, branch)}
                                                    size="sm"
                                                    aria-label="Editar"
                                                />
                                                <IconButton
                                                    icon={<BiPowerOff />}
                                                    colorScheme="orange"
                                                    onClick={() => openConfirm(branch.id, 'deactivate')}
                                                    size="sm"
                                                    aria-label="Desactivar"
                                                    title="Desactivar"
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

            {/* Sucursales inactivas — se reactivan o se eliminan definitivamente aquí */}
            {showInactive && inactiveBranches.length > 0 && (
                <Box width="100%" overflowX="auto" borderRadius="xl" boxShadow="lg" mt={6} opacity={0.85}>
                    <Text fontWeight="bold" color="orange.400" mb={2} px={2}>Sucursales inactivas</Text>
                    <Table bg={tableBg} borderRadius="md" overflow="hidden" variant="striped" colorScheme="White">
                        <Thead>
                            <Tr bg={useColorModeValue('orange.100', 'orange.900')}>
                                {['Nombre', 'Dirección', 'Correo', 'Teléfono', 'RUC', 'Acciones'].map((header) => (
                                    <Th key={header} color={textColor} borderColor={borderColor} fontWeight="bold" fontSize="md" py={3} textAlign="center" letterSpacing="wide">
                                        {header}
                                    </Th>
                                ))}
                            </Tr>
                        </Thead>
                        <Tbody>
                            {inactiveBranches.map((branch) => (
                                <Tr key={branch.id} borderColor={borderColor}>
                                    {['name', 'address', 'email', 'cell', 'ruc'].map((field) => (
                                        <Td key={field} color={textColor} borderColor={borderColor} textAlign="center" fontSize="md" py={3}>
                                            {branch[field] || <Badge colorScheme="yellow">N/A</Badge>}
                                        </Td>
                                    ))}
                                    <Td textAlign="center" color={textColor} borderColor={borderColor} py={3}>
                                        <HStack spacing={2} justify="center">
                                            <IconButton
                                                icon={<BiRefresh />}
                                                colorScheme="teal"
                                                onClick={() => handleReactivate(branch.id)}
                                                size="sm"
                                                aria-label="Reactivar"
                                                title="Reactivar"
                                            />
                                            <IconButton
                                                icon={<BiTrash />}
                                                colorScheme="red"
                                                onClick={() => openConfirm(branch.id, 'delete')}
                                                size="sm"
                                                aria-label="Eliminar definitivamente"
                                                title="Eliminar definitivamente"
                                            />
                                        </HStack>
                                    </Td>
                                </Tr>
                            ))}
                        </Tbody>
                    </Table>
                </Box>
            )}
            <ConfirmDialog
                isOpen={isOpen}
                onClose={handleCancel}
                onConfirm={handleConfirm}
                title={confirmMode === 'delete' ? '¿Eliminar definitivamente?' : '¿Desactivar sucursal?'}
                body={
                    confirmMode === 'delete'
                        ? 'Esta acción no se puede deshacer. Si la sucursal tiene ventas, gastos u otros registros asociados, el sistema no permitirá eliminarla.'
                        : 'La sucursal dejará de aparecer en el listado principal, pero conserva todo su historial. Puedes reactivarla cuando quieras.'
                }
            />
        </Box>
        </Box>
    );
};

export default ListBranch;
