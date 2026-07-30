import React, { useEffect, useState } from 'react';
import { Center, Spinner, Image, Box, Text } from '@chakra-ui/react';
import { supabase } from '../../../api/supabase';

const CertificateLogo = ({ tenantId }) => {
  const [logoUrl, setLogoUrl] = useState(null);
  const [loading, setLoading] = useState(true);

  // Función para convertir una imagen de URL a base64
  const convertImageToBase64 = async (imageUrl) => {
    try {
      const response = await fetch(imageUrl, { mode: 'cors' });
      const blob = await response.blob();

      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result); // devuelve el base64
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error("Error al convertir la imagen a base64:", error);
      return null;
    }
  };

  useEffect(() => {
    if (!tenantId) {
      setLoading(false);
      return;
    }

    (async () => {
      const { data, error } = await supabase
        .from('logos')
        .select('logo_url')
        .eq('tenant_id', tenantId)
        .single();

      if (error) {
        console.error('Error al obtener el logo:', error);
        setLoading(false);
        return;
      }

      const base64Image = await convertImageToBase64(data.logo_url);

      if (base64Image) {
        setLogoUrl(base64Image);
      }

      setLoading(false);
    })();
  }, [tenantId]);

  if (loading) {
    return (
      <Center my={2}>
        <Spinner size="lg" />
      </Center>
    );
  }

  if (!logoUrl) {
    return (
      <Box textAlign="center" my={2}>
        <Text color="gray.500">Sin logo configurado</Text>
      </Box>
    );
  }

  return (
    <Center my={2}>
      <Image src={logoUrl} alt="Logo de la óptica" maxW="200px" />
    </Center>
  );
};

export default CertificateLogo;
