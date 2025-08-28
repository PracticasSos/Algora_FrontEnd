import  React, { useEffect, useRef, useState } from "react";
import { supabase } from "../../../api/supabase";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { Box, Heading, FormControl, FormLabel, Input,  Textarea, Select, SimpleGrid, Text, useColorModeValue, Table, Thead, Tr, Th, Tbody, Td } from "@chakra-ui/react";
import PdfLaboratory from "./PdfLaboratory";
import SmartHeader from "../../header/SmartHeader";


const LaboratoryOrder = () => {
    const { patientId } = useParams();
    console.log(patientId);
    const location = useLocation();
    const [salesData, setSalesData] = useState(null);
    const [patientData, setPatientData] = useState(location.state?.patientData || null);
    const [patientsList, setPatientsList] = useState([]);
    const [filteredMeasures, setFilteredMeasures] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedSale, setSelectedSale] = useState({ lens: { lens_type: "" } });
    const [labsList, setLabsList] = useState([]);
    const [selectedLab, setSelectedLab] = useState('');
    const [observations, setObservations] = useState('');
    const [lensTypes, setLensTypes] = useState([]);
    const [isTyping, setIsTyping] = useState(false);
    const salesRef = useRef(null);
    const navigate = useNavigate();
    const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
    const [branchPhone, setBranchPhone] = useState('');

    useEffect(() => {
        if (patientId) {
            fetchPatientData();
        } else {
            console.error("patientId is undefined or invalid.");
            alert("Error: El ID del paciente no está disponible.");
        }
    }, [patientId]);

    useEffect(() => {
        if (patientData?.id) {
            fetchLabs();
            fetchSalesData();
            fetchLens();
        }
    }, [patientData]);

    useEffect(() => {
        const storedUser = JSON.parse(localStorage.getItem('user'));
        if (!storedUser) {
            console.error('No user found, redirecting to login');
            navigate('/Login');
        } else {
            console.log('Usuario encontrado al cargar:', storedUser);
        }
    }, []); // Solo se ejecuta una vez al montar

    useEffect(() => {
        if (salesData?.branchs_id) {
            fetchBranchPhone();
        }
    }, [salesData]);
    
    const fetchBranchPhone = async () => {
        try {
            const { data, error } = await supabase
                .from('branchs')
                .select('cell')
                .eq('id', salesData.branchs_id)
                .single();
            
            if (error) throw error;
            setBranchPhone(data?.cell || '');
        } catch (error) {
            console.error('Error fetching branch phone:', error);
        }
    };

    const fetchPatientData = async () => {
        if (!patientId) {
            console.error("patientId is undefined or invalid.");
            return; 
        }
        try {
            const { data, error } = await supabase
                .from("patients")
                .select("*")
                .eq("id", patientId)
                .single();

            if (error) throw error;
            setPatientData(data);
        } catch (error) {
            console.error("Error fetching patient data:", error);
            alert("Error al cargar los datos del paciente.");
        }
    };

    const fetchLabs = async () => {
        const { data, error } = await supabase
            .from('labs')
            .select('id, name');
        if (error) {
            console.error('Error fetching labs:', error);
        } else {
            setLabsList(data);
        }
    };


    const handleSearchChange = (e) => {
        setSearchTerm(e.target.value);
    };

    const fetchLens = async () => {
        const { data, error } = await supabase.from("lens").select("id, lens_type");
        if (error) {
          console.error("Error fetching lens types:", error);
        } else {
          setLensTypes(data);
        }
    };

      const fetchSalesData = async () => {
        try {
            const { data, error } = await supabase
                .from("sales")
                .select(`
                    id,
                    date,
                    inventario (brand),
                    lens:lens_id(lens_type),
                    branchs:branchs_id(name),
                    measure_id
                `)
                .eq("patient_id", patientData.id)
                .order("date", { ascending: false })
                .limit(1)
                .single();

            if (error) throw error;
            setSalesData(data);
            if (data?.measure_id) {
                fetchMeausresFormSales(data.measure_id);
            }
        } catch (error) {
            console.error("Error fetching sales data:", error);
        }
    };
      
      const updateLensType = async (saleId, lensType) => {
        const { error } = await supabase
          .from("sales") 
          .update({ lens_type: lensType }) 
          .eq("id", saleId); 
      
        if (error) {
          console.error("Error updating lens type in sales:", error);
        } else {
          console.log("Lens type updated successfully!");
        }
      };
      
      const handleLensChange = (e) => {
        const search = e.target.value.toLowerCase();
        setIsTyping(true); 
        setSelectedSale((prevSale) => ({
            ...prevSale || {},
            lens: { ...(prevSale?.lens || {}), lens_type: search },
        }));
        setSalesData((prevData) => ({
            ...prevData,
            lens: { ...(prevData?.lens || {}), lens_type: search },
        }));
        if (selectedSale?.id) {
            updateLensType(selectedSale.id, search);
        }
    };
    
      
    
    const handleLensSelect = (lens) => {
        setSelectedSale((prevSale) => ({
            ...prevSale,
            lens: { lens_type: lens.lens_type },
        }));
    
        setSalesData((prevData) => ({
            ...prevData,
            lens: { lens_type: lens.lens_type },
        }));
        if (selectedSale?.id) {
            updateLensType(selectedSale.id, lens.lens_type);
        }
        setIsTyping(false); 
    };
    
      const handleInputFocus = () => {
        setIsTyping(true);
      };
      
      const handleInputBlur = () => {
        setTimeout(() => {
          setIsTyping(false); 
        }, 200); 
      };
    const fetchMeausresFormSales = async (measureId) => {
        try {
            if (!measureId) {
                console.error("measure_id is undefined or invalid.");
                return;
            }
            const { data, error } = await supabase
                .from("rx_final")
                .select("*")
                .eq("id", measureId)
                .single();
            if (error) throw error;
            setFilteredMeasures([data]);
        } catch (error) {
            console.error("Error fetching measures data:", error);
        }
    };

    const filteredPatients = patientsList.filter(patient => {
        if (searchTerm === '') {
            return true; 
        }
        const fullName = `${patient.pt_firstname} ${patient.pt_lastname}`;
        return fullName.toLowerCase().includes(searchTerm.toLowerCase()); 
    });

    const data = filteredMeasures.length > 0 ? filteredMeasures[0] : {};
    
    const moduleSpecificButton = null;

    return (
        <Box ref={salesRef} w="full" px={4}>
          <Box className="sales-form" display="flex" flexDirection="column" alignItems="center" minHeight="100vh">
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
                    Orden de Laboratorio
                </Heading>
            </Box>
            <Box as="form" width="100%" maxWidth="500px" padding={6} boxShadow="lg" borderRadius="md">
              {patientData && (
                <Box mb={6} p={4} borderWidth="1px" borderRadius="lg" boxShadow="md">
                  <Text fontSize="lg">
                    <strong>Sucursal:</strong> {salesData?.branchs?.name || "No disponible"}
                  </Text>
                  <Text fontSize="lg" mt={2}>
                    <strong>Fecha:</strong> {salesData?.date || "No disponible"}
                  </Text>
                  <Text fontSize="lg" mt={2}>
                    <strong>Orden:</strong> {salesData?.id || "No disponible"}
                  </Text>
                  <Text fontSize="lg" mt={2}>
                    <strong>Paciente:</strong> {patientData?.pt_firstname} {patientData?.pt_lastname}
                  </Text>
                </Box>
              )}
      
                <Box maxW="700px" borderWidth="1px" borderRadius="md" p={4}>
                <Heading size="md" mb={4}>
                    RX Final
                </Heading>

                {/* Parte superior: Esfera, Cilindro, Eje, Prisma */}
                <Table size="sm" variant="simple">
                    <Thead>
                    <Tr>
                        <Th>Ojo</Th>
                        <Th>Esfera</Th>
                        <Th>Cilindro</Th>
                        <Th>Eje</Th>
                        <Th>Prisma</Th>
                    </Tr>
                    </Thead>
                    <Tbody>
                    <Tr>
                        <Td>OD</Td>
                        <Td>{data.sphere_right || "N"}</Td>
                        <Td>{data.cylinder_right || ""}</Td>
                        <Td>{data.axis_right || ""}</Td>
                        <Td>{data.prism_right || ""}</Td>
                    </Tr>
                    <Tr>
                        <Td>OI</Td>
                        <Td>{data.sphere_left || "N"}</Td>
                        <Td>{data.cylinder_left || ""}</Td>
                        <Td>{data.axis_left || ""}</Td>
                        <Td>{data.prism_left || ""}</Td>
                    </Tr>
                    </Tbody>
                </Table>

                {/* Parte inferior: ADD, AVVL, DNP, ALT */}
                <Table size="sm" mt={6} variant="simple">
                    <Thead>
                    <Tr>
                        <Th>Ojo</Th>
                        <Th>ADD</Th>
                        <Th>AV VL</Th>
                        <Th>DNP</Th>
                        <Th>ALT</Th>
                    </Tr>
                    </Thead>
                    <Tbody>
                    <Tr>
                        <Td>OD</Td>
                        <Td>{data.add_right || "-"}</Td>
                        <Td>{data.av_vl_right || ""}</Td>
                        <Td>{data.dnp_right || ""}</Td>
                        <Td>{data.alt_right || ""}</Td>
                    </Tr>
                    <Tr>
                        <Td>OI</Td>
                        <Td>{data.add_left || "-"}</Td>
                        <Td>{data.av_vl_left || ""}</Td>
                        <Td>{data.dnp_left || ""}</Td>
                        <Td>{data.alt_left || ""}</Td>
                    </Tr>
                    </Tbody>
                </Table>
                </Box>
                <Box p={5}>
                <SimpleGrid columns={[1, 2]} spacing={4}>
                    <Box padding={4} width="200%" maxWidth="500px" textAlign="left">
                    <SimpleGrid columns={1} spacing={4}>
                        <FormControl mb={4}>
                        <FormLabel>Armazón</FormLabel>
                        <Input
                            type="text"
                            value={salesData?.inventario?.brand ?? "Sin marca"}
                            isReadOnly
                            maxWidth="200%"
                        />
                        </FormControl>
                        <FormControl mb={4}>
                        <FormLabel>Tipo de Lentes</FormLabel>
                        <Input
                            type="text"
                            value={salesData?.lens?.lens_type || ""}
                            onChange={handleLensChange}
                            onFocus={handleInputFocus}
                            placeholder="Escribe para buscar..."
                            width="100%"
                        />
                        {isTyping && salesData?.lens?.lens_type?.trim()?.length > 0 && (
                            <Box
                            border="1px solid #ccc"
                            borderRadius="md"
                            mt={2}
                            maxHeight="150px"
                            overflowY="auto"
                            bg="white"
                            zIndex="10"
                            position="relative"
                            width="100%"
                            >
                            {lensTypes
                                .filter((lens) =>
                                lens.lens_type.toLowerCase().includes(salesData?.lens?.lens_type?.toLowerCase())
                                )
                                .map((lens) => (
                                <Box
                                    key={lens.id}
                                    padding={2}
                                    _hover={{ bg: "teal.100", cursor: "pointer" }}
                                    onMouseDown={() => handleLensSelect(lens)}
                                >
                                    {lens.lens_type}
                                </Box>
                                ))}
                            </Box>
                        )}
                        </FormControl>
                        <FormControl mb={4}>
                        <FormLabel>Laboratorio</FormLabel>
                        <Select
                            value={selectedLab}
                            onChange={(e) => setSelectedLab(e.target.value)}
                            width="100%"
                            maxWidth="100%"
                        >
                            <option value="">Seleccionar Laboratorio</option>
                            {labsList.map((lab) => (
                            <option key={lab.id} value={lab.id}>
                                {lab.name}
                            </option>
                            ))}
                        </Select>
                        </FormControl>
                        <FormControl mb={4}>
                        <FormLabel>Observaciones</FormLabel>
                        <Textarea
                            value={observations}
                            onChange={(e) => setObservations(e.target.value)}
                            placeholder="Ingrese observaciones..."
                            width="100%"
                            maxWidth="100%"
                        />
                        </FormControl>
                    </SimpleGrid>
                    </Box>
                </SimpleGrid>

                <Box width="100%" padding={4}>
                    <SimpleGrid columns={1} spacing={4}>
                    {salesData && patientData ? (
                        <PdfLaboratory 
                            formData={{
                                // Datos del paciente
                                ...patientData,
                                // Datos de la venta
                                ...salesData,
                                // Medidas oftálmicas
                                ...(filteredMeasures[0] || {}),
                                // Observaciones del formulario
                                observations: observations,
                                // Laboratorio seleccionado
                                selectedLab: selectedLab
                            }}
                            targetRef={salesRef} 
                            branchPhone={branchPhone} 
                            branchName={salesData?.branchs?.name}
                        />
                    ) : (
                        <Text>No data available to generate PDF</Text>
                    )}
                </SimpleGrid>
                </Box>
                </Box>

            </Box>
          </Box>
        </Box>
      );
    };      

export default LaboratoryOrder;
