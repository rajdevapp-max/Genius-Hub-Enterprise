import { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  trend?: string;
}

export default function StatsCard({ label, value, icon: Icon, trend }: StatsCardProps) {
  return (
    <div className="stat-card">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</span>
        <Icon className="w-4 h-4 text-primary/60" />
      </div>
      <div className="text-2xl font-bold text-foreground">{value}</div>
      {trend && <span className="text-xs text-success mt-1 block">{trend}</span>}
    </div>
  );
}
