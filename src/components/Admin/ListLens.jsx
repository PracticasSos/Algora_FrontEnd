import React, { useEffect, useState } from 'react';
import { supabase } from '../../api/supabase';
import {
  Box, Button, Text, HStack, Heading, Table, Thead, Tbody, Tr, Th, Td, useColorModeValue,
  Input, useToast, IconButton, Flex, Spacer, Divider, Tooltip
} from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import { BiEdit, BiTrash, BiCheck, BiX } from 'react-icons/bi';
import ConfirmDialog from '../../components/UI/ConfirmDialog';
import { FaEye } from 'react-icons/fa';
import SmartHeader from '../header/SmartHeader';

const ListLens = () => {
  const [lens, setLens] = useState([]);
  const [search, setSearch] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editableData, setEditableData] = useState({});
  const [isOpen, setIsOpen] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const toast = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchLens();
  }, []);

  const fetchLens = async () => {
    const { data, error } = await supabase.from('lens').select('*');
    if (error) {
      toast({ title: 'Error', description: 'Error al obtener las lentes', status: 'error' });
    } else {
      setLens(data);
    }
  };

  const handleEdit = (id, item) => {
    setEditingId(id);
    setEditableData(item);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setEditableData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async (id) => {
    const { error } = await supabase.from('lens').update(editableData).match({ id });
    if (!error) {
      toast({ title: 'Éxito', description: 'Lente actualizada correctamente.', status: 'success' });
      setEditingId(null);
      fetchLens();
    } else {
      toast({ title: 'Error', description: 'No se pudo actualizar la lente.', status: 'error' });
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
    const { error } = await supabase.from('lens').delete().match({ id });
    if (!error) {
      toast({ title: 'Éxito', description: 'Lente eliminada correctamente.', status: 'success' });
      fetchLens();
    } else {
      toast({ title: 'Error', description: 'No se pudo eliminar la lente.', status: 'error' });
    }
  };

  const filteredLens = lens.filter(item =>
    [item.lens_type].some(field => field.toLowerCase().includes(search.toLowerCase()))
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
            onClick={() => handleNavigate('/register-lens')}
            bg={useColorModeValue('whiteAlpha.800', 'whiteAlpha.100')}
            backdropFilter="blur(10px)"
            border="1px solid"
            borderColor={useColorModeValue('teal.200', 'teal.500')}
            color={useColorModeValue('teal.600', 'teal.300')}
            size="sm"
            borderRadius="15px"
            px={4}
            _hover={{
                bg: useColorModeValue('teal.50', 'teal.900'),
                borderColor: 'teal.400',
                transform: 'scale(1.05)',
            }}
            transition="all 0.2s"
    >
      <HStack spacing={2} align="center" justify="center">
        <FaEye size="16px" />
        <Text fontWeight="600" lineHeight="1" m={0}>
          Registrar Luna
        </Text>
      </HStack>
    </Button>
  );

  const bgColor = useColorModeValue('gray.50', 'gray.900');
  const textColor = useColorModeValue('gray.800', 'white');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const tableBg = useColorModeValue('white', 'gray.800');
  const tableHoverBg = useColorModeValue('teal.50', 'teal.900');
  const selectBg = useColorModeValue('white', 'gray.800');

  return (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      minH="100vh"
      p={[2, 4, 8]}
      bg={useColorModeValue("gray.50", "gray.900")}
    >
    <Box
      p={{ base: 2, md: 8 }}
      w={'90%'}
    >
      <SmartHeader moduleSpecificButton={moduleSpecificButton} />
      <Flex direction={{ base: 'column', md: 'row' }} align="center" mb={6}>
        <Heading
          mb={{ base: 2, md: 0 }}
          textAlign="left"
          size="lg"
          fontWeight="extrabold"
          color={useColorModeValue('teal.700', 'teal.200')}
          letterSpacing="tight"
        >
          Listar Lunas
        </Heading>
        <Spacer />
        <Input
          placeholder="Buscar Lente..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          w={{ base: '100%', md: '350px' }}
          bg={selectBg}
          borderColor={borderColor}
          color={textColor}
          borderRadius="full"
          px={6}
          py={2}
          fontSize="md"
          boxShadow="sm"
          _hover={{
            borderColor: useColorModeValue('teal.300', 'teal.600'),
            boxShadow: 'md',
          }}
        />
      </Flex>
      <Divider mb={6} />
      <Box width="100%" overflowX="auto">
        <Table
          bg={tableBg}
          borderRadius="lg"
          overflow="hidden"
          boxShadow="md"
          variant="striped"
        >
          <Thead>
            <Tr bg={useColorModeValue('teal.100', 'teal.900')}>
              {['Tipo de Lente', 'Precio', 'Acciones'].map(header => (
                <Th
                  key={header}
                  fontWeight="extrabold"
                  textAlign="center"
                  color={useColorModeValue('teal.700', 'teal.200')}
                  borderColor={borderColor}
                  fontSize="md"
                  py={4}
                  letterSpacing="wide"
                >
                  {header}
                </Th>
              ))}
            </Tr>
          </Thead>
          <Tbody>
            {filteredLens.length === 0 ? (
              <Tr>
                <Td colSpan={3} textAlign="center" py={8} color="gray.400">
                  No se encontraron lentes.
                </Td>
              </Tr>
            ) : (
              filteredLens.map(item => (
                <Tr
                  key={item.id}
                  cursor="pointer"
                  _hover={{ bg: tableHoverBg, transition: 'background 0.2s' }}
                  borderColor={borderColor}
                  transition="background 0.2s"
                >
                  {['lens_type', 'lens_price'].map(field => (
                    <Td
                      key={field}
                      color={textColor}
                      borderColor={borderColor}
                      textAlign="center"
                      fontSize="md"
                      py={3}
                    >
                      {editingId === item.id ? (
                        <Input
                          name={field}
                          value={editableData[field] || ''}
                          onChange={handleChange}
                          size="sm"
                          borderRadius="md"
                          bg={useColorModeValue('gray.100', 'gray.700')}
                          borderColor={useColorModeValue('teal.200', 'teal.700')}

                        />
                      ) : (
                        <Text fontWeight="medium">{item[field] || 'N/A'}</Text>
                      )}
                    </Td>
                  ))}
                  <Td
                    textAlign="center"
                    color={textColor}
                    borderColor={borderColor}
                    py={3}
                  >
                    {editingId === item.id ? (
                      <HStack spacing={2} justify="center">
                        <Tooltip label="Guardar" hasArrow>
                          <IconButton
                            icon={<BiCheck />}
                            colorScheme="green"
                            onClick={() => handleSave(item.id)}
                            size="sm"
                            aria-label="Guardar"
                          />
                        </Tooltip>
                        <Tooltip label="Cancelar" hasArrow>
                          <IconButton
                            icon={<BiX />}
                            colorScheme="gray"
                            onClick={() => setEditingId(null)}
                            size="sm"
                            aria-label="Cancelar"
                          />
                        </Tooltip>
                      </HStack>
                    ) : (
                      <HStack spacing={2} justify="center">
                        <Tooltip label="Editar" hasArrow>
                          <IconButton
                            icon={<BiEdit />}
                            colorScheme="yellow"
                            onClick={() => handleEdit(item.id, item)}
                            size="sm"
                            aria-label="Editar"
                          />
                        </Tooltip>
                        <Tooltip label="Eliminar" hasArrow>
                          <IconButton
                            icon={<BiTrash />}
                            colorScheme="red"
                            onClick={() => openConfirm(item.id)}
                            size="sm"
                            aria-label="Eliminar"
                          />
                        </Tooltip>
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
        title="¿Eliminar lente?"
        body="Estas seguro de que deseas eliminar esta lente?"
      />
    </Box>
    </Box>
  );
};

export default ListLens;
