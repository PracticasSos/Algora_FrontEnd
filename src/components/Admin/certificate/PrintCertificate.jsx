import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from '../../../api/supabase';
import { Box, Button, Heading, Table, Thead, Tbody, Tr, Th, Td, Input, Select, Stack, SimpleGrid, FormControl, FormLabel, Textarea, RadioGroup, Radio, Checkbox, Text, useColorModeValue, VStack } from '@chakra-ui/react';
import PdfMeasures from "../PdfMeasures";
import CertificateLogo from "./CertificateLogo";
import CertificateFooter from "./CertificateFooter";
import SelloSelector from "./SelloSelector";
import SignaturePadComponent from "../Sales/SignaturePadComponent";
import { useAuth } from '../../AuthContext';
import SmartHeader from "../../header/SmartHeader";

const PrintCertificate = () => {
  const [patients, setPatients] = useState([]);
  const [filteredPatients, setFilteredPatients] = useState([]);
  const [branches, setBranches] = useState([]);
  const [search, setSearch] = useState('');
  const [searchTermPatients, setSearchTermPatients] = useState("");
  const [showColorIssuesInput, setShowColorIssuesInput] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const targetRef = useRef(null);
  const { user } = useAuth();

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
    created_at: "",
    branch_name: "",
    branch_address: "",
    branch_cell: "",
    branch_email: ""
  });

  const navigate = useNavigate();
  const [tenantId, setTenantId] = useState(null);
  const [doctorSeal, setDoctorSeal] = useState(null);
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
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      console.error('Error fetching rx_final data:', error);
    }

    setFormData(prev => ({
      ...prev,
      ...data,
      patient_id: patient.id,
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
            <Heading size="md" mb={4} color={accentColor}>Su diagnóstico es:</Heading>
            <Textarea
              ref={diagnosisRef}
              placeholder="Escriba el diagnóstico del paciente"
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
            display="flex"
            flexDirection={{ base: "column", md: "row" }}
            gap={6}
            justifyContent="center"
            alignItems={{ base: "center", md: "flex-start" }}
            my={6}
          >
            <Box
              flex="1"
              maxW={{ base: "100%", md: "320px" }}
              w="100%"
              p={4}
            >
              <SignaturePadComponent onSave={(signatureDataUrl) => setFormData((prev) => ({ ...prev, signature: signatureDataUrl, }))} />
            </Box>
            <Box
              flex="1"
              maxW={{ base: "100%", md: "420px" }}
              w="100%"
              p={4}
            >
              <SelloSelector onSelect={setDoctorSeal} />
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
        doctorSeal={doctorSeal}
        footerInfo={footerInfo}
      />
    </Box>
  );
}

export default PrintCertificate;