import { useState, useEffect } from 'react';
import { supabase } from '../../api/supabase';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  Select,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  useToast,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  IconButton,
  HStack,
  VStack,
  Text,
  Card,
  CardBody,
  useColorModeValue,
  Flex,
  Avatar,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  useColorMode
} from '@chakra-ui/react';
import { 
  FaPlus, 
  FaEdit, 
  FaEllipsisV, 
  FaCheck,
  FaTimes,
  FaArrowLeft,
  FaArrowRight
} from 'react-icons/fa';

const Tenants = () => {
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [planFilter, setPlanFilter] = useState('all');
  
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  
  const [selectedTenant, setSelectedTenant] = useState(null);
  const toast = useToast();
  const { colorMode } = useColorMode();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    plan: 'basico',
    billing_cycle: 'mensual',
    next_billing_date: '',
    phone: '',
    address: ''
  });

  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  // Load tenants
  useEffect(() => {
    loadTenants();
  }, [currentPage, searchTerm, statusFilter, planFilter]);

  const loadTenants = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('tenants')
        .select('*', { count: 'exact' });

      if (searchTerm) {
        query = query.or(`name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`);
      }
      
      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter === 'active');
      }
      
      if (planFilter !== 'all') {
        query = query.eq('plan', planFilter);
      }

      const itemsPerPage = 10;
      const from = (currentPage - 1) * itemsPerPage;
      const to = from + itemsPerPage - 1;
      
      query = query.range(from, to).order('created_at', { ascending: false });

      const { data, error, count } = await query;

      if (error) throw error;

      setTenants(data || []);
      setTotalPages(Math.ceil((count || 0) / itemsPerPage));
    } catch (error) {
      console.error('Error loading tenants:', error);
      toast({
        title: 'Error',
        description: 'Error al cargar los tenants',
        status: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  // Abrir modal con datos desde Supabase
  const handleOpenEditModal = async (tenant) => {
    try {
      console.log('Fetching tenant from Supabase:', tenant.id);

      const { data, error } = await supabase
        .from('tenants')
        .select('id, name, email, plan, billing_cycle, next_billing_date, phone, address, status')
        .eq('id', tenant.id)
        .single();

      if (error) throw error;

      setSelectedTenant(data);

      let formattedDate = '';
      if (data.next_billing_date) {
        const date = new Date(data.next_billing_date);
        formattedDate = date.toISOString().split('T')[0];
      }

      setFormData({
        name: data.name || '',
        email: data.email || '',
        plan: data.plan || 'basico',
        billing_cycle: data.billing_cycle || 'mensual',
        next_billing_date: formattedDate,
        phone: data.phone || '',
        address: data.address || ''
      });

      setIsEditModalOpen(true);
    } catch (err) {
      console.error('Error fetching tenant:', err);
      toast({
        title: 'Error',
        description: 'No se pudo cargar el tenant para editar',
        status: 'error'
      });
    }
  };

  const handleEditTenant = async () => {
    if (!selectedTenant) return;
    
    setLoading(true);
    try {
      if (!formData.name || !formData.email) {
        toast({
          title: 'Error',
          description: 'Nombre y email del tenant son requeridos',
          status: 'error'
        });
        setLoading(false);
        return;
      }

      const updateData = {
        name: formData.name,
        email: formData.email,
        plan: formData.plan,
        billing_cycle: formData.billing_cycle,
        phone: formData.phone || null,
        address: formData.address || null,
        updated_at: new Date().toISOString()
      };

      if (formData.next_billing_date) {
        updateData.next_billing_date = formData.next_billing_date;
      }

      const { error } = await supabase
        .from('tenants')
        .update(updateData)
        .eq('id', selectedTenant.id);

      if (error) throw error;

      toast({
        title: 'Tenant actualizado',
        description: 'Los datos del tenant se han actualizado exitosamente',
        status: 'success'
      });

      setIsEditModalOpen(false);
      setSelectedTenant(null);
      loadTenants();

    } catch (error) {
      console.error('Error updating tenant:', error);
      toast({
        title: 'Error',
        description: `Error al actualizar el tenant: ${error.message}`,
        status: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (tenant) => {
    try {
      const newStatus = !tenant.status;

      const { error } = await supabase
        .from('tenants')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', tenant.id);

      if (error) throw error;

      toast({
        title: 'Estado actualizado',
        description: `Tenant ${newStatus ? 'activado' : 'desactivado'} exitosamente`,
        status: 'success'
      });

      await loadTenants();

    } catch (error) {
      console.error('Error updating tenant status:', error);
      toast({
        title: 'Error',
        description: `Error al actualizar el estado del tenant: ${error.message}`,
        status: 'error'
      });
    }
  };

  const getPlanColor = (plan) => {
    switch (plan) {
      case 'basico': return 'blue';
      case 'intermedio': return 'orange';
      case 'premium': return 'purple';
      default: return 'gray';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'No definida';
    return new Date(dateString).toLocaleDateString('es-ES');
  };

  return (
    <Box p={6} maxW="7xl" mx="auto">
      {/* Header */}
      <Flex justify="space-between" align="center" mb={6}>
        <Box>
          <Text fontSize="2xl" fontWeight="bold" color={useColorModeValue('gray.800', 'white')}>
            Gestión de Tenants
          </Text>
          <Text color={useColorModeValue('gray.600', 'gray.400')}>
            Administra las cuentas de los clientes del sistema
          </Text>
        </Box>
        <Button
          leftIcon={<FaPlus />}
          colorScheme="teal"
          size="md"
          onClick={() => setIsCreateModalOpen(true)}
          borderRadius="10px"
          px={6}
        >
          Crear Tenant
        </Button>
      </Flex>

      {/* Filters */}
      <Card mb={6} bg={bgColor} borderColor={borderColor}>
        <CardBody>
          <Flex gap={4} align="end" wrap="wrap">
            <FormControl maxW="300px">
              <FormLabel fontSize="sm">Buscar</FormLabel>
              <Input
                placeholder="Nombre o email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                size="sm"
              />
            </FormControl>
            
            <FormControl maxW="150px">
              <FormLabel fontSize="sm">Estado</FormLabel>
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                size="sm"
              >
                <option value="all">Todos</option>
                <option value="active">Activos</option>
                <option value="inactive">Inactivos</option>
              </Select>
            </FormControl>
            
            <FormControl maxW="150px">
              <FormLabel fontSize="sm">Plan</FormLabel>
              <Select
                value={planFilter}
                onChange={(e) => setPlanFilter(e.target.value)}
                size="sm"
              >
                <option value="all">Todos</option>
                <option value="basico">Básico</option>
                <option value="intermedio">Intermedio</option>
                <option value="premium">Premium</option>
              </Select>
            </FormControl>
          </Flex>
        </CardBody>
      </Card>

      {/* Table */}
      <Card bg={bgColor} borderColor={borderColor}>
        <CardBody p={0}>
          <Table variant="simple">
            <Thead bg={useColorModeValue('gray.50', 'gray.700')}>
              <Tr>
                <Th>Tenant</Th>
                <Th>Plan</Th>
                <Th>Estado</Th>
                <Th>Próximo Cobro</Th>
                <Th>Fecha Creación</Th>
                <Th width="100px">Acciones</Th>
              </Tr>
            </Thead>
            <Tbody>
              {tenants.map((tenant) => (
                <Tr key={tenant.id}>
                  <Td>
                    <HStack>
                      <Avatar size="sm" name={tenant.name} bg="teal.500" />
                      <Box>
                        <Text fontWeight="medium">{tenant.name}</Text>
                        <Text fontSize="sm" color="gray.500">{tenant.email}</Text>
                      </Box>
                    </HStack>
                  </Td>
                  <Td>
                    <Badge colorScheme={getPlanColor(tenant.plan)} variant="subtle">
                      {tenant.plan?.toUpperCase()}
                    </Badge>
                  </Td>
                  <Td>
                    <Badge colorScheme={tenant.status ? 'green' : 'red'} variant="subtle">
                      {tenant.status ? 'Activo' : 'Inactivo'}
                    </Badge>
                  </Td>
                  <Td>
                    <Text fontSize="sm">{formatDate(tenant.next_billing_date)}</Text>
                  </Td>
                  <Td>
                    <Text fontSize="sm">{formatDate(tenant.created_at)}</Text>
                  </Td>
                  <Td>
                    <Menu>
                      <MenuButton
                        as={IconButton}
                        icon={<FaEllipsisV />}
                        variant="ghost"
                        size="sm"
                      />
                      <MenuList>
                        <MenuItem 
                          icon={<FaEdit />}
                          onClick={() => handleOpenEditModal(tenant)}
                        >
                          Editar
                        </MenuItem>
                        <MenuItem 
                          icon={tenant.status ? <FaTimes /> : <FaCheck />}
                          onClick={() => handleToggleStatus(tenant)}
                        >
                          {tenant.status ? 'Desactivar' : 'Activar'}
                        </MenuItem>
                      </MenuList>
                    </Menu>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
          
          {tenants.length === 0 && !loading && (
            <Box p={8} textAlign="center">
              <Text color="gray.500">No se encontraron tenants</Text>
            </Box>
          )}
        </CardBody>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <Flex justify="center" align="center" mt={6} gap={2}>
          <IconButton
            icon={<FaArrowLeft />}
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            isDisabled={currentPage === 1}
            size="sm"
            variant="ghost"
          />
          
          <Text fontSize="sm" px={4}>
            Página {currentPage} de {totalPages}
          </Text>
          
          <IconButton
            icon={<FaArrowRight />}
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            isDisabled={currentPage === totalPages}
            size="sm"
            variant="ghost"
          />
        </Flex>
      )}

      {/* Modal Edición */}
      <Modal 
        isOpen={isEditModalOpen} 
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedTenant(null);
        }} 
        size="xl"
      >
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            <HStack>
              <FaEdit color="teal" />
              <Text>Editar Tenant</Text>
              {selectedTenant && (
                <Text fontSize="sm" color="gray.500">
                  (ID: {selectedTenant.id.slice(0, 8)}...)
                </Text>
              )}
            </HStack>
          </ModalHeader>
          <ModalCloseButton />
          
          <ModalBody>
            <VStack spacing={4} align="stretch">
              <FormControl isRequired>
                <FormLabel>Nombre de la Empresa</FormLabel>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Óptica ABC"
                />
              </FormControl>
              
              <FormControl isRequired>
                <FormLabel>Email de Contacto</FormLabel>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="contacto@opticaabc.com"
                />
              </FormControl>
              
              <HStack>
                <FormControl>
                  <FormLabel>Plan</FormLabel>
                  <Select
                    value={formData.plan}
                    onChange={(e) => setFormData(prev => ({ ...prev, plan: e.target.value }))}
                  >
                    <option value="basico">Básico</option>
                    <option value="intermedio">Intermedio</option>
                    <option value="premium">Premium</option>
                  </Select>
                </FormControl>
                
                <FormControl>
                  <FormLabel>Ciclo de Facturación</FormLabel>
                  <Select
                    value={formData.billing_cycle}
                    onChange={(e) => setFormData(prev => ({ ...prev, billing_cycle: e.target.value }))}
                  >
                    <option value="mensual">Mensual</option>
                    <option value="anual">Anual</option>
                  </Select>
                </FormControl>
              </HStack>
              
              <FormControl>
                <FormLabel>Próxima Fecha de Cobro</FormLabel>
                <Input
                  type="date"
                  value={formData.next_billing_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, next_billing_date: e.target.value }))}
                />
              </FormControl>
              
              <FormControl>
                <FormLabel>Teléfono</FormLabel>
                <Input
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="+1234567890"
                />
              </FormControl>
              
              <FormControl>
                <FormLabel>Dirección</FormLabel>
                <Input
                  value={formData.address}
                  onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                  placeholder="Calle Principal 123"
                />
              </FormControl>
            </VStack>
          </ModalBody>

          <ModalFooter>
            <HStack spacing={3}>
              <Button 
                variant="ghost" 
                onClick={() => {
                  setIsEditModalOpen(false);
                  setSelectedTenant(null);
                }}
              >
                Cancelar
              </Button>
              
              <Button
                colorScheme="teal"
                onClick={handleEditTenant}
                isLoading={loading}
                loadingText="Actualizando..."
                leftIcon={<FaCheck />}
              >
                Actualizar Tenant
              </Button>
            </HStack>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default Tenants;
