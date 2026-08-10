import React, { useRef, useEffect, useState } from "react";
import { Box, Button, useColorModeValue, Text, Icon, HStack } from "@chakra-ui/react";
import SignaturePad from "signature_pad";
import { RotateCcw, PenTool, CheckCircle2 } from "lucide-react";

const ACCENT = "#00A88E";

const SignaturePadComponent = ({ onSave }) => {
  const canvasRef = useRef(null);
  const signaturePadRef = useRef(null);
  const [hasSignature, setHasSignature] = useState(false);

  // La firma siempre se exporta en blanco/negro, sin importar el modo
  // claro/oscuro de la app — el certificado se imprime en papel blanco,
  // y una firma con fondo oscuro se ve como una caja negra en el PDF.
  const canvasBg = "#ffffff";
  const penColor = "#1A1A1A";
  const cardBg = useColorModeValue("white", "gray.700");
  const borderColor = useColorModeValue("gray.200", "gray.600");
  const boxShadow = useColorModeValue(
    "0 20px 45px -25px rgba(0,168,142,0.35)",
    "0 20px 45px -25px rgba(0,168,142,0.45)"
  );

  const initializeCanvas = () => {
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext("2d");
      ctx.fillStyle = canvasBg;
      ctx.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    }
  };

  useEffect(() => {
    if (canvasRef.current) {
      signaturePadRef.current = new SignaturePad(canvasRef.current, {
        backgroundColor: canvasBg,
        penColor: penColor,
        minWidth: 1.2,
        maxWidth: 2.5,
      });
      initializeCanvas();
      signaturePadRef.current.addEventListener("endStroke", () => {
        setHasSignature(!signaturePadRef.current.isEmpty());
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canvasBg, penColor]);

  useEffect(() => {
    const interval = setInterval(() => {
      const signatureDataUrl = getSignatureDataUrl();
      onSave(signatureDataUrl); // se avisa también cuando queda vacío (null)
    }, 1000);

    return () => clearInterval(interval);
  }, [onSave]);

  const getSignatureDataUrl = () => {
    if (signaturePadRef.current && !signaturePadRef.current.isEmpty()) {
      return signaturePadRef.current.toDataURL();
    }
    return null;
  };

  const clearSignature = () => {
    if (signaturePadRef.current) {
      signaturePadRef.current.clear();
      initializeCanvas();
      setHasSignature(false);
    }
    onSave(null); // avisa de inmediato, no hay que esperar al intervalo
  };

  return (
    <Box
      width={["100%", "90%", "420px"]}
      mx="auto"
      mb={0}
      bg={cardBg}
      borderRadius="20px"
      boxShadow={boxShadow}
      borderWidth="1px"
      borderColor={borderColor}
      overflow="hidden"
      transition="box-shadow 0.2s"
    >
      <Box h="4px" bgGradient="linear(to-r, #00A88E, #2DD4BF, #00A88E)" />
      <Box p={[4, 5]}>
        <HStack spacing={2} mb={3} justify="center">
          <Icon as={hasSignature ? CheckCircle2 : PenTool} boxSize="16px" color={ACCENT} />
          <Text fontWeight="bold" fontSize="md" color={useColorModeValue("gray.700", "gray.100")} letterSpacing="tight">
            {hasSignature ? "Firma capturada" : "Firma aquí"}
          </Text>
        </HStack>

        <Box position="relative" width="100%" display="flex" justifyContent="center" alignItems="center" mb={3}>
          <canvas
            ref={canvasRef}
            width={510}
            height={150}
            style={{
              border: `2px dashed ${hasSignature ? ACCENT : "#B7BFCA"}`,
              borderRadius: "14px",
              background: canvasBg,
              display: "block",
              transition: "border-color 0.2s",
              cursor: "crosshair",
              outline: "none",
              width: "100%",
              maxWidth: "460px",
            }}
            tabIndex={0}
          />
        </Box>

        <Box display="flex" justifyContent="center" alignItems="center" width="full">
          <Button
            leftIcon={<Icon as={RotateCcw} boxSize="14px" />}
            variant="outline"
            borderColor={ACCENT}
            color={ACCENT}
            onClick={clearSignature}
            size="sm"
            borderRadius="10px"
            _hover={{ bg: useColorModeValue("rgba(0,168,142,0.08)", "rgba(0,168,142,0.15)") }}
          >
            Borrar firma
          </Button>
        </Box>

        <Text mt={3} fontSize="xs" color={useColorModeValue("gray.500", "gray.400")} textAlign="center">
          Tu firma se guarda automáticamente
        </Text>
      </Box>
    </Box>
  );
};

export default SignaturePadComponent;