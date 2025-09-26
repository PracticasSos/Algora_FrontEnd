import { 
    Box, 
    Button, 
    FormControl, 
    FormLabel, 
    Input, 
    Heading, 
    useColorModeValue, 
    Text, 
    HStack, 
    VStack, 
    Divider 
} from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { supabase } from "../../api/supabase.js";
import { FaEye } from 'react-icons/fa';
import SmartHeader from "../header/SmartHeader.jsx";

const Branch = () => {
        const navigate = useNavigate();
        const [formData, setFormData] = useState({
                name: '',
                address: '',
                email: '',
                cell: '',
                ruc: ''
        });

        const [message, setMessage] = useState(null);

        const handleChange = (e) => {
                const { name, value } = e.target;
                setFormData({ ...formData, [name]: value });
        };

        const handleSubmit = async (e) => {
                e.preventDefault();

                if (!formData.name || !formData.address || !formData.email || !formData.cell || !formData.ruc) {
                        console.error('Todos los campos son obligatorios');
                        return;
                }
                const { data, error } = await supabase
                        .from('branchs')
                        .insert([formData]);

                if (error) {
                        setMessage({ type: 'error', text: `Error al registrar el sucursal: ${error.message}` });
                        console.error('Error al registrar la sucursal:', error.message);
                } else {
                        setMessage({ type: 'success', text: 'Sucursal registrada con éxito' });
                        setFormData({
                                name: '',
                                address: '',
                                email: '',
                                cell: '',
                                ruc: ''
                        });
                }
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

        const moduleSpecificButton = (
            <Button 
                onClick={() => handleNavigate('/list-branch')} 
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
                        Listar Sucursales
                    </Text>
                </HStack>
            </Button>
        );

        return (
                <Box
                        className="signup-form"
                        minH="100vh"
                        display="flex"
                        flexDirection="column"
                        justifyContent="flex-start"
                        alignItems="center"
                        pt={8}
                        bg={useColorModeValue("gray.50", "gray.900")}
                >
                        <SmartHeader moduleSpecificButton={moduleSpecificButton} />
                        <Box w="100%" maxW="600px" mb={4}>
                                <Heading 
                                        mb={2} 
                                        textAlign="center" 
                                        size="lg"
                                        fontWeight="800"
                                        color={useColorModeValue('teal.600', 'teal.300')}
                                        letterSpacing="wide"
                                >
                                        Registro de Sucursal
                                </Heading>
                                <Text textAlign="center" color={useColorModeValue("gray.600", "gray.400")} mb={2}>
                                        Ingresa los datos para registrar una nueva sucursal.
                                </Text>
                                <Divider mb={4} />
                        </Box>
                        <Box 
                                width="100%" 
                                maxWidth="600px" 
                                p={{ base: 4, md: 8 }} 
                                borderRadius="xl" 
                                boxShadow="2xl"
                                bg={useColorModeValue("white", "gray.800")}
                        >
                                {message && (
                                        <Box
                                                bgColor={message.type === 'success' ? "green.100" : "red.100"}
                                                color={message.type === 'success' ? "green.700" : "red.700"}
                                                p={3}
                                                mb={4}
                                                borderRadius="md"
                                                textAlign="center"
                                                fontWeight="bold"
                                                fontSize="md"
                                                boxShadow="md"
                                        >
                                                {message.text}
                                        </Box>
                                )}
                                <form onSubmit={handleSubmit}>
                                    <VStack spacing={5} align="stretch">
                                        <FormControl id="name" isRequired>
                                                <FormLabel fontWeight="bold" color={useColorModeValue("teal.700", "teal.200")}>Nombre</FormLabel>
                                                <Input
                                                        type="text"
                                                        name="name"
                                                        value={formData.name}
                                                        onChange={handleChange}
                                                        _focus={{ borderColor: "teal.400", boxShadow: "0 0 0 2px #81E6D9" }}
                                                        placeholder="Ej: Sucursal Centro"
                                                        size="lg"
                                                        bg={useColorModeValue("gray.50", "gray.700")}
                                                />
                                        </FormControl>
                                        <FormControl id="address" isRequired>
                                                <FormLabel fontWeight="bold" color={useColorModeValue("teal.700", "teal.200")}>Dirección</FormLabel>
                                                <Input
                                                        type="text"
                                                        name="address"
                                                        value={formData.address}
                                                        onChange={handleChange}
                                                        _focus={{ borderColor: "teal.400", boxShadow: "0 0 0 2px #81E6D9" }}
                                                        placeholder="Ej: Av. Principal 123"
                                                        size="lg"
                                                        bg={useColorModeValue("gray.50", "gray.700")}
                                                />
                                        </FormControl>
                                        <FormControl id="email" isRequired>
                                                <FormLabel fontWeight="bold" color={useColorModeValue("teal.700", "teal.200")}>Correo</FormLabel>
                                                <Input
                                                        type="email"
                                                        name="email"
                                                        value={formData.email}
                                                        onChange={handleChange}
                                                        _focus={{ borderColor: "teal.400", boxShadow: "0 0 0 2px #81E6D9" }}
                                                        placeholder="Ej: sucursal@email.com"
                                                        size="lg"
                                                        bg={useColorModeValue("gray.50", "gray.700")}
                                                />
                                        </FormControl>
                                        <FormControl id="cell" isRequired>
                                                <FormLabel fontWeight="bold" color={useColorModeValue("teal.700", "teal.200")}>Teléfono</FormLabel>
                                                <Input
                                                        type="tel"
                                                        name="cell"
                                                        onChange={handleChange}
                                                        value={formData.cell}
                                                        _focus={{ borderColor: "teal.400", boxShadow: "0 0 0 2px #81E6D9" }}
                                                        placeholder="Ej: 0999999999"
                                                        size="lg"
                                                        bg={useColorModeValue("gray.50", "gray.700")}
                                                />
                                        </FormControl>
                                        <FormControl id="ruc" isRequired>
                                                <FormLabel fontWeight="bold" color={useColorModeValue("teal.700", "teal.200")}>RUC</FormLabel>
                                                <Input
                                                        type="text"
                                                        name="ruc"
                                                        onChange={handleChange}
                                                        value={formData.ruc}
                                                        _focus={{ borderColor: "teal.400", boxShadow: "0 0 0 2px #81E6D9" }}
                                                        placeholder="Ej: 1234567890001"
                                                        size="lg"
                                                        bg={useColorModeValue("gray.50", "gray.700")}
                                                />
                                        </FormControl>
                                    </VStack>
                                    <Box display="flex" justifyContent="center" mt={8}>
                                            <Button
                                                    bgGradient="linear(to-r, teal.400, teal.600)"
                                                    color="white"
                                                    width={{ base: "100%", md: "60%" }}
                                                    _hover={{ 
                                                            bgGradient: "linear(to-r, teal.500, teal.700)",
                                                            boxShadow: "md"
                                                    }}
                                                    borderRadius="full"
                                                    size="lg"
                                                    fontWeight="bold"
                                                    type="submit"
                                                    transition="all 0.2s"
                                            >
                                                    Registrar
                                            </Button>
                                    </Box>
                                </form>
                        </Box>
                </Box>
        );
};

export default Branch;
