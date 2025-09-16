import React, { useState } from "react";
import {
  Box,
  Flex,
  Text,
  Image,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  MenuDivider,
  Button,
  useColorModeValue,
  useDisclosure,
  IconButton,
  Stack,
  Collapse,
  Portal,
  Avatar,
  VStack,
  HStack,
  Badge,
} from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext";
import { 
  HamburgerIcon, 
  CloseIcon,
  ViewIcon,
  ChevronRightIcon,
} from "@chakra-ui/icons";
import { 
  FiUser,
  FiShoppingCart,
  FiClipboard,
  FiDollarSign,
  FiPackage,
  FiActivity,
  FiLogOut,
  FiEye,
} from 'react-icons/fi';
import ColorModeToggle from "../../Toggle";

import iconocertificadovisual from "../../assets/iconocertificadovisual.png";
import iconocierrediario from "../../assets/iconocierrediario.png";
import iconoconsultarcierre from "../../assets/iconoconsultarcierre.png";
import iconocreditos from "../../assets/iconocreditos.png";
import iconoegresos from "../../assets/iconoegresos.png";
import iconoenvios from "../../assets/iconoenvios.png";
import iconoexperienciausuario from "../../assets/iconoexperienciausuario.png";
import iconohistorialmedidas from "../../assets/iconohistorialmedidas.png";
import iconohistorialventa from "../../assets/iconohistorialventa.png";
import iconoinventario from "../../assets/iconoinventario.png";
import iconolaboratorios from "../../assets/iconolaboratorios.png";
import iconolunas from "../../assets/iconolunas.png";
import iconomedidas from "../../assets/iconomedidas.png";
import iconomensajes from "../../assets/iconomensajes.png";
import iconoordenlaboratorio from "../../assets/iconoordenlaboratorio.png";
import iconoregistrar from "../../assets/iconoregistrar.png";
import iconoretiros from "../../assets/iconoretiros.png";
import iconossaldos from "../../assets/iconossaldos.png";
import iconosucursal from "../../assets/iconosucursal.png";
import iconousuarios from "../../assets/iconousuarios.png";
import iconoventa from "../../assets/iconoventa.png";
import avataralgora from "../../assets/avataralgora.jpg";

const defaultOptions = [
  { label: "Registrar Paciente", icon: iconoregistrar, route: "/register-patient" },
  { label: "Venta/ Contrato de Servicio", icon: iconoventa, route: "/sales" },
  { label: "Orden de Laboratorio", icon: iconoordenlaboratorio, route: "/order-laboratory-list" },
  { label: "Retiros", icon: iconoretiros, route: "/retreats-patients" },
  { label: "Experiencia", icon: iconoexperienciausuario, route: "/register-experience" },
  { label: "Historial de Ventas", icon: iconohistorialventa, route: "/history-clinic" },
  { label: "Cierre", icon: iconocierrediario, route: "/patient-records" },
  { label: "Saldos", icon: iconossaldos, route: "/balances-patient" },
  { label: "Egresos", icon: iconoegresos, route: "/egresos" },
  { label: "Registrar Medidas", icon: iconomedidas, route: "/measures-final" },
  { label: "Créditos", icon: iconocreditos, route: "/balance" },
  { label: "Inventario", icon: iconoinventario, route: "/inventory" },
  { label: "Historial de Medidas", icon: iconohistorialmedidas, route: "/history-measure-list" },
  { label: "Registrar Lunas", icon: iconolunas, route: "/register-lens" },
];

const extraRouters = [
  { label: "Usuarios", icon: iconousuarios, route: "/register" },
  { label: "Laboratorios", icon: iconolaboratorios, route: "/labs" },
  { label: "Sucursal", icon: iconosucursal, route: "/branch" },
  { label: "Consultar Cierre", icon: iconoconsultarcierre, route: "/cash-closure" },
  { label: "Imprimir Certificado", icon: iconocertificadovisual, route: "/print-certificate" },
];

const VendedorDashBoard = () => {
  const [showAll, setShowAll] = useState(false);
  const navigate = useNavigate();
  const { isOpen, onToggle } = useDisclosure();
  const { user, loading: authLoading, logout } = useAuth();

  if (authLoading) return null;
  if (!user) return null;

  // Datos del usuario
  const userData = {
    name: user?.user_metadata?.firstname || user?.firstname || "Usuario",
    lastName: user?.user_metadata?.lastname || user?.lastname || "Vendedor", 
    email: user?.email || "vendedor@algora.com",
    role: user?.role_name || "Vendedor",
    title: user?.user_metadata?.title || user?.title || null,
    tenant_id: user?.tenant_id,
    role_id: user?.role_id,
    allowed_routes: user?.allowed_routes || []
  };

  // Filtrar opciones basado en permisos
  const allowedRoutes = user.allowed_routes || [];
  const allOptions = [...defaultOptions, ...extraRouters];
  const availableOptions =
    allowedRoutes.length > 0
      ? allOptions.filter((option) => allowedRoutes.includes(option.route))
      : allOptions;

  const carouselItems = availableOptions.slice(0, 5);
  const moreItems = availableOptions.slice(5);

  const handleOptionClick = (route) => {
    if (route) navigate(route);
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login-form");
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
    }
  };

  // Colores adaptativos
  const mainBg = useColorModeValue(
    'linear(to-b, #f7fafc, #edf2f7)',
    '#000000'
  );

  const navBg = useColorModeValue(
    'rgba(255, 255, 255, 0.9)',
    'rgba(46, 46, 46, 0.5)'
  );

  const navBorder = useColorModeValue(
    '1px solid rgba(0,0,0,0.1)',
    '1px solid rgba(255,255,255,0.1)'
  );

  const textColor = useColorModeValue('gray.800', 'white');
  const textHoverColor = useColorModeValue('#2196f3', '#00E599');
  const cardBg = useColorModeValue('rgba(207, 202, 202, 0.5)', 'rgba(83, 81, 81, 0.5)');
  const cardBorder = useColorModeValue('2px solid #219BAA', '2px solid #219BAA');
  const collapseBg = useColorModeValue('white', 'black');
  const borderTopColor = useColorModeValue('rgba(0,0,0,0.1)', 'rgba(255,255,255,0.1)');
  const buttonBg = useColorModeValue('gray.300', 'whiteAlpha.200');
  const buttonBorderColor = useColorModeValue('gray.600', 'whiteAlpha.300');
  const buttonTextColor = useColorModeValue('gray.800', 'white');
  const buttonHoverBg = useColorModeValue('gray.200', 'whiteAlpha.300');
  const menuBg = useColorModeValue('white', 'gray.800');
  const menuBorder = useColorModeValue('gray.200', 'gray.600');
  const subtitleColor = useColorModeValue('gray.500', 'gray.400');

  const MenuItemCustom = ({ icon, children, onClick, color = textColor }) => (
    <MenuItem
      onClick={onClick}
      color={color}
      _hover={{ 
        bg: useColorModeValue('gray.50', 'gray.700'),
        transform: 'translateX(2px)'
      }}
      transition="all 0.2s"
      py={3}
      px={4}
    >
      <HStack spacing={3} width="100%">
        <Box color={color} fontSize="18px">
          {icon}
        </Box>
        <Text fontWeight="medium">{children}</Text>
        <Box ml="auto" color={subtitleColor}>
          <ChevronRightIcon />
        </Box>
      </HStack>
    </MenuItem>
  );

  return (
    <Box
      bg={mainBg}
      minH="100vh"
    >
      <Box
        as="nav"
        width="100%"
        zIndex="9999"
        pt="1rem"
        pb="1rem"
        display="flex"
        justifyContent="center"
      >
        <Box
          width="80%"
          bg={navBg}
          backdropFilter="blur(10px)"
          border={navBorder}
          borderRadius="20px"
        >
          <Flex
            align="center"
            justify="space-between"
            py={3}
            px={6}
            fontFamily="Satoshi, sans-serif"
            minH="60px"
          >
            {/* Logo ALGORA */}
            <Text
              fontSize="xl"
              fontFamily="Satoshi, sans-serif"
              fontWeight="bold"
              color={textColor}
            >
              ALGORA
            </Text>

            <Flex gap={24} align="center" display={{ base: "none", md: "flex" }}>
              <Text
                color={textColor}
                cursor="pointer"
                onClick={() => navigate("/vendedor")}
                _hover={{ color: textHoverColor }}
                fontWeight="medium"
              >
                Inicio
              </Text>
              <Text
                color={textColor}
                cursor="pointer"
                onClick={() => navigate("/print-certificate")}
                _hover={{ color: textHoverColor }}
                fontWeight="medium"
              >
                Certificado
              </Text>
              <Text
                color={textColor}
                cursor="pointer"
                onClick={() => navigate("/egresos")}
                _hover={{ color: textHoverColor }}
                fontWeight="medium"
              >
                Egresos
              </Text>
            </Flex>

            {/* Desktop: íconos a la derecha */}
            <Flex display={{ base: "none", md: "flex" }} gap={8} align="center" justify="center" mt={4}>
              <ColorModeToggle />
              
              <Image
                src={iconocierrediario}
                w="45px"
                h="45px"
                objectFit="cover"
                objectPosition="bottom"
                borderRadius="full"
                cursor="pointer"
                onClick={() => navigate("/patient-records")}
                border="2px solid #50bcd8"
              />
              <Menu>
                <MenuButton>
                  <Image
                    src={avataralgora}
                    w="45px"
                    h="45px"
                    borderRadius="full"
                    cursor="pointer"
                    border="2px solid #50bcd8"
                    _hover={{ opacity: 0.8 }}
                  />
                </MenuButton>
                <Portal>
                <MenuList 
                   zIndex="999999"
                   bg={menuBg}
                   border={`1px solid ${menuBorder}`}
                   borderRadius="12px"
                   boxShadow="lg"
                   minW="280px"
                   p={0}
                >
                  {/* Header del usuario */}
                  <Box p={4} borderBottom={`1px solid ${menuBorder}`}>
                    <HStack spacing={3}>
                      <Avatar 
                        src={avataralgora}
                        size="md"
                        border="2px solid #50bcd8"
                      />
                      <VStack align="start" spacing={1} flex={1}>
                        <Text fontWeight="bold" fontSize="md" color={textColor}>
                          {userData.name} {userData.lastName}
                        </Text>
                        <Text fontSize="sm" color={subtitleColor}>
                          {userData.email}
                        </Text>
                        <Badge 
                          colorScheme="purple" 
                          size="sm"
                          borderRadius="full"
                          px={2}
                        >
                          {userData.role}
                        </Badge>
                      </VStack>
                    </HStack>
                  </Box>

                  {/* Opciones principales para Vendedor */}
                  <Box py={2}>
                    <MenuItemCustom 
                      icon={<FiUser />}
                      onClick={() => navigate("/register-patient")}
                    >
                      Registrar Paciente
                    </MenuItemCustom>
                    
                    <MenuItemCustom 
                      icon={<FiShoppingCart />}
                      onClick={() => navigate("/sales")}
                    >
                      Venta/Contrato
                    </MenuItemCustom>
                    
                    <MenuItemCustom 
                      icon={<FiClipboard />}
                      onClick={() => navigate("/order-laboratory-list")}
                    >
                      Orden de Laboratorio
                    </MenuItemCustom>
                    
                    <MenuItemCustom 
                      icon={<FiActivity />}
                      onClick={() => navigate("/history-clinic")}
                    >
                      Historial de Ventas
                    </MenuItemCustom>
                    
                    <MenuItemCustom 
                      icon={<FiDollarSign />}
                      onClick={() => navigate("/balances-patient")}
                    >
                      Saldos
                    </MenuItemCustom>
                  </Box>

                  <MenuDivider />
                  
                  {/* Consultas adicionales */}
                  <Box py={2}>
                    <MenuItemCustom 
                      icon={<FiPackage />}
                      onClick={() => navigate("/inventory")}
                    >
                      Inventario
                    </MenuItemCustom>
                    
                    <MenuItemCustom 
                      icon={<FiEye />}
                      onClick={() => navigate("/register-lens")}
                    >
                      Registrar Lunas
                    </MenuItemCustom>
                    
                    <MenuItemCustom 
                      icon={<ViewIcon />}
                      onClick={() => navigate("/history-measure-list")}
                    >
                      Historial de Medidas
                    </MenuItemCustom>
                  </Box>

                  <MenuDivider />
                  
                  {/* Cerrar sesión */}
                  <Box py={2}>
                    <MenuItemCustom 
                      icon={<FiLogOut />}
                      onClick={handleLogout}
                      color="red.500"
                    >
                      Cerrar Sesión
                    </MenuItemCustom>
                  </Box>
                </MenuList>
                </Portal>
              </Menu>
            </Flex>

            {/* Móvil: botón hamburguesa y toggle */}
            <Flex display={{ base: "flex", md: "none" }} align="center" gap={2}>
              <ColorModeToggle />
              <IconButton
                aria-label="Abrir menú"
                icon={isOpen ? <CloseIcon /> : <HamburgerIcon />}
                onClick={onToggle}
                variant="ghost"
                color={textColor}
              />
            </Flex>
          </Flex>

          <Collapse in={isOpen} animateOpacity>
            <Flex
              direction="column"
              align="center"
              bg={collapseBg}
              px={4}
              py={4}
              borderBottomRadius="12px"
              borderTop={`1px solid ${borderTopColor}`}
              display={{ md: "none" }}
            >
              <Stack spacing={3} align="center" width="100%">
                <Flex gap={4} justify="flex-end" pt={3}>
                  <Image
                    src={iconocierrediario}
                    w="40px"
                    h="40px"
                    borderRadius="full"
                    cursor="pointer"
                    onClick={() => {
                      onToggle();
                      navigate("/patient-records");
                    }}
                    border="2px solid #50bcd8"
                  />

                  <Menu>
                    <MenuButton>
                      <Image
                        src={avataralgora}
                        w="40px"
                        h="40px"
                        borderRadius="full"
                        cursor="pointer"
                        border="2px solid #50bcd8"
                        _hover={{ opacity: 0.8 }}
                      />
                    </MenuButton>
                    <Portal>
                    <MenuList 
                      zIndex="99999"
                      bg={menuBg}
                      border={`1px solid ${menuBorder}`}
                      borderRadius="12px"
                      boxShadow="lg"
                      minW="280px"
                      p={0}
                    >
                      {/* Header del usuario - versión móvil */}
                      <Box p={4} borderBottom={`1px solid ${menuBorder}`}>
                        <HStack spacing={3}>
                          <Avatar 
                            src={avataralgora}
                            size="sm"
                            border="2px solid #50bcd8"
                          />
                          <VStack align="start" spacing={1} flex={1}>
                            <Text fontWeight="bold" fontSize="sm" color={textColor}>
                              {userData.name} {userData.lastName}
                            </Text>
                            <Text fontSize="xs" color={subtitleColor}>
                              {userData.email}
                            </Text>
                            <Badge 
                              colorScheme="purple" 
                              size="sm"
                              borderRadius="full"
                              px={2}
                            >
                              {userData.role}
                            </Badge>
                          </VStack>
                        </HStack>
                      </Box>

                      {/* Opciones para móvil */}
                      <Box py={2}>
                        <MenuItemCustom 
                          icon={<FiUser />}
                          onClick={() => {
                            onToggle();
                            navigate("/register-patient");
                          }}
                        >
                          Registrar Paciente
                        </MenuItemCustom>
                        
                        <MenuItemCustom 
                          icon={<FiShoppingCart />}
                          onClick={() => {
                            onToggle();
                            navigate("/sales");
                          }}
                        >
                          Venta/Contrato
                        </MenuItemCustom>
                        
                        <MenuItemCustom 
                          icon={<FiActivity />}
                          onClick={() => {
                            onToggle();
                            navigate("/history-clinic");
                          }}
                        >
                          Historial de Ventas
                        </MenuItemCustom>
                        
                        <MenuItemCustom 
                          icon={<ViewIcon />}
                          onClick={() => {
                            onToggle();
                            navigate("/history-measure-list");
                          }}
                        >
                          Historial de Medidas
                        </MenuItemCustom>
                      </Box>

                      <MenuDivider />
                      
                      <Box py={2}>
                        <MenuItemCustom 
                          icon={<FiLogOut />}
                          onClick={handleLogout}
                          color="red.500"
                        >
                          Cerrar Sesión
                        </MenuItemCustom>
                      </Box>
                    </MenuList>
                    </Portal>
                  </Menu>
                </Flex>
                
                <Text
                  color={textColor}
                  cursor="pointer"
                  onClick={() => {
                    onToggle();
                    navigate("/vendedor");
                  }}
                  _hover={{ color: textHoverColor }}
                >
                  Inicio
                </Text>
                <Text
                  color={textColor}
                  cursor="pointer"
                  onClick={() => {
                    onToggle();
                    navigate("/print-certificate");
                  }}
                  _hover={{ color: textHoverColor }}
                >
                  Certificado
                </Text>
                <Text
                  color={textColor}
                  cursor="pointer"
                  onClick={() => {
                    onToggle();
                    navigate("/egresos");
                  }}
                  _hover={{ color: textHoverColor }}
                >
                  Egresos
                </Text>
              </Stack>
            </Flex>
          </Collapse>
        </Box>
      </Box>

      {/* ZONA CENTRAL */}
      <Flex
        direction="column"
        align="center"
        py={[8, 10]}
        px={[4, 6, 8]}
        mt={8}
        textAlign="center"
      >
        {/* Tarjetas */}
        <Flex
          justify="center"
          align="center"
          flexWrap="wrap"
          gap={6}
          mb={10}
        >
          {(showAll ? moreItems : carouselItems).map((option, index) => (
            <Box
              key={index}
              borderRadius="xl"
              boxShadow="lg"
              bg={cardBg}
              border={cardBorder}
              overflow="hidden"
              w={["140px", "160px", "180px"]}
              h={["220px", "240px", "260px"]}
              display="flex"
              alignItems="center"
              justifyContent="center"
              transition="0.3s"
              _hover={{ transform: 'scale(1.15)', cursor: 'pointer' }}
              onClick={() => handleOptionClick(option.route)}
              position="relative"
              flexDirection="column"
            >
              <Image
                src={option.icon}
                alt={option.label}
                w="60%"
                h="60%"
                objectFit="contain"
              />
              <Text
                fontSize={["xs", "sm", "md"]}
                fontWeight="bold"
                textAlign="center"
                color={useColorModeValue('#2D3748', '#E2E8F0')}
                px={2}
                lineHeight="tight"
                noOfLines={2}
                sx={{
                  fontSize: {
                    base: '10px',
                    sm: '11px',
                    md: '12px'
                  }
                }}
              >
                {option.label}
              </Text>
            </Box>
          ))}
        </Flex>

        {/* Botón Ver más - Solo mostrar si hay más elementos */}
        {moreItems.length > 0 && (
          <Button
            bg={buttonBg}
            border={`2px solid ${buttonBorderColor}`}
            color={buttonTextColor}
            variant="outline"
            size="lg"
            borderRadius="full"
            onClick={() => setShowAll(!showAll)}
            _hover={{ 
              bg: buttonHoverBg,
              transform: 'scale(1.05)'
            }}
            fontWeight="medium"
          >
           {showAll ? "Anterior" : "Siguiente"}
          </Button>
        )}
      </Flex>
    </Box>
  );
};

export default VendedorDashBoard;