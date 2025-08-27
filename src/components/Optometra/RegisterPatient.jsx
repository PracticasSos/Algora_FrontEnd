import { useState, useEffect } from 'react';
import { supabase } from '../../api/supabase';
import { Box, Button, FormControl, FormLabel, Input, Select, Textarea, SimpleGrid, useColorModeValue, useColorMode, Heading } from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';
import { HStack, Text } from '@chakra-ui/react';
import { FaEye } from 'react-icons/fa';
import SmartHeader from '../header/SmartHeader';

const RegisterPatientForm = () => {
  const navigate = useNavigate();

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
    date:''
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

    if (!formData.user_id || !formData.pt_firstname || !formData.pt_lastname) {
      alert("Por favor, completa todos los campos obligatorios.");
      return;
    }

    try {
      const { data, error } = await supabase
        .from('patients')
        .insert([formData]);

      if (error) {
        console.error('Error:', error.message);
        alert("Ocurrió un error: " + error.message);
      } else {
        console.log('Paciente registrado:', data);
        alert("¡Registrado con éxito!");
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
    <Box className="register-patient-form" display="flex" flexDirection="column" alignItems="center" minHeight="100vh" p={4}>
     
      <SmartHeader
        moduleSpecificButton={moduleSpecificButton}
      />
       
      <Box as="form" onSubmit={handleSubmit} width="100%" maxWidth="800px" padding={6} boxShadow="lg" borderRadius="md">
      <Heading 
        mb={4} 
        textAlign="left" 
        size="md"
        fontWeight="700"
        color={useColorModeValue('teal.600', 'teal.300')}
        pb={2}
      >
        Registro de Pacientes
      </Heading>
        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
          <Box 
          >
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
                        height: '40px',
                        borderRadius: '20px',
                        border: `1px solid ${colorMode === 'dark' ? '#4A5568' : '#CBD5E0'}`,
                        backgroundColor: colorMode === 'dark' ? '#2D3748' : 'white',
                        color: colorMode === 'dark' ? 'white' : '#1A202C',
                        fontSize: '14px',
                        paddingLeft: '48px'
                    }}
                    buttonStyle={{
                        backgroundColor: colorMode === 'dark' ? '#2D3748' : 'white',
                        border: `1px solid ${colorMode === 'dark' ? '#4A5568' : '#CBD5E0'}`,
                        borderRadius: '20px 0 0 20px'
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
            <Select name="sexo" onChange={handleChange} value={formData.sexo} placeholder="Seleccione">
              <option value="Femenino">Femenino</option>
              <option value="Masculino">Masculino</option>
            </Select>
          </FormControl>

          </Box>
          
          <Box>
            {renderInputField('Ciudad', 'pt_city', 'text')}
            {renderInputField('Correo', 'pt_email', 'email')}
            {renderSelectField('Responsable', 'user_id', users)}
            <Box display="flex" flexWrap="wrap" justifyContent="center" gap={2} mt={6}>
            {renderTextareaField('Razón de Consulta', 'pt_consultation_reason')}
            {renderTextareaField('Recomendaciones', 'pt_recommendations')}
              <Button type="submit" colorScheme="teal">Guardar</Button>
            </Box>
          </Box>
        </SimpleGrid>
        <Box display="flex" flexWrap="wrap" justifyContent="center" gap={2} mt={6}>
          <Button
            onClick={() => {
              localStorage.setItem('selectedPatient', JSON.stringify(formData));
              handleNavigate('/measures-final');
            }}
            colorScheme="gray"
          >
            RX FINAL
          </Button>
        </Box>
      </Box>
    </Box>
  );


  function renderInputField(label, name, type, isRequired = false) {
    return (
      <FormControl id={name} isRequired={isRequired}>
        <FormLabel>{label}</FormLabel>
        <Input type={type} name={name} value={formData[name]} onChange={handleChange} />
      </FormControl>
    );
  }

  function renderTextareaField(label, name) {
    return (
      <FormControl id={name}>
        <FormLabel>{label}</FormLabel>
        <Textarea name={name} value={formData[name]} onChange={handleChange} />
      </FormControl>
    );
  }

  function renderSelectField(label, name, options) {
    return (
      <FormControl id={name} isRequired>
        <FormLabel>{label}</FormLabel>
        <Select name={name} value={formData[name]} onChange={handleChange}>
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