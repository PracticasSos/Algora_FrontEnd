// App.jsx
import { useEffect, useState } from "react";
import Welcome from "./components/Welcome";
import { Container, useColorModeValue } from "@chakra-ui/react";
import AppRouter from "./routers";
import { useNavigate } from "react-router-dom";
import { supabase } from "./api/supabase";

function App() {
  const [showSplash, setShowSplash] = useState(null); // null = checking
  const [isChecking, setIsChecking] = useState(true);
  const navigate = useNavigate();

  const bgColor = useColorModeValue("white", "gray.800");

  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          // Si hay sesión activa, NO mostrar splash
          localStorage.setItem("user", JSON.stringify(session.user));
          setShowSplash(false);
        } else {
          // Si NO hay sesión, mostrar splash
          setShowSplash(true);
        }
      } catch (error) {
        console.error("Error checking auth status:", error);
        setShowSplash(true); // En caso de error, mostrar splash
      } finally {
        setIsChecking(false);
      }
    };

    checkAuthStatus();
  }, []);

  const handleWelcomeFinish = () => {
    navigate("/login-form");
    setShowSplash(false);
  };

  // Mientras verifica la sesión, no renderizar nada (o un loader)
  if (isChecking || showSplash === null) return null;

  return showSplash ? (
    <Welcome onFinish={handleWelcomeFinish} />
  ) : (
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