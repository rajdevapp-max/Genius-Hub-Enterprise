import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Database, Trash2, AlertOctagon, Loader2, CheckSquare, Square, Eye } from 'lucide-react';
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

  const toggleSelectAll = () => {
    if (selectedIds.size === candidates.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(candidates.map(c => c.id)));
    }
  };

  const toggleSelect = (id: number) => {
    const next = new Set(selectedIds);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelectedIds(next);
  };

  const handleDeleteSelected = async () => {
    if (selectedIds.size === 0) return;
    if (!window.confirm(`Are you sure you want to delete ${selectedIds.size} profiles?`)) return;
    
    try {
      await api.deleteBatchResumes(Array.from(selectedIds));
      setSelectedIds(new Set());
      fetchDatabase(page); 
    } catch (e) {
      alert("Failed to delete batch");
    }
  };

  const handleNukeDatabase = async () => {
    const code = prompt(`WARNING: This will permanently delete ALL ${total} profiles in the database.\n\nType "NUKE" to confirm:`);
    if (code !== "NUKE") return;

    setIsWiping(true);
    try {
      await api.deleteAllResumes();
      setPage(1);
      fetchDatabase(1);
    } catch (e) {
      alert("Failed to wipe database");
    } finally {
      setIsWiping(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 pointer-events-none flex items-center justify-center z-[0] overflow-hidden">
        <motion.div animate={{ scale: [1, 1.05, 1], opacity: [0.12, 0.25, 0.12] }} transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }} className="w-[60vw] max-w-[500px] aspect-square flex items-center justify-center">
          <motion.img animate={{ rotate: 360 }} transition={{ duration: 90, repeat: Infinity, ease: "linear" }} src="/comp-logo.PNG" alt="Watermark" className="w-full h-full object-contain filter drop-shadow-[0_0_60px_rgba(56,189,248,0.4)]" />
        </motion.div>
      </div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 pb-20 relative z-10 max-w-6xl mx-auto">
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mt-4">
          <div>
            <h1 className="text-3xl font-extrabold font-display tracking-tight flex items-center gap-3">
              <Database className="w-8 h-8 text-primary" />
              <span className="gradient-text-accent">DATABASE MANAGER</span>
            </h1>
            <p className="text-sm text-muted-foreground mt-1">Total Profiles Indexed: <span className="text-primary font-bold">{total}</span></p>
          </div>

          <div className="flex items-center gap-3">
            {selectedIds.size > 0 && (
              <motion.button initial={{ scale: 0 }} animate={{ scale: 1 }} onClick={handleDeleteSelected} className="btn-ghost-glow !text-destructive border-destructive/30 hover:bg-destructive/10">
                <Trash2 className="w-4 h-4" /> Delete Selected ({selectedIds.size})
              </motion.button>
            )}
            <button onClick={handleNukeDatabase} disabled={isWiping || total === 0} className="btn-primary-glow !bg-destructive/20 !text-destructive border border-destructive/50 hover:!bg-destructive/40 transition-colors">
              {isWiping ? <Loader2 className="w-4 h-4 animate-spin" /> : <AlertOctagon className="w-4 h-4" />} DELETE ALL DATA
            </button>
          </div>
        </div>

        <GlowingCard className="p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-secondary/50 border-b border-border/50 text-xs font-display tracking-wider text-muted-foreground uppercase">
                  <th className="p-4 w-12 text-center">
                    <button onClick={toggleSelectAll} className="hover:text-primary transition-colors">
                      {selectedIds.size === candidates.length && candidates.length > 0 ? <CheckSquare className="w-5 h-5 text-primary" /> : <Square className="w-5 h-5" />}
                    </button>
                  </th>
                  <th className="p-4">Candidate Name</th>
                  <th className="p-4">Location</th>
                  <th className="p-4">Experience</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={5} className="p-10 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" /></td></tr>
                ) : candidates.length === 0 ? (
                  <tr><td colSpan={5} className="p-10 text-center text-muted-foreground">Database is empty.</td></tr>
                ) : (
                  candidates.map((c) => (
                    <tr key={c.id} className="border-b border-border/20 hover:bg-white/5 transition-colors group">
                      <td className="p-4 text-center">
                        <button onClick={() => toggleSelect(c.id)} className="text-muted-foreground group-hover:text-primary transition-colors">
                          {selectedIds.has(c.id) ? <CheckSquare className="w-5 h-5 text-primary" /> : <Square className="w-5 h-5" />}
                        </button>
                      </td>
                      <td className="p-4 font-medium cursor-pointer hover:text-primary transition-colors" onClick={() => setSelectedCandidate(c)}>
                        {c.name}
                        <div className="text-xs text-muted-foreground font-normal">{c.email || 'No email'}</div>
                      </td>
                      <td className="p-4 text-sm text-muted-foreground">{c.location || '-'}</td>
                      <td className="p-4 text-sm text-muted-foreground">{c.experience_years} yrs</td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => setSelectedCandidate(c)} className="p-2 bg-secondary rounded-lg hover:bg-primary/20 hover:text-primary transition-colors tooltip-trigger">
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

      </motion.div>

      <CandidateModal
        candidate={selectedCandidate}
        onClose={() => setSelectedCandidate(null)}
        onDelete={async (id) => {
          await api.deleteBatchResumes([id]);
          setSelectedCandidate(null);
          fetchDatabase(page);
        }} 
      />
    </>
  );
}