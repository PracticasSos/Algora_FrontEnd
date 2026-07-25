import {
  Box,
  Flex,
  Text,
  IconButton,
  useDisclosure,
  useColorModeValue,
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
import { HamburgerIcon } from "@chakra-ui/icons";
import { FiLogOut, FiMoreHorizontal } from "react-icons/fi";
import ColorModeToggle from "../../Toggle";
import { useAuth } from "../AuthContext";
import avataralgora from "../../assets/avataralgora.jpg";
import { adminNavSections, quickAction, mobileTabs } from "../../config/adminNavConfig";

const AdminMobileNav = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const { isOpen, onOpen, onClose } = useDisclosure();

  const navBg = useColorModeValue("rgba(255,255,255,0.95)", "rgba(20,20,20,0.95)");
  const border = useColorModeValue("1px solid rgba(0,0,0,0.08)", "1px solid rgba(255,255,255,0.08)");
  const textColor = useColorModeValue("gray.800", "white");
  const textHoverColor = useColorModeValue("#2196f3", "#00E599");
  const activeBg = useColorModeValue("blackAlpha.50", "whiteAlpha.100");
  const drawerBg = useColorModeValue("white", "gray.800");
  const menuBorder = useColorModeValue("gray.200", "gray.600");

  const isActive = (path) => location.pathname === path;

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login-form");
    } catch (err) {
      console.error("Error al cerrar sesión:", err);
    }
  };

  const userData = {
    name: user?.user_metadata?.firstname || user?.firstname || "Usuario",
    lastName: user?.user_metadata?.lastname || user?.lastname || "",
    role: user?.role_name || "ADMIN",
  };

  return (
    <Box display={{ base: "block", md: "none" }}>
      {/* Top bar */}
      <Flex
        position="sticky"
        top="0"
        zIndex="1400"
        align="center"
        justify="space-between"
        bg={navBg}
        backdropFilter="blur(10px)"
        borderBottom={border}
        px={4}
        py={3}
      >
        <Text fontSize="lg" fontWeight="bold" color={textColor} onClick={() => navigate("/admin")}>
          ALGORA
        </Text>
        <Flex align="center" gap={1}>
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

      {/* Drawer con todas las secciones */}
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
              <HStack px={3} py={2} borderRadius="md" cursor="pointer" color="red.500" _hover={{ bg: activeBg }} onClick={handleLogout}>
                <FiLogOut />
                <Text fontSize="sm" fontWeight="medium">Cerrar Sesión</Text>
              </HStack>
            </Box>
          </DrawerBody>
        </DrawerContent>
      </Drawer>

      {/* Bottom tab bar */}
      <Flex
        position="fixed"
        bottom="0"
        left="0"
        right="0"
        zIndex="1400"
        bg={navBg}
        backdropFilter="blur(10px)"
        borderTop={border}
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
        <Flex direction="column" align="center" justify="center" flex="1" py={1} cursor="pointer" color={textColor} onClick={onOpen}>
          <FiMoreHorizontal size={20} />
          <Text fontSize="10px" mt={1}>Más</Text>
        </Flex>
      </Flex>

      {/* Espaciador para que la bottom bar no tape contenido */}
      <Box h="64px" />
    </Box>
  );
};

export default AdminMobileNav;
