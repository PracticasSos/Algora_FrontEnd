import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../api/supabase";
import {
    Box, Button, Heading, Table, Tbody, Td, Th, Thead, Tr, Spinner, Text, Textarea, VStack, Modal, ModalOverlay,
    ModalContent, ModalHeader, ModalBody, ModalFooter, ModalCloseButton, useColorModeValue, Flex, Icon, HStack, Divider
} from "@chakra-ui/react";
import { FaWhatsapp, FaUserCircle, FaSearch, FaStore } from "react-icons/fa";
import SearchBar from "./SearchBar";
import SmartHeader from "../header/SmartHeader";

const BalancesPatient = () => {
    const [sales, setSales] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedPatient, setSelectedPatient] = useState(null);
    const [message, setMessage] = useState("");
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [filteredSales, setFilteredSales] = useState([]);
    const [patients, setPatients] = useState([]);
    const [selectedBranch, setSelectedBranch] = useState("");
    const [branches, setBranches] = useState([]);
    const [searchTermPatients, setSearchTermPatients] = useState("");
    const [suggestions, setSuggestions] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        fetchBranches();
        fetchPatients();
    }, []);

    useEffect(() => {
        if (selectedBranch) {
            fetchSales({ branchId: selectedBranch });
        }
    }, [selectedBranch]);

    const handleSearch = (e) => {
        const value = e.target.value.toLowerCase();
        setSearchTermPatients(value);
        const filteredSuggestions = sales
            .filter((sale) => {
                const fullName = `${sale.patient.pt_firstname} ${sale.patient.pt_lastname}`.toLowerCase();
                return fullName.includes(value);
            })
            .map((sale) => `${sale.patient.pt_firstname} ${sale.patient.pt_lastname}`);
        setSuggestions(filteredSuggestions);
        updateFilteredSales(value);
    };

    const updateFilteredSales = (searchTerm) => {
        if (!searchTerm) {
            setFilteredSales(sales);
            return;
        }
        const filtered = sales.filter((sale) => {
            const fullName = `${sale.patient.pt_firstname} ${sale.patient.pt_lastname}`.toLowerCase();
            return fullName.includes(searchTerm.toLowerCase());
        });
        setFilteredSales(filtered);
    };

    const fetchSales = async ({ branchId = null, patientId = null }) => {
        setLoading(true);
        try {
            let query = supabase
                .from('sales')
                .select(`
                    id,
                    date,
                    inventario:inventario_id(brand),
                    lens:lens_id(lens_type),
                    total,
                    balance,
                    credit,
                    patients:patient_id(pt_firstname, pt_lastname, pt_phone),
                    branchs:branchs_id(id, name),
                    is_refund
                `)
                .gt('credit', 0)
                .order('date', { ascending: false })
                .eq("is_refund", false);

            if (branchId) {
                query = query.eq('branchs_id', branchId);
            }
            if (patientId) {
                query = query.eq('patient_id', patientId);
            }
            const { data, error } = await query;

            if (error) throw error;

            const formattedSales = data.map(sale => ({
                id: sale.id,
                date: sale.date,
                brand: sale.inventario?.brand || "Sin Marca",
                lens_type: sale.lens?.lens_type || "N/A",
                total: sale.total,
                balance: sale.balance,
                credit: sale.credit,
                patient: sale.patients || {},
                branch_id: sale.branchs?.id || null,
                branch: sale.branchs?.name || "N/A",
            }));

            setSales(formattedSales);
            setFilteredSales(formattedSales);
        } catch (error) {
            console.error("Error fetching sales:", error);
        } finally {
            setLoading(false);
        }
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

    const fetchPatients = async () => {
        try {
            const { data, error } = await supabase
                .from('patients')
                .select('id, pt_firstname, pt_lastname, pt_phone');
            if (error) throw error;
            setPatients(data);
        } catch (error) {
            console.error("Error fetching patients:", error);
        }
    };

    const handleSuggestionSelect = (selectedName) => {
        setSearchTermPatients(selectedName);
        setSuggestions([]);

        const selectedSale = sales.find(
            (sale) =>
                `${sale.patient.pt_firstname} ${sale.patient.pt_lastname}`.toLowerCase() ===
                selectedName.toLowerCase()
        );

        if (selectedSale) {
            setSelectedPatient(selectedSale.patient);
            const patientSales = sales.filter(sale =>
                sale.patient.pt_firstname === selectedSale.patient.pt_firstname &&
                sale.patient.pt_lastname === selectedSale.patient.pt_lastname
            );
            setFilteredSales(patientSales);
        }
    };

    // Obtiene el mensaje personalizado desde la base de datos según la ruta y branch_id
    const fetchCustomMessage = async (branchId) => {
        try {
            const { data, error } = await supabase
                .from("messages")
                .select("content")
                .eq("branch_id", branchId)
                .eq("route", "/balances-patient")
                .single();
            if (error || !data) return "";
            return data.content;
        } catch (err) {
            return "";
        }
    };

    // Modifica handleMessageClick para usar el mensaje de la base de datos
    const handleMessageClick = async (e, sale) => {
        e.stopPropagation();
        setSelectedPatient(sale.patient);
        setIsFormOpen(true);
        const customMessage = await fetchCustomMessage(sale.branch_id);
        setMessage(customMessage || "");
    };


    const handleSendMessage = () => {
        if (!selectedPatient || !message.trim()) return;
        const whatsappUrl = `https://wa.me/${selectedPatient.pt_phone}?text=${encodeURIComponent(message)}`;
        window.open(whatsappUrl, "_blank");
    };

    const sortedSales = [...filteredSales].sort((a, b) => {
        if (!a.date) return 1;
        if (!b.date) return -1;
        return new Date(b.date) - new Date(a.date);
    });

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
    const tableBg = useColorModeValue('white', 'gray.700');
    const tableHoverBg = useColorModeValue('teal.50', 'gray.600');
    const tableAltBg = useColorModeValue('gray.50', 'gray.800');
    const headerBg = useColorModeValue('teal.100', 'teal.900');

    return (
        <Box display="flex" flexDirection="column" alignItems="center" minHeight="100vh" p={{ base: 2, md: 6 }} bg={useColorModeValue('gray.50', 'gray.900')}>
            <SmartHeader moduleSpecificButton={moduleSpecificButton} />
            <Box w="100%" maxW="1500px" mb={4}>
                <Flex align="center" mb={2} pt={4} >
                    <Icon as={FaUserCircle} w={7} h={7} color={useColorModeValue('teal.600', 'teal.300')} mr={2} />
                    <Heading
                        alignItems="center"
                        textAlign="center"
                        size="lg"
                        fontWeight="700"
                        color={useColorModeValue('teal.700', 'teal.200')}
                        pb={2}
                        letterSpacing="tight"
                    >
                        Saldos Pendientes
                    </Heading>
                </Flex>
                <Divider mb={2} />
            </Box>
            <Box w={{ base: "100%", md: "60%" }} mx="auto" mb={6}>
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
                <Text textAlign="center" color="gray.500" mt={6}>
                    Por favor, selecciona una sucursal o busca un nombre para mostrar los datos.
                </Text>
            ) : loading ? (
                <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
                    <Spinner size="xl" color="teal.400" />
                </Box>
            ) : filteredSales.length === 0 ? (
                <Text textAlign="center" color="gray.500">No se encontraron registros de ventas con saldos pendientes.</Text>
            ) : (
                <Box width="100%" maxWidth="1500px" px={{ base: 1, md: 6 }} py={4} boxShadow="xl" borderRadius="lg" bg={tableBg} overflowX="auto">
                    <Table variant="simple" size="md">
                        <Thead position="sticky" top={0} zIndex={1} bg={headerBg}>
                            <Tr>
                                <Th color={textColor} borderColor={borderColor}>Fecha</Th>
                                <Th color={textColor} borderColor={borderColor}>Nombre</Th>
                                <Th color={textColor} borderColor={borderColor}>Apellido</Th>
                                <Th color={textColor} borderColor={borderColor}>Sucursal</Th>
                                <Th color={textColor} borderColor={borderColor}>Armazón</Th>
                                <Th color={textColor} borderColor={borderColor}>Luna</Th>
                                <Th color={textColor} borderColor={borderColor}>Total</Th>
                                <Th color={textColor} borderColor={borderColor}>Abono</Th>
                                <Th color={textColor} borderColor={borderColor}>Saldo</Th>
                                <Th color={textColor} borderColor={borderColor}>TELF</Th>
                                <Th color={textColor} borderColor={borderColor}>Acción</Th>
                            </Tr>
                        </Thead>
                        <Tbody>
                            {sortedSales.map((sale, idx) => (
                                <Tr
                                    key={sale.id}
                                    cursor="pointer"
                                    _hover={{ bg: tableHoverBg }}
                                    borderColor={borderColor}
                                    bg={idx % 2 === 0 ? "transparent" : tableAltBg}
                                    transition="background 0.2s"
                                >
                                    <Td color={textColor} borderColor={borderColor}>{new Date(sale.date).toLocaleDateString()}</Td>
                                    <Td color={textColor} borderColor={borderColor}>{sale.patient.pt_firstname}</Td>
                                    <Td color={textColor} borderColor={borderColor}>{sale.patient.pt_lastname}</Td>
                                    <Td color={textColor} borderColor={borderColor}>{sale.branch}</Td>
                                    <Td color={textColor} borderColor={borderColor}>{sale.brand || "Sin Marca"}</Td>
                                    <Td color={textColor} borderColor={borderColor}>{sale.lens_type}</Td>
                                    <Td color={textColor} borderColor={borderColor}>${sale.total}</Td>
                                    <Td color={textColor} borderColor={borderColor}>${sale.balance}</Td>
                                    <Td color={textColor} borderColor={borderColor}>${sale.credit}</Td>
                                    <Td color={textColor} borderColor={borderColor}>{sale.patient.pt_phone}</Td>
                                    <Td color={textColor} borderColor={borderColor}>
                                        <Button
                                            size="sm"
                                            bg="blue.500"
                                            color="white"
                                            _hover={{ bg: "blue.600" }}
                                            leftIcon={<FaWhatsapp />}
                                            onClick={(e) => handleMessageClick(e, sale)}
                                            variant="solid"
                                            fontWeight="bold"
                                            shadow="md"
                                        >
                                            WhatsApp
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
                    <ModalHeader bg={headerBg} borderTopRadius="md">
                        <HStack>
                            <Icon as={FaWhatsapp} color="whatsapp.500" boxSize={6} />
                            <Text fontWeight="bold">Enviar mensaje por WhatsApp</Text>
                        </HStack>
                    </ModalHeader>
                    <ModalCloseButton />
                    <ModalBody>
                        <VStack align="stretch" spacing={4}>
                            <Box bg={useColorModeValue('gray.100', 'gray.700')} p={3} borderRadius="md">
                                <Text fontSize="md" mb={1}>
                                    <Icon as={FaUserCircle} mr={2} color="teal.400" />
                                    <strong>{selectedPatient?.pt_firstname} {selectedPatient?.pt_lastname}</strong>
                                </Text>
                                <Text fontSize="sm" color="gray.500">
                                    <Icon as={FaWhatsapp} mr={1} color="whatsapp.500" />
                                    {selectedPatient?.pt_phone}
                                </Text>
                            </Box>
                            <Textarea
                                placeholder="Escribe tu mensaje aquí..."
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                size="md"
                                minH="120px"
                                borderColor="teal.300"
                                focusBorderColor="teal.500"
                                bg={useColorModeValue('white', 'gray.800')}
                            />
                        </VStack>
                    </ModalBody>
                    <ModalFooter>
                        <Button variant="ghost" mr={3} onClick={() => setIsFormOpen(false)}>
                            Cancelar
                        </Button>
                        <Button
                            colorScheme="whatsapp"
                            leftIcon={<FaWhatsapp />}
                            onClick={() => {
                                handleSendMessage();
                                setIsFormOpen(false);
                            }}
                            isDisabled={!message.trim()}
                            fontWeight="bold"
                        >
                            Enviar
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>
        </Box>
    );
};

export default BalancesPatient;