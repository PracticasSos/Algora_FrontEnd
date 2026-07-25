import { Box, Flex, Button, Menu, MenuButton, MenuList, MenuItem, Portal, Avatar, VStack, HStack, Text, Badge, useColorModeValue } from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";
import { FiLogOut } from "react-icons/fi";
import ColorModeToggle from "../../Toggle";
import { useAuth } from "../AuthContext";
import avataralgora from "../../assets/avataralgora.jpg";
import { quickAction } from "../../config/adminNavConfig";
import { COLLAPSED_W } from "./AdminSidebar";

const AdminTopbar = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const bg = useColorModeValue("rgba(255,255,255,0.85)", "rgba(20,20,20,0.85)");
  const border = useColorModeValue("1px solid rgba(0,0,0,0.06)", "1px solid rgba(255,255,255,0.06)");
  const textColor = useColorModeValue("gray.800", "white");
  const menuBg = useColorModeValue("white", "gray.700");
  const menuBorder = useColorModeValue("gray.200", "gray.600");
  const subtitleColor = useColorModeValue("gray.500", "gray.400");

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
    email: user?.email || "admin@algora.com",
    role: user?.role_name || "ADMIN",
  };

  return (
    <Flex
      display={{ base: "none", md: "flex" }}
      position="sticky"
      top="0"
      zIndex="1200"
      ml={COLLAPSED_W}
      h="64px"
      align="center"
      justify="flex-end"
      px={6}
      gap={3}
      bg={bg}
      backdropFilter="blur(10px)"
      borderBottom={border}
    >
      <Button
        leftIcon={<quickAction.icon />}
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
          <MenuList zIndex="1500" bg={menuBg} border={`1px solid ${menuBorder}`} borderRadius="12px" minW="240px" p={0}>
            <Box p={3} borderBottom={`1px solid ${menuBorder}`}>
              <HStack spacing={3}>
                <Avatar src={avataralgora} size="sm" border="2px solid #50bcd8" />
                <VStack align="start" spacing={0} flex={1}>
                  <Text fontWeight="bold" fontSize="sm" color={textColor}>
                    {userData.name} {userData.lastName}
                  </Text>
                  <Text fontSize="xs" color={subtitleColor}>{userData.email}</Text>
                  <Badge colorScheme="green" size="sm" borderRadius="full" px={2} mt={1}>{userData.role}</Badge>
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
  );
};

export default AdminTopbar;
