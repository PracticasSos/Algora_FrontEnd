import { useState, useEffect } from 'react';
import { supabase } from '../../api/supabase';
import {
  Box, Button, Container, Heading, Input, Select, SimpleGrid, useToast,
  Checkbox, Text, useColorModeValue, HStack, VStack, Icon, Flex, Badge,
  FormControl, FormLabel, FormErrorMessage, Spinner,
} from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import {
  UserPlus, User, MapPin, ShieldCheck, Stamp, CheckCircle2,
} from 'lucide-react';
import SmartHeader from '../header/SmartHeader';

const ACCENT = '#00A88E';

// SectionTitle y Field viven AQUÍ, fuera de Register, a propósito. Antes
// estaban declarados dentro del cuerpo de Register — eso significa que en
// cada render (cada tecla presionada) React creaba una función NUEVA para
// <Field>, y al ser una función distinta, React la trata como un
// componente de tipo diferente: desmonta el <Input> anterior y monta uno
// nuevo desde cero. Esto vacía el DOM del campo (pierde el foco) después
// de cada letra — por eso solo entraba un carácter a la vez. Al vivir
// fuera del componente, la función es siempre la misma referencia entre
// renders, así que React reutiliza el mismo <Input> del DOM sin
// desmontarlo, y el foco (y el cursor) se mantienen intactos.
const SectionTitle = ({ icon, children, sectionIconBg }) => (
  <Flex align="center" gap={3} mb={4}>
    <Flex align="center" justify="center" boxSize="30px" borderRadius="10px" bg={sectionIconBg} color={ACCENT} flexShrink={0}>
      <Icon as={icon} boxSize="15px" />
    </Flex>
    <Text fontWeight="bold" fontSize="sm" letterSpacing="wide" textTransform="uppercase" color={ACCENT} whiteSpace="nowrap">
      {children}
    </Text>
    <Box flex="1" h="1px" bgGradient={`linear(to-r, ${sectionIconBg}, transparent)`} />
  </Flex>
);

const Field = ({ label, name, type = "text", isRequired = true, value, onChange, error, inputBg, borderColor, subtitleColor }) => (
  <FormControl isRequired={isRequired} isInvalid={!!error}>
    <FormLabel fontSize="xs" color={subtitleColor} mb={1}>{label}</FormLabel>
    <Input
      type={type}
      name={name}
      value={value}
      onChange={onChange}
      borderRadius="10px"
      bg={inputBg}
      borderColor={borderColor}
      _focus={{ borderColor: ACCENT, boxShadow: `0 0 0 1px ${ACCENT}` }}
    />
    <FormErrorMessage fontSize="xs">{error}</FormErrorMessage>
  </FormControl>
);

// Solo estos 3 roles se pueden asignar al crear un usuario — "Superusuario"
// (u otro rol especial) se deja fuera a propósito por ahora.
const ALLOWED_ROLE_NAMES = ['Admin', 'Optometra', 'Vendedor'];

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

const Register = () => {
  const [selectRoutes, setSelectRoutes] = useState([]);
  const [roles, setRoles] = useState([]);
  const [branchs, setBranchs] = useState([]);
  const [selloFile, setSelloFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '', password: '', firstname: '', lastname: '', username: '',
    age: '', role_id: '', birthdate: '', check_in_date: '', phone_number: '',
    ci: '', branch_id: '',
  });
  const [errors, setErrors] = useState({});

  const toast = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const loadData = async () => {
      try {
        const [rolesResponse, branchsResponse] = await Promise.all([
          supabase.from('role').select('*'),
          supabase.from('branchs').select('*'),
        ]);
        if (rolesResponse.data) {
          setRoles(rolesResponse.data.filter((r) => ALLOWED_ROLE_NAMES.includes(r.role_name)));
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
      case 2: newRoutes = availableRoutes.filter((r) => ['/measures-final', '/history-clinic', '/register-patient', '/history-measure-list'].includes(r.path)); break;
      case 3: newRoutes = availableRoutes.filter((r) => ['/register-patient', '/sales', '/history-clinic', '/balance', '/measures-final', '/patient-records', '/order-laboratory-list', '/history-measure-list', '/balances-patient'].includes(r.path)); break;
      default: newRoutes = [];
    }
    setSelectRoutes(newRoutes.map((r) => r.path));
  }, [formData.role_id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((f) => ({ ...f, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: null }));
  };

  const handleRouteToggle = (path) => {
    setSelectRoutes((prev) => (prev.includes(path) ? prev.filter((p) => p !== path) : [...prev, path]));
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
      if (!formData[field]) newErrors[field] = requiredFields[field];
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
        const { data, error } = await supabase.from('users').select('id').eq(check.field, check.value).single();
        if (data) newErrors[check.field] = check.message;
        if (error && error.code !== 'PGRST116') console.error(`Error checking uniqueness for ${check.field}:`, error);
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCreate = async () => {
    setLoading(true);
    const isValid = await validateForm();
    if (!isValid) {
      toast({ title: 'Formulario incompleto', description: 'Por favor, corrige los errores marcados en rojo.', status: 'error', duration: 5000, isClosable: true });
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
        sello_url: selloUrl,
      };

      const { data, error } = await supabase.functions.invoke('register-employee', {
        body: employeeData,
        headers: { Authorization: `Bearer ${sessionData.session.access_token}` },
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
        const perms = selectRoutes.map((route) => ({ user_id: data.user.id, route, tenant_id: tenantId }));
        const { error: permErr } = await supabase.from('user_permissions').insert(perms);
        if (permErr) {
          console.warn('Error adding permissions:', permErr);
          toast({ title: 'Advertencia', description: 'Usuario creado pero hubo un error al asignar permisos.', status: 'warning' });
        }
      }

      toast({
        title: 'Usuario creado exitosamente',
        description: `El empleado ${formData.firstname} ${formData.lastname} ha sido registrado.`,
        status: 'success',
      });

      setFormData({
        email: '', password: '', firstname: '', lastname: '', username: '', age: '',
        role_id: '', birthdate: '', check_in_date: '', phone_number: '', ci: '', branch_id: '',
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

  const cardBg = useColorModeValue('white', 'gray.700');
  const inputBg = useColorModeValue('gray.50', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const subtitleColor = useColorModeValue('gray.500', 'gray.400');
  const sectionIconBg = useColorModeValue('#E6FBF6', 'rgba(0,168,142,0.15)');


  return (
    <Box minHeight="100vh" bgGradient={useColorModeValue('linear(to-br, gray.50, teal.50)', 'linear(to-br, gray.900, #0d1f1c)')}>
      <SmartHeader moduleSpecificButton={null} />

      <Container maxW="1050px" py={8} px={{ base: 3, md: 6 }}>
        <Box
          borderRadius="24px"
          bg={cardBg}
          border={`1px solid ${borderColor}`}
          boxShadow={useColorModeValue('0 20px 45px -20px rgba(0,168,142,0.25)', '0 20px 45px -20px rgba(0,168,142,0.35)')}
          overflow="hidden"
        >
          <Box h="5px" bgGradient="linear(to-r, #00A88E, #2DD4BF, #00A88E)" />
          <Box p={{ base: 5, md: 8 }}>
            <HStack spacing={3} mb={6}>
              <Flex align="center" justify="center" boxSize="44px" borderRadius="14px" bgGradient="linear(to-br, #00A88E, #00786A)" color="white" boxShadow="0 6px 16px -4px rgba(0,168,142,0.5)">
                <Icon as={UserPlus} boxSize="20px" />
              </Flex>
              <VStack align="start" spacing={0}>
                <Heading size="lg" fontWeight="800" color={useColorModeValue('gray.800', 'white')} letterSpacing="tight">
                  Registrar Usuario
                </Heading>
                <Text fontSize="xs" color={subtitleColor}>Crea una cuenta nueva de empleado, con su sucursal, rol y permisos</Text>
              </VStack>
            </HStack>

            {/* --- Datos personales --- */}
            <Box mb={8}>
              <SectionTitle icon={User} sectionIconBg={sectionIconBg}>Datos personales</SectionTitle>
              <SimpleGrid columns={{ base: 1, sm: 2, md: 3 }} spacing={4}>
                <Field label="Nombre" name="firstname" value={formData.firstname} onChange={handleChange} error={errors.firstname} inputBg={inputBg} borderColor={borderColor} subtitleColor={subtitleColor} />
                <Field label="Apellido" name="lastname" value={formData.lastname} onChange={handleChange} error={errors.lastname} inputBg={inputBg} borderColor={borderColor} subtitleColor={subtitleColor} />
                <Field label="C.I." name="ci" value={formData.ci} onChange={handleChange} error={errors.ci} inputBg={inputBg} borderColor={borderColor} subtitleColor={subtitleColor} />
                <Field label="Fecha de nacimiento" name="birthdate" type="date" value={formData.birthdate} onChange={handleChange} error={errors.birthdate} inputBg={inputBg} borderColor={borderColor} subtitleColor={subtitleColor} />
                <Field label="Edad" name="age" type="number" value={formData.age} onChange={handleChange} error={errors.age} inputBg={inputBg} borderColor={borderColor} subtitleColor={subtitleColor} />
                <Field label="Celular" name="phone_number" value={formData.phone_number} onChange={handleChange} error={errors.phone_number} inputBg={inputBg} borderColor={borderColor} subtitleColor={subtitleColor} />
              </SimpleGrid>
            </Box>

            {/* --- Cuenta --- */}
            <Box mb={8}>
              <SectionTitle icon={ShieldCheck} sectionIconBg={sectionIconBg}>Cuenta de acceso</SectionTitle>
              <SimpleGrid columns={{ base: 1, sm: 2, md: 3 }} spacing={4}>
                <Field label="Nombre de usuario" name="username" value={formData.username} onChange={handleChange} error={errors.username} inputBg={inputBg} borderColor={borderColor} subtitleColor={subtitleColor} />
                <Field label="Correo" name="email" type="email" value={formData.email} onChange={handleChange} error={errors.email} inputBg={inputBg} borderColor={borderColor} subtitleColor={subtitleColor} />
                <Field label="Contraseña" name="password" type="password" value={formData.password} onChange={handleChange} error={errors.password} inputBg={inputBg} borderColor={borderColor} subtitleColor={subtitleColor} />
                <Field label="Fecha de ingreso" name="check_in_date" type="date" isRequired={false} value={formData.check_in_date} onChange={handleChange} error={errors.check_in_date} inputBg={inputBg} borderColor={borderColor} subtitleColor={subtitleColor} />
              </SimpleGrid>
            </Box>

            {/* --- Sucursal y rol --- */}
            <Box mb={8}>
              <SectionTitle icon={MapPin} sectionIconBg={sectionIconBg}>Sucursal y rol</SectionTitle>
              <SimpleGrid columns={{ base: 1, sm: 2 }} spacing={4}>
                <FormControl isRequired isInvalid={!!errors.branch_id}>
                  <FormLabel fontSize="xs" color={subtitleColor} mb={1}>Sucursal</FormLabel>
                  <Select
                    name="branch_id"
                    placeholder="Seleccione sucursal"
                    value={formData.branch_id}
                    onChange={handleChange}
                    borderRadius="10px"
                    bg={inputBg}
                    borderColor={borderColor}
                    _focus={{ borderColor: ACCENT, boxShadow: `0 0 0 1px ${ACCENT}` }}
                  >
                    {branchs.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </Select>
                  <FormErrorMessage fontSize="xs">{errors.branch_id}</FormErrorMessage>
                </FormControl>
                <FormControl isRequired isInvalid={!!errors.role_id}>
                  <FormLabel fontSize="xs" color={subtitleColor} mb={1}>Rol</FormLabel>
                  <Select
                    name="role_id"
                    placeholder="Seleccione rol"
                    value={formData.role_id}
                    onChange={handleChange}
                    borderRadius="10px"
                    bg={inputBg}
                    borderColor={borderColor}
                    _focus={{ borderColor: ACCENT, boxShadow: `0 0 0 1px ${ACCENT}` }}
                  >
                    {roles.map((r) => <option key={r.id} value={r.id}>{r.role_name}</option>)}
                  </Select>
                  <FormErrorMessage fontSize="xs">{errors.role_id}</FormErrorMessage>
                </FormControl>
              </SimpleGrid>
            </Box>

            {/* --- Sello (opcional, para optómetras) --- */}
            <Box mb={8}>
              <SectionTitle icon={Stamp} sectionIconBg={sectionIconBg}>Sello profesional (opcional)</SectionTitle>
              <Input
                type="file"
                accept="image/*"
                onChange={(e) => setSelloFile(e.target.files?.[0] || null)}
                borderRadius="10px"
                bg={inputBg}
                borderColor={borderColor}
                p={1.5}
              />
              {selloFile && (
                <HStack mt={2} spacing={1} fontSize="xs" color={subtitleColor}>
                  <Icon as={CheckCircle2} boxSize="12px" color={ACCENT} />
                  <Text>{selloFile.name}</Text>
                </HStack>
              )}
            </Box>

            {/* --- Permisos --- */}
            {formData.role_id && (
              <Box mb={8}>
                <SectionTitle icon={ShieldCheck} sectionIconBg={sectionIconBg}>Permisos de acceso</SectionTitle>
                <Text fontSize="xs" color={subtitleColor} mb={3}>
                  Se marcaron automáticamente los permisos típicos de este rol — puedes ajustar cuáles verá.
                </Text>
                <Box p={4} borderRadius="14px" bg={inputBg} border={`1px solid ${borderColor}`} maxH="280px" overflowY="auto">
                  <SimpleGrid columns={{ base: 1, sm: 2, md: 3 }} spacing={2}>
                    {availableRoutes.map((route) => (
                      <Checkbox
                        key={route.path}
                        size="sm"
                        isChecked={selectRoutes.includes(route.path)}
                        onChange={() => handleRouteToggle(route.path)}
                        colorScheme="teal"
                      >
                        {route.label}
                      </Checkbox>
                    ))}
                  </SimpleGrid>
                </Box>
                <Badge mt={2} colorScheme="teal" borderRadius="full" px={2}>
                  {selectRoutes.length} pantalla{selectRoutes.length !== 1 ? "s" : ""} seleccionada{selectRoutes.length !== 1 ? "s" : ""}
                </Badge>
              </Box>
            )}

            <Flex justify="flex-end" pt={4} borderTop={`1px solid ${borderColor}`}>
              <Button
                bg={ACCENT}
                color="white"
                _hover={{ bg: '#00967f' }}
                size="lg"
                borderRadius="12px"
                px={10}
                leftIcon={loading ? <Spinner size="sm" /> : <UserPlus size={18} />}
                onClick={handleCreate}
                isLoading={loading}
                loadingText="Creando..."
              >
                Crear Usuario
              </Button>
            </Flex>
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

export default Register;
