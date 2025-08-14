import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../api/supabase';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  InputGroup,
  InputLeftElement,
  InputRightElement,
  Text,
  Flex,
  Icon,
  useBreakpointValue,
  Image,
  IconButton
} from '@chakra-ui/react';
import { FaEnvelope, FaLock, FaEye, FaEyeSlash } from "react-icons/fa";
import './LoginForm.css';

const LoginForm = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [errorMessage, setErrorMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const isMobile = useBreakpointValue({ base: true, md: false });  

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((f) => ({ ...f, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setLoading(true);

    try {
      // 1) Login con Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: formData.email.trim(),
        password: formData.password,
      });

      if (authError) {
        setErrorMessage(authError.message);
        setLoading(false);
        return;
      }

      const user = authData?.user;
      if (!user) {
        setErrorMessage('No se pudo iniciar sesión.');
        setLoading(false);
        return;
      }

      console.log("Auth login exitoso:", user);

      // 2) Buscar en tabla users
      let { data: userData, error: userError } = await supabase
        .from('users')
        .select('id, role_id, tenant_id, auth_id, email')
        .eq('auth_id', user.id)
        .maybeSingle();

      if (!userData) {
        console.log("No se encontró por auth_id, buscando por email...");
        const { data: userByEmail } = await supabase
          .from('users')
          .select('id, role_id, tenant_id, auth_id, email')
          .eq('email', user.email)
          .maybeSingle();

        if (userByEmail) {
          console.log("Usuario encontrado por email. Actualizando auth_id...");
          await supabase
            .from('users')
            .update({ auth_id: user.id })
            .eq('id', userByEmail.id);

          userData = { ...userByEmail, auth_id: user.id };
        }
      }

      if (!userData) {
        setErrorMessage('Usuario no encontrado en la base de datos.');
        console.error("Usuario no encontrado en users:", user.email);
        setLoading(false);
        return;
      }

      // 3) Garantizar tenant_id en metadata
      const tenantInJWT = user.user_metadata?.tenant_id;
      if (!tenantInJWT || tenantInJWT !== userData.tenant_id) {
        console.log("Tenant_id incorrecto o faltante en JWT. Actualizando...");
        const { error: updateError } = await supabase.auth.updateUser({
          data: { tenant_id: userData.tenant_id }
        });
        if (updateError) {
          console.error("Error actualizando tenant_id:", updateError);
        } else {
          console.log("Tenant_id actualizado en metadata, refrescando sesión...");
          await supabase.auth.refreshSession();
          // Recarga para usar el nuevo JWT en todas las queries con RLS
          window.location.reload();
          return; // Se corta aquí porque se recargará la app
        }
      }

      // 4) Guardar en localStorage
      const fullUserData = { ...authData.user, ...userData };
      localStorage.setItem('user', JSON.stringify(fullUserData));

      // 5) Redirigir según role_id
      setLoading(false);
      switch (userData.role_id) {
        case 1: navigate('/admin'); break;
        case 4: navigate('/SuperAdmin'); break;
        case 2: navigate('/optometra'); break;
        case 3: navigate('/vendedor'); break;
        default:
          setErrorMessage('Rol desconocido');
          console.warn("Rol no manejado:", userData.role_id);
          navigate('/');
      }

    } catch (err) {
      console.error('Login error:', err);
      setErrorMessage('Ocurrió un error al iniciar sesión.');
      setLoading(false);
    }
  };

  return (
    <Flex minH="100vh" w="100vw" overflow="hidden" position="fixed" top={0} left={0} flexDir={{ base: "column", md: "row" }}>
      {/* Panel izquierdo */}
      <Box display={{ base: "none", md: "flex" }} className="login-left"
        backgroundImage="url('/assets/lentes.jpg')" backgroundSize="cover" backgroundPosition="center"
        position="relative" flex="1" minH="100vh">
        <Box position="absolute" top={0} left={0} right={0} bottom={0} bg="blackAlpha.600" zIndex={1} />
        <Box textAlign="center" maxW="280px" position="relative" zIndex={2} color="white" m="auto">
          <Text fontSize="3xl" fontWeight="bold" mb={2}>¡Bienvenido a Algora!</Text>
          <Text fontSize="md">Sistema de gestión para ópticas. Administra tus sucursales, productos y servicios desde un solo lugar.</Text>
        </Box>
      </Box>

      {/* Panel derecho */}
      <Box className="login-right" flex="1" bg="#333333" display="flex" flexDir="column" alignItems="center" justifyContent="center" minH="100vh" w="100%" px={4}>
        <Box display="flex" flexDir="column" alignItems="center" gap={4}>
          <Box display={{ base: "flex", md: "none" }}>
            <Image src="/assets/loginalgora.jpg" w="80px" h="80px" borderRadius="full" objectFit="cover" />
          </Box>

          <Box flex="1" display="flex" alignItems="center" justifyContent="center">
            <Box p={8} borderRadius="lg" color="black" maxW={{ base: "100%", md: "350px" }}>
              <Text fontSize="2xl" fontWeight="bold" mb={20} textAlign="center" color="gray.300">Iniciar Sesión</Text>
              {errorMessage && <Text color="red.500" mb={4} textAlign="center" fontSize="sm">{errorMessage}</Text>}

              <form onSubmit={handleSubmit}>
                <FormControl id="email" isRequired mb={4}>
                  <FormLabel color="gray.200">Usuario</FormLabel>
                  <InputGroup>
                    <InputLeftElement pointerEvents="none"><Icon as={FaEnvelope} color="gray.400" /></InputLeftElement>
                    <Input variant="flushed" type="email" name="email" placeholder="tú@correo.com" value={formData.email} onChange={handleChange} color="white" _placeholder={{ color: "gray.400" }} />
                  </InputGroup>
                </FormControl>

                <FormControl id="password" isRequired mb={6}>
                  <FormLabel color="gray.200">Contraseña</FormLabel>
                  <InputGroup>
                    <InputLeftElement pointerEvents="none"><Icon as={FaLock} color="gray.400" /></InputLeftElement>
                    <Input variant="flushed" name="password" type={showPassword ? "text" : "password"} placeholder="********" value={formData.password} onChange={handleChange} color="white" _placeholder={{ color: "gray.400" }} />
                    <InputRightElement>
                      <IconButton variant="ghost" size="sm" aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"} icon={<Icon as={showPassword ? FaEyeSlash : FaEye} color="gray.400" />} onClick={() => setShowPassword(!showPassword)} _hover={{ bg: "transparent" }} />
                    </InputRightElement>
                  </InputGroup>
                </FormControl>

                <Button type="submit" color="white" w="100%" mt={10} borderRadius="full" bg="#219BAA" isLoading={loading} loadingText="Ingresando...">Ingresar</Button>
              </form>

              <Text fontSize="sm" textAlign="center" color="gray.500" mt={6} px={2}>
                Algora protege tu privacidad. ¿Quieres conocer más de nuestros servicios?{" "}
                <Text as="span" color="#219BAA" cursor="pointer" textDecoration="underline" _hover={{ color: "#1A7A87" }} onClick={() => navigate("/servicios")}>Ingresa aquí</Text>
              </Text>
            </Box>
          </Box>
        </Box>
      </Box>
    </Flex>
  );
};

export default LoginForm;
