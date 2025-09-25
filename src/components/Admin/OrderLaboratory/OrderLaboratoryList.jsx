import { useState, useEffect } from 'react';
import { supabase } from '../../../api/supabase';
import { Divider, Text, Box, Button, Heading, Table, Thead, Tbody, Tr, Th, Td, Input, FormControl, FormLabel, Select, Spinner, Grid, useColorModeValue,Flex,Icon} from "@chakra-ui/react";
import { useNavigate } from 'react-router-dom';
import SmartHeader from '../../header/SmartHeader';
import { FaClinicMedical, FaFilter } from "react-icons/fa";

const OrderLaboratoryList = () => {
  const [patients, setPatients] = useState([]);
  const [filteredPatients, setFilteredPatients] = useState([]);
  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState(""); 
  const [formData, setFormData] = useState({
    since: "",
    till: "",
  });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchBranches();
  }, []);

  useEffect(() => {
    if (selectedBranch) {
      fetchTodayPatients();
    }
  }, [selectedBranch]);

  const fetchBranches = async () => {
    try {
      const { data, error } = await supabase.from("branchs").select("id, name");
      if (error) throw error;
      setBranches(data);
    } catch (error) {
      console.error("Error fetching branches:", error);
    }
  };

  const fetchTodayPatients = async () => {
    if (!selectedBranch) return;
    setLoading(true);
    try {
      const today = new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const day = String(today.getDate()).padStart(2, '0');
      const todayString = `${year}-${month}-${day}`;
      const { data, error } = await supabase
        .from('sales')
        .select(`
          branchs_id,
          patient_id,
          date,
          patients (
            id,
            pt_firstname,
            pt_lastname,
            pt_ci
          ),
          is_refund
        `)
        .gte('date', `${todayString}T00:00:00`)
        .lte('date', `${todayString}T23:59:59`)
        .eq('branchs_id', selectedBranch)
        .eq("is_refund", false);

      if (error) throw error;

      const formattedData = data.map(sale => ({
        patient_id: sale.patient_id,
        pt_firstname: sale.patients.pt_firstname,
        pt_lastname: sale.patients.pt_lastname,
        pt_ci: sale.patients.pt_ci,
        date: sale.date
      }));

      setPatients(formattedData);
      setFilteredPatients(formattedData);
    } catch (error) {
      console.error('Error fetching patients:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchFilteredPatients = async () => {
    if (!formData.since || !formData.till || !selectedBranch) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('sales')
        .select(`
          branchs_id,
          patient_id,
          date,
          patients (
            id,
            pt_firstname,
            pt_lastname,
            pt_ci
          )
        `)
        .gte('date', `${formData.since}T00:00:00`)
        .lte('date', `${formData.till}T23:59:59`)
        .eq('branchs_id', selectedBranch);

      if (error) throw error;

      const formattedData = data.map(sale => ({
        patient_id: sale.patient_id,
        pt_firstname: sale.patients.pt_firstname,
        pt_lastname: sale.patients.pt_lastname,
        pt_ci: sale.patients.pt_ci,
        date: sale.date
      }));

      setPatients(formattedData);
      setFilteredPatients(formattedData);
    } catch (error) {
      console.error('Error fetching filtered patients:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePatientSelect = (patient) => {
    const user = JSON.parse(localStorage.getItem('user'));
    
    if (!user) {
        console.error('Usuario no encontrado en localStorage');
        alert("Error: usuario no autenticado.");
        return;
    }

    if (!patient?.patient_id) {
        console.error("ID del paciente no válido");
        return;
    }

    // Asegurar consistencia de estado
    localStorage.setItem('user', JSON.stringify(user));

    navigate(`/order-laboratory-list/laboratory-order/${patient.patient_id}`, {
        state: { patientData: patient, user }
    });
};


  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
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

  const moduleSpecificButton = null;

  const bgColor = useColorModeValue('white', 'gray.900');
  const textColor = useColorModeValue('gray.800', 'white');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const tableBg = useColorModeValue('white', 'gray.800');
  const tableHoverBg = useColorModeValue('teal.50', 'teal.900');
  const inputBg = useColorModeValue('gray.50', 'gray.800');
  const selectBg = useColorModeValue('gray.50', 'gray.800');
  const headerBg = useColorModeValue('teal.600', 'teal.400');
  const headerText = useColorModeValue('white', 'gray.900');

  return (
    <Box p={{ base: 2, md: 8 }} minH="100vh" bg={useColorModeValue('gray.50', 'gray.900')}>
      <SmartHeader moduleSpecificButton={moduleSpecificButton} />
    <Box
      p={{ base: 2, md: 8 }}
      maxW="1300px"
      mx="auto"
      bg={bgColor}
      color={textColor}
      borderRadius="xl"
      boxShadow="lg"
    >
      <Flex align="center" mb={6} gap={3}>
        <Icon as={FaClinicMedical} boxSize={8} color={headerBg} />
        <Heading
          size="md"
          fontWeight="bold"
          color={headerBg}
          letterSpacing="tight"
        >
          Lista Pendiente de Órdenes de Laboratorio
        </Heading>
      </Flex>
      <Divider mb={6} />

      <Flex
        direction={{ base: "column", md: "row" }}
        gap={6}
        mb={8}
        align="center"
        justify="space-between"
        bg={useColorModeValue('gray.50', 'gray.800')}
        p={4}
        borderRadius="lg"
        boxShadow="md"
      >
        <FormControl maxW="300px">
          <FormLabel color={textColor} fontWeight="bold">
            Sucursal
          </FormLabel>
          <Select
            placeholder="Selecciona una sucursal"
            value={selectedBranch}
            onChange={(e) => setSelectedBranch(e.target.value)}
            bg={selectBg}
            borderColor={borderColor}
            color={textColor}
            fontWeight="medium"
            size="md"
            borderRadius="md"
            _hover={{ borderColor: useColorModeValue('teal.400', 'teal.300') }}
            _focus={{
              borderColor: useColorModeValue('teal.600', 'teal.300'),
              boxShadow: useColorModeValue('0 0 0 1px teal.600', '0 0 0 1px teal.300')
            }}
          >
            {branches.map(branch => (
              <option
                key={branch.id}
                value={branch.id}
                style={{
                  backgroundColor: useColorModeValue('white', '#2D3748'),
                  color: useColorModeValue('black', 'white')
                }}
              >
                {branch.name}
              </option>
            ))}
          </Select>
        </FormControl>

        <Flex gap={4} align="flex-end">
          <FormControl>
            <FormLabel color={textColor} fontWeight="bold">
              Desde
            </FormLabel>
            <Input
              type="date"
              name="since"
              value={formData.since}
              onChange={handleChange}
              bg={inputBg}
              borderColor={borderColor}
              color={textColor}
              size="md"
              borderRadius="md"
              _hover={{ borderColor: useColorModeValue('teal.400', 'teal.300') }}
              _focus={{
                borderColor: useColorModeValue('teal.600', 'teal.300'),
                boxShadow: useColorModeValue('0 0 0 1px teal.600', '0 0 0 1px teal.300')
              }}
            />
          </FormControl>
          <FormControl>
            <FormLabel color={textColor} fontWeight="bold">
              Hasta
            </FormLabel>
            <Input
              type="date"
              name="till"
              value={formData.till}
              onChange={handleChange}
              bg={inputBg}
              borderColor={borderColor}
              color={textColor}
              size="md"
              borderRadius="md"
              _hover={{ borderColor: useColorModeValue('teal.400', 'teal.300') }}
              _focus={{
                borderColor: useColorModeValue('teal.600', 'teal.300'),
                boxShadow: useColorModeValue('0 0 0 1px teal.600', '0 0 0 1px teal.300')
              }}
            />
          </FormControl>
          <Button
            leftIcon={<FaFilter />}
            colorScheme="teal"
            size="md"
            borderRadius="md"
            mt={{ base: 0, md: 6 }}
            onClick={fetchFilteredPatients}
            isDisabled={!selectedBranch}
            fontWeight="bold"
            px={6}
          >
            Filtrar
          </Button>
        </Flex>
      </Flex>

      {loading ? (
        <Flex justify="center" align="center" minH="200px">
          <Spinner size="md" color={headerBg} thickness="5px" speed="0.7s" />
        </Flex>
      ) : (
        <Box
          w="full"
          mx="auto"
          bg={tableBg}
          borderRadius="lg"
          boxShadow="md"
          overflow="hidden"
        >
          <Table variant="simple">
            <Thead>
              <Tr bg={headerBg}>
                <Th color={headerText} borderColor={borderColor} fontWeight="bold" fontSize="sm">Nombre</Th>
                <Th color={headerText} borderColor={borderColor} fontWeight="bold" fontSize="sm">Apellido</Th>
                <Th color={headerText} borderColor={borderColor} fontWeight="bold" fontSize="sm">Cédula</Th>
                <Th color={headerText} borderColor={borderColor} fontWeight="bold" fontSize="sm">Fecha</Th>
              </Tr>
            </Thead>
            <Tbody>
              {filteredPatients.length === 0 ? (
                <Tr>
                  <Td colSpan={4} textAlign="center" py={8} color="gray.500">
                    <Text fontSize="lg">No hay pacientes en el rango seleccionado.</Text>
                  </Td>
                </Tr>
              ) : (
                filteredPatients.map((patient) => (
                  <Tr
                    key={patient.patient_id}
                    onClick={() => handlePatientSelect(patient)}
                    cursor="pointer"
                    _hover={{ bg: tableHoverBg, transition: "background 0.2s" }}
                    borderColor={borderColor}
                  >
                    <Td color={textColor} borderColor={borderColor} fontWeight="medium">{patient.pt_firstname}</Td>
                    <Td color={textColor} borderColor={borderColor} fontWeight="medium">{patient.pt_lastname}</Td>
                    <Td color={textColor} borderColor={borderColor}>{patient.pt_ci}</Td>
                    <Td color={textColor} borderColor={borderColor}>
                      {new Date(patient.date + 'T00:00:00').toLocaleDateString('es-ES', {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit'
                      })}
                    </Td>
                  </Tr>
                ))
              )}
            </Tbody>
          </Table>
        </Box>
      )}
    </Box>

    </Box>
  );  
};

export default OrderLaboratoryList;
