import { useState, useRef } from "react";
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  Button,
  Box,
  Text,
  Image,
  Input,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Alert,
  AlertIcon,
  Progress,
  useColorModeValue,
  Icon,
  SimpleGrid,
  VStack,
  HStack,
} from "@chakra-ui/react";
import { Camera, ScanLine } from "lucide-react";

const ACCENT = "#00A88E";

const measureFields = [
  { label: "Esfera", key: "sphere" },
  { label: "Cilindro", key: "cylinder" },
  { label: "Eje", key: "axis" },
  { label: "Prisma", key: "prism" },
  { label: "ADD", key: "add" },
  { label: "AV VL", key: "av_vl" },
  { label: "AV VP", key: "av_vp" },
  { label: "DNP", key: "dnp" },
  { label: "ALT", key: "alt" },
];

const emptyGrid = () => {
  const g = {};
  measureFields.forEach(({ key }) => {
    g[`${key}_right`] = "";
    g[`${key}_left`] = "";
  });
  return g;
};

// Parser calibrado con un ticket real de autorefractor (modelo FA-6100CK):
//   <R>   S        C        A
//         +0.50   -2.50     3
//         +0.50   -2.50     3
//         +0.50   -2.25     3
//    *    +0.50   -2.50     3     <- lectura promedio (la que se usa)
//   <L>   ... igual ...
//   VD=12
//   PD=62
// Se toma la ÚLTIMA fila de 3 números (S, C, A) de cada bloque de ojo, que
// es la lectura promedio marcada con "*". VD y PD vienen una sola vez y
// aplican a ambos ojos (no vienen separados por ojo en este formato).
const DATA_ROW = /([+-]?\d{1,2}\.\d{2})\s+([+-]?\d{1,2}\.\d{2})\s+(\d{1,3})/g;

const parseAutorefractorTicket = (text) => {
  const grid = emptyGrid();

  // Separar el texto en bloque de ojo derecho <R> e izquierdo <L>
  const lIndex = text.search(/<?\s*L\s*>?/i);
  const rSection = lIndex >= 0 ? text.slice(0, lIndex) : text;
  const lSection = lIndex >= 0 ? text.slice(lIndex) : "";

  const lastRowOf = (section) => {
    const matches = [...section.matchAll(DATA_ROW)];
    return matches.length ? matches[matches.length - 1] : null;
  };

  const rRow = lastRowOf(rSection);
  if (rRow) {
    grid.sphere_right = rRow[1];
    grid.cylinder_right = rRow[2];
    grid.axis_right = rRow[3];
  }

  const lRow = lastRowOf(lSection);
  if (lRow) {
    grid.sphere_left = lRow[1];
    grid.cylinder_left = lRow[2];
    grid.axis_left = lRow[3];
  }

  // VD y PD aparecen una sola vez (no por ojo) — se replican en las dos
  // columnas, el doctor puede ajustarlos si su formato los necesita distintos.
  const pdMatch = text.match(/PD\s*=?\s*(\d{1,3})/i);
  if (pdMatch) {
    grid.dnp_right = pdMatch[1];
    grid.dnp_left = pdMatch[1];
  }
  const vdMatch = text.match(/VD\s*=?\s*(\d{1,3})/i);
  if (vdMatch) {
    grid.alt_right = vdMatch[1];
    grid.alt_left = vdMatch[1];
  }

  return grid;
};

// Parser calibrado con un ticket real de LENSÓMETRO (AUTO LENSMETER):
//   <R>          <L>
//   SPH:  0.00   0.00
//   CYL:- 2.50   -3.00
//   AXS:  3      0
//   RPD:  41.0
// Aquí cada etiqueta trae directo los dos valores (OD y OI) en la misma
// línea, sin lecturas repetidas ni promedio — formato más simple.
const NUMBER_WITH_SPACED_SIGN = /([+-])?\s*(\d{1,3}(?:\.\d{1,2})?)/g;

const LENSMETER_LABELS = [
  { pattern: /\bSPH\s*:?/i, key: "sphere" },
  { pattern: /\bCYL\s*:?/i, key: "cylinder" },
  { pattern: /\bAXS?\s*:?/i, key: "axis" },
];

const parseLensmeterTicket = (text) => {
  const grid = emptyGrid();
  const lines = text.split(/\n+/);

  LENSMETER_LABELS.forEach(({ pattern, key }) => {
    for (const line of lines) {
      if (pattern.test(line)) {
        const after = line.replace(pattern, "");
        const nums = [...after.matchAll(NUMBER_WITH_SPACED_SIGN)].map((m) => `${m[1] || ""}${m[2]}`);
        if (nums[0] !== undefined) grid[`${key}_right`] = nums[0];
        if (nums[1] !== undefined) grid[`${key}_left`] = nums[1];
        break;
      }
    }
  });

  // RPD (distancia pupilar de lectura) viene una sola vez, se replica en las dos columnas
  const rpdMatch = text.match(/RPD\s*:?\s*([+-]?\d{1,3}(?:\.\d{1,2})?)/i);
  if (rpdMatch) {
    grid.dnp_right = rpdMatch[1];
    grid.dnp_left = rpdMatch[1];
  }

  return grid;
};

// Se prueban los dos formatos y se usa el que haya logrado llenar más
// campos — así el escáner reconoce solo si viene de un autorefractor o de
// un lensómetro, sin que el doctor tenga que elegir nada.
const countFilled = (grid) => Object.values(grid).filter((v) => v !== "").length;

const parseTicket = (text) => {
  const autorefractorGrid = parseAutorefractorTicket(text);
  const lensmeterGrid = parseLensmeterTicket(text);
  return countFilled(lensmeterGrid) > countFilled(autorefractorGrid) ? lensmeterGrid : autorefractorGrid;
};

const ScanRxModal = ({ isOpen, onClose, onApply }) => {
  const [imageUrl, setImageUrl] = useState(null);
  const [rawText, setRawText] = useState("");
  const [grid, setGrid] = useState(emptyGrid());
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef(null);

  const cardBg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.600");
  const inputBg = useColorModeValue("gray.50", "gray.700");
  const subtitleColor = useColorModeValue("gray.500", "gray.400");

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImageUrl(URL.createObjectURL(file));
    setRawText("");
    setGrid(emptyGrid());
    setIsProcessing(true);
    setProgress(0);

    try {
      const Tesseract = await import("tesseract.js");
      const { data } = await Tesseract.recognize(file, "eng", {
        logger: (m) => {
          if (m.status === "recognizing text") {
            setProgress(Math.round(m.progress * 100));
          }
        },
      });

      setRawText(data.text || "");
      // Borrador basado en las etiquetas (SPH/CYL/AX/PD/ADD) que imprime el
      // autorefractor — mucho más confiable que llenar en orden, porque cada
      // número queda anclado a su etiqueta real. Aun así, siempre a revisar
      // antes de aplicar: el OCR puede confundir letras/números parecidos.
      setGrid(parseTicket(data.text || ""));
    } catch (err) {
      console.error("Error en OCR:", err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleGridChange = (cellKey, value) => {
    setGrid((prev) => ({ ...prev, [cellKey]: value }));
  };

  const handleApply = () => {
    onApply(grid);
    handleClose();
  };

  const handleClose = () => {
    setImageUrl(null);
    setRawText("");
    setGrid(emptyGrid());
    setIsProcessing(false);
    setProgress(0);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size={{ base: "full", md: "4xl" }} isCentered>
      <ModalOverlay />
      <ModalContent bg={cardBg} borderRadius={{ base: 0, md: "20px" }}>
        <ModalHeader fontSize="md">
          <HStack>
            <Icon as={ScanLine} color={ACCENT} />
            <Text>Escanear receta</Text>
          </HStack>
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody pb={6}>
          <Alert status="warning" borderRadius="12px" mb={4} fontSize="sm">
            <AlertIcon />
            Reconoce tickets de autorefractor y de lensómetro automáticamente.
            Revisa cada valor antes de aplicar — el OCR puede confundirse con manchas o mala iluminación.
          </Alert>

          {!imageUrl ? (
            <VStack
              spacing={3}
              p={10}
              borderRadius="16px"
              border={`2px dashed ${borderColor}`}
              cursor="pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              <Icon as={Camera} boxSize="32px" color={ACCENT} />
              <Text fontWeight="semibold">Tomar foto o subir imagen de la receta</Text>
              <Text fontSize="xs" color={subtitleColor}>Toca aquí</Text>
              <Input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                display="none"
                onChange={handleFileChange}
              />
            </VStack>
          ) : (
            <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={5}>
              <Box>
                <Image src={imageUrl} alt="Receta escaneada" borderRadius="14px" w="100%" maxH="320px" objectFit="contain" bg={inputBg} />
                <Button size="sm" variant="link" mt={2} onClick={() => fileInputRef.current?.click()}>
                  Volver a tomar / subir otra foto
                </Button>
                <Input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  display="none"
                  onChange={handleFileChange}
                />

                {isProcessing && (
                  <Box mt={3}>
                    <Text fontSize="xs" color={subtitleColor} mb={1}>Leyendo la imagen... {progress}%</Text>
                    <Progress value={progress} size="sm" borderRadius="full" colorScheme="teal" />
                  </Box>
                )}

                {rawText && (
                  <Box mt={4} p={3} borderRadius="10px" bg={inputBg} maxH="150px" overflowY="auto">
                    <Text fontSize="10px" fontWeight="bold" color={subtitleColor} mb={1}>TEXTO DETECTADO (referencia)</Text>
                    <Text fontSize="xs" whiteSpace="pre-wrap" fontFamily="mono">{rawText || "—"}</Text>
                  </Box>
                )}
              </Box>

              <Box overflowX="auto">
                <Text fontSize="xs" fontWeight="bold" color={ACCENT} mb={2} textTransform="uppercase">
                  Verifica y corrige cada valor
                </Text>
                <Table size="sm">
                  <Thead>
                    <Tr>
                      <Th></Th>
                      {measureFields.map(({ key, label }) => (
                        <Th key={key} fontSize="9px" textAlign="center" p={1}>{label}</Th>
                      ))}
                    </Tr>
                  </Thead>
                  <Tbody>
                    {[{ label: "OD", side: "right" }, { label: "OI", side: "left" }].map(({ label, side }) => (
                      <Tr key={side}>
                        <Td fontWeight="bold" color={ACCENT} p={1}>{label}</Td>
                        {measureFields.map(({ key }) => (
                          <Td key={key} p={1}>
                            <Input
                              size="sm"
                              textAlign="center"
                              borderRadius="8px"
                              bg={inputBg}
                              borderColor={borderColor}
                              value={grid[`${key}_${side}`] || ""}
                              onChange={(e) => handleGridChange(`${key}_${side}`, e.target.value)}
                              _focus={{ borderColor: ACCENT, boxShadow: `0 0 0 1px ${ACCENT}` }}
                            />
                          </Td>
                        ))}
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              </Box>
            </SimpleGrid>
          )}
        </ModalBody>
        <ModalFooter gap={3}>
          <Button variant="ghost" onClick={handleClose}>Cancelar</Button>
          <Button
            bg={ACCENT}
            color="white"
            _hover={{ bg: "#00967f" }}
            onClick={handleApply}
            isDisabled={!imageUrl || isProcessing}
          >
            Aplicar a la tabla
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default ScanRxModal;
