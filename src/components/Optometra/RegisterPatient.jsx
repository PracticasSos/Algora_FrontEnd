import { useState, useEffect } from 'react';
import { supabase } from '../../api/supabase';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  Select,
  Textarea,
  SimpleGrid,
  useColorModeValue,
  useColorMode,
  Heading,
  useToast,
  HStack,
  Text,
  Divider,
  VStack,
  Flex,
} from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';
import { FaEye } from 'react-icons/fa';
import SmartHeader from '../header/SmartHeader';

const RegisterPatientForm = () => {
  const navigate = useNavigate();
  const toast = useToast();

  const [formData, setFormData] = useState({
    user_id: '',
    pt_firstname: '',
    pt_lastname: '',
    pt_occupation: '',
    pt_address: '',
    pt_phone: '',
    pt_age: '',
    pt_ci: '',
    pt_city: '',
    pt_email: '',
    pt_consultation_reason: '',
    pt_recommendations: '',
    sexo: '',
    date: ''
  });

  const [users, setUsers] = useState([]);
  const [pt_phone, setPt_Phone] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase.from('users').select('id, username')
        .eq('activo', true);
      if (error) throw error;
      setUsers(data);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.user_id || !formData.pt_firstname?.trim() || !formData.pt_lastname?.trim()) {
      toast({
        title: "Campos incompletos",
        description: "Por favor, completa todos los campos obligatorios.",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      const { data, error } = await supabase
        .from('patients')
        .insert([formData]);

      if (error) {
        if (error.message && error.message.toLowerCase().includes('duplicate') && error.message.toLowerCase().includes('patients_unique_ci_per_tenant')) {
          toast({
            title: "Cédula repetida",
            description: "Ya existe un paciente registrado con esta cédula.",
            status: "warning",
            duration: 4000,
            isClosable: true,
          });
        } else {
          toast({
            title: "Error",
            description: "No se pudo registrar el paciente.",
            status: "error",
            duration: 3000,
            isClosable: true,
          });
        }
        console.error("Error:", error);
      } else {
        toast({
          title: "Exito",
          description: "Paciente registrado correctamete.",
          status: "success",
          duration: 3000,
          isClosable: true,
        })
        handleReset();
      }
    } catch (err) {
      console.error('Error desconocido:', err);
      alert("Error inesperado. Intenta nuevamente.");
    }
  };

  const handleReset = () => {
    setFormData({
      user_id: '',
      pt_firstname: '',
      pt_lastname: '',
      pt_occupation: '',
      pt_address: '',
      pt_phone: '',
      pt_age: '',
      pt_ci: '',
      pt_city: '',
      pt_email: '',
      pt_consultation_reason: '',
      pt_recommendations: '',
      sexo: '',
      date: ''
    });
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
      onClick={() => handleNavigate('/list-patients')}
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
          Listar Pacientes
        </Text>
      </HStack>
    </Button>
  );

  const { colorMode } = useColorMode();

  return (
    <Box
      className="register-patient-form"
      display="flex"
      flexDirection="column"
      alignItems="center"
      minHeight="100vh"
      p={{ base: 2, md: 6 }}
      bg={useColorModeValue('gray.50', 'gray.900')}
    >
      <SmartHeader moduleSpecificButton={moduleSpecificButton} />

      <Box
        as="form"
        onSubmit={handleSubmit}
        width="100%"
        maxWidth="900px"
        padding={{ base: 4, md: 8 }}
        boxShadow="2xl"
        borderRadius="2xl"
        bg={useColorModeValue('white', 'gray.800')}
        mt={6}
      >
        <Heading
          mb={6}
          textAlign="start"
          size="lg"
          fontWeight="800"
          color={useColorModeValue('teal.600', 'teal.300')}
          pb={2}
          letterSpacing="wide"
        >
          Registro de Pacientes
        </Heading>
        <Divider mb={6} />
        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={8}>
          <VStack spacing={5} align="stretch">
            {renderInputField('Fecha', 'date', 'date', true)}
            {renderInputField('Nombre', 'pt_firstname', 'text', true)}
            {renderInputField('Apellido', 'pt_lastname', 'text', true)}
            {renderInputField('Ocupación', 'pt_occupation', 'text')}
            {renderInputField('Dirección', 'pt_address', 'text')}

            <FormControl>
              <FormLabel>Teléfono</FormLabel>
              <PhoneInput
                value={formData.pt_phone}
                onChange={(value) =>
                  setFormData((prevData) => ({
                    ...prevData,
                    pt_phone: value
                  }))
                }
                enableSearch={true}
                inputStyle={{
                  width: '100%',
                  height: '44px',
                  borderRadius: '12px',
                  border: `1px solid ${colorMode === 'dark' ? '#4A5568' : '#CBD5E0'}`,
                  backgroundColor: colorMode === 'dark' ? '#2D3748' : 'white',
                  color: colorMode === 'dark' ? 'white' : '#1A202C',
                  fontSize: '15px',
                  paddingLeft: '48px'
                }}
                buttonStyle={{
                  backgroundColor: colorMode === 'dark' ? '#2D3748' : 'white',
                  border: `1px solid ${colorMode === 'dark' ? '#4A5568' : '#CBD5E0'}`,
                  borderRadius: '12px 0 0 12px'
                }}
                searchStyle={{
                  backgroundColor: colorMode === 'dark' ? '#4A5568' : '#F7FAFC',
                  color: colorMode === 'dark' ? 'white' : 'black'
                }}
                dropdownStyle={{
                  zIndex: 1000
                }}
              />
            </FormControl>

            {renderInputField('Edad', 'pt_age', 'number')}
            {renderInputField('C.I.', 'pt_ci', 'text')}
            <FormControl>
              <FormLabel>Sexo</FormLabel>
              <Select
                name="sexo"
                onChange={handleChange}
                value={formData.sexo}
                placeholder="Seleccione"
                borderRadius="12px"
              >
                <option value="Femenino">Femenino</option>
                <option value="Masculino">Masculino</option>
              </Select>
            </FormControl>
          </VStack>

          <VStack spacing={5} align="stretch">
            {renderInputField('Ciudad', 'pt_city', 'text')}
            {renderInputField('Correo', 'pt_email', 'email')}
            {renderSelectField('Responsable', 'user_id', users)}
            {renderTextareaField('Razón de Consulta', 'pt_consultation_reason')}
            {renderTextareaField('Recomendaciones', 'pt_recommendations')}
            <Flex justify="flex-end" mt={2}>
              <Button type="submit" colorScheme="teal" size="lg" borderRadius="12px" px={8}>
                Guardar
              </Button>
            </Flex>
          </VStack>
        </SimpleGrid>
        <Divider mt={8} mb={4} />
        <Flex justify="center" gap={4}>
          <Button
            onClick={() => {
              localStorage.setItem('selectedPatient', JSON.stringify(formData));
              handleNavigate('/measures-final');
            }}
            colorScheme="gray"
            size="lg"
            borderRadius="12px"
            px={8}
          >
            RX FINAL
          </Button>
        </Flex>
      </Box>
    </Box>
  );

  function renderInputField(label, name, type, isRequired = false) {
    return (
      <FormControl id={name} isRequired={isRequired}>
        <FormLabel fontWeight="bold">{label}</FormLabel>
        <Input
          type={type}
          name={name}
          value={formData[name]}
          onChange={handleChange}
          borderRadius="12px"
          size="lg"
          bg={useColorModeValue('gray.100', 'gray.700')}
          _focus={{
            borderColor: 'teal.400',
            boxShadow: '0 0 0 1px teal.400',
            bg: useColorModeValue('white', 'gray.800')
          }}
        />
      </FormControl>
    );
  }

  function renderTextareaField(label, name) {
    return (
      <FormControl id={name}>
        <FormLabel fontWeight="bold">{label}</FormLabel>
        <Textarea
          name={name}
          value={formData[name]}
          onChange={handleChange}
          borderRadius="12px"
          size="lg"
          bg={useColorModeValue('gray.100', 'gray.700')}
          _focus={{
            borderColor: 'teal.400',
            boxShadow: '0 0 0 1px teal.400',
            bg: useColorModeValue('white', 'gray.800')
          }}
          minH="80px"
        />
      </FormControl>
    );
  }

  function renderSelectField(label, name, options) {
    return (
      <FormControl id={name} isRequired>
        <FormLabel fontWeight="bold">{label}</FormLabel>
        <Select
          name={name}
          value={formData[name]}
          onChange={handleChange}
          borderRadius="12px"
          size="lg"
          bg={useColorModeValue('gray.100', 'gray.700')}
          _focus={{
            borderColor: 'teal.400',
            boxShadow: '0 0 0 1px teal.400',
            bg: useColorModeValue('white', 'gray.800')
          }}
        >
          <option value="">Seleccione {label.toLowerCase()}</option>
          {options.map(option => (
            <option key={option.id} value={option.id}>
              {option.username}
            </option>
          ))}
        </Select>
      </FormControl>
    );
  }
};

export default RegisterPatientForm;