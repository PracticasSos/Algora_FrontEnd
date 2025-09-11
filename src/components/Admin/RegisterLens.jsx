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
    useToast 
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
            <FormControl isRequired={required}>
                <FormLabel htmlFor={name}>{label}</FormLabel>
                <Input
                    id={name}
                    name={name}
                    type={type}
                    value={formData[name]}
                    onChange={handleChange}
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
            Listar Lunas
          </Text>
        </HStack>
      </Button>
      );

    return (
        <Box className="register-lens-form" display="flex" flexDirection="column" alignItems="center" pt={6}>
            <SmartHeader moduleSpecificButton={moduleSpecificButton} />

            <Box as="form" onSubmit={handleSubmit} width="100%" maxWidth="800px" padding={6} boxShadow="lg" borderRadius="md">
                <Heading 
                    mb={4} 
                    textAlign="left" 
                    size="md"
                    fontWeight="700"
                    color={useColorModeValue('teal.600', 'teal.300')}
                    pb={2}
                >
                    Registrar Lunas
                </Heading>
                <SimpleGrid columns={[1, 2]} spacing={4}>
                    {renderInputField('Lunas', 'lens_type', 'text', true)}
                    {renderInputField('Precio', 'lens_price', 'number', true)}
                </SimpleGrid>
                <Box display="flex" justifyContent="space-around" mt={6}>
                    <Button type="submit" colorScheme="teal">Guardar</Button>
                    <Button onClick={handleReset} colorScheme="gray">Limpiar</Button>
                </Box>
            </Box>
        </Box>
    );
};

export default RegisterLens;
