import { motion } from 'framer-motion';
import {
  MapPin, Briefcase, GraduationCap, Download, Award,
  Link as LinkIcon, Bookmark, BookmarkCheck, Trophy, Eye, AlertTriangle, TrendingUp, Search, UserMinus, Github, Trash2
} from 'lucide-react';
import ATSScoreRing from './ATSScoreRing';
import { api } from '@/lib/api';

const escapeRegExp = (string: string) => {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

// 🎯 NEW: Added `onDelete` to the props!
export default function CandidateCard({ candidate, rank, bookmarked, blindMode = false, onBookmark, onViewDetail, onDelete }: any) {
  const certs = candidate.certificates || [];
  const links = candidate.hyperlinks || [];
  const isNameMatch = candidate.match_type === 'name';
  const isFraud = candidate.fraud_flag === 1;

  const rawExp = candidate.experience_years || 0;
  const relExp = candidate.relevant_experience_years ?? rawExp;
  const gaps = candidate.total_gap_years || 0;

  const getRankStyle = () => {
    if (rank === 1) return 'rank-gold';
    if (rank === 2) return 'rank-silver';
    if (rank === 3) return 'rank-bronze';
    return 'bg-secondary text-muted-foreground';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: rank * 0.03 }}
      className={`glass-panel-hover p-4 group cursor-pointer ${isFraud || candidate.fake_full_stack ? 'border-destructive/30 bg-destructive/5' : ''}`}
      onClick={onViewDetail}
    >
      <div className="flex items-start gap-3.5">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-xs font-bold font-display ${getRankStyle()}`}>
          {rank <= 3 ? <Trophy className="w-3.5 h-3.5" /> : `#${rank}`}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2.5 mb-1.5 flex-wrap">
            <h3 className={`text-sm font-semibold truncate ${isFraud ? 'text-destructive' : 'text-foreground'}`}>
              {blindMode ? `Candidate ID: #${candidate.id}` : (candidate.name || 'Unknown')}
            </h3>
            
            {blindMode && (
              <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-primary/10 text-primary font-display font-bold tracking-wider flex items-center gap-1">
                <UserMinus className="w-3 h-3" /> BLIND MODE
              </span>
            )}

            {candidate.open_source && (
              <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-warning/20 text-warning font-display font-bold tracking-wider flex items-center gap-1 border border-warning/30 shadow-[0_0_10px_rgba(var(--warning-rgb),0.2)]">
                <Github className="w-3 h-3" /> OPEN SOURCE
              </span>
            )}

            {candidate.fake_full_stack && (
              <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-destructive/10 text-destructive font-display font-bold tracking-wider flex items-center gap-1 border border-destructive/20">
                <AlertTriangle className="w-3 h-3" /> FAKE FULL-STACK
              </span>
            )}

            {isFraud && (
              <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-destructive/10 text-destructive font-display font-bold tracking-wider flex items-center gap-1 border border-destructive/20">
                <AlertTriangle className="w-3 h-3" /> FRAUD DETECTED
              </span>
            )}
            
            {candidate.impact_score !== undefined && candidate.impact_score > 0 ? (
              <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-success/10 text-success font-display font-medium tracking-wider flex items-center gap-1">
                <TrendingUp className="w-3 h-3" /> HIGH IMPACT (+{candidate.impact_score} pts)
              </span>
            ) : null}

            {candidate.job_hopper && (
              <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-warning/10 text-warning font-display font-bold tracking-wider flex items-center gap-1 border border-warning/20">
                <AlertTriangle className="w-3 h-3" /> JOB HOPPER
              </span>
            )}
            
            {gaps > 0 ? (
              <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-muted text-muted-foreground font-display font-medium tracking-wider flex items-center gap-1 border border-border">
                {gaps}y CAREER GAP
              </span>
            ) : candidate.has_gap && (
              <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-muted text-muted-foreground font-display font-medium tracking-wider flex items-center gap-1 border border-border">
                CAREER GAP
              </span>
            )}

            {!blindMode && isNameMatch && (
              <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-primary/10 text-primary font-display font-medium tracking-wider">
                NAME MATCH
              </span>
            )}
            
            <div className="ml-auto shrink-0">
              <ATSScoreRing score={candidate.score} size={40} />
            </div>
          </div>

          <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-muted-foreground mb-2.5">
            {candidate.email && (
              <span className={`truncate max-w-[180px] ${blindMode ? 'blur-sm select-none' : ''}`}>
                {blindMode ? 'hidden@email.com' : candidate.email}
              </span>
            )}
            {candidate.location && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {candidate.location}</span>}
            
            {rawExp > 0 && (
              <span className="flex items-center gap-1">
                <Briefcase className="w-3 h-3" /> 
                {relExp < rawExp ? (
                   <span title={`Total Span: ${rawExp}y | Inactive Gaps: ${gaps}y`}>
                     <strong className="text-foreground">{relExp}y</strong> relevant <span className="text-[9px] opacity-70">({rawExp}y total span)</span>
                   </span>
                ) : (
                   <span>{rawExp}y</span>
                )}
              </span>
            )}

            {candidate.education && <span className="flex items-center gap-1"><GraduationCap className="w-3 h-3" /> {candidate.education}</span>}
            {certs.length > 0 && <span className="flex items-center gap-1 text-warning"><Award className="w-3 h-3" /> {certs.length}</span>}
            
            {!blindMode && links.length > 0 && (
              <span className="flex items-center gap-1 text-info"><LinkIcon className="w-3 h-3" /> {links.length}</span>
            )}
          </div>

          <div className="flex flex-wrap gap-1 mb-1.5">
            {(candidate.matched_mandatory || []).map((s: string) => <span key={`m-${s}`} className="skill-tag border border-warning text-warning bg-warning/10">{s}</span>)}
            {(candidate.matched_secondary || candidate.matched_skills || []).slice(0, 5).map((s: string) => <span key={`s-${s}`} className="skill-tag-matched">{s}</span>)}
            {(candidate.missing_mandatory || candidate.missing_skills || []).slice(0, 3).map((s: string) => <span key={`x-${s}`} className="skill-tag-missing">{s}</span>)}
            {(candidate.skills || [])
              .filter((s: string) => 
                !(candidate.matched_mandatory || []).includes(s) && 
                !(candidate.matched_secondary || candidate.matched_skills || []).includes(s) && 
                !(candidate.missing_mandatory || candidate.missing_skills || []).includes(s)
              )
              .slice(0, 4).map((s: string) => <span key={`o-${s}`} className="skill-tag">{s}</span>)}
          </div>

          {candidate.context_snippets && candidate.context_snippets.length > 0 && (
             <div className="mt-2 mb-1 flex flex-col gap-1">
               {candidate.context_snippets.slice(0, 2).map((snippet: any, idx: number) => {
                 const safeSkill = escapeRegExp(snippet.skill);
                 return (
                 <div key={idx} className="flex items-start gap-2 text-[10px] text-muted-foreground bg-secondary/30 p-1.5 rounded-md border border-border/50">
                    <Search className="w-3 h-3 shrink-0 mt-0.5 text-primary" />
                    <span className="italic">
                      "{snippet.context.split(new RegExp(`(${safeSkill})`, 'gi')).map((part: string, i: number) => 
                        part.toLowerCase() === snippet.skill.toLowerCase() ? 
                        <strong key={i} className="text-foreground font-bold">{part}</strong> : part
                      )}"
                    </span>
                 </div>
               )})}
             </div>
          )}

          <p className="text-[9px] text-muted-foreground/40 font-mono truncate">
            {blindMode ? `document_id_${candidate.id}.pdf` : candidate.filename}
          </p>
        </div>

        <div className="flex flex-col gap-1 shrink-0" onClick={e => e.stopPropagation()}>
          {onBookmark && (
            <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={onBookmark}
              className={`p-1.5 rounded-lg transition-colors ${bookmarked ? 'bg-warning/10 text-warning' : 'text-muted-foreground hover:bg-secondary hover:text-foreground'}`}>
              {bookmarked ? <BookmarkCheck className="w-3.5 h-3.5" /> : <Bookmark className="w-3.5 h-3.5" />}
            </motion.button>
          )}
          
          {/* 🎯 NEW: DELETE PROFILE BUTTON (Placed right where you asked!) */}
          {onDelete && !blindMode && (
             <motion.button 
              whileHover={{ scale: 1.1 }} 
              whileTap={{ scale: 0.9 }} 
              onClick={(e) => { e.stopPropagation(); onDelete(candidate.id, candidate.name); }}
              className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors" 
              title="Permanently Delete Profile">
              <Trash2 className="w-3.5 h-3.5" />
            </motion.button>
          )}

          {!blindMode && (
            <a href={api.downloadResume(candidate.filename)} target="_blank" rel="noopener noreferrer"
              className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-primary transition-colors">
              <Download className="w-3.5 h-3.5" />
            </a>
          )}
          {onViewDetail && (
            <button onClick={onViewDetail}
              className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-primary transition-colors opacity-0 group-hover:opacity-100">
              <Eye className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}