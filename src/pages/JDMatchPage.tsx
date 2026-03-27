import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Zap, Trophy, XCircle, BookOpenText, Info, Target as TargetIcon } from 'lucide-react';
import CandidateCard from '@/components/CandidateCard';
import CandidateModal from '@/components/CandidateModal';
import type { JDMatchResponse, Candidate } from '@/lib/types';
import { api } from '@/lib/api';

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 300, damping: 24 } }
};

const SAMPLE_JD = `Paste Job Description here... GeniusHub will extract requirements, bypass invisible text, keyword stuffing, and find actual top candidates.

Example requirements to try:
- Strong proficiency in React, TypeScript, and Node.js
- 5+ years experience in technical sourcing
- Experience with AWS and Docker`;

export default function JDMatchPage() {
  const [jd, setJd] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<JDMatchResponse | null>(null);
  const [error, setError] = useState('');
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);

  // NATIVE FETCH: Requires no extra packages, Vercel will pass this!
  const [status, setStatus] = useState<any>(null);
  useEffect(() => {
    fetch('https://vinu019-resume-backend.hf.space/api/live-status')
      .then(res => res.json())
      .then(data => setStatus(data))
      .catch(() => {});
  }, []);

  const [bookmarks, setBookmarks] = useState<Set<number>>(() => {
    try { return new Set(JSON.parse(localStorage.getItem('bookmarks') || '[]')); } catch { return new Set(); }
  });

  useEffect(() => {
    localStorage.setItem('bookmarks', JSON.stringify([...bookmarks]));
  }, [bookmarks]);

  const toggleBookmark = (id: number) => {
    setBookmarks(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleMatch = async () => {
    if (!jd.trim()) return;
    setLoading(true);
    setError('');
    try {
      const data = await api.jdMatch(jd); 
      setResult(data);
    } catch (err: any) {
      setError(err.message || 'Failed to analyze JD. Please check your backend connection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8 max-w-5xl mx-auto pb-20">
      
      <div className="text-center py-8 relative">
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="mb-6 relative inline-block">
            <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full scale-150" />
            <div className="w-24 h-24 rounded-3xl bg-secondary border border-border flex items-center justify-center relative shadow-inner overflow-hidden mx-auto">
              <img src="/bay-area-final.jpeg" alt="Company Logo" className="w-16 h-16 object-contain relative z-10" />
            </div>
        </motion.div>

        <h1 className="text-3xl md:text-4xl font-extrabold mb-3 tracking-tight" style={{ fontFamily: "'Inter', 'SF Pro Display', 'Helvetica Neue', sans-serif", letterSpacing: "-0.02em" }}>
          <span className="gradient-text">JD MATCH</span>
        </h1>
        <p className="text-muted-foreground max-w-2xl mx-auto text-sm leading-relaxed bg-secondary/30 py-2 px-4 rounded-full border border-border">
          Paste a job description — <span className="text-primary font-semibold">GeniusHub</span> extracts requirements and strictly matches top candidates
        </p>
      </div>

      <div className="glass-panel p-3 flex flex-col h-[400px]">
        <div className="flex items-center justify-between p-3 border-b border-border">
          <div className="flex items-center gap-3">
            <BookOpenText className="w-5 h-5 text-primary" />
            <span className="text-sm font-semibold tracking-tight">Raw Job Description</span>
          </div>
          <span className="text-[10px] font-mono text-muted-foreground uppercase px-2 py-0.5 rounded-md bg-secondary">UTF-8 / Plain Text</span>
        </div>
        <textarea
          value={jd}
          onChange={(e) => setJd(e.target.value)}
          placeholder={SAMPLE_JD}
          className="flex-1 p-5 bg-transparent text-sm resize-none focus:outline-none leading-relaxed placeholder:text-muted-foreground/30 font-mono"
        />
        <div className="p-3 border-t border-border mt-auto flex justify-between items-center bg-secondary/20 rounded-b-lg">
            <span className="text-xs text-muted-foreground font-mono">{jd.length} chars</span>
            <button
                onClick={handleMatch}
                disabled={loading || !status}
                className="btn-primary-glow !py-2.5 !px-8"
            >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <TargetIcon className="w-4 h-4" />}
                Match Candidates
            </button>
        </div>
      </div>

      <motion.div variants={itemVariants} className="glass-panel p-5 flex items-center justify-between gap-4 border border-dashed border-primary/20 bg-primary/5">
          <div className="flex items-center gap-4">
              <Zap className="w-8 h-8 text-primary" />
              <div>
                  <h4 className="font-semibold text-lg tracking-tight">Ready to Index</h4>
                  <p className="text-sm text-muted-foreground mt-0.5">Paste a Job Description above. The extraction engine is synced and waiting.</p>
              </div>
          </div>
          <div className="flex items-center gap-2 font-mono text-xs px-3 py-1 rounded-full bg-secondary text-muted-foreground">
              <Info className='w-3 h-3'/>
              Currently searching <span className='text-primary font-bold'>{status?.total_resumes || 0}</span> candidates
          </div>
      </motion.div>

      {error && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-panel p-5 border-destructive/20 bg-destructive/5">
          <p className="text-sm text-destructive flex items-center gap-2"><XCircle className="w-4 h-4" />{error}</p>
        </motion.div>
      )}

      <AnimatePresence>
        {result && result.candidates && result.candidates.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-3 mt-8">
            <h2 className="text-sm font-display font-bold text-foreground flex items-center gap-2 tracking-wider uppercase">
              <Trophy className="w-4 h-4 text-warning" />
              Top {result.candidates.length} Strict Matches
            </h2>
            {result.candidates.map((c, i) => (
              <CandidateCard 
                key={c.id || i} 
                candidate={c} 
                rank={i + 1} 
                bookmarked={bookmarks.has(c.id)}
                onBookmark={() => toggleBookmark(c.id)}
                onViewDetail={() => setSelectedCandidate(c)} 
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <CandidateModal
        candidate={selectedCandidate}
        onClose={() => setSelectedCandidate(null)}
      />
    </motion.div>
  );
}