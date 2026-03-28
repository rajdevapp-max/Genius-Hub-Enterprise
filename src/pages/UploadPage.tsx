import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, FileUp, CheckCircle, XCircle, Loader2, File, CloudUpload, Sparkles } from 'lucide-react';
import GlowingCard from '@/components/GlowingCard';
import { api } from '@/lib/api';

export default function UploadPage() {
  const [dragging, setDragging] = useState(false);
  const [uploads, setUploads] = useState<
    { file: File; status: 'pending' | 'uploading' | 'done' | 'error'; message?: string }[]
  >([]);

  const handleFiles = useCallback((files: FileList) => {
    const newUploads = Array.from(files).map((file) => ({
      file,
      status: 'pending' as const,
    }));
    setUploads((prev) => [...prev, ...newUploads]);

    newUploads.forEach(async (upload, idx) => {
      const index = uploads.length + idx;
      setUploads((prev) =>
        prev.map((u, i) => (i === index ? { ...u, status: 'uploading' } : u))
      );
      try {
        const res = await api.uploadResume(upload.file);
        setUploads((prev) =>
          prev.map((u, i) =>
            i === index ? { ...u, status: 'done', message: res.message } : u
          )
        );
      } catch (e: any) {
        setUploads((prev) =>
          prev.map((u, i) =>
            i === index ? { ...u, status: 'error', message: e.message } : u
          )
        );
      }
    });
  }, [uploads.length]);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      if (e.dataTransfer.files.length) handleFiles(e.dataTransfer.files);
    },
    [handleFiles]
  );

  const doneCount = uploads.filter(u => u.status === 'done').length;
  const errorCount = uploads.filter(u => u.status === 'error').length;

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

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8 relative z-10">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center py-3">
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
            className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3 relative"
            style={{ background: 'linear-gradient(135deg, hsl(var(--neon-blue)), hsl(var(--neon-purple)))' }}
          >
            <CloudUpload className="w-6 h-6 text-primary-foreground" />
          </motion.div>
          <h1 className="text-2xl font-extrabold font-display mb-1 tracking-wider">
            <span className="gradient-text">UPLOAD</span>
          </h1>
          <p className="text-xs text-muted-foreground font-mono tracking-wide">PDF • DOCX • PNG • JPG</p>
        </motion.div>

        {/* Drop Zone */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          whileHover={{ scale: 1.01 }}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          className={`glass-panel p-14 text-center cursor-pointer transition-all duration-500 relative overflow-hidden ${
            dragging ? 'neon-border' : ''
          }`}
          onClick={() => {
            const input = document.createElement('input');
            input.type = 'file';
            input.multiple = true;
            input.accept = '.pdf,.docx,.doc,.png,.jpg,.jpeg';
            input.onchange = (e) => {
              const files = (e.target as HTMLInputElement).files;
              if (files) handleFiles(files);
            };
            input.click();
          }}
        >
          <motion.div
            animate={dragging ? { y: [0, -10, 0], scale: 1.1 } : { y: 0, scale: 1 }}
            transition={{ duration: 0.5, repeat: dragging ? Infinity : 0 }}
          >
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-5 relative">
              <FileUp className="w-8 h-8 text-primary" />
              <motion.div
                className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-accent/20 flex items-center justify-center"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Sparkles className="w-2.5 h-2.5 text-accent" />
              </motion.div>
            </div>
            <h3 className="text-base font-bold text-foreground mb-1">
              {dragging ? 'Drop files here!' : 'Drag & drop resumes'}
            </h3>
            <p className="text-xs text-muted-foreground mb-3">or click to browse</p>
            <div className="flex justify-center gap-2">
              {['PDF', 'DOCX', 'PNG', 'JPG'].map((fmt) => (
                <span key={fmt} className="text-[9px] px-2 py-0.5 rounded-md bg-secondary text-muted-foreground font-mono tracking-wider">
                  .{fmt.toLowerCase()}
                </span>
              ))}
            </div>
          </motion.div>
        </motion.div>

        {/* Upload Stats */}
        {uploads.length > 0 && (
          <div className="grid grid-cols-3 gap-3 max-w-sm mx-auto">
            <GlowingCard className="p-3 text-center">
              <div className="text-lg font-bold font-display text-foreground">{uploads.length}</div>
              <p className="text-[9px] text-muted-foreground font-display tracking-wider uppercase">Total</p>
            </GlowingCard>
            <GlowingCard className="p-3 text-center">
              <div className="text-lg font-bold font-display text-success">{doneCount}</div>
              <p className="text-[9px] text-muted-foreground font-display tracking-wider uppercase">Done</p>
            </GlowingCard>
            <GlowingCard className="p-3 text-center">
              <div className="text-lg font-bold font-display text-destructive">{errorCount}</div>
              <p className="text-[9px] text-muted-foreground font-display tracking-wider uppercase">Failed</p>
            </GlowingCard>
          </div>
        )}

        {/* Upload List */}
        <AnimatePresence>
          {uploads.length > 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2 max-w-2xl mx-auto">
              <h3 className="text-[10px] font-display font-semibold text-foreground tracking-widest uppercase">UPLOAD QUEUE</h3>
              {uploads.map((u, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="glass-panel p-3 flex items-center gap-3"
                >
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                    u.status === 'done' ? 'bg-success/10' : u.status === 'error' ? 'bg-destructive/10' : 'bg-primary/10'
                  }`}>
                    <File className={`w-3.5 h-3.5 ${
                      u.status === 'done' ? 'text-success' : u.status === 'error' ? 'text-destructive' : 'text-primary'
                    }`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-xs text-foreground truncate block">{u.file.name}</span>
                    {u.message && <span className="text-[10px] text-muted-foreground">{u.message}</span>}
                  </div>
                  <span className="text-[10px] text-muted-foreground font-mono shrink-0">
                    {(u.file.size / 1024).toFixed(0)}KB
                  </span>
                  {u.status === 'uploading' && <Loader2 className="w-3.5 h-3.5 text-primary animate-spin" />}
                  {u.status === 'done' && <CheckCircle className="w-3.5 h-3.5 text-success" />}
                  {u.status === 'error' && <XCircle className="w-3.5 h-3.5 text-destructive" />}
                  {u.status === 'pending' && <Upload className="w-3.5 h-3.5 text-muted-foreground" />}
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </>
  );
}