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

  // 🎨 Colores adaptativos para light/dark mode
  const bgColor = useColorModeValue("white", "gray.800");

  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();

        if (session?.user) {
          // Guarda la sesión básica en localStorage (opcional, depende de tu AuthContext)
          localStorage.setItem("user", JSON.stringify(session.user));
        }
      } catch (error) {
        console.error("Error checking auth status:", error);
      } finally {
        setIsChecking(false);
        setShowSplash(false); // oculta el splash una vez cargado
      }
    };

    checkAuthStatus();
  }, []);

  const handleWelcomeFinish = () => {
    setShowSplash(false);
    navigate("/login-form");
  };

  if (isChecking) {
    return null; // Puedes poner un loader si prefieres
  }

  return showSplash ? (
    <Welcome onFinish={handleWelcomeFinish} />
  ) : (
    <Container
      maxW="100%"
      padding="0px"
      bg={bgColor}
      minH="100vh"
      fontFamily="'Satoshi', sans-serif"
    >
      <AppRouter />
    </Container>
  );
}

export default App;
