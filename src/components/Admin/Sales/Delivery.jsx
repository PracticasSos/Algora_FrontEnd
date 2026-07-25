import {
  Box,
  Text,
  useColorModeValue,
  useToast,
  Flex,
  Input,
  Spinner,
} from "@chakra-ui/react";
import { Clock } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "../../../api/supabase";

const basePresets = [
  { label: "Hoy", days: 0 },
  { label: "Mañana", days: 1 },
  { label: "En 3 días", days: 3 },
  { label: "En 8 días", days: 8 },
];

/**
 * Selector rápido de entrega: chips para lo más común (hoy, mañana, 3 u 8
 * días) + opción "Personalizado". Respeta la hora de corte configurada por
 * el Admin (DeliverySettings.jsx): pasada esa hora, "Hoy" deja de ofrecerse.
 */
const Delivery = ({ saleData, setSaleData }) => {
  const [selectedPreset, setSelectedPreset] = useState(null);
  const [showCustom, setShowCustom] = useState(false);
  const [cutoffHour, setCutoffHour] = useState(null);
  const [loadingSettings, setLoadingSettings] = useState(true);
  const toast = useToast();

  useEffect(() => {
    const loadSettings = async () => {
      const { data, error } = await supabase
        .from("delivery_settings")
        .select("cutoff_hour")
        .maybeSingle();
      if (!error && data) setCutoffHour(data.cutoff_hour);
      setLoadingSettings(false);
    };
    loadSettings();
  }, []);

  const isPastCutoff = cutoffHour !== null && new Date().getHours() >= cutoffHour;
  const presets = basePresets.filter((p) => !(p.days === 0 && isPastCutoff));

  const activeBg = useColorModeValue("#E6FBF6", "rgba(0,168,142,0.15)");
  const activeColor = "#00A88E";
  const borderColor = useColorModeValue("gray.200", "gray.600");
  const textColor = useColorModeValue("gray.800", "white");
  const subtitleColor = useColorModeValue("gray.500", "gray.400");
  const selectBg = useColorModeValue("white", "gray.700");

  const applyDate = (date, presetLabel) => {
    const diffInMs = date.getTime() - new Date().getTime();
    const diffInDays = Math.max(0, Math.ceil(diffInMs / (1000 * 60 * 60 * 24)));
    setSaleData((prev) => ({
      ...prev,
      delivery_time: `${diffInDays} día${diffInDays !== 1 ? "s" : ""}`,
      delivery_datetime: date.toISOString(),
    }));
    setSelectedPreset(presetLabel);
  };

  const handlePresetClick = (preset) => {
    const date = new Date();
    date.setDate(date.getDate() + preset.days);
    date.setHours(17, 0, 0, 0); // 5pm por defecto, se puede ajustar en "Personalizado"
    if (date < new Date()) date.setDate(date.getDate() + 1);
    setShowCustom(false);
    applyDate(date, preset.label);
  };

  const handleCustomChange = (e) => {
    if (!e.target.value) return;
    const date = new Date(e.target.value);
    if (date < new Date()) {
      toast({
        title: "Fecha inválida",
        description: "No se puede seleccionar una fecha anterior a la actual.",
        status: "error",
        duration: 4000,
      });
      return;
    }
    applyDate(date, "custom");
  };

  const minDateTime = (() => {
    const now = new Date();
    return new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
  })();

  const deliveryText = saleData.delivery_datetime
    ? new Date(saleData.delivery_datetime).toLocaleString("es-EC", {
        weekday: "long",
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";

  return (
    <Box w="100%">
      {isPastCutoff && (
        <Text fontSize="xs" color="orange.400" mb={2}>
          Ya pasó la hora de corte ({cutoffHour % 12 === 0 ? 12 : cutoffHour % 12}:00 {cutoffHour < 12 ? "AM" : "PM"}) — "Hoy" ya no está disponible.
        </Text>
      )}
      <Flex wrap="wrap" gap={2} mb={3}>
        {presets.map((preset) => (
          <Box
            key={preset.label}
            as="button"
            type="button"
            px={4}
            py={2}
            borderRadius="full"
            border={selectedPreset === preset.label ? `2px solid ${activeColor}` : `1px solid ${borderColor}`}
            bg={selectedPreset === preset.label ? activeBg : selectBg}
            color={selectedPreset === preset.label ? activeColor : textColor}
            fontSize="sm"
            fontWeight="semibold"
            onClick={() => handlePresetClick(preset)}
            _hover={{ borderColor: activeColor }}
            transition="all 0.15s ease"
          >
            {preset.label}
          </Box>
        ))}
        <Box
          as="button"
          type="button"
          px={4}
          py={2}
          borderRadius="full"
          border={selectedPreset === "custom" ? `2px solid ${activeColor}` : `1px solid ${borderColor}`}
          bg={selectedPreset === "custom" ? activeBg : selectBg}
          color={selectedPreset === "custom" ? activeColor : textColor}
          fontSize="sm"
          fontWeight="semibold"
          onClick={() => setShowCustom((v) => !v)}
          _hover={{ borderColor: activeColor }}
          transition="all 0.15s ease"
        >
          Personalizado
        </Box>
      </Flex>

      {showCustom && (
        <Input
          type="datetime-local"
          min={minDateTime}
          onChange={handleCustomChange}
          value={saleData.delivery_datetime ? saleData.delivery_datetime.slice(0, 16) : ""}
          borderRadius="lg"
          height="42px"
          bg={selectBg}
          borderColor={borderColor}
          color={textColor}
          mb={2}
        />
      )}

      {deliveryText ? (
        <Flex align="center" gap={2} color={activeColor}>
          <Clock size={16} />
          <Text fontSize="sm" fontWeight="medium">Entrega: {deliveryText}</Text>
        </Flex>
      ) : (
        <Text fontSize="xs" color={subtitleColor}>Elige cuándo se entrega.</Text>
      )}
    </Box>
  );
};

export default Delivery;
