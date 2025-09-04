import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from '../../api/supabase';
import { Box, Button, Heading, Table, Thead, Tbody, Tr, Th, Td, Input, Select, useColorModeValue, useToast, 
  AlertDialog,
  AlertDialogOverlay,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogBody,
  AlertDialogFooter,} from '@chakra-ui/react';
import SmartHeader from "../header/SmartHeader";

const HistoryClinic = () => {
  const [patients, setPatients] = useState([]);
  const [filteredPatients, setFilteredPatients] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState("");
  const [search, setSearch] = useState('');
  const [branches, setBranches] = useState([]);
  const navigate = useNavigate();


    useEffect(() => {
      fetchBranches();
    }, []);

    useEffect(() => {
      if (selectedBranch) {
        fetchPatients(selectedBranch);
      }
    }, [selectedBranch]);

    const fetchPatients = async (branchId) => {
      if (!branchId) return;

      const { data, error } = await supabase
        .from('sales')
        .select('branchs_id, patients(id, pt_firstname, pt_lastname, pt_ci, pt_phone), pdf_url, date')
        .eq('branchs_id', branchId)
        .order('date', { ascending: false });
      if (error) {
        console.error('Error fetching patients:', error);
        return;
      }

      // Mapea pacientes y evita duplicados
      const map = new Map();

      for (const sale of data) {
        const patient = sale.patients;
        if (patient && patient.id) {
          const key = `${patient.id}-${sale.branchs_id}`;
          if (!map.has(key)) {
            map.set(key, {
              ...patient,
              branchs_id: sale.branchs_id,
              pdf_url: sale.pdf_url || null,
              date: sale.date,
            });
          }
        }
      }

      const uniquePatients = Array.from(map.values());
      uniquePatients.sort((a, b) => new Date(b.date) - new Date(a.date));
      setPatients(uniquePatients);
      setFilteredPatients(uniquePatients);
    };


    const fetchBranches = async () => {
      const { data, error } = await supabase
          .from('branchs') 
          .select('id, name');
  
      if (error) {
          console.error('Error fetching branches:', error);
      } else {
          setBranches(data);
      }
    };

    const handleSearchChange = (e) => {
        const value = e.target.value;
        setSearch(value);
        setFilteredPatients(
            patients.filter(patient =>
                `${patient.pt_firstname} ${patient.pt_lastname} ${patient.pt_ci}`
                    .toLowerCase()
                    .includes(value.toLowerCase())
            )
        );
    };

    const handlePatientSelect = (patient) => {
        navigate(`/history-clinic/patient-history/${patient.id}`, { state: { patientData: patient } });
    };

    const handleNavigate = (route = null) => {
      const user = JSON.parse(localStorage.getItem('user'));
      if (route) {
          navigate(route);
          return;
      }
      if (!user || !user.role_id) {
          navigate('/login-form');
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

      const textColor = useColorModeValue('gray.800', 'white');
      const borderColor = useColorModeValue('gray.200', 'gray.600');
      const selectBg = useColorModeValue('white', 'gray.700');

    return (
        <Box display="flex" flexDirection="column" alignItems="center" minHeight="100vh">
    
          <SmartHeader moduleSpecificButton={moduleSpecificButton} />
<Box w="100%" maxW= "800px" mb={4}>
            <Heading 
                mb={4} 
                textAlign="left" 
                size="md"
                fontWeight="700"
                color={useColorModeValue('teal.600', 'teal.300')}
                pb={2}
            >
                Historial del Paciente
            </Heading>
            </Box>
        <Box as="form" width="100%" maxWidth="850px" padding={6} boxShadow="lg" borderRadius="md" >
          <Input 
            placeholder="Buscar por nombre, apellido o cédula" 
            value={search} 
            onChange={handleSearchChange} 
            mb={4} 
            maxWidth="800px"
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
          <Select 
            placeholder="Seleccione una sucursal" 
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
            {branches.map((branch) => (
              <option key={branch.id} value={branch.id}>{branch.name}</option>
            ))}
          </Select>

          <Box overflowX="auto" width="100%" maxWidth="900px">
              <Table variant="simple" minWidth="800px">
                <Thead>
                  <Tr>
                    <Th>Nombre</Th>
                    <Th>Apellido</Th>
                    <Th>Cédula</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {filteredPatients.map(patient => (
                    <Tr key={`${patient.id}-${patient.branchs_id}`} onClick={() => handlePatientSelect(patient)} style={{ cursor: 'pointer' }}>
                      <Td>{patient.pt_firstname}</Td>
                      <Td>{patient.pt_lastname}</Td>
                      <Td>{patient.pt_ci}</Td>
                      <Td>
                        {patient.pdf_url && (
                          <Button
                            size="sm"
                            colorScheme="green"
                            onClick={(e) => {
                              e.stopPropagation();
                              const mensaje = `Hola ${patient.pt_firstname}, aquí está su historial clínico: ${patient.pdf_url}`;
                              const whatsappUrl = `https://wa.me/${patient.pt_phone}?text=${encodeURIComponent(mensaje)}`;
                              window.open(whatsappUrl, "_blank");
                            }}
                          >
                            Enviar PDF
                          </Button>
                        )}
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
          </Box>
        </Box>
        </Box>
    );
}

export default HistoryClinic;
