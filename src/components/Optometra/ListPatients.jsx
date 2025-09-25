import { useState, useEffect } from 'react';
import { supabase } from '../../api/supabase';
import {
  Box, Button, Heading, Table, Thead, Tbody, Tr, Th, Td, Input, useToast, Flex, IconButton, Select, useColorModeValue, Text, HStack,
} from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import { BiEdit, BiTrash, BiCheck, BiX, BiShow } from 'react-icons/bi';
import ConfirmDialog from '../../components/UI/ConfirmDialog';
import { FaEye } from 'react-icons/fa';
import SmartHeader from '../header/SmartHeader';

const ListPatients = () => {
  const [patients, setPatients] = useState([]);
  const [search, setSearch] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editableData, setEditableData] = useState({});
  const [branches, setBranchs] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const toast = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchPatients();
    fetchBranchs();
  }, []);

  const fetchPatients = async () => {
    const { data, error } = await supabase.from('patients').select('*');
    if (error) {
      toast({ title: 'Error', description: 'Error al obtener los pacientes', status: 'error' });
    } else {
      setPatients(data);
    }
  };

  const fetchBranchs = async () => {
    const { data, error } = await supabase.from('branchs').select('id, name');
    if (error) {
      toast({ title: 'Error', description: 'Error al obtener las sucursales', status: 'error' });
    } else {
      setBranchs(data);
    }
  };

  const handleEdit = (id, patient) => {
    setEditingId(id);
    setEditableData(patient);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setEditableData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async (id) => {
    const { error } = await supabase.from('patients').update(editableData).match({ id });
    if (!error) {
      toast({ title: 'Éxito', description: 'Paciente actualizado correctamente.', status: 'success' });
      setEditingId(null);
      fetchPatients();
    } else {
      toast({ title: 'Error', description: 'No se pudo actualizar el paciente.', status: 'error' });
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
    const { error } = await supabase.from('patients').delete().match({ id });
    if (!error) {
      toast({ title: 'Éxito', description: 'Paciente eliminado correctamente.', status: 'success' });
      fetchPatients();
    } else {
      toast({ title: 'Error', description: 'No se pudo eliminar el paciente.', status: 'error' });
    }
  };

  const sortedPatients = [...patients].sort((a, b) => {
    if (!a.date && !b.date) return 0;
    if (!a.date) return 1;
    if (!b.date) return -1;
    return new Date(b.date) - new Date(a.date);
  });

  const filteredPatients = sortedPatients.filter((patient) =>
    [patient.pt_firstname, patient.pt_lastname, patient.pt_phone].some((field) =>
      field?.toLowerCase().includes(search.toLowerCase())
    )
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
      default:
        navigate('/');
    }
  };

  const moduleSpecificButton = (
    <Button
      onClick={() => handleNavigate('/register-patient')}
      bg={useColorModeValue('teal.50', 'teal.900')}
      border="1px solid"
      borderColor={useColorModeValue('teal.200', 'teal.700')}
      color={useColorModeValue('teal.700', 'teal.200')}
      size="md"
      borderRadius="full"
      px={6}
      fontWeight="bold"
      leftIcon={<FaEye size="16px" />}
      _hover={{
        bg: useColorModeValue('teal.100', 'teal.800'),
        borderColor: 'teal.400',
        transform: 'scale(1.03)',
      }}
      transition="all 0.2s"
      shadow="md"
    >
      Registrar Pacientes
    </Button>
  );

  const textColor = useColorModeValue('gray.800', 'white');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const tableBg = useColorModeValue('white', 'gray.800');
  const tableHoverBg = useColorModeValue('teal.50', 'teal.900');
  const selectBg = useColorModeValue('white', 'gray.700');
  const alternateRowBg = useColorModeValue('gray.50', 'gray.700');

  return (
    <Box p={{ base: 2, md: 8 }} minH="100vh" bg={useColorModeValue('gray.50', 'gray.900')}>
      <SmartHeader moduleSpecificButton={moduleSpecificButton} />

      <Box maxW="1500px" mx="auto" mt={8} mb={4}>
        <Heading
          mb={6}
          textAlign="center"
          size="lg"
          fontWeight="extrabold"
          color={useColorModeValue('teal.700', 'teal.200')}
          letterSpacing="tight"
        >
          Lista de Pacientes
        </Heading>

        <Flex mb={6} justify="center">
          <Input
            placeholder="Buscar paciente..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            maxW="400px"
            bg={selectBg}
            borderColor={borderColor}
            color={textColor}
            borderRadius="full"
            px={6}
            py={3}
            fontSize="md"
            shadow="sm"
            _hover={{
              borderColor: useColorModeValue('teal.300', 'teal.500'),
              shadow: 'md',
            }}
            _focus={{
              borderColor: useColorModeValue('teal.500', 'teal.300'),
              boxShadow: useColorModeValue('0 0 0 2px teal.200', '0 0 0 2px teal.700'),
            }}
          />
        </Flex>

        <Box overflowX="auto" borderRadius="xl" shadow="lg" bg={tableBg} p={2}>
          <Table variant="simple" size="sm">
            <Thead>
              <Tr bg={useColorModeValue('teal.100', 'teal.800')}>
                {[
                  'Fecha', 'Nombre', 'Apellido', 'Sexo', 'Ocupación', 'Dirección', 'Teléfono',
                  'Edad', 'C.L.', 'Ciudad', 'Correo', 'Razón de Consulta',
                  'Recomendaciones', 'Sucursal', 'Acciones'
                ].map((header) => (
                  <Th
                    key={header}
                    fontWeight="bold"
                    textAlign="center"
                    color={textColor}
                    borderColor={borderColor}
                    py={3}
                    fontSize="sm"
                  >
                    {header}
                  </Th>
                ))}
              </Tr>
            </Thead>
            <Tbody>
              {filteredPatients.map((patient, idx) => (
                <Tr
                  key={patient.id}
                  cursor="pointer"
                  _hover={{ bg: tableHoverBg }}
                  bg={idx % 2 === 0 ? alternateRowBg : tableBg}
                  borderColor={borderColor}
                  transition="background 0.2s"
                >
                  {[
                    'date', 'pt_firstname', 'pt_lastname', 'sexo', 'pt_occupation', 'pt_address', 'pt_phone',
                    'pt_age', 'pt_ci', 'pt_city', 'pt_email', 'pt_consultation_reason',
                    'pt_recommendations',
                  ].map((field) => (
                    <Td
                      key={field}
                      textAlign="center"
                      color={textColor}
                      borderColor={borderColor}
                      px={2}
                      py={2}
                      fontSize="sm"
                    >
                      {editingId === patient.id ? (
                        <Input
                          name={field}
                          value={editableData[field] || ''}
                          onChange={handleChange}
                          size="sm"
                          borderRadius="md"
                          bg={useColorModeValue('white', 'gray.800')}
                        />
                      ) : (
                        patient[field] || <Text color="gray.400" fontStyle="italic">N/A</Text>
                      )}
                    </Td>
                  ))}
                  <Td textAlign="center" color={textColor} borderColor={borderColor} px={2} py={2} fontSize="sm">
                    {editingId === patient.id ? (
                      <Select
                        name="branch_id"
                        value={editableData.branch_id || ""}
                        onChange={handleChange}
                        size="sm"
                        borderRadius="md"
                        bg={selectBg}
                      >
                        <option value="">Seleccione una sucursal</option>
                        {branches.map((branch) => (
                          <option key={branch.id} value={branch.id}>
                            {branch.name}
                          </option>
                        ))}
                      </Select>
                    ) : (
                      branches.find((branch) => branch.id === patient.branch_id)?.name || <Text color="gray.400" fontStyle="italic">N/A</Text>
                    )}
                  </Td>
                  <Td textAlign="center" color={textColor} borderColor={borderColor} px={2} py={2} fontSize="sm">
                    <Flex justify="center" align="center" gap={2}>
                      {editingId === patient.id ? (
                        <>
                          <IconButton
                            icon={<BiCheck />}
                            colorScheme="teal"
                            variant="solid"
                            size="sm"
                            aria-label="Guardar"
                            onClick={() => handleSave(patient.id)}
                            borderRadius="full"
                          />
                          <IconButton
                            icon={<BiX />}
                            colorScheme="gray"
                            variant="outline"
                            size="sm"
                            aria-label="Cancelar"
                            onClick={() => setEditingId(null)}
                            borderRadius="full"
                          />
                        </>
                      ) : (
                        <>
                          <IconButton
                            icon={<BiEdit />}
                            colorScheme="cyan"
                            variant="outline"
                            size="sm"
                            aria-label="Editar"
                            onClick={() => handleEdit(patient.id, patient)}
                            borderRadius="full"
                          />
                          <IconButton
                            icon={<BiTrash />}
                            colorScheme="pink"
                            variant="outline"
                            size="sm"
                            aria-label="Eliminar"
                            onClick={() => openConfirm(patient.id)}
                            borderRadius="full"
                          />
                          <IconButton
                            icon={<BiShow />}
                            colorScheme="teal"
                            variant="solid"
                            size="sm"
                            aria-label="Ver XR"
                            onClick={() => handleNavigate(`/measures-final/${patient.id}`)}
                            borderRadius="full"
                          />
                        </>
                      )}
                    </Flex>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </Box>
      </Box>

      <ConfirmDialog
        isOpen={isOpen}
        onClose={handleCancel}
        onConfirm={handleConfirm}
        title="¿Eliminar paciente?"
        body="¿Está seguro de que desea eliminar este paciente?"
      />
    </Box>
  );
};

export default ListPatients;
