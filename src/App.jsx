// App.jsx
import { useEffect, useState } from "react";
import { Container, useColorModeValue } from "@chakra-ui/react";
import AppRouter from "./routers";
import { useNavigate } from "react-router-dom";
import { supabase } from "./api/supabase";

function App() {
  const [isChecking, setIsChecking] = useState(true);
  const navigate = useNavigate();
  const bgColor = useColorModeValue("white", "gray.800");

  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          // Si hay sesión activa
          localStorage.setItem("user", JSON.stringify(session.user));
        } else {
          // Si NO hay sesión activa, redirigir al login
          navigate("/login-form");
        }
      } catch (error) {
        console.error("Error checking auth status:", error);
        navigate("/login-form");
      } finally {
        setIsChecking(false);
      }
    };

    checkAuthStatus();
  }, [navigate]);

  // Mientras verifica la sesión, no renderizar nada (o un loader si quieres)
  if (isChecking) return null;

  return (
    <Container
      maxW="100%"
      padding="0"
      bg={bgColor}
      minH="100vh"
      fontFamily="'Satoshi', sans-serif"
    >
      <AppRouter />
    </Container>
  );
}

export default App;
