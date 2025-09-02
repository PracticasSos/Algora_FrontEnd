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

      // Guardar la URL en la columna observation_img de sales si existe el id
      if (prev && prev.id) {
        try {
          await supabase.from('sales').update({ observation_img: data.publicUrl }).eq('id', prev.id);
        } catch (err) {
          console.error('Error actualizando observation_img en sales:', err);
        }
      }
    }

    setUploading(false);
  };

  const boxBg = useColorModeValue('gray.100', 'gray.700');
  const textColor = useColorModeValue('gray.800', 'white');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const selectBg = useColorModeValue('white', 'gray.600');

  return (
    <Box bg={boxBg}  borderRadius="md" p={4} mb={4} maxW="530px" mx="auto">
      <FormControl>
        <Textarea
          value={observation}
          onChange={(e) => {
            setObservation(e.target.value);
            setFormData((prev) => ({ ...prev, observation: e.target.value }));
          }}
          minHeight="100px"
          resize="vertical"
          bg={selectBg}
          borderColor={borderColor}
          color={textColor}
          _hover={{
            borderColor: useColorModeValue('gray.300', 'gray.500')
          }}
          _focus={{
            borderColor: useColorModeValue('blue.500', 'blue.300'),
            boxShadow: useColorModeValue('0 0 0 1px blue.500', '0 0 0 1px blue.300')
          }}
        />

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

        <HStack spacing={4} mt={3} flexWrap="wrap">
          <Button
            leftIcon={<Icon as={FiCamera} />}
            size="sm"
            color="gray.600"
            variant="outline"
            onClick={() => cameraInputRef.current.click()}
          >
            Tomar foto
          </Button>
          <Button
            leftIcon={<Icon as={FiUpload} />}
            size="sm"
            color="gray.600"
            variant="outline"
            onClick={() => fileInputRef.current.click()}
          >
            Subir imagen
          </Button>
          {uploading && <Spinner size="sm" />}
        </HStack>

        {uploadedUrl && (
          <Box mt={4}>
            <Image
              src={uploadedUrl}
              alt="Observación"
              maxW="100%"
              height="auto"
              borderRadius="md"
              objectFit="contain"
            />
          </Box>
        )}
      </FormControl>
    </Box>
  );
};

export default ObservationSection;
