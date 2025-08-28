import { useState, useEffect } from 'react';
import { supabase } from '../../../api/supabase';
import { Box, Button, Heading, Table, Thead, Tbody, Tr, Th, Td, Input, FormControl, FormLabel, Select, Spinner, Grid, useColorModeValue } from "@chakra-ui/react";
import { useNavigate } from 'react-router-dom';
import SmartHeader from '../../header/SmartHeader';

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
          )
        `)
        .gte('date', `${todayString}T00:00:00`)
        .lte('date', `${todayString}T23:59:59`)
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

  const bgColor = useColorModeValue('white', 'gray.800');
  const textColor = useColorModeValue('gray.800', 'white');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const tableBg = useColorModeValue('white', 'gray.700');
  const tableHoverBg = useColorModeValue('gray.100', 'gray.600');
  const inputBg = useColorModeValue('white', 'gray.700');
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
      <Heading 
        mb={4} 
        textAlign="left" 
        size="md"
        fontWeight="700"
        color={useColorModeValue('teal.600', 'teal.300')}
        pb={2}
      >
        Lista Pendiente de Órdenes de Laboratorio
      </Heading>
      <FormControl mb={4}>
        <FormLabel color={textColor}>Sucursal</FormLabel>
        <Select 
          placeholder="Selecciona una sucursal"
          value={selectedBranch}
          onChange={(e) => setSelectedBranch(e.target.value)}
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
      <Grid templateColumns="repeat(3, 1fr)" gap={4} mb={6}>
        <FormControl>
          <FormLabel color={textColor}>Desde</FormLabel>
          <Input 
            type="date" 
            name="since" 
            value={formData.since} 
            onChange={handleChange}
            bg={inputBg}
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
        </FormControl>
        
        <FormControl>
          <FormLabel color={textColor}>Hasta</FormLabel>
          <Input 
            type="date" 
            name="till" 
            value={formData.till} 
            onChange={handleChange}
            bg={inputBg}
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
        </FormControl>
        
        <Button 
          type="submit" 
          colorScheme="blue" 
          mt={6} 
          onClick={fetchFilteredPatients}
          isDisabled={!selectedBranch}
        >
          Filtrar
        </Button>
      </Grid>

      {loading ? (
        <Spinner size="xl" color={useColorModeValue('blue.500', 'blue.300')} />
      ) : (
        <Box className="w-full max-w-4xl">
          <Table bg={tableBg} borderRadius="md" overflow="hidden">
            <Thead>
              <Tr bg={useColorModeValue('gray.50', 'gray.600')}>
                <Th color={textColor} borderColor={borderColor}>Nombre</Th>
                <Th color={textColor} borderColor={borderColor}>Apellido</Th>
                <Th color={textColor} borderColor={borderColor}>Cédula</Th>
                <Th color={textColor} borderColor={borderColor}>Fecha</Th>
              </Tr>
            </Thead>
            <Tbody>
              {filteredPatients.map((patient) => (
                <Tr 
                  key={patient.patient_id}  
                  onClick={() => handlePatientSelect(patient)} 
                  cursor="pointer"
                  _hover={{ bg: tableHoverBg }}
                  borderColor={borderColor}
                >
                  <Td color={textColor} borderColor={borderColor}>{patient.pt_firstname}</Td>
                  <Td color={textColor} borderColor={borderColor}>{patient.pt_lastname}</Td>
                  <Td color={textColor} borderColor={borderColor}>{patient.pt_ci}</Td>
                  <Td color={textColor} borderColor={borderColor}>
                    {new Date(patient.date + 'T00:00:00').toLocaleDateString('es-ES', {
                      year: 'numeric',
                      month: '2-digit',
                      day: '2-digit'
                    })}
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </Box>
      )}
    </Box>
  );
};

export default OrderLaboratoryList;
