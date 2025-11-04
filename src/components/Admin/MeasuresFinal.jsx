import { useState, useEffect } from "react";
import { supabase } from "../../api/supabase";
import {
  Box, Button, FormControl, Input, SimpleGrid, Heading,
  Table, Thead, Tbody, Tr, Th, Td, Textarea, RadioGroup,
  Radio, Stack, Checkbox, Text, FormLabel, useColorModeValue,
  HStack, useToast, Divider, Alert, AlertIcon, Icon, Badge
} from "@chakra-ui/react";
import { useNavigate, useParams } from "react-router-dom";
import { FaEye } from 'react-icons/fa';
import SmartHeader from "../header/SmartHeader";

// NUEVO: Definimos una clave única para sessionStorage
const STORAGE_KEY = 'measuresFinalFormData';

// NUEVO: Estado inicial por defecto (formulario vacío)
const defaultInitialState = {
  patient_id: "",
  sphere_right: "",
  cylinder_right: "",
  axis_right: "",
  prism_right: "",
  add_right: "",
  av_vl_right: "",
  av_vp_right: "",
  dnp_right: "",
  alt_right: "",
  sphere_left: "",
  cylinder_left: "",
  axis_left: "",
  prism_left: "",
  add_left: "",
  av_vl_left: "",
  av_vp_left: "",
  dnp_left: "",
  alt_left: "",
  diagnosis: "",
  near_vision: "",
  needs_lenses_near: false,
  far_vision: "",
  needs_lenses_far: false,
  color_perception: false,
  color_issues: "",
  created_at: ""
};

// NUEVO: Función para obtener el estado inicial
// Intenta cargar desde sessionStorage, si falla o no existe, usa el estado por defecto.
const getInitialFormData = () => {
  const savedData = sessionStorage.getItem(STORAGE_KEY);
  if (savedData) {
    try {
      // Si hay datos guardados, los parseamos y los retornamos
      return JSON.parse(savedData);
    } catch (e) {
      console.error("Error al parsear datos de sessionStorage", e);
      // Si hay un error (ej. JSON corrupto), limpiamos y usamos el estado por defecto
      sessionStorage.removeItem(STORAGE_KEY);
      return defaultInitialState;
    }
  }
  // Si no hay nada guardado, usamos el estado por defecto
  return defaultInitialState;
};

const MeasuresFinal = () => {
  const navigate = useNavigate();
  const toast = useToast();

  // MODIFICADO: Usamos la función getInitialFormData para inicializar el estado
  const [formData, setFormData] = useState(getInitialFormData);

  const [patients, setPatients] = useState([]);
  const [filteredPatients, setFilteredPatients] = useState([]);
  const [searchTermPatients, setSearchTermPatients] = useState("");

  // MODIFICADO: Inicializamos este estado basado en los datos cargados
  const [showColorIssuesInput, setShowColorIssuesInput] = useState(
    () => !!getInitialFormData().color_issues // true si color_issues tiene texto
  );

  const [error, setError] = useState(null);
  const { id } = useParams();

  // Definimos campos de medida (label para UI, key para formData)
  const measureFields = [
    { label: "Esfera", key: "sphere" },
    { label: "Cilindro", key: "cylinder" },
    { label: "Eje", key: "axis" },
    { label: "Prisma", key: "prism" },
    { label: "ADD", key: "add" },
    { label: "AV VL", key: "av_vl" },
    { label: "AV VP", key: "av_vp" },
    { label: "DNP", key: "dnp" },
    { label: "ALT", key: "alt" },
  ];

  // NUEVO: useEffect para guardar en sessionStorage CADA VEZ que formData cambie
  useEffect(() => {
    // No guardamos si el formulario está en su estado inicial (ej. después de guardar)
    // Opcional: puedes quitar esta condición si quieres guardar incluso el estado vacío.
    if (JSON.stringify(formData) !== JSON.stringify(defaultInitialState)) {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(formData));
    }
  }, [formData]); // La dependencia es formData

  useEffect(() => {
    if (id && patients.length > 0) {
      // Verificamos si ya hay un patient_id cargado del storage
      // para no sobrescribirlo si el usuario ya había seleccionado uno
      const currentPatientId = formData.patient_id;
      if (!currentPatientId) {
        const found = patients.find(p => String(p.id) === String(id));
        if (found) {
          setFormData(f => ({ ...f, patient_id: found.id }));
          setSearchTermPatients(`${found.pt_firstname} ${found.pt_lastname}`);
          setFilteredPatients([]);
        }
      }
    }
  }, [id, patients, formData.patient_id]); // Agregamos formData.patient_id a las dependencias

  useEffect(() => {
    fetchData('patients', data => {
      setPatients(data);
      setFilteredPatients(data);

      // Comprobamos si el formulario ya tiene un patient_id (cargado de sessionStorage)
      const currentPatientId = getInitialFormData().patient_id;
      if (currentPatientId) {
        const found = data.find(p => String(p.id) === String(currentPatientId));
        if (found) {
          setSearchTermPatients(`${found.pt_firstname} ${found.pt_lastname}`);
          setFilteredPatients([]);
        }
        return; // Salimos para no procesar lógicas de 'selectedPatient'
      }

      // Tu lógica existente de localStorage (si vienes de otra página)
      const stored = localStorage.getItem('selectedPatient');
      if (stored) {
        const selected = JSON.parse(stored);
        const found = data.find(
          p =>
            (selected.pt_ci && p.pt_ci === selected.pt_ci) ||
            (p.pt_firstname === selected.pt_firstname && p.pt_lastname === selected.pt_lastname)
        );
        if (found) {
          setFormData(f => ({ ...f, patient_id: found.id }));
          setSearchTermPatients(`${found.pt_firstname} ${found.pt_lastname}`);
          setFilteredPatients([]);
        }
        localStorage.removeItem('selectedPatient');
      }
    });
  }, []); // Este efecto corre solo una vez al montar

  const fetchData = async (table, setter) => {
    try {
      const { data, error } = await supabase.from(table).select("*");
      if (error) throw error;
      setter(data);
    } catch (err) {
      console.error(`Error fetching ${table}:`, err);
      setError(`Error al obtener los datos de ${table}`);
      toast({
        title: "Error",
        description: `No se pudieron obtener los datos de ${table}.`,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // --- (El resto de tus manejadores handleSearchPatients, handlePatientSelect, etc. quedan igual) ---

  const handleSearchPatients = (e) => {
    const searchTerm = e.target.value.toLowerCase();
    setSearchTermPatients(searchTerm);

    setFilteredPatients(
      patients.filter((patient) => {
        const fullname = `${patient.pt_firstname} ${patient.pt_lastname}`.toLowerCase();
        return (
          fullname.includes(searchTerm) ||
          patient.pt_ci?.toLowerCase().includes(searchTerm)
        );
      })
    );
  };

  const handlePatientSelect = (patient) => {
    setFormData({ ...formData, patient_id: patient.id });
    setSearchTermPatients(`${patient.pt_firstname} ${patient.pt_lastname}`);
    setFilteredPatients([]);
  };


  const handleSubmit = async () => {
    if (!formData.patient_id) {
      toast({
        title: "Campos obligatorios",
        description: "Por favor completa los campos obligatorios.",
        status: "warning",
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    const newFormData = {
      ...formData,
      created_at: new Date().toISOString(),
    };

    try {
      const { data, error } = await supabase.from("rx_final").insert([newFormData]);
      if (error) throw error;
      console.log("Medidas registradas:", data);
      toast({
        title: "Éxito",
        description: "Medidas registradas exitosamente.",
        status: "success",
        duration: 5000,
        isClosable: true,
      });

      // NUEVO: Limpiamos el sessionStorage después de guardar exitosamente
      sessionStorage.removeItem(STORAGE_KEY);

      // MODIFICADO: Reseteamos el formulario al estado inicial por defecto
      setFormData(defaultInitialState);

      // Reseteamos también el buscador de pacientes y el input de color
      setSearchTermPatients("");
      setShowColorIssuesInput(false);

    } catch (error) {
      console.error("Error al registrar medidas:", error.message);
      toast({
        title: "Error",
        description: "Hubo un error al registrar las medidas.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  };

  // --- (Tu función handleNavigate queda igual) ---

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

  const moduleSpecificButton = null;


  return (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      minHeight="100dvh"
      bg={useColorModeValue("gray.50", "gray.900")}
      p={[2, 4, 8]}
    >
      
      {error && (
        <Alert status="error" mb={4} borderRadius="md">
          <AlertIcon />
          {error}
        </Alert>
      )}
      <SmartHeader moduleSpecificButton={moduleSpecificButton} />
      <Box w="80%" pt={5} mb={4}>
        <Heading
          mb={2}
          textAlign="center"
          size="lg"
          fontWeight="800"
          color={useColorModeValue('teal.700', 'teal.300')}
          pb={2}
          letterSpacing="tight"
        >
          Registrar Medidas Finales
        </Heading>
        <Divider mb={2} />
      </Box>
      <Box
        as="form"
        onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}
        width="100%"
        maxWidth="1200px"
        boxShadow="2xl"
        borderRadius="xl"
        bg={useColorModeValue("white", "gray.800")}
        p={[4, 8]}
        mb={8}
      >
        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6} mb={6}>
          <FormControl id="patient-search">
            <FormLabel fontWeight="bold" color="teal.600" mb={1}>Buscar Paciente</FormLabel>
            <Input
              type="text"
              placeholder="Buscar por nombre o CI..."
              value={searchTermPatients}
              onChange={handleSearchPatients}
              size="lg"
              borderColor="teal.300"
              focusBorderColor="teal.500"
              bg={useColorModeValue("gray.100", "gray.700")}
            />
            {searchTermPatients && (
              <Box
                border="1px solid #e2e8f0"
                borderRadius="md"
                mt={2}
                maxHeight="180px"
                overflowY="auto"
                bg={useColorModeValue("white", "gray.700")}
                M boxShadow="md"
              >
                {filteredPatients.map((patient) => (
                  <Box
                    key={patient.id}
                    p={2}
                    _hover={{ bg: "teal.50", cursor: "pointer" }}
                    onClick={() => handlePatientSelect(patient)}
                    borderBottom="1px solid #f1f1f1"
                  >
                    <HStack>
                      <Icon as={FaEye} color="teal.400" />
                      <Text fontWeight="500">{patient.pt_firstname} {patient.pt_lastname}</Text>
                      <Badge colorScheme="teal" ml={2}>{patient.pt_ci}</Badge>
                    </HStack>
                  </Box>
                ))}
              </Box>
            )}
          </FormControl>
        </SimpleGrid>

        <Box display={{ base: "none", lg: "block" }} overflowX="auto" mb={6}>
          <Table variant="striped" colorScheme="teal" size="md" borderRadius="xl">
            <Thead bg={useColorModeValue("teal.100", "teal.900")}>
              <Tr>
                <Th>Rx Final</Th>
                <Th>Esfera</Th>
                <Th>Cilindro</Th>
                nbsp;             <Th>Eje</Th>
                <Th>Prisma</Th>
                <Th>ADD</Th>
                <Th>AV VL</Th>
                <Th>AV VP</Th>
                <Th>DNP</Th>
                <Th>ALT</Th>
              </Tr>
            </Thead>
            <Tbody>
              {['OD', 'OI'].map((eye) => (
                <Tr key={eye}>
                  <Td fontWeight="bold" color="teal.600"> {eye}</Td>
                  {measureFields.map(({ key }) => (
                    <Td key={key}>
                      <Input
                        name={`${key}_${eye === 'OD' ? 'right' : 'left'}`}
                        value={formData[`${key}_${eye === 'OD' ? 'right' : 'left'}`] || ""}
                        onChange={handleChange}
                        size="sm"
                        borderColor="teal.200"
                        bg={useColorModeValue("gray.50", "gray.700")}
                        _focus={{ borderColor: "teal.400" }}
                      />
                    </Td>
                  ))}
                </Tr>
              ))}
            </Tbody>
          </Table>
        </Box>

        <Box display={{ base: "block", lg: "none" }} mb={6}>
          {['OD', 'OI'].map((eye) => (
            <Box key={eye} mb={6} p={4} borderWidth="1px" borderRadius="lg" bg={useColorModeValue("gray.50", "gray.700")}>
              <Heading size="sm" mb={3} color="teal.600">{eye === 'OD' ? 'Ojo Derecho (OD)' : 'Ojo Izquierdo (OI)'}</Heading>
              <SimpleGrid columns={2} spacing={4}>
                {measureFields.map(({ label, key }) => (
                  <FormControl key={key}>
                    <FormLabel fontSize="sm" color="teal.500">{label}</FormLabel>
                    <Input
                      name={`${key}_${eye === 'OD' ? 'right' : 'left'}`}
                      value={formData[`${key}_${eye === 'OD' ? 'right' : 'left'}`] || ""}
                      onChange={handleChange}
                      size="sm"
                      borderColor="teal.200"
                      bg={useColorModeValue("white", "gray.800")}
                      _focus={{ borderColor: "teal.400" }}
                      t />
                  </FormControl>
                ))}
              </SimpleGrid>
            </Box>
          ))}
        </Box>

        <Box
          p={[4, 6]}
          maxWidth="800px"
          s mx="auto"
          border="1px solid"
          borderColor={useColorModeValue("teal.100", "teal.700")}
          borderRadius="xl"
          bg={useColorModeValue("gray.50", "gray.800")}
          boxShadow="md"
        >
          <Heading size="md" mb={4} color="teal.700">Diagnóstico</Heading>
          <Textarea
            placeholder="Escriba el diagnóstico del paciente"
            value={formData.diagnosis}
            onChange={(e) => setFormData({ ...formData, diagnosis: e.target.value })}
            mb={4}
            size="lg"
            borderColor="teal.200"
            bg={useColorModeValue("white", "gray.700")}
            _focus={{ borderColor: "teal.400" }}
          />

          <Divider mb={4} />

          <Box mb={6}>
            <Heading size="sm" mb={2} color="teal.600">Visión cercana</Heading>
            <Text mb={2} fontSize={["sm", "md"]} color="gray.600">
              Capacidad de leer como mínimo, las letras de la escala 1 de la carta normalizada Jaeger...
            </Text>
            <RadioGroup
              value={formData.near_vision}
              onChange={(val) => setFormData({ ...formData, near_vision: val })}
              mb={2}
            >
              <Stack direction={{ base: "column", sm: "row" }} spacing={[2, 4]}>
                <Radio value="Aprobado" colorScheme="teal">Aprobado</Radio>
                <Radio value="No Aprobado" colorScheme="red">No Aprobado</Radio>
              </Stack>
            </RadioGroup>
            <Checkbox
              isChecked={formData.needs_lenses_near}
              onChange={(e) => setFormData({ ...formData, needs_lenses_near: e.target.checked })}
              colorScheme="teal"
              mt={2}
            >
              Precisa lentes
            </Checkbox>
          </Box>

          <Divider mb={4} />

          <Box mb={6}>
            <Heading size="sm" mb={2} color="teal.600">Visión lejana</Heading>
            <RadioGroup
              value={formData.far_vision}
              onChange={(val) => setFormData({ ...formData, far_vision: val })}
              mb={2}
            >
              <Stack direction={{ base: "column", sm: "row" }} spacing={[2, 4]}>
                <Radio value="20/20" colorScheme="teal">Mayor o igual a 20/20 en la escala SNELLEN</Radio>
                <Radio value="Menor a 20/20" colorScheme="red">Menor a 20/20</Radio>
              </Stack>
            </RadioGroup>
            <Checkbox
              isChecked={formData.needs_lenses_far}
              onChange={(e) => setFormData({ ...formData, needs_lenses_far: e.target.checked })}
              colorScheme="teal"
              mt={2}
            >
              Precisa lentes
            </Checkbox>
          </Box>

          <Divider mb={4} />

          <Box mb={6}>
            <Heading size="sm" mb={2} color="teal.600">Percepción de colores</Heading>
            <Checkbox
              isChecked={formData.color_perception}
              onChange={(e) => setFormData({ ...formData, color_perception: e.target.checked })}
              colorScheme="teal"
            >
              Ha demostrado capacidad para distinguir y diferenciar los colores.
            </Checkbox>
          </Box>

          <Box mb={6}>
            <Checkbox
              isChecked={showColorIssuesInput}
              onChange={(e) => {
                const checked = e.target.checked;
                setShowColorIssuesInput(checked);
                if (!checked) {
                  setFormData({ ...formData, color_issues: "" });
                }
              }}
              colorScheme="orange"
            >
              Tiene problemas para distinguir o diferenciar los siguientes colores.
            </Checkbox>
            {showColorIssuesInput && (
              <Input
                placeholder="Especifique los colores con los que tiene problemas"
                value={formData.color_issues}
                onChange={(e) =>
                  setFormData({ ...formData, color_issues: e.target.value })
                }
                mt={2}
                borderColor="orange.300"
                bg={useColorModeValue("white", "gray.700")}
                _focus={{ borderColor: "orange.400" }}
              />
            )}
          </Box>
          <Divider mb={4} />

          <Stack direction={{ base: "column", sm: "row" }} spacing={6} justify="center" mt={6}>
            <Button
              colorScheme="teal"
              onClick={handleSubmit}
              width={["100%", "auto"]}
              size="lg"
              fontWeight="bold"
              boxShadow="md"
            >
              GUARDAR
            </Button>
            <Button
              colorScheme="teal"
              variant="outline"
              onClick={() => handleNavigate(`/sales/${formData.patient_id}`)}
              width={["100%", "auto"]}
              size="lg"
              fontWeight="bold"
              boxShadow="md"
            >
              Realizar Venta
            </Button>
          </Stack>
        </Box>
      </Box>
    </Box>
  );
};

export default MeasuresFinal;