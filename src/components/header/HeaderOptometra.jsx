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
} from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import { 
  HamburgerIcon, 
  CloseIcon,
  ViewIcon,
  ChevronRightIcon,
} from "@chakra-ui/icons";
import { 
  FiUser,
  FiClipboard,
  FiActivity,
  FiLogOut,
} from 'react-icons/fi';
import ColorModeToggle from '../../Toggle';
import { useAuth } from '../AuthContext';
import iconocierrediario from "../../assets/iconocierrediario.png";
import avataralgora from "../../assets/avataralgora.jpg";

const HeaderOptometra = ({ moduleSpecificButton = null }) => {
  const navigate = useNavigate();
  const { isOpen, onToggle } = useDisclosure();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login-form");
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  // Datos del usuario
  const userData = {
    name: user?.user_metadata?.firstname || user?.firstname || "Usuario",
    lastName: user?.user_metadata?.lastname || user?.lastname || "Optometra", 
    email: user?.email || "optometra@algora.com",
    role: user?.role_name || "Optometra",
    title: user?.user_metadata?.title || user?.title || null,
    tenant_id: user?.tenant_id,
    role_id: user?.role_id,
    allowed_routes: user?.allowed_routes || []
  };

  // Colores adaptativos
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
  const collapseBg = useColorModeValue('white', 'black');
  const borderTopColor = useColorModeValue(
    'rgba(0,0,0,0.1)',
    'rgba(255,255,255,0.1)'
  );

  const menuBg = useColorModeValue('white', 'gray.700');
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
          {/* Lado izquierdo - Botón específico del módulo O logo ALGORA */}
          <Box minW="100px">
            {moduleSpecificButton ? (
              <Box display="flex" alignItems="center" height="40px">
                {moduleSpecificButton}
              </Box>
            ) : (
              <Text
                fontSize="xl"
                fontFamily="Satoshi, sans-serif"
                fontWeight="bold"
                color={textColor}
              >
                ALGORA
              </Text>
            )}
          </Box>

          {/* Centro - Menú de navegación (específico para Optometra) */}
          <Flex gap={24} align="center" display={{ base: "none", md: "flex" }}>
            <Text
              color={textColor}
              cursor="pointer"
              onClick={() => navigate("/optometra")}
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

          {/* Lado derecho - Íconos */}
          <Flex display={{ base: "none", md: "flex" }} gap={8} align="center" minW="100px" justify="flex-end" mt={4}>
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
                          colorScheme="blue" 
                          size="sm"
                          borderRadius="full"
                          px={2}
                        >
                          {userData.role}
                        </Badge>
                      </VStack>
                    </HStack>
                  </Box>

                  {/* Opciones principales para Optometra */}
                  <Box py={2}>
                    <MenuItemCustom 
                      icon={<FiUser />}
                      onClick={() => navigate("/register-patient")}
                    >
                      Registrar Paciente
                    </MenuItemCustom>
                    
                    <MenuItemCustom 
                      icon={<FiClipboard />}
                      onClick={() => navigate("/measures-final")}
                    >
                      Registrar Medidas
                    </MenuItemCustom>
                    
                    <MenuItemCustom 
                      icon={<ViewIcon />}
                      onClick={() => navigate("/history-measure-list")}
                    >
                      Historial de Medidas
                    </MenuItemCustom>
                    
                    <MenuItemCustom 
                      icon={<FiActivity />}
                      onClick={() => navigate("/history-clinic")}
                    >
                      Historial de Venta
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
                            colorScheme="blue" 
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
                        icon={<FiClipboard />}
                        onClick={() => {
                          onToggle();
                          navigate("/measures-final");
                        }}
                      >
                        Registrar Medidas
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
                      
                      <MenuItemCustom 
                        icon={<FiActivity />}
                        onClick={() => {
                          onToggle();
                          navigate("/history-clinic");
                        }}
                      >
                        Historial de Venta
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
                  navigate("/optometra");
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
  );
};

export default HeaderOptometra;