import { motion } from 'framer-motion';
import { ReactNode, useRef, useState } from 'react';

interface GlowingCardProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  glowColor?: string;
}

export default function GlowingCard({ children, className = '', delay = 0 }: GlowingCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [hovering, setHovering] = useState(false);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5, ease: 'easeOut' }}
      whileHover={{ y: -4, transition: { duration: 0.3 } }}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
      className={`glass-panel relative overflow-hidden group ${className}`}
    >
      {/* Holographic cursor glow */}
      {hovering && (
        <div
          className="absolute inset-0 opacity-50 dark:opacity-30 transition-opacity duration-500 pointer-events-none"
          style={{
            background: `radial-gradient(400px circle at ${mousePos.x}px ${mousePos.y}px, hsl(var(--neon-cyan) / 0.06), transparent 60%)`,
          }}
        />
      )}
      {/* Top holographic line */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      {children}
    </motion.div>
  );
}
