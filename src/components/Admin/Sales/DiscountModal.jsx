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
  VStack,
  HStack,
  SimpleGrid,
  Text,
  Divider,
  useColorModeValue,
} from "@chakra-ui/react";

const ACCENT = "#00A88E";

/**
 * Fila de descuento de doble vía: puedes escribir el % y el total final se
 * calcula solo, o escribir el total final y el % se calcula solo — sin
 * importar cuál de los dos edites primero.
 */
const DiscountRow = ({ label, basePrice, percent, onChangePercent, finalPrice, onChangeFinal, borderColor, selectBg }) => {
  const safeBase = Number(basePrice) || 0;

  const handlePercentChange = (e) => {
    const pct = Math.max(0, Math.min(100, Number(e.target.value) || 0));
    onChangePercent(pct);
  };

  const handleFinalChange = (e) => {
    const val = e.target.value;
    if (val === "" || Number(safeBase) <= 0) {
      onChangePercent(0);
      return;
    }
    const finalNum = Math.max(0, Number(val) || 0);
    const pct = Math.max(0, Math.min(100, (1 - finalNum / safeBase) * 100));
    onChangePercent(Number(pct.toFixed(1)));
  };

  return (
    <FormControl>
      <FormLabel fontSize="sm" fontWeight="semibold">
        {label} <Text as="span" fontSize="xs" color="gray.500">· precio original ${safeBase.toFixed(2)}</Text>
      </FormLabel>
      <SimpleGrid columns={2} spacing={3}>
        <InputGroup>
          <Input
            type="number"
            placeholder="0"
            value={percent || ""}
            onChange={handlePercentChange}
            borderColor={borderColor}
            borderRadius="lg"
            bg={selectBg}
          />
          <InputRightElement pointerEvents="none" color="gray.400">%</InputRightElement>
        </InputGroup>
        <InputGroup>
          <InputRightElement pointerEvents="none" color="gray.400" left="10px" right="auto">$</InputRightElement>
          <Input
            type="number"
            placeholder={safeBase.toFixed(2)}
            value={finalPrice === "" || finalPrice === undefined || finalPrice === null ? "" : finalPrice}
            onChange={handleFinalChange}
            borderColor={borderColor}
            borderRadius="lg"
            bg={selectBg}
            pl="24px"
          />
        </InputGroup>
      </SimpleGrid>
    </FormControl>
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

  const selectedTreatments = selectedTreatmentIds
    .map((id) => treatmentsCatalog.find((t) => t.id === id))
    .filter(Boolean);

  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered size="sm">
      <ModalOverlay />
      <ModalContent bg={bgColor} borderRadius="20px">
        <ModalHeader fontSize="md">Aplicar descuento</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack spacing={5} align="stretch">
            <HStack fontSize="10px" color="gray.500" justify="flex-end" spacing={4}>
              <Text w="70px" textAlign="center">% desc.</Text>
              <Text w="90px" textAlign="center">Total final</Text>
            </HStack>

            <DiscountRow
              label={`Armazón ${frameName ? `· ${frameName}` : ""}`}
              basePrice={frameBasePrice}
              percent={discountFrame}
              onChangePercent={(pct) => onChangeDiscountFrame({ target: { name: "discount_frame", value: pct } })}
              finalPrice={frameFinalPrice}
              onChangeFinal={onChangeFrameFinal}
              borderColor={borderColor}
              selectBg={selectBg}
            />

            <DiscountRow
              label={`Luna ${lensName ? `· ${lensName}` : ""}`}
              basePrice={lensBasePrice}
              percent={discountLens}
              onChangePercent={(pct) => onChangeDiscountLens({ target: { name: "discount_lens", value: pct } })}
              finalPrice={lensFinalPrice}
              onChangeFinal={onChangeLensFinal}
              borderColor={borderColor}
              selectBg={selectBg}
            />

            {selectedTreatments.length > 0 && (
              <>
                <Divider />
                <Text fontSize="xs" fontWeight="bold" color={ACCENT} textTransform="uppercase" letterSpacing="wide">
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
                    />
                  );
                })}
              </>
            )}

            <Text fontSize="xs" color="gray.500">
              Deja el % en 0, o el total igual al precio original, si no aplica descuento.
            </Text>
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
