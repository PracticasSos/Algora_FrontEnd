import { useState, useEffect } from "react";
import { supabase } from "../../api/supabase";
import { Box, Button, FormControl, Input, SimpleGrid, Heading, Alert, AlertIcon, Table, Thead, Tbody, Tr, Th, Td, Textarea, RadioGroup, Radio, Stack, Checkbox, Text, FormLabel, useColorModeValue, HStack} from "@chakra-ui/react";
import { useNavigate, useParams } from "react-router-dom";
import { FaEye } from 'react-icons/fa';
import SmartHeader from "../header/SmartHeader";

const MeasuresFinal = () => {
  const navigate = useNavigate();

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
    created_at: ""
  });

  const [patients, setPatients] = useState([]);
  const [filteredPatients, setFilteredPatients] = useState([]);
  const [searchTermPatients, setSearchTermPatients] = useState("");
  const [showColorIssuesInput, setShowColorIssuesInput] = useState(false);
  const [error, setError] = useState(null);
  const { id } = useParams();

  useEffect(() => {
  if (id && patients.length > 0) {
    const found = patients.find(p => String(p.id) === String(id));
    if (found) {
      setFormData(f => ({ ...f, patient_id: found.id }));
      setSearchTermPatients(`${found.pt_firstname} ${found.pt_lastname}`);
      setFilteredPatients([]);
    }
  }
  }, [id, patients]); 

  useEffect(() => {
    fetchData('patients', data => {
      setPatients(data);
      setFilteredPatients(data);

      // Intentar seleccionar paciente desde localStorage
      const stored = localStorage.getItem('selectedPatient');
      if (stored) {
        const selected = JSON.parse(stored);
        // Buscar el paciente en la lista por CI o nombre
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
        // Limpia el localStorage para evitar selección accidental en el futuro
        localStorage.removeItem('selectedPatient');
      }
    });
  }, []);

    const fetchData = async (table, setter) => {
      try {
          const { data, error } = await supabase.from(table).select("*");
          if (error) throw error;
          setter(data);
      } catch (err) {
          console.error(`Error fetching ${table}:`, err);
          setError(`Error al obtener los datos de ${table}`);
      }
    };

    const handleChange = (e) => {
      const { name, value } = e.target;
      setFormData({ ...formData, [name]: value });
    };

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
      alert ("Por favor completa los campos obligatorios.");
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
      alert("Medidas registradas exitosamente.");
      setFormData({
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
      });
  } catch (error) {
      console.error("Error al registrar medidas:", error.message);
      alert("Hubo un error al registar la venta.");
  }
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
    const moduleSpecificButton = null;

    return (
      <Box display="flex" flexDirection="column" alignItems="center" minHeight="100dvh" p={[2, 4, 6]}>
        {error && (
          <Alert status="error" mb={4}>
            <AlertIcon />
            {error}
          </Alert>
        )}
        <SmartHeader moduleSpecificButton={moduleSpecificButton} />
        <Box w="100%" pt={5} mb={4}>
      <Heading 
          mb={4} 
          textAlign="left" 
          size="md"
          fontWeight="700"
          color={useColorModeValue('teal.600', 'teal.300')}
          pb={2}
      >
          Registrar Medidas Finales 
      </Heading>
      </Box>
        <Box as="form" onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} width="100%" maxWidth="1300px" boxShadow="lg" borderRadius="md" p={[2, 4, 6]}>
          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4} mb={4}>
            <FormControl id="patient-search">
              <Input type="text" placeholder="Buscar por nombre..." value={searchTermPatients} onChange={handleSearchPatients} />
              {searchTermPatients && (
                <Box border="1px solid #ccc" borderRadius="md" mt={2} maxHeight="150px" overflowY="auto">
                  {filteredPatients.map((patient) => (
                    <Box key={patient.id} p={2} _hover={{ bg: "teal.100", cursor: "pointer" }} onClick={() => handlePatientSelect(patient)}>
                      {patient.pt_firstname} {patient.pt_lastname}
                    </Box>
                  ))}
                </Box>
              )}
            </FormControl>
          </SimpleGrid>
          
          <Box display={{ base: "none", lg: "block" }} overflowX="auto" mb={4}>
            <Table variant="simple" size="md">
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
                    <Td>{eye}</Td>
                    {['sphere', 'cylinder', 'axis', 'prism', 'add', 'av_vl', 'av_vp', 'dnp', 'alt'].map((field) => (
                      <Td key={field}>
                        <Input 
                          name={`${field}_${eye === 'OD' ? 'right' : 'left'}`} 
                          value={formData[`${field}_${eye === 'OD' ? 'right' : 'left'}`]} 
                          onChange={handleChange}
                          size="sm"
                        />
                      </Td>
                    ))}
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </Box>
    
          <Box display={{ base: "block", lg: "none" }} mb={4}>
            {['OD', 'OI'].map((eye) => (
              <Box key={eye} mb={6} p={3} borderWidth="1px" borderRadius="md">
                <Heading size="md" mb={3}>{eye === 'OD' ? 'Ojo Derecho (OD)' : 'Ojo Izquierdo (OI)'}</Heading>
                <SimpleGrid columns={2} spacing={3}>
                  <FormControl>
                    <FormLabel fontSize="sm">Esfera</FormLabel>
                    <Input 
                      name={`sphere_${eye === 'OD' ? 'right' : 'left'}`} 
                      value={formData[`sphere_${eye === 'OD' ? 'right' : 'left'}`]} 
                      onChange={handleChange}
                      size="sm"
                    />
                  </FormControl>
                  <FormControl>
                    <FormLabel fontSize="sm">Cilindro</FormLabel>
                    <Input 
                      name={`cylinder_${eye === 'OD' ? 'right' : 'left'}`} 
                      value={formData[`cylinder_${eye === 'OD' ? 'right' : 'left'}`]} 
                      onChange={handleChange}
                      size="sm"
                    />
                  </FormControl>
                  <FormControl>
                    <FormLabel fontSize="sm">Eje</FormLabel>
                    <Input 
                      name={`axis_${eye === 'OD' ? 'right' : 'left'}`} 
                      value={formData[`axis_${eye === 'OD' ? 'right' : 'left'}`]} 
                      onChange={handleChange}
                      size="sm"
                    />
                  </FormControl>
                  <FormControl>
                    <FormLabel fontSize="sm">Prisma</FormLabel>
                    <Input 
                      name={`prism_${eye === 'OD' ? 'right' : 'left'}`} 
                      value={formData[`prism_${eye === 'OD' ? 'right' : 'left'}`]} 
                      onChange={handleChange}
                      size="sm"
                    />
                  </FormControl>
                  <FormControl>
                    <FormLabel fontSize="sm">ADD</FormLabel>
                    <Input 
                      name={`add_${eye === 'OD' ? 'right' : 'left'}`} 
                      value={formData[`add_${eye === 'OD' ? 'right' : 'left'}`]} 
                      onChange={handleChange}
                      size="sm"
                    />
                  </FormControl>
                  <FormControl>
                    <FormLabel fontSize="sm">AV VL</FormLabel>
                    <Input 
                      name={`av_vl_${eye === 'OD' ? 'right' : 'left'}`} 
                      value={formData[`av_vl_${eye === 'OD' ? 'right' : 'left'}`]} 
                      onChange={handleChange}
                      size="sm"
                    />
                  </FormControl>
                  <FormControl>
                    <FormLabel fontSize="sm">AV VP</FormLabel>
                    <Input 
                      name={`av_vp_${eye === 'OD' ? 'right' : 'left'}`} 
                      value={formData[`av_vp_${eye === 'OD' ? 'right' : 'left'}`]} 
                      onChange={handleChange}
                      size="sm"
                    />
                  </FormControl>
                  <FormControl>
                    <FormLabel fontSize="sm">DNP</FormLabel>
                    <Input 
                      name={`dnp_${eye === 'OD' ? 'right' : 'left'}`} 
                      value={formData[`dnp_${eye === 'OD' ? 'right' : 'left'}`]} 
                      onChange={handleChange}
                      size="sm"
                    />
                  </FormControl>
                  <FormControl>
                    <FormLabel fontSize="sm">ALT</FormLabel>
                    <Input 
                      name={`alt_${eye === 'OD' ? 'right' : 'left'}`} 
                      value={formData[`alt_${eye === 'OD' ? 'right' : 'left'}`]} 
                      onChange={handleChange}
                      size="sm"
                    />
                  </FormControl>
                </SimpleGrid>
              </Box>
            ))}
          </Box>
    
          <Box p={[2, 3, 4]} maxWidth="1000px" mx="auto" border="1px solid #ccc" borderRadius="8px">
            <Heading size="md" mb={4}>Su diagnóstico es:</Heading>
            <Textarea placeholder="Escriba el diagnóstico del paciente" value={formData.diagnosis} onChange={(e) => setFormData({ ...formData, diagnosis: e.target.value })} mb={4} />

            <Box mb={6}>
              <Heading size="sm" mb={2}>Visión cercana</Heading>
              <Text mb={2} fontSize={["sm", "md"]}>Capacidad de leer como mínimo, las letras de la escala 1 de la carta normalizada Jaeger...</Text>
              <RadioGroup value={formData.near_vision}onChange={(val) => setFormData({ ...formData, near_vision: val })} mb={2}>
                <Stack direction={{ base: "column", sm: "row" }} spacing={[1, 2, 4]}>
                  <Radio value="Aprobado">Aprobado</Radio>
                  <Radio value="No Aprobado">No Aprobado</Radio>
                </Stack>
              </RadioGroup>
              <Checkbox isChecked={formData.needs_lenses_near} onChange={(e) => setFormData({ ...formData, needs_lenses_near: e.target.checked })}>Precisa lentes</Checkbox>
            </Box>
            
            <Box mb={6}>
              <Heading size="sm" mb={2}>Visión lejana</Heading>
              <RadioGroup value={formData.far_vision} onChange={(val) => setFormData({ ...formData, far_vision: val })} mb={2}>
                <Stack direction={{ base: "column", sm: "row" }} spacing={[1, 2, 4]}>
                  <Radio value="20/20">Mayor o igual a 20/20 en la escala SNELLEN</Radio>
                  <Radio value="Menor a 20/20">Menor a 20/20</Radio>
                </Stack>
              </RadioGroup>
              <Checkbox isChecked={formData.needs_lenses_far} onChange={(e) => setFormData({ ...formData, needs_lenses_far: e.target.checked })}>Precisa lentes</Checkbox>
            </Box>
            
            <Box mb={6}>
              <Heading size="sm" mb={2}>Percepción de colores</Heading>
              <Checkbox isChecked={formData.color_perception} onChange={(e) => setFormData({ ...formData, color_perception: e.target.checked })}>
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
                />
              )}
            </Box>
            <Stack direction={{ base: "column", sm: "row" }} spacing={4} justify="center">
              <Button colorScheme="teal" onClick={handleSubmit} width={["100%", "auto"]}>GUARDAR</Button>
              <Button colorScheme="teal" onClick={() => handleNavigate(`/sales/${formData.patient_id}`)} width={["100%", "auto"]}>Realizar Venta</Button>
            </Stack>
          </Box>
        </Box>
      </Box>
    );
};

export default MeasuresFinal;
