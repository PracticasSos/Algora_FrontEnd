import { Box, Button, FormControl, FormLabel, Input, Heading, SimpleGrid, useColorModeValue, Text, HStack, Fade } from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { supabase } from "../../api/supabase.js";
import { FaEye } from 'react-icons/fa';
import SmartHeader from "../header/SmartHeader.jsx";

const Lab = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        name: '',
        address: '',
        cell: '',
        email: '',
        ruc: ''
    });

    const [message, setMessage] = useState(null);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!formData.name || !formData.address || !formData.cell || !formData.email || !formData.ruc) {
            setMessage({ type: 'error', text: 'Todos los campos son obligatorios' });
            return;
        }
    
        const { data, error } = await supabase.from('labs').insert([formData]);
    
        if (error) {
            setMessage({ type: 'error', text: `Error al registrar el laboratorio: ${error.message}` });
            console.error('Error al registrar el laboratorio:', error.message);
        } else {
            setMessage({ type: 'success', text: 'Laboratorio registrado con éxito' });
            setFormData({
                name: '',
                address: '',
                cell: '',
                email: '',
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

    const moduleSpecificButton = (
      <Button 
        onClick={() => handleNavigate('/list-labs')} 
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
            Listar Laboratorios
          </Text>
        </HStack>
      </Button>
    );

    return (
        <Box 
            minH="100vh"
            bg={useColorModeValue("gray.50", "gray.900")}
            display="flex"
            flexDirection="column"
            alignItems="center"
            pt={8}
            pb={8}
        >
            <SmartHeader moduleSpecificButton={moduleSpecificButton} />
            <Box w="100%" maxW="900px" mb={4}>
                <Heading 
                    mb={4}
                    p={4} 
                    mt={4}
                    textAlign="left" 
                    size="lg"
                    fontWeight="extrabold"
                    color={useColorModeValue('teal.700', 'teal.200')}
                    letterSpacing="tight"
                    pb={2}
                >
                    Registro de Laboratorio
                </Heading>
            </Box>
            <Box
                width="90%"
                maxWidth="900px"
                borderRadius="2xl"   
                boxShadow="2xl"
                padding={{ base: "24px", md: "32px" }}
                bg={useColorModeValue("white", "gray.800")}
                transition="box-shadow 0.2s"
            >
                <Fade in={!!message}>
                    {message && (
                        <Box 
                            bgGradient={
                                message.type === 'success'
                                    ? "linear(to-r, teal.100, green.100)"
                                    : "linear(to-r, red.100, orange.100)"
                            }
                            color={message.type === 'success' ? "green.800" : "red.800"} 
                            p={3} 
                            mb={6} 
                            borderRadius="md"
                            textAlign="center"
                            fontWeight="bold"
                            fontSize="md"
                            boxShadow="sm"
                        >
                            {message.text}
                        </Box>
                    )}
                </Fade>
                <form onSubmit={handleSubmit}>
                    <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
                        <FormControl id="name" isRequired>
                            <FormLabel fontWeight="bold" color="teal.600">Nombre</FormLabel>
                            <Input 
                                type="text" 
                                name="name" 
                                value={formData.name} 
                                onChange={handleChange} 
                                _focus={{ borderColor: "teal.400", boxShadow: "0 0 0 2px #81E6D9" }}
                                bg={useColorModeValue("gray.50", "gray.700")}
                                borderRadius="md"
                                transition="all 0.2s"
                            />
                        </FormControl>

                        <FormControl id="address" isRequired>
                            <FormLabel fontWeight="bold" color="teal.600">Dirección</FormLabel>
                            <Input 
                                type="text" 
                                name="address" 
                                value={formData.address} 
                                onChange={handleChange} 
                                _focus={{ borderColor: "teal.400", boxShadow: "0 0 0 2px #81E6D9" }}
                                bg={useColorModeValue("gray.50", "gray.700")}
                                borderRadius="md"
                                transition="all 0.2s"
                            />
                        </FormControl>

                        <FormControl id="email" isRequired>
                            <FormLabel fontWeight="bold" color="teal.600">Correo</FormLabel>
                            <Input 
                                type="email" 
                                name="email" 
                                value={formData.email} 
                                onChange={handleChange} 
                                _focus={{ borderColor: "teal.400", boxShadow: "0 0 0 2px #81E6D9" }}
                                bg={useColorModeValue("gray.50", "gray.700")}
                                borderRadius="md"
                                transition="all 0.2s"
                            />
                        </FormControl>

                        <FormControl id="cell" isRequired>
                            <FormLabel fontWeight="bold" color="teal.600">Teléfono</FormLabel>
                            <Input 
                                type="text" 
                                name="cell" 
                                value={formData.cell} 
                                onChange={handleChange} 
                                _focus={{ borderColor: "teal.400", boxShadow: "0 0 0 2px #81E6D9" }}
                                bg={useColorModeValue("gray.50", "gray.700")}
                                borderRadius="md"
                                transition="all 0.2s"
                            />
                        </FormControl>

                        <FormControl id="ruc" isRequired>
                            <FormLabel fontWeight="bold" color="teal.600">RUC</FormLabel>
                            <Input 
                                type="text" 
                                name="ruc" 
                                value={formData.ruc} 
                                onChange={handleChange} 
                                _focus={{ borderColor: "teal.400", boxShadow: "0 0 0 2px #81E6D9" }}
                                bg={useColorModeValue("gray.50", "gray.700")}
                                borderRadius="md"
                                transition="all 0.2s"
                            />
                        </FormControl>
                    </SimpleGrid>

                    <Box display="flex" justifyContent="center" mt={8}>
                        <Button 
                            type="submit" 
                            width={{ base: "100%", md: "40%" }}
                            bgGradient="linear(to-r, teal.400, teal.600)"
                            color="white"
                            _hover={{ 
                                bgGradient: "linear(to-r, teal.500, teal.700)",
                                transform: "scale(1.03)"
                            }}
                            borderRadius="lg"
                            fontWeight="bold"
                            fontSize="lg"
                            shadow="md"
                            transition="all 0.2s"
                            py={6}
                        >
                            Registrar
                        </Button>
                    </Box>
                </form>
            </Box>
        </Box>
    );
};

export default Lab;
