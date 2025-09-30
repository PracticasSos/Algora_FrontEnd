// UploadLogo.jsx
import React, { useEffect, useState, useMemo } from "react";
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
  Spinner,
  useToast,
  HStack

} from "@chakra-ui/react";
import { FaEye } from 'react-icons/fa';
import { supabase } from "../../../api/supabase";
import SmartHeader from '../../header/SmartHeader';

const DEFAULT_LOGO = "/default_logo.png";

const UploadLogo = ({ user }) => {
  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState("");
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [logoUrl, setLogoUrl] = useState(null);
  const [loadingLogo, setLoadingLogo] = useState(false);
  const toast = useToast();

  const actualUser = useMemo(() => {
    if (user) return user;
    try {
      const stored = localStorage.getItem("user");
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  }, [user]);

  const bg = useColorModeValue("white", "gray.700");
  const borderColor = useColorModeValue("gray.200", "gray.600");

  // 1️⃣ Obtener branches
  useEffect(() => {
    const fetchBranches = async () => {
      const { data, error } = await supabase
        .from("branchs")
        .select("id, name")
        .order("name");

      if (error) {
        console.error(error);
        toast({
          title: "Error",
          description: "Error cargando sucursales",
          status: "error",
        });
      } else {
        setBranches(data || []);
      }
    };

    fetchBranches();
  }, [toast]);

  // 2️⃣ Obtener logo actual de la branch seleccionada
  useEffect(() => {
    if (!selectedBranch) {
      setLogoUrl(null);
      return;
    }

    const fetchLogo = async () => {
      setLoadingLogo(true);
      const { data, error } = await supabase
        .from("logos")
        .select("logo_url")
        .eq("branch_id", selectedBranch)
        .maybeSingle();

      if (error) {
        console.error("Error cargando logo:", error);
        setLogoUrl(DEFAULT_LOGO);
      } else {
        setLogoUrl(data?.logo_url || DEFAULT_LOGO);
      }
      setLoadingLogo(false);
    };

    fetchLogo();
  }, [selectedBranch]);

  // 3️⃣ Manejar archivo seleccionado
  const handleFileChange = (e) => {
    setFile(e.target.files?.[0] || null);
  };

  // 4️⃣ Subir logo
  const handleUpload = async () => {
    if (!selectedBranch) {
      toast({
        title: "Error",
        description: "Selecciona una sucursal primero",
        status: "error",
      });
      return;
    }
    if (!file) {
      toast({
        title: "Error",
        description: "Selecciona un archivo primero",
        status: "error",
      });
      return;
    }

    setUploading(true);

    try {
      // ⚡ Verificar sesión activa
      const { data: sessionData, error: sessionError } =
        await supabase.auth.getSession();

      if (sessionError || !sessionData.session) {
        throw new Error("No se pudo obtener la sesión actual");
      }

      // 🔍 DEBUG: Decodificar JWT para ver los claims
      const token = sessionData.session.access_token;
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64).split('').map(c => 
          '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
        ).join('')
      );
      const jwtClaims = JSON.parse(jsonPayload);
      console.log("🔑 Claims en JWT:", jwtClaims);
      console.log("🏢 tenant_id en claims:", jwtClaims.tenant_id);

      // 📂 Obtener tenant_id de los claims del JWT (donde lo pone el auth hook)
      const tenantId = jwtClaims.tenant_id;
      if (!tenantId) {
        throw new Error("No se encontró tenant_id en los claims del JWT");
      }
      
      console.log("✅ tenant_id obtenido:", tenantId);

      // 🧪 TEST: Verificar qué ve Postgres en el JWT
      try {
        const { data: testData, error: testError } = await supabase
          .rpc('test_jwt_claims');
        console.log("🧪 Test JWT desde Postgres:", testData);
        if (testError) console.error("Error en test:", testError);
      } catch (e) {
        console.log("⚠️  La función test_jwt_claims no existe (es normal)");
      }

      // 📂 Subir al bucket
      const bucket = "logo";
      const path = `${tenantId}/${selectedBranch}/${file.name}`;

      const { error: upErr } = await supabase.storage
        .from(bucket)
        .upload(path, file, { cacheControl: "3600", upsert: true });

      if (upErr) throw upErr;

      // 🔗 URL pública
      const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(path);
      const publicURL = urlData?.publicUrl;
      if (!publicURL) throw new Error("No se pudo generar URL pública");

      // 🗄️ Verificar si ya existe un registro
      const { data: existing } = await supabase
        .from("logos")
        .select("id")
        .eq("branch_id", selectedBranch)
        .maybeSingle();

      let dbError;
      if (existing) {
        // ✅ UPDATE - Solo actualizar logo_url
        const { error } = await supabase
          .from("logos")
          .update({ logo_url: publicURL })
          .eq("id", existing.id);
        dbError = error;
      } else {
        // ✅ INSERT - El trigger se encargará del tenant_id automáticamente
        console.log("Intentando insertar logo...");
        console.log("User ID:", sessionData.session.user.id);
        console.log("Tenant ID en metadata:", tenantId);
        
        const { error, data: insertData } = await supabase.from("logos").insert({
          branch_id: selectedBranch,
          logo_url: publicURL,
          // ❌ NO enviar tenant_id - el trigger lo asigna automáticamente
        }).select();
        
        console.log("Resultado insert:", { error, insertData });
        dbError = error;
      }

      if (dbError) throw dbError;

      setLogoUrl(publicURL);
      setFile(null);

      toast({
        title: "Éxito",
        description: "Logo guardado exitosamente",
        status: "success",
      });
    } catch (err) {
      console.error("Error en upload:", err);
      toast({
        title: "Error",
        description: err.message,
        status: "error",
      });
    } finally {
      setUploading(false);
    }
  };

  const moduleSpecificButton = null;

  return (
    <Box p={{ base: 2, md: 8 }} minH="100vh" bg={useColorModeValue('gray.50', 'gray.900')}>
    <SmartHeader moduleSpecificButton={moduleSpecificButton} />
    <Box
      bg={bg}
      p={6}
      borderWidth="1px"
      borderColor={borderColor}
      borderRadius="2xl"
      shadow="md"
      maxW="480px"
      mx="auto"
    >
      <Heading size="md" mb={4} textAlign="center">
        Asignar Logo a Sucursal
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

        {loadingLogo ? (
          <Spinner alignSelf="center" />
        ) : (
          <Box textAlign="center">
            <Text fontSize="sm" mb={2} color="gray.500">
              Logo actual:
            </Text>
            <Image
              src={file ? URL.createObjectURL(file) : logoUrl || DEFAULT_LOGO}
              alt="Logo actual"
              maxW="200px"
              mx="auto"
              borderRadius="md"
              border="1px solid"
              borderColor="gray.300"
            />
          </Box>
        )}

        <FormControl>
          <FormLabel>Subir Logo</FormLabel>
          <Input type="file" accept="image/*" onChange={handleFileChange} />
        </FormControl>

        <Button
          colorScheme="teal"
          onClick={handleUpload}
          isLoading={uploading}
          borderRadius="2xl"
          isDisabled={!file || !selectedBranch}
        >
          Subir / Actualizar
        </Button>
      </Stack>
    </Box>
  </Box>
  );
};

export default UploadLogo;