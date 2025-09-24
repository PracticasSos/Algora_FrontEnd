import { useRef, useState } from "react";
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  HStack,
  Icon,
  Image,
  Spinner,
  Textarea,
  useColorModeValue,
  VStack,
  Tooltip,
  Text,
  Divider,
} from "@chakra-ui/react";
import { supabase } from "../../../api/supabase";
import { FiCamera, FiUpload } from "react-icons/fi";

const ObservationSection = ({ setFormData }) => {
  const cameraInputRef = useRef();
  const fileInputRef = useRef();

  const [observation, setObservation] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadedUrl, setUploadedUrl] = useState("");

  function resizeImage(file, maxWidth = 800, maxHeight = 800, quality = 0.7) {
    return new Promise((resolve) => {
      const img = new window.Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        if (width > maxWidth) {
          height *= maxWidth / width;
          width = maxWidth;
        }
        if (height > maxHeight) {
          width *= maxHeight / height;
          height = maxHeight;
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob((blob) => resolve(blob), 'image/jpeg', quality);
      };
      img.src = URL.createObjectURL(file);
    });
  }

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);

    const fileName = `${Date.now()}-${file.name}`;
    const filePath = `observation/${fileName}`;
    const optimizedBlob = await resizeImage(file);
    const { data: uploadData, error } = await supabase.storage.from("observation").upload(filePath, optimizedBlob);

    if (error) {
      console.error("Error al subir la imagen:", error.message);
    } else {
      const { data } = supabase.storage.from("observation").getPublicUrl(filePath);
      setUploadedUrl(data.publicUrl);
      setFormData((prev) => ({
        ...prev,
        observation_img: data.publicUrl,
      }));

      // Actualiza observation_img en la base de datos
      if (typeof setFormData === 'function') {
        setFormData((prev) => {
          if (prev && prev.id) {
            supabase.from('sales').update({ observation_img: data.publicUrl }).eq('id', prev.id);
          }
          return prev;
        });
      }
    }

    setUploading(false);
  };

  const boxBg = useColorModeValue('white', 'gray.800');
  const textColor = useColorModeValue('gray.800', 'white');
  const borderColor = useColorModeValue('gray.300', 'gray.600');
  const selectBg = useColorModeValue('gray.50', 'gray.700');
  const accentColor = useColorModeValue('blue.500', 'blue.300');

  const handleObservationChange = async (e) => {
    const value = e.target.value;
    setObservation(value);
    setFormData((prev) => ({ ...prev, observation_text: value }));
    setFormData((prev) => {
      if (prev && prev.id) {
        supabase.from('sales').update({ observation_text: value }).eq('id', prev.id);
      }
      return prev;
    });
  };

  return (
    <Box
      bg={boxBg}
      borderRadius="xl"
      p={{ base: 4, md: 6 }}
      mb={6}
      maxW="540px"
      mx="auto"
      boxShadow="md"
      border={`1px solid ${borderColor}`}
      transition="box-shadow 0.2s"
      _hover={{ boxShadow: "lg" }}
    >
      <FormControl>
        <VStack align="stretch" spacing={4}>
          <FormLabel fontWeight="bold" color={accentColor} fontSize="lg">
            Observaciones
          </FormLabel>
          <Textarea
            value={observation}
            onChange={handleObservationChange}
            minHeight="110px"
            minWidth="350px"
            resize="vertical"
            bg={selectBg}
            borderColor={borderColor}
            color={textColor}
            fontSize="md"
            placeholder="Escribe aquí tus observaciones..."
            _placeholder={{ color: useColorModeValue('gray.400', 'gray.500') }}
            _hover={{
              borderColor: accentColor,
            }}
            _focus={{
              borderColor: accentColor,
              boxShadow: `0 0 0 2px ${accentColor}`,
            }}
            borderRadius="md"
            transition="border-color 0.2s"
          />

          <Divider />

          <Text fontWeight="medium" color={textColor} mb={1}>
            Adjunta una imagen (opcional)
          </Text>
          <HStack spacing={3} flexWrap="wrap">
            <Tooltip label="Tomar foto con cámara" hasArrow>
              <Button
                leftIcon={<Icon as={FiCamera} />}
                size="sm"
                colorScheme="blue"
                variant="outline"
                onClick={() => cameraInputRef.current.click()}
                borderRadius="md"
                boxShadow="sm"
              >
                Tomar foto
              </Button>
            </Tooltip>
            <Tooltip label="Subir imagen desde tu dispositivo" hasArrow>
              <Button
                leftIcon={<Icon as={FiUpload} />}
                size="sm"
                colorScheme="blue"
                variant="outline"
                onClick={() => fileInputRef.current.click()}
                borderRadius="md"
                boxShadow="sm"
              >
                Subir imagen
              </Button>
            </Tooltip>
            {uploading && <Spinner size="sm" color={accentColor} />}
          </HStack>

          <input
            type="file"
            accept="image/*"
            capture="environment"
            hidden
            className="no-pdf"
            ref={cameraInputRef}
            onChange={handleFileChange}
          />
          <input
            type="file"
            accept="image/*"
            hidden
            className="no-pdf"
            ref={fileInputRef}
            onChange={handleFileChange}
          />

          {uploadedUrl && (
            <Box mt={3} textAlign="center">
              <Text fontSize="sm" color={accentColor} mb={2}>
                Imagen subida:
              </Text>
              <Image
                src={uploadedUrl}
                alt="Observación"
                maxW="320px"
                maxH="220px"
                mx="auto"
                borderRadius="lg"
                objectFit="cover"
                boxShadow="md"
                border={`1px solid ${borderColor}`}
              />
            </Box>
          )}
        </VStack>
      </FormControl>
    </Box>
  );
};

export default ObservationSection;
