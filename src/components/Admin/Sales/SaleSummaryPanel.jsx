import { useState } from "react";
import {
  Box,
  Flex,
  Text,
  VStack,
  HStack,
  Divider,
  Button,
  useColorModeValue,
  useBreakpointValue,
  Drawer,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  DrawerHeader,
  DrawerBody,
  Portal,
} from "@chakra-ui/react";
import { FiUser, FiShoppingBag, FiTruck, FiPackage } from "react-icons/fi";

const formatMoney = (value) => {
  const n = parseFloat(value);
  if (isNaN(n)) return "$0.00";
  return `$${n.toLocaleString("es-EC", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const SummaryBody = ({
  patientName,
  frameName,
  lensName,
  accessories,
  total,
  discountTotal,
  downPayment,
  pendingBalance,
  deliveryText,
  textColor,
  subtitleColor,
}) => (
  <VStack align="stretch" spacing={4}>
    <VStack align="stretch" spacing={1}>
      <HStack color={subtitleColor} fontSize="xs" fontWeight="bold" textTransform="uppercase">
        <FiUser /> <Text>Paciente</Text>
      </HStack>
      <Text fontSize="sm" color={textColor} fontWeight="medium">
        {patientName || "Sin seleccionar"}
      </Text>
    </VStack>

    <VStack align="stretch" spacing={1}>
      <HStack color={subtitleColor} fontSize="xs" fontWeight="bold" textTransform="uppercase">
        <FiShoppingBag /> <Text>Producto</Text>
      </HStack>
      <Text fontSize="sm" color={textColor}>{frameName || "—"}</Text>
      <Text fontSize="sm" color={textColor}>{lensName || "—"}</Text>
    </VStack>

    {accessories && accessories.length > 0 && (
      <VStack align="stretch" spacing={1}>
        <HStack color={subtitleColor} fontSize="xs" fontWeight="bold" textTransform="uppercase">
          <FiPackage /> <Text>Agregado</Text>
        </HStack>
        {accessories.map((a) => (
          <HStack key={`${a.source}-${a.sourceId}`} justify="space-between" fontSize="sm">
            <Text color={textColor} noOfLines={1}>
              {a.name}{a.quantity > 1 ? ` x${a.quantity}` : ""}
            </Text>
            <Text color={textColor}>{formatMoney(a.unit_price * a.quantity)}</Text>
          </HStack>
        ))}
      </VStack>
    )}

    <VStack align="stretch" spacing={1}>
      <HStack color={subtitleColor} fontSize="xs" fontWeight="bold" textTransform="uppercase">
        <FiTruck /> <Text>Entrega</Text>
      </HStack>
      <Text fontSize="sm" color={textColor}>{deliveryText || "Sin definir"}</Text>
    </VStack>

    <Divider />

    <VStack align="stretch" spacing={2}>
      {discountTotal > 0 && (
        <HStack justify="space-between" fontSize="sm" color={subtitleColor}>
          <Text>Descuento</Text>
          <Text>-{formatMoney(discountTotal)}</Text>
        </HStack>
      )}
      <HStack justify="space-between">
        <Text fontWeight="bold" color={textColor}>Total</Text>
        <Text fontWeight="bold" fontSize="xl" color="#00A88E">{formatMoney(total)}</Text>
      </HStack>
      {downPayment > 0 && (
        <HStack justify="space-between" fontSize="sm">
          <Text color={subtitleColor}>Abono</Text>
          <Text color={textColor} fontWeight="semibold">{formatMoney(downPayment)}</Text>
        </HStack>
      )}
      {downPayment > 0 && (
        <HStack justify="space-between" fontSize="sm">
          <Text color={subtitleColor}>Saldo pendiente</Text>
          <Text color="orange.400" fontWeight="bold">{formatMoney(pendingBalance)}</Text>
        </HStack>
      )}
    </VStack>
  </VStack>
);

const SaleSummaryPanel = ({
  patientName,
  frameName,
  lensName,
  accessories,
  total,
  discountTotal,
  downPayment,
  pendingBalance,
  deliveryText,
  onSubmit,
  isSubmitting,
  saleRegistered,
  missingLabel,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  // El Portal saca la barra del árbol normal del DOM, así que la regla
  // responsive "display: none en desktop" de Chakra ya no la alcanza —
  // por eso se detecta el tamaño real acá, en JS, y se decide si se
  // renderiza el Portal o no.
  const isMobile = useBreakpointValue({ base: true, lg: false });

  const cardBg = useColorModeValue("white", "gray.800");
  const border = useColorModeValue("1px solid rgba(0,0,0,0.08)", "1px solid rgba(255,255,255,0.08)");
  const textColor = useColorModeValue("gray.800", "white");
  const subtitleColor = useColorModeValue("gray.500", "gray.400");
  const barBg = useColorModeValue("rgba(255,255,255,0.97)", "rgba(20,20,20,0.97)");

  const bodyProps = {
    patientName,
    frameName,
    lensName,
    accessories,
    total,
    discountTotal,
    downPayment,
    pendingBalance,
    deliveryText,
    textColor,
    subtitleColor,
  };

  return (
    <>
      {/* Desktop / tablet: panel fijo lateral */}
      <Box
        display={{ base: "none", lg: "block" }}
        position="sticky"
        top="88px"
        alignSelf="flex-start"
        w="320px"
        flexShrink={0}
      >
        <Box bg={cardBg} border={border} borderRadius="16px" p={6} boxShadow="md">
          <Text fontSize="sm" fontWeight="bold" textTransform="uppercase" letterSpacing="wide" color={subtitleColor} mb={4}>
            Resumen de la venta
          </Text>
          <SummaryBody {...bodyProps} />
          <Button
            mt={6}
            w="full"
            size="lg"
            bg={saleRegistered ? "gray.400" : "#00A88E"}
            color="white"
            _hover={{ bg: saleRegistered ? "gray.400" : "#00967f" }}
            borderRadius="12px"
            onClick={onSubmit}
            isLoading={isSubmitting}
            isDisabled={saleRegistered}
            loadingText="Registrando..."
          >
            {saleRegistered ? "Venta ya registrada ✓" : "Registrar Venta"}
          </Button>
          {missingLabel && (
            <Text fontSize="xs" color="orange.400" mt={2} textAlign="center">
              {missingLabel}
            </Text>
          )}
        </Box>
      </Box>

      {/* Móvil / tablet chica: barra fija abajo + drawer con el detalle */}
      <Box display={{ base: "block", lg: "none" }}>
        {isMobile && (
          <Portal>
            <Flex
              position="fixed"
              bottom="0"
              left="0"
              right="0"
              zIndex="1450"
              bg={barBg}
              backdropFilter="blur(10px)"
            borderTop={border}
            px={4}
            py={3}
            align="center"
            justify="space-between"
            gap={3}
          >
            <Box cursor="pointer" onClick={() => setIsOpen(true)} flex="1" minW={0}>
              <Text fontSize="xs" color={subtitleColor}>Total</Text>
              <Text fontWeight="bold" fontSize="lg" color="#00A88E">{formatMoney(total)}</Text>
            </Box>
            <Button
              bg={saleRegistered ? "gray.400" : "#00A88E"}
              color="white"
              _hover={{ bg: saleRegistered ? "gray.400" : "#00967f" }}
              borderRadius="12px"
              onClick={onSubmit}
              isLoading={isSubmitting}
              isDisabled={saleRegistered}
              loadingText="Registrando..."
              flexShrink={0}
            >
              {saleRegistered ? "Registrada ✓" : "Registrar Venta"}
            </Button>
          </Flex>
        </Portal>
        )}
        <Box h="76px" />

        <Drawer isOpen={isOpen} placement="bottom" onClose={() => setIsOpen(false)}>
          <DrawerOverlay />
          <DrawerContent borderTopRadius="20px" bg={cardBg}>
            <DrawerCloseButton />
            <DrawerHeader fontSize="sm" fontWeight="bold" textTransform="uppercase" color={subtitleColor}>
              Resumen de la venta
            </DrawerHeader>
            <DrawerBody pb={8}>
              <SummaryBody {...bodyProps} />
            </DrawerBody>
          </DrawerContent>
        </Drawer>
      </Box>
    </>
  );
};

export default SaleSummaryPanel;
