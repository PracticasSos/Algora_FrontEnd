import {
  Box,
  Flex,
  SimpleGrid,
  FormControl,
  FormLabel,
  Input,
  Text,
  Button,
  Icon,
  useColorModeValue,
} from "@chakra-ui/react";
import React from "react";
import { Banknote, CreditCard, ArrowRightLeft, CheckCircle } from "lucide-react";

const paymentMethods = [
  { icon: Banknote, label: "Efectivo", value: "efectivo" },
  { icon: CreditCard, label: "Tarjeta", value: "datafast" },
  { icon: ArrowRightLeft, label: "Transferencia", value: "transferencia" },
];

/**
 * Selector de método de pago + abono. El total ya se ve en el resumen de la
 * venta (panel lateral), así que aquí no se repite un campo "Total" más.
 */
const Total = ({ formData, setFormData, grandTotal }) => {
  const totalFrame = formData.total_p_frame > 0 ? formData.total_p_frame : formData.p_frame || 0;
  const totalLens = formData.total_p_lens > 0 ? formData.total_p_lens : formData.p_lens || 0;
  // Si el padre pasa el total real (incluye accesorios), se usa ese; si no, se calcula local.
  const total = typeof grandTotal === "number" ? grandTotal : Number(totalFrame) + Number(totalLens);
  const balance = formData.balance === "" ? 0 : parseFloat(formData.balance);
  const credit = isNaN(balance) ? total : Math.max(0, total - balance);

  // Solo actualizamos 'credit' (saldo pendiente). NUNCA escribimos 'total'
  // de vuelta aquí: 'total' que llega como 'grandTotal' ya se calculó en
  // Sales.jsx sumando formData.total + accesorios + tratamientos. Si lo
  // volviéramos a guardar en formData.total, en el siguiente render
  // Sales.jsx sumaría accesorios/tratamientos OTRA VEZ sobre ese valor ya
  // combinado, y así en cada render — un ciclo que hace crecer el saldo
  // sin límite (ese fue el bug del saldo pendiente subiendo solo).
  React.useEffect(() => {
    setFormData((prev) => {
      if (prev.credit === credit) return prev; // evita renders innecesarios
      return { ...prev, credit };
    });
    // eslint-disable-next-line
  }, [credit]);

  const handleBalanceChange = (e) => {
    const value = e.target.value;
    if (value === "" || /^\d*\.?\d*$/.test(value)) {
      setFormData({ ...formData, balance: value });
    }
  };

  const handleFullPayment = () => {
    setFormData({ ...formData, balance: total });
  };

  const isFullPayment = Number(balance) > 0 && Number(balance) >= total;

  const handleSelect = (method) => setFormData({ ...formData, payment_in: method });
  const isSelected = (method) => formData.payment_in === method;

  const textColor = useColorModeValue("gray.800", "white");
  const borderColor = useColorModeValue("gray.200", "gray.600");
  const selectBg = useColorModeValue("white", "gray.700");
  const activeBg = useColorModeValue("#E6FBF6", "rgba(0,168,142,0.15)");
  const activeColor = "#00A88E";

  return (
    <Box w="100%">
      <Text fontSize="xs" fontWeight="semibold" mb={2} color={useColorModeValue("gray.600", "gray.400")}>
        Método de pago
      </Text>
      <SimpleGrid columns={3} spacing={3} mb={5}>
        {paymentMethods.map(({ icon: IconCmp, label, value }) => {
          const selected = isSelected(value);
          return (
            <Flex
              key={value}
              direction="column"
              align="center"
              justify="center"
              gap={2}
              py={4}
              borderRadius="14px"
              cursor="pointer"
              border={selected ? `2px solid ${activeColor}` : `1px solid ${borderColor}`}
              bg={selected ? activeBg : selectBg}
              transition="all 0.15s ease"
              _hover={{ borderColor: activeColor }}
              onClick={() => handleSelect(value)}
            >
              <IconCmp size={22} color={selected ? activeColor : undefined} />
              <Text fontSize="sm" fontWeight="semibold" color={selected ? activeColor : textColor}>
                {label}
              </Text>
            </Flex>
          );
        })}
      </SimpleGrid>

      {!formData.payment_in && (
        <Text color="orange.400" fontSize="xs" mb={4}>
          Selecciona un método de pago.
        </Text>
      )}

      <SimpleGrid columns={2} spacing={4} mb={3}>
        <FormControl>
          <FormLabel fontSize="xs" fontWeight="semibold">Abono</FormLabel>
          <Input
            type="number"
            name="balance"
            height="44px"
            borderRadius="lg"
            fontWeight="semibold"
            value={formData.balance === 0 || formData.balance === "0" ? "" : formData.balance ?? ""}
            onChange={handleBalanceChange}
            placeholder="$0.00"
            bg={selectBg}
            borderColor={borderColor}
            color={textColor}
          />
        </FormControl>
        <FormControl>
          <FormLabel fontSize="xs" fontWeight="semibold">Saldo pendiente</FormLabel>
          <Input
            type="number"
            name="credit"
            height="44px"
            borderRadius="lg"
            fontWeight="semibold"
            value={Number(credit).toFixed(2)}
            isReadOnly
            bg={useColorModeValue("gray.100", "gray.700")}
            borderColor={borderColor}
            color={textColor}
          />
        </FormControl>
      </SimpleGrid>

      <Button
        size="sm"
        w="full"
        variant={isFullPayment ? "solid" : "outline"}
        bg={isFullPayment ? "#00A88E" : "transparent"}
        color={isFullPayment ? "white" : "#00A88E"}
        borderColor="#00A88E"
        _hover={{ bg: isFullPayment ? "#00967f" : activeBg }}
        borderRadius="full"
        leftIcon={<Icon as={CheckCircle} boxSize="14px" />}
        onClick={handleFullPayment}
      >
        {isFullPayment ? "Pago completo ✓" : `Marcar como pago completo ($${total.toFixed(2)})`}
      </Button>
    </Box>
  );
};

export default Total;
