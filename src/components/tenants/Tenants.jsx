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
  useDisclosure,
  IconButton,
  HStack,
  VStack,
  Text,
  Card,
  CardBody,
  Divider,
  useColorModeValue,
  Flex,
  Spacer,
  Avatar,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Step,
  StepDescription,
  StepIcon,
  StepIndicator,
  StepNumber,
  StepSeparator,
  StepStatus,
  StepTitle,
  Stepper,
  useSteps,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  useColorMode
} from '@chakra-ui/react';
import { 
  FaPlus, 
  FaEdit, 
  FaTrash, 
  FaEllipsisV, 
  FaBuilding, 
  FaUser,
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
  
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose } = useDisclosure();
  
  // Separate state for edit modal
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  
  const [selectedTenant, setSelectedTenant] = useState(null);
  const toast = useToast();
  const { colorMode } = useColorMode();

  // Stepper for create modal
  const steps = [
    { title: 'Información del Tenant', description: 'Datos de la empresa' },
    { title: 'Usuario Administrador', description: 'Cuenta del admin' }
  ];
  const { activeStep, setActiveStep } = useSteps({
    index: 0,
    count: steps.length,
  });

  // Form data for create (original structure)
  const [tenantData, setTenantData] = useState({
    name: '',
    email: '',
    plan: 'basico',
    billing_cycle: 'mensual',
    next_billing_date: '',
    phone: '',
    address: ''
  });

  const [adminData, setAdminData] = useState({
    firstname: '',
    lastname: '',
    email: '',
    password: '',
    username: '',
    age: '',
    birthdate: '',
    ci: '',
    phone_number: ''
  });

  // Form data for edit (from second code)
  const [editFormData, setEditFormData] = useState({
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

      // Filters
      if (searchTerm) {
        query = query.or(`name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`);
      }
      
      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter === 'active');
      }
      
      if (planFilter !== 'all') {
        query = query.eq('plan', planFilter);
      }

      // Pagination
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

  // Original create function (unchanged)
  const handleCreateTenant = async () => {
    if (activeStep === 0) {
      // Validate step 1
      if (!tenantData.name || !tenantData.email) {
        toast({
          title: 'Error',
          description: 'Nombre y email del tenant son requeridos',
          status: 'error'
        });
        return;
      }
      setActiveStep(1);
      return;
    }

    // Step 2 - Create tenant with admin
    setLoading(true);
    try {
      // Validate step 2
      const requiredFields = ['firstname', 'lastname', 'email', 'password', 'username', 'ci', 'age'];
      const emptyFields = requiredFields.filter(field => !adminData[field]);
      
      if (emptyFields.length > 0) {
        toast({
          title: 'Error',
          description: `Los siguientes campos son requeridos: ${emptyFields.join(', ')}`,
          status: 'error'
        });
        return;
      }

      const { data, error } = await supabase.functions.invoke('create-tenant-with-admin', {
        body: {
          // Tenant data
          tenantName: tenantData.name,
          tenantEmail: tenantData.email,
          plan: tenantData.plan,
          billingCycle: tenantData.billing_cycle,
          nextBillingDate: tenantData.next_billing_date,
          phone: tenantData.phone,
          address: tenantData.address,
          // Admin user data
          ...adminData
        }
      });

      if (error) throw error;

      if (!data.success) {
        throw new Error(data.error || 'Error desconocido');
      }

      toast({
        title: 'Tenant creado exitosamente',
        description: `El tenant ${tenantData.name} y su administrador han sido creados.`,
        status: 'success'
      });

      // Reset form and close modal
      resetForm();
      onClose();
      loadTenants();

    } catch (error) {
      console.error('Error creating tenant:', error);
      toast({
        title: 'Error',
        description: error.message || 'Error al crear el tenant',
        status: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  // New edit functions (from second code)
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

      setEditFormData({
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
      if (!editFormData.name || !editFormData.email) {
        toast({
          title: 'Error',
          description: 'Nombre y email del tenant son requeridos',
          status: 'error'
        });
        setLoading(false);
        return;
      }

      const updateData = {
        name: editFormData.name,
        email: editFormData.email,
        plan: editFormData.plan,
        billing_cycle: editFormData.billing_cycle,
        phone: editFormData.phone || null,
        address: editFormData.address || null,
      };

      if (editFormData.next_billing_date) {
        updateData.next_billing_date = editFormData.next_billing_date;
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

  const resetForm = () => {
    setTenantData({
      name: '',
      email: '',
      plan: 'basico',
      billing_cycle: 'mensual',
      next_billing_date: '',
      phone: '',
      address: ''
    });
    setAdminData({
      firstname: '',
      lastname: '',
      email: '',
      password: '',
      username: '',
      age: '',
      birthdate: '',
      ci: '',
      phone_number: ''
    });
    setActiveStep(0);
  };

  const handleOpenModal = () => {
    resetForm();
    onOpen();
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
          onClick={handleOpenModal}
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

      {/* Create Tenant Modal (Original with stepper) */}
      <Modal isOpen={isOpen} onClose={onClose} size="2xl" closeOnOverlayClick={false}>
        <ModalOverlay />
        <ModalContent maxH="90vh" overflowY="auto">
          <ModalHeader>
            <VStack align="start" spacing={4}>
              <Text>Crear Nuevo Tenant</Text>
              <Box w="100%">
                <Stepper index={activeStep} colorScheme="teal" size="sm">
                  {steps.map((step, index) => (
                    <Step key={index}>
                      <StepIndicator>
                        <StepStatus
                          complete={<StepIcon />}
                          incomplete={<StepNumber />}
                          active={<StepNumber />}
                        />
                      </StepIndicator>
                      <Box flexShrink="0">
                        <StepTitle>{step.title}</StepTitle>
                        <StepDescription>{step.description}</StepDescription>
                      </Box>
                      <StepSeparator />
                    </Step>
                  ))}
                </Stepper>
              </Box>
            </VStack>
          </ModalHeader>
          <ModalCloseButton />
          
          <ModalBody>
            {activeStep === 0 ? (
              // Step 1: Tenant Information
              <VStack spacing={4} align="stretch">
                <HStack>
                  <FaBuilding color="teal" />
                  <Text fontWeight="semibold" color="teal.500">Información del Tenant</Text>
                </HStack>
                
                <FormControl isRequired>
                  <FormLabel>Nombre de la Empresa</FormLabel>
                  <Input
                    value={tenantData.name}
                    onChange={(e) => setTenantData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Óptica ABC"
                  />
                </FormControl>
                
                <FormControl isRequired>
                  <FormLabel>Email de Contacto</FormLabel>
                  <Input
                    type="email"
                    value={tenantData.email}
                    onChange={(e) => setTenantData(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="contacto@opticaabc.com"
                  />
                </FormControl>
                
                <HStack>
                  <FormControl>
                    <FormLabel>Plan</FormLabel>
                    <Select
                      value={tenantData.plan}
                      onChange={(e) => setTenantData(prev => ({ ...prev, plan: e.target.value }))}
                    >
                      <option value="basico">Básico</option>
                      <option value="intermedio">Intermedio</option>
                      <option value="premium">Premium</option>
                    </Select>
                  </FormControl>
                  
                  <FormControl>
                    <FormLabel>Ciclo de Facturación</FormLabel>
                    <Select
                      value={tenantData.billing_cycle}
                      onChange={(e) => setTenantData(prev => ({ ...prev, billing_cycle: e.target.value }))}
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
                    value={tenantData.next_billing_date}
                    onChange={(e) => setTenantData(prev => ({ ...prev, next_billing_date: e.target.value }))}
                  />
                </FormControl>
                
                <FormControl>
                  <FormLabel>Teléfono</FormLabel>
                  <Input
                    value={tenantData.phone}
                    onChange={(e) => setTenantData(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="+1234567890"
                  />
                </FormControl>
                
                <FormControl>
                  <FormLabel>Dirección</FormLabel>
                  <Input
                    value={tenantData.address}
                    onChange={(e) => setTenantData(prev => ({ ...prev, address: e.target.value }))}
                    placeholder="Calle Principal 123"
                  />
                </FormControl>
              </VStack>
            ) : (
              // Step 2: Admin User Information
              <VStack spacing={4} align="stretch">
                <HStack>
                  <FaUser color="teal" />
                  <Text fontWeight="semibold" color="teal.500">Usuario Administrador</Text>
                </HStack>
                
                <HStack>
                  <FormControl isRequired>
                    <FormLabel>Nombre</FormLabel>
                    <Input
                      value={adminData.firstname}
                      onChange={(e) => setAdminData(prev => ({ ...prev, firstname: e.target.value }))}
                    />
                  </FormControl>
                  <FormControl isRequired>
                    <FormLabel>Apellido</FormLabel>
                    <Input
                      value={adminData.lastname}
                      onChange={(e) => setAdminData(prev => ({ ...prev, lastname: e.target.value }))}
                    />
                  </FormControl>
                </HStack>
                
                <HStack>
                  <FormControl isRequired>
                    <FormLabel>Email</FormLabel>
                    <Input
                      type="email"
                      value={adminData.email}
                      onChange={(e) => setAdminData(prev => ({ ...prev, email: e.target.value }))}
                    />
                  </FormControl>
                  <FormControl isRequired>
                    <FormLabel>Nombre de Usuario</FormLabel>
                    <Input
                      value={adminData.username}
                      onChange={(e) => setAdminData(prev => ({ ...prev, username: e.target.value }))}
                    />
                  </FormControl>
                </HStack>
                
                <FormControl isRequired>
                  <FormLabel>Contraseña</FormLabel>
                  <Input
                    type="password"
                    value={adminData.password}
                    onChange={(e) => setAdminData(prev => ({ ...prev, password: e.target.value }))}
                  />
                </FormControl>
                
                <HStack>
                  <FormControl isRequired>
                    <FormLabel>Cédula</FormLabel>
                    <Input
                      value={adminData.ci}
                      onChange={(e) => setAdminData(prev => ({ ...prev, ci: e.target.value }))}
                    />
                  </FormControl>
                  <FormControl isRequired>
                    <FormLabel>Edad</FormLabel>
                    <Input
                      type="number"
                      value={adminData.age}
                      onChange={(e) => setAdminData(prev => ({ ...prev, age: e.target.value }))}
                    />
                  </FormControl>
                </HStack>
                
                <HStack>
                  <FormControl>
                    <FormLabel>Fecha de Nacimiento</FormLabel>
                    <Input
                      type="date"
                      value={adminData.birthdate}
                      onChange={(e) => setAdminData(prev => ({ ...prev, birthdate: e.target.value }))}
                    />
                  </FormControl>
                  <FormControl>
                    <FormLabel>Teléfono</FormLabel>
                    <Input
                      value={adminData.phone_number}
                      onChange={(e) => setAdminData(prev => ({ ...prev, phone_number: e.target.value }))}
                    />
                  </FormControl>
                </HStack>
              </VStack>
            )}
          </ModalBody>

          <ModalFooter>
            <HStack spacing={3}>
              {activeStep === 1 && (
                <Button
                  variant="ghost"
                  onClick={() => setActiveStep(0)}
                  leftIcon={<FaArrowLeft />}
                >
                  Anterior
                </Button>
              )}
              
              <Button variant="ghost" onClick={onClose}>
                Cancelar
              </Button>
              
              <Button
                colorScheme="teal"
                onClick={handleCreateTenant}
                isLoading={loading}
                loadingText={activeStep === 0 ? "Siguiente" : "Creando..."}
                rightIcon={activeStep === 0 ? <FaArrowRight /> : <FaCheck />}
              >
                {activeStep === 0 ? 'Siguiente' : 'Crear Tenant'}
              </Button>
            </HStack>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Edit Tenant Modal (From second code) */}
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
                  value={editFormData.name}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Óptica ABC"
                />
              </FormControl>
              
              <FormControl isRequired>
                <FormLabel>Email de Contacto</FormLabel>
                <Input
                  type="email"
                  value={editFormData.email}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="contacto@opticaabc.com"
                />
              </FormControl>
              
              <HStack>
                <FormControl>
                  <FormLabel>Plan</FormLabel>
                  <Select
                    value={editFormData.plan}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, plan: e.target.value }))}
                  >
                    <option value="basico">Básico</option>
                    <option value="intermedio">Intermedio</option>
                    <option value="premium">Premium</option>
                  </Select>
                </FormControl>
                
                <FormControl>
                  <FormLabel>Ciclo de Facturación</FormLabel>
                  <Select
                    value={editFormData.billing_cycle}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, billing_cycle: e.target.value }))}
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
                  value={editFormData.next_billing_date}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, next_billing_date: e.target.value }))}
                />
              </FormControl>
              
              <FormControl>
                <FormLabel>Teléfono</FormLabel>
                <Input
                  value={editFormData.phone}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="+1234567890"
                />
              </FormControl>
              
              <FormControl>
                <FormLabel>Dirección</FormLabel>
                <Input
                  value={editFormData.address}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, address: e.target.value }))}
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