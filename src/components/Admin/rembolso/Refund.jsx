import { useState } from "react";
import { supabase } from "../../../api/supabase";
import {
  Button, Modal, ModalOverlay, ModalContent, ModalHeader, ModalCloseButton,
  ModalBody, ModalFooter, Text, VStack, HStack, Box, Input, Icon, useToast,
  useColorModeValue, Badge, Select,
} from "@chakra-ui/react";
import { RotateCcw, DollarSign } from "lucide-react";

const ACCENT = "#00A88E";

const formatMoney = (value) => {
  const n = parseFloat(value);
  if (isNaN(n)) return "$0.00";
  return `$${n.toLocaleString("es-EC", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

/**
 * Reembolsar = devolver dinero que el paciente ya pagó (su abono). La
 * venta sigue viva; ese monto se resta de lo pagado y se suma de vuelta
 * al saldo pendiente, exactamente como estaba antes de que abonara.
 */
const RefundButton = ({ sale, onRefund }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const toast = useToast();

  const paidSoFar = Number(sale.balance) || 0;
  const cardBg = useColorModeValue("white", "gray.700");
  const borderColor = useColorModeValue("gray.200", "gray.600");
  const inputBg = useColorModeValue("gray.50", "gray.700");

  const openModal = () => {
    setAmount(paidSoFar > 0 ? String(paidSoFar) : "");
    setPaymentMethod("");
    setIsOpen(true);
  };

  const handleConfirm = async () => {
    const refundAmount = Math.min(paidSoFar, Math.max(0, Number(amount) || 0));
    if (refundAmount <= 0) {
      toast({ title: "Monto inválido", description: "Escribe cuánto se le va a devolver.", status: "warning", duration: 4000, isClosable: true });
      return;
    }
    if (!paymentMethod) {
      toast({ title: "Falta el método de pago", description: "¿De qué caja sale este dinero?", status: "warning", duration: 4000, isClosable: true });
      return;
    }

    setIsSaving(true);
    try {
      const newBalance = Math.max(0, paidSoFar - refundAmount);
      const newCredit = (Number(sale.credit) || 0) + refundAmount;

      // Se devuelve el dinero: baja de lo pagado, sube el saldo
      // pendiente — vuelve a aparecer en Créditos como antes de abonar.
      // Importante: NO se marca is_refund aquí. Ese campo se usa en otras
      // pantallas (Créditos, Saldos, Retiros) para OCULTAR ventas
      // anuladas — un reembolso de dinero no anula la venta, solo mueve
      // plata entre lo pagado y el saldo pendiente. La venta sigue viva
      // y visible en todos lados, tal como debe ser.
      const { error: updateError } = await supabase
        .from("sales")
        .update({ balance: newBalance, credit: newCredit })
        .eq("id", sale.id);

      if (updateError) throw updateError;

      const { error: insertError } = await supabase
        .from("refunds")
        .insert([{
          sale_id: sale.id,
          refund_amount: refundAmount,
          refund_date: new Date().toISOString(),
          payment_method: paymentMethod,
        }]);

      if (insertError) throw insertError;

      toast({
        title: "Reembolso procesado",
        description: `Se devolvieron ${formatMoney(refundAmount)}. El saldo pendiente ahora es ${formatMoney(newCredit)}.`,
        status: "success",
        duration: 5000,
        isClosable: true,
      });

      setIsOpen(false);
      if (onRefund) onRefund({ ...sale, balance: newBalance, credit: newCredit });
    } catch (err) {
      console.error("Error procesando reembolso:", err);
      toast({ title: "Error", description: "No se pudo procesar el reembolso.", status: "error", duration: 5000, isClosable: true });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <Button
        colorScheme="red"
        size="sm"
        variant="outline"
        leftIcon={<RotateCcw size={14} />}
        onClick={openModal}
        isDisabled={paidSoFar <= 0}
      >
        Reembolsar
      </Button>

      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} isCentered size="sm">
        <ModalOverlay backdropFilter="blur(2px)" />
        <ModalContent bg={cardBg} borderRadius="20px" overflow="hidden">
          <Box h="4px" bg="red.400" />
          <ModalHeader fontSize="md">
            <HStack spacing={2}>
              <Icon as={RotateCcw} color="red.400" boxSize="16px" />
              <Text>Reembolsar abono</Text>
            </HStack>
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Text fontSize="sm" color="gray.500" mb={4}>
              Se le devuelve el dinero al paciente — la venta sigue activa y ese monto vuelve a aparecer como deuda pendiente en Créditos.
            </Text>

            <Box p={3} borderRadius="12px" bg={inputBg} border={`1px solid ${borderColor}`} mb={4}>
              <HStack justify="space-between" fontSize="sm">
                <Text color="gray.500">Ha pagado hasta ahora</Text>
                <Text fontWeight="bold">{formatMoney(paidSoFar)}</Text>
              </HStack>
            </Box>

            <Text fontSize="xs" color="gray.500" mb={1}>¿Cuánto se le va a devolver?</Text>
            <HStack>
              <Box position="relative" flex="1">
                <Icon as={DollarSign} position="absolute" left="10px" top="10px" boxSize="14px" color="gray.400" />
                <Input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  pl="30px"
                  borderRadius="10px"
                  bg={inputBg}
                  borderColor={borderColor}
                  _focus={{ borderColor: ACCENT, boxShadow: `0 0 0 1px ${ACCENT}` }}
                />
              </Box>
              <Button size="sm" variant="outline" onClick={() => setAmount(String(paidSoFar))}>
                Todo
              </Button>
            </HStack>

            <Text fontSize="xs" color="gray.500" mb={1} mt={4}>¿De qué caja sale este dinero?</Text>
            <Select
              placeholder="Método de pago"
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              borderRadius="10px"
              bg={inputBg}
              borderColor={borderColor}
              _focus={{ borderColor: ACCENT, boxShadow: `0 0 0 1px ${ACCENT}` }}
            >
              <option value="efectivo">Efectivo</option>
              <option value="datafast">Datafast</option>
              <option value="transferencia">Transferencia</option>
            </Select>
          </ModalBody>
          <ModalFooter gap={2}>
            <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)}>Cancelar</Button>
            <Button colorScheme="red" size="sm" borderRadius="10px" onClick={handleConfirm} isLoading={isSaving}>
              Confirmar reembolso
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
};

export default RefundButton;
