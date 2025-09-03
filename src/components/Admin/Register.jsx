import { useState, useEffect } from 'react';
import { supabase } from '../../api/supabase';
import {
  Box, Button, FormControl, FormLabel, Heading, Input, Select, SimpleGrid, useToast, Checkbox,
  Card, CardHeader, CardBody, Divider, Text, useColorModeValue, HStack
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

  // Load roles and branches
  useEffect(() => {
    const loadData = async () => {
      try {
        const [rolesResponse, branchsResponse] = await Promise.all([
          supabase.from('role').select('*'),
          supabase.from('branchs').select('*')
        ]);
        
        if (rolesResponse.data) setRoles(rolesResponse.data);
        if (branchsResponse.data) setBranchs(branchsResponse.data);
        
        if (rolesResponse.error) {
          console.error('Error loading roles:', rolesResponse.error);
        }
        if (branchsResponse.error) {
          console.error('Error loading branches:', branchsResponse.error);
        }
      } catch (error) {
        console.error('Error loading data:', error);
      }
    };

    loadData();
  }, []);

  // Auto-select routes when role changes
  useEffect(() => {
    if (!formData.role_id) return;
    let newRoutes = [];
    switch (parseInt(formData.role_id)) {
      case 1: // Admin
      case 4: // Super Admin
        newRoutes = availableRoutes;
        break;
      case 2: // Optometra
        newRoutes = availableRoutes.filter(r =>
          ['/measures-final', '/history-clinic', '/register-patient', '/history-measure-list'].includes(r.path)
        );
        break;
      case 3: // Vendedor
        newRoutes = availableRoutes.filter(r =>
          ['/register-patient', '/sales', '/history-clinic', '/balance', '/measures-final', '/patient-records', '/order-laboratory-list', '/history-measure-list', '/balances-patient'].includes(r.path)
        );
        break;
      default:
        newRoutes = [];
    }
    setSelectRoutes(newRoutes.map(r => r.path));
  }, [formData.role_id]);

  const handleChange = e => {
    const { name, value } = e.target;
    setFormData(f => ({ ...f, [name]: value }));
  };

  const handleRouteToggle = path => {
    setSelectRoutes(prev =>
      prev.includes(path) ? prev.filter(p => p !== path) : [...prev, path]
    );
  };

  const renderInputField = (label, name, type) => (
    <FormControl id={name} isRequired>
      <FormLabel>{label}</FormLabel>
      <Input type={type} name={name} value={formData[name]} onChange={handleChange} />
    </FormControl>
  );

  const renderSelectField = (label, name, options) => (
    <FormControl id={name} isRequired>
      <FormLabel>{label}</FormLabel>
      <Select name={name} value={formData[name]} onChange={handleChange}>
        <option value="">Seleccione {label.toLowerCase()}</option>
        {options.map(o => (
          <option key={o.id} value={o.id}>
            {o.name || o.role_name}
          </option>
        ))}
      </Select>
    </FormControl>
  );

  const handleCreate = async () => {
    setLoading(true);
    
    try {
      // Validar campos requeridos
      const requiredFields = ['email', 'password', 'firstname', 'lastname', 'username', 'ci', 'phone_number', 'age', 'birthdate'];
      const emptyFields = requiredFields.filter(field => !formData[field]);
      
      if (emptyFields.length > 0) {
        toast({
          title: 'Error',
          description: `Los siguientes campos son requeridos: ${emptyFields.join(', ')}`,
          status: 'error'
        });
        return;
      }

      // Verificar sesión actual
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !sessionData.session) {
        toast({
          title: 'Error',
          description: 'No se pudo obtener la sesión actual.',
          status: 'error'
        });
        return;
      }

      // 1) Subir sello si existe
      let selloUrl = null;
      if (selloFile) {
        const ext = selloFile.name.split(".").pop();
        const fileName = `sello-${formData.ci}-${Date.now()}.${ext}`;
        const { error: uploadError } = await supabase.storage.from("sello").upload(fileName, selloFile);
        
        if (uploadError) {
          toast({
            title: "Error subiendo sello",
            description: uploadError.message,
            status: "error"
          });
          return;
        }
        
        const { data: urlData } = supabase.storage.from("sello").getPublicUrl(fileName);
        selloUrl = urlData?.publicUrl;
      }

      // 2) Preparar datos para la Edge Function
      const employeeData = {
        email: formData.email.trim(),
        password: formData.password,
        firstname: formData.firstname,
        lastname: formData.lastname,
        username: formData.username,
        age: parseInt(formData.age),
        birthdate: formData.birthdate,
        check_in_date: formData.check_in_date || new Date().toISOString().split('T')[0], // Fecha actual si no se especifica
        ci: formData.ci,
        phone_number: formData.phone_number,
        branch_id: formData.branch_id ? parseInt(formData.branch_id) : null,
        role_id: formData.role_id ? parseInt(formData.role_id) : null,
        title: '', // Agregar si tienes este campo
        sello_url: selloUrl
      };

      // 3) Llamar a la Edge Function
      const { data, error } = await supabase.functions.invoke('register-employee', {
        body: employeeData,
        headers: {
          Authorization: `Bearer ${sessionData.session.access_token}`
        }
      });

      if (error) {
        console.error('Error calling edge function:', error);
        toast({
          title: 'Error',
          description: 'Error al crear el usuario. Por favor, intenta de nuevo.',
          status: 'error'
        });
        return;
      }

      if (!data.success) {
        toast({
          title: 'Error',
          description: data.error || 'Error desconocido al crear el usuario',
          status: 'error'
        });
        return;
      }

      // 4) Insertar permisos si se creó exitosamente
      if (data.user && selectRoutes.length > 0) {
        // Obtener el tenant_id del usuario actual para los permisos
        const tenantId = sessionData.session.user.user_metadata?.tenant_id;
        
        const perms = selectRoutes.map(route => ({
          user_id: data.user.id,
          route,
          tenant_id: tenantId
        }));

        const { error: permErr } = await supabase
          .from('user_permissions')
          .insert(perms);

        if (permErr) {
          console.warn('Error adding permissions:', permErr);
          toast({
            title: 'Advertencia',
            description: 'Usuario creado pero hubo un error al asignar algunos permisos',
            status: 'warning'
          });
        }
      }

      // 5) Éxito
      toast({
        title: 'Usuario creado exitosamente',
        description: `El empleado ${formData.firstname} ${formData.lastname} ha sido registrado.`,
        status: 'success'
      });

      // Limpiar formulario
      setFormData({
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
      setSelectRoutes([]);
      setSelloFile(null);

    } catch (error) {
      console.error('Error in handleCreate:', error);
      toast({
        title: 'Error',
        description: 'Error inesperado. Por favor, intenta de nuevo.',
        status: 'error'
      });
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
    <Box display="flex" flexDirection="column" alignItems="center" minH="100vh" p={6}>
      <SmartHeader moduleSpecificButton={moduleSpecificButton} />
      <Card w="100%" maxW="900px" boxShadow="lg" borderRadius="xl" bg={useColorModeValue('white', 'gray.800')}>
        <CardBody as="form" onSubmit={e => { e.preventDefault(); handleCreate(); }}>
          <Box w="100%" maxW="800px" mb={4}>
            <Heading mb={4} textAlign="left" size="md" fontWeight="700" color={useColorModeValue('teal.600', 'teal.300')} pb={2}>
              Registrar Usuario
            </Heading>
          </Box>
          <SimpleGrid columns={[1, 2]} spacing={4}>
            {renderInputField('Correo', 'email', 'email')}
            {renderInputField('Contraseña', 'password', 'password')}
            {renderInputField('Nombre', 'firstname', 'text')}
            {renderInputField('Apellido', 'lastname', 'text')}
            {renderInputField('Username', 'username', 'text')}
            {renderInputField('Edad', 'age', 'number')}
            {renderSelectField('Rol', 'role_id', roles)}
            {renderInputField('Fecha de Nacimiento', 'birthdate', 'date')}
            {renderInputField('Fecha de Ingreso', 'check_in_date', 'date')}
            {renderInputField('Celular', 'phone_number', 'text')}
            {renderInputField('C.I.', 'ci', 'text')}
            {renderSelectField('Sucursal', 'branch_id', branchs)}

            <FormControl>
              <FormLabel color={useColorModeValue("teal.700", "teal.300")} fontWeight="semibold">
                Sello Digital (imagen)
              </FormLabel>
              <Box
                border="2px dashed"
                borderColor={useColorModeValue("#CBD5E0", "gray.600")}
                borderRadius="lg"
                p={4}
                textAlign="center"
                position="relative"
                bg={useColorModeValue("gray.50", "gray.700")}
                _hover={{
                  bg: useColorModeValue("gray.100", "gray.600"),
                  cursor: "pointer"
                }}
                onClick={() => document.getElementById('selloInput').click()}
              >
                <Text color={useColorModeValue("gray.600", "gray.300")} fontSize="sm">
                  Haz clic o arrastra una imagen aquí para subir el sello
                </Text>
                <Input
                  id="selloInput"
                  type="file"
                  accept="image/*"
                  onChange={(e) => setSelloFile(e.target.files[0])}
                  display="none"
                />
                {selloFile && (
                  <Box mt={4}>
                    <Text fontSize="sm" color={useColorModeValue("gray.700", "gray.200")} fontWeight="medium">
                      Archivo seleccionado: {selloFile.name}
                    </Text>
                  </Box>
                )}
              </Box>
            </FormControl>
          </SimpleGrid>
          <Box display="flex" justifyContent="space-between" mt={8}>
            <Button 
              type="submit" 
              colorScheme="teal"
              isLoading={loading}
              loadingText="Creando Usuario..."
            >
              Crear Usuario
            </Button>
            <Button 
              onClick={() => navigate('/Admin')} 
              colorScheme="gray"
              isDisabled={loading}
            >
              Cancelar
            </Button>
          </Box>
        </CardBody>
      </Card>

      <Card w="100%" maxW="900px" mt={8} boxShadow="lg" borderRadius="xl" borderColor={useColorModeValue('gray.200', 'gray.600')}>
        <CardHeader>
          <Heading size="md" color={useColorModeValue('gray.800', 'white')}> Permisos Adicionales </Heading>
        </CardHeader>
        <Divider borderColor={useColorModeValue('gray.200', 'gray.600')} />
        <CardBody>
          <SimpleGrid columns={[1, 2]} spacing={3}>
            {availableRoutes.map(({ path, label }) => (
              <FormControl key={path} display="flex" alignItems="center">
                <Checkbox
                  isChecked={selectRoutes.includes(path)}
                  onChange={() => handleRouteToggle(path)}
                  colorScheme="teal"
                  isDisabled={loading}
                >
                  <Text color={useColorModeValue('gray.700', 'gray.200')}>{label}</Text>
                </Checkbox>
              </FormControl>
            ))}
          </SimpleGrid>
        </CardBody>
      </Card>
    </Box>
  );
};

export default Register;