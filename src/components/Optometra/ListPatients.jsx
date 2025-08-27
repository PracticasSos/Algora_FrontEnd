import { useState, useEffect } from 'react';
import { supabase } from '../../api/supabase';
import { 
  Box, Button, Heading, Table, Thead, Tbody, Tr, Th, Td, Input, useToast, Flex, IconButton, Select, useColorModeValue, Text, HStack,
} from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import { BiEdit, BiTrash, BiCheck, BiX, BiSearch, BiShow } from 'react-icons/bi';
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
          Registrar Pacientes
        </Text>
      </HStack>
    </Button>
    );

  const textColor = useColorModeValue('gray.800', 'white');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const tableBg = useColorModeValue('white', 'gray.700');
  const tableHoverBg = useColorModeValue('gray.100', 'gray.600');
  const selectBg = useColorModeValue('white', 'gray.700');

  return (
    <Box p={5}>
      <SmartHeader moduleSpecificButton={moduleSpecificButton} />

      <Input
        placeholder="Buscar paciente..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        mb={4}
        w="50%"
        mx="auto"
        display="block"
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

      <Box overflowX="auto" p={4} borderRadius="lg" shadow="md">
        <Heading 
          mb={4} 
          textAlign="left" 
          size="md"
          fontWeight="700"
          color={useColorModeValue('teal.600', 'teal.300')}
          pb={2}
      >
        Lista de Pacientes
      </Heading>
        <Table bg={tableBg}  borderRadius="md" overflow="hidden">
          <Thead >
            <Tr  bg={useColorModeValue('gray.50', 'gray.600')}>
              {[
                'Fecha', 'Nombre', 'Apellido', 'Sexo', 'Ocupación', 'Dirección', 'Teléfono',
                'Edad', 'C.L.', 'Ciudad', 'Correo', 'Razón de Consulta',
                'Recomendaciones', 'Sucursal', 'Acciones' 
              ].map((header) => (
                <Th key={header} fontWeight="bold" textAlign="center" color={textColor} borderColor={borderColor}>{header}</Th>
              ))}
            </Tr>
          </Thead>
          <Tbody>
            {filteredPatients.map((patient) => (
              <Tr key={patient.id} cursor="pointer"  _hover={{ bg: tableHoverBg }} borderColor={borderColor} >
                {[
                  'date','pt_firstname', 'pt_lastname', 'sexo', 'pt_occupation', 'pt_address', 'pt_phone',
                  'pt_age', 'pt_ci', 'pt_city', 'pt_email', 'pt_consultation_reason',
                  'pt_recommendations',  
                ].map((field) => (
                  <Td key={field} textAlign="center" color={textColor} borderColor={borderColor} >
                    {editingId === patient.id ? (
                      <Input name={field} value={editableData[field] || ''} onChange={handleChange} />
                    ) : (
                      patient[field] || 'N/A'
                    )}
                  </Td>
                ))}
                <Td key="branch_id" textAlign="center" color={textColor} borderColor={borderColor} >
                  {editingId === patient.id ? (
                    <Select
                      name="branch_id"
                      value={editableData.branch_id || ""}
                      onChange={handleChange}
                    >
                      <option value="">Seleccione una sucursal</option>
                      {branches.map((branch) => (
                        <option key={branch.id} value={branch.id}>
                          {branch.name}
                        </option>
                      ))}
                    </Select>
                  ) : (
                    branches.find((branch) => branch.id === patient.branch_id)?.name || 'N/A'
                  )}
                </Td>
                <Td textAlign="center" color={textColor} borderColor={borderColor} >
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
                      />
                      <IconButton
                        icon={<BiX />}
                        colorScheme="gray"
                        variant="outline"
                        size="sm"
                        aria-label="Cancelar"
                        onClick={() => setEditingId(null)}
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
                      />
                      <IconButton
                        icon={<BiTrash />}
                        colorScheme="pink"
                        variant="outline"
                        size="sm"
                        aria-label="Eliminar"
                        onClick={() => openConfirm(patient.id)}
                      />
                      <IconButton
                        icon={<BiShow />}
                        colorScheme="teal"
                        variant="solid"
                        size="sm"
                        aria-label="Ver XR"
                        onClick={() => handleNavigate(`/measures-final/${patient.id}`)}
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
