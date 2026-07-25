import { Box, Flex, Text, Icon, Collapse, useColorModeValue, Badge } from "@chakra-ui/react";
import { FiChevronDown, FiCheckCircle } from "react-icons/fi";

/**
 * Tarjeta de sección colapsable para el checkout de venta.
 * - Header: ícono + título + (resumen cuando está cerrada y completa) + flecha
 * - Se expande/colapsa con clic, no fuerza un orden lineal
 * - Muestra un check verde cuando la sección ya tiene datos válidos
 */
const SaleSection = ({
  icon: IconCmp,
  title,
  summary,
  isOpen,
  onToggle,
  isComplete,
  isOptional = false,
  children,
}) => {
  const cardBg = useColorModeValue("white", "gray.800");
  const border = useColorModeValue("1px solid rgba(0,0,0,0.08)", "1px solid rgba(255,255,255,0.08)");
  const activeBorder = "2px solid #00A88E";
  const textColor = useColorModeValue("gray.800", "white");
  const subtitleColor = useColorModeValue("gray.500", "gray.400");
  const iconBg = useColorModeValue("#E6FBF6", "rgba(0,168,142,0.15)");
  const iconColor = "#00A88E";

  return (
    <Box
      bg={cardBg}
      border={isOpen ? activeBorder : border}
      borderRadius="16px"
      overflow="hidden"
      transition="border-color 0.15s ease"
      boxShadow={isOpen ? "md" : "sm"}
    >
      <Flex
        align="center"
        justify="space-between"
        px={{ base: 4, md: 5 }}
        py={3.5}
        cursor="pointer"
        onClick={onToggle}
        gap={3}
      >
        <Flex align="center" gap={3} minW={0} flex="1">
          <Flex
            align="center"
            justify="center"
            boxSize="36px"
            minW="36px"
            borderRadius="10px"
            bg={isComplete ? iconBg : useColorModeValue("gray.100", "whiteAlpha.100")}
            color={isComplete ? iconColor : subtitleColor}
          >
            {isComplete ? <Icon as={FiCheckCircle} boxSize={5} /> : <IconCmp size={18} />}
          </Flex>
          <Box minW={0} flex="1">
            <Flex align="center" gap={2}>
              <Text fontWeight="bold" fontSize={{ base: "sm", md: "md" }} color={textColor}>
                {title}
              </Text>
              {isOptional && (
                <Badge colorScheme="gray" fontSize="9px" borderRadius="full" px={2}>
                  Opcional
                </Badge>
              )}
            </Flex>
            {!isOpen && summary && (
              <Text fontSize="xs" color={subtitleColor} noOfLines={1} mt={0.5}>
                {summary}
              </Text>
            )}
          </Box>
        </Flex>
        <Icon
          as={FiChevronDown}
          color={subtitleColor}
          transform={isOpen ? "rotate(180deg)" : "rotate(0deg)"}
          transition="transform 0.15s ease"
          flexShrink={0}
        />
      </Flex>

      <Collapse in={isOpen} animateOpacity unmountOnExit={false}>
        <Box px={{ base: 3, md: 5 }} pb={5} pt={0}>
          {children}
        </Box>
      </Collapse>
    </Box>
  );
};

export default SaleSection;
