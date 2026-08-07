import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { supabase } from '../../api/supabase';
import {
  Box, Button, Container, Heading, Table, Thead, Tbody, Tr, Th, Td, Text,
  useColorModeValue, HStack, VStack, Flex, Icon, Badge, Spinner, useToast,
  AlertDialog, AlertDialogOverlay, AlertDialogContent, AlertDialogHeader,
  AlertDialogBody, AlertDialogFooter,
} from '@chakra-ui/react';
import { ArrowLeft, Receipt, ShoppingBag } from 'lucide-react';
import SmartHeader from '../header/SmartHeader';
import RefundButton from './rembolso/Refund';
import { useAuth } from '../AuthContext';

const ACCENT = '#00A88E';

const formatMoney = (value) => {
  const n = parseFloat(value);
  if (isNaN(n)) return '$0.00';
  return `$${n.toLocaleString('es-EC', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const PatientHistory = () => {
  const location = useLocation();
  const { patientId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { user } = useAuth();
  const cancelRef = useRef();

  const [patient, setPatient] = useState(location.state?.patientData || null);
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingDelete, setLoadingDelete] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [saleToDelete, setSaleToDelete] = useState(null);

  useEffect(() => {
    if (!patientId) return;
    // Si no llegó el paciente por navegación (ej. recargaste la página o
    // entraste con un link directo), se busca igual por la URL — antes esta
    // pantalla se quedaba en blanco si faltaba ese estado.
    if (!patient) fetchPatient(patientId);
    fetchSales(patientId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patientId]);

  const fetchPatient = async (id) => {
    const { data, error } = await supabase.from('patients').select('*').eq('id', id).maybeSingle();
    if (!error) setPatient(data);
  };

  const fetchSales = async (id) => {
    setLoading(true);
    const { data, error } = await supabase
      .from('sales')
      .select('id, date, inventario (brand), lens:lens_id(lens_type), total, credit, balance, payment_in, is_refund')
      .eq('patient_id', id)
      .order('date', { ascending: false })
      .order('id', { ascending: false });

    if (error) {
      console.error('Error fetching sales:', error);
    } else {
      setSales(data || []);
    }
    setLoading(false);
  };

  const handleViewSale = (sale) => {
    navigate(`/history-clinic/patient-history/${patientId}/sales-history/${sale.id}`, {
      state: { saleData: sale },
    });
  };

  const confirmDelete = (sale) => {
    setSaleToDelete(sale);
    setIsOpen(true);
  };

  const handleDeleteSale = async () => {
    setLoadingDelete(true);
    const { error } = await supabase.from('sales').delete().match({ id: saleToDelete.id });
    setLoadingDelete(false);
    setIsOpen(false);

    if (error) {
      toast({ title: 'Error al eliminar', description: error.message, status: 'error', duration: 4000, isClosable: true });
    } else {
      setSales((prev) => prev.filter((s) => s.id !== saleToDelete.id));
      toast({ title: 'Venta eliminada', status: 'success', duration: 4000, isClosable: true });
    }
  };

  const handleRefundUpdate = (saleId) => {
    setSales((prev) => prev.map((s) => (s.id === saleId ? { ...s, is_refund: true } : s)));
  };

  const cardBg = useColorModeValue('white', 'gray.700');
  const inputBg = useColorModeValue('gray.50', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const subtitleColor = useColorModeValue('gray.500', 'gray.400');
  const rowHoverBg = useColorModeValue('gray.50', 'whiteAlpha.100');
  const isAdmin = user?.role_id === 1;

  return (
    <Box minHeight="100vh" bgGradient={useColorModeValue('linear(to-br, gray.50, teal.50)', 'linear(to-br, gray.900, #0d1f1c)')}>
      <SmartHeader moduleSpecificButton={null} />

      <Container maxW="1100px" py={8} px={{ base: 3, md: 6 }}>
        <Button
          size="sm"
          variant="ghost"
          leftIcon={<ArrowLeft size={16} />}
          mb={3}
          onClick={() => navigate('/history-clinic')}
        >
          Volver al historial
        </Button>

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
            <HStack spacing={3} mb={6}>
              <Flex
                align="center" justify="center" boxSize="44px" borderRadius="14px"
                bgGradient="linear(to-br, #00A88E, #00786A)" color="white"
                boxShadow="0 6px 16px -4px rgba(0,168,142,0.5)"
              >
                <Icon as={Receipt} boxSize="20px" />
              </Flex>
              <VStack align="start" spacing={0}>
                <Heading size="lg" fontWeight="800" color={useColorModeValue('gray.800', 'white')} letterSpacing="tight">
                  {patient ? `${patient.pt_firstname} ${patient.pt_lastname}` : 'Paciente'}
                </Heading>
                <Text fontSize="xs" color={subtitleColor}>
                  {patient?.pt_ci ? `C.I. ${patient.pt_ci} · ` : ''}{sales.length} venta{sales.length !== 1 ? 's' : ''} registrada{sales.length !== 1 ? 's' : ''}
                </Text>
              </VStack>
            </HStack>

            {loading ? (
              <Flex justify="center" py={16}>
                <Spinner color={ACCENT} />
              </Flex>
            ) : sales.length === 0 ? (
              <Text textAlign="center" color={subtitleColor} py={12}>
                Este paciente todavía no tiene ventas registradas.
              </Text>
            ) : (
              <Box overflowX="auto" borderRadius="14px" border={`1px solid ${borderColor}`}>
                <Table variant="simple" size="sm">
                  <Thead>
                    <Tr>
                      <Th color={subtitleColor}>Fecha</Th>
                      <Th color={subtitleColor}>Se llevó</Th>
                      <Th color={subtitleColor} textAlign="right">Total</Th>
                      <Th color={subtitleColor} textAlign="right">Abono</Th>
                      <Th color={subtitleColor} textAlign="right">Saldo</Th>
                      <Th color={subtitleColor}>Reembolso</Th>
                      {isAdmin && <Th color={subtitleColor} textAlign="right">Acciones</Th>}
                    </Tr>
                  </Thead>
                  <Tbody>
                    {sales.map((sale) => (
                      <Tr
                        key={sale.id}
                        cursor="pointer"
                        _hover={{ bg: rowHoverBg }}
                        onClick={() => handleViewSale(sale)}
                      >
                        <Td>{sale.date ? new Date(sale.date).toLocaleDateString('es-EC') : '—'}</Td>
                        <Td>
                          <HStack spacing={1} fontSize="xs" color={subtitleColor}>
                            <Icon as={ShoppingBag} boxSize="12px" />
                            <Text>
                              {sale.inventario?.brand || 'Sin armazón'} · {sale.lens?.lens_type || 'Sin luna'}
                            </Text>
                          </HStack>
                        </Td>
                        <Td textAlign="right" fontWeight="bold" color={ACCENT}>{formatMoney(sale.total)}</Td>
                        <Td textAlign="right">{formatMoney(sale.credit)}</Td>
                        <Td textAlign="right">
                          <Badge colorScheme={Number(sale.balance) > 0 ? 'orange' : 'teal'} borderRadius="full" px={2}>
                            {formatMoney(sale.balance)}
                          </Badge>
                        </Td>
                        <Td onClick={(e) => e.stopPropagation()}>
                          {sale.is_refund ? (
                            <Badge colorScheme="red" borderRadius="full" px={2}>Reembolsado</Badge>
                          ) : (
                            <RefundButton sale={sale} onRefund={handleRefundUpdate} />
                          )}
                        </Td>
                        {isAdmin && (
                          <Td textAlign="right" onClick={(e) => e.stopPropagation()}>
                            <Button
                              size="xs"
                              colorScheme="red"
                              variant="outline"
                              isLoading={loadingDelete && saleToDelete?.id === sale.id}
                              onClick={() => confirmDelete(sale)}
                              borderRadius="full"
                            >
                              Eliminar
                            </Button>
                          </Td>
                        )}
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              </Box>
            )}
          </Box>
        </Box>
      </Container>

      <AlertDialog isOpen={isOpen} leastDestructiveRef={cancelRef} onClose={() => setIsOpen(false)} isCentered>
        <AlertDialogOverlay>
          <AlertDialogContent borderRadius="16px">
            <AlertDialogHeader fontSize="lg" fontWeight="bold" color="red.500">
              Confirmar eliminación
            </AlertDialogHeader>
            <AlertDialogBody>
              ¿Seguro que deseas eliminar esta venta de {patient?.pt_firstname} {patient?.pt_lastname}? Esta acción no se puede deshacer.
            </AlertDialogBody>
            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={() => setIsOpen(false)} variant="ghost">
                Cancelar
              </Button>
              <Button colorScheme="red" onClick={handleDeleteSale} ml={3} isLoading={loadingDelete} borderRadius="10px">
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
