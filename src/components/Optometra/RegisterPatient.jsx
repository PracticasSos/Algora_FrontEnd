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
  FormErrorMessage,
} from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';
import { FaEye } from 'react-icons/fa';
import SmartHeader from '../header/SmartHeader';

// --- NUEVO --- Función para obtener la fecha de hoy en formato YYYY-MM-DD
const getTodayDate = () => {
  const today = new Date();
  return today.toISOString().split('T')[0];
};

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
    date: getTodayDate(), // --- MODIFICADO ---
    branch_id: '',
  });

  const [users, setUsers] = useState([]);
  const [branches, setBranches] = useState([]);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    fetchUsers();
    fetchBranches();
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

  const fetchBranches = async () => {
    try {
      const { data, error } = await supabase.from('branchs').select('id, name');
      if (error) throw error;
      setBranches(data);
    } catch (error) {
      console.error('Error fetching branches:', error);
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.pt_firstname.trim()) newErrors.pt_firstname = 'El nombre es obligatorio.';
    if (!formData.pt_lastname.trim()) newErrors.pt_lastname = 'El apellido es obligatorio.';
    if (!formData.pt_occupation.trim()) newErrors.pt_occupation = 'La ocupación es obligatoria.';
    if (!formData.pt_address.trim()) newErrors.pt_address = 'La dirección es obligatoria.';
    if (!formData.pt_phone.trim()) newErrors.pt_phone = 'El teléfono es obligatorio.';
    if (!formData.pt_age) newErrors.pt_age = 'La edad es obligatoria.';
    if (!formData.pt_city.trim()) newErrors.pt_city = 'La ciudad es obligatoria.';
    if (!formData.date) newErrors.date = 'La fecha es obligatoria.';
    if (!formData.user_id) newErrors.user_id = 'El responsable es obligatorio.';
    if (!formData.branch_id) newErrors.branch_id = 'La sucursal es obligatoria.';

    if (formData.pt_email && !/\S+@\S+\.\S+/.test(formData.pt_email)) {
      newErrors.pt_email = 'El formato del correo no es válido.';
    }

    return newErrors;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    if (errors[name]) {
      setErrors({ ...errors, [name]: null });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = validateForm();
    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      toast({
        title: "Campos incompletos o inválidos",
        description: "Por favor, revisa los campos marcados en rojo.",
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
      date: getTodayDate(), // --- MODIFICADO ---
      branch_id: '',
    });
    setErrors({});
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
            {renderInputField('Fecha', 'date', 'date', true, errors.date)}
            {renderInputField('Nombre', 'pt_firstname', 'text', true, errors.pt_firstname)}
            {renderInputField('Apellido', 'pt_lastname', 'text', true, errors.pt_lastname)}
            {renderInputField('Ocupación', 'pt_occupation', 'text', true, errors.pt_occupation)}
            {renderInputField('Dirección', 'pt_address', 'text', true, errors.pt_address)}

            {/* --- INICIO DE MODIFICACIÓN TELÉFONO --- */}
            <FormControl isRequired isInvalid={!!errors.pt_phone}>
              <FormLabel>Teléfono</FormLabel>
              <PhoneInput
                country={'ec'} // --- MODIFICADO ---
                value={formData.pt_phone}
                onChange={(value) => {
                  setFormData((prevData) => ({
                    ...prevData,
                    pt_phone: value
                  }));
                  if (errors.pt_phone) {
                    setErrors({ ...errors, pt_phone: null });
                  }
                }}
                containerStyle={{ width: '100%' }} // --- MODIFICADO ---
                inputProps={{
                  required: true,
                  name: 'phone'
                }}
                inputStyle={{
                  width: '100%',
                  height: '40px', // --- MODIFICADO ---
                  borderRadius: '8px', // --- MODIFICADO ---
                  border: `1px solid ${errors.pt_phone ? '#E53E3E' : (colorMode === 'dark' ? '#4A5568' : '#CBD5E0')}`,
                  backgroundColor: colorMode === 'dark' ? '#2D3748' : 'white',
                  color: colorMode === 'dark' ? 'white' : '#1A202C',
                  fontSize: '15px',
                  paddingLeft: '48px'
                }}
                buttonStyle={{
                  backgroundColor: colorMode === 'dark' ? '#2D3748' : 'white',
                  border: `1px solid ${errors.pt_phone ? '#E53E3E' : (colorMode === 'dark' ? '#4A5568' : '#CBD5E0')}`,
                  borderRadius: '8px 0 0 8px' // --- MODIFICADO ---
                }}
                dropdownStyle={{
                  zIndex: 9999 // --- MODIFICADO ---
                }}
              />
              <FormErrorMessage>{errors.pt_phone}</FormErrorMessage>
            </FormControl>
            {/* --- FIN DE MODIFICACIÓN TELÉFONO --- */}

            {renderInputField('Edad', 'pt_age', 'number', true, errors.pt_age)}
            {renderInputField('C.I.', 'pt_ci', 'text', false, errors.pt_ci)}
            
            <FormControl isInvalid={!!errors.sexo}>
              <FormLabel>Sexo</FormLabel>
              <Select
                name="sexo"
                onChange={handleChange}
                value={formData.sexo}
                placeholder="Seleccione"
                borderRadius="12px"
                size="lg" // --- MODIFICADO --- Añadido size para consistencia
                bg={useColorModeValue('gray.100', 'gray.700')} // --- MODIFICADO --- Añadido bg
                _focus={{ // --- MODIFICADO --- Añadido focus
                  borderColor: 'teal.400',
                  boxShadow: '0 0 0 1px teal.400',
                  bg: useColorModeValue('white', 'gray.800')
                }}
              >
                <option value="Femenino">Femenino</option>
                <option value="Masculino">Masculino</option>
              </Select>
              <FormErrorMessage>{errors.sexo}</FormErrorMessage>
            </FormControl>
          </VStack>

          <VStack spacing={5} align="stretch">
            {renderInputField('Ciudad', 'pt_city', 'text', true, errors.pt_city)}
            {renderInputField('Correo', 'pt_email', 'email', false, errors.pt_email)}
            {renderSelectField('Responsable', 'user_id', users, 'username', true, errors.user_id)}
            {renderSelectField('Sucursal', 'branch_id', branches, 'name', true, errors.branch_id)}
            {renderTextareaField('Razón de Consulta', 'pt_consultation_reason', errors.pt_consultation_reason)}
            {renderTextareaField('Recomendaciones', 'pt_recommendations', errors.pt_recommendations)}
            
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

  function renderInputField(label, name, type, isRequired = false, error = null) {
    return (
      <FormControl id={name} isRequired={isRequired} isInvalid={!!error}> 
        <FormLabel fontWeight="bold">{label}</FormLabel>
        <Input
          type={type}
          name={name}
          value={formData[name]}
          onChange={handleChange}
          borderRadius="12px"
          size="lg"
          bg={useColorModeValue('gray.100', 'gray.700')}
          min={type === 'number' ? 0 : undefined}
          _focus={{
            borderColor: 'teal.400',
            boxShadow: '0 0 0 1px teal.400',
            bg: useColorModeValue('white', 'gray.800')
          }}
        />
        <FormErrorMessage>{error}</FormErrorMessage>
      </FormControl>
    );
  }

  function renderTextareaField(label, name, error = null) {
    return (
      <FormControl id={name} isInvalid={!!error}>
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
        <FormErrorMessage>{error}</FormErrorMessage>
      </FormControl>
    );
  }

  function renderSelectField(label, name, options, optionLabelKey = 'username', isRequired = false, error = null) {
    return (
      <FormControl id={name} isRequired={isRequired} isInvalid={!!error}>
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
              {option[optionLabelKey]} 
            </option>
          ))}
        </Select>
        <FormErrorMessage>{error}</FormErrorMessage>
      </FormControl>
    );
  }
};

export default RegisterPatientForm;