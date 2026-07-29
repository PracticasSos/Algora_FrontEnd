import React, { useRef, useEffect } from "react";
import SignaturePad from "signature_pad";
import { Box, Button, useColorModeValue, Text, Icon } from "@chakra-ui/react";
import { MdRefresh } from "react-icons/md";

const SignaturePadComponent = ({ onSave }) => {
  const canvasRef = useRef(null);
  const signaturePadRef = useRef(null);

  // La firma siempre se exporta en blanco/negro, sin importar el modo
  // claro/oscuro de la app — el certificado se imprime en papel blanco,
  // y una firma con fondo oscuro se ve como una caja negra en el PDF.
  const canvasBg = "#ffffff";
  const penColor = "#1A1A1A";
  const borderColor = useColorModeValue("gray.300", "gray.600");
  const boxShadow = useColorModeValue(
    "0 4px 16px rgba(0,0,0,0.10)",
    "0 4px 16px rgba(0,0,0,0.40)"
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
        penColor: penColor
      });
      initializeCanvas();
    }
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
    }
    onSave(null); // avisa de inmediato, no hay que esperar al intervalo
  };

  return (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      p={[3, 4]}
      width={["100%", "90%", "420px"]}
      mx="auto"
      mb={0}
      bg={useColorModeValue("white", "gray.800")}
      borderRadius="xl"
      boxShadow={boxShadow}
      borderWidth="1px"
      borderColor={borderColor}
      transition="box-shadow 0.2s"
    >
      <Text
        fontWeight="bold"
        fontSize="lg"
        mb={2}
        color={useColorModeValue("gray.700", "gray.200")}
        letterSpacing="wide"
      >
        Firma aquí
      </Text>
      <Box
        position="relative"
        width="100%"
        display="flex"
        justifyContent="center"
        alignItems="center"
        mb={2}
      >
        <canvas
          ref={canvasRef}
          width={510}
          height={150}
          style={{
            border: `2px dashed ${borderColor}`,
            borderRadius: "16px",
            background: canvasBg,
            boxShadow: boxShadow,
            display: "block",
            transition: "border-color 0.2s",
            cursor: "crosshair",
            outline: "none"
          }}
          tabIndex={0}
        />

      </Box>
      <Box
        display="flex"
        flexDirection="row"
        justifyContent="center"
        alignItems="center"
        mt={2}
        width="full"
        gap={2}
      >
        <Button
          leftIcon={<Icon as={MdRefresh} />}
          colorScheme="blue"
          variant="outline"
          onClick={clearSignature}
          size="sm"
          borderRadius="md"
          boxShadow="sm"
          _hover={{ boxShadow: "md", bg: useColorModeValue("blue.50", "blue.900") }}
        >
          Borrar firma
        </Button>
      </Box>
      <Text
        mt={3}
        fontSize="xs"
        color={useColorModeValue("gray.500", "gray.400")}
        textAlign="center"
      >
        Tu firma se guarda automáticamente
      </Text>
    </Box>
  );
};

export default SignaturePadComponent;