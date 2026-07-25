import { useState } from "react";
import {
  Box,
  Flex,
  Text,
  Image,
  Button,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  MenuDivider,
  useColorModeValue,
  useDisclosure,
  IconButton,
  Portal,
  Avatar,
  VStack,
  HStack,
  Badge,
  Drawer,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  DrawerHeader,
  DrawerBody,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
} from "@chakra-ui/react";
import { useNavigate, useLocation } from "react-router-dom";
import { HamburgerIcon, ChevronDownIcon } from "@chakra-ui/icons";
import { FiLogOut, FiMoreHorizontal } from "react-icons/fi";
import ColorModeToggle from "../../Toggle";
import { useAuth } from "../AuthContext";
import avataralgora from "../../assets/avataralgora.jpg";
import { adminNavSections, quickAction, mobileTabs } from "../../config/adminNavConfig";

const HeaderAdmin = ({ moduleSpecificButton = null }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const { isOpen, onOpen, onClose } = useDisclosure();

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login-form");
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
    }
  };

  const userData = {
    name: user?.user_metadata?.firstname || user?.firstname || "Usuario",
    lastName: user?.user_metadata?.lastname || user?.lastname || "Administrador",
    email: user?.email || "admin@algora.com",
    role: user?.role_name || "ADMIN",
  };

  const navBg = useColorModeValue("rgba(255, 255, 255, 0.9)", "rgba(46, 46, 46, 0.6)");
  const navBorder = useColorModeValue("1px solid rgba(0,0,0,0.08)", "1px solid rgba(255,255,255,0.1)");
  const textColor = useColorModeValue("gray.800", "white");
  const textHoverColor = useColorModeValue("#2196f3", "#00E599");
  const menuBg = useColorModeValue("white", "gray.700");
  const menuBorder = useColorModeValue("gray.200", "gray.600");
  const subtitleColor = useColorModeValue("gray.500", "gray.400");
  const activeBg = useColorModeValue("blackAlpha.50", "whiteAlpha.100");
  const drawerBg = useColorModeValue("white", "gray.800");
  const bottomBarBg = useColorModeValue("rgba(255,255,255,0.95)", "rgba(20,20,20,0.95)");
  const bottomBarBorder = useColorModeValue("1px solid rgba(0,0,0,0.08)", "1px solid rgba(255,255,255,0.08)");

  const isActive = (path) => location.pathname === path;

  return (
    <>
      {/* ===== BARRA SUPERIOR ===== */}
      <Box as="nav" width="100%" zIndex="1400" position="sticky" top="0" pt={3} pb={3} display="flex" justifyContent="center" bg="transparent">
        <Box width={{ base: "94%", md: "92%" }} bg={navBg} backdropFilter="blur(10px)" border={navBorder} borderRadius="20px" boxShadow="sm">
          <Flex align="center" justify="space-between" py={2.5} px={{ base: 3, md: 6 }} minH="60px" gap={3}>
            {/* Logo / botón de módulo */}
            <Box minW="90px">
              {moduleSpecificButton ? (
                <Box display="flex" alignItems="center" height="40px">
                  {moduleSpecificButton}
                </Box>
              ) : (
                <Text
                  fontSize="xl"
                  fontWeight="bold"
                  color={textColor}
                  cursor="pointer"
                  onClick={() => navigate("/admin")}
                >
                  ALGORA
                </Text>
              )}
            </Box>

            {/* Mega-menú de secciones (desktop/tablet) */}
            <Flex gap={1} align="center" display={{ base: "none", md: "flex" }} flex="1" justify="center">
              {adminNavSections.map((section) => (
                <Menu key={section.id} isLazy>
                  <MenuButton
                    as={Button}
                    variant="ghost"
                    size="sm"
                    rightIcon={<ChevronDownIcon />}
                    color={textColor}
                    fontWeight="medium"
                    _hover={{ bg: activeBg, color: textHoverColor }}
                  >
                    {section.title}
                  </MenuButton>
                  <Portal>
                    <MenuList zIndex="1500" bg={menuBg} border={`1px solid ${menuBorder}`} borderRadius="12px" minW="220px">
                      {section.items.map((item) => (
                        <MenuItem
                          key={item.path}
                          icon={<item.icon />}
                          onClick={() => navigate(item.path)}
                          bg={isActive(item.path) ? activeBg : "transparent"}
                          fontWeight={isActive(item.path) ? "semibold" : "normal"}
                        >
                          {item.label}
                        </MenuItem>
                      ))}
                    </MenuList>
                  </Portal>
                </Menu>
              ))}
            </Flex>

            {/* Acciones de la derecha (desktop) */}
            <Flex display={{ base: "none", md: "flex" }} gap={3} align="center" minW="fit-content">
              <Button
                leftIcon={<quickAction.icon />}
                colorScheme="teal"
                bg="#00A88E"
                color="white"
                size="sm"
                borderRadius="full"
                px={5}
                _hover={{ bg: "#00967f" }}
                onClick={() => navigate(quickAction.path)}
              >
                {quickAction.label}
              </Button>

              <ColorModeToggle />

              <Menu>
                <MenuButton>
                  <Avatar src={avataralgora} size="sm" border="2px solid #50bcd8" cursor="pointer" />
                </MenuButton>
                <Portal>
                  <MenuList zIndex="1500" bg={menuBg} border={`1px solid ${menuBorder}`} borderRadius="12px" minW="260px" p={0}>
                    <Box p={3} borderBottom={`1px solid ${menuBorder}`}>
                      <HStack spacing={3}>
                        <Avatar src={avataralgora} size="sm" border="2px solid #50bcd8" />
                        <VStack align="start" spacing={0} flex={1}>
                          <Text fontWeight="bold" fontSize="sm" color={textColor}>
                            {userData.name} {userData.lastName}
                          </Text>
                          <Text fontSize="xs" color={subtitleColor}>{userData.email}</Text>
                          <Badge colorScheme="green" size="sm" borderRadius="full" px={2} mt={1}>
                            {userData.role}
                          </Badge>
                        </VStack>
                      </HStack>
                    </Box>
                    <Box py={1}>
                      <MenuItem onClick={handleLogout} color="red.500" icon={<FiLogOut />}>
                        Cerrar Sesión
                      </MenuItem>
                    </Box>
                  </MenuList>
                </Portal>
              </Menu>
            </Flex>

            {/* Móvil: acceso rápido a venta + toggle + hamburguesa */}
            <Flex display={{ base: "flex", md: "none" }} align="center" gap={1}>
              <IconButton
                aria-label={quickAction.label}
                icon={<quickAction.icon />}
                onClick={() => navigate(quickAction.path)}
                size="sm"
                borderRadius="full"
                bg="#00A88E"
                color="white"
                _hover={{ bg: "#00967f" }}
              />
              <ColorModeToggle />
              <IconButton
                aria-label="Abrir menú"
                icon={<HamburgerIcon />}
                onClick={onOpen}
                variant="ghost"
                color={textColor}
                size="sm"
              />
            </Flex>
          </Flex>
        </Box>
      </Box>

      {/* ===== DRAWER MÓVIL (todas las secciones en acordeón) ===== */}
      <Drawer isOpen={isOpen} placement="right" onClose={onClose} size="xs">
        <DrawerOverlay />
        <DrawerContent bg={drawerBg}>
          <DrawerCloseButton />
          <DrawerHeader borderBottom={`1px solid ${menuBorder}`} pb={4}>
            <HStack spacing={3}>
              <Avatar src={avataralgora} size="sm" border="2px solid #50bcd8" />
              <VStack align="start" spacing={0}>
                <Text fontWeight="bold" fontSize="sm">{userData.name} {userData.lastName}</Text>
                <Badge colorScheme="green" size="sm" borderRadius="full" px={2}>{userData.role}</Badge>
              </VStack>
            </HStack>
          </DrawerHeader>
          <DrawerBody px={2}>
            <Accordion allowToggle defaultIndex={[0]}>
              {adminNavSections.map((section) => (
                <AccordionItem key={section.id} border="none">
                  <AccordionButton borderRadius="md" _hover={{ bg: activeBg }}>
                    <Text flex="1" textAlign="left" fontWeight="semibold" fontSize="sm">
                      {section.title}
                    </Text>
                    <AccordionIcon />
                  </AccordionButton>
                  <AccordionPanel pb={2}>
                    <VStack align="stretch" spacing={1}>
                      {section.items.map((item) => (
                        <HStack
                          key={item.path}
                          px={3}
                          py={2}
                          borderRadius="md"
                          cursor="pointer"
                          bg={isActive(item.path) ? activeBg : "transparent"}
                          _hover={{ bg: activeBg }}
                          onClick={() => {
                            onClose();
                            navigate(item.path);
                          }}
                        >
                          <Box color={textHoverColor}><item.icon /></Box>
                          <Text fontSize="sm">{item.label}</Text>
                        </HStack>
                      ))}
                    </VStack>
                  </AccordionPanel>
                </AccordionItem>
              ))}
            </Accordion>

            <Box mt={4} pt={3} borderTop={`1px solid ${menuBorder}`}>
              <HStack
                px={3}
                py={2}
                borderRadius="md"
                cursor="pointer"
                color="red.500"
                _hover={{ bg: activeBg }}
                onClick={handleLogout}
              >
                <FiLogOut />
                <Text fontSize="sm" fontWeight="medium">Cerrar Sesión</Text>
              </HStack>
            </Box>
          </DrawerBody>
        </DrawerContent>
      </Drawer>

      {/* ===== BOTTOM TAB BAR (solo móvil) ===== */}
      <Flex
        display={{ base: "flex", md: "none" }}
        position="fixed"
        bottom="0"
        left="0"
        right="0"
        zIndex="1400"
        bg={bottomBarBg}
        backdropFilter="blur(10px)"
        borderTop={bottomBarBorder}
        justify="space-around"
        align="center"
        py={2}
      >
        {mobileTabs.map((tab) => (
          <Flex
            key={tab.path}
            direction="column"
            align="center"
            justify="center"
            flex="1"
            py={1}
            cursor="pointer"
            color={isActive(tab.path) ? textHoverColor : textColor}
            onClick={() => navigate(tab.path)}
          >
            <tab.icon size={20} />
            <Text fontSize="10px" mt={1} fontWeight={isActive(tab.path) ? "bold" : "normal"}>
              {tab.label}
            </Text>
          </Flex>
        ))}
        <Flex
          direction="column"
          align="center"
          justify="center"
          flex="1"
          py={1}
          cursor="pointer"
          color={textColor}
          onClick={onOpen}
        >
          <FiMoreHorizontal size={20} />
          <Text fontSize="10px" mt={1}>Más</Text>
        </Flex>
      </Flex>

      {/* Espaciador para que la bottom bar no tape contenido en móvil */}
      <Box display={{ base: "block", md: "none" }} h="64px" />
    </>
  );
};

export default HeaderAdmin;
