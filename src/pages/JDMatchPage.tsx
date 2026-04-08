import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Sparkles, Loader2, Target, CheckCircle2, XCircle, FileDown, Trophy, Shield, Zap, AlertTriangle, MapPin, Key } from 'lucide-react';
import CandidateCard from '@/components/CandidateCard';
import CandidateModal from '@/components/CandidateModal';
import GlowingCard from '@/components/GlowingCard';
import type { JDMatchResponse, Candidate } from '@/lib/types';
import { api } from '@/lib/api';

const SAMPLE_JD = `We are looking for a Senior Full Stack Developer with 5+ years of experience.\n\nRequirements:\n- Strong proficiency in React, TypeScript, and Node.js\n- Experience with cloud services (AWS/GCP)\n- Knowledge of SQL and NoSQL databases\n- Experience with CI/CD pipelines and Docker\n- Excellent problem-solving skills\n\nNice to have:\n- Experience with microservices architecture\n- Knowledge of GraphQL\n- Contributions to open-source projects`;

export default function JDMatchPage() {
  const [jd, setJd] = useState('');
  const [location, setLocation] = useState(''); 
  const [keySkills, setKeySkills] = useState(''); 
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<JDMatchResponse | null>(null);
  const [error, setError] = useState('');
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);

  // 🎯 THE FIX: Increased limit to 500
  const MONTHLY_LIMIT = 500;
  const [usageCount, setUsageCount] = useState(0);
  const isDemo = typeof window !== 'undefined' && !!new URLSearchParams(window.location.search).get('demo');

  const [bookmarks, setBookmarks] = useState<Set<number>>(() => {
    try { return new Set(JSON.parse(localStorage.getItem('bookmarks') || '[]')); } catch { return new Set(); }
  });

  useEffect(() => {
    if (isDemo) {
      const date = new Date();
      // 🎯 THE FIX: Changed key to "_v2_" to instantly reset everyone's tracker back to zero!
      const monthKey = `jd_usage_v2_${date.getFullYear()}_${date.getMonth()}`; 
      const storedUsage = localStorage.getItem(monthKey);
      
      if (storedUsage) {
        setUsageCount(parseInt(storedUsage, 10));
      } else {
        localStorage.setItem(monthKey, '0');
      }
    }
  }, [isDemo]);

  useEffect(() => {
    localStorage.setItem('bookmarks', JSON.stringify([...bookmarks]));
  }, [bookmarks]);

  const toggleBookmark = (id: number) => {
    setBookmarks(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleDelete = async (id: number, name: string) => {
    if (!window.confirm(`Are you sure you want to permanently delete ${name}'s resume?`)) return;
    try {
      await api.deleteResume(id);
      setResult((prev: any) => prev ? { ...prev, candidates: prev.candidates.filter((c: any) => c.id !== id) } : null);
      if (selectedCandidate?.id === id) setSelectedCandidate(null);
    } catch (e) {
      alert("Failed to delete candidate.");
    }
  };

  const handleMatch = async () => {
    if (!jd.trim()) return;

    if (isDemo) {
      const date = new Date();
      const monthKey = `jd_usage_v2_${date.getFullYear()}_${date.getMonth()}`;
      const currentUsage = parseInt(localStorage.getItem(monthKey) || '0', 10);
      
      if (currentUsage >= MONTHLY_LIMIT) {
        setError(`Monthly Limit Reached: You have exhausted your ${MONTHLY_LIMIT} JD matches for this month. Please wait until next month.`);
        return; 
      }
    }

    setResult(null);
    setLoading(true);
    setError('');
    try {
      const data = await api.matchJD({ 
        job_description: jd, 
        top_k: 30, 
        location: location.trim(),
        key_skills: keySkills.trim()
      });
      setResult(data);

      if (isDemo) {
        const date = new Date();
        const monthKey = `jd_usage_v2_${date.getFullYear()}_${date.getMonth()}`;
        const currentUsage = parseInt(localStorage.getItem(monthKey) || '0', 10);
        const newUsage = currentUsage + 1;
        
        localStorage.setItem(monthKey, newUsage.toString());
        setUsageCount(newUsage);
      }

    } catch (e: any) {
      setError(e.message || 'Match failed.');
    } finally {
      setLoading(false);
    }
  };

  const exportResults = () => {
    if (!result?.candidates.length) return;
    window.open(api.exportCSV(result.candidates.map(c => c.id)), '_blank');
  };

  return (
    <>
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

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8 pb-20 relative z-10">
        
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center py-4">
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
            className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3 relative glow-ring bg-secondary/30 backdrop-blur-md border border-border/50"
          >
            <img src="/comp-logo.PNG" alt="GeniusHub Logo" className="w-8 h-8 object-contain drop-shadow-lg relative z-10" />
          </motion.div>
          <h1 className="text-3xl font-extrabold font-display mb-2 tracking-tight">
            <span className="gradient-text-accent">JD MATCH</span>
          </h1>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Paste a job description — <span className="font-bold text-primary">GeniusHub</span> extracts requirements and strictly matches top candidates
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="space-y-3">
            <div className="relative">
              <textarea className="input-glass min-h-[300px] resize-none w-full" placeholder="Paste job description here..." value={jd} onChange={(e) => setJd(e.target.value)} />
              <div className="absolute bottom-3 right-3 text-[10px] font-mono text-muted-foreground">{jd.length} chars</div>
            </div>
            
            <div className="relative">
              <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input 
                type="text" 
                className="input-glass w-full pl-11 !py-3 text-sm" 
                placeholder="Target Location (e.g. Remote, India, New York) - Optional" 
                value={location} 
                onChange={(e) => setLocation(e.target.value)} 
              />
            </div>

            <div className="relative mt-2">
              <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-warning" />
              <input 
                type="text" 
                className="input-glass w-full pl-11 !py-3 text-sm border-warning/30 focus:border-warning/70 transition-colors" 
                placeholder="Priority Key Skills (e.g. React, AWS) - Optional Strict Match" 
                value={keySkills} 
                onChange={(e) => setKeySkills(e.target.value)} 
              />
            </div>

            <div className="flex gap-2 mt-4">
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                onClick={handleMatch} disabled={loading || !jd.trim()} className="btn-primary-glow flex-1">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <img src="/comp-logo.PNG" className="w-4 h-4 object-contain" alt="Match Logo" />} Analyze & Match
              </motion.button>
              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                onClick={() => setJd(SAMPLE_JD)} className="btn-ghost-glow">Sample JD</motion.button>
            </div>

            {isDemo && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-6 bg-[#0f172a] p-5 rounded-xl border border-gray-800 shadow-lg">
                <div className="flex justify-between items-center text-sm text-gray-400 mb-3 font-display font-semibold tracking-wide">
                  <span className="flex items-center gap-2"><Target className="w-4 h-4 text-primary" /> SEARCH LIMIT</span>
                  <span className={usageCount >= MONTHLY_LIMIT ? "text-destructive" : "text-primary"}>
                    {usageCount} / {MONTHLY_LIMIT} JDs
                  </span>
                </div>
                
                <div className="w-full bg-gray-800/80 rounded-full h-2 overflow-hidden border border-gray-700/50">
                  <div 
                    className={`h-full transition-all duration-700 ease-out ${usageCount >= MONTHLY_LIMIT ? 'bg-destructive' : 'bg-gradient-to-r from-primary to-accent'}`}
                    style={{ width: `${Math.min((usageCount / MONTHLY_LIMIT) * 100, 100)}%` }}
                  ></div>
                </div>
                
                {usageCount >= MONTHLY_LIMIT && (
                  <p className="text-destructive text-xs mt-3 flex items-center gap-1.5 font-medium">
                    <AlertTriangle className="w-3.5 h-3.5" /> Limit reached. Renews next month.
                  </p>
                )}
              </motion.div>
            )}

          </motion.div>

          <AnimatePresence mode="wait">
            {result ? (
              <motion.div key="results" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-4">
                <GlowingCard className="p-5 holo-shimmer">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Zap className="w-4 h-4 text-accent" />
                      <h3 className="text-[10px] font-display font-semibold text-muted-foreground uppercase tracking-widest">EXTRACTED REQUIREMENTS</h3>
                    </div>
                    <button onClick={exportResults} className="btn-ghost-glow !px-3 !py-1 !text-[10px]">
                      <FileDown className="w-3 h-3" /> Export
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {result.required_skills?.map((s: string, i: number) => (
                      <motion.span key={s} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: i * 0.03 }} className="skill-tag border border-warning text-warning bg-warning/10">{s}</motion.span>
                    ))}
                  </div>
                  <div className="flex items-center gap-4 text-[10px] font-mono text-muted-foreground">
                    <span className="flex items-center gap-1"><Shield className="w-3 h-3" /> Strict Filter Applied</span>
                    <span className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3 text-success" /> {result.candidates.length} perfect matches</span>
                    <span>⏱ {(result.total_time * 1000).toFixed(0)}ms</span>
                  </div>
                </GlowingCard>

                {result.candidates.length > 0 && (
                  <GlowingCard className="p-5" delay={0.1}>
                    <h3 className="text-[10px] font-display font-semibold text-muted-foreground uppercase tracking-widest mb-3 flex items-center gap-2">
                      <Trophy className="w-3 h-3 text-warning" /> TOP MATCHES
                    </h3>
                    <div className="space-y-2.5">
                      {result.candidates.slice(0, 5).map((c: any, i: number) => {
                        const isFraud = c.fraud_flag === 1;
                        return (
                          <motion.div key={c.id || i} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 + i * 0.08 }}
                            className="flex items-center gap-3">
                            <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-bold shrink-0 ${i === 0 ? 'rank-gold' : i === 1 ? 'rank-silver' : i === 2 ? 'rank-bronze' : 'bg-secondary text-muted-foreground'}`}>
                              {i + 1}
                            </span>
                            <span className={`text-xs w-28 truncate font-medium flex items-center gap-1 ${isFraud ? 'text-destructive' : 'text-foreground'}`}>
                              {c.name}
                              {isFraud && <AlertTriangle className="w-3 h-3 shrink-0" />}
                            </span>
                            <div className="flex-1 h-2 rounded-full bg-secondary overflow-hidden">
                              <motion.div initial={{ width: 0 }} animate={{ width: `${c.score}%` }}
                                transition={{ delay: 0.3 + i * 0.08, duration: 0.8 }}
                                className="h-full rounded-full"
                                style={{ background: isFraud ? 'hsl(var(--destructive))' : `linear-gradient(90deg, hsl(var(--neon-blue)), hsl(var(${c.score > 75 ? '--success' : c.score > 50 ? '--warning' : '--destructive'})))` }} 
                              />
                            </div>
                            <span className={`text-xs font-bold font-display w-10 text-right ${isFraud ? 'text-destructive' : 'text-foreground'}`}>
                              {c.score}%
                            </span>
                          </motion.div>
                        );
                      })}
                    </div>
                  </GlowingCard>
                )}
              </motion.div>
            ) : (
              <motion.div key="empty" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}>
                <GlowingCard className="p-10 text-center h-full flex flex-col items-center justify-center">
                  <div className="w-14 h-14 rounded-2xl bg-accent/10 flex items-center justify-center mx-auto mb-4">
                    <FileText className="w-7 h-7 text-accent" />
                  </div>
                  <h3 className="text-base font-bold text-foreground mb-2">Intelligent JD Matching</h3>
                  <p className="text-sm text-muted-foreground max-w-sm leading-relaxed">
                    <span className="font-bold text-primary">GeniusHub</span> extracts skills, experience, and role details, then strictly filters out candidates lacking the requirements.
                  </p>
                </GlowingCard>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {error && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-panel p-5 border-destructive/20 mt-6">
            <p className="text-sm text-destructive flex items-center gap-2"><XCircle className="w-4 h-4" />{error}</p>
          </motion.div>
        )}

        <AnimatePresence>
          {result && result.candidates.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-3 mt-8">
              <h2 className="text-sm font-display font-bold text-foreground flex items-center gap-2 tracking-wider uppercase">
                <Trophy className="w-4 h-4 text-warning" />
                Top {result.candidates.length} Strict Matches
              </h2>
              {result.candidates.map((c: any, i: number) => (
                <CandidateCard 
                  key={c.id || i} 
                  candidate={c} 
                  rank={i + 1} 
                  bookmarked={bookmarks.has(c.id)}
                  onBookmark={() => toggleBookmark(c.id)}
                  onViewDetail={() => setSelectedCandidate(c)} 
                  onDelete={handleDelete} 
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      <CandidateModal
        candidate={selectedCandidate}
        onClose={() => setSelectedCandidate(null)}
        onDelete={handleDelete} 
      />
    </>
  );
}