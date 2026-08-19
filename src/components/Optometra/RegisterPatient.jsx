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
  VStack,
  Flex,
  FormErrorMessage,
  Icon,
  Container,
  Switch,
  Alert,
  AlertIcon,
  AlertDescription,
  Checkbox,
  Collapse,
} from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';
import { FaEye } from 'react-icons/fa';
import { User, MapPin, Cake, Stethoscope, ShieldCheck } from 'lucide-react';
import { useAuth } from '../AuthContext';
import SmartHeader from '../header/SmartHeader';

const ACCENT = '#00A88E';

const getTodayDate = () => new Date().toISOString().split('T')[0];

// Calcula la edad exacta a partir de la fecha de nacimiento (nunca se
// vuelve a escribir a mano, así que nunca queda desactualizada o mal).
const calculateAge = (birthdate) => {
  if (!birthdate) return '';
  const today = new Date();
  const birth = new Date(`${birthdate}T00:00:00`);
  if (isNaN(birth.getTime())) return '';
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age >= 0 ? age : '';
};

const RegisterPatientForm = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const { user } = useAuth();

  const [formData, setFormData] = useState({
    user_id: '',
    pt_firstname: '',
    pt_lastname: '',
    pt_occupation: '',
    pt_address: '',
    pt_phone: '',
    pt_birthdate: '',
    pt_birthdate_approx: false,
    pt_data_consent: false,
    pt_age: '',
    pt_ci: '',
    pt_city: '',
    pt_email: '',
    pt_consultation_reason: '',
    pt_recommendations: '',
    sexo: '',
    date: getTodayDate(),
    branch_id: '',
  });

  const [branches, setBranches] = useState([]);
  const [errors, setErrors] = useState({});
  const [showDataPolicyText, setShowDataPolicyText] = useState(false);
  const [existingPatientId, setExistingPatientId] = useState(null);
  const [checkingCi, setCheckingCi] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchBranches();
  }, []);

  // El "responsable" ya no se elige a mano de una lista larga (eso permitía
  // registrar a nombre de cualquier otro usuario). Se toma directo de la
  // sesión activa, así siempre queda el registro correcto de quién lo hizo.
  useEffect(() => {
    if (user?.id) {
      setFormData((prev) => ({ ...prev, user_id: user.id }));
    }
  }, [user]);

  // La sucursal tampoco se pregunta a mano — se detecta sola desde la
  // sesión (igual que en Ventas y Egresos). Antes era obligatorio
  // elegirla manualmente y, en el celular con el formulario tan largo,
  // era fácil no verla y quedar bloqueado sin poder guardar.
  useEffect(() => {
    if (user?.branch_id) {
      setFormData((prev) => ({ ...prev, branch_id: prev.branch_id || String(user.branch_id) }));
    }
  }, [user]);

  const fetchBranches = async () => {
    try {
      const { data, error } = await supabase.from('branchs').select('id, name');
      if (error) throw error;
      setBranches(data);
    } catch (error) {
      console.error('Error fetching branches:', error);
    }
  };

  // Al salir del campo C.I., revisa si ya existe un paciente registrado con
  // esa cédula. Si existe, carga todos sus datos (no solo el nombre) y deja
  // claro que se va a ACTUALIZAR a esa persona en vez de crear un duplicado.
  const checkExistingPatient = async () => {
    const ci = formData.pt_ci.trim();
    if (!ci) {
      setExistingPatientId(null);
      return;
    }
    setCheckingCi(true);
    try {
      const { data, error } = await supabase
        .from('patients')
        .select('*')
        .eq('pt_ci', ci)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setExistingPatientId(data.id);
        setFormData((prev) => ({
          ...prev,
          ...data,
          date: getTodayDate(), // la fecha de esta visita sigue siendo hoy
          user_id: user?.id || data.user_id, // quien atiende hoy, no el de la vez pasada
          branch_id: user?.branch_id ? String(user.branch_id) : data.branch_id, // la sucursal de hoy, no la de la vez pasada
        }));
        toast({
          title: "Paciente ya registrado",
          description: `Se cargaron los datos de ${data.pt_firstname} ${data.pt_lastname}. Puedes actualizarlos o guardarlos tal cual.`,
          status: "info",
          variant: "left-accent",
          duration: 5000,
          isClosable: true,
          containerStyle: { borderRadius: "14px", overflow: "hidden" },
        });
      } else {
        setExistingPatientId(null);
      }
    } catch (err) {
      console.error('Error buscando cédula:', err);
    } finally {
      setCheckingCi(false);
    }
  };

  const handleRegisterAsNew = () => {
    setExistingPatientId(null);
    handleReset();
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.pt_firstname.trim()) newErrors.pt_firstname = 'El nombre es obligatorio.';
    if (!formData.pt_lastname.trim()) newErrors.pt_lastname = 'El apellido es obligatorio.';
    if (!formData.pt_phone.trim()) newErrors.pt_phone = 'El teléfono es obligatorio.';
    if (!formData.pt_birthdate) newErrors.pt_birthdate = 'La fecha de nacimiento es obligatoria.';
    if (!formData.date) newErrors.date = 'La fecha es obligatoria.';
    if (!formData.branch_id) newErrors.branch_id = 'Tu usuario no tiene una sucursal asignada — pídele al admin que te la asigne en Configuración de Usuarios.';

    if (formData.pt_email && !/\S+@\S+\.\S+/.test(formData.pt_email)) {
      newErrors.pt_email = 'El formato del correo no es válido.';
    }

    if (!formData.pt_data_consent) {
      newErrors.pt_data_consent = 'Debe aceptar el tratamiento de datos personales para continuar.';
    }

    return newErrors;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const handleBirthdateChange = (e) => {
    const birthdate = e.target.value;
    setFormData((prev) => ({
      ...prev,
      pt_birthdate: birthdate,
      pt_age: calculateAge(birthdate),
    }));
    if (errors.pt_birthdate) {
      setErrors((prev) => ({ ...prev, pt_birthdate: null }));
    }
  };

  // Modo aproximado: si no recuerda el día/mes exacto, solo pide el año
  // (y opcionalmente el mes). Igual se guarda como fecha real en la BD
  // (día 1 por defecto), así la edad se sigue calculando sola con el tiempo
  // y más adelante sirve para una función de mensajes de cumpleaños.
  const currentYear = new Date().getFullYear();
  const [approxYear, setApproxYear] = useState('');
  const [approxMonth, setApproxMonth] = useState('');

  const applyApproxDate = (year, month) => {
    if (!year) {
      setFormData((prev) => ({ ...prev, pt_birthdate: '', pt_age: '' }));
      return;
    }
    const mm = month ? String(month).padStart(2, '0') : '01';
    const birthdate = `${year}-${mm}-01`;
    setFormData((prev) => ({
      ...prev,
      pt_birthdate: birthdate,
      pt_age: calculateAge(birthdate),
    }));
    if (errors.pt_birthdate) {
      setErrors((prev) => ({ ...prev, pt_birthdate: null }));
    }
  };

  const toggleApproxMode = () => {
    const turningOn = !formData.pt_birthdate_approx;
    setFormData((prev) => ({
      ...prev,
      pt_birthdate_approx: turningOn,
      pt_birthdate: '',
      pt_age: '',
    }));
    setApproxYear('');
    setApproxMonth('');
  };

  // Guarda (crea o actualiza) al paciente y devuelve su id real ya
  // confirmado en la base de datos, o null si falló. La usan tanto
  // "Guardar" como "Guardar y Continuar a Medidas", así nunca se puede
  // llegar a Medidas con un paciente que en realidad no se guardó.
  const savePatient = async () => {
    // Bloqueo real: si ya hay un guardado en curso (ej. por internet lento),
    // un segundo clic no dispara una segunda petición. No es solo deshabilitar
    // el botón visualmente — se corta aquí mismo, de forma síncrona.
    if (isSaving) return null;
    setIsSaving(true);

    try {
      const newErrors = validateForm();
      setErrors(newErrors);

      if (Object.keys(newErrors).length > 0) {
        toast({
          title: "Campos incompletos o inválidos",
          description: "Por favor, revisa los campos marcados en rojo.",
          status: "warning",
          variant: "left-accent",
          duration: 3000,
          isClosable: true,
          containerStyle: { borderRadius: "14px", overflow: "hidden" },
        });
        return null;
      }

      const { id, ...rest } = formData; // nunca reenviar un "id" viejo en un insert
      const dataToSave = {
        ...rest,
        pt_data_consent_at: formData.pt_data_consent ? new Date().toISOString() : null,
        last_visit_at: new Date().toISOString(),
      };

      const { data, error } = existingPatientId
        ? await supabase.from('patients').update(dataToSave).eq('id', existingPatientId).select()
        : await supabase.from('patients').insert([dataToSave]).select();

      if (error) {
        if (error.message && error.message.toLowerCase().includes('duplicate') && error.message.toLowerCase().includes('patients_unique_ci_per_tenant')) {
          toast({
            title: "Cédula repetida",
            description: "Ya existe un paciente registrado con esta cédula.",
            status: "warning",
            variant: "left-accent",
            duration: 4000,
            isClosable: true,
            containerStyle: { borderRadius: "14px", overflow: "hidden" },
          });
        } else {
          toast({
            title: "Error",
            description: "No se pudo guardar el paciente.",
            status: "error",
            variant: "left-accent",
            duration: 3000,
            isClosable: true,
            containerStyle: { borderRadius: "14px", overflow: "hidden" },
          });
        }
        console.error("Error:", error);
        return null;
      }

      const savedId = existingPatientId || data?.[0]?.id || null;

      toast({
        title: existingPatientId ? "¡Actualizado!" : "¡Registrado!",
        description: existingPatientId
          ? "Los datos del paciente se actualizaron correctamente."
          : "El paciente se guardó correctamente.",
        status: "success",
        variant: "left-accent",
        duration: 3000,
        isClosable: true,
        containerStyle: { borderRadius: "14px", overflow: "hidden" },
      });

      return savedId;
    } catch (err) {
      console.error('Error desconocido:', err);
      toast({
        title: "Error inesperado",
        description: "Intenta nuevamente.",
        status: "error",
        variant: "left-accent",
        duration: 4000,
        containerStyle: { borderRadius: "14px", overflow: "hidden" },
      });
      return null;
    } finally {
      setIsSaving(false);
    }
  };

  // Guarda y, si salió bien, navega directo a Medidas con el paciente real
  // ya vinculado (sin depender de localStorage ni de que coincida por nombre).
  const handleSaveAndGoToMeasures = async () => {
    const savedId = await savePatient();
    if (savedId) {
      navigate(`/measures-final/${savedId}`);
    }
  };

  const handleReset = () => {
    setFormData({
      user_id: user?.id || '',
      pt_firstname: '',
      pt_lastname: '',
      pt_occupation: '',
      pt_address: '',
      pt_phone: '',
      pt_birthdate: '',
      pt_birthdate_approx: false,
      pt_data_consent: false,
      pt_age: '',
      pt_ci: '',
      pt_city: '',
      pt_email: '',
      pt_consultation_reason: '',
      pt_recommendations: '',
      sexo: '',
      date: getTodayDate(),
      branch_id: '',
    });
    setErrors({});
    setApproxYear('');
    setApproxMonth('');
  };

  const handleNavigate = (route = null) => {
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
      case 4:
        navigate('/admin');
        break;
      case 2:
        navigate('/optometra');
        break;
      case 3:
        navigate('/vendedor');
        break;
      default:
        navigate('/');
    }
  };

  const moduleSpecificButton = (
    <Button
      onClick={() => handleNavigate('/list-patients')}
      bg={useColorModeValue('rgba(255, 255, 255, 0.8)', 'rgba(255, 255, 255, 0.1)')}
      backdropFilter="blur(10px)"
      border="1px solid"
      borderColor={useColorModeValue('rgba(0,168,142,0.3)', 'rgba(0,168,142,0.5)')}
      color={ACCENT}
      size="sm"
      borderRadius="15px"
      px={4}
      _hover={{
        bg: useColorModeValue('rgba(0,168,142,0.1)', 'rgba(0,168,142,0.2)'),
        borderColor: ACCENT,
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
  const cardBg = useColorModeValue('white', 'gray.700');
  const inputBg = useColorModeValue('gray.50', 'gray.700');
  const focusBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const subtitleColor = useColorModeValue('gray.500', 'gray.400');
  const sectionIconBg = useColorModeValue('#E6FBF6', 'rgba(0,168,142,0.15)');

  const SectionTitle = ({ icon, children }) => (
    <Flex align="center" gap={3} mb={5}>
      <Flex align="center" justify="center" boxSize="30px" borderRadius="10px" bg={sectionIconBg} color={ACCENT} flexShrink={0}>
        <Icon as={icon} boxSize="15px" />
      </Flex>
      <Text fontWeight="bold" fontSize="sm" letterSpacing="wide" textTransform="uppercase" color={ACCENT} whiteSpace="nowrap">
        {children}
      </Text>
      <Box flex="1" h="1px" bgGradient={`linear(to-r, ${sectionIconBg}, transparent)`} />
    </Flex>
  );

  return (
    <Box
      minHeight="100vh"
      bgGradient={useColorModeValue(
        'linear(to-br, gray.50, teal.50)',
        'linear(to-br, gray.900, #0d1f1c)'
      )}
    >
      <SmartHeader moduleSpecificButton={moduleSpecificButton} />

      <Container maxW="1050px" py={8} px={{ base: 3, md: 6 }}>
        <Box
          as="form"
          onSubmit={(e) => { e.preventDefault(); handleSaveAndGoToMeasures(); }}
          width="100%"
          borderRadius="24px"
          bg={cardBg}
          border={`1px solid ${borderColor}`}
          boxShadow={useColorModeValue(
            '0 20px 45px -20px rgba(0,168,142,0.25)',
            '0 20px 45px -20px rgba(0,168,142,0.35)'
          )}
          overflow="hidden"
        >
          <Box h="5px" bgGradient="linear(to-r, #00A88E, #2DD4BF, #00A88E)" />
          <Box p={{ base: 5, md: 10 }}>
          <HStack justify="space-between" mb={1} flexWrap="wrap" gap={3}>
            <HStack spacing={3}>
              <Flex
                align="center"
                justify="center"
                boxSize="44px"
                borderRadius="14px"
                bgGradient="linear(to-br, #00A88E, #00786A)"
                color="white"
                boxShadow="0 6px 16px -4px rgba(0,168,142,0.5)"
              >
                <Icon as={User} boxSize="20px" />
              </Flex>
              <Heading size="lg" fontWeight="800" color={useColorModeValue('gray.800', 'white')} letterSpacing="tight">
                Registro de Paciente
              </Heading>
            </HStack>
            {user && (
              <HStack spacing={1.5} color={subtitleColor} fontSize="xs">
                <Icon as={User} boxSize="12px" />
                <Text textTransform="none">
                  Registrado por {user.firstname} {user.lastname}
                </Text>
              </HStack>
            )}
          </HStack>
          <Text fontSize="sm" color={subtitleColor} mb={5} ml={{ base: 0, md: '56px' }}>
            Los campos marcados con * son obligatorios.
          </Text>

          {existingPatientId && (
            <Alert status="info" borderRadius="12px" mb={4} fontSize="sm">
              <AlertIcon />
              <AlertDescription flex="1">
                Esta cédula ya está registrada — se cargaron sus datos. Al guardar, se van a <b>actualizar</b>, no se crea un paciente nuevo.
              </AlertDescription>
              <Button size="xs" variant="ghost" onClick={handleRegisterAsNew} ml={2}>
                No es la misma persona
              </Button>
            </Alert>
          )}

          <VStack spacing={8} align="stretch">
            {/* --- Datos personales --- */}
            <Box>
              <SectionTitle icon={User}>Datos personales</SectionTitle>
              <SimpleGrid columns={{ base: 1, sm: 2, lg: 3 }} spacing={5}>
                {renderInputField('Nombre', 'pt_firstname', 'text', true, errors.pt_firstname)}
                {renderInputField('Apellido', 'pt_lastname', 'text', true, errors.pt_lastname)}
                <FormControl id="pt_ci" isInvalid={!!errors.pt_ci}>
                  <FormLabel fontWeight="semibold" fontSize="sm">C.I.</FormLabel>
                  <Input
                    type="text"
                    name="pt_ci"
                    value={formData.pt_ci}
                    onChange={handleChange}
                    onBlur={checkExistingPatient}
                    borderRadius="12px"
                    size="lg"
                    bg={inputBg}
                    borderColor={borderColor}
                    _focus={{ borderColor: ACCENT, boxShadow: `0 0 0 1px ${ACCENT}`, bg: focusBg }}
                  />
                  <FormErrorMessage>{errors.pt_ci}</FormErrorMessage>
                </FormControl>

                <FormControl isRequired isInvalid={!!errors.sexo}>
                  <FormLabel fontWeight="semibold" fontSize="sm">Sexo</FormLabel>
                  <Select
                    name="sexo"
                    onChange={handleChange}
                    value={formData.sexo}
                    placeholder="Seleccione"
                    borderRadius="12px"
                    size="lg"
                    bg={inputBg}
                    borderColor={borderColor}
                    _focus={{ borderColor: ACCENT, boxShadow: `0 0 0 1px ${ACCENT}`, bg: focusBg }}
                  >
                    <option value="Femenino">Femenino</option>
                    <option value="Masculino">Masculino</option>
                  </Select>
                  <FormErrorMessage>{errors.sexo}</FormErrorMessage>
                </FormControl>

                {/* Fecha de nacimiento -> edad calculada automáticamente.
                    Si no recuerda el día exacto, el interruptor cambia a un
                    modo simplificado (solo año, o año + mes). */}
                <Box>
                  <FormControl isRequired isInvalid={!!errors.pt_birthdate}>
                    <FormLabel fontWeight="semibold" fontSize="sm" mb={2}>
                      <HStack spacing={1}>
                        <Icon as={Cake} boxSize="13px" color={ACCENT} />
                        <Text>Fecha de nacimiento</Text>
                      </HStack>
                    </FormLabel>

                    {!formData.pt_birthdate_approx ? (
                      <Input
                        type="date"
                        name="pt_birthdate"
                        value={formData.pt_birthdate}
                        onChange={handleBirthdateChange}
                        max={getTodayDate()}
                        borderRadius="12px"
                        size="lg"
                        bg={inputBg}
                        borderColor={borderColor}
                        _focus={{ borderColor: ACCENT, boxShadow: `0 0 0 1px ${ACCENT}`, bg: focusBg }}
                      />
                    ) : (
                      <SimpleGrid columns={2} spacing={3}>
                        <Select
                          placeholder="Año (obligatorio)"
                          value={approxYear}
                          borderRadius="12px"
                          size="lg"
                          bg={inputBg}
                          borderColor={borderColor}
                          _focus={{ borderColor: ACCENT, boxShadow: `0 0 0 1px ${ACCENT}`, bg: focusBg }}
                          onChange={(e) => {
                            setApproxYear(e.target.value);
                            applyApproxDate(e.target.value, approxMonth);
                          }}
                        >
                          {Array.from({ length: 100 }, (_, i) => currentYear - i).map((y) => (
                            <option key={y} value={y}>{y}</option>
                          ))}
                        </Select>
                        <Select
                          placeholder="Mes (opcional)"
                          value={approxMonth}
                          borderRadius="12px"
                          size="lg"
                          bg={inputBg}
                          borderColor={borderColor}
                          _focus={{ borderColor: ACCENT, boxShadow: `0 0 0 1px ${ACCENT}`, bg: focusBg }}
                          onChange={(e) => {
                            setApproxMonth(e.target.value);
                            applyApproxDate(approxYear, e.target.value);
                          }}
                        >
                          {["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"].map((m, i) => (
                            <option key={m} value={i + 1}>{m}</option>
                          ))}
                        </Select>
                      </SimpleGrid>
                    )}
                    <FormErrorMessage>{errors.pt_birthdate}</FormErrorMessage>
                  </FormControl>

                  {/* Fuera del FormControl "obligatorio" a propósito: Chakra
                      propaga isRequired a TODOS los campos de adentro, y el
                      switch terminaba siendo exigido por el navegador. */}
                  <HStack spacing={2} mt={2}>
                    <Switch
                      size="sm"
                      colorScheme="teal"
                      isChecked={formData.pt_birthdate_approx}
                      onChange={toggleApproxMode}
                    />
                    <Text fontSize="xs" color={subtitleColor}>Fecha aproximada</Text>
                  </HStack>
                  {formData.pt_birthdate_approx && (
                    <Text fontSize="xs" color={subtitleColor} mt={1}>
                      La edad se sigue actualizando sola.
                    </Text>
                  )}
                </Box>

                <FormControl>
                  <FormLabel fontWeight="semibold" fontSize="sm">Edad</FormLabel>
                  <Input
                    value={formData.pt_age !== '' ? `${formData.pt_age} años` : ''}
                    placeholder="Se calcula sola"
                    isReadOnly
                    borderRadius="12px"
                    size="lg"
                    bg={useColorModeValue('gray.100', 'gray.700')}
                    borderColor={borderColor}
                    color={ACCENT}
                    fontWeight="bold"
                  />
                </FormControl>
              </SimpleGrid>
            </Box>

            {/* --- Contacto --- */}
            <Box>
              <SectionTitle icon={MapPin}>Contacto y ubicación</SectionTitle>
              <SimpleGrid columns={{ base: 1, sm: 2, lg: 3 }} spacing={5}>
                <FormControl isRequired isInvalid={!!errors.pt_phone}>
                  <FormLabel fontWeight="semibold" fontSize="sm">Teléfono</FormLabel>
                  <PhoneInput
                    country={'ec'}
                    value={formData.pt_phone}
                    onChange={(value) => {
                      setFormData((prev) => ({ ...prev, pt_phone: value }));
                      if (errors.pt_phone) setErrors((prev) => ({ ...prev, pt_phone: null }));
                    }}
                    containerStyle={{ width: '100%' }}
                    inputProps={{ required: true, name: 'phone' }}
                    inputStyle={{
                      width: '100%',
                      height: '48px',
                      borderRadius: '12px',
                      border: `1px solid ${errors.pt_phone ? '#E53E3E' : (colorMode === 'dark' ? '#4A5568' : '#E2E8F0')}`,
                      backgroundColor: colorMode === 'dark' ? '#2D3748' : '#F9FAFB',
                      color: colorMode === 'dark' ? 'white' : '#1A202C',
                      fontSize: '15px',
                      paddingLeft: '48px'
                    }}
                    buttonStyle={{
                      backgroundColor: colorMode === 'dark' ? '#2D3748' : '#F9FAFB',
                      border: `1px solid ${errors.pt_phone ? '#E53E3E' : (colorMode === 'dark' ? '#4A5568' : '#E2E8F0')}`,
                      borderRadius: '12px 0 0 12px'
                    }}
                    dropdownStyle={{ zIndex: 9999 }}
                  />
                  <FormErrorMessage>{errors.pt_phone}</FormErrorMessage>
                </FormControl>

                {renderInputField('Correo', 'pt_email', 'email', false, errors.pt_email)}
                {renderInputField('Dirección', 'pt_address', 'text', false, errors.pt_address)}
                {renderInputField('Ciudad', 'pt_city', 'text', false, errors.pt_city)}
                {renderInputField('Ocupación', 'pt_occupation', 'text', false, errors.pt_occupation)}
                {renderInputField('Fecha de registro', 'date', 'date', true, errors.date)}
              </SimpleGrid>
              <Text fontSize="xs" color={errors.branch_id ? "red.400" : subtitleColor} mt={3}>
                Sucursal: <b>{branches.find((b) => String(b.id) === String(formData.branch_id))?.name || (formData.branch_id ? "" : "Sin sucursal asignada a tu usuario")}</b>
                {errors.branch_id && <> — {errors.branch_id}</>}
              </Text>
            </Box>

            {/* --- Consulta --- */}
            <Box>
              <SectionTitle icon={Stethoscope}>Motivo de consulta</SectionTitle>
              <VStack spacing={4} align="stretch">
                {renderTextareaField('Razón de Consulta', 'pt_consultation_reason', errors.pt_consultation_reason)}
                {renderTextareaField('Recomendaciones', 'pt_recommendations', errors.pt_recommendations)}
              </VStack>
            </Box>

            {/* --- Protección de Datos --- */}
            <Box p={4} borderRadius="14px" bg={inputBg} border={`1px solid ${errors.pt_data_consent ? 'red' : borderColor}`}>
              <SectionTitle icon={ShieldCheck}>Protección de datos</SectionTitle>
              <Text fontSize="sm" color={subtitleColor} mb={3}>
                Antes de continuar, el paciente debe aceptar el tratamiento de sus datos personales.
              </Text>
              <Box mb={3}>
                <Button
                  size="xs"
                  variant="link"
                  colorScheme="teal"
                  onClick={() => setShowDataPolicyText((v) => !v)}
                >
                  {showDataPolicyText ? 'Ocultar detalle' : 'Leer el texto completo'}
                </Button>
              </Box>
              <Collapse in={showDataPolicyText} animateOpacity>
                <Box
                  fontSize="xs"
                  color={subtitleColor}
                  bg={cardBg}
                  border={`1px solid ${borderColor}`}
                  borderRadius="10px"
                  p={3}
                  mb={3}
                  maxH="160px"
                  overflowY="auto"
                >
                  De conformidad con la Ley Orgánica de Protección de Datos Personales (LOPDP) del Ecuador,
                  informamos que los datos personales y de salud visual recolectados en este formulario
                  serán tratados con la finalidad de brindar atención óptica y de salud visual, gestionar
                  su historial clínico, y contactarlo para fines relacionados con su atención (citas,
                  recordatorios, entrega de resultados). Sus datos no serán compartidos con terceros salvo
                  requerimiento legal. Usted puede ejercer sus derechos de acceso, rectificación,
                  actualización, eliminación y oposición sobre sus datos personales en cualquier momento,
                  dirigiéndose a esta óptica.
                </Box>
              </Collapse>
              <Checkbox
                mt={1}
                isChecked={formData.pt_data_consent}
                onChange={(e) => {
                  setFormData((prev) => ({ ...prev, pt_data_consent: e.target.checked }));
                  if (errors.pt_data_consent) setErrors((prev) => ({ ...prev, pt_data_consent: null }));
                }}
                colorScheme="teal"
              >
                He leído y acepto el tratamiento de mis datos personales conforme a la LOPDP. *
              </Checkbox>
              {errors.pt_data_consent && (
                <Text fontSize="xs" color="red.400" mt={1}>{errors.pt_data_consent}</Text>
              )}
            </Box>

            <Flex justify="flex-end" gap={3} flexWrap="wrap" pt={6} mt={2} borderTop={`1px solid ${borderColor}`}>
              <Button
                type="submit"
                bg={ACCENT}
                color="white"
                _hover={{ bg: '#00967f' }}
                size="lg"
                borderRadius="12px"
                px={8}
                isLoading={isSaving}
                loadingText="Guardando..."
                isDisabled={isSaving}
              >
                {existingPatientId ? 'Actualizar y Continuar a Medidas' : 'Guardar y Continuar a Medidas'}
              </Button>
            </Flex>
          </VStack>
          </Box>
        </Box>
      </Container>
    </Box>
  );

  function renderInputField(label, name, type, isRequired = false, error = null) {
    return (
      <FormControl id={name} isRequired={isRequired} isInvalid={!!error}>
        <FormLabel fontWeight="semibold" fontSize="sm">{label}</FormLabel>
        <Input
          type={type}
          name={name}
          value={formData[name]}
          onChange={handleChange}
          borderRadius="12px"
          size="lg"
          bg={inputBg}
          borderColor={borderColor}
          min={type === 'number' ? 0 : undefined}
          _focus={{ borderColor: ACCENT, boxShadow: `0 0 0 1px ${ACCENT}`, bg: focusBg }}
        />
        <FormErrorMessage>{error}</FormErrorMessage>
      </FormControl>
    );
  }

  function renderTextareaField(label, name, error = null) {
    return (
      <FormControl id={name} isInvalid={!!error}>
        <FormLabel fontWeight="semibold" fontSize="sm">{label}</FormLabel>
        <Textarea
          name={name}
          value={formData[name]}
          onChange={handleChange}
          borderRadius="12px"
          size="lg"
          bg={inputBg}
          borderColor={borderColor}
          _focus={{ borderColor: ACCENT, boxShadow: `0 0 0 1px ${ACCENT}`, bg: focusBg }}
          minH="64px"
        />
        <FormErrorMessage>{error}</FormErrorMessage>
      </FormControl>
    );
  }

  function renderSelectField(label, name, options, optionLabelKey = 'username', isRequired = false, error = null) {
    return (
      <FormControl id={name} isRequired={isRequired} isInvalid={!!error}>
        <FormLabel fontWeight="semibold" fontSize="sm">{label}</FormLabel>
        <Select
          name={name}
          value={formData[name]}
          onChange={handleChange}
          borderRadius="12px"
          size="lg"
          bg={inputBg}
          borderColor={borderColor}
          _focus={{ borderColor: ACCENT, boxShadow: `0 0 0 1px ${ACCENT}`, bg: focusBg }}
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
