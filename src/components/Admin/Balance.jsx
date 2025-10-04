import { useState, useEffect } from "react";
import { 
  Box, Heading, Select, Table, Thead, Tbody, Tr, Th, Td, 
  Button, Input, useColorModeValue, HStack, Text, useToast 
} from "@chakra-ui/react";
import { supabase } from "../../api/supabase";
import { useNavigate } from "react-router-dom";
import { FaEye } from 'react-icons/fa';
import SmartHeader from "../header/SmartHeader";

const Balance = () => {
  const [records, setRecords] = useState([]);
  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState("");
  const [newAbonos, setNewAbonos] = useState({});
  const [paymentMethods, setPaymentMethods] = useState({});
  const navigate = useNavigate();
  const toast = useToast();

  useEffect(() => {
    fetchBranches();
  }, []);

  useEffect(() => {
    if (selectedBranch) {
      fetchAbonos(selectedBranch);
    }
  }, [selectedBranch]);

  const fetchBranches = async () => {
    const { data, error } = await supabase.from("branchs").select("id, name");
    if (!error) setBranches(data || []);
  };

  const fetchAbonos = async (branchId) => {
    const { data, error } = await supabase
      .from("sales")
      .select("id, date, branchs_id, total, credit, balance, payment_balance, patients (pt_firstname, pt_lastname), is_refund")
      .eq("branchs_id", branchId)
      .gt("credit", 0)
      .eq("is_refund", false);
            
    if (!error) {
      setRecords(data);
      setNewAbonos({});
      setPaymentMethods({});
    }
  };

  const handleAbonoChange = (id, value) => {
    setNewAbonos((prevState) => ({ ...prevState, [id]: value }));
  };

  const handlePaymentChange = (id, method) => {
    setPaymentMethods((prevState) => ({ ...prevState, [id]: method }));
  };

  const handleAbonoSubmit = async (record) => {
    const abono = parseFloat(newAbonos[record.id]) || 0;
    const paymentMethod = paymentMethods[record.id] || "";

    if (abono <= 0 || abono > record.credit) {
      toast({
        title: "Abono inválido",
        description: "El monto ingresado no es válido.",
        status: "warning",
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    if (!paymentMethod) {
      toast({
        title: "Método de pago requerido",
        description: "Seleccione un método de pago antes de continuar.",
        status: "warning",
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    const nuevoBalance = record.balance + abono;
    const nuevoCredito = record.credit - abono;

    try {
      const { error } = await supabase
        .from("sales")
        .update({ 
          balance: nuevoBalance, 
          credit: nuevoCredito,
          payment_balance: paymentMethod
        })
        .eq("id", record.id);

      if (error) throw error;

      fetchAbonos(selectedBranch);
      setNewAbonos((prevState) => ({ ...prevState, [record.id]: "" }));
      setPaymentMethods((prevState) => ({ ...prevState, [record.id]: "" }));

      toast({
        title: "Éxito",
        description: "El abono se registró correctamente.",
        status: "success",
        duration: 5000,
        isClosable: true,
      });
    } catch (error) {
      console.error("Error al actualizar el abono:", error);
      toast({
        title: "Error",
        description: "No se pudo registrar el abono. Inténtelo nuevamente.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const sortedPatients = [...records].sort((a, b) => {
    if (!a.date) return 1;
    if (!b.date) return -1;
    return new Date(b.date) - new Date(a.date);
  }); 

  const handleNavigate = (route = null) => {
    const user = JSON.parse(localStorage.getItem('user'));
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
      onClick={() => handleNavigate('/list-balance')} 
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
          Listar Abonos
        </Text>
      </HStack>
    </Button>
  );

  const textColor = useColorModeValue('gray.800', 'white');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const tableBg = useColorModeValue('white', 'gray.700');
  const tableHoverBg = useColorModeValue('gray.100', 'gray.600');
  const inputBg = useColorModeValue('white', 'gray.700');

    return (
     <Box p={{ base: 2, md: 8 }} minH="100vh" bg={useColorModeValue('gray.50', 'gray.900')}>
       <SmartHeader moduleSpecificButton={moduleSpecificButton} />
      <Box
        p={{ base: 4, md: 8 }}
        maxW="1600px"
        mx="auto"
        bg={useColorModeValue('gray.50', 'gray.800')}
        minH="100vh"
      >
        <Heading
          mb={6}
          textAlign="left"
          size="lg"
          fontWeight="extrabold"
          color={useColorModeValue('teal.700', 'teal.200')}
          letterSpacing="tight"
          pb={3}
        >
          Gestión de Abonos
        </Heading>
        <Box mb={6}>
          <Select
            placeholder="Seleccione una sucursal"
            value={selectedBranch}
            onChange={(e) => setSelectedBranch(e.target.value)}
            bg={inputBg}
            borderColor={borderColor}
            color={textColor}
            size="lg"
            borderRadius="md"
            shadow="sm"
            maxW="350px"
            _hover={{
              borderColor: useColorModeValue('teal.300', 'teal.500'),
              boxShadow: useColorModeValue('0 0 0 2px teal.100', '0 0 0 2px teal.700')
            }}
            _focus={{
              borderColor: useColorModeValue('teal.500', 'teal.300'),
              boxShadow: useColorModeValue('0 0 0 2px teal.200', '0 0 0 2px teal.600')
            }}
            transition="all 0.2s"
          >
            {branches.map((branch) => (
              <option key={branch.id} value={branch.id}>{branch.name}</option>
            ))}
          </Select>
        </Box>
        <Box
          overflowX="auto"
          borderRadius="lg"
          boxShadow="md"
          bg={tableBg}
          p={2}
        >
          <Table variant="simple" size="md">
            <Thead>
              <Tr bg={useColorModeValue('teal.50', 'teal.900')}>
                <Th color={textColor} borderColor={borderColor} fontWeight="bold">Fecha</Th>
                <Th color={textColor} borderColor={borderColor} fontWeight="bold">Nombre</Th>
                <Th color={textColor} borderColor={borderColor} fontWeight="bold">Total</Th>
                <Th color={textColor} borderColor={borderColor} fontWeight="bold">Abonos</Th>
                <Th color={textColor} borderColor={borderColor} fontWeight="bold">Saldo</Th>
                <Th color={textColor} borderColor={borderColor} fontWeight="bold">Nuevo Abono</Th>
                <Th color={textColor} borderColor={borderColor} fontWeight="bold">Método de Pago</Th>
                <Th color={textColor} borderColor={borderColor} fontWeight="bold">Acción</Th>
              </Tr>
            </Thead>
            <Tbody>
              {sortedPatients.map((record) => (
                <Tr
                  key={record.id}
                  _hover={{
                    bg: useColorModeValue('teal.100', 'teal.700'),
                    transition: 'background 0.2s'
                  }}
                  borderColor={borderColor}
                >
                  <Td color={textColor} borderColor={borderColor} fontSize="sm">{record.date}</Td>
                  <Td color={textColor} borderColor={borderColor} fontSize="sm">
                    <Text fontWeight="semibold">
                      {record.patients.pt_firstname} {record.patients.pt_lastname}
                    </Text>
                  </Td>
                  <Td color={textColor} borderColor={borderColor} fontSize="sm">
                    <Text fontWeight="medium" color="teal.600">${record.total}</Text>
                  </Td>
                  <Td color={textColor} borderColor={borderColor} fontSize="sm">
                    <Text color="green.500" fontWeight="bold">${record.balance}</Text>
                  </Td>
                  <Td color={textColor} borderColor={borderColor} fontSize="sm">
                    <Text color="red.500" fontWeight="bold">${record.credit}</Text>
                  </Td>
                  <Td color={textColor} borderColor={borderColor}>
                    <Input
                      type="number"
                      value={newAbonos[record.id] || ""}
                      onChange={(e) => handleAbonoChange(record.id, e.target.value)}
                      placeholder="Ingrese abono"
                      bg={inputBg}
                      borderColor={borderColor}
                      color={textColor}
                      size="sm"
                      borderRadius="md"
                      shadow="xs"
                      _hover={{
                        borderColor: useColorModeValue('teal.300', 'teal.500')
                      }}
                      _focus={{
                        borderColor: useColorModeValue('teal.500', 'teal.300'),
                        boxShadow: useColorModeValue('0 0 0 1px teal.300', '0 0 0 1px teal.600')
                      }}
                      transition="all 0.2s"
                    />
                  </Td>
                  <Td>
                    <Select
                      value={paymentMethods[record.id] || ""}
                      onChange={(e) => handlePaymentChange(record.id, e.target.value)}
                      bg={inputBg}
                      borderColor={borderColor}
                      color={textColor}
                      size="sm"
                      borderRadius="md"
                      shadow="xs"
                      _hover={{
                        borderColor: useColorModeValue('teal.300', 'teal.500')
                      }}
                      _focus={{
                        borderColor: useColorModeValue('teal.500', 'teal.300'),
                        boxShadow: useColorModeValue('0 0 0 1px teal.300', '0 0 0 1px teal.600')
                      }}
                      transition="all 0.2s"
                    >
                      <option value="">Seleccione</option>
                      <option value="efectivo">Efectivo</option>
                      <option value="datafast">Datafast</option>
                      <option value="transferencia">Transferencia</option>
                    </Select>
                  </Td>
                  <Td>
                    <Button
                      colorScheme="teal"
                      variant="solid"
                      size="sm"
                      borderRadius="md"
                      fontWeight="bold"
                      px={5}
                      shadow="sm"
                      _hover={{
                        bg: useColorModeValue('teal.600', 'teal.400'),
                        transform: 'scale(1.05)'
                      }}
                      transition="all 0.2s"
                      onClick={() => handleAbonoSubmit(record)}
                    >
                      Registrar
                    </Button>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </Box>
      </Box>
      </Box>
    );
};

export default Balance;
