import { useEffect, useState } from "react";
import {
  Box,
  VStack,
  HStack,
  Text,
  Select,
  Button,
  useColorModeValue,
  useToast,
  Container,
  Icon,
} from "@chakra-ui/react";
import { Clock } from "lucide-react";
import { supabase } from "../../api/supabase";
import SmartHeader from "../header/SmartHeader";

const hourOptions = Array.from({ length: 24 }, (_, h) => h);

const formatHour = (h) => {
  const period = h < 12 ? "AM" : "PM";
  const displayHour = h % 12 === 0 ? 12 : h % 12;
  return `${displayHour}:00 ${period}`;
};

/**
 * Configuración de retiros: define la hora de corte a partir de la cual
 * "Hoy" deja de ofrecerse como opción de entrega en la pantalla de Venta,
 * y se sugiere "Mañana" en su lugar. Aplica a todas las sucursales del
 * tenant (una sola fila en delivery_settings).
 */
const DeliverySettings = () => {
  const [cutoffHour, setCutoffHour] = useState(15);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const toast = useToast();

  useEffect(() => {
    const load = async () => {
      const { data, error } = await supabase
        .from("delivery_settings")
        .select("cutoff_hour")
        .maybeSingle();
      if (!error && data) {
        setCutoffHour(data.cutoff_hour);
      }
      setLoading(false);
    };
    load();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from("delivery_settings")
        .upsert({ cutoff_hour: cutoffHour }, { onConflict: "tenant_id" });
      if (error) throw error;
      toast({ title: "Configuración guardada", status: "success", duration: 3000 });
    } catch (err) {
      console.error("Error guardando configuración de entrega:", err);
      toast({
        title: "No se pudo guardar",
        description: err.message,
        status: "error",
        duration: 5000,
      });
    } finally {
      setSaving(false);
    }
  };

  const cardBg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.600");
  const textColor = useColorModeValue("gray.800", "white");
  const subtitleColor = useColorModeValue("gray.500", "gray.400");

  return (
    <Box minH="100vh" bg={useColorModeValue("gray.50", "gray.900")}>
      <SmartHeader />
      <Container maxW="lg" py={8}>
        <Text fontSize="xl" fontWeight="bold" color={textColor} mb={1}>
          Configuración de retiros
        </Text>
        <Text fontSize="sm" color={subtitleColor} mb={6}>
          Define la hora a partir de la cual ya no se puede prometer entrega
          para "Hoy" en el módulo de Ventas.
        </Text>

        <Box bg={cardBg} border={`1px solid ${borderColor}`} borderRadius="16px" p={6}>
          <HStack mb={4}>
            <Icon as={Clock} color="#00A88E" />
            <Text fontWeight="semibold" color={textColor}>Hora de corte</Text>
          </HStack>
          <Select
            value={cutoffHour}
            onChange={(e) => setCutoffHour(Number(e.target.value))}
            isDisabled={loading}
            borderRadius="lg"
            mb={2}
          >
            {hourOptions.map((h) => (
              <option key={h} value={h}>{formatHour(h)}</option>
            ))}
          </Select>
          <Text fontSize="xs" color={subtitleColor} mb={6}>
            Ejemplo: si eliges 3:00 PM, una venta hecha a las 4:00 PM ya no
            podrá ofrecer "Hoy" como entrega — se sugiere "Mañana" automáticamente.
          </Text>
          <Button
            bg="#00A88E"
            color="white"
            _hover={{ bg: "#00967f" }}
            onClick={handleSave}
            isLoading={saving}
            w="full"
          >
            Guardar
          </Button>
        </Box>
      </Container>
    </Box>
  );
};

export default DeliverySettings;
