import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Download, MapPin, Briefcase, GraduationCap, Award, Link as LinkIcon,
  FileText, User, Mail, Phone, ExternalLink, Shield, FileImage, Eye,
  AlertTriangle, TrendingUp, Github, Linkedin, Code2, Terminal
} from 'lucide-react';
import ATSScoreRing from './ATSScoreRing';
import { api } from '@/lib/api';

export default function CandidateModal({ candidate, onClose }) {
  const [tab, setTab] = useState('profile');
  const [previewText, setPreviewText] = useState('');
  const [loadingPreview, setLoadingPreview] = useState(false);

  // --- NEW ESCAPE KEY LISTENER ---
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && candidate) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [candidate, onClose]);

  useEffect(() => {
    if (candidate && tab === 'preview' && !previewText) {
      setLoadingPreview(true);
      api.previewResume(candidate.id)
        .then(data => setPreviewText(data.raw_text))
        .catch(() => setPreviewText('Preview unavailable'))
        .finally(() => setLoadingPreview(false));
    }
  }, [candidate, tab, previewText]);

  useEffect(() => {
    setPreviewText('');
    setTab('profile');
  }, [candidate?.id]);

  if (!candidate) return null;

  const certs = candidate.certificates || [];
  const links = candidate.hyperlinks || [];
  const isFraud = candidate.fraud_flag === 1;
  
  const rawExp = candidate.experience_years || 0;
  const relExp = candidate.relevant_experience_years ?? rawExp;
  const gaps = candidate.total_gap_years || 0;

  const getLinkIcon = (url) => {
    if (url.includes('linkedin.com')) return <Linkedin className="w-4 h-4" />;
    if (url.includes('github.com')) return <Github className="w-4 h-4" />;
    if (url.includes('leetcode.com')) return <Code2 className="w-4 h-4 text-warning" />;
    if (url.includes('hackerrank.com')) return <Terminal className="w-4 h-4 text-success" />;
    return <ExternalLink className="w-4 h-4" />;
  };

  return (
    <AnimatePresence>
      {candidate && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[999] bg-background/60 backdrop-blur-md" onClick={onClose} />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className={`fixed inset-4 md:inset-x-[12%] md:inset-y-[4%] z-[999] glass-panel overflow-auto ${isFraud || candidate.fake_full_stack ? 'border-destructive/30' : ''}`}
            style={{ boxShadow: isFraud || candidate.fake_full_stack ? '0 0 60px hsl(var(--destructive) / 0.15)' : '0 0 60px hsl(var(--neon-blue) / 0.08)' }}
          >
            <div className="sticky top-0 z-50 bg-card/90 backdrop-blur-2xl border-b border-border p-5 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center text-primary-foreground font-bold font-display text-lg"
                  style={{ background: isFraud ? 'hsl(var(--destructive))' : 'linear-gradient(135deg, hsl(var(--neon-blue)), hsl(var(--neon-cyan)))' }}>
                  {(candidate.name || '?')[0].toUpperCase()}
                </div>
                <div>
                  <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                    {candidate.name}
                    {isFraud && <AlertTriangle className="w-4 h-4 text-destructive" />}
                  </h2>
                  <p className="text-[10px] text-muted-foreground font-mono">{candidate.filename}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <a href={api.downloadResume(candidate.filename)} target="_blank" rel="noopener noreferrer"
                  className="btn-primary-glow !px-4 !py-2 !text-xs">
                  <Download className="w-3.5 h-3.5" /> Download
                </a>
                <button onClick={onClose} className="p-2 rounded-lg hover:bg-secondary text-muted-foreground transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="flex flex-col w-full">
                {isFraud && (
                <div className="bg-destructive/10 border-b border-destructive/20 p-3 px-6 flex items-center gap-3">
                    <AlertTriangle className="w-4 h-4 text-destructive shrink-0" />
                    <div>
                        <h4 className="text-xs font-bold text-destructive">Fraud Detected: {candidate.fraud_reason}</h4>
                    </div>
                </div>
                )}
                {candidate.fake_full_stack && (
                <div className="bg-destructive/10 border-b border-destructive/20 p-3 px-6 flex items-center gap-3">
                    <AlertTriangle className="w-4 h-4 text-destructive shrink-0" />
                    <div>
                        <h4 className="text-xs font-bold text-destructive">Fake Full-Stack Flag: Claims to be Full Stack but zero Backend/DB skills were found.</h4>
                    </div>
                </div>
                )}
                {candidate.job_hopper && (
                <div className="bg-warning/10 border-b border-warning/20 p-3 px-6 flex items-center gap-3">
                    <AlertTriangle className="w-4 h-4 text-warning shrink-0" />
                    <div>
                        <h4 className="text-xs font-bold text-warning">Trajectory Warning: High job turnover detected (4+ roles in under 4 years).</h4>
                    </div>
                </div>
                )}
                {gaps > 0 ? (
                <div className="bg-muted border-b border-border p-3 px-6 flex items-center gap-3">
                    <Briefcase className="w-4 h-4 text-muted-foreground shrink-0" />
                    <div>
                        <h4 className="text-xs font-bold text-muted-foreground">Trajectory Note: {gaps} Years of inactive job gaps detected and deducted from total experience.</h4>
                    </div>
                </div>
                ) : candidate.has_gap && (
                <div className="bg-muted border-b border-border p-3 px-6 flex items-center gap-3">
                    <Briefcase className="w-4 h-4 text-muted-foreground shrink-0" />
                    <div>
                        <h4 className="text-xs font-bold text-muted-foreground">Trajectory Note: Substantial gap in employment timeline detected.</h4>
                    </div>
                </div>
                )}
                {candidate.open_source && (
                <div className="bg-warning/10 border-b border-warning/20 p-3 px-6 flex items-center gap-3">
                    <Github className="w-4 h-4 text-warning shrink-0" />
                    <div>
                        <h4 className="text-xs font-bold text-warning">Gold Star: Active Open-Source Contributor (ATS Score Boosted +8pts)</h4>
                    </div>
                </div>
                )}
            </div>

            <div className="sticky top-[73px] z-40 bg-card/80 backdrop-blur-xl border-b border-border px-6 flex gap-1">
              {(['profile', 'preview']).map(t => (
                <button key={t} onClick={() => setTab(t)}
                  className={`px-4 py-2.5 text-xs font-display tracking-wider uppercase transition-colors relative ${
                    tab === t ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
                  }`}>
                  {t === 'profile' ? <User className="w-3.5 h-3.5 inline mr-1.5" /> : <Eye className="w-3.5 h-3.5 inline mr-1.5" />}
                  {t}
                  {tab === t && <motion.div layoutId="tab-indicator" className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />}
                </button>
              ))}
            </div>

            <div className="p-6 space-y-6">
              {tab === 'profile' && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
                    <div className="flex flex-col items-center gap-3 p-4 rounded-2xl bg-secondary/20">
                      <ATSScoreRing score={candidate.score} size={110} label={isFraud || candidate.fake_full_stack ? "Penalized Score" : "Match Score"} />
                      
                      <div className="flex flex-col items-center gap-1.5 mt-2">
                        {candidate.ats_score != null && (
                          <div className="flex items-center gap-1 text-[10px] text-muted-foreground font-mono">
                            <Shield className="w-3 h-3" /> Visual Format: {Math.round(candidate.ats_score)}
                          </div>
                        )}
                        {(candidate.impact_score || 0) > 0 && (
                          <div className="flex items-center gap-1 text-[10px] text-success font-mono bg-success/10 px-2 py-0.5 rounded">
                            <TrendingUp className="w-3 h-3" /> Impact: +{candidate.impact_score}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="md:col-span-3 space-y-3">
                      <h3 className="text-[10px] font-display font-semibold text-foreground flex items-center gap-2 tracking-widest uppercase">
                        <User className="w-4 h-4 text-primary" /> CONTACT & METRICS
                      </h3>
                      <div className="grid grid-cols-2 gap-2.5">
                        {candidate.email && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground p-2.5 rounded-xl bg-secondary/20">
                            <Mail className="w-3.5 h-3.5 text-primary shrink-0" /> <span className="truncate">{candidate.email}</span>
                          </div>
                        )}
                        {candidate.phone && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground p-2.5 rounded-xl bg-secondary/20">
                            <Phone className="w-3.5 h-3.5 text-primary shrink-0" /> {candidate.phone}
                          </div>
                        )}
                        {candidate.location && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground p-2.5 rounded-xl bg-secondary/20">
                            <MapPin className="w-3.5 h-3.5 text-warning shrink-0" /> {candidate.location}
                          </div>
                        )}
                        {candidate.education && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground p-2.5 rounded-xl bg-secondary/20">
                            <GraduationCap className="w-3.5 h-3.5 text-accent shrink-0" /> {candidate.education}
                          </div>
                        )}
                        
                        {rawExp > 0 && (
                          <div className="flex flex-col justify-center text-sm text-muted-foreground p-2 rounded-xl bg-secondary/20">
                            <div className="flex items-center gap-2">
                                <Briefcase className="w-3.5 h-3.5 text-info shrink-0" /> 
                                <strong className="text-foreground">{relExp}y</strong> Relevant Experience
                            </div>
                            {gaps > 0 && (
                                <span className="text-[10px] text-warning mt-0.5 ml-5.5 font-medium">
                                    - {gaps}y gaps removed (Span: {rawExp}y)
                                </span>
                            )}
                          </div>
                        )}

                        {candidate.word_count != null && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground p-2.5 rounded-xl bg-secondary/20">
                            <FileText className="w-3.5 h-3.5 shrink-0" /> {candidate.word_count} words • {candidate.page_count} pg
                            {candidate.has_image && <FileImage className="w-3 h-3 text-warning ml-1" />}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-[10px] font-display font-semibold text-foreground mb-3 flex items-center gap-2 tracking-widest uppercase">
                      SKILLS ANALYSIS ({candidate.skills?.length || 0})
                    </h3>
                    
                    <div className="space-y-3">
                      {(candidate.matched_mandatory?.length || 0) > 0 && (
                        <div>
                          <p className="text-[10px] text-muted-foreground mb-1 uppercase tracking-wider">Mandatory Matches</p>
                          <div className="flex flex-wrap gap-1.5">
                            {candidate.matched_mandatory?.map(s => <span key={`m-${s}`} className="skill-tag border border-warning text-warning bg-warning/10">{s}</span>)}
                          </div>
                        </div>
                      )}
                      
                      {((candidate.matched_secondary?.length || 0) > 0 || (candidate.matched_skills?.length || 0) > 0) && (
                        <div>
                          <p className="text-[10px] text-muted-foreground mb-1 uppercase tracking-wider">Secondary/Semantic Matches</p>
                          <div className="flex flex-wrap gap-1.5">
                            {(candidate.matched_secondary || candidate.matched_skills || []).map(s => <span key={`s-${s}`} className="skill-tag-matched">{s}</span>)}
                          </div>
                        </div>
                      )}

                      {((candidate.missing_mandatory?.length || 0) > 0 || (candidate.missing_skills?.length || 0) > 0) && (
                        <div>
                          <p className="text-[10px] text-muted-foreground mb-1 uppercase tracking-wider">Missing Requirements</p>
                          <div className="flex flex-wrap gap-1.5">
                            {(candidate.missing_mandatory || candidate.missing_skills || []).map(s => <span key={`x-${s}`} className="skill-tag-missing">{s}</span>)}
                          </div>
                        </div>
                      )}

                      <div>
                        <p className="text-[10px] text-muted-foreground mb-1 uppercase tracking-wider">Other Extracted Skills & Ontology</p>
                        <div className="flex flex-wrap gap-1.5">
                          {(candidate.skills || [])
                            .filter(s => 
                              !(candidate.matched_mandatory || []).includes(s) && 
                              !(candidate.matched_secondary || candidate.matched_skills || []).includes(s) && 
                              !(candidate.missing_mandatory || candidate.missing_skills || []).includes(s)
                            )
                            .map(s => <span key={`o-${s}`} className="skill-tag">{s}</span>)}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {certs.length > 0 && (
                      <div>
                        <h3 className="text-[10px] font-display font-semibold text-foreground mb-3 flex items-center gap-2 tracking-widest uppercase">
                          <Award className="w-4 h-4 text-warning" /> CERTIFICATES ({certs.length})
                        </h3>
                        <div className="space-y-2">
                          {certs.map((c, i) => (
                            <motion.div key={c} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                              className="p-2.5 rounded-xl bg-secondary/20 flex items-center gap-2 text-sm">
                              <span className="text-warning">🏆</span> {c}
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    )}

                    {links.length > 0 && (
                      <div>
                        <h3 className="text-[10px] font-display font-semibold text-foreground mb-3 flex items-center gap-2 tracking-widest uppercase">
                          <LinkIcon className="w-4 h-4 text-info" /> PROFILES & LINKS ({links.length})
                        </h3>
                        <div className="space-y-2">
                          {links.map(l => (
                            <a key={l} href={l} target="_blank" rel="noopener noreferrer"
                              className="flex items-center gap-2 text-sm text-primary p-2.5 rounded-xl bg-secondary/20 hover:bg-primary/10 transition-colors truncate">
                              {getLinkIcon(l)}
                              <span className="truncate">{l}</span>
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {candidate.summary && (
                    <div>
                      <h3 className="text-[10px] font-display font-semibold text-foreground mb-2 tracking-widest uppercase">AI SUMMARY</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed p-4 rounded-xl bg-secondary/15 border border-border">{candidate.summary}</p>
                    </div>
                  )}
                </>
              )}

              {tab === 'preview' && (
                <div>
                  <h3 className="text-[10px] font-display font-semibold text-foreground mb-3 flex items-center gap-2 tracking-widest uppercase">
                    <FileText className="w-4 h-4 text-primary" /> RAW RESUME TEXT (POST-OCR / VLM)
                  </h3>
                  {loadingPreview ? (
                    <div className="flex items-center justify-center py-20">
                      <motion.div className="w-8 h-8 rounded-full border-2 border-primary/20 border-t-primary"
                        animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} />
                    </div>
                  ) : (
                    <pre className="text-xs text-muted-foreground leading-relaxed p-5 rounded-xl bg-secondary/10 whitespace-pre-wrap font-mono max-h-[60vh] overflow-auto border border-border">
                      {previewText || 'No text content available'}
                    </pre>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}