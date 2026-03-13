import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

export function useTheme() {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('theme') as 'light' | 'dark') || 'dark';
    }
    return 'dark';
  });

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggle = () => setTheme(t => t === 'light' ? 'dark' : 'light');

  return { theme, setTheme, toggle };
}

export function ThemeToggle({ theme, toggle }: { theme: string; toggle: () => void }) {
  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={toggle}
      className="relative w-14 h-7 rounded-full p-0.5 transition-all duration-500"
      style={{
        background: theme === 'dark'
          ? 'linear-gradient(135deg, hsl(225 30% 12%), hsl(210 100% 20%))'
          : 'linear-gradient(135deg, hsl(38 92% 50%), hsl(45 100% 60%))',
        boxShadow: theme === 'dark'
          ? '0 0 12px hsl(210 100% 60% / 0.2), inset 0 1px 0 hsl(210 100% 60% / 0.1)'
          : '0 2px 8px hsl(38 92% 50% / 0.3)',
      }}
      title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
    >
      <motion.div
        className="w-6 h-6 rounded-full bg-white shadow-md flex items-center justify-center"
        animate={{ x: theme === 'dark' ? 26 : 0 }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      >
        <span className="text-xs">{theme === 'dark' ? '🌙' : '☀️'}</span>
      </motion.div>
    </motion.button>
  );
}
