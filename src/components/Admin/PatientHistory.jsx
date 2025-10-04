import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../../api/supabase';
import { Box, Button, Heading, Table, Thead, Tbody, Tr, Th, Td, Text, useColorModeValue, HStack, AlertDialog, useToast,
  AlertDialogOverlay,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogBody,
  AlertDialogFooter} from '@chakra-ui/react';
import { FaEye } from 'react-icons/fa';
import SmartHeader from '../header/SmartHeader';
import RefundButton from './rembolso/Refund';


  

const PatientHistory = () => {
  const location = useLocation();
  const selectedPatient = location.state?.patientData || null;
  const [sales, setSales] = useState([]);
    const [loadingDelete, setLoadingDelete] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const [selectedPatients, setSelectedPatient] = useState(null);
    const cancelRef = React.useRef();
    const user = JSON.parse(localStorage.getItem('user'));
    const toast = useToast();
  const navigate = useNavigate();


  useEffect(() => {
    if (selectedPatient) {
      fetchSales(selectedPatient.id);
    }
  }, [selectedPatient]);


  const fetchSales = async (patientId) => {
    const { data, error } = await supabase
      .from('sales')
      .select('id, date, inventario (brand), lens:lens_id(lens_type), total, credit, balance, payment_in, is_refund')
      .eq('patient_id', patientId);

    if (error) {
      console.error('Error fetching sales:', error);
    } else {
      setSales(data);
    }
  };

  const handlePatientSelect = (sale) => {
    const patientId = selectedPatient?.id;
    if (!patientId) {
      console.error('No patient selected');
      return;
    }
    navigate(`/history-clinic/patient-history/${patientId}/sales-history/${sale.id}`, {
      state: { saleData: sale },
    });
  };

  const confirmDelete = (patient) => {
      setSelectedPatient(patient);
      setIsOpen(true);
    };
  
    const handleDeleteSale = async () => {
    setLoadingDelete(true);
    // Eliminar la venta por su id
    const { error } = await supabase
      .from('sales')
      .delete()
      .match({ id: selectedPatients.id });

    setLoadingDelete(false);
    setIsOpen(false);

    if (error) {
      toast({
        title: 'Error al eliminar',
        description: error.message,
        status: 'error',
        duration: 4000,
        isClosable: true,
        position: 'center',
      });
    } else {
      // Actualizar el estado sales para quitar la venta eliminada
      setSales((prev) => prev.filter((sale) => sale.id !== selectedPatients.id));
      toast({
        title: 'Venta eliminada',
        description: 'La venta ha sido eliminada exitosamente',
        status: 'success',
        duration: 4000,
        isClosable: true,
        position: 'center',
      });
    }
  };

  const handleRefundUpdate = (saleId) => {
    setSales((prevSales) => 
      prevSales.map((sale) => sale.id === saleId ? { ...sale, is_refund: true } : sale)
    );
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

  const moduleSpecificButton = (
    <Button 
      onClick={() => handleNavigate('/history-clinic')} 
      bg={useColorModeValue(
        'rgba(255, 255, 255, 0.8)', 
        'rgba(255, 255, 255, 0.1)'
      )}
      backdropFilter="blur(10px)"
      border="1px solid"
      borderColor={useColorModeValue(
        'rgba(56, 178, 172, 0.3)', 
        'rgba(56, 178, 172, 0.5)'
      )}
      color={useColorModeValue('teal.600', 'teal.300')}
      size="sm"
      borderRadius="15px"
      px={4}
      _hover={{
        bg: useColorModeValue(
          'rgba(56, 178, 172, 0.1)', 
          'rgba(56, 178, 172, 0.2)'
        ),
        borderColor: 'teal.400',
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

  return (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      minHeight="100vh"
      bg={useColorModeValue('gray.50', 'gray.800')}
      px={2}
    >
      <SmartHeader moduleSpecificButton={moduleSpecificButton} />
      <Box
        w="90%"
        mb={6}
        bg={useColorModeValue('white', 'gray.700')}
        boxShadow="xl"
        borderRadius="2xl"
        p={6}
        mt={4}
      >
        <Heading
          mb={4}
          textAlign="left"
          size="lg"
          fontWeight="800"
          color={useColorModeValue('teal.700', 'teal.200')}
          pb={2}
          letterSpacing="tight"
        >
          Historial de Venta
        </Heading>
        <Box
          bg={useColorModeValue('teal.50', 'teal.900')}
          borderRadius="lg"
          px={6}
          py={4}
          mb={6}
          display="flex"
          alignItems="center"
          justifyContent="center"
        >
          {selectedPatient ? (
            <Text fontSize="xl" fontWeight="bold" color={useColorModeValue('teal.800', 'teal.100')}>
              {selectedPatient.pt_firstname} {selectedPatient.pt_lastname} -{' '}
              <Text as="span" color={useColorModeValue('teal.500', 'teal.200')}>
                {selectedPatient.pt_ci}
              </Text>
            </Text>
          ) : (
            <Text fontSize="xl" color="red.500">
              Error: No se seleccionó ningún paciente
            </Text>
          )}
        </Box>
        {selectedPatient && (
          <Box overflowX="auto" borderRadius="lg" boxShadow="md" bg={useColorModeValue('white', 'gray.800')}>
            <Table variant="striped" colorScheme="teal" minWidth="850px">
              <Thead>
                <Tr>
                  <Th fontWeight="bold" fontSize="md">Fecha</Th>
                  <Th fontWeight="bold" fontSize="md">Armazón</Th>
                  <Th fontWeight="bold" fontSize="md">Lentes</Th>
                  <Th fontWeight="bold" fontSize="md">Total</Th>
                  <Th fontWeight="bold" fontSize="md">Abono</Th>
                  <Th fontWeight="bold" fontSize="md">Saldo</Th>
                  <Th fontWeight="bold" fontSize="md">Pago En</Th>
                  <Th fontWeight="bold" fontSize="md">Reembolso</Th>
                  {user && user.role_id === 1 && <Th fontWeight="bold" fontSize="md">Acciones</Th>}
                </Tr>
              </Thead>
              <Tbody>
                {sales.length === 0 ? (
                  <Tr>
                    <Td colSpan={user && user.role_id === 1 ? 9 : 8}>
                      <Text textAlign="center" color="gray.400" py={6}>
                        No hay ventas registradas para este paciente.
                      </Text>
                    </Td>
                  </Tr>
                ) : (
                  sales.map((sale) => (
                    <Tr
                      key={sale.id}
                      onClick={() => handlePatientSelect(sale)}
                      _hover={{
                        bg: useColorModeValue('teal.100', 'teal.900'),
                        cursor: 'pointer',
                        transition: 'background 0.2s',
                      }}
                    >
                      <Td>{sale.date}</Td>
                      <Td>{sale.inventario?.brand ?? <Text color="gray.400">Sin marca</Text>}</Td>
                      <Td>{sale.lens?.lens_type ?? <Text color="gray.400">No especificado</Text>}</Td>
                      <Td>
                        <Text fontWeight="bold" color="teal.600">
                          {sale.total}
                        </Text>
                      </Td>
                      <Td>{sale.credit}</Td>
                      <Td>{sale.balance}</Td>
                      <Td>{sale.payment_in}</Td>
                      <Td>
                        <RefundButton sale={sale} onRefund={handleRefundUpdate} />
                      </Td>
                      {user && user.role_id === 1 && (
                        <Td>
                          <Button
                            size="sm"
                            colorScheme="red"
                            variant="outline"
                            isLoading={loadingDelete}
                            onClick={(e) => {
                              e.stopPropagation();
                              confirmDelete(sale);
                            }}
                            borderRadius="full"
                          >
                            Eliminar
                          </Button>
                        </Td>
                      )}
                    </Tr>
                  ))
                )}
              </Tbody>
            </Table>
          </Box>
        )}
      </Box>
      <AlertDialog
        isOpen={isOpen}
        leastDestructiveRef={cancelRef}
        onClose={() => setIsOpen(false)}
        isCentered
        motionPreset="slideInBottom"
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold" color="red.600">
              Confirmar eliminación
            </AlertDialogHeader>
            <AlertDialogBody>
              {selectedPatient &&
                `¿Seguro que deseas eliminar la venta de ${selectedPatient.pt_firstname} ${selectedPatient.pt_lastname}?`}
            </AlertDialogBody>
            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={() => setIsOpen(false)} variant="ghost">
                Cancelar
              </Button>
              <Button colorScheme="red" onClick={handleDeleteSale} ml={3} isLoading={loadingDelete}>
                Eliminar
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </Box>
  );
};

export default PatientHistory;
