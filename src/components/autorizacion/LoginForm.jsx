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

        <Box 
          display={{ base: "none", md: "flex" }} 
          className="login-left"
          backgroundImage="url('/assets/loginimg.png')" 
          backgroundSize="cover" 
          backgroundPosition="center"
          position="relative" 
          flex="1" 
          minH="100vh"
          //borderRadius="20px" // Added border radius
        >
          {/* Overlay con gradiente más elegante */}
        <Box 
          position="absolute" 
          top={0} 
          left={0} 
          right={0} 
          bottom={0} 
          bgGradient="linear(to-br, blackAlpha.700, blackAlpha.500, blackAlpha.800)" 
          zIndex={1} 
        />
        
        {/* Contenido con mejor posicionamiento */}
        <Flex 
          position="relative" 
          zIndex={2} 
          color="white" 
          h="100%" 
          w="100%" 
          align="end" 
          justify="center"
          px={12}
          pb={20}
        >
          <Box textAlign="center" maxW="600px">
            <Text fontSize="3xl" fontWeight="800" mb={6} lineHeight="1.2">
              Bienvenido a{" "}
              <Text as="span" color="#ffffffff">
                Algora
              </Text>
            </Text>
            <Text fontSize="md" color="gray.400" lineHeight="1.6" fontWeight="200">
              Sistema de gestión integral para ópticas. Administra tus sucursales, 
              productos y servicios desde una plataforma moderna y eficiente.
            </Text>


          </Box>
        </Flex>
      </Box>

      {/* Panel derecho - Completamente rediseñado */}
      <Box 
        className="login-right" 
        flex="1" 
        bg="#000000"  // Fondo completamente negro
        display="flex" 
        flexDir="column" 
        alignItems="center" 
        justifyContent="center" 
        minH="100vh" 
        w="100%" 
        px={4}
        position="relative"
      >
        {/* Patrón de fondo sutil */}
        <Box
          position="absolute"
          top={0}
          left={0}
          right={0}
          bottom={0}
          opacity={0.03}
          bgImage="radial-gradient(circle at 25% 25%, #219BAA 1px, transparent 1px)"
          bgSize="30px 30px"
        />
        
        <Box display="flex" flexDir="column" alignItems="center" gap={4} position="relative" zIndex={1}>
          {/* Logo móvil mejorado */}
          <Box display={{ base: "flex", md: "none" }} mb={6}>
            <Box position="relative">
              <Image 
                src="/assets/loginalgora.jpg" 
                w="100px" 
                h="100px" 
                borderRadius="full" 
                objectFit="cover"
                border="3px solid #219BAA"
                shadow="0 0 20px rgba(33, 155, 170, 0.3)"
              />
              <Box
                position="absolute"
                top={0}
                left={0}
                right={0}
                bottom={0}
                borderRadius="full"
                bgGradient="radial(transparent 60%, rgba(33, 155, 170, 0.1))"
              />
            </Box>
          </Box>

          {/* Formulario rediseñado */}
          <Box 
            flex="1" 
            display="flex" 
            alignItems="center" 
            justifyContent="center"
            w="100%"
          >
            <Box 
              p={{ base: 6, md: 10 }} 
              borderRadius="2xl" 
              maxW={{ base: "100%", md: "420px" }}
              w="100%"
              bg="rgba(255, 255, 255, 0.02)"
              backdropFilter="blur(10px)"
              border="1px solid rgba(255, 255, 255, 0.05)"
              shadow="0 20px 40px rgba(0, 0, 0, 0.3)"
            >
              {/* Título elegante */}
              <Box textAlign="center" mb={8}>
                <Text 
                  fontSize="3xl" 
                  fontWeight="700" 
                  color="white"
                  mb={2}
                >
                  Iniciar Sesión
                </Text>
                <Text color="gray.400" fontSize="sm">
                  Accede a tu panel de control
                </Text>
              </Box>

              {/* Error message mejorado */}
              {errorMessage && (
                <Box 
                  bg="rgba(255, 0, 0, 0.1)" 
                  border="1px solid rgba(255, 0, 0, 0.2)"
                  borderRadius="lg" 
                  p={3} 
                  mb={6}
                >
                  <Text color="#ff6b6b" fontSize="sm" textAlign="center">
                    {errorMessage}
                  </Text>
                </Box>
              )}

              <form onSubmit={handleSubmit}>
                {/* Campo Email mejorado */}
                <FormControl id="email" isRequired mb={6}>
                  <FormLabel color="gray.200" fontSize="sm" fontWeight="500" mb={3}>
                    Correo electrónico
                  </FormLabel>
                  <InputGroup>
                    <InputLeftElement pointerEvents="none" h="56px">
                      <Icon as={FaEnvelope} color="#219BAA" />
                    </InputLeftElement>
                    <Input 
                      h="56px"
                      type="email" 
                      name="email" 
                      placeholder="tu@correo.com" 
                      value={formData.email} 
                      onChange={handleChange} 
                      color="white"
                      bg="rgba(255, 255, 255, 0.05)"
                      border="1px solid rgba(255, 255, 255, 0.1)"
                      borderRadius="xl"
                      _placeholder={{ color: "gray.500" }}
                      _hover={{ 
                        borderColor: "#219BAA",
                        bg: "rgba(255, 255, 255, 0.08)" 
                      }}
                      _focus={{ 
                        borderColor: "#219BAA",
                        bg: "rgba(255, 255, 255, 0.08)",
                        boxShadow: "0 0 0 1px #219BAA"
                      }}
                      fontSize="md"
                      pl="50px"
                    />
                  </InputGroup>
                </FormControl>

                {/* Campo Password mejorado */}
                <FormControl id="password" isRequired mb={8}>
                  <FormLabel color="gray.200" fontSize="sm" fontWeight="500" mb={3}>
                    Contraseña
                  </FormLabel>
                  <InputGroup>
                    <InputLeftElement pointerEvents="none" h="56px">
                      <Icon as={FaLock} color="#219BAA" />
                    </InputLeftElement>
                    <Input 
                      h="56px"
                      name="password" 
                      type={showPassword ? "text" : "password"} 
                      placeholder="••••••••" 
                      value={formData.password} 
                      onChange={handleChange} 
                      color="white"
                      bg="rgba(255, 255, 255, 0.05)"
                      border="1px solid rgba(255, 255, 255, 0.1)"
                      borderRadius="xl"
                      _placeholder={{ color: "gray.500" }}
                      _hover={{ 
                        borderColor: "#219BAA",
                        bg: "rgba(255, 255, 255, 0.08)" 
                      }}
                      _focus={{ 
                        borderColor: "#219BAA",
                        bg: "rgba(255, 255, 255, 0.08)",
                        boxShadow: "0 0 0 1px #219BAA"
                      }}
                      fontSize="md"
                      pl="50px"
                      pr="50px"
                    />
                    <InputRightElement h="56px">
                      <IconButton 
                        variant="ghost" 
                        size="sm" 
                        aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"} 
                        icon={<Icon as={showPassword ? FaEyeSlash : FaEye} color="gray.400" />} 
                        onClick={() => setShowPassword(!showPassword)} 
                        _hover={{ bg: "rgba(255, 255, 255, 0.1)" }}
                        borderRadius="lg"
                      />
                    </InputRightElement>
                  </InputGroup>
                </FormControl>

                {/* Botón de login mejorado */}
                <Button 
                  type="submit" 
                  w="100%" 
                  h="56px"
                  fontSize="md"
                  fontWeight="600"
                  borderRadius="xl" 
                  bgGradient="linear(to-r, #219BAA, #1A7A87)"
                  color="white"
                  isLoading={loading} 
                  loadingText="Iniciando sesión..."
                  _hover={{ 
                    bgGradient: "linear(to-r, #1A7A87, #146B75)",
                    transform: "translateY(-1px)",
                    shadow: "0 10px 25px rgba(33, 155, 170, 0.3)"
                  }}
                  _active={{
                    transform: "translateY(0px)"
                  }}
                  transition="all 0.2s ease"
                >
                  Iniciar Sesión
                </Button>
              </form>

              {/* Footer del formulario */}
              <Box mt={8} textAlign="center">
                <Text fontSize="sm" color="gray.400" lineHeight="1.6">
                  Algora protege tu privacidad.{" "}
                  <Text 
                    as="span" 
                    color="#219BAA" 
                    cursor="pointer" 
                    fontWeight="500"
                    _hover={{ 
                      color: "#1A7A87",
                      textDecoration: "underline" 
                    }}
                    onClick={() => navigate("/servicios")}
                  >
                    Conoce nuestros servicios
                  </Text>
                </Text>
              </Box>
            </Box>
          </Box>
        </Box>
      </Box>
    </Flex>
  );
};

export default LoginForm;