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

      // 2) Esperar un momento para que el auth hook procese
      await new Promise(resolve => setTimeout(resolve, 1000));

      // 3) Refrescar la sesión para obtener los claims actualizados
      const { data: refreshedSession, error: refreshError } = await supabase.auth.refreshSession();
      
      if (refreshError) {
        console.error("Error refrescando sesión:", refreshError);
      }

      const currentUser = refreshedSession?.session?.user || user;
      console.log("Usuario después del refresh:", currentUser);
      console.log("Claims en JWT:", currentUser.user_metadata);

      // 4) Buscar en tabla users (ahora debería funcionar con las políticas)
      let { data: userData, error: userError } = await supabase
        .from('users')
        .select('id, role_id, tenant_id, auth_id, email, firstname, lastname')
        .eq('auth_id', currentUser.id)
        .maybeSingle();

      // 5) Si no se encuentra por auth_id, buscar por email y actualizar
      if (!userData) {
        console.log("No se encontró por auth_id, buscando por email...");
        const { data: userByEmail } = await supabase
          .from('users')
          .select('id, role_id, tenant_id, auth_id, email, firstname, lastname')
          .eq('email', currentUser.email)
          .maybeSingle();

        if (userByEmail) {
          console.log("Usuario encontrado por email. Actualizando auth_id...");
          const { error: updateError } = await supabase
            .from('users')
            .update({ auth_id: currentUser.id })
            .eq('id', userByEmail.id);

          if (updateError) {
            console.error("Error actualizando auth_id:", updateError);
          }

          userData = { ...userByEmail, auth_id: currentUser.id };
        }
      }

      if (!userData) {
        setErrorMessage('Usuario no encontrado en la base de datos.');
        console.error("Usuario no encontrado en users:", currentUser.email);
        setLoading(false);
        return;
      }

      console.log("Datos del usuario encontrados:", userData);

      // 6) Guardar en localStorage
      const fullUserData = { ...currentUser, ...userData };
      localStorage.setItem('user', JSON.stringify(fullUserData));

      // 7) Redirigir según role_id
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