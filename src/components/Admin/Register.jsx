import { useState, useEffect } from 'react';
import { supabase } from '../../api/supabase';
import {
  Box, Button, FormControl, FormLabel, Heading, Input, Select, SimpleGrid, useToast, Checkbox,
  Card, CardHeader, CardBody, Divider, Text, useColorModeValue, HStack, FormErrorMessage
} from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import { FaEye } from 'react-icons/fa';
import SmartHeader from '../header/SmartHeader';

const Register = () => {
  const [selectRoutes, setSelectRoutes] = useState([]);
  const [roles, setRoles] = useState([]);
  const [branchs, setBranchs] = useState([]);
  const [selloFile, setSelloFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstname: '',
    lastname: '',
    username: '',
    age: '',
    role_id: '',
    birthdate: '',
    check_in_date: '',
    phone_number: '',
    ci: '',
    branch_id: ''
  });
  const [errors, setErrors] = useState({});

  const toast = useToast();
  const navigate = useNavigate();

  const availableRoutes = [
    { path: "/register", label: "Registrar Usuarios" },
    { path: "/inventory", label: "Inventario" },
    { path: "/register-patient", label: "Registrar Paciente" },
    { path: "/branch", label: "Registrar Sucursal" },
    { path: "/labs", label: "Registrar Laboratorio" },
    { path: "/cash-closure", label: "Cierre de Caja" },
    { path: "/sales", label: "Registrar Venta" },
    { path: "/register-lens", label: "Registrar Lunas" },
    { path: "/patient-records", label: "Historial del Paciente" },
    { path: "/measures-final", label: "Medidas Finales" },
    { path: "/order-laboratory-list", label: "Órdenes a Laboratorio" },
    { path: "/history-measure-list", label: "Historial de Medidas" },
    { path: "/egresos", label: "Egresos" },
    { path: "/balances-patient", label: "Saldos del Paciente" },
    { path: "/retreats-patients", label: "Abonos del Paciente" },
    { path: "/balance", label: "Balance General" },
    { path: "/list-lens", label: "Listar Lunas" },
    { path: "/list-balance", label: "Listar Balances" },
    { path: "/list-sales", label: "Historial de Ventas" },
    { path: "/history-clinic", label: "Historial Clínico" },
  ];

  useEffect(() => {
    const loadData = async () => {
      try {
        const [rolesResponse, branchsResponse] = await Promise.all([
          supabase.from('role').select('*'),
          supabase.from('branchs').select('*')
        ]);
        if (rolesResponse.data) {
          const allowedRoles = ["Admin", "Optometra", "Vendedor"];
          setRoles(rolesResponse.data.filter(r => allowedRoles.includes(r.role_name)));
        }
        if (branchsResponse.data) setBranchs(branchsResponse.data);
        if (rolesResponse.error) console.error('Error loading roles:', rolesResponse.error);
        if (branchsResponse.error) console.error('Error loading branches:', branchsResponse.error);
      } catch (error) {
        console.error('Error loading data:', error);
      }
    };
    loadData();
  }, []);

  useEffect(() => {
    if (!formData.role_id) return;
    let newRoutes = [];
    switch (parseInt(formData.role_id)) {
      case 1: case 4: newRoutes = availableRoutes; break;
      case 2: newRoutes = availableRoutes.filter(r => ['/measures-final', '/history-clinic', '/register-patient', '/history-measure-list'].includes(r.path)); break;
      case 3: newRoutes = availableRoutes.filter(r => ['/register-patient', '/sales', '/history-clinic', '/balance', '/measures-final', '/patient-records', '/order-laboratory-list', '/history-measure-list', '/balances-patient'].includes(r.path)); break;
      default: newRoutes = [];
    }
    setSelectRoutes(newRoutes.map(r => r.path));
  }, [formData.role_id]);
  
  const handleChange = e => {
    const { name, value } = e.target;
    setFormData(f => ({ ...f, [name]: value }));
    if (errors[name]) {
      setErrors(prevErrors => ({ ...prevErrors, [name]: null }));
    }
  };

  const handleRouteToggle = path => {
    setSelectRoutes(prev => prev.includes(path) ? prev.filter(p => p !== path) : [...prev, path]);
  };
  
  const validateForm = async () => {
    const newErrors = {};

    const requiredFields = {
      email: "El correo es requerido",
      password: "La contraseña es requerida",
      firstname: "El nombre es requerido",
      lastname: "El apellido es requerido",
      username: "El nombre de usuario es requerido",
      age: "La edad es requerida",
      birthdate: "La fecha de nacimiento es requerida",
      phone_number: "El número de celular es requerido",
      ci: "La C.I. es requerida",
      role_id: "El rol es requerido",
      branch_id: "La sucursal es requerida",
    };

    for (const field in requiredFields) {
      if (!formData[field]) {
        newErrors[field] = requiredFields[field];
      }
    }

    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "El formato del correo es inválido.";
    }

    if (Object.keys(newErrors).length === 0) {
      const checks = [
        { field: 'ci', value: formData.ci, message: 'Esta C.I. ya está registrada.' },
        { field: 'email', value: formData.email, message: 'Este correo ya está en uso.' },
        { field: 'username', value: formData.username, message: 'Este nombre de usuario ya existe.' },
        { field: 'phone_number', value: formData.phone_number, message: 'Este celular ya está registrado.' },
      ];

      for (const check of checks) {
        const { data, error } = await supabase
          .from('users')
          .select('id')
          .eq(check.field, check.value)
          .single();

        if (data) {
          newErrors[check.field] = check.message;
        }
        if(error && error.code !== 'PGRST116') {
          console.error(`Error checking uniqueness for ${check.field}:`, error);
        }
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const renderInputField = (label, name, type) => (
    <FormControl id={name} isRequired isInvalid={!!errors[name]}>
      <FormLabel>{label}</FormLabel>
      <Input type={type} name={name} value={formData[name]} onChange={handleChange} />
      <FormErrorMessage>{errors[name]}</FormErrorMessage>
    </FormControl>
  );

  const renderSelectField = (label, name, options) => (
    <FormControl id={name} isRequired isInvalid={!!errors[name]}>
      <FormLabel>{label}</FormLabel>
      <Select placeholder={`Seleccione ${label.toLowerCase()}`} name={name} value={formData[name]} onChange={handleChange}>
        {options.map(o => (
          <option key={o.id} value={o.id}>{o.name || o.role_name}</option>
        ))}
      </Select>
      <FormErrorMessage>{errors[name]}</FormErrorMessage>
    </FormControl>
  );

  const handleCreate = async () => {
    setLoading(true);

    const isValid = await validateForm();
    if (!isValid) {
      toast({
        title: 'Formulario incompleto',
        description: 'Por favor, corrige los errores marcados en rojo.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      setLoading(false);
      return;
    }
    
    try {
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !sessionData.session) {
        toast({ title: 'Error', description: 'No se pudo obtener la sesión actual.', status: 'error' });
        setLoading(false);
        return;
      }

      let selloUrl = null;
      if (selloFile) {
        const ext = selloFile.name.split(".").pop();
        const fileName = `sello-${formData.ci}-${Date.now()}.${ext}`;
        const { error: uploadError } = await supabase.storage.from("sello").upload(fileName, selloFile);

        if (uploadError) {
          toast({ title: "Error subiendo sello", description: uploadError.message, status: "error" });
          setLoading(false);
          return;
        }

        const { data: urlData } = supabase.storage.from("sello").getPublicUrl(fileName);
        selloUrl = urlData?.publicUrl;
      }

      const employeeData = {
        email: formData.email.trim(),
        password: formData.password,
        firstname: formData.firstname,
        lastname: formData.lastname,
        username: formData.username,
        age: parseInt(formData.age),
        birthdate: formData.birthdate,
        check_in_date: formData.check_in_date || new Date().toISOString().split('T')[0],
        ci: formData.ci,
        phone_number: formData.phone_number,
        branch_id: formData.branch_id ? parseInt(formData.branch_id) : null,
        role_id: formData.role_id ? parseInt(formData.role_id) : null,
        title: '',
        sello_url: selloUrl
      };

      const { data, error } = await supabase.functions.invoke('register-employee', {
        body: employeeData,
        headers: { Authorization: `Bearer ${sessionData.session.access_token}` }
      });

      if (error || (data && !data.success)) {
        console.error('Error from edge function:', error || data.error);
        
        let description = 'Error al crear el usuario. Intenta de nuevo.';
        const errorMessage = (error?.message || data?.error || '').toLowerCase();

        if (errorMessage.includes('unique constraint')) {
            if (errorMessage.includes('users_ci_key')) description = 'La C.I. ya está registrada.';
            else if (errorMessage.includes('users_email_key')) description = 'El correo ya está en uso.';
            else if (errorMessage.includes('unique_username')) description = 'El nombre de usuario ya existe.';
            else if (errorMessage.includes('users_phone_number_key')) description = 'El número de celular ya está registrado.';
        }
        
        toast({ title: 'Error de Creación', description, status: 'error' });
        setLoading(false);
        return;
      }
      
      if (data.user && selectRoutes.length > 0) {
        const tenantId = sessionData.session.user.user_metadata?.tenant_id;
        const perms = selectRoutes.map(route => ({
          user_id: data.user.id,
          route,
          tenant_id: tenantId
        }));

        const { error: permErr } = await supabase.from('user_permissions').insert(perms);

        if (permErr) {
          console.warn('Error adding permissions:', permErr);
          toast({ title: 'Advertencia', description: 'Usuario creado pero hubo un error al asignar permisos.', status: 'warning' });
        }
      }

      toast({
        title: 'Usuario creado exitosamente',
        description: `El empleado ${formData.firstname} ${formData.lastname} ha sido registrado.`,
        status: 'success'
      });

      setFormData({
        email: '', password: '', firstname: '', lastname: '', username: '', age: '',
        role_id: '', birthdate: '', check_in_date: '', phone_number: '', ci: '', branch_id: ''
      });
      setSelectRoutes([]);
      setSelloFile(null);
      
    } catch (error) {
      console.error('Error in handleCreate:', error);
      toast({ title: 'Error Inesperado', description: 'Ocurrió un error inesperado.', status: 'error' });
    } finally {
      setLoading(false);
    }
  };
  
  const handleNavigate = (route = null) => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (route) {
      navigate(route);
      return;
    }
    if (!user || !user.role_id) {
      navigate('/Login');
      return;
    }
    switch (user.role_id) {
      case 1: navigate('/Admin'); break;
      case 2: navigate('/Optometra'); break;
      case 3: navigate('/Vendedor'); break;
      case 4: navigate('/SuperAdmin'); break;
      default: navigate('/');
    }
  };

  const moduleSpecificButton = (
    <Button
      onClick={() => handleNavigate('/list-users')}
      bg={useColorModeValue('rgba(255, 255, 255, 0.8)', 'rgba(255, 255, 255, 0.1)')}
      backdropFilter="blur(10px)"
      border="1px solid"
      borderColor={useColorModeValue('rgba(56, 178, 172, 0.3)', 'rgba(56, 178, 172, 0.5)')}
      color={useColorModeValue('teal.600', 'teal.300')}
      size="sm"
      borderRadius="15px"
      px={4}
      _hover={{
        bg: useColorModeValue('rgba(56, 178, 172, 0.1)', 'rgba(56, 178, 172, 0.2)'),
        borderColor: 'teal.400',
        transform: 'translateY(-1px)',
      }}
      transition="all 0.2s"
    >
      <HStack spacing={2} align="center" justify="center">
        <FaEye size="14px" />
        <Text fontWeight="600" lineHeight="1" m={0}> Listar Usuarios </Text>
      </HStack>
    </Button>
  );
  
  return (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      minH="100vh"
      p={[2, 4, 8]}
      bg={useColorModeValue("gray.50", "gray.900")}
    >
      <SmartHeader moduleSpecificButton={moduleSpecificButton} />
      <Card
        w="100%"
        maxW="900px"
        boxShadow="2xl"
        borderRadius="2xl"
        bg={useColorModeValue("white", "gray.800")}
        mt={6}
        px={[2, 6, 10]}
        py={[4, 8]}
        transition="box-shadow 0.2s"
      >
        <CardBody as="form" onSubmit={e => { e.preventDefault(); handleCreate(); }}>
          <Box w="100%" maxW="800px" mb={4}>
            <Heading
              mb={2}
              textAlign="left"
              size="lg"
              fontWeight="bold"
              color={useColorModeValue("teal.600", "teal.300")}
              pb={2}
              letterSpacing="tight"
            >
              Registrar Usuario
            </Heading>
            <Text color={useColorModeValue("gray.600", "gray.300")} fontSize="md" mb={2}>
              Completa los datos para crear un nuevo usuario en el sistema.
            </Text>
          </Box>
          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
            {renderInputField("Correo", "email", "email")}
            {renderInputField("Contraseña", "password", "password")}
            {renderInputField("Nombre", "firstname", "text")}
            {renderInputField("Apellido", "lastname", "text")}
            {renderInputField("Username", "username", "text")}
            {renderInputField("Edad", "age", "number")}
            {renderSelectField("Rol", "role_id", roles)}
            {renderInputField("Fecha de Nacimiento", "birthdate", "date")}
            {renderInputField("Fecha de Ingreso", "check_in_date", "date")}
            {renderInputField("Celular", "phone_number", "text")}
            {renderInputField("C.I.", "ci", "text")}
            {renderSelectField("Sucursal", "branch_id", branchs)}

            <FormControl>
              <FormLabel
                color={useColorModeValue("teal.700", "teal.300")}
                fontWeight="semibold"
              >
                Sello Digital (imagen)
              </FormLabel>
              <Box
                border="2px dashed"
                borderColor={useColorModeValue("teal.200", "teal.600")}
                borderRadius="lg"
                p={4}
                textAlign="center"
                position="relative"
                bg={useColorModeValue("gray.50", "gray.700")}
                _hover={{
                  bg: useColorModeValue("teal.50", "teal.800"),
                  cursor: "pointer",
                  borderColor: useColorModeValue("teal.400", "teal.300"),
                }}
                onClick={() => document.getElementById("selloInput").click()}
                transition="all 0.2s"
              >
                <Text
                  color={useColorModeValue("gray.600", "gray.300")}
                  fontSize="sm"
                  mb={2}
                >
                  Haz clic o arrastra una imagen aquí para subir el sello
                </Text>
                <Input
                  id="selloInput"
                  type="file"
                  accept="image/*"
                  onChange={e => setSelloFile(e.target.files[0])}
                  display="none"
                />
                {selloFile && (
                  <Box mt={4}>
                    <Text
                      fontSize="sm"
                      color={useColorModeValue("teal.700", "teal.200")}
                      fontWeight="medium"
                    >
                      Archivo seleccionado: {selloFile.name}
                    </Text>
                  </Box>
                )}
              </Box>
            </FormControl>
          </SimpleGrid>
          <Box
            display="flex"
            justifyContent="flex-end"
            gap={4}
            mt={10}
            flexWrap="wrap"
          >
            <Button
              type="submit"
              colorScheme="teal"
              isLoading={loading}
              loadingText="Creando Usuario..."
              size="lg"
              px={8}
              borderRadius="xl"
              fontWeight="bold"
              boxShadow="md"
              _hover={{ bg: "teal.500" }}
            >
              Crear Usuario
            </Button>
            <Button
              onClick={() => navigate("/Admin")}
              colorScheme="gray"
              isDisabled={loading}
              size="lg"
              px={8}
              borderRadius="xl"
              fontWeight="bold"
              variant="outline"
              _hover={{ bg: useColorModeValue("gray.100", "gray.700") }}
            >
              Cancelar
            </Button>
          </Box>
        </CardBody>
      </Card>

      <Card
        w="100%"
        maxW="900px"
        mt={10}
        boxShadow="2xl"
        borderRadius="2xl"
        borderColor={useColorModeValue("gray.200", "gray.600")}
        px={[2, 6, 10]}
        py={[4, 8]}
      >
        <CardHeader>
          <Heading
            size="md"
            color={useColorModeValue("teal.700", "teal.200")}
            fontWeight="bold"
            letterSpacing="tight"
          >
            Permisos Adicionales
          </Heading>
          <Text color={useColorModeValue("gray.600", "gray.300")} fontSize="sm" mt={1}>
            Selecciona los módulos a los que el usuario tendrá acceso.
          </Text>
        </CardHeader>
        <Divider borderColor={useColorModeValue("gray.200", "gray.600")} />
        <CardBody>
          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={3}>
            {availableRoutes.map(({ path, label }) => (
              <FormControl
                key={path}
                display="flex"
                alignItems="center"
                py={2}
                px={2}
                borderRadius="md"
                _hover={{
                  bg: useColorModeValue("teal.50", "teal.900"),
                  transition: "background 0.2s",
                }}
                transition="background 0.2s"
              >
                <Checkbox
                  isChecked={selectRoutes.includes(path)}
                  onChange={() => handleRouteToggle(path)}
                  colorScheme="teal"
                  isDisabled={loading}
                  size="lg"
                  mr={3}
                />
                <Text
                  color={useColorModeValue("gray.700", "gray.200")}
                  fontWeight="medium"
                  fontSize="md"
                >
                  {label}
                </Text>
              </FormControl>
            ))}
          </SimpleGrid>
        </CardBody>
      </Card>
    </Box>
  );
};

export default Register;