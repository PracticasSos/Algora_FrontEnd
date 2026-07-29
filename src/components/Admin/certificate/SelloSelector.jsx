import React, { useEffect, useState } from 'react';
import {
  Box,
  Image,
  Text,
  Divider,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Button,
} from '@chakra-ui/react';
import { ChevronDownIcon } from '@chakra-ui/icons';
import { supabase } from '../../../api/supabase';

/**
 * Selector de profesional para el certificado. Antes partía de la tabla
 * `sello`, así que un optómetra sin sello cargado ni siquiera aparecía en
 * la lista. Ahora parte de `users` (todos los que tengan rol Optometra) y
 * el sello es un dato opcional que se agrega si existe.
 */
const SelloSelector = ({ onSelect }) => {
  const [optometrists, setOptometrists] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedData, setSelectedData] = useState(null);
  const [loading, setLoading] = useState(true);

  const convertImageToBase64 = async (imageUrl) => {
    try {
      const response = await fetch(imageUrl, { mode: 'cors' });
      const blob = await response.blob();
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error('Error al convertir el sello a base64:', error);
      return null;
    }
  };

  useEffect(() => {
    const load = async () => {
      const [usersRes, sellosRes] = await Promise.all([
        supabase
          .from('users')
          .select('id, firstname, lastname, ci, senescyt, professional_title')
          .eq('role_id', 2)
          .order('firstname', { ascending: true }),
        supabase.from('sello').select('user_id, sello_url'),
      ]);

      if (usersRes.error) {
        console.error('Error al obtener optómetras:', usersRes.error.message);
        setLoading(false);
        return;
      }

      const sellosByUser = {};
      (sellosRes.data || []).forEach((s) => {
        sellosByUser[s.user_id] = s.sello_url;
      });

      const merged = (usersRes.data || []).map((u) => ({
        ...u,
        sello_url: sellosByUser[u.id] || null,
      }));

      setOptometrists(merged);
      setLoading(false);
    };

    load();
  }, []);

  const handleSelect = async (userId) => {
    setSelectedUserId(userId);
    const seleccionado = optometrists.find((o) => o.id === userId);

    if (!seleccionado) {
      setSelectedData(null);
      return;
    }

    const base64Image = seleccionado.sello_url
      ? await convertImageToBase64(seleccionado.sello_url)
      : null;

    setSelectedData({ ...seleccionado, sello_base64: base64Image });

    if (onSelect) {
      onSelect({
        sealImage: base64Image,
        name: `${seleccionado.professional_title || 'Opt.'} ${seleccionado.firstname} ${seleccionado.lastname}`,
        ci: seleccionado.ci || '',
        senescyt: seleccionado.senescyt || '',
      });
    }
  };

  const selectedLabel = selectedData
    ? `${selectedData.firstname} ${selectedData.lastname}`
    : 'Seleccione profesional';

  if (loading) {
    return <Text>Cargando...</Text>;
  }

  return (
    <Box
      my={1}
      maxW="220px"
      textAlign="left"
      ml={["5%", "10%", "30%", "50%"]}
      mt={{ base: -4, md: 1 }}
    >
      {selectedData && selectedData.sello_base64 && (
        <>
          <Image
            src={selectedData.sello_base64}
            alt={`Sello de ${selectedData.firstname} ${selectedData.lastname}`}
            boxSize="300px"
            objectFit="contain"
            mb={-20}
          />
          <Divider mb={1} />
        </>
      )}

      <Menu>
        <MenuButton as={Button} rightIcon={<ChevronDownIcon />} w="150%">
          {selectedLabel}
        </MenuButton>
        <MenuList maxH="200px" overflowY="auto">
          {selectedUserId && (
            <MenuItem
              onClick={() => {
                setSelectedUserId('');
                setSelectedData(null);
                if (onSelect) onSelect(null);
              }}
              color="red.500"
            >
              Quitar selección
            </MenuItem>
          )}
          {optometrists.length === 0 && (
            <MenuItem isDisabled>No hay optómetras registrados</MenuItem>
          )}
          {optometrists.map((opt) => (
            <MenuItem key={opt.id} onClick={() => handleSelect(opt.id)}>
              {opt.firstname} {opt.lastname}
              {!opt.sello_url && (
                <Text as="span" fontSize="xs" color="gray.400" ml={2}>
                  (sin sello)
                </Text>
              )}
            </MenuItem>
          ))}
        </MenuList>
      </Menu>

      {selectedData && (
        <>
          <Text mt={1} color="gray.600">
            Cédula: {selectedData.ci || '—'}
          </Text>
          {selectedData.senescyt && (
            <Text mt={0.5} color="gray.600" fontSize="sm">
              SENESCYT: {selectedData.senescyt}
            </Text>
          )}
        </>
      )}
    </Box>
  );
};

export default SelloSelector;
