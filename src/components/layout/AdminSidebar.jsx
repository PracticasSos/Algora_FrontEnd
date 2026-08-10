import { useState, useEffect } from "react";
import { Box, Flex, Text, VStack, Tooltip, useColorModeValue, Avatar, Badge, Icon } from "@chakra-ui/react";
import { useNavigate, useLocation } from "react-router-dom";
import { FiHome, FiLogOut, FiChevronDown } from "react-icons/fi";
import { useAuth } from "../AuthContext";
import avataralgora from "../../assets/avataralgora.jpg";
import { adminNavSections } from "../../config/adminNavConfig";

const COLLAPSED_W = "76px";
const EXPANDED_W = "270px";

const AdminSidebar = () => {
  const [hovered, setHovered] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  // Si el admin le asignó permisos específicos a este usuario
  // (user.allowed_routes), el menú solo muestra esas rutas — las secciones
  // que se quedan sin ítems visibles simplemente no aparecen. Si no tiene
  // nada asignado (null/vacío), ve todo como siempre.
  const hasCustomPermissions = Array.isArray(user?.allowed_routes) && user.allowed_routes.length > 0;
  const filteredSections = hasCustomPermissions
    ? adminNavSections
        .map((section) => ({
          ...section,
          items: section.items.filter((item) => user.allowed_routes.includes(item.path)),
        }))
        .filter((section) => section.items.length > 0)
    : adminNavSections;

  // Seguro: si el filtrado deja el menú completamente vacío (por ejemplo,
  // permisos guardados que ya no coinciden con ninguna ruta actual), se
  // muestra todo en vez de dejar a alguien bloqueado sin poder navegar.
  const visibleNavSections = filteredSections.length > 0 ? filteredSections : adminNavSections;

  // Sección que contiene la ruta activa: se abre sola al entrar
  const activeSectionId = visibleNavSections.find((s) => s.items.some((i) => i.path === location.pathname))?.id;
  const [openSection, setOpenSection] = useState(activeSectionId || null);

  useEffect(() => {
    if (activeSectionId) setOpenSection(activeSectionId);
  }, [activeSectionId]);

  const bg = useColorModeValue("white", "#111826");
  const border = useColorModeValue("1px solid rgba(0,0,0,0.08)", "1px solid rgba(255,255,255,0.06)");
  const textColor = useColorModeValue("gray.800", "gray.200");
  const sectionTitleColor = useColorModeValue("gray.600", "gray.300");
  const activeBg = useColorModeValue("#E6FBF6", "rgba(0,168,142,0.18)");
  const activeColor = useColorModeValue("#00786A", "#3ECFB4");
  const hoverBg = useColorModeValue("gray.50", "whiteAlpha.100");

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

  // Fila simple (Inicio, Cerrar sesión)
  const Row = ({ icon: IconCmp, label, onClick, active }) => {
    const content = (
      <Flex
        align="center"
        gap={3}
        px={hovered ? 4 : 0}
        justify={hovered ? "flex-start" : "center"}
        py={2.5}
        mx={2}
        borderRadius="10px"
        cursor="pointer"
        bg={active ? activeBg : "transparent"}
        color={active ? activeColor : textColor}
        _hover={{ bg: active ? activeBg : hoverBg }}
        onClick={onClick}
        transition="all 0.15s ease"
      >
        <Box fontSize="18px" minW="18px" display="flex" justifyContent="center">
          <IconCmp />
        </Box>
        {hovered && (
          <Text fontSize="sm" fontWeight={active ? "semibold" : "medium"} whiteSpace="nowrap" overflow="hidden">
            {label}
          </Text>
        )}
      </Flex>
    );
    return hovered ? content : (
      <Tooltip label={label} placement="right" hasArrow openDelay={150}>
        {content}
      </Tooltip>
    );
  };

  return (
    <Box
      as="nav"
      position="fixed"
      top="0"
      left="0"
      height="100vh"
      width={hovered ? EXPANDED_W : COLLAPSED_W}
      bg={bg}
      borderRight={border}
      zIndex="1500"
      overflowY="auto"
      overflowX="hidden"
      transition="width 0.18s ease"
      boxShadow={hovered ? "2xl" : "none"}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      display={{ base: "none", md: "flex" }}
      flexDirection="column"
      justifyContent="space-between"
      css={{ "&::-webkit-scrollbar": { width: "0px" } }}
    >
      <Box>
        {/* Logo */}
        <Flex
          align="center"
          justify={hovered ? "flex-start" : "center"}
          px={hovered ? 5 : 0}
          h="64px"
          cursor="pointer"
          onClick={() => navigate("/admin")}
        >
          <Text fontSize="lg" fontWeight="bold" color={textColor}>
            {hovered ? "ALGORA" : "A"}
          </Text>
        </Flex>

        <Box mt={2}>
          <Row icon={FiHome} label="Inicio" active={isActive("/admin")} onClick={() => navigate("/admin")} />
        </Box>

        <VStack align="stretch" spacing={0.5} mt={3}>
          {visibleNavSections.map((section) => {
            const isOpen = openSection === section.id;
            const hasActiveChild = section.items.some((i) => isActive(i.path));
            const SectionIcon = section.items[0]?.icon || FiHome;

            return (
              <Box key={section.id}>
                {/* Encabezado de la sección: ícono + título + flecha, clic para abrir/cerrar */}
                <Flex
                  align="center"
                  justify={hovered ? "space-between" : "center"}
                  px={hovered ? 4 : 0}
                  py={2.5}
                  mx={2}
                  borderRadius="10px"
                  cursor="pointer"
                  color={hasActiveChild ? activeColor : textColor}
                  bg={hasActiveChild ? activeBg : "transparent"}
                  _hover={{ bg: hoverBg }}
                  onClick={() => setOpenSection(isOpen ? null : section.id)}
                  transition="all 0.15s ease"
                >
                  <Flex align="center" gap={3}>
                    <Box fontSize="18px" minW="18px" display="flex" justifyContent="center">
                      <SectionIcon />
                    </Box>
                    {hovered && (
                      <Text fontSize="sm" fontWeight="semibold" whiteSpace="nowrap">
                        {section.title}
                      </Text>
                    )}
                  </Flex>
                  {hovered && (
                    <Icon
                      as={FiChevronDown}
                      boxSize={3.5}
                      transform={isOpen ? "rotate(180deg)" : "rotate(0deg)"}
                      transition="transform 0.15s ease"
                    />
                  )}
                </Flex>

                {/* Items de la sección, solo visibles si está expandida Y abierta */}
                {hovered && isOpen && (
                  <VStack align="stretch" spacing={0.5} mt={0.5} mb={1}>
                    {section.items.map((item) => (
                      <Flex
                        key={item.path}
                        align="center"
                        gap={3}
                        pl={10}
                        pr={4}
                        py={2}
                        mx={2}
                        borderRadius="8px"
                        cursor="pointer"
                        bg={isActive(item.path) ? activeBg : "transparent"}
                        color={isActive(item.path) ? activeColor : textColor}
                        _hover={{ bg: hoverBg }}
                        onClick={() => navigate(item.path)}
                        transition="all 0.15s ease"
                      >
                        <Box fontSize="15px" minW="15px" display="flex" justifyContent="center">
                          <item.icon />
                        </Box>
                        <Text fontSize="xs" fontWeight={isActive(item.path) ? "semibold" : "normal"} whiteSpace="nowrap" overflow="hidden">
                          {item.label}
                        </Text>
                      </Flex>
                    ))}
                  </VStack>
                )}
              </Box>
            );
          })}
        </VStack>
      </Box>

      {/* Usuario / logout */}
      <Box borderTop={border} py={3}>
        <Flex
          align="center"
          gap={3}
          px={hovered ? 4 : 0}
          justify={hovered ? "flex-start" : "center"}
          py={2}
          mx={2}
          mb={1}
        >
          <Avatar src={avataralgora} size="sm" border="2px solid #50bcd8" />
          {hovered && (
            <Box overflow="hidden">
              <Text fontSize="xs" fontWeight="bold" color={textColor} whiteSpace="nowrap">
                {userData.name} {userData.lastName}
              </Text>
              <Badge colorScheme="green" size="sm" borderRadius="full" px={2} fontSize="9px">
                {userData.role}
              </Badge>
            </Box>
          )}
        </Flex>
        <Row icon={FiLogOut} label="Cerrar Sesión" onClick={handleLogout} />
      </Box>
    </Box>
  );
};

export default AdminSidebar;
export { COLLAPSED_W, EXPANDED_W };
