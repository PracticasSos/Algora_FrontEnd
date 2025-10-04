import { useEffect, useState } from "react";
import {
    SimpleGrid,
    FormControl,
    FormLabel,
    Input,
    Box,
    VStack,
    Text,
    Divider,
    useColorModeValue,
    useColorMode,
} from "@chakra-ui/react";
import { supabase } from "../../../../api/supabase";
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';

const SearchHistory = ({ onFormDataChange, initialFormData = {} }) => {
    const [branches, setBranches] = useState([]);
    const [formData, setFormData] = useState(initialFormData);

    useEffect(() => {
        fetchData("branchs", setBranches);
    }, []);

    useEffect(() => {
        if (initialFormData.sale_id) {
            fetchSaleById(initialFormData.sale_id);
        }
    }, [initialFormData.sale_id]);

    useEffect(() => {
        if (onFormDataChange && Object.keys(formData).length > 0) {
            const hasChanges = JSON.stringify(formData) !== JSON.stringify(initialFormData);
            if (hasChanges) {
                onFormDataChange(formData);
                updateSaleData();
            }
        }
    }, [formData]);

    const fetchData = async (table, setData) => {
        const { data, error } = await supabase.from(table).select("*");
        if (error) console.error(`Error fetching ${table}:`, error);
        else setData(data);
    };

    const fetchSaleById = async (id) => {
        const { data, error } = await supabase
            .from("sales")
            .select("*, patients (pt_firstname, pt_lastname, pt_phone)")
            .eq("id", id)
            .single();

        if (error) {
            console.error("Error fetching sale:", error);
        } else if (data) {
            const updatedData = {
                sale_id: data.id,
                patient_id: data.patient_id,
                pt_phone: data.pt_phone || data.patients?.pt_phone || "",
                branchs_id: data.branchs_id,
                date: data.date,
                patient_name: `${data.patients?.pt_firstname || ""} ${data.patients?.pt_lastname || ""}`,
            };
            setFormData(updatedData);
            onFormDataChange && onFormDataChange(updatedData);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        const newValue = name === "pt_phone" ? value.replace(/[^0-9]/g, "") : value;
        setFormData((prev) => ({
            ...prev,
            [name]: newValue || null,
        }));
    };

    const hasChanges = (currentData, originalData) => {
        return (
            currentData.branchs_id !== originalData.branchs_id ||
            currentData.date !== originalData.date ||
            currentData.pt_phone !== originalData.pt_phone
        );
    };

    const updateSaleData = async () => {
        if (hasChanges(formData, initialFormData)) {
            if (formData.sale_id) {
                const { error: saleError } = await supabase
                    .from("sales")
                    .update({
                        branchs_id: formData.branchs_id,
                        date: formData.date,
                    })
                    .eq("id", formData.sale_id);

                if (saleError) {
                    console.error("Error updating sale:", saleError);
                } else {
                    console.log("Venta actualizada correctamente");
                }
            }

            if (formData.patient_id && formData.pt_phone !== initialFormData.pt_phone) {
                const { error: patientError } = await supabase
                    .from("patients")
                    .update({
                        pt_phone: formData.pt_phone, 
                    })
                    .eq("id", formData.patient_id);

                if (patientError) {
                    console.error("Error updating patient phone:", patientError);
                } else {
                    console.log("Teléfono del paciente actualizado correctamente");
                }
            }
        } else {
            console.log("No hay cambios para guardar");
        }
    };

    const handlePhoneChange = (value) => {
        setFormData((prev) => ({
            ...prev,
            pt_phone: value.replace(/[^0-9]/g, ''),
        }));
    };

    // UI colors
    const bgColor = useColorModeValue("white", "gray.900");
    const textColor = useColorModeValue("gray.800", "white");
    const borderColor = useColorModeValue("gray.200", "gray.700");
    const { colorMode } = useColorMode();

    return (
        <Box
            borderRadius="xl"
            p={[4, 6]}
            width="90%"
            mx={"auto"}
            mt={2}
            transition="box-shadow 0.2s"
        >
            <SimpleGrid columns={[1, 2]} spacing={8}>
                <VStack align="stretch" spacing={4}>
                    <FormControl>
                        <FormLabel fontWeight="bold" fontSize="lg" color={textColor}>
                            Nombre del Paciente
                        </FormLabel>
                        <Input
                            value={formData.patient_name || "No disponible"}
                            isReadOnly
                            height="48px"
                            borderRadius="xl"
                            bg={bgColor}
                            borderColor={borderColor}
                            color={textColor}
                            fontSize="md"
                        />
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
                            onInput={(e) => (e.target.value = e.target.value.replace(/[^0-9]/g, ""))}
                            onChange={handlePhoneChange}
                            enableSearch={true}
                            inputStyle={{
                                width: "100%",
                                height: "48px",
                                borderRadius: "24px",
                                border: `1px solid ${colorMode === "dark" ? "#4A5568" : "#CBD5E0"}`,
                                backgroundColor: colorMode === "dark" ? "#1A202C" : "white",
                                color: colorMode === "dark" ? "white" : "#1A202C",
                                fontSize: "16px",
                                paddingLeft: "56px",
                                boxShadow: "sm",
                                transition: "border 0.2s",
                            }}
                            buttonStyle={{
                                backgroundColor: colorMode === "dark" ? "#1A202C" : "white",
                                border: `1px solid ${colorMode === "dark" ? "#4A5568" : "#CBD5E0"}`,
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
                Consulta la información del paciente y edita el teléfono si es necesario.
            </Text>
        </Box>
    );
};

export default SearchHistory;
