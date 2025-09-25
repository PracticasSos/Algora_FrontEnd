import { useNavigate } from "react-router-dom";
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  Heading,
  VStack,
  useToast,
  Select,
  useColorModeValue,
  Text,
  HStack,
  Divider,
  Flex,
} from "@chakra-ui/react";
import { useState, useEffect } from "react";
import { supabase } from "../../../api/supabase.js";
import { FaEye } from 'react-icons/fa';
import SmartHeader from "../../header/SmartHeader.jsx";

const Inventario = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const [branches, setBranches] = useState([]);
  const [formData, setFormData] = useState({
    brand: "",
    quantity: 0,
    price: 0,
    branchs_id: "",
  });

  useEffect(() => {
    const fetchBranches = async () => {
      const { data, error } = await supabase.from("branchs").select("id, name");
      if (error) {
        console.error("Error fetching branches:", error);
      } else {
        setBranches(data);
      }
    };
    fetchBranches();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { data, error } = await supabase.from("inventario").insert([formData]);

    if (error) {
      toast({
        title: "Error",
        description: "No se pudo registrar el inventario.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      console.error("Error:", error);
    } else {
      toast({
        title: "Éxito",
        description: "Inventario registrado correctamente.",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      setFormData({
        brand: "",
        quantity: 0,
        price: 0,
        branchs_id: "",
      });
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
  const moduleSpecificButton = (
    <Button 
      onClick={() => handleNavigate('/list-inventory')} 
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
          Listar Inventario
        </Text>
      </HStack>
    </Button>
  );

  const textColor = useColorModeValue('gray.800', 'white');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const selectBg = useColorModeValue('white', 'gray.700');

  return (
    <Box
      className="signup-form"
      display="flex"
      flexDirection="column"
      justifyContent="flex-start"
      alignItems="center"
      minHeight="100vh"
      pt={8}
      bg={useColorModeValue('gray.50', 'gray.900')}
    >
      <SmartHeader moduleSpecificButton={moduleSpecificButton} />

      <Box
        width="100%"
        maxWidth="480px"
        p={{ base: 4, md: 8 }}
        borderRadius="2xl"
        boxShadow="2xl"
        bg={useColorModeValue('white', 'gray.800')}
        mt={6}
      >
        <Heading
          mb={2}
          textAlign="center"
          size="lg"
          fontWeight="800"
          color={useColorModeValue('teal.600', 'teal.300')}
          letterSpacing="tight"
        >
          Inventario
        </Heading>
        <Text
          mb={4}
          textAlign="center"
          color={useColorModeValue('gray.500', 'gray.400')}
          fontSize="md"
        >
          Registra un nuevo producto en el inventario.
        </Text>
        <Divider mb={6} />

        <Box
          as="form"
          onSubmit={handleSubmit}
        >
          <VStack spacing={5}>
            <FormControl isRequired>
              <FormLabel color={useColorModeValue('gray.700', 'gray.200')}>Marca</FormLabel>
              <Input
                type="text"
                name="brand"
                value={formData.brand}
                onChange={handleChange}
                placeholder="Ingrese la marca"
                borderColor={borderColor}
                bg={useColorModeValue('gray.100', 'gray.700')}
                _focus={{ borderColor: "teal.500", bg: useColorModeValue('white', 'gray.800') }}
                _hover={{
                  borderColor: useColorModeValue('teal.400', 'teal.300'),
                  bg: useColorModeValue('white', 'gray.800')
                }}
                size="lg"
                borderRadius="md"
              />
            </FormControl>

            <FormControl isRequired>
              <FormLabel color={useColorModeValue('gray.700', 'gray.200')}>Cantidad</FormLabel>
              <Input
                type="number"
                name="quantity"
                value={formData.quantity}
                onChange={handleChange}
                placeholder="Ingrese la cantidad"
                borderColor={borderColor}
                bg={useColorModeValue('gray.100', 'gray.700')}
                _focus={{ borderColor: "teal.500", bg: useColorModeValue('white', 'gray.800') }}
                _hover={{
                  borderColor: useColorModeValue('teal.400', 'teal.300'),
                  bg: useColorModeValue('white', 'gray.800')
                }}
                size="lg"
                borderRadius="md"
                min={0}
              />
            </FormControl>

            <FormControl isRequired>
              <FormLabel color={useColorModeValue('gray.700', 'gray.200')}>Precio</FormLabel>
              <Input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleChange}
                placeholder="Ingrese el precio"
                borderColor={borderColor}
                bg={useColorModeValue('gray.100', 'gray.700')}
                _focus={{ borderColor: "teal.500", bg: useColorModeValue('white', 'gray.800') }}
                _hover={{
                  borderColor: useColorModeValue('teal.400', 'teal.300'),
                  bg: useColorModeValue('white', 'gray.800')
                }}
                size="lg"
                borderRadius="md"
                min={0}
              />
            </FormControl>

            <FormControl isRequired>
              <FormLabel color={useColorModeValue('gray.700', 'gray.200')}>Sucursal</FormLabel>
              <Select
                name="branchs_id"
                value={formData.branchs_id}
                onChange={handleChange}
                placeholder="Seleccione una sucursal"
                bg={selectBg}
                borderColor={borderColor}
                color={textColor}
                size="lg"
                borderRadius="md"
                _hover={{
                  borderColor: useColorModeValue('teal.400', 'teal.300'),
                  bg: useColorModeValue('white', 'gray.800')
                }}
                _focus={{
                  borderColor: useColorModeValue('teal.500', 'teal.300'),
                  boxShadow: useColorModeValue('0 0 0 1px teal.500', '0 0 0 1px teal.300')
                }}
              >
                {branches.map((branch) => (
                  <option
                    key={branch.id}
                    value={branch.id}
                    style={{
                      backgroundColor: useColorModeValue('white', '#2D3748'),
                      color: useColorModeValue('black', 'white')
                    }}
                  >
                    {branch.name}
                  </option>
                ))}
              </Select>
            </FormControl>
          </VStack>

          <Flex justify="center" mt={8}>
            <Button
              type="submit"
              width="60%"
              bgGradient="linear(to-r, teal.400, teal.600)"
              color="white"
              fontWeight="bold"
              fontSize="lg"
              _hover={{
                bgGradient: "linear(to-r, teal.500, teal.700)",
                boxShadow: "md"
              }}
              borderRadius="xl"
              boxShadow="sm"
              onClick={handleSubmit}
              py={6}
            >
              Registrar Inventario
            </Button>
          </Flex>
        </Box>
      </Box>
    </Box>
  );
};
export default Inventario;
