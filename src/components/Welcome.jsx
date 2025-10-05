import { useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import './WelcomeScreen.css';

const Welcome = () => {
  const navigate = useNavigate();

  // Redirige después de la animación (1.2s)
  useEffect(() => {
    const timer = setTimeout(() => {
      navigate("/login-form");
    }, 1500);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="welcome-container">
      <motion.img
        src="/assets/svgalgo.svg"
        alt="Algora"
        initial={{ opacity: 0, y: 50, scale: 0.8 }}
        animate={{ opacity: 1, y: 0, scale: 0.6 }}
        transition={{ duration: 1, ease: "easeOut" }}
      />
    </div>
  );
};

export default Welcome;
