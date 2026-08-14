import { useEffect, useState } from "react";
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  Button,
  FormControl,
  FormLabel,
  Input,
  InputGroup,
  InputRightElement,
  InputLeftElement,
  VStack,
  HStack,
  SimpleGrid,
  Text,
  Box,
  Icon,
  useColorModeValue,
} from "@chakra-ui/react";
import { ArrowRight } from "lucide-react";

const ACCENT = "#00A88E";

/**
 * Tarjeta de descuento por ítem, en un orden claro: primero el precio
 * original bien visible, después los campos para aplicar el descuento
 * (% o total final — cualquiera de los dos calcula al otro), y por último
 * cuánto se está ahorrando en total.
 *
 * Cada campo maneja su propio texto mientras se escribe (en vez de estar
 * atado directo al valor calculado) — así se puede borrar y escribir un
 * número nuevo con libertad, sin que el precio original se imponga solo
 * en cuanto el campo queda vacío por un instante.
 */
const DiscountRow = ({ label, basePrice, percent, onChangePercent, finalPrice, onChangeFinal, borderColor, selectBg, cardBg }) => {
  const safeBase = Number(basePrice) || 0;
  const displayFinal =
    finalPrice === "" || finalPrice === undefined || finalPrice === null ? safeBase : Number(finalPrice);
  const savings = Math.max(0, safeBase - displayFinal);
  const hasDiscount = savings > 0.004;

  const [percentText, setPercentText] = useState(percent ? String(percent) : "");
  const [finalText, setFinalText] = useState(
    finalPrice === "" || finalPrice === undefined || finalPrice === null ? safeBase.toFixed(2) : String(finalPrice)
  );
  const [editingField, setEditingField] = useState(null); // "percent" | "final" | null

  // Se sincroniza con lo que llega de afuera, pero nunca mientras el
  // usuario está escribiendo en ESE campo — para no pisarle lo que teclea.
  useEffect(() => {
    if (editingField !== "percent") setPercentText(percent ? String(percent) : "");
  }, [percent, editingField]);

  useEffect(() => {
    if (editingField !== "final") {
      setFinalText(finalPrice === "" || finalPrice === undefined || finalPrice === null ? safeBase.toFixed(2) : String(finalPrice));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [finalPrice, safeBase, editingField]);

  const handlePercentChange = (e) => {
    const raw = e.target.value;
    setPercentText(raw); // se ve tal cual lo escribes, incluido vacío
    if (raw === "") return; // no se toca el precio final mientras el campo está vacío
    const pct = Math.max(0, Math.min(100, Number(raw) || 0));
    onChangePercent(pct);
  };

  const handlePercentBlur = () => {
    setEditingField(null);
    if (percentText === "") onChangePercent(0);
  };

  const handleFinalChange = (e) => {
    const raw = e.target.value;
    setFinalText(raw); // se ve tal cual lo escribes, incluido vacío
    if (raw === "" || Number(safeBase) <= 0) return; // no se recalcula mientras está vacío
    const finalNum = Math.max(0, Number(raw) || 0);
    onChangeFinal(finalNum);
  };

  const handleFinalBlur = () => {
    setEditingField(null);
    if (finalText === "") onChangeFinal(safeBase);
  };

  return (
    <Box
      p={3}
      borderRadius="14px"
      border="1px solid"
      borderColor={hasDiscount ? ACCENT : borderColor}
      bg={cardBg}
    >
      {/* 1. Nombre del ítem y precio original — lo primero que se ve */}
      <HStack justify="space-between" mb={3}>
        <Text fontSize="sm" fontWeight="bold" noOfLines={1}>{label}</Text>
        <VStack spacing={0} align="flex-end">
          <Text fontSize="9px" color="gray.500" textTransform="uppercase" letterSpacing="wide">
            Precio original
          </Text>
          <Text fontSize="md" fontWeight="bold">${safeBase.toFixed(2)}</Text>
        </VStack>
      </HStack>

      {/* 2. Los dos campos que aplican el descuento, con etiqueta clara cada uno */}
      <SimpleGrid columns={2} spacing={3}>
        <FormControl>
          <FormLabel fontSize="10px" color="gray.500" mb={1}>Descuento</FormLabel>
          <InputGroup size="sm">
            <Input
              type="number"
              placeholder="0"
              value={percentText}
              onFocus={() => setEditingField("percent")}
              onChange={handlePercentChange}
              onBlur={handlePercentBlur}
              borderColor={borderColor}
              borderRadius="lg"
              bg={selectBg}
            />
            <InputRightElement pointerEvents="none" color="gray.400" fontSize="xs">%</InputRightElement>
          </InputGroup>
        </FormControl>
        <FormControl>
          <FormLabel fontSize="10px" color="gray.500" mb={1}>Precio final</FormLabel>
          <InputGroup size="sm">
            <InputLeftElement pointerEvents="none" color="gray.400" fontSize="xs">$</InputLeftElement>
            <Input
              type="number"
              placeholder={safeBase.toFixed(2)}
              value={finalText}
              onFocus={() => setEditingField("final")}
              onChange={handleFinalChange}
              onBlur={handleFinalBlur}
              borderColor={borderColor}
              borderRadius="lg"
              bg={selectBg}
              fontWeight={hasDiscount ? "bold" : "normal"}
              color={hasDiscount ? ACCENT : undefined}
            />
          </InputGroup>
        </FormControl>
      </SimpleGrid>

      {/* 3. Cuánto se ahorra, solo si hay descuento aplicado */}
      {hasDiscount && (
        <HStack mt={2} spacing={1} fontSize="xs" color={ACCENT}>
          <Icon as={ArrowRight} boxSize="10px" />
          <Text>Ahorra ${savings.toFixed(2)}</Text>
        </HStack>
      )}
    </Box>
  );
};

/**
 * Modal para aplicar descuento a armazón, luna, y ahora también a cada
 * tratamiento seleccionado — todo en el mismo lugar, con % y total
 * calculándose el uno al otro sin importar cuál escribas primero.
 */
const DiscountModal = ({
  isOpen,
  onClose,
  discountFrame,
  discountLens,
  onChangeDiscountFrame,
  onChangeDiscountLens,
  frameName,
  lensName,
  frameBasePrice = 0,
  lensBasePrice = 0,
  frameFinalPrice,
  lensFinalPrice,
  onChangeFrameFinal,
  onChangeLensFinal,
  treatmentsCatalog = [],
  selectedTreatmentIds = [],
  treatmentPriceOverrides = {},
  setTreatmentPriceOverrides = () => {},
}) => {
  const bgColor = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.600");
  const selectBg = useColorModeValue("gray.50", "gray.700");
  const cardBg = useColorModeValue("gray.50", "gray.750");

  const selectedTreatments = selectedTreatmentIds
    .map((id) => treatmentsCatalog.find((t) => t.id === id))
    .filter(Boolean);

  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered size="sm">
      <ModalOverlay />
      <ModalContent bg={bgColor} borderRadius="20px">
        <ModalHeader fontSize="md">
          Aplicar descuento
          <Text fontSize="xs" fontWeight="normal" color="gray.500" mt={1}>
            Escribe el % o el precio final — el otro se calcula solo.
          </Text>
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack spacing={4} align="stretch">
            <DiscountRow
              label={`Armazón${frameName ? ` · ${frameName}` : ""}`}
              basePrice={frameBasePrice}
              percent={discountFrame}
              onChangePercent={(pct) => onChangeDiscountFrame({ target: { name: "discount_frame", value: pct } })}
              finalPrice={frameFinalPrice}
              onChangeFinal={onChangeFrameFinal}
              borderColor={borderColor}
              selectBg={selectBg}
              cardBg={cardBg}
            />

            <DiscountRow
              label={`Luna${lensName ? ` · ${lensName}` : ""}`}
              basePrice={lensBasePrice}
              percent={discountLens}
              onChangePercent={(pct) => onChangeDiscountLens({ target: { name: "discount_lens", value: pct } })}
              finalPrice={lensFinalPrice}
              onChangeFinal={onChangeLensFinal}
              borderColor={borderColor}
              selectBg={selectBg}
              cardBg={cardBg}
            />

            {selectedTreatments.length > 0 && (
              <>
                <Text fontSize="xs" fontWeight="bold" color={ACCENT} textTransform="uppercase" letterSpacing="wide" pt={1}>
                  Tratamientos
                </Text>
                {selectedTreatments.map((t) => {
                  const base = Number(t.price);
                  const override = treatmentPriceOverrides[t.id];
                  const finalPrice = override !== undefined && override !== "" ? Number(override) : base;
                  const pct = base > 0 && finalPrice < base ? Math.round((1 - finalPrice / base) * 100) : 0;
                  return (
                    <DiscountRow
                      key={t.id}
                      label={t.name}
                      basePrice={base}
                      percent={pct}
                      onChangePercent={(newPct) => {
                        const newFinal = base * (1 - newPct / 100);
                        setTreatmentPriceOverrides((prev) => ({ ...prev, [t.id]: Number(newFinal.toFixed(2)) }));
                      }}
                      finalPrice={override !== undefined ? override : base}
                      onChangeFinal={(val) =>
                        setTreatmentPriceOverrides((prev) => ({ ...prev, [t.id]: val }))
                      }
                      borderColor={borderColor}
                      selectBg={selectBg}
                      cardBg={cardBg}
                    />
                  );
                })}
              </>
            )}
          </VStack>
        </ModalBody>
        <ModalFooter>
          <Button bg={ACCENT} color="white" _hover={{ bg: "#00967f" }} onClick={onClose} w="full">
            Listo
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default DiscountModal;
