import { useState, useEffect } from "react";
import {
  Modal, ModalOverlay, ModalContent, ModalHeader, ModalCloseButton, ModalBody, ModalFooter,
  Button, Input, Select, FormControl, FormLabel, VStack, Text, Box, useToast, useColorModeValue,
} from "@chakra-ui/react";
import { supabase } from "../../api/supabase";
import { useAuth } from "../AuthContext";

const ACCENT = "#00A88E";
const today = () => new Date().toISOString().slice(0, 10);

const addCycle = (baseISO, cycle) => {
  const d = new Date(`${baseISO}T12:00:00`);
  if (cycle === "anual") d.setFullYear(d.getFullYear() + 1);
  else d.setMonth(d.getMonth() + 1);
  return d.toISOString().slice(0, 10);
};

/** Registra un pago recibido de una óptica y adelanta su próxima fecha de cobro. */
const RegisterPaymentModal = ({ isOpen, onClose, tenant, onSaved }) => {
  const { user } = useAuth();
  const toast = useToast();
  const [amount, setAmount] = useState("");
  const [paidAt, setPaidAt] = useState(today());
  const [method, setMethod] = useState("transferencia");
  const [period, setPeriod] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const inputBg = useColorModeValue("gray.50", "gray.700");

  useEffect(() => { if (isOpen) { setAmount(""); setPaidAt(today()); setMethod("transferencia"); setPeriod(""); setNote(""); } }, [isOpen]);

  const save = async () => {
    const value = Number(amount);
    if (!(value > 0)) return toast({ title: "Escribe un monto válido", status: "warning", duration: 3000 });
    setSaving(true);
    const { error } = await supabase.from("tenant_payments").insert([{
      tenant_id: tenant.id, amount: value, paid_at: paidAt, method,
      period_label: period.trim() || null, note: note.trim() || null,
      registered_by: `${user?.firstname || ""} ${user?.lastname || ""}`.trim() || user?.email,
    }]);
    if (error) { setSaving(false); return toast({ title: "No se pudo registrar", description: error.message, status: "error" }); }

    // Adelanta la próxima fecha de cobro desde la fecha vigente (o desde hoy si ya venció)
    const current = tenant.next_billing_date ? String(tenant.next_billing_date).slice(0, 10) : today();
    const base = current > today() ? current : today();
    const { error: tErr } = await supabase.from("tenants").update({ next_billing_date: addCycle(base, tenant.billing_cycle) }).eq("id", tenant.id);
    setSaving(false);
    if (tErr) toast({ title: "Pago guardado, pero no se pudo actualizar la próxima fecha", description: tErr.message, status: "warning" });
    else toast({ title: "Pago registrado", description: `Próximo cobro: ${addCycle(base, tenant.billing_cycle)}`, status: "success", duration: 4000 });
    onSaved?.();
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered size="md">
      <ModalOverlay backdropFilter="blur(2px)" />
      <ModalContent borderRadius="20px" overflow="hidden">
        <Box h="4px" bg={ACCENT} />
        <ModalHeader fontSize="md">Registrar pago · {tenant?.name}</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack spacing={4} align="stretch">
            <FormControl isRequired><FormLabel fontSize="xs">Monto recibido ($)</FormLabel><Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} bg={inputBg} borderRadius="10px" /></FormControl>
            <FormControl><FormLabel fontSize="xs">Fecha del pago</FormLabel><Input type="date" value={paidAt} onChange={(e) => setPaidAt(e.target.value)} bg={inputBg} borderRadius="10px" /></FormControl>
            <FormControl><FormLabel fontSize="xs">Método</FormLabel>
              <Select value={method} onChange={(e) => setMethod(e.target.value)} bg={inputBg} borderRadius="10px">
                <option value="transferencia">Transferencia</option><option value="efectivo">Efectivo</option><option value="otro">Otro</option>
              </Select>
            </FormControl>
            <FormControl><FormLabel fontSize="xs">Periodo que cubre (opcional)</FormLabel><Input value={period} onChange={(e) => setPeriod(e.target.value)} placeholder="Ej: Noviembre 2026" bg={inputBg} borderRadius="10px" /></FormControl>
            <FormControl><FormLabel fontSize="xs">Nota (opcional)</FormLabel><Input value={note} onChange={(e) => setNote(e.target.value)} bg={inputBg} borderRadius="10px" /></FormControl>
            <Text fontSize="xs" color="gray.500">Al guardar, la próxima fecha de cobro avanza un {tenant?.billing_cycle === "anual" ? "año" : "mes"}.</Text>
          </VStack>
        </ModalBody>
        <ModalFooter gap={2}>
          <Button variant="ghost" size="sm" onClick={onClose}>Cancelar</Button>
          <Button size="sm" bg={ACCENT} color="white" _hover={{ bg: "#00967f" }} borderRadius="10px" onClick={save} isLoading={saving}>Guardar pago</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default RegisterPaymentModal;
