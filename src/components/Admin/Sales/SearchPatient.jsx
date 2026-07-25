import { useEffect, useState } from "react";
import {
    SimpleGrid,
    FormControl,
    FormLabel,
    Input,
    Box,
    useColorModeValue,
    useColorMode,
    VStack,
    Text,
    Icon,
    InputGroup,
    InputLeftElement,
    Divider,
} from "@chakra-ui/react";
import { supabase } from "../../../api/supabase";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";
import { SearchIcon } from "@chakra-ui/icons";

const SearchPatient = ({ onFormDataChange, initialFormData = {} }) => {
    const [branches, setBranches] = useState([]);
    const [patients, setPatients] = useState([]);
    const [search, setSearch] = useState("");
    const [filteredPatients, setFilteredPatients] = useState([]);
    const [formData, setFormData] = useState(initialFormData);

    useEffect(() => {
        fetchData("branchs", setBranches);
        fetchPatients();
    }, []);

    useEffect(() => {
        if (
            initialFormData &&
            initialFormData.patient_id &&
            patients.length > 0
        ) {
            const selected = patients.find(
                (p) => String(p.id) === String(initialFormData.patient_id)
            );
            if (selected) {
                setFormData((prev) => ({
                    ...prev,
                    patient_id: selected.id,
                    pt_phone: selected.pt_phone ? selected.pt_phone.toString() : "",
                }));
                setSearch(`${selected.pt_firstname} ${selected.pt_lastname}`);
                setFilteredPatients([]);
                if (onFormDataChange) {
                    onFormDataChange({
                        ...initialFormData,
                        patient_id: selected.id,
                        pt_phone: selected.pt_phone ? selected.pt_phone.toString() : "",
                    });
                }
            }
        }
    }, [initialFormData.patient_id, patients]);

    const fetchData = async (table, setData) => {
        const { data, error } = await supabase.from(table).select("*");
        if (error) {
            console.error(`Error fetching ${table}:`, error);
        } else {
            setData(data);
        }
    };

    const fetchPatients = async () => {
        const { data, error } = await supabase
            .from("patients")
            .select("id, pt_firstname, pt_lastname, pt_ci, pt_phone");
        if (error) {
            console.error("Error fetching patients:", error);
        } else {
            setPatients(data);
            setFilteredPatients(data);
        }
    };

    const handleSearchChange = (e) => {
        const value = e.target.value.toLowerCase();
        setSearch(value);

        const filtered = patients.filter((patient) => {
            const fullName = `${patient.pt_firstname} ${patient.pt_lastname}`.toLowerCase();
            return (
                fullName.includes(value) ||
                patient.pt_ci?.toLowerCase().includes(value)
            );
        });

        setFilteredPatients(filtered);
    };

    const handlePatientSelect = (patient) => {
        const fullName = `${patient.pt_firstname} ${patient.pt_lastname}`;

        setFormData((prev) => ({
            ...prev,
            patient_id: patient.id,
            pt_phone: patient.pt_phone ? patient.pt_phone.toString() : "",
        }));

        setSearch(fullName);
        setFilteredPatients([]);

        if (onFormDataChange) {
            onFormDataChange({
                ...formData,
                patient_id: patient.id,
                pt_phone: patient.pt_phone ? patient.pt_phone.toString() : "",
            });
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;

        if (name === "pt_phone") {
            const numericValue = value.replace(/[^0-9]/g, "");
            setFormData((prev) => ({
                ...prev,
                [name]: numericValue || null,
            }));
        } else {
            setFormData((prev) => ({
                ...prev,
                [name]: value,
            }));
        }
    };

    const handlePhoneChange = (value) => {
        setFormData((prev) => ({
            ...prev,
            pt_phone: value.replace(/[^0-9]/g, ""),
        }));
    };

    const bgColor = useColorModeValue("white", "gray.900");
    const textColor = useColorModeValue("gray.800", "white");
    const borderColor = useColorModeValue("gray.200", "gray.700");
    const selectBg = useColorModeValue("white", "gray.800");
    const highlightBg = useColorModeValue("blue.50", "blue.900");
    const { colorMode } = useColorMode();

    return (
        <Box width="100%">
            <SimpleGrid columns={[1, 2]} spacing={8}>
                <VStack align="stretch" spacing={4}>
                    <FormControl id="patient-search">
                        <FormLabel fontWeight="bold" fontSize="lg" color={textColor}>
                            Buscar paciente
                        </FormLabel>
                        <InputGroup>
                            <InputLeftElement pointerEvents="none">
                                <Icon as={SearchIcon} color="gray.400" />
                            </InputLeftElement>
                            <Input
                                type="text"
                                height="48px"
                                borderRadius="xl"
                                placeholder="Nombre o CI..."
                                value={search}
                                onChange={handleSearchChange}
                                bg={selectBg}
                                borderColor={borderColor}
                                color={textColor}
                                fontSize="md"
                                _hover={{
                                    borderColor: useColorModeValue("gray.300", "gray.500"),
                                }}
                                _focus={{
                                    borderColor: useColorModeValue("blue.500", "blue.300"),
                                    boxShadow: useColorModeValue(
                                        "0 0 0 2px #3182ce33",
                                        "0 0 0 2px #63b3ed33"
                                    ),
                                }}
                                transition="all 0.2s"
                            />
                        </InputGroup>
                        {search && filteredPatients.length > 0 && (
                            <Box
                                border={`1px solid ${borderColor}`}
                                borderRadius="lg"
                                mt={2}
                                maxHeight="200px"
                                overflowY="auto"
                                bg={selectBg}
                                boxShadow="md"
                                zIndex={10}
                                position="absolute"
                                width="100%"
                            >
                                {filteredPatients.map((patient) => (
                                    <Box
                                        key={patient.id}
                                        px={4}
                                        py={3}
                                        _hover={{
                                            bg: highlightBg,
                                            cursor: "pointer",
                                        }}
                                        onClick={() => handlePatientSelect(patient)}
                                        transition="background 0.2s"
                                    >
                                        <Text fontWeight="medium" color={textColor}>
                                            {patient.pt_firstname} {patient.pt_lastname}
                                        </Text>
                                        <Text fontSize="sm" color="gray.500">
                                            CI: {patient.pt_ci}
                                        </Text>
                                    </Box>
                                ))}
                            </Box>
                        )}

                    </FormControl>
                </VStack>
                <VStack align="stretch" spacing={4}>
                    <FormControl>
                        <FormLabel fontWeight="bold" fontSize="lg" color={textColor}>
                            Teléfono
                        </FormLabel>
                        <PhoneInput
                            type="text"
                            name="pt_phone"
                            height="48px"
                            borderRadius="xl"
                            value={formData.pt_phone || ""}
                            onInput={(e) => {
                                e.target.value = e.target.value.replace(/[^0-9]/g, "");
                            }}
                            onChange={handlePhoneChange}
                            enableSearch={true}
                            inputStyle={{
                                width: "100%",
                                height: "48px",
                                borderRadius: "24px",
                                border: `1px solid ${
                                    colorMode === "dark" ? "#4A5568" : "#CBD5E0"
                                }`,
                                backgroundColor: colorMode === "dark" ? "#1A202C" : "white",
                                color: colorMode === "dark" ? "white" : "#1A202C",
                                fontSize: "16px",
                                paddingLeft: "56px",
                                boxShadow: "sm",
                                transition: "border 0.2s",
                            }}
                            buttonStyle={{
                                backgroundColor: colorMode === "dark" ? "#1A202C" : "white",
                                border: `1px solid ${
                                    colorMode === "dark" ? "#4A5568" : "#CBD5E0"
                                }`,
                                borderRadius: "24px 0 0 24px",
                            }}
                            dropdownStyle={{
                                backgroundColor: colorMode === "dark" ? "#2D3748" : "white",
                                color: colorMode === "dark" ? "white" : "black",
                                zIndex: 1000,
                                borderRadius: "md",
                                boxShadow: "md",
                            }}
                            searchStyle={{
                                backgroundColor: colorMode === "dark" ? "#4A5568" : "#F7FAFC",
                                color: colorMode === "dark" ? "white" : "black",
                            }}
                        />
                    </FormControl>
                </VStack>
            </SimpleGrid>
            <Divider mt={8} />
            <Text
                mt={4}
                fontSize="sm"
                color="gray.500"
                textAlign="center"
                letterSpacing="wide"
            >
                Selecciona un paciente para continuar con la venta.
            </Text>
        </Box>
    );
};

export default SearchPatient;