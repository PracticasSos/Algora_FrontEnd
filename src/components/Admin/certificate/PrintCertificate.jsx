import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from '../../../api/supabase';
import { Box, Button, Heading, Table, Thead, Tbody, Tr, Th, Td, Input, Select, Stack, SimpleGrid, FormControl, FormLabel, Textarea, RadioGroup, Radio, Checkbox, Text, useColorModeValue, VStack, useToast } from '@chakra-ui/react';
import PdfMeasures from "../PdfMeasures";
import CertificateLogo from "./CertificateLogo";
import CertificateFooter from "./CertificateFooter";
import SelloSelector from "./SelloSelector";
import SignaturePadComponent from "../Sales/SignaturePadComponent";
import { useAuth } from '../../AuthContext';
import SmartHeader from "../../header/SmartHeader";
import CertificateHistoryModal from "../CertificateHistoryModal";

const PrintCertificate = () => {
  const [patients, setPatients] = useState([]);
  const [filteredPatients, setFilteredPatients] = useState([]);
  const [branches, setBranches] = useState([]);
  const [search, setSearch] = useState('');
  const [searchTermPatients, setSearchTermPatients] = useState("");
  const [showColorIssuesInput, setShowColorIssuesInput] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const targetRef = useRef(null);
  const { user } = useAuth();
  const toast = useToast();

  const [formData, setFormData] = useState({
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
    pathology_od: "",
    pathology_oi: "",
    prescribes_treatment: null,
    treatment_optometric: false,
    treatment_ophthalmological: false,
    treatment_permanent_lenses: false,
    treatment_occasional_lenses: false,
    treatment_contact_lenses: false,
    observation: "",
    created_at: "",
    date: new Date().toISOString().slice(0, 10),
    branch_name: "",
    branch_address: "",
    branch_cell: "",
    branch_email: ""
  });

  const navigate = useNavigate();
  const [tenantId, setTenantId] = useState(null);
  const [doctorInfo, setDoctorInfo] = useState(null);
  const [showDoctorSignaturePad, setShowDoctorSignaturePad] = useState(false);
  const [footerInfo, setFooterInfo] = useState('');
  const diagnosisRef = useRef(null);

  useEffect(() => {
    if (diagnosisRef.current) {
      diagnosisRef.current.style.height = "100px";
      diagnosisRef.current.style.height = `${diagnosisRef.current.scrollHeight}px`;
    }
  }, [formData.diagnosis]);

  useEffect(() => {
    const fetchInitialData = async () => {
      const { data, error } = await supabase.auth.getSession();
      if (error) {
        console.error('Error al obtener sesión:', error);
        return;
      }

      const tId = data?.session?.user?.user_metadata?.tenant_id;
      if (tId) {
        setTenantId(tId);
        fetchPatients();
        fetchBranches(tId);
      }
    };
    fetchInitialData();
  }, []);

  const fetchPatients = async () => {
    const { data, error } = await supabase
      .from('patients')
      .select('id, pt_firstname, pt_lastname, pt_ci, pt_phone');

    if (error) {
      console.error('Error fetching patients:', error);
      return;
    }
    setPatients(data);
    setFilteredPatients(data);
  };

  const fetchBranches = async (tId) => {
    const { data, error } = await supabase
      .from('branchs')
      .select('id, name, address, cell, email')
      .eq('tenant_id', tId);

    if (error) {
      console.error('Error fetching branches:', error);
      return;
    }
    setBranches(data);

    // Se precarga la primera sucursal por defecto, así los datos de la
    // óptica siempre aparecen en el certificado sin tener que elegirlos
    // a mano cada vez (el admin igual puede cambiarla en el selector).
    if (data && data.length > 0) {
      setFormData(prev => ({
        ...prev,
        branch_name: prev.branch_name || data[0].name,
        branch_address: prev.branch_address || data[0].address,
        branch_cell: prev.branch_cell || data[0].cell,
        branch_email: prev.branch_email || data[0].email,
      }));
    }
  };

  const handleSearchPatients = (e) => {
    const searchTerm = e.target.value.toLowerCase();
    setSearchTermPatients(e.target.value);
    setSearch(searchTerm);

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

  const handleSelectPatient = async (patient) => {
    const fullName = `${patient.pt_firstname} ${patient.pt_lastname}`;
    setSearchTermPatients(fullName);
    setSelectedPatient(patient);
    setFilteredPatients([]);

    const { data, error } = await supabase
      .from('rx_final')
      .select('*')
      .eq('patient_id', patient.id)
      .order('created_at', { ascending: false, nullsFirst: false })
      .order('id', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('Error fetching rx_final data:', error);
    }

    setFormData(prev => ({
      ...prev,
      ...data,
      patient_id: patient.id,
      // La fecha de emisión del certificado es independiente de cuándo se
      // tomó la medida; se conserva lo que el admin ya haya elegido.
      date: prev.date,
    }));
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleBranchChange = (e) => {
    const branchId = e.target.value;
    const selected = branches.find(branch => branch.id.toString() === branchId);
    if (selected) {
      setFormData(prev => ({
        ...prev,
        branch_name: selected.name,
        branch_address: selected.address,
        branch_cell: selected.cell,
        branch_email: selected.email
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        branch_name: "",
        branch_address: "",
        branch_cell: "",
        branch_email: ""
      }));
    }
  };

  /**
   * Sugerencia automática de diagnóstico, basada en reglas ópticas estándar
   * (no usa ningún servicio de IA externo, así que no genera ningún costo).
   * Es solo un punto de partida: el doctor siempre puede editarlo o borrarlo.
   */
  const suggestDiagnosis = () => {
    const parseVal = (v) => {
      if (v === undefined || v === null || v === "") return 0;
      const n = parseFloat(String(v).replace(",", "."));
      return isNaN(n) ? 0 : n;
    };

    const sphereR = parseVal(formData.sphere_right);
    const sphereL = parseVal(formData.sphere_left);
    const cylR = parseVal(formData.cylinder_right);
    const cylL = parseVal(formData.cylinder_left);

    const describeEye = (sphere, cyl) => {
      const parts = [];
      if (sphere <= -0.25) {
        parts.push(sphere <= -6 ? "Miopía alta" : sphere <= -3 ? "Miopía moderada" : "Miopía leve");
      } else if (sphere >= 0.25) {
        parts.push(sphere >= 5 ? "Hipermetropía alta" : sphere >= 2 ? "Hipermetropía moderada" : "Hipermetropía leve");
      }
      if (Math.abs(cyl) >= 0.25) parts.push("Astigmatismo");
      return parts.length ? parts.join(" y ") : "Emetropía";
    };

    const odDiagnosis = describeEye(sphereR, cylR);
    const oiDiagnosis = describeEye(sphereL, cylL);

    let text;
    if (odDiagnosis === "Emetropía" && oiDiagnosis === "Emetropía") {
      text = "Paciente presenta Emetropía en ambos ojos. Se recomienda control anual.";
    } else if (odDiagnosis === oiDiagnosis) {
      text = `Paciente presenta ${odDiagnosis} en ambos ojos. Se recomienda uso de corrección óptica y control periódico.`;
    } else {
      text = `Ojo derecho (O.D): ${odDiagnosis}. Ojo izquierdo (O.I): ${oiDiagnosis}. Se recomienda uso de corrección óptica y control periódico.`;
    }

    setFormData((prev) => ({ ...prev, diagnosis: text }));
    toast({
      title: "Sugerencia generada",
      description: "Revísala y ajústala según tu criterio profesional antes de emitir el certificado.",
      status: "info",
      duration: 4000,
      isClosable: true,
    });
  };

  const renderInputField = (label, name, type, isRequired = false) => (
    <FormControl id={name} isRequired={isRequired}>
      <FormLabel>{label}</FormLabel>
      <Input
        type={type}
        name={name}
        value={formData[name] || ""}
        onChange={handleChange}
      />
    </FormControl>
  );

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

  const accentColor = useColorModeValue('blue.500', 'blue.300');
  const cardBg = useColorModeValue('white', 'gray.800');
  const sectionBg = useColorModeValue('gray.100', 'gray.700');
  const shadow = "0 4px 12px rgba(0,0,0,0.08)";


  return (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      minHeight="100dvh"
      bg={useColorModeValue("gray.50", "gray.900")}
      px={[2, 4, 8]}
    >
      <Box
        display="flex"
        flexDirection="column"
        alignItems="center"
        minHeight="100dvh"
        p={[2, 4, 6]}
        w="100%"
        maxW="1400px"
      >
        <SmartHeader />

        <Box
          as="form"
          onSubmit={(e) => { e.preventDefault() }}
          width="100%"
          maxWidth="1300px"
          boxShadow={shadow}
          borderRadius="xl"
          p={[4, 6, 8]}
          bg={cardBg}
          mb={6}
        >
          <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6} mb={4}>
            <FormControl id="branch-select">
              <FormLabel fontWeight="bold" color={accentColor}>Sucursal</FormLabel>
              <Select
                placeholder="Seleccione una sucursal"
                onChange={handleBranchChange}
                bg={sectionBg}
                borderColor={accentColor}
                _focus={{ borderColor: accentColor }}
              >
                {branches.map(branch => (
                  <option key={branch.id} value={branch.id}>{branch.name} </option>
                ))}
              </Select>
            </FormControl>

            <FormControl id="patient-search" position="relative">
              <FormLabel fontWeight="bold" color={accentColor}>Buscar Paciente</FormLabel>
              <Input
                type="text"
                placeholder="Buscar por nombre..."
                value={searchTermPatients}
                onChange={handleSearchPatients}
                bg={sectionBg}
                borderColor={accentColor}
                _focus={{ borderColor: accentColor }}
              />
              {searchTermPatients && filteredPatients.length > 0 && (
                <Box
                  border="1px solid"
                  borderColor={accentColor}
                  borderRadius="md"
                  mt={2}
                  maxHeight="150px"
                  overflowY="auto"
                  zIndex={1000}
                  position="absolute"
                  width="100%"
                  bg={cardBg}
                  boxShadow={shadow}
                >
                  {filteredPatients.map((patient) => (
                    <Box
                      key={patient.id}
                      p={2}
                      onClick={() => handleSelectPatient(patient)}
                      _hover={{ bg: accentColor, color: "white", cursor: "pointer" }}
                      transition="background 0.2s"
                    >
                      {patient.pt_firstname} {patient.pt_lastname}
                    </Box>
                  ))}
                </Box>
              )}
              {selectedPatient && (
                <Text
                  mt={2}
                  fontSize="sm"
                  color={accentColor}
                  fontWeight="semibold"
                  cursor="pointer"
                  textDecoration="underline"
                  onClick={() => setIsHistoryOpen(true)}
                >
                  Ver certificados anteriores
                </Text>
              )}
            </FormControl>
            {renderInputField("Fecha", "date", "date", true)}
          </SimpleGrid>
        </Box>

        <Box
          ref={targetRef}
          w="100%"
          maxWidth="1300px"
          p={[4, 6, 8]}
          mt={6}
          boxShadow={shadow}
          borderRadius="xl"
          bg={cardBg}
        >
          <CertificateLogo tenantId={tenantId} />

          {formData.branch_name && (
            <VStack spacing={0} my={4} alignItems="center" textAlign="center">
              <Text fontWeight="bold" fontSize="xl" color={accentColor}>{formData.branch_name}</Text>
              <Text fontSize="md">{formData.branch_address}</Text>
              <Text fontSize="md">Cel: {formData.branch_cell}</Text>
              <Text fontSize="md">Email: {formData.branch_email}</Text>
            </VStack>
          )}

          <Heading mb={6} textAlign="center" fontSize={["2xl", "3xl", "4xl"]} color={accentColor} letterSpacing="wide">
            Certificado de Agudeza Visual
          </Heading>

          <Box display={{ base: "none", lg: "block" }} overflowX="auto" mb={6}>
            <Table variant="striped" colorScheme="blue" size="md" boxShadow={shadow} borderRadius="md">
              <Thead>
                <Tr>
                  <Th>Rx Final</Th>
                  <Th>Esfera</Th>
                  <Th>Cilindro</Th>
                  <Th>Eje</Th>
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
                    <Td fontWeight="bold" color={accentColor}>{eye}</Td>
                    {['sphere', 'cylinder', 'axis', 'prism', 'add', 'av_vl', 'av_vp', 'dnp', 'alt'].map((field) => (
                      <Td key={field}>
                        <Input
                          name={`${field}_${eye === 'OD' ? 'right' : 'left'}`}
                          value={formData[`${field}_${eye === 'OD' ? 'right' : 'left'}`] || ''}
                          onChange={handleChange}
                          size="sm"
                          bg={sectionBg}
                          borderColor={accentColor}
                          _focus={{ borderColor: accentColor }}
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
              <Box key={eye} mb={6} p={4} borderWidth="1px" borderRadius="xl" bg={sectionBg} boxShadow={shadow}>
                <Heading size="md" mb={3} color={accentColor}>
                  {eye === 'OD' ? 'Ojo Derecho (OD)' : 'Ojo Izquierdo (OI)'}
                </Heading>
                <SimpleGrid columns={2} spacing={4}>
                  {['sphere', 'cylinder', 'axis', 'prism', 'add', 'av_vl', 'av_vp', 'dnp', 'alt'].map(field => (
                    <FormControl key={field}>
                      <FormLabel fontSize="sm" textTransform="capitalize">{field.replace('_', ' ')}</FormLabel>
                      <Input
                        name={`${field}_${eye === 'OD' ? 'right' : 'left'}`}
                        value={formData[`${field}_${eye === 'OD' ? 'right' : 'left'}`] || ''}
                        onChange={handleChange}
                        size="sm"
                        bg={cardBg}
                        borderColor={accentColor}
                        _focus={{ borderColor: accentColor }}
                      />
                    </FormControl>
                  ))}
                </SimpleGrid>
              </Box>
            ))}
          </Box>

          <Box
            p={[4, 6, 8]}
            maxWidth="1000px"
            mx="auto"
            border="1px solid"
            borderColor={accentColor}
            borderRadius="xl"
            bg={sectionBg}
            boxShadow={shadow}
            mb={6}
          >
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
              <Heading size="md" color={accentColor}>Su diagnóstico es:</Heading>
              <Button size="sm" variant="outline" colorScheme="blue" onClick={suggestDiagnosis}>
                Sugerir diagnóstico
              </Button>
            </Box>
            <Textarea
              ref={diagnosisRef}
              placeholder="Escriba el diagnóstico del paciente, o use 'Sugerir diagnóstico' como punto de partida"
              value={formData.diagnosis}
              onChange={(e) => setFormData({ ...formData, diagnosis: e.target.value })}
              mb={4}
              resize="none"
              minHeight="100px"
              style={{ overflow: "hidden" }}
              bg={cardBg}
              borderColor={accentColor}
              _focus={{ borderColor: accentColor }}
            />
            <Box mb={6}>
              <Heading size="sm" mb={2} color={accentColor}>Visión cercana</Heading>
              <Text mb={2} fontSize={["sm", "md"]}>
                Capacidad de leer como mínimo, las letras de la escala 1 de la carta normalizada Jaeger...
              </Text>
              <RadioGroup
                value={formData.near_vision}
                onChange={(val) => setFormData({ ...formData, near_vision: val })}
                mb={2}
              >
                <Stack direction={{ base: "column", sm: "row" }} spacing={[2, 4, 6]}>
                  <Radio value="Aprobado" colorScheme="blue">Aprobado</Radio>
                  <Radio value="No Aprobado" colorScheme="red">No Aprobado</Radio>
                </Stack>
              </RadioGroup>
              <Checkbox
                isChecked={formData.needs_lenses_near}
                onChange={(e) => setFormData({ ...formData, needs_lenses_near: e.target.checked })}
                colorScheme="blue"
              >
                Precisa lentes
              </Checkbox>
            </Box>

            <Box mb={6}>
              <Heading size="sm" mb={2} color={accentColor}>Visión lejana</Heading>
              <RadioGroup
                value={formData.far_vision}
                onChange={(val) => setFormData({ ...formData, far_vision: val })}
                mb={2}
              >
                <Stack direction={{ base: "column", sm: "row" }} spacing={[2, 4, 6]}>
                  <Radio value="20/20" colorScheme="blue">Mayor o igual a 20/20 en la escala SNELLEN</Radio>
                  <Radio value="Menor a 20/20" colorScheme="red">Menor a 20/20</Radio>
                </Stack>
              </RadioGroup>
              <Checkbox
                isChecked={formData.needs_lenses_far}
                onChange={(e) => setFormData({ ...formData, needs_lenses_far: e.target.checked })}
                colorScheme="blue"
              >
                Precisa lentes
              </Checkbox>
            </Box>

            <Box mb={6}>
              <Heading size="sm" mb={2} color={accentColor}>Percepción de colores</Heading>
              <Checkbox
                isChecked={formData.color_perception}
                onChange={(e) => setFormData({ ...formData, color_perception: e.target.checked })}
                colorScheme="blue"
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
                colorScheme="red"
              >
                Tiene problemas para distinguir o diferenciar los siguientes colores.
              </Checkbox>

              {showColorIssuesInput && (
                <Input
                  placeholder="Especifique los colores con los que tiene problemas"
                  value={formData.color_issues}
                  onChange={(e) => setFormData({ ...formData, color_issues: e.target.value })}
                  mt={2}
                  bg={cardBg}
                  borderColor={accentColor}
                  _focus={{ borderColor: accentColor }}
                />
              )}
            </Box>
          </Box>

          <Box
            p={[4, 6, 8]}
            maxWidth="1000px"
            mx="auto"
            border="1px solid"
            borderColor={accentColor}
            borderRadius="xl"
            bg={sectionBg}
            boxShadow={shadow}
            mb={6}
          >
            <Heading size="md" mb={4} color={accentColor}>Patologías</Heading>
            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4} mb={6}>
              <FormControl>
                <FormLabel fontSize="sm">O.D</FormLabel>
                <Input
                  placeholder="No refiere"
                  value={formData.pathology_od}
                  onChange={(e) => setFormData({ ...formData, pathology_od: e.target.value })}
                  bg={cardBg}
                  borderColor={accentColor}
                  _focus={{ borderColor: accentColor }}
                />
              </FormControl>
              <FormControl>
                <FormLabel fontSize="sm">O.I</FormLabel>
                <Input
                  placeholder="No refiere"
                  value={formData.pathology_oi}
                  onChange={(e) => setFormData({ ...formData, pathology_oi: e.target.value })}
                  bg={cardBg}
                  borderColor={accentColor}
                  _focus={{ borderColor: accentColor }}
                />
              </FormControl>
            </SimpleGrid>

            <Heading size="sm" mb={2} color={accentColor}>En consecuencia</Heading>
            <RadioGroup
              value={formData.prescribes_treatment === null ? "" : formData.prescribes_treatment ? "yes" : "no"}
              onChange={(val) => setFormData({ ...formData, prescribes_treatment: val === "yes" })}
              mb={4}
            >
              <Stack direction={{ base: "column", sm: "row" }} spacing={[2, 6]}>
                <Radio value="yes" colorScheme="blue">Se prescribe</Radio>
                <Radio value="no" colorScheme="red">No se prescribe</Radio>
              </Stack>
            </RadioGroup>

            {formData.prescribes_treatment && (
              <Stack spacing={2} mb={6}>
                <Checkbox
                  isChecked={formData.treatment_optometric}
                  onChange={(e) => setFormData({ ...formData, treatment_optometric: e.target.checked })}
                  colorScheme="blue"
                >
                  Tratamiento Optométrico y Ortóptico
                </Checkbox>
                <Checkbox
                  isChecked={formData.treatment_ophthalmological}
                  onChange={(e) => setFormData({ ...formData, treatment_ophthalmological: e.target.checked })}
                  colorScheme="blue"
                >
                  Tratamiento Oftalmológico
                </Checkbox>
                <Checkbox
                  isChecked={formData.treatment_permanent_lenses}
                  onChange={(e) => setFormData({ ...formData, treatment_permanent_lenses: e.target.checked })}
                  colorScheme="blue"
                >
                  Lentes correctos permanentes
                </Checkbox>
                <Checkbox
                  isChecked={formData.treatment_occasional_lenses}
                  onChange={(e) => setFormData({ ...formData, treatment_occasional_lenses: e.target.checked })}
                  colorScheme="blue"
                >
                  Lentes correctores de uso ocasional
                </Checkbox>
                <Checkbox
                  isChecked={formData.treatment_contact_lenses}
                  onChange={(e) => setFormData({ ...formData, treatment_contact_lenses: e.target.checked })}
                  colorScheme="blue"
                >
                  Lentes de Contacto
                </Checkbox>
              </Stack>
            )}

            <FormControl>
              <FormLabel fontSize="sm" fontWeight="bold" color={accentColor}>Observación</FormLabel>
              <Input
                placeholder="Ej. Control anual"
                value={formData.observation}
                onChange={(e) => setFormData({ ...formData, observation: e.target.value })}
                bg={cardBg}
                borderColor={accentColor}
                _focus={{ borderColor: accentColor }}
              />
            </FormControl>
          </Box>

          <Box
            display="flex"
            flexDirection={{ base: "column", md: "row" }}
            gap={6}
            justifyContent="center"
            alignItems={{ base: "center", md: "flex-start" }}
            my={6}
          >
            <Box
              flex="1"
              maxW={{ base: "100%", md: "420px" }}
              w="100%"
              p={4}
            >
              <SelloSelector onSelect={setDoctorInfo} />

              {!showDoctorSignaturePad ? (
                <Button
                  size="sm"
                  variant="link"
                  colorScheme="blue"
                  mt={3}
                  onClick={() => setShowDoctorSignaturePad(true)}
                >
                  + Agregar firma digital del profesional (opcional)
                </Button>
              ) : (
                <Box mt={3}>
                  <Text fontSize="xs" color="gray.500" mb={1}>
                    Si no la agregas, el certificado deja el espacio en blanco para firmar a mano al imprimir.
                  </Text>
                  <SignaturePadComponent
                    onSave={(signatureDataUrl) =>
                      setFormData((prev) => ({ ...prev, doctor_signature: signatureDataUrl }))
                    }
                  />
                  <Button
                    size="sm"
                    variant="link"
                    colorScheme="red"
                    mt={2}
                    onClick={() => {
                      setShowDoctorSignaturePad(false);
                      setFormData((prev) => ({ ...prev, doctor_signature: null }));
                    }}
                  >
                    Quitar firma digital
                  </Button>
                </Box>
              )}
            </Box>
          </Box>

          <CertificateFooter currentUser={user} onFooterInfo={setFooterInfo} />
        </Box>
      </Box>

      <PdfMeasures
        targetRef={targetRef}
        formData={{
          ...formData,
          message: "Aquí tienes tu certificado de medidas"
        }}
        selectedPatient={selectedPatient}
        tenantId={tenantId}
        doctorSeal={doctorInfo?.sealImage}
        doctorName={doctorInfo?.name}
        doctorCi={doctorInfo?.ci}
        doctorSenescyt={doctorInfo?.senescyt}
        footerInfo={footerInfo}
      />

      <CertificateHistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        patientId={selectedPatient?.id}
        patientName={selectedPatient ? `${selectedPatient.pt_firstname} ${selectedPatient.pt_lastname}` : ""}
      />
    </Box>
  );
}

export default PrintCertificate;