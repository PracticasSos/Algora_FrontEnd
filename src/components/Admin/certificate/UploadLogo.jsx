import React, { useEffect, useState, useMemo } from 'react';
import {
  Box,
  Select,
  Input,
  Button,
  Image,
  Text,
  Stack,
  FormControl,
  FormLabel,
  Heading,
  useColorModeValue,
} from '@chakra-ui/react';
import { supabase } from '../../../api/supabase';

const UploadLogo = ({ user }) => {
  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState('');
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [logoUrl, setLogoUrl] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [session, setSession] = useState(null);

  // Obtener sesión del usuario y escuchar cambios
  useEffect(() => {
    const fetchSession = async () => {
      const { data } = await supabase.auth.getSession();
      setSession(data?.session || null);
    };
    fetchSession();
    // Suscribirse a cambios de sesión
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
    return () => {
      listener?.subscription?.unsubscribe();
    };
  }, []);

  // Usuario actual (props o localStorage)
  const actualUser = useMemo(() => {
    if (user) return user;
    try {
      const stored = localStorage.getItem('user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  }, [user]);

  const bg = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  // 1) Cargar sucursales del tenant autenticado
  useEffect(() => {
    if (!actualUser?.tenant_id) return;

    const fetchBranches = async () => {
      const { data, error } = await supabase
        .from('branchs')
        .select('id, name')
        .eq('tenant_id', actualUser.tenant_id)
        .order('name');

      if (error) setErrorMsg('Error cargando sucursales');
      else setBranches(data);
    };

    fetchBranches();
  }, [actualUser]);

  // 2) Cargar logo de la sucursal seleccionada
  useEffect(() => {
    if (!selectedBranch) {
      setLogoUrl(null);
      return;
    }

    const fetchLogo = async () => {
      const { data, error } = await supabase
        .from('logos')
        .select('logo_url')
        .eq('branch_id', selectedBranch)
        .maybeSingle();

      if (error) {
        setLogoUrl(null);
        console.error('Error fetching logo:', error);
      } else {
        setLogoUrl(data?.logo_url || null);
      }
    };

    fetchLogo();
  }, [selectedBranch]);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setErrorMsg('');
  };

  const handleUpload = async () => {
    // Verificar sesión activa antes de continuar
    const { data } = await supabase.auth.getSession();
    if (!data?.session?.user) {
      setErrorMsg('Debes iniciar sesión en Supabase');
      return;
    }
    if (!actualUser?.tenant_id) {
      setErrorMsg('No se pudo obtener el tenant. Inicia sesión nuevamente.');
      return;
    }
    if (!selectedBranch) {
      setErrorMsg('Selecciona una sucursal primero');
      return;
    }
    if (!file) {
      setErrorMsg('Selecciona un archivo primero');
      return;
    }

    setUploading(true);
    setErrorMsg('');

    try {
      const bucket = 'logo';
      const path = `${actualUser.tenant_id}/${selectedBranch}/${file.name}`;

      // Subir archivo
      const { error: upErr } = await supabase.storage
        .from(bucket)
        .upload(path, file, { cacheControl: '3600', upsert: true });
      if (upErr) throw upErr;

      // Obtener URL pública
      const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(path);
      const publicURL = urlData?.publicUrl;
      if (!publicURL) throw new Error('No se pudo obtener la URL pública');

      // Guardar o actualizar logo en la tabla
      const { error: dbErr } = await supabase
        .from('logos')
        .upsert(
          {
            tenant_id: actualUser.tenant_id,
            branch_id: selectedBranch,
            logo_url: publicURL,
          },
          { onConflict: 'branch_id' }
        );
      if (dbErr) throw dbErr;

      setLogoUrl(publicURL);
      setFile(null);
      setErrorMsg('');
    } catch (err) {
      console.error('Error en upload:', err.message);
      setErrorMsg(err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <Box
      bg={bg}
      p={6}
      borderWidth="1px"
      borderColor={borderColor}
      borderRadius="2xl"
      shadow="md"
      maxW="450px"
      mx="auto"
    >
      <Heading size="md" mb={4} textAlign="center">
        Gestión de Logos
      </Heading>
      <Stack spacing={4}>
        <FormControl>
          <FormLabel>Sucursal</FormLabel>
          <Select
            placeholder="Seleccione una sucursal"
            value={selectedBranch}
            onChange={(e) => setSelectedBranch(e.target.value)}
          >
            {branches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </Select>
        </FormControl>

        {logoUrl && (
          <Box textAlign="center">
            <Text fontSize="sm" mb={2} color="gray.500">
              Logo actual:
            </Text>
            <Image src={logoUrl} alt="Logo actual" maxW="200px" mx="auto" />
          </Box>
        )}

        <FormControl>
          <FormLabel>Subir Logo</FormLabel>
          <Input type="file" accept="image/*" onChange={handleFileChange} />
        </FormControl>

        {errorMsg && (
          <Text color="red.500" fontSize="sm" textAlign="center">
            {errorMsg}
          </Text>
        )}

        <Button
          colorScheme="teal"
          onClick={handleUpload}
          isLoading={uploading}
          borderRadius="2xl"
        >
          Subir / Actualizar Logo
        </Button>
      </Stack>
    </Box>
  );
};

export default UploadLogo;
