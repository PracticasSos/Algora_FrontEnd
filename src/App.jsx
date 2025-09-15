import { useEffect, useState } from "react";
import Welcome from "./components/Welcome";
import { Container, useColorModeValue } from "@chakra-ui/react";
import AppRouter from "./routers";
import { useNavigate } from "react-router-dom";
import { supabase } from "./api/supabase";

function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [isChecking, setIsChecking] = useState(true);
  const navigate = useNavigate();

  const bgColor = useColorModeValue("white", "gray.800");

  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          localStorage.setItem("user", JSON.stringify(session.user));
        }
      } catch (error) {
        console.error("Error checking auth status:", error);
      } finally {
        setIsChecking(false);
      }
    };

    checkAuthStatus();
  }, []);

  const handleWelcomeFinish = () => {
    // Primero navega, luego ocultamos el splash
    navigate("/login-form");
    setShowSplash(false);
  };

  if (isChecking) return null; // loader opcional

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
