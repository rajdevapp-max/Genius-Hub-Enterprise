import { motion } from 'framer-motion';

interface ATSScoreRingProps {
  score: number;
  size?: number;
  label?: string;
}

export default function ATSScoreRing({ score, size = 100, label }: ATSScoreRingProps) {
  const radius = (size - 10) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  const getColor = () => {
    if (score >= 80) return 'hsl(var(--success))';
    if (score >= 60) return 'hsl(var(--warning))';
    return 'hsl(var(--destructive))';
  };

  const getGlow = () => {
    if (score >= 80) return 'drop-shadow(0 0 6px hsl(var(--success) / 0.4))';
    if (score >= 60) return 'drop-shadow(0 0 6px hsl(var(--warning) / 0.4))';
    return 'drop-shadow(0 0 6px hsl(var(--destructive) / 0.4))';
  };

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90" style={{ filter: getGlow() }}>
          <circle
            cx={size / 2} cy={size / 2} r={radius}
            fill="none" stroke="hsl(var(--border))" strokeWidth="4"
          />
          <motion.circle
            cx={size / 2} cy={size / 2} r={radius}
            fill="none" stroke={getColor()} strokeWidth="4" strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="font-bold font-display text-foreground" style={{ fontSize: size * 0.2 }}>{score}%</span>
        </div>
      </div>
      {label && <span className="text-[10px] text-muted-foreground font-medium">{label}</span>}
    </div>
  );
}
