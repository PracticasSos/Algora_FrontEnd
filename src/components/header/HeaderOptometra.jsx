import {
  Box,
  Flex,
  Text,
  Image,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  useColorModeValue,
  useDisclosure,
  IconButton,
  Stack,
  Collapse,
  Portal,
} from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import { HamburgerIcon, CloseIcon } from "@chakra-ui/icons";
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
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  // Colores adaptativos (mismo que HeaderAdmin)
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
          <Flex gap={6} align="center" display={{ base: "none", md: "flex" }}>
            <Text
              color={textColor}
              cursor="pointer"
              onClick={() => navigate("/")}
              _hover={{ color: textHoverColor }}
              fontWeight="medium"
            >
              Inicio
            </Text>
            <Text
              color={textColor}
              cursor="pointer"
              onClick={() => navigate("/PrintCertificate")}
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
          <Flex display={{ base: "none", md: "flex" }} gap={3} align="center" minW="100px" justify="flex-end">
            <ColorModeToggle />
            
            <Image
              src={iconocierrediario}
              w="45px"
              h="45px"
              objectFit="cover"
              objectPosition="bottom"
              borderRadius="full"
              cursor="pointer"
              onClick={() => navigate("/PatientRecords")}
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
                <MenuList zIndex="999999">
                  <MenuItem onClick={() => navigate("/MeasuresFinal")}>
                    Registrar Medidas
                  </MenuItem>
                  <MenuItem onClick={() => navigate("/HistoryMeasureList")}>
                    Historial de Medidas
                  </MenuItem>
                  <MenuItem onClick={handleLogout} color="red.500">
                    Cerrar Sesión
                  </MenuItem>
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
                                  navigate("/PatientRecords");
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
                                <MenuList zIndex="99999">
                                  <MenuItem
                                    onClick={() => {
                                      onToggle();
                                      navigate("/MeasuresFinal");
                                    }}
                                  >
                                    Registrar Medidas
                                  </MenuItem>
                                  <MenuItem
                                    onClick={() => {
                                      onToggle();
                                      navigate("/HistoryClinic");
                                    }}
                                  >
                                    Historial de Venta
                                  </MenuItem>
                                  <MenuItem
                                    onClick={() => {
                                      onToggle();
                                      navigate("HistoryMeasureList");
                                    }}
                                  >
                                    Historial de Medidas
                                  </MenuItem>
                                  <MenuItem onClick={handleLogout}>
                                Cerrar Sesión
                              </MenuItem>
                                </MenuList>
                              </Menu>
                            </Flex>
                            
                            <Text
                              color={textColor}
                              cursor="pointer"
                              onClick={() => {
                                onToggle();
                                navigate("/");
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
                                navigate("/PrintCertificate");
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