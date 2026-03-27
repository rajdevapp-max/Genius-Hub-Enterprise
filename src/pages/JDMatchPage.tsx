import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UploadCloud, Zap, Target, BookOpenText, Target as TargetIcon, Search, BrainCircuit, CheckCircle2, Info } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

// --- BATS GeniusHub REBRANDING ANIMATION VARIANTS ---
const containerVariants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.2 }
  }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 300, damping: 24 } }
};

const features = [
  { icon: Target, title: "Precision Match", desc: "Hard skills matching" },
  { icon: Zap, title: "Deep Semantics", desc: "Understanding context" },
  { icon: BrainCircuit, title: "Instant Ranking", desc: "Tiered candidates" },
];

export default function JDMatchPage() {
  const [jdText, setJdText] = useState("");
  const currentDemo = localStorage.getItem('current_demo') || 'MASTER_37K';

  // Fetch status to check database size
  const { data: status } = useQuery({
    queryKey: ['live-status'],
    queryFn: async () => {
      const response = await axios.get('https://vinu019-resume-backend.hf.space/api/live-status');
      return response.data;
    }
  });

  return (
    <>
      <Helmet>
        <title>JD Match | BATS GeniusHub | Technical Sourcing Intelligence</title>
      </Helmet>

      <motion.div initial="hidden" animate="visible" variants={containerVariants} className="space-y-8">
        {/* Header Rebranded to GeniusHub */}
        <motion.div variants={itemVariants} className="flex items-center justify-between gap-4 p-5 glass-panel relative overflow-hidden">
          <div className="absolute inset-0 bg-primary/5 blur-3xl rounded-full scale-150" />
          <div className="relative z-10">
            <h1 className="text-2xl font-extrabold font-display tracking-tight">JD Match & Extract</h1>
            <p className="text-sm text-muted-foreground mt-1 max-w-lg leading-relaxed">
              Paste Job Description — <span className="font-semibold text-primary">GeniusHub AI</span> will automatically extract strict requirements and match ranked candidates.
            </p>
          </div>
          <div className="w-16 h-16 rounded-2xl bg-secondary/80 flex items-center justify-center shrink-0 border border-border">
            <BookOpenText className="w-8 h-8 text-primary" />
          </div>
        </motion.div>

        {/* Instructions Accordion Updated with GeniusHub */}
        <motion.div variants={itemVariants}>
          <details className="glass-panel group overflow-hidden transition-all duration-300 [&_summary::-webkit-details-marker]:hidden">
            <summary className="flex items-center justify-between gap-4 p-4 cursor-pointer hover:bg-secondary/40 transition-colors">
              <div className="flex items-center gap-3">
                <Info className="w-5 h-5 text-primary" />
                <h2 className="text-sm font-semibold text-foreground">How BATS GeniusHub works (3 Simple Steps)</h2>
              </div>
              <motion.div animate={{ rotate: 0 }} className="group-open:rotate-180 transition-transform">
                <zap className="w-4 h-4 text-muted-foreground" />
              </motion.div>
            </summary>
            <div className="p-5 pt-0 border-t border-border bg-secondary/15 space-y-4">
              <p className="text-xs text-muted-foreground pt-4 leading-relaxed max-w-2xl">
                BATS GeniusHub uses hybrid semantic matching to bypass invisible text, keyword stuffing, and formatting tricks. It strictly prioritizes actual experience over simple keyword mentions.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
                <div className="flex items-center gap-3 p-3 rounded-lg border border-border bg-background">
                  <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">1</div>
                  <div className="text-left py-1">
                    <p className="text-sm font-semibold text-foreground tracking-tight">Step 1: Paste JD</p>
                    <p className="text-xs text-muted-foreground mt-0.5 max-w-sm">
                      {/* --- FIX: REPLACED AI WITH GENIUSHUB --- */}
                      Paste a job description — GeniusHub extracts requirements and strictly matches top candidates.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg border border-border bg-background">
                  <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">2</div>
                  <div className="text-left py-1">
                    <p className="text-sm font-semibold text-foreground tracking-tight">Step 2: Hit Match</p>
                    <p className="text-xs text-muted-foreground mt-0.5 max-w-sm">Wait for processing</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg border border-border bg-background">
                  <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">3</div>
                  <div className="text-left py-1">
                    <p className="text-sm font-semibold text-foreground tracking-tight">Step 3: See Top Talent</p>
                    <p className="text-xs text-muted-foreground mt-0.5 max-w-sm">Ranked by actual hard skills match</p>
                  </div>
                </div>
              </div>
            </div>
          </details>
        </motion.div>

        {/* Main Interface */}
        <motion.div variants={itemVariants} className="flex flex-col lg:flex-row gap-6">
          
          {/* Left: Input */}
          <div className="flex-1 min-w-[320px] lg:flex-none lg:w-[480px]">
            <div className="glass-panel p-6 h-full flex flex-col justify-center items-center text-center space-y-5 relative overflow-hidden">
              
              {/* --- FIX: REPLACED BLUE CONCENTRIC LOGO WITH COMPANY LOGO --- */}
              <div className="relative">
                <div className="absolute inset-0 scale-150 blur-3xl rounded-full bg-primary/20" />
                <div className="w-24 h-24 rounded-3xl bg-secondary border border-border flex items-center justify-center relative shadow-inner overflow-hidden">
                  <img src="/comp-logo.png" alt="Company Logo" className="w-16 h-16 object-contain" />
                </div>
              </div>
              
              <p className="text-xs text-muted-foreground max-w-xs leading-relaxed">
                Paste your technical Job Description below. Our hybrid intelligence parses strict requirements and matches candidates from your current pool.
              </p>
              
              <div className="flex gap-2 text-xs font-mono text-muted-foreground">
                <div className="glass-panel px-3 py-1 flex items-center gap-1.5">
                  <div className={`w-1.5 h-1.5 rounded-full ${status ? 'bg-success' : 'bg-destructive'}`} />
                  <span>SYNC</span>
                </div>
                <div className="glass-panel px-3 py-1 flex items-center gap-1.5">
                  <Target className="w-3 h-3" />
                  <span>STRICT</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Textarea */}
          <div className="flex-1 lg:max-w-[calc(100%-480px-24px)]">
            <div className="glass-panel p-2 flex flex-col h-[400px]">
              <div className="flex items-center justify-between p-3 border-b border-border">
                <div className="flex items-center gap-3">
                  <BookOpenText className="w-5 h-5 text-primary" />
                  <span className="text-sm font-semibold tracking-tight">Raw Job Description</span>
                </div>
                <span className="text-[10px] font-mono text-muted-foreground uppercase px-2 py-0.5 rounded-md bg-secondary">UTF-8 / Plain Text</span>
              </div>
              
              <textarea
                value={jdText}
                onChange={(e) => setJdText(e.target.value)}
                placeholder="Paste Job Description here... GeniusHub will extract requirements, bypass invisible text, keyword stuffing, and find actual top candidates."
                className="flex-1 p-5 bg-transparent text-sm resize-none focus:outline-none leading-relaxed placeholder:text-muted-foreground/50 font-mono"
              />

              <div className="p-3 border-t border-border bg-secondary/20 flex items-center justify-between gap-4 mt-auto rounded-b-xl">
                <span className="text-xs text-muted-foreground">
                  <span className="font-semibold text-foreground">{jdText.length}</span> characters pasted
                </span>
                <button 
                  className="button-gradient px-8 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2.5 disabled:opacity-50 disabled:cursor-not-allowed group transition-all"
                  disabled={!jdText.trim() || !status}
                >
                  <TargetIcon className="w-4 h-4 group-hover:scale-110 transition-transform" />
                  Parse & Match Best Candidates
                </button>
              </div>
            </div>
          </div>
        </motion.div>
        
        {/* Results Info Panel */}
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

      </motion.div>
    </>
  );
}