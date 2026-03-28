import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Users, Clock, TrendingUp, Loader2, Activity, Award, FileImage, FileText, Gauge, MapPin, GraduationCap, Copy, Trash2, AlertTriangle, ShieldCheck } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area, LabelList, Label } from 'recharts';
import GlowingCard from '@/components/GlowingCard';
import AnimatedCounter from '@/components/AnimatedCounter';
import type { StatsResponse } from '@/lib/types';
import { api } from '@/lib/api';

const NEON_COLORS = [
  '#00f0ff', '#0080ff', '#7000ff', '#ff00c8', 
  '#00ff66', '#ffb700', '#ff003c', '#9d00ff',
];

// --- LIGHT/DARK MODE ADAPTIVE TOOLTIP ---
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card border border-border shadow-xl rounded-xl backdrop-blur-xl p-4 min-w-[160px] z-50">
        <p className="text-xs font-extrabold font-display uppercase tracking-widest text-primary mb-3 border-b border-border/50 pb-2">
          {label || payload[0].name || "Data Point"}
        </p>
        {payload.map((entry: any, index: number) => (
          <div key={`item-${index}`} className="flex items-center justify-between gap-6 text-sm font-mono mt-2">
            <div className="flex items-center gap-2.5">
              <span 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: entry.color || '#00f0ff', boxShadow: `0 0 10px ${entry.color || '#00f0ff'}80` }} 
              />
              <span className="text-muted-foreground capitalize text-xs">{entry.name || entry.dataKey}</span>
            </div>
            <span className="text-foreground font-bold text-base">{entry.value}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

// --- BULLETPROOF DATA AGGREGATOR (Prevents Black Screen Crashes) ---
const aggregateData = (data: any[], key: string, limit = 4) => {
  if (!data || !Array.isArray(data) || data.length === 0) return [];
  
  // Safely filter out nulls or empty strings without crashing
  const validData = data.filter(d => d && d[key] && typeof d[key] === 'string' && d[key].trim() !== '');
  const sorted = [...validData].sort((a, b) => (b.count || 0) - (a.count || 0));
  
  if (sorted.length <= limit) return sorted;
  
  const top = sorted.slice(0, limit);
  const othersCount = sorted.slice(limit).reduce((sum, item) => sum + (item.count || 0), 0);
  
  if (othersCount > 0) {
    top.push({ [key]: 'Other', count: othersCount });
  }
  return top;
};

export default function AnalyticsPage() {
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dupCount, setDupCount] = useState(0);
  const [removingDups, setRemovingDups] = useState(false);

  useEffect(() => {
    const fetchStats = () => {
      api.getStats()
        .then(setStats)
        .catch((e) => setError(e.message || "Failed to load stats"))
        .finally(() => setLoading(false));
        
      api.getDuplicates()
        .then(d => setDupCount(d.total_duplicate_files || 0))
        .catch(() => {});
    };
    fetchStats();
    const interval = setInterval(fetchStats, 8000);
    return () => clearInterval(interval);
  }, []);

  const handleRemoveDups = async () => {
    setRemovingDups(true);
    try {
      const result = await api.removeDuplicates(false);
      setDupCount(0);
      alert(`Removed ${result.removed} duplicate resumes`);
    } catch {
      alert('Failed to remove duplicates');
    } finally {
      setRemovingDups(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="relative">
          <motion.div className="w-20 h-20 rounded-full border-2 border-primary/20 border-t-primary border-l-primary" animate={{ rotate: 360 }} transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }} />
          <div className="absolute inset-0 flex items-center justify-center"><Activity className="w-8 h-8 text-primary animate-pulse" /></div>
        </div>
        <motion.p className="text-xs text-primary font-mono tracking-[0.3em]" animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 1.5, repeat: Infinity }}>INITIALIZING TELEMETRY...</motion.p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="text-xl font-bold font-display text-foreground tracking-wider">ANALYTICS</h1>
        <GlowingCard className="p-10 text-center border-destructive/30 bg-destructive/5">
          <AlertTriangle className="w-12 h-12 text-destructive mx-auto mb-4" />
          <p className="text-destructive font-bold mb-2 font-display tracking-widest uppercase">⚠ TELEMETRY OFFLINE</p>
          <p className="text-sm text-muted-foreground mb-4">Start the core engine to render analytics.</p>
        </GlowingCard>
      </div>
    );
  }

  if (!stats) return null;

  // Safely extract chart data
  const skillsData = stats.top_skills?.slice(0, 8).map(s => ({ name: s.skill, value: s.count })) || [];
  const scoreData = stats.score_distribution || [];
  const eduData = aggregateData(stats.education_distribution || [], 'education', 4);
  const locationData = aggregateData(stats.location_distribution || [], 'location', 5);
  
  const fraudData = [
    { name: 'Clean Profiles', count: Math.max(0, (stats.total_resumes || 0) - (stats.fraud_count || 0)), color: '#00ff66' }, 
    { name: 'Fraud Flagged', count: stats.fraud_count || 0, color: '#ff003c' } 
  ];

  const statCards = [
    { label: 'Total Resumes', value: stats.total_resumes || 0, icon: Users, color: 'primary' },
    { label: 'Avg Experience', value: parseFloat((stats.avg_experience || 0).toFixed(1)), suffix: 'y', icon: Clock, color: 'accent' },
    { label: 'Avg ATS Score', value: Math.round(stats.avg_score || 0), icon: Gauge, color: 'warning' },
    { label: 'Avg Impact Score', value: parseFloat((stats.avg_impact_score || 0).toFixed(1)), suffix: 'pt', icon: TrendingUp, color: 'success' },
    { label: 'Fraud Detected', value: stats.fraud_count || 0, icon: ShieldCheck, color: 'destructive' },
    { label: 'Unique Skills', value: stats.top_skills?.length || 0, icon: Activity, color: 'info' },
    { label: 'Certificates', value: stats.certificates_count || 0, icon: Award, color: 'warning' },
    { label: 'With Images', value: stats.resumes_with_images || 0, icon: FileImage, color: 'destructive' },
    { label: 'Avg Words', value: stats.avg_word_count || 0, icon: FileText, color: 'primary' },
    { label: 'Locations', value: stats.location_distribution?.length || 0, icon: MapPin, color: 'accent' },
  ];

  const labelStyle = { fill: 'hsl(var(--foreground))', fontSize: 12, fontWeight: 600, letterSpacing: '0.05em' };

  return (
    <>
      {/* 🌟 CINEMATIC BACKGROUND WATERMARK 🌟 */}
      <div className="fixed inset-0 pointer-events-none flex items-center justify-center z-[0] overflow-hidden">
        <motion.div
          animate={{ scale: [1, 1.05, 1], opacity: [0.12, 0.25, 0.12] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="w-[60vw] max-w-[500px] aspect-square flex items-center justify-center"
        >
          <motion.img 
            animate={{ rotate: 360 }}
            transition={{ duration: 90, repeat: Infinity, ease: "linear" }}
            src="/comp-logo.PNG" 
            alt="Watermark" 
            className="w-full h-full object-contain filter drop-shadow-[0_0_60px_rgba(56,189,248,0.4)]" 
          />
        </motion.div>
      </div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="relative z-10 space-y-8 pb-20">
        <svg width="0" height="0" className="absolute">
          <defs>
            <linearGradient id="neonGradient" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#00f0ff" />
              <stop offset="100%" stopColor="#0080ff" />
            </linearGradient>
            <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#00f0ff" stopOpacity={0.4} />
              <stop offset="100%" stopColor="#00f0ff" stopOpacity={0.0} />
            </linearGradient>
          </defs>
        </svg>

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <motion.div className="w-12 h-12 rounded-xl flex items-center justify-center glow-ring" style={{ background: 'linear-gradient(135deg, hsl(var(--neon-blue)), hsl(var(--neon-cyan)))' }}>
              <Activity className="w-6 h-6 text-primary-foreground" />
            </motion.div>
            <div>
              <h1 className="text-2xl font-extrabold font-display text-foreground tracking-wider">GeniusHub Control</h1>
              <p className="text-[10px] text-primary font-mono tracking-widest flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" /> LIVE TELEMETRY • AUTO-SYNC</p>
            </div>
          </div>
        </motion.div>

        {/* KPI Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {statCards.map((card, i) => (
            <GlowingCard key={card.label} className={`p-4 relative overflow-hidden ${card.color === 'destructive' && card.value > 0 && card.label === 'Fraud Detected' ? 'border-destructive/40 bg-destructive/10' : ''}`} delay={i * 0.04}>
              <div className="flex items-center justify-between mb-3 relative z-10">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center bg-${card.color}/10 border border-${card.color}/20`}><card.icon className={`w-4 h-4 text-${card.color}`} /></div>
              </div>
              <div className={`text-2xl font-extrabold font-display relative z-10 ${card.color === 'destructive' && card.value > 0 && card.label === 'Fraud Detected' ? 'text-destructive drop-shadow-[0_0_8px_rgba(var(--destructive-rgb),0.8)]' : 'text-foreground'}`}>
                <AnimatedCounter value={card.value} suffix={card.suffix} />
              </div>
              <p className="text-[9px] text-muted-foreground mt-1 font-display tracking-widest uppercase relative z-10">{card.label}</p>
              <div className={`absolute -bottom-4 -right-4 w-24 h-24 rounded-full bg-${card.color}/5 blur-2xl z-0`} />
            </GlowingCard>
          ))}
          
          {dupCount > 0 && (
            <GlowingCard className="p-4 border-warning/40 bg-warning/5" delay={0.35}>
              <div className="flex items-center justify-between mb-2"><div className="w-8 h-8 rounded-lg flex items-center justify-center bg-warning/20 border border-warning/30"><Copy className="w-4 h-4 text-warning" /></div></div>
              <div className="text-2xl font-extrabold font-display text-warning drop-shadow-[0_0_8px_rgba(var(--warning-rgb),0.5)]"><AnimatedCounter value={dupCount} /></div>
              <p className="text-[9px] text-muted-foreground mt-1 font-display tracking-widest uppercase mb-3">Duplicates Found</p>
              <button onClick={handleRemoveDups} disabled={removingDups} className="w-full text-[10px] py-1.5 rounded-md bg-warning/20 text-warning hover:bg-warning/30 transition-colors flex items-center justify-center gap-1.5 font-bold font-display tracking-widest border border-warning/40">
                {removingDups ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />} PURGE
              </button>
            </GlowingCard>
          )}
        </div>

        {/* LARGE CHARTS ROW 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* SKILLS ONTOLOGY */}
          {skillsData.length > 0 && (
            <GlowingCard className="p-6 md:p-8" delay={0.3}>
              <div className="mb-8 border-b border-border pb-4">
                <h3 className="text-sm font-display font-bold text-foreground flex items-center gap-2 tracking-widest uppercase"><TrendingUp className="w-5 h-5 text-primary" /> GLOBAL SKILLS ONTOLOGY</h3>
                <p className="text-xs text-muted-foreground mt-1.5">Volume of core competencies strictly extracted across talent pool.</p>
              </div>
              <div className="w-full h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={skillsData} layout="vertical" margin={{ left: 10, right: 40, top: 10, bottom: 25 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                    <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false}>
                      <Label value="Total Profiles Possessing Skill" offset={-15} position="insideBottom" style={labelStyle} />
                    </XAxis>
                    <YAxis type="category" dataKey="name" stroke="hsl(var(--foreground))" fontSize={11} width={100} tickLine={false} axisLine={false} fontWeight={600} />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(var(--secondary))', opacity: 0.4 }} />
                    <Bar dataKey="value" name="Profiles" radius={[0, 4, 4, 0]} fill="url(#neonGradient)" barSize={24}>
                      <LabelList dataKey="value" position="right" fill="hsl(var(--foreground))" fontSize={11} fontWeight="bold" />
                      {skillsData.map((_, i) => (<Cell key={`skill-${i}`} fill={NEON_COLORS[i % NEON_COLORS.length]} />))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </GlowingCard>
          )}

          {/* TALENT LIFECYCLE */}
          {(stats.experience_distribution?.length || 0) > 0 && (
            <GlowingCard className="p-6 md:p-8" delay={0.35}>
              <div className="mb-8 border-b border-border pb-4">
                <h3 className="text-sm font-display font-bold text-foreground flex items-center gap-2 tracking-widest uppercase"><Clock className="w-5 h-5 text-accent" /> TALENT LIFECYCLE</h3>
                <p className="text-xs text-muted-foreground mt-1.5">Distribution of calculated, gap-adjusted work experience.</p>
              </div>
              <div className="w-full h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={stats.experience_distribution} margin={{ left: 10, right: 20, top: 10, bottom: 25 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                    <XAxis dataKey="range" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false}>
                      <Label value="Years of Verified Experience" offset={-15} position="insideBottom" style={labelStyle} />
                    </XAxis>
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false}>
                      <Label value="Number of Profiles" angle={-90} position="insideLeft" offset={-5} style={labelStyle} />
                    </YAxis>
                    <Tooltip content={<CustomTooltip />} />
                    <Area type="monotone" dataKey="count" name="Profiles" stroke="#00f0ff" fill="url(#areaGradient)" strokeWidth={3} activeDot={{ r: 6, fill: '#00f0ff', stroke: '#000', strokeWidth: 2 }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </GlowingCard>
          )}
        </div>

        {/* CHARTS ROW 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* SYSTEM INTEGRITY (FRAUD PIE) */}
          <GlowingCard className="p-6" delay={0.38}>
            <div className="mb-6 border-b border-border pb-3">
              <h3 className="text-xs font-display font-bold text-foreground flex items-center gap-2 tracking-widest uppercase"><ShieldCheck className="w-4 h-4 text-success" /> SYSTEM INTEGRITY</h3>
              <p className="text-[10px] text-muted-foreground mt-1.5">Invisible text & keyword stuffing flags.</p>
            </div>
            <div className="w-full h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={fraudData} dataKey="count" nameKey="name" cx="50%" cy="50%" outerRadius={90} innerRadius={60} strokeWidth={0} paddingAngle={5}>
                    {fraudData.map((entry, i) => (<Cell key={`fraud-${i}`} fill={entry.color} style={{ filter: `drop-shadow(0 0 8px ${entry.color}60)` }} />))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </GlowingCard>

          {/* ATS SCORE BARS */}
          {scoreData.length > 0 && (
            <GlowingCard className="p-6" delay={0.4}>
              <div className="mb-6 border-b border-border pb-3">
                <h3 className="text-xs font-display font-bold text-foreground flex items-center gap-2 tracking-widest uppercase"><Gauge className="w-4 h-4 text-warning" /> COMPATIBILITY SCORING</h3>
                <p className="text-[10px] text-muted-foreground mt-1.5">Visual formatting & structural density scores.</p>
              </div>
              <div className="w-full h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={scoreData} margin={{ left: 0, right: 10, top: 15, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                    <XAxis dataKey="range" stroke="hsl(var(--muted-foreground))" fontSize={10} tickLine={false} axisLine={false}>
                      <Label value="Score Range" offset={-15} position="insideBottom" style={{ ...labelStyle, fontSize: 10 }} />
                    </XAxis>
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={10} tickLine={false} axisLine={false} />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(var(--secondary))', opacity: 0.4 }} />
                    <Bar dataKey="count" name="Profiles" radius={[4, 4, 0, 0]} barSize={28}>
                      <LabelList dataKey="count" position="top" fill="hsl(var(--foreground))" fontSize={11} fontWeight="bold" />
                      {scoreData.map((_, i) => (<Cell key={`score-${i}`} fill={['#ff003c', '#ffb700', '#00f0ff', '#0080ff', '#00ff66'][i] || NEON_COLORS[i]} />))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </GlowingCard>
          )}

          {/* EDUCATION MATRIX PIE */}
          {eduData.length > 0 && (
            <GlowingCard className="p-6" delay={0.45}>
              <div className="mb-6 border-b border-border pb-3">
                <h3 className="text-xs font-display font-bold text-foreground flex items-center gap-2 tracking-widest uppercase"><GraduationCap className="w-4 h-4 text-accent" /> EDUCATION MATRIX</h3>
                <p className="text-[10px] text-muted-foreground mt-1.5">Aggregated verified degree extractions.</p>
              </div>
              <div className="w-full h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={eduData} dataKey="count" nameKey="education" cx="50%" cy="50%" outerRadius={90} innerRadius={45} strokeWidth={2} stroke="hsl(var(--card))" label={({ education }) => `${education}`} labelLine={false} fontSize={11} fontWeight={700}>
                      {eduData.map((_, i) => (<Cell key={`edu-${i}`} fill={NEON_COLORS[i % NEON_COLORS.length]} style={{ opacity: 0.9 }} />))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </GlowingCard>
          )}

        </div>
      </motion.div>
    </>
  );
}