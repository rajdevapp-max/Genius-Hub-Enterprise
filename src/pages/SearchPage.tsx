import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Sparkles, Clock, Loader2, Zap, Brain, User,
  MapPin, Download, SlidersHorizontal, FileDown, Trophy, Shield, 
  CheckCircle2, AlertTriangle, Github, Linkedin, Code2, Terminal, UserMinus, ChevronLeft, ChevronRight, RotateCcw
} from 'lucide-react';
import CandidateCard from '@/components/CandidateCard';
import GlowingCard from '@/components/GlowingCard';
import CandidateModal from '@/components/CandidateModal';
import { api } from '@/lib/api';

const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.06 } } };
const itemVariants = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } } };

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState(''); 
  const [liveStatus, setLiveStatus] = useState<any>(null);
  
  const [showFilters, setShowFilters] = useState(true);
  
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<any>(null);
  const [selectedCandidate, setSelectedCandidate] = useState<any>(null);
  
  const [currentPage, setCurrentPage] = useState(1);
  const [isPaginating, setIsPaginating] = useState(false);
  const [isBlindMode, setIsBlindMode] = useState(false);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsTimeout = useRef<NodeJS.Timeout | null>(null);

  const [minExp, setMinExp] = useState(0);
  const [eduFilter, setEduFilter] = useState('');
  const [mandatorySkills, setMandatorySkills] = useState('');
  const [secondarySkills, setSecondarySkills] = useState('');
  const [mandatoryLocation, setMandatoryLocation] = useState('');
  
  const [topN, setTopN] = useState('');
  
  const [requireLinkedin, setRequireLinkedin] = useState(false);
  const [requireGithub, setRequireGithub] = useState(false);
  const [requireLeetcode, setRequireLeetcode] = useState(false);
  const [requireHackerrank, setRequireHackerrank] = useState(false);
  const [requireCodechef, setRequireCodechef] = useState(false);

  const [bookmarks, setBookmarks] = useState(() => {
    try { return new Set(JSON.parse(localStorage.getItem('bookmarks') || '[]')); } catch { return new Set(); }
  });

  useEffect(() => {
    const poll = () => api.getLiveStatus().then(setLiveStatus).catch(() => {});
    poll();
    const id = setInterval(poll, 8000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    localStorage.setItem('bookmarks', JSON.stringify([...bookmarks]));
  }, [bookmarks]);

  const toggleBookmark = (id: any) => {
    setBookmarks((prev: any) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  // 🎯 NEW: Secure Delete Function for Search Page
  const handleDelete = async (id: number, name: string) => {
    if (!window.confirm(`Are you sure you want to permanently delete ${name}'s resume?`)) return;
    try {
      await api.deleteResume(id);
      setResult((prev: any) => prev ? { ...prev, candidates: prev.candidates.filter((c: any) => c.id !== id), total_matches: prev.total_matches - 1 } : null);
      if (selectedCandidate?.id === id) setSelectedCandidate(null);
    } catch (e) {
      alert("Failed to delete candidate.");
    }
  };

  const handleQueryChange = (value: string) => {
    setQuery(value);
    if (suggestionsTimeout.current) clearTimeout(suggestionsTimeout.current);
    if (value.length >= 2) {
      suggestionsTimeout.current = setTimeout(() => {
        api.suggestions(value).then(s => { setSuggestions(s); setShowSuggestions(true); }).catch(() => {});
      }, 300);
    } else {
      setShowSuggestions(false);
    }
  };

  const handleReset = () => {
    setQuery('');
    setMinExp(0);
    setEduFilter('');
    setMandatorySkills('');
    setSecondarySkills('');
    setMandatoryLocation('');
    setTopN('');
    setRequireLinkedin(false);
    setRequireGithub(false);
    setRequireLeetcode(false);
    setRequireHackerrank(false);
    setRequireCodechef(false);
    setResult(null);
  };

  const handleSearch = async (targetPage = 1) => {
    const q = query;
    if (!q.trim() && !mandatorySkills && !mandatoryLocation) return;
    
    setShowSuggestions(false);
    
    if (targetPage > 1 || (result && targetPage !== result.page)) {
      setIsPaginating(true);
    } else {
      setLoading(true);
    }
    
    setCurrentPage(targetPage);
    setError('');
    
    try {
      const data = await api.search({
        query: q, 
        page: targetPage,
        per_page: 30,
        top_n: parseInt(topN) || 0, 
        min_experience: minExp, 
        mandatory_education: eduFilter,
        mandatory_skills: mandatorySkills ? mandatorySkills.split(',').map(s => s.trim()).filter(Boolean) : [],
        secondary_skills: secondarySkills ? secondarySkills.split(',').map(s => s.trim()).filter(Boolean) : [],
        mandatory_location: mandatoryLocation.trim(),
        require_linkedin: requireLinkedin,
        require_github: requireGithub,
        require_leetcode: requireLeetcode,
        require_hackerrank: requireHackerrank,
        require_codechef: requireCodechef
      });
      setResult(data);
      if (targetPage > 1) {
          window.scrollTo({ top: 300, behavior: 'smooth' });
      }
    } catch (e: any) {
      console.error(e);
      setError(e.message || 'Search API failed. Check backend terminal for details.');
      setResult(null); 
    } finally {
      setLoading(false);
      setIsPaginating(false);
    }
  };

  const exportResults = () => {
    if (!result?.candidates.length) return;
    window.open(api.exportCSV(result.candidates.map((c: any) => c.id)), '_blank');
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

      <motion.div variants={containerVariants} initial="hidden" animate="visible" className="relative z-10 space-y-8 pb-20">
        
        <motion.div variants={itemVariants} className="text-center py-6">
          <h1 className="text-3xl md:text-4xl font-extrabold mb-2 tracking-tight" style={{ fontFamily: "'Inter', 'SF Pro Display', 'Helvetica Neue', sans-serif", letterSpacing: "-0.02em" }}>
            <span className="gradient-text">BATS GeniusHub</span>
          </h1>
          <p className="text-muted-foreground max-w-lg mx-auto text-sm leading-relaxed mb-4">
            Precision Sourcing for tech talent
          </p>
        </motion.div>

        <motion.div variants={itemVariants} className="relative max-w-4xl mx-auto">
          <div className="relative z-10 flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                  <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <input
                      ref={inputRef}
                      className="input-glass pl-14 pr-32 py-4.5 text-base rounded-2xl w-full"
                      placeholder="Type general keywords, roles, or names..."
                      value={query}
                      onChange={(e) => handleQueryChange(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') handleSearch(1); if (e.key === 'Escape') setShowSuggestions(false); }}
                  />
              </div>
            
              <div className="flex items-center gap-2 shrink-0">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleReset}
                    className="p-3 rounded-xl transition-colors flex items-center gap-2 h-full text-muted-foreground hover:text-destructive hover:bg-destructive/10 border border-border/50 bg-background/50 backdrop-blur-md"
                    title="Reset All Filters"
                  >
                    <RotateCcw className="w-5 h-5" />
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowFilters(!showFilters)}
                    className={`p-3 rounded-xl transition-colors flex items-center gap-2 h-full ${showFilters ? 'bg-primary/20 text-primary ring-1 ring-primary/50' : 'text-muted-foreground hover:text-foreground hover:bg-secondary border border-border/50 bg-background/50 backdrop-blur-md'}`}
                    title="Toggle Filters"
                  >
                    <SlidersHorizontal className="w-5 h-5" />
                  </motion.button>
                  
                  <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setIsBlindMode(!isBlindMode)}
                      className={`p-3 rounded-xl transition-colors flex items-center gap-2 h-full ${isBlindMode ? 'bg-primary text-primary-foreground shadow-[0_0_15px_rgba(var(--primary-rgb),0.5)]' : 'text-muted-foreground hover:text-foreground hover:bg-secondary border border-border/50 bg-background/50 backdrop-blur-md'}`}
                      title={isBlindMode ? "Disable Blind Mode" : "Enable Anti-Bias Mode"}
                  >
                      <UserMinus className="w-5 h-5" />
                  </motion.button>

                  <button
                    onClick={() => handleSearch(1)}
                    disabled={loading}
                    className="btn-primary-glow !py-3 !px-6 !rounded-xl h-full"
                  >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                    <span className="hidden sm:inline">Search</span>
                  </button>
              </div>
          </div>

          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0, y: -10 }}
                animate={{ opacity: 1, height: 'auto', y: 0 }}
                exit={{ opacity: 0, height: 0, y: -10 }}
                className="overflow-hidden mt-4"
              >
                <div className="glass-panel p-6 border border-primary/20 shadow-[0_0_30px_rgba(var(--primary-rgb),0.1)]">
                  
                  <div className="mb-5">
                    <h3 className="text-xs font-display font-bold text-primary uppercase tracking-widest flex items-center gap-2 mb-4">
                      <Brain className="w-4 h-4" /> AI Semantic Skills
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-[10px] text-warning mb-1 block uppercase tracking-wider font-bold">Mandatory Skills (Must Have)</label>
                        <input className="input-glass !py-2 text-sm border-warning/30 focus:border-warning" placeholder="e.g. Python, React, AWS" value={mandatorySkills} onChange={e => setMandatorySkills(e.target.value)} />
                      </div>
                      <div>
                        <label className="text-[10px] text-success mb-1 block uppercase tracking-wider font-bold">Secondary Skills (Nice to Have)</label>
                        <input className="input-glass !py-2 text-sm border-success/30 focus:border-success" placeholder="e.g. Docker, Redis" value={secondarySkills} onChange={e => setSecondarySkills(e.target.value)} />
                      </div>
                    </div>
                  </div>

                  <div className="w-full h-px bg-border my-5" />

                  <div>
                    <h3 className="text-xs font-display font-bold text-primary uppercase tracking-widest flex items-center gap-2 mb-4">
                      <SlidersHorizontal className="w-4 h-4" /> Logistics & Experience
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div>
                        <label className="text-[10px] text-muted-foreground mb-1 block uppercase tracking-wider">Location (Global)</label>
                        <input className="input-glass !py-2 text-sm" placeholder="e.g. India, Remote, New York" value={mandatoryLocation} onChange={e => setMandatoryLocation(e.target.value)} />
                      </div>
                      <div>
                        <label className="text-[10px] text-muted-foreground mb-1 block uppercase tracking-wider">Min Experience</label>
                        <div className="flex items-center gap-3 mt-2">
                          <input type="range" min="0" max="15" value={minExp} onChange={e => setMinExp(Number(e.target.value))} className="w-full accent-primary" />
                          <span className="text-xs font-bold w-12">{minExp}+ yr</span>
                        </div>
                      </div>
                      <div>
                        <label className="text-[10px] text-muted-foreground mb-1 block uppercase tracking-wider">Top N Limit</label>
                        <input type="number" min="1" className="input-glass !py-2 text-sm" placeholder="e.g. 10 (Leave blank)" value={topN} onChange={e => setTopN(e.target.value)} />
                      </div>
                    </div>

                    <div className="flex flex-col gap-3 mt-4 bg-secondary/30 p-4 rounded-xl border border-border">
                      <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">Required Profiles:</span>
                      <div className="flex flex-wrap items-center gap-5">
                        <label className="flex items-center gap-2 text-sm cursor-pointer hover:text-primary transition-colors">
                          <input type="checkbox" checked={requireLinkedin} onChange={e => setRequireLinkedin(e.target.checked)} className="rounded border-border text-primary focus:ring-primary/20" />
                          <Linkedin className="w-4 h-4" /> LinkedIn
                        </label>
                        <label className="flex items-center gap-2 text-sm cursor-pointer hover:text-foreground transition-colors">
                          <input type="checkbox" checked={requireGithub} onChange={e => setRequireGithub(e.target.checked)} className="rounded border-border text-primary focus:ring-primary/20" />
                          <Github className="w-4 h-4" /> GitHub
                        </label>
                        <label className="flex items-center gap-2 text-sm cursor-pointer hover:text-warning transition-colors">
                          <input type="checkbox" checked={requireLeetcode} onChange={e => setRequireLeetcode(e.target.checked)} className="rounded border-border text-primary focus:ring-primary/20" />
                          <Code2 className="w-4 h-4" /> LeetCode
                        </label>
                        <label className="flex items-center gap-2 text-sm cursor-pointer hover:text-success transition-colors">
                          <input type="checkbox" checked={requireHackerrank} onChange={e => setRequireHackerrank(e.target.checked)} className="rounded border-border text-primary focus:ring-primary/20" />
                          <Terminal className="w-4 h-4" /> HackerRank
                        </label>
                        <label className="flex items-center gap-2 text-sm cursor-pointer hover:text-orange-500 transition-colors">
                          <input type="checkbox" checked={requireCodechef} onChange={e => setRequireCodechef(e.target.checked)} className="rounded border-border text-primary focus:ring-primary/20" />
                          <Brain className="w-4 h-4" /> CodeChef
                        </label>
                      </div>
                    </div>
                  </div>

                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        <AnimatePresence>
          {error && !loading && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="max-w-4xl mx-auto bg-red-500/10 border border-red-500/50 p-4 rounded-xl flex items-center gap-3 text-red-500">
              <AlertTriangle className="w-5 h-5 flex-shrink-0" />
              <p className="text-sm font-medium">{error}</p>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {loading && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center gap-4 py-14">
              <div className="relative">
                <motion.div className="w-16 h-16 rounded-full border-2 border-primary/10 border-t-primary" animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} />
                <div className="absolute inset-0 flex items-center justify-center"><Brain className="w-6 h-6 text-primary" /></div>
              </div>
              <motion.p className="text-xs text-muted-foreground font-mono tracking-wide" animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 1.5, repeat: Infinity }}>
                EXECUTING DEEP SEARCH...
              </motion.p>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {result && !loading && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 max-w-5xl mx-auto">
              
              <div className="flex items-center justify-between glass-panel px-5 py-3 rounded-xl">
                <div className="flex items-center gap-4 text-sm font-medium">
                  <span className="flex items-center gap-1.5"><Search className="w-4 h-4 text-primary" /> {result.total_matches || result.candidates.length} Found</span>
                  <span className="text-muted-foreground">|</span>
                  <span className="flex items-center gap-1.5"><Clock className="w-4 h-4 text-accent" /> {(result.total_time * 1000).toFixed(0)}ms</span>
                </div>
                <button onClick={exportResults} className="btn-ghost-glow !px-3 !py-1.5 !text-xs">
                  <FileDown className="w-4 h-4" /> Export All
                </button>
              </div>

              <div className={`space-y-4 transition-opacity duration-200 ${isPaginating ? 'opacity-50' : 'opacity-100'}`}>
                {result.candidates.map((c: any, i: any) => (
                  <CandidateCard
                    key={c.id || i}
                    candidate={c}
                    rank={((result.page || 1) - 1) * (result.per_page || 30) + i + 1}
                    bookmarked={bookmarks.has(c.id)}
                    blindMode={isBlindMode} 
                    onBookmark={() => toggleBookmark(c.id)}
                    onViewDetail={() => setSelectedCandidate(c)}
                    onDelete={handleDelete} // 🎯 NEW: DELETE HOOKED UP
                  />
                ))}
              </div>

              {result.total_pages > 1 && (
                <div className="flex items-center justify-center gap-4 py-8">
                  <button
                    onClick={() => handleSearch(result.page - 1)}
                    disabled={result.page === 1 || isPaginating}
                    className="p-2 rounded-lg bg-secondary/50 hover:bg-primary/20 text-muted-foreground hover:text-primary transition-colors disabled:opacity-30 disabled:pointer-events-none"
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </button>
                  
                  <span className="text-sm font-medium text-muted-foreground font-mono">
                    PAGE <span className="text-foreground">{result.page}</span> OF {result.total_pages}
                  </span>

                  <button
                    onClick={() => handleSearch(result.page + 1)}
                    disabled={result.page === result.total_pages || isPaginating}
                    className="p-2 rounded-lg bg-secondary/50 hover:bg-primary/20 text-muted-foreground hover:text-primary transition-colors disabled:opacity-30 disabled:pointer-events-none"
                  >
                    <ChevronRight className="w-6 h-6" />
                  </button>
                </div>
              )}

              {result.candidates.length === 0 && (
                <GlowingCard className="p-10 text-center">
                  <AlertTriangle className="w-10 h-10 text-warning/50 mx-auto mb-3" />
                  <p className="text-foreground font-medium mb-1">No candidates passed the strict filters.</p>
                  <p className="text-sm text-muted-foreground">Try relaxing your Mandatory Requirements or Location.</p>
                </GlowingCard>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      <CandidateModal
        candidate={selectedCandidate}
        onClose={() => setSelectedCandidate(null)}
        onDelete={handleDelete} // 🎯 NEW: DELETE HOOKED UP
      />
    </>
  );
}