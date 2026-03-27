import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Search, FileText, BarChart3, Upload, Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ThemeToggle, useTheme } from '@/components/ThemeToggle';

const navItems = [
  { path: '/', label: 'AI Search', icon: Search, desc: 'Hybrid intelligence' },
  { path: '/jd-match', label: 'JD Match', icon: FileText, desc: 'Job description match' },
  { path: '/analytics', label: 'Analytics', icon: BarChart3, desc: 'Real-time dashboard' },
  { path: '/upload', label: 'Upload', icon: Upload, desc: 'Add resumes' },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const { theme, toggle } = useTheme();

  return (
    <div className="flex min-h-screen bg-background">
      <motion.aside
        animate={{ width: collapsed ? 68 : 260 }}
        className="fixed left-0 top-0 bottom-0 z-40 flex flex-col border-r border-sidebar-border bg-sidebar overflow-hidden"
        style={{ boxShadow: '4px 0 30px hsl(var(--background) / 0.5)' }}
      >
        {/* Logo Section Rebranded to BATS */}
        <div className="flex items-center gap-3 px-4 h-16 border-b border-sidebar-border shrink-0">
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="w-9 h-9 flex items-center justify-center shrink-0 overflow-hidden rounded-md bg-white"
          >
            <img src="/bats-logo.jpg" alt="BATS Logo" className="w-full h-full object-contain" />
          </motion.div>
          <AnimatePresence>
            {!collapsed && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="overflow-hidden whitespace-nowrap">
                <h1 className="text-xs font-bold font-display tracking-wider text-foreground">BATS GeniusHub</h1>
                <p className="text-[9px] text-muted-foreground tracking-wide">INTELLIGENCE v6.0</p>
              </motion.div>
            )}
          </AnimatePresence>
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="ml-auto p-1.5 rounded-lg hover:bg-secondary text-muted-foreground shrink-0 transition-colors"
          >
            {collapsed ? <Menu className="w-4 h-4" /> : <X className="w-4 h-4" />}
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 px-2.5 space-y-1">
          {navItems.map(({ path, label, icon: Icon, desc }) => {
            const active = location.pathname === path;
            return (
              <Link
                key={path}
                to={path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 relative group ${
                  active
                    ? 'text-primary'
                    : 'text-muted-foreground hover:text-foreground hover:bg-secondary/60'
                }`}
              >
                {active && (
                  <motion.div
                    layoutId="activeNav"
                    className="absolute inset-0 rounded-xl bg-primary/8 border border-primary/15"
                    style={{ boxShadow: '0 0 20px hsl(var(--primary) / 0.06)' }}
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-all relative z-10 ${
                  active ? 'bg-primary/15' : 'bg-secondary/40 group-hover:bg-secondary'
                }`}>
                  <Icon className="w-4 h-4" />
                </div>
                <AnimatePresence>
                  {!collapsed && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="min-w-0 relative z-10">
                      <span className="block text-sm font-medium">{label}</span>
                      <span className="block text-[9px] text-muted-foreground">{desc}</span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-3 border-t border-sidebar-border space-y-2">
          <div className="flex items-center justify-center">
            <ThemeToggle theme={theme} toggle={toggle} />
          </div>
          {!collapsed && (
            <div className="glass-panel p-2.5 flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-success pulse-dot" />
              <span className="text-[9px] text-muted-foreground font-mono">SYSTEM ONLINE • AUTO-SYNC</span>
            </div>
          )}
        </div>
      </motion.aside>

      <main className="flex-1 transition-all duration-300 relative" style={{ marginLeft: collapsed ? 68 : 260 }}>
        <div className="p-6 lg:p-8 max-w-7xl mx-auto">{children}</div>
      </main>
    </div>
  );
}