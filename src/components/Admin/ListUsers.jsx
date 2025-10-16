import { useEffect, useState } from 'react';
import { supabase } from '../../api/supabase';
import {
  Box, Button, Heading, Table, Thead, Tbody, Tr, Th, Td,
  Input, Text, HStack, IconButton, useToast, useColorModeValue
} from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import { BiEdit, BiTrash, BiCheck, BiX } from 'react-icons/bi';
import ConfirmDialog from '../../components/UI/ConfirmDialog';
import { FaEye } from 'react-icons/fa';
import SmartHeader from '../header/SmartHeader';

const ListUsers = () => {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editableData, setEditableData] = useState({});
  const [isOpen, setIsOpen] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [currentUserRole, setCurrentUserRole] = useState(null);
  const toast = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCurrentUserRole = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile, error } = await supabase
          .from('users')
          .select('role_id')
          .eq('auth_id', user.id)
          .single();
        
        if (error) {
          console.error('Error fetching user profile:', error);
          toast({ title: 'Error', description: 'No se pudo verificar el rol del usuario.', status: 'error' });
        } else if (profile) {
          setCurrentUserRole(profile.role_id);
        }
      }
    };
    
    fetchCurrentUserRole();
    fetchUsers();
  }, [toast]);

  const fetchUsers = async () => {
    const { data, error } = await supabase
      .from('users')
      .select('id, firstname, lastname, username, age, role_id, role:role!users_role_fkey(role_name), email, phone_number, ci, branchs:branch_id(name)');

    if (error) {
      console.error('Error fetching users:', error);
      toast({ title: 'Error', description: 'Error al obtener los usuarios', status: 'error' });
    } else {
      setUsers(data);
    }
  };

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
  };

  const filteredUsers = users.filter(user =>
    user.firstname?.toLowerCase().includes(search.toLowerCase()) ||
    user.lastname?.toLowerCase().includes(search.toLowerCase()) ||
    user.username?.toLowerCase().includes(search.toLowerCase())
  );

  const handleEdit = (id, user) => {
    setEditingId(id);
    setEditableData({ ...user });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setEditableData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async (id) => {
    const { role, branchs, ...updateData } = editableData;

    const { error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', id);

    if (!error) {
      toast({ title: 'Éxito', description: 'Usuario actualizado correctamente.', status: 'success' });
      setEditingId(null);
      fetchUsers();
    } else {
      console.error('Update error:', error);
      toast({ title: 'Error', description: `No se pudo actualizar el usuario. ${error.message}`, status: 'error' });
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
    const { error } = await supabase.from('users').delete().eq('id', id);
    if (!error) {
      toast({ title: 'Éxito', description: 'Usuario eliminado correctamente.', status: 'success' });
      fetchUsers();
    } else {
      console.error('Delete error:', error);
      toast({ title: 'Error', description: `No se pudo eliminar el usuario. ${error.message}`, status: 'error' });
    }
  };

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
    onClick={() => handleNavigate('/register')} 
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
        Registrar Usuarios
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
  
  const isAdmin = currentUserRole === 1;

  return (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      minH="100vh"
      p={[2, 4, 8]}
      bg={useColorModeValue("gray.50", "gray.900")}
    >
      <SmartHeader moduleSpecificButton={isAdmin ? moduleSpecificButton : null} />
      <Box mb={6}>
        <Heading
          mb={2}
          mt={4}
          textAlign="center"
          size="lg"
          fontWeight="800"
          color={useColorModeValue('teal.600', 'teal.300')}
          pb={2}
          letterSpacing="tight"
        >
          Lista De Usuarios
        </Heading>
        <Text color={useColorModeValue('gray.500', 'gray.400')} mb={2} fontSize="md">
          Administra y busca usuarios fácilmente.
        </Text>
      </Box>
      <Box
        display="flex"
        alignItems="center"
        mb={6}
        gap={4}
        minW={'400px'}
      >
        <Input
          placeholder="Buscar por nombre, apellido o username"
          value={search}
          onChange={handleSearchChange}
          bg={selectBg}
          borderColor={borderColor}
          color={textColor}
          _hover={{
            borderColor: useColorModeValue('gray.300', 'gray.500')
          }}
          _focus={{
            borderColor: useColorModeValue('teal.500', 'teal.300'),
            boxShadow: useColorModeValue('0 0 0 1px teal.500', '0 0 0 1px teal.300')
          }}
          borderRadius="full"
          px={6}
          py={3}
          fontSize="md"
          transition="all 0.2s"
        />
      </Box>
      <Box
        width="100%"
        maxWidth="1500px"
        overflowX="auto"
        borderRadius="lg"
        boxShadow={useColorModeValue('md', 'dark-md')}
        bg={tableBg}
        p={2}
      >
        <Table variant="simple" size="md">
          <Thead>
            <Tr bg={useColorModeValue('teal.500', 'teal.700')}>
              {['Nombre', 'Apellido', 'Username', 'Edad', 'Rol', 'Email', 'Teléfono', 'CI', 'Sucursal', 'Acciones'].map(header => (
                <Th
                  key={header}
                  fontWeight="bold"
                  color="white"
                  textAlign="center"
                  py={3}
                  fontSize="md"
                  letterSpacing="wide"
                  borderColor={borderColor}
                >
                  {header}
                </Th>
              ))}
            </Tr>
          </Thead>
          <Tbody>
            {filteredUsers.length === 0 ? (
              <Tr>
                <Td colSpan={10} textAlign="center" py={8} color="gray.400" fontSize="lg">
                  No se encontraron usuarios.
                </Td>
              </Tr>
            ) : (
              filteredUsers.map(user => (
                <Tr
                  key={user.id}
                  _hover={{
                    bg: tableHoverBg,
                    transition: "background 0.2s"
                  }}
                  borderColor={borderColor}
                >
                  {['firstname', 'lastname', 'username', 'age', 'role', 'email', 'phone_number', 'ci', 'branchs'].map(field => (
                    <Td
                      key={field}
                      color={textColor}
                      borderColor={borderColor}
                      textAlign="center"
                      px={3}
                      py={2}
                      fontSize="sm"
                    >
                      {editingId === user.id && !['role', 'branchs', 'email'].includes(field) ? (
                        <Input
                          name={field}
                          value={editableData[field] ?? ''}
                          onChange={handleChange}
                          size="sm"
                          borderRadius="md"
                          bg={selectBg}
                        />
                      ) : (
                        field === 'role' ? user.role?.role_name || 'N/A' :
                        field === 'branchs' ? user.branchs?.name || 'N/A' :
                        user[field] || 'N/A'
                      )}
                    </Td>
                  ))}
                  <Td textAlign="center" color={textColor} borderColor={borderColor}>
                    {isAdmin && (
                      <HStack spacing={2} justify="center">
                        {editingId === user.id ? (
                          <>
                            <IconButton
                              icon={<BiCheck />}
                              colorScheme="green"
                              aria-label="Guardar"
                              onClick={() => handleSave(user.id)}
                              size="sm"
                              borderRadius="full"
                            />
                            <IconButton
                              icon={<BiX />}
                              colorScheme="red"
                              aria-label="Cancelar"
                              onClick={() => setEditingId(null)}
                              size="sm"
                              borderRadius="full"
                            />
                          </>
                        ) : (
                          <>
                            <IconButton
                              icon={<BiEdit />}
                              colorScheme="blue"
                              aria-label="Editar"
                              onClick={() => handleEdit(user.id, user)}
                              size="sm"
                              borderRadius="full"
                            />
                            <IconButton
                              icon={<BiTrash />}
                              colorScheme="red"
                              aria-label="Eliminar"
                              onClick={() => openConfirm(user.id)}
                              size="sm"
                              borderRadius="full"
                            />
                          </>
                        )}
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
        title="¿Eliminar usuario?"
        body="¿Estás seguro de que deseas eliminar este usuario?"
      />
    </Box>
  );
};

export default ListUsers;