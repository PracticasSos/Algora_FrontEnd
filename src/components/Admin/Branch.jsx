import { Box, Button, FormControl, FormLabel, Input, Heading, useColorModeValue, Text, HStack } from "@chakra-ui/react";
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
            display="flex"
            flexDirection="column"
            justifyContent="center"
            alignItems="center"
            pt={6}
        >
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
                Sucursal
            </Heading>
            </Box>
            <Box width="100%" maxWidth="800px" p={6} borderRadius="lg" boxShadow="lg">
                {message && (
                    <Box
                        bgColor={message.type === 'success' ? "green.200" : "red.200"}
                        color={message.type === 'success' ? "green.800" : "red.800"}
                        p={2}
                        mb={4}
                        borderRadius="md"
                        textAlign="center"
                    >
                        {message.text}
                    </Box>
                )}
                <Box display="grid" gridTemplateColumns="1fr 1fr" gap={4}>
                    <FormControl id="name" isRequired>
                        <FormLabel >Nombre</FormLabel>
                        <Input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            _focus={{ borderColor: "#008B94" }}
                        />
                    </FormControl>
                    <FormControl id="address" isRequired>
                        <FormLabel >Dirección</FormLabel>
                        <Input
                            type="text"
                            name="address"
                            value={formData.address}
                            onChange={handleChange}
                            _focus={{ borderColor: "#008B94" }}
                        />
                    </FormControl>
                    <FormControl id="email" isRequired>
                        <FormLabel >Correo</FormLabel>
                        <Input
                            type="text"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            _focus={{ borderColor: "#008B94" }}
                        />
                    </FormControl>
                    <FormControl id="cell" >
                        <FormLabel >Teléfono</FormLabel>
                        <Input
                            type="text"
                            name="cell"
                            onChange={handleChange}
                            value={formData.cell}
                            _focus={{ borderColor: "#008B94" }}
                        />
                    </FormControl>
                    <FormControl id="ruc">
                        <FormLabel >RUC</FormLabel>
                        <Input
                            type="text"
                            name="ruc"
                            onChange={handleChange}
                            value={formData.ruc}
                            _focus={{ borderColor: "#008B94" }}
                        />
                    </FormControl>
                </Box>

                <Box display="flex" justifyContent="center" mt={4}>
                    <Button
                        bg={useColorModeValue("teal.500", "teal.600")}
                        color="white"
                         width="40%"
                        _hover={{ 
                            bg: useColorModeValue("teal.600", "teal.500")
                        }}
                        borderRadius="8px"
                        onClick={handleSubmit}
                    >
                        Registrar
                    </Button>
                </Box>
            </Box>
        </Box>
    );
};

export default Branch;
