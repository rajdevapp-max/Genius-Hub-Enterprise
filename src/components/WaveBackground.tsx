import { motion } from 'framer-motion';

export default function WaveBackground() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none" style={{ zIndex: 0 }}>
      {/* Neon gradient orbs */}
      <motion.div
        className="absolute w-[900px] h-[900px] rounded-full"
        style={{
          background: 'radial-gradient(circle, hsl(var(--neon-blue) / 0.06), transparent 70%)',
          top: '-25%', right: '-15%',
        }}
        animate={{ x: [0, 60, -40, 0], y: [0, -50, 30, 0], scale: [1, 1.2, 0.9, 1] }}
        transition={{ duration: 30, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute w-[800px] h-[800px] rounded-full"
        style={{
          background: 'radial-gradient(circle, hsl(var(--neon-cyan) / 0.04), transparent 70%)',
          bottom: '-20%', left: '-10%',
        }}
        animate={{ x: [0, -50, 60, 0], y: [0, 40, -30, 0], scale: [1, 0.85, 1.15, 1] }}
        transition={{ duration: 35, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute w-[600px] h-[600px] rounded-full"
        style={{
          background: 'radial-gradient(circle, hsl(var(--neon-purple) / 0.03), transparent 70%)',
          top: '30%', left: '50%',
        }}
        animate={{ x: [0, 70, -50, 0], y: [0, -40, 50, 0] }}
        transition={{ duration: 25, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Subtle grid */}
      <div
        className="absolute inset-0 opacity-[0.02] dark:opacity-[0.03]"
        style={{
          backgroundImage: `
            linear-gradient(hsl(var(--neon-cyan) / 0.3) 1px, transparent 1px),
            linear-gradient(90deg, hsl(var(--neon-cyan) / 0.3) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
        }}
      />
    </div>
  );
}
