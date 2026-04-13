import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Search, FileText, BarChart3, Upload, Menu, X, LogOut, Database } from 'lucide-react'; // 🎯 Added Database icon
import { motion, AnimatePresence } from 'framer-motion';
import { ThemeToggle, useTheme } from '@/components/ThemeToggle';

// 🎯 THE FIX: Added the Database tab right here!
const navItems = [
  { path: '/', label: 'GeniusHub Search', icon: Search, desc: 'Hybrid intelligence' },
  { path: '/jd-match', label: 'JD Match', icon: FileText, desc: 'Job description match' },
  { path: '/analytics', label: 'Analytics', icon: BarChart3, desc: 'Real-time dashboard' },
  { path: '/database', label: 'Database', icon: Database, desc: 'Master candidate list' }, 
  { path: '/upload', label: 'Upload', icon: Upload, desc: 'Add resumes' },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const { theme, toggle } = useTheme();

  // 🔐 Check if we are on the demo site using the secret key
  const isDemoSite = window.location.search.includes("demo=demo-BATS");

  // 🚨 TAB CLOSE TRACKER 🚨
  useEffect(() => {
    // If it's your original model, don't even run the tracker!
    if (!isDemoSite) return;

    const handleTabClose = () => {
      const isAuth = sessionStorage.getItem('bats_demo_auth');
      if (isAuth === 'true') {
        api.deleteAllResumes().catch(console.error);
      }
    };

    window.addEventListener('unload', handleTabClose);
    return () => window.removeEventListener('unload', handleTabClose);
  }, [isDemoSite]);

  const handleLogout = async () => {
    if (window.confirm("Are you sure you want to logout? All demo data will be permanently wiped.")) {
      try {
        await api.deleteAllResumes();
      } catch (e) {
        console.error("Wipe failed during logout", e);
      }
      sessionStorage.removeItem('bats_demo_auth');
      sessionStorage.removeItem('bats_login_time');
      sessionStorage.removeItem('bats_login_id');
      navigate(`/login${window.location.search}`);
    }
  };

  return (
    <div className="min-h-screen bg-background flex relative overflow-hidden">
      
      {/* Mobile Menu Toggle */}
      <button 
        onClick={() => setCollapsed(!collapsed)}
        className="lg:hidden fixed top-4 right-4 z-50 p-2 rounded-xl bg-card border border-border text-foreground shadow-lg"
      >
        {collapsed ? <Menu className="w-5 h-5" /> : <X className="w-5 h-5" />}
      </button>

      {/* Sidebar */}
      <motion.aside 
        initial={false}
        animate={{ 
          width: collapsed ? 80 : 280,
          x: typeof window !== 'undefined' && window.innerWidth < 1024 && collapsed ? -280 : 0
        }}
        className="fixed top-0 left-0 h-screen z-40 flex flex-col bg-sidebar/80 backdrop-blur-xl border-r border-sidebar-border shadow-2xl"
      >
        {/* Logo Area */}
        <div className="h-20 flex items-center px-6 border-b border-sidebar-border relative overflow-hidden group cursor-pointer" onClick={() => setCollapsed(!collapsed)}>
          <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <motion.div 
            animate={{ rotate: collapsed ? 360 : 0 }} 
            transition={{ duration: 0.5 }}
            className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center shrink-0 border border-primary/30 shadow-[0_0_15px_rgba(var(--primary-rgb),0.3)]"
          >
            <img src="/comp-logo.PNG" alt="GeniusHub Logo" className="w-6 h-6 object-contain drop-shadow-md" />
          </motion.div>
          
          <AnimatePresence mode="wait">
            {!collapsed && (
              <motion.div 
                initial={{ opacity: 0, x: -10 }} 
                animate={{ opacity: 1, x: 0 }} 
                exit={{ opacity: 0, x: -10 }}
                className="ml-4 whitespace-nowrap"
              >
                <h1 className="text-xl font-black font-display tracking-tight text-foreground">
                  Genius<span className="text-primary">Hub</span>
                </h1>
                <p className="text-[10px] text-muted-foreground font-mono uppercase tracking-widest mt-0.5">AI Engine v4.0</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-3 py-6 space-y-2 overflow-y-auto hidden-scrollbar">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            
            return (
              <Link key={item.path} to={item.path + window.location.search}>
                <motion.div
                  whileHover={{ scale: 1.02, x: 4 }}
                  whileTap={{ scale: 0.98 }}
                  className={`
                    relative flex items-center px-3 py-3.5 rounded-xl cursor-pointer transition-all duration-300 group overflow-hidden
                    ${isActive 
                      ? 'bg-primary/10 shadow-[inset_0_0_20px_rgba(var(--primary-rgb),0.1)] border border-primary/20' 
                      : 'hover:bg-sidebar-accent/50 border border-transparent'
                    }
                  `}
                >
                  {isActive && (
                    <motion.div layoutId="activeNav" className="absolute left-0 top-1/4 bottom-1/4 w-1 bg-primary rounded-r-full shadow-[0_0_10px_rgba(var(--primary-rgb),0.8)]" />
                  )}
                  
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors duration-300 ${isActive ? 'bg-primary/20 text-primary shadow-[0_0_10px_rgba(var(--primary-rgb),0.2)]' : 'text-muted-foreground group-hover:text-foreground group-hover:bg-sidebar-accent'}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  
                  <AnimatePresence>
                    {!collapsed && (
                      <motion.div 
                        initial={{ opacity: 0, width: 0 }}
                        animate={{ opacity: 1, width: 'auto' }}
                        exit={{ opacity: 0, width: 0 }}
                        className="ml-4 whitespace-nowrap overflow-hidden"
                      >
                        <span className={`block text-sm font-bold ${isActive ? 'text-foreground' : 'text-muted-foreground group-hover:text-foreground'}`}>
                          {item.label}
                        </span>
                        <span className="block text-[10px] text-muted-foreground/70 mt-0.5 font-medium">
                          {item.desc}
                        </span>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-3 border-t border-sidebar-border space-y-2">
          <div className={`flex items-center ${collapsed ? 'justify-center flex-col gap-2' : 'justify-between px-2'}`}>
            <ThemeToggle theme={theme} toggle={toggle} />
            
            {/* Only render the Logout button if it is the Demo Site! */}
            {isDemoSite && (
              <button 
                onClick={handleLogout} 
                className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors flex items-center gap-2"
                title="Secure Logout"
              >
                <LogOut className="w-4 h-4" />
                {!collapsed && <span className="text-xs font-bold uppercase tracking-wider">Logout</span>}
              </button>
            )}

          </div>
          {!collapsed && (
            <div className="glass-panel p-2.5 flex items-center gap-2 mt-2">
              <div className="w-1.5 h-1.5 rounded-full bg-success pulse-dot" />
              <span className="text-[9px] text-muted-foreground font-mono">SYSTEM ONLINE • AUTO-SYNC</span>
            </div>
          )}
        </div>
      </motion.aside>

      <main className="flex-1 transition-all duration-300 relative" style={{ marginLeft: collapsed && typeof window !== 'undefined' && window.innerWidth >= 1024 ? 80 : (typeof window !== 'undefined' && window.innerWidth < 1024 ? 0 : 280) }}>
        <div className="p-6 lg:p-10 max-w-7xl mx-auto w-full pt-20 lg:pt-10">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="h-full"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}