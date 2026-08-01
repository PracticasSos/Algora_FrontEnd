import { useState, useEffect } from 'react';
import { supabase } from '../../api/supabase';
import {
  Box, Button, Table, Thead, Tbody, Tr, Th, Td, Input, useToast, Flex, IconButton,
  Select, useColorModeValue, Text, HStack, VStack, Badge, Icon, Container,
  Modal, ModalOverlay, ModalContent, ModalHeader, ModalCloseButton, ModalBody, ModalFooter,
  SimpleGrid, FormControl, FormLabel, Spinner, Heading,
} from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import { Eye, Pencil, Trash2, Search as SearchIcon, ChevronLeft, ChevronRight, Users, Eye as EyeStat } from 'lucide-react';
import ConfirmDialog from '../UI/ConfirmDialog';
import SmartHeader from '../header/SmartHeader';
import { useAuth } from '../AuthContext';

const ACCENT = '#00A88E';
const PAGE_SIZE = 10;

const DETAIL_FIELDS = [
  { key: 'pt_firstname', label: 'Nombre' },
  { key: 'pt_lastname', label: 'Apellido' },
  { key: 'pt_ci', label: 'C.I.' },
  { key: 'sexo', label: 'Sexo' },
  { key: 'date', label: 'Fecha de registro', type: 'date' },
  { key: 'pt_birthdate', label: 'Fecha de nacimiento', type: 'date' },
  { key: 'pt_age', label: 'Edad', readOnlyAlways: true },
  { key: 'pt_phone', label: 'Teléfono' },
  { key: 'pt_email', label: 'Correo' },
  { key: 'pt_address', label: 'Dirección' },
  { key: 'pt_city', label: 'Ciudad' },
  { key: 'pt_occupation', label: 'Ocupación' },
];

const ListPatients = () => {
  const [patients, setPatients] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [branches, setBranches] = useState([]);

  const [selectedPatient, setSelectedPatient] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editableData, setEditableData] = useState({});
  const [isSaving, setIsSaving] = useState(false);

  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [selectedId, setSelectedId] = useState(null);

  const toast = useToast();
  const navigate = useNavigate();
  const { user } = useAuth();

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  // Espera un poco antes de buscar, para no disparar una consulta por cada letra
  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 400);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    fetchBranches();
  }, []);

  useEffect(() => {
    fetchPatients();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, debouncedSearch]);

  const fetchBranches = async () => {
    const { data, error } = await supabase.from('branchs').select('id, name');
    if (!error) setBranches(data || []);
  };

  const fetchPatients = async () => {
    setLoading(true);
    const from = (page - 1) * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    let query = supabase
      .from('patients')
      .select('*', { count: 'exact' })
      .order('last_visit_at', { ascending: false, nullsFirst: false })
      .order('date', { ascending: false })
      .order('id', { ascending: false })
      .range(from, to);

    const term = debouncedSearch.trim();
    if (term) {
      query = query.or(
        `pt_firstname.ilike.%${term}%,pt_lastname.ilike.%${term}%,pt_phone.ilike.%${term}%,pt_ci.ilike.%${term}%`
      );
    }

    const { data, error, count } = await query;
    if (error) {
      toast({ title: 'Error', description: 'No se pudieron cargar los pacientes.', status: 'error' });
    } else {
      setPatients(data || []);
      setTotalCount(count || 0);
    }
    setLoading(false);
  };

  const openDetail = (patient) => {
    setSelectedPatient(patient);
    setEditableData(patient);
    setIsEditing(false);
    setIsDetailOpen(true);
  };

  const closeDetail = () => {
    setIsDetailOpen(false);
    setSelectedPatient(null);
    setIsEditing(false);
  };

  const handleFieldChange = (key, value) => {
    setEditableData((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    const { id, ...dataToSave } = editableData;
    const { error } = await supabase.from('patients').update(dataToSave).eq('id', selectedPatient.id);
    setIsSaving(false);
    if (error) {
      toast({ title: 'Error', description: 'No se pudo actualizar el paciente.', status: 'error' });
    } else {
      toast({ title: 'Actualizado', description: 'Los datos se guardaron correctamente.', status: 'success' });
      setIsEditing(false);
      setSelectedPatient(editableData);
      fetchPatients();
    }
  };

  const openConfirm = (id) => {
    setSelectedId(id);
    setIsConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    setIsConfirmOpen(false);
    const { error } = await supabase.from('patients').delete().match({ id: selectedId });
    if (error) {
      toast({ title: 'Error', description: 'No se pudo eliminar el paciente.', status: 'error' });
    } else {
      toast({ title: 'Eliminado', description: 'Paciente eliminado correctamente.', status: 'success' });
      closeDetail();
      fetchPatients();
    }
  };

  const handleGoToMeasures = (patientId) => {
    navigate(`/measures-final/${patientId}`);
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
      onClick={() => handleNavigate('/register-patient')}
      bg={ACCENT}
      color="white"
      size="sm"
      borderRadius="full"
      px={5}
      fontWeight="bold"
      _hover={{ bg: '#00967f' }}
    >
      + Registrar Paciente
    </Button>
  );

  const cardBg = useColorModeValue('white', 'gray.700');
  const inputBg = useColorModeValue('gray.50', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const subtitleColor = useColorModeValue('gray.500', 'gray.400');
  const sectionIconBg = useColorModeValue('#E6FBF6', 'rgba(0,168,142,0.15)');
  const rowHoverBg = useColorModeValue('gray.50', 'whiteAlpha.100');

  const SectionTitle = ({ icon, children }) => (
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

  const branchName = (branchId) => branches.find((b) => b.id === branchId)?.name || '—';

  return (
    <Box minHeight="100vh" bgGradient={useColorModeValue('linear(to-br, gray.50, teal.50)', 'linear(to-br, gray.900, #0d1f1c)')}>
      <SmartHeader moduleSpecificButton={moduleSpecificButton} />

      <Container maxW="1050px" py={8} px={{ base: 3, md: 6 }}>
        <Box
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
          <Box p={{ base: 5, md: 8 }}>
            <HStack spacing={3} mb={5}>
              <Flex
                align="center"
                justify="center"
                boxSize="44px"
                borderRadius="14px"
                bgGradient="linear(to-br, #00A88E, #00786A)"
                color="white"
                boxShadow="0 6px 16px -4px rgba(0,168,142,0.5)"
              >
                <Icon as={Users} boxSize="20px" />
              </Flex>
              <VStack align="start" spacing={0}>
                <Heading size="lg" fontWeight="800" color={useColorModeValue('gray.800', 'white')} letterSpacing="tight">
                  Lista de Pacientes
                </Heading>
                <Text fontSize="xs" color={subtitleColor}>
                  {totalCount} paciente{totalCount !== 1 ? 's' : ''} registrado{totalCount !== 1 ? 's' : ''}
                </Text>
              </VStack>
            </HStack>

            <Flex position="relative" mb={5}>
              <Icon as={SearchIcon} position="absolute" left="14px" top="12px" color={subtitleColor} zIndex={1} />
              <Input
                placeholder="Buscar por nombre, apellido, teléfono o cédula..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                pl="40px"
                size="lg"
                borderRadius="12px"
                bg={inputBg}
                borderColor={borderColor}
                _focus={{ borderColor: ACCENT, boxShadow: `0 0 0 1px ${ACCENT}` }}
              />
            </Flex>

            {loading ? (
              <Flex justify="center" py={16}>
                <Spinner color={ACCENT} />
              </Flex>
            ) : patients.length === 0 ? (
              <Text textAlign="center" color={subtitleColor} py={12}>
                No se encontraron pacientes{debouncedSearch ? ` para "${debouncedSearch}"` : ''}.
              </Text>
            ) : (
              <>
                <Box overflowX="auto" borderRadius="14px" border={`1px solid ${borderColor}`}>
                  <Table variant="simple" size="sm">
                    <Thead>
                      <Tr>
                        <Th color={subtitleColor}>Paciente</Th>
                        <Th color={subtitleColor}>Teléfono</Th>
                        <Th color={subtitleColor} textAlign="center">Edad</Th>
                        <Th color={subtitleColor}>Sucursal</Th>
                        <Th color={subtitleColor} textAlign="right">Acciones</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {patients.map((patient) => (
                        <Tr
                          key={patient.id}
                          cursor="pointer"
                          _hover={{ bg: rowHoverBg }}
                          onClick={() => openDetail(patient)}
                        >
                          <Td>
                            <Text fontWeight="semibold">{patient.pt_firstname} {patient.pt_lastname}</Text>
                            <Text fontSize="xs" color={subtitleColor}>
                              {patient.pt_ci || 'Sin C.I.'}
                              {patient.last_visit_at && (
                                <> · Atendido: {new Date(patient.last_visit_at).toLocaleDateString('es-EC', { day: '2-digit', month: 'short' })}</>
                              )}
                            </Text>
                          </Td>
                          <Td>{patient.pt_phone || '—'}</Td>
                          <Td textAlign="center">
                            <Badge colorScheme="teal" borderRadius="full" px={2}>
                              {patient.pt_age || '—'}
                            </Badge>
                          </Td>
                          <Td>{branchName(patient.branch_id)}</Td>
                          <Td textAlign="right" onClick={(e) => e.stopPropagation()}>
                            <HStack justify="flex-end" spacing={1}>
                              <IconButton
                                icon={<Eye size={15} />}
                                size="sm"
                                variant="ghost"
                                colorScheme="teal"
                                aria-label="Ver"
                                onClick={() => openDetail(patient)}
                              />
                              <IconButton
                                icon={<EyeStat size={15} />}
                                size="sm"
                                variant="ghost"
                                colorScheme="blue"
                                aria-label="Medidas"
                                onClick={() => handleGoToMeasures(patient.id)}
                              />
                              <IconButton
                                icon={<Trash2 size={15} />}
                                size="sm"
                                variant="ghost"
                                colorScheme="red"
                                aria-label="Eliminar"
                                onClick={() => openConfirm(patient.id)}
                              />
                            </HStack>
                          </Td>
                        </Tr>
                      ))}
                    </Tbody>
                  </Table>
                </Box>

                {/* Paginación */}
                <Flex justify="space-between" align="center" mt={5} flexWrap="wrap" gap={3}>
                  <Text fontSize="xs" color={subtitleColor}>
                    Página {page} de {totalPages} · {totalCount} en total
                  </Text>
                  <HStack>
                    <IconButton
                      icon={<ChevronLeft size={16} />}
                      size="sm"
                      variant="outline"
                      borderRadius="full"
                      isDisabled={page <= 1}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      aria-label="Anterior"
                    />
                    <Text fontSize="sm" fontWeight="semibold" minW="30px" textAlign="center">{page}</Text>
                    <IconButton
                      icon={<ChevronRight size={16} />}
                      size="sm"
                      variant="outline"
                      borderRadius="full"
                      isDisabled={page >= totalPages}
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      aria-label="Siguiente"
                    />
                  </HStack>
                </Flex>
              </>
            )}
          </Box>
        </Box>
      </Container>

      {/* Modal de detalle / edición */}
      <Modal isOpen={isDetailOpen} onClose={closeDetail} size={{ base: 'full', md: '2xl' }} isCentered>
        <ModalOverlay />
        <ModalContent bg={cardBg} borderRadius={{ base: 0, md: '20px' }}>
          <ModalHeader fontSize="md">
            {selectedPatient?.pt_firstname} {selectedPatient?.pt_lastname}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <SectionTitle icon={Users}>Datos del paciente</SectionTitle>
            <SimpleGrid columns={{ base: 1, sm: 2 }} spacing={4} mb={4}>
              {DETAIL_FIELDS.map(({ key, label, type, readOnlyAlways }) => (
                <FormControl key={key}>
                  <FormLabel fontSize="xs" color={subtitleColor} mb={1}>{label}</FormLabel>
                  {isEditing && !readOnlyAlways ? (
                    <Input
                      size="sm"
                      type={type || 'text'}
                      value={editableData[key] || ''}
                      onChange={(e) => handleFieldChange(key, e.target.value)}
                      borderRadius="10px"
                      bg={inputBg}
                      borderColor={borderColor}
                      _focus={{ borderColor: ACCENT, boxShadow: `0 0 0 1px ${ACCENT}` }}
                    />
                  ) : (
                    <Text fontSize="sm" fontWeight="medium">
                      {selectedPatient?.[key] || '—'}
                    </Text>
                  )}
                </FormControl>
              ))}
              <FormControl>
                <FormLabel fontSize="xs" color={subtitleColor} mb={1}>Sucursal</FormLabel>
                {isEditing ? (
                  <Select
                    size="sm"
                    value={editableData.branch_id || ''}
                    onChange={(e) => handleFieldChange('branch_id', e.target.value)}
                    borderRadius="10px"
                    bg={inputBg}
                    borderColor={borderColor}
                  >
                    <option value="">Seleccione...</option>
                    {branches.map((b) => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </Select>
                ) : (
                  <Text fontSize="sm" fontWeight="medium">{branchName(selectedPatient?.branch_id)}</Text>
                )}
              </FormControl>
            </SimpleGrid>

            <SectionTitle icon={Pencil}>Motivo de consulta</SectionTitle>
            <SimpleGrid columns={1} spacing={4}>
              <FormControl>
                <FormLabel fontSize="xs" color={subtitleColor} mb={1}>Razón de consulta</FormLabel>
                {isEditing ? (
                  <Input
                    size="sm"
                    value={editableData.pt_consultation_reason || ''}
                    onChange={(e) => handleFieldChange('pt_consultation_reason', e.target.value)}
                    borderRadius="10px"
                    bg={inputBg}
                    borderColor={borderColor}
                  />
                ) : (
                  <Text fontSize="sm">{selectedPatient?.pt_consultation_reason || '—'}</Text>
                )}
              </FormControl>
              <FormControl>
                <FormLabel fontSize="xs" color={subtitleColor} mb={1}>Recomendaciones</FormLabel>
                {isEditing ? (
                  <Input
                    size="sm"
                    value={editableData.pt_recommendations || ''}
                    onChange={(e) => handleFieldChange('pt_recommendations', e.target.value)}
                    borderRadius="10px"
                    bg={inputBg}
                    borderColor={borderColor}
                  />
                ) : (
                  <Text fontSize="sm">{selectedPatient?.pt_recommendations || '—'}</Text>
                )}
              </FormControl>
            </SimpleGrid>
          </ModalBody>
          <ModalFooter gap={2} flexWrap="wrap">
            <Button
              variant="ghost"
              colorScheme="red"
              size="sm"
              onClick={() => openConfirm(selectedPatient.id)}
              leftIcon={<Trash2 size={14} />}
            >
              Eliminar
            </Button>
            <Box flex="1" />
            {isEditing ? (
              <>
                <Button size="sm" variant="outline" onClick={() => { setIsEditing(false); setEditableData(selectedPatient); }}>
                  Cancelar
                </Button>
                <Button size="sm" bg={ACCENT} color="white" _hover={{ bg: '#00967f' }} onClick={handleSave} isLoading={isSaving}>
                  Guardar cambios
                </Button>
              </>
            ) : (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  colorScheme="teal"
                  leftIcon={<EyeStat size={14} />}
                  onClick={() => handleGoToMeasures(selectedPatient.id)}
                >
                  Ver Medidas
                </Button>
                <Button size="sm" bg={ACCENT} color="white" _hover={{ bg: '#00967f' }} leftIcon={<Pencil size={14} />} onClick={() => setIsEditing(true)}>
                  Editar
                </Button>
              </>
            )}
          </ModalFooter>
        </ModalContent>
      </Modal>

      <ConfirmDialog
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleConfirmDelete}
        title="¿Eliminar paciente?"
        body="Esta acción no se puede deshacer. ¿Está seguro de que desea eliminar este paciente?"
      />
    </Box>
  );
};

export default ListPatients;
