import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Database, Trash2, AlertOctagon, Loader2, CheckSquare, Square, Eye, Activity, RefreshCw, Zap } from 'lucide-react';
import { api } from '@/lib/api';
import CandidateModal from '@/components/CandidateModal';
import GlowingCard from '@/components/GlowingCard';

export default function DatabasePage() {
  const [candidates, setCandidates] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [selectedCandidate, setSelectedCandidate] = useState<any | null>(null);
  const [isWiping, setIsWiping] = useState(false);

  // 🎯 NEW: Live Sync State for Naukri Integration
  const [liveSync, setLiveSync] = useState(false);
  const [recentImports, setRecentImports] = useState<any[]>([]);

  const PER_PAGE = 50;

  const fetchDatabase = async (p: number) => {
    setLoading(true);
    try {
      const data = await api.browse({ page: p, per_page: PER_PAGE });
      setCandidates(data.candidates);
      setTotal(data.total);
    } catch (e) {
      console.error("Failed to fetch DB");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDatabase(page);
  }, [page]);

  // 🎯 NEW: The Live Radar! Polls the DB every 3 seconds when activated
  useEffect(() => {
    let interval: any;
    if (liveSync) {
      const fetchRecent = async () => {
        try {
          // Fetch the absolute newest 5 resumes added to the database
          const data = await api.browse({ page: 1, per_page: 5, sort_by: 'created_at', sort_order: 'desc' });
          setRecentImports(data.candidates);
          
          // Also silently update the main total count
          const mainData = await api.browse({ page, per_page: PER_PAGE });
          setCandidates(mainData.candidates);
          setTotal(mainData.total);
        } catch (e) {
          console.error("Live Sync Error", e);
        }
      };
      
      fetchRecent(); // Fire immediately
      interval = setInterval(fetchRecent, 3000); // Then every 3 seconds
    }
    return () => clearInterval(interval);
  }, [liveSync, page]);

  const toggleSelect = (id: number) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === candidates.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(candidates.map(c => c.id)));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    if (!window.confirm(`Are you sure you want to delete ${selectedIds.size} resumes?`)) return;
    
    try {
      await api.deleteBatchResumes(Array.from(selectedIds));
      setSelectedIds(new Set());
      fetchDatabase(page);
    } catch (e) {
      alert("Failed to delete resumes");
    }
  };

  const handleNuclearWipe = async () => {
    if (!window.confirm("WARNING: This will permanently delete ALL resumes in the database. Are you absolutely sure?")) return;
    setIsWiping(true);
    try {
      await api.deleteAllResumes();
      setCandidates([]);
      setTotal(0);
      setPage(1);
    } catch (e) {
      alert("Failed to wipe database");
    } finally {
      setIsWiping(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 pb-20">
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold font-display tracking-tight text-foreground flex items-center gap-3">
            <Database className="w-8 h-8 text-primary" /> Master Database
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Manage and monitor all {total} indexed candidates.</p>
        </div>
        
        <div className="flex items-center gap-3">
          {/* 🎯 NEW: LIVE SYNC TOGGLE BUTTON */}
          <button 
            onClick={() => setLiveSync(!liveSync)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold tracking-wide transition-all ${
              liveSync 
                ? 'bg-success/20 text-success border border-success/50 shadow-[0_0_15px_rgba(16,185,129,0.3)]' 
                : 'bg-secondary/50 text-muted-foreground border border-border hover:bg-secondary'
            }`}
          >
            {liveSync ? <Activity className="w-4 h-4 animate-pulse" /> : <RefreshCw className="w-4 h-4" />}
            {liveSync ? 'Live Sync Active' : 'Start Live Sync'}
          </button>

          <button 
            onClick={handleNuclearWipe} 
            disabled={isWiping || total === 0}
            className="btn-ghost-glow !text-destructive !border-destructive/30 hover:!bg-destructive/10 flex items-center gap-2 disabled:opacity-50"
          >
            {isWiping ? <Loader2 className="w-4 h-4 animate-spin" /> : <AlertOctagon className="w-4 h-4" />} Wipe Database
          </button>
        </div>
      </div>

      {/* 🎯 NEW: THE LIVE RADAR PANEL */}
      <AnimatePresence>
        {liveSync && (
          <motion.div 
            initial={{ opacity: 0, height: 0, y: -20 }} 
            animate={{ opacity: 1, height: 'auto', y: 0 }} 
            exit={{ opacity: 0, height: 0, y: -20 }}
            className="overflow-hidden"
          >
            <GlowingCard className="p-5 border-success/30 bg-success/5 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-success/0 via-success to-success/0 animate-shimmer" />
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-full bg-success/20 flex items-center justify-center">
                  <Zap className="w-4 h-4 text-success animate-pulse" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-foreground">Listening for Naukri Extensions...</h3>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Showing newest arrivals in real-time</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                {recentImports.length === 0 ? (
                  <div className="col-span-5 text-center py-6 text-sm text-muted-foreground italic flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" /> Waiting for resumes to be pushed...
                  </div>
                ) : (
                  recentImports.map((c, i) => (
                    <motion.div 
                      key={c.id} 
                      initial={{ scale: 0.9, opacity: 0 }} 
                      animate={{ scale: 1, opacity: 1 }} 
                      transition={{ delay: i * 0.1 }}
                      onClick={() => setSelectedCandidate(c)}
                      className="bg-card border border-success/20 rounded-xl p-3 cursor-pointer hover:border-success/50 transition-colors shadow-lg"
                    >
                      <p className="text-xs font-bold text-foreground truncate">{c.name}</p>
                      <p className="text-[10px] text-success mt-1">{c.score}% Match Score</p>
                      <p className="text-[9px] text-muted-foreground truncate mt-1">{c.filename}</p>
                    </motion.div>
                  ))
                )}
              </div>
            </GlowingCard>
          </motion.div>
        )}
      </AnimatePresence>

      <GlowingCard className="overflow-hidden">
        {selectedIds.size > 0 && (
          <div className="bg-destructive/10 border-b border-destructive/20 p-3 flex items-center justify-between">
            <span className="text-sm font-medium text-destructive">{selectedIds.size} candidates selected</span>
            <button onClick={handleBulkDelete} className="px-3 py-1.5 bg-destructive text-white text-xs font-bold rounded-lg flex items-center gap-2 shadow-[0_0_10px_rgba(239,68,68,0.4)]">
              <Trash2 className="w-3.5 h-3.5" /> Delete Selected
            </button>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-secondary/50 text-muted-foreground font-display text-xs uppercase tracking-wider border-b border-border">
              <tr>
                <th className="p-4 w-12">
                  <button onClick={toggleSelectAll} className="hover:text-primary transition-colors">
                    {selectedIds.size === candidates.length && candidates.length > 0 ? <CheckSquare className="w-4 h-4 text-primary" /> : <Square className="w-4 h-4" />}
                  </button>
                </th>
                <th className="p-4">Candidate Name</th>
                <th className="p-4">Location</th>
                <th className="p-4">Experience</th>
                <th className="p-4">ATS Score</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-muted-foreground">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" /> Loading database...
                  </td>
                </tr>
              ) : candidates.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-muted-foreground">No candidates indexed yet.</td>
                </tr>
              ) : (
                candidates.map(c => (
                  <tr key={c.id} className="hover:bg-secondary/20 transition-colors group">
                    <td className="p-4">
                      <button onClick={() => toggleSelect(c.id)} className="text-muted-foreground hover:text-primary transition-colors">
                        {selectedIds.has(c.id) ? <CheckSquare className="w-4 h-4 text-primary" /> : <Square className="w-4 h-4" />}
                      </button>
                    </td>
                    <td className="p-4 font-medium text-foreground">{c.name}</td>
                    <td className="p-4 text-muted-foreground">{c.location || '-'}</td>
                    <td className="p-4 text-muted-foreground">{c.experience_years ? `${c.experience_years}y` : '-'}</td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold font-mono ${c.score > 75 ? 'bg-success/10 text-success border border-success/20' : c.score > 50 ? 'bg-warning/10 text-warning border border-warning/20' : 'bg-destructive/10 text-destructive border border-destructive/20'}`}>
                        {c.score}%
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => setSelectedCandidate(c)} className="p-1.5 bg-secondary hover:bg-primary/20 text-muted-foreground hover:text-primary rounded-lg transition-colors" title="View Profile">
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {total > 0 && (
          <div className="p-4 bg-secondary/30 border-t border-border/50 flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Showing {(page - 1) * PER_PAGE + 1} to {Math.min(page * PER_PAGE, total)} of {total}</span>
            <div className="flex items-center gap-2">
              <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1 bg-secondary rounded hover:bg-white/10 disabled:opacity-50">Prev</button>
              <span className="font-bold">{page}</span>
              <button disabled={page * PER_PAGE >= total} onClick={() => setPage(p => p + 1)} className="px-3 py-1 bg-secondary rounded hover:bg-white/10 disabled:opacity-50">Next</button>
            </div>
          </div>
        )}
      </GlowingCard>

      <CandidateModal
        candidate={selectedCandidate}
        onClose={() => setSelectedCandidate(null)}
        onDelete={async (id: number) => {
          await api.deleteBatchResumes([id]);
          setSelectedCandidate(null);
          fetchDatabase(page);
        }}
      />
    </motion.div>
  );
}