import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../api/supabase";
import { Box, Button, Heading, Spinner, Table, Thead, Tbody, Tr, Th, Td, Divider, useColorModeValue } from "@chakra-ui/react";
import SearchBar from "./SearchBar";
import SmartHeader from "../header/SmartHeader";

const HistoryMeasureList = () => {
    const [patients, setPatients] = useState([]);
    const [filteredPatients, setFilteredPatients] = useState([]);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);
    const [suggestion, setSuggestion] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        fetchPatients();
    }, []);

    const fetchPatients = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from("rx_final")
                .select(`
                    patient_id,
                    patients:patients (id, pt_firstname, pt_lastname, pt_ci, pt_occupation, date)
                `);
            if (error) throw error;
            const uniquePatients = [];
            const patientIds = new Set();

            data.forEach(rx => {
                if (!patientIds.has(rx.patient_id)) {
                    patientIds.add(rx.patient_id);
                    uniquePatients.push({
                        patient_id: rx.patient_id,
                        pt_firstname: rx.patients?.pt_firstname || "",
                        pt_lastname: rx.patients?.pt_lastname || "",
                        pt_ci: rx.patients?.pt_ci || "",
                        pt_occupation: rx.patients?.pt_occupation || "",
                        created_at: rx.created_at,
                        date: rx.date
                    });
                }
            });
                // Ordenar: primero los que tienen fecha, descendente; luego los que no tienen fecha
                // Ordenar por fecha de patients.date descendente, los sin fecha al final
                const sortedPatients = uniquePatients.sort((a, b) => {
                    const dateA = a.date;
                    const dateB = b.date;
                    if (dateA && dateB) {
                        return new Date(dateB) - new Date(dateA);
                    } else if (dateA) {
                        return -1;
                    } else if (dateB) {
                        return 1;
                    } else {
                        return 0;
                    }
                });
                setPatients(sortedPatients);
                setFilteredPatients(sortedPatients);
            console.error("Error fetching patients:", error);
        } finally {
            setLoading(false);
        }
    };

    const handlePatientSelect = (patient) => {
        if (patient && patient.patient_id) {
            navigate(`/history-measure-list/history-measures/${patient.patient_id}`,{ state: { patientData: patient }});
        } else {
            console.error("ID de paciente no válido o no definido");
        }
    };

    const handleSearch = (e) => {
        const query = e.target.value.toLowerCase();
        setSearch(query);
    
        const filteredSuggestions = patients
            .filter(
                (patient) =>
                    patient.pt_firstname.toLowerCase().includes(query) ||
                    patient.pt_lastname.toLowerCase().includes(query) ||
                    patient.pt_ci.toLowerCase().includes(query)
            )
            .map((patient) => `${patient.pt_firstname} ${patient.pt_lastname}`);
        setSuggestion(filteredSuggestions);
    
        const filtered = patients.filter(
            (patient) =>
                patient.pt_firstname.toLowerCase().includes(query) ||
                patient.pt_lastname.toLowerCase().includes(query) ||
                patient.pt_ci.toLowerCase().includes(query)
        );
        setFilteredPatients(filtered);
    };
    
    const handleSuggestionSelect = (selectedName) => {
        setSearch(selectedName); 
        setSuggestion([]);
    
        const filtered = patients.filter(
            (patient) =>
                `${patient.pt_firstname} ${patient.pt_lastname}`.toLowerCase() ===
                selectedName.toLowerCase()
        );
        if (filtered.length > 0) {
            setFilteredPatients(filtered);
        }
    };

    const handleNavigate = (route = null) => {
        const user = JSON.parse(localStorage.getItem("user"));
        if (route) {
            navigate(route);
            return;
        }
        if (!user || !user.role_id) {
            navigate("/login-form");
            return;
        }
        switch (user.role_id) {
            case 1:
                navigate("/Admin");
                break;
            case 2:
                navigate("/Optometra");
                break;
            case 3:
                navigate("/Vendedor");
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


    return (
        <Box p={6} maxW="1300px" mx="auto" boxShadow="md" borderRadius="lg" bg={bgColor} color={textColor}>
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
                Historial de Medidas
            </Heading>
            </Box>
            {loading ? (
                <Spinner size="xl" mt={4} />
            ) : (
                <Box>
                    <Divider my={4} />
                    <Box w="50%" mx="auto">
                        <SearchBar 
                            searchPlaceholder="Buscar Paciente..."
                            searchValue={search}
                            onSearchChange={handleSearch}
                            suggestions={suggestion}
                            onSuggestionSelect={handleSuggestionSelect}
                            showBranchFilter={false} 
                        />
                    </Box>
                    <Box overflowX="auto"p={4} borderRadius="lg" shadow="md">
                        <Table bg={tableBg} borderRadius="md" overflow="hidden">
                            <Thead>
                                <Tr bg={useColorModeValue('gray.50', 'gray.600')}>
                                    <Th color={textColor} borderColor={borderColor}>Nombre</Th>
                                    <Th color={textColor} borderColor={borderColor}>Apellido</Th>
                                    <Th color={textColor} borderColor={borderColor}>Cédula</Th>
                                    <Th color={textColor} borderColor={borderColor}>Ocupación</Th>
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
                                        <Td color={textColor} borderColor={borderColor}>{patient.pt_occupation}</Td>
                                    </Tr>
                                ))}
                            </Tbody>
                        </Table>
                    </Box>
                </Box>
            )}
        </Box>
    );
};

export default HistoryMeasureList;
