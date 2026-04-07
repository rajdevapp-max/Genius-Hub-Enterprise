import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // 🎯 SECURITY FIX: This ensures the user stays in their respective environment (Original vs Demo)
  const handleReturnHome = () => {
    navigate(`/${location.search}`); 
  };

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center text-center px-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-6xl font-bold font-display text-foreground mb-4">404</h1>
        <p className="text-xl text-muted-foreground mb-8">Oops! Page not found</p>
        <button 
          onClick={handleReturnHome} 
          className="text-primary hover:text-primary/80 transition-colors underline-offset-4 hover:underline cursor-pointer"
        >
          Return to Home
        </button>
      </motion.div>
    </div>
  );
};

export default NotFound;