import { useState, useEffect } from 'react';
import { supabase } from '../../api/supabase';
import { Box, Button, Heading, Table, Thead, Tbody, Tr, Th, Td, VStack, Textarea, Text, Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  useColorModeValue 
} from "@chakra-ui/react";
import { useNavigate } from 'react-router-dom';
import SearchBar from './SearchBar';
import SmartHeader from '../header/SmartHeader';
import { mod } from '@tensorflow/tfjs';

const RetreatsPatients = () => {
  const [allPatients, setAllPatients] = useState([]); 
  const [pendingSales, setPendingSales] = useState([]);
  const [filteredPatients, setFilteredPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [searchTermPatients, setSearchTermPatients] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [showSearchSuggestions, setShowSearchSuggestions] = useState(true);
  const [branches, setBranches] = useState([]);
  const [filteredSales, setFilteredSales] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    fetchPatients({});
    fetchBranchs();
  }, []);

  useEffect(() => {

      const updatedSales = location.state?.updatedPendingSales;
    
      if (updatedSales) {
          setPendingSales(updatedSales);
      }
      if (location.state) {
          navigate(location.pathname, { replace: true, state: null });
      }
  }, [location.state, navigate]);

  useEffect(() => {
    if (selectedBranch) {
      fetchPatients({ branchId: selectedBranch });
    }
  }, [selectedBranch]);


  const fetchBranchs = async () => {
    const { data, error } = await supabase.from("branchs").select("id, name");
    if (!error) {
      setBranches(data);
    }
  };

  const fetchPatients = async ({branchId = null, saleId = null}) => {
    setLoading(true);
    try {
      let query = supabase
        .from('sales')
        .select(`
          id,
          patient_id,
          date,
          patients (
            id,
            pt_firstname,
            pt_lastname,
            pt_ci,
            pt_phone
          ),
          inventario:inventario_id(brand),
          lens:lens_id(lens_type),
          total,
          balance,
          credit,
          branchs:branchs_id(id, name)
        `)
        .eq('is_completed', false);

        if (branchId) {
          query = query.eq('branchs_id', branchId);
        }
        if (saleId) {
          query = query.eq('patient_id', saleId);
        }
        const { data, error } = await query;

      if (error) throw error;

      const formattedData = data.map(sale => ({
        sale_id: sale.id, 
        patient_id: sale.patient_id,
        pt_firstname: sale.patients?.pt_firstname || "N/A",
        pt_lastname: sale.patients?.pt_lastname || "N/A",
        pt_ci: sale.patients?.pt_ci || "N/A",
        pt_phone: sale.patients?.pt_phone || "N/A",
        date: sale.date,
        brand: sale.inventario?.brand || "Sin marca",
        lens_type: sale.lens?.lens_type || "N/A",
        total: sale.total,
        balance: sale.balance,
        credit: sale.credit,
        branch_id: sale.branchs?.id || null, 
        branch: sale.branchs?.name || "N/A",
      }));

      setPendingSales(formattedData);
      setAllPatients(formattedData);
      setFilteredPatients(formattedData);
    } catch (error) {
      console.error('Error fetching patients:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePatientSelect = (sale) => {
    if (sale && sale.sale_id) {  
      navigate(`/retreats-patients/retreats/${sale.sale_id}`, { 
        state: { patientData: sale, selectedDate: sale.date } 
      });
    }
  };
  
  const filterPatients = ({ searchTerm = '', selectedPatientObj = null, suggestionName = '' } = {}) => {
    let filtered = allPatients;
    let suggestionsList = [];

    if (searchTerm) {
      filtered = filtered.filter((patient) => {
        const fullName = `${patient.pt_firstname} ${patient.pt_lastname}`.toLowerCase();
        return fullName.includes(searchTerm.toLowerCase());
      });
      suggestionsList = filtered.map((patient) => `${patient.pt_firstname} ${patient.pt_lastname}`);
      setSuggestions(suggestionsList);
      setSearchTermPatients(searchTerm);
      setFilteredPatients(filtered);
      return;
    }

    if (selectedPatientObj) {
      setSelectedPatient(selectedPatientObj);
      setSearchTermPatients(`${selectedPatientObj.pt_firstname} ${selectedPatientObj.pt_lastname}`);
      setShowSearchSuggestions(false);
      filtered = allPatients.filter(patient =>
        patient.pt_firstname === selectedPatientObj.pt_firstname &&
        patient.pt_lastname === selectedPatientObj.pt_lastname
      );
      setFilteredPatients(filtered);
      return;
    }

    if (suggestionName) {
      setSearchTermPatients(suggestionName);
      setSuggestions([]);
      const foundPatient = allPatients.find(
        (patient) => `${patient.pt_firstname} ${patient.pt_lastname}`.toLowerCase() === suggestionName.toLowerCase()
      );
      if (foundPatient) {
        setSelectedPatient(foundPatient);
        filtered = allPatients.filter(
          (patient) =>
            patient.pt_firstname === foundPatient.pt_firstname &&
            patient.pt_lastname === foundPatient.pt_lastname
        );
        setFilteredPatients(filtered);
      }
      return;
    }

    setFilteredPatients(filtered);
  };

  const mensajeDefault = `Le saludamos desde Veoptics, sus lentes se encuentran listos para que pueda acercarse a retirarlos.
  Nuestro horario de atención es:
  Lunes a viernes desde 09:00 am hasta las 19:00 pm
  Sábados desde las 10:00 am hasta las 16:00 pm`;

  const handleMessageClick = (e, patient) => {
    e.stopPropagation();
    setSelectedPatient(patient);
    setIsFormOpen(true);
    setMessage(mensajeDefault);
  };

  const handleSendMessage = () => {
    if (!selectedPatient || !message.trim()) return;
    const whatsappUrl = `https://wa.me/${selectedPatient.pt_phone}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, "_blank");
  };

  const handleSearch = (e) => {
    filterPatients({ searchTerm: e.target.value.toLowerCase() });
  };

  const handlePatientClick = (selectedPatient) => {
    filterPatients({ selectedPatientObj: selectedPatient });
  };

  const handleSuggestionSelect = (selectedName) => {
    filterPatients({ suggestionName: selectedName });
  };

  const sortedPatients = [...filteredPatients].sort((a, b) => {
    // Si alguna fecha es inválida, ponla al final
    if (!a.date) return 1;
    if (!b.date) return -1;
    return new Date(b.date) - new Date(a.date);
  }); 
    
  const moduleSpecificButton = null;

    const textColor = useColorModeValue('gray.800', 'white');
    const borderColor = useColorModeValue('gray.200', 'gray.600');
    const tableBg = useColorModeValue('white', 'gray.700');
    const tableHoverBg = useColorModeValue('gray.100', 'gray.600');
   
  return (
    <Box display="flex" flexDirection="column" alignItems="center" minHeight="100vh" p={6}>
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
                Retiros
            </Heading>
            </Box>
      <Box w="50%" mx="auto" display="block">
        <SearchBar
          searchPlaceholder="Buscar por nombre..."
          searchValue={searchTermPatients}
          onSearchChange={handleSearch}
          suggestions={suggestions}
          onSuggestionSelect={handleSuggestionSelect}
          branches={branches}
          selectedBranch={selectedBranch}
          onBranchChange={(e) => setSelectedBranch(e.target.value)}
          showBranchFilter={true}
          
        />
      </Box>
      
      {(!selectedBranch && !searchTermPatients) ? (
        <Text textAlign="center" color={useColorModeValue('gray.500', 'gray.400')} mt={6}>
          Por favor, selecciona una sucursal o busca un nombre para mostrar los datos.
        </Text>
      ) : filteredPatients.length === 0 ? (
        <Text textAlign="center" color={useColorModeValue('gray.500', 'gray.400')}>
          No se encontraron registros de pacientes.
        </Text>
      ) : (
        <Box width="100%" maxWidth="1500px"  overflowX="auto">
          <Table bg={tableBg}  borderRadius="md" overflow="hidden">
            <Thead>
              <Tr bg={useColorModeValue('gray.50', 'gray.600')}>
                <Th color={textColor} borderColor={borderColor}>Fecha</Th>
                <Th color={textColor} borderColor={borderColor}>Nombre</Th>
                <Th color={textColor} borderColor={borderColor} >Apellido</Th>
                <Th color={textColor} borderColor={borderColor} >Sucursal</Th>
                <Th color={textColor} borderColor={borderColor} >Armazón</Th>
                <Th color={textColor} borderColor={borderColor} >Luna</Th>
                <Th color={textColor} borderColor={borderColor} >Total</Th>
                <Th color={textColor} borderColor={borderColor} >Abono</Th>
                <Th color={textColor} borderColor={borderColor} >Saldo</Th>
                <Th color={textColor} borderColor={borderColor} >TELF</Th>
                <Th color={textColor} borderColor={borderColor} >Acción</Th>
              </Tr>
            </Thead>
            <Tbody>
              {sortedPatients.map((patient) => (
                <Tr
                  key={`${patient.sale_id}`}
                  onClick={() => handlePatientSelect(patient)}
                  cursor="pointer"
                  _hover={{ bg: tableHoverBg }}
                  borderColor={borderColor}
                >
                  <Td color={textColor} borderColor={borderColor} >{patient.date}</Td>
                  <Td color={textColor} borderColor={borderColor} >{patient.pt_firstname}</Td>
                  <Td color={textColor} borderColor={borderColor} >{patient.pt_lastname}</Td>
                  <Td color={textColor} borderColor={borderColor} >{patient.branch}</Td>
                  <Td color={textColor} borderColor={borderColor}>{patient.brand || "Sin Marca"}</Td>
                  <Td color={textColor} borderColor={borderColor} >{patient.lens_type}</Td>
                  <Td color={textColor} borderColor={borderColor} >{patient.total}</Td>
                  <Td color={textColor} borderColor={borderColor} >{patient.balance}</Td>
                  <Td color={textColor} borderColor={borderColor} >{patient.credit}</Td>
                  <Td color={textColor} borderColor={borderColor} >{patient.pt_phone}</Td>
                  <Td color={textColor} borderColor={borderColor}>
                    <Button
                      size="sm"
                      colorScheme="green"
                      onClick={(e) => handleMessageClick(e, patient)}
                    >
                      Enviar Mensaje
                    </Button>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </Box>
      )}
      <Modal isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} isCentered size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Enviar mensaje por WhatsApp</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack align="stretch" spacing={4}>
              <Text fontSize="md">
                Enviar mensaje a <strong>{selectedPatient?.pt_firstname} {selectedPatient?.pt_lastname}</strong> ({selectedPatient?.pt_phone})
              </Text>
              <Textarea
                placeholder="Escribe tu mensaje aquí..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={() => setIsFormOpen(false)}>
              Cancelar
            </Button>
            <Button
              colorScheme="green"
              onClick={() => {
                handleSendMessage();
                setIsFormOpen(false); // Oculta al enviar
              }}
              isDisabled={!message.trim()}
            >
              Enviar
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

    </Box>
  );
};

export default RetreatsPatients;