import { useState } from "react";
import { supabase } from "../../api/supabase";
import {
    Box,
    Button,
    FormControl,
    FormLabel,
    Input,
    Heading,
    SimpleGrid,
    useColorModeValue,
    Text,
    HStack,
    useToast,
    VStack,
    Divider,
} from '@chakra-ui/react';
import { useNavigate } from "react-router-dom";
import { FaEye } from 'react-icons/fa';
import SmartHeader from "../header/SmartHeader";

const RegisterLens = () => {
    const navigate = useNavigate();
    const toast = useToast();

    const [formData, setFormData] = useState({
        lens_type: '',
        lens_price: 0
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const { data, error } = await supabase
            .from('lens')
            .insert([formData]);

        if (error) {
            console.error('Error:', error.message);
            toast({
                title: 'Error',
                description: "Ocurrió un error: " + error.message,
                status: 'error',
                duration: 5000,
                isClosable: true,
            });
        } else {
            console.log('Lens registered:', data);
            toast({
                title: 'Éxito',
                description: 'Lente registrado correctamente.',
                status: 'success',
                duration: 5000,
                isClosable: true,
            });
            handleReset();
        }
    };

    const handleReset = () => {
        setFormData({
            lens_type: '',
            lens_price: 0
        });
    };

    const renderInputField = (label, name, type, required) => {
        return (
            <FormControl isRequired={required} mb={4}>
                <FormLabel htmlFor={name} fontWeight="600" color={useColorModeValue('teal.700', 'teal.200')}>
                    {label}
                </FormLabel>
                <Input
                    id={name}
                    name={name}
                    type={type}
                    value={formData[name]}
                    onChange={handleChange}
                    borderRadius="12px"
                    bg={useColorModeValue('white', 'gray.800')}
                    boxShadow={useColorModeValue('sm', 'md')}
                    _focus={{
                        borderColor: 'teal.400',
                        boxShadow: '0 0 0 1px #38B2AC',
                    }}
                />
            </FormControl>
        );
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
            onClick={() => handleNavigate('/list-lens')}
            bg={useColorModeValue('whiteAlpha.800', 'whiteAlpha.100')}
            backdropFilter="blur(10px)"
            border="1px solid"
            borderColor={useColorModeValue('teal.200', 'teal.500')}
            color={useColorModeValue('teal.600', 'teal.300')}
            size="sm"
            borderRadius="15px"
            px={4}
            _hover={{
                bg: useColorModeValue('teal.50', 'teal.900'),
                borderColor: 'teal.400',
                transform: 'scale(1.05)',
            }}
            transition="all 0.2s"
        >
            <HStack spacing={2} align="center" justify="center">
                <FaEye size="14px" />
                <Text fontWeight="600" lineHeight="1" m={0}>
                    Listar Lunas
                </Text>
            </HStack>
        </Button>
    );

    return (
        <Box
            className="register-lens-form"
            minH="100vh"
            bg={useColorModeValue('gray.50', 'gray.900')}
            display="flex"
            flexDirection="column"
            alignItems="center"
            pt={10}
        >
            <SmartHeader moduleSpecificButton={moduleSpecificButton} />

            <Box
                as="form"
                onSubmit={handleSubmit}
                width="100%"
                maxWidth="420px"
                padding={8}
                boxShadow="2xl"
                borderRadius="2xl"
                bg={useColorModeValue('white', 'gray.800')}
                mt={8}
            >
                <Heading
                    mb={2}
                    textAlign="center"
                    size="lg"
                    fontWeight="800"
                    color={useColorModeValue('teal.600', 'teal.300')}
                    pb={2}
                >
                    Registrar Lunas
                </Heading>
                <Divider mb={6} />
                <VStack spacing={2} align="stretch">
                    {renderInputField('Lunas', 'lens_type', 'text', true)}
                    {renderInputField('Precio', 'lens_price', 'number', true)}
                </VStack>
                <Box display="flex" justifyContent="space-between" mt={8}>
                    <Button
                        type="submit"
                        colorScheme="teal"
                        borderRadius="12px"
                        fontWeight="700"
                        px={8}
                        _hover={{
                            bg: 'teal.500',
                            transform: 'scale(1.04)',
                        }}
                    >
                        Guardar
                    </Button>
                    <Button
                        onClick={handleReset}
                        colorScheme="gray"
                        borderRadius="12px"
                        fontWeight="700"
                        px={8}
                        _hover={{
                            bg: 'gray.300',
                            transform: 'scale(1.04)',
                        }}
                    >
                        Limpiar
                    </Button>
                </Box>
            </Box>
        </Box>
    );
};

export default RegisterLens;
