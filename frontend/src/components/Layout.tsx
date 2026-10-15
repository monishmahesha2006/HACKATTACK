import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../api/client';
import Aurora from './Aurora';

const navItems = [
  { path: '/missions', label: 'Mission Control', icon: 'rocket_launch' },
  { path: '/compare', label: 'Comparison Arena', icon: 'compare_arrows' },
  { path: '/report', label: 'Proof Receipt', icon: 'description' },
  { path: '/audit', label: 'Audit Ledger', icon: 'verified_user' },
  { path: '/intelligence', label: 'Intelligence Lab', icon: 'psychology' },
  { path: '/mcp', label: 'MCP Ecosystem', icon: 'hub' },
  { path: '/chaos', label: 'Chaos Arena', icon: 'bolt' },
  { path: '/gaps', label: 'Reality Gap Monitor', icon: 'radar' },
];

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [cmdOpen, setCmdOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [reducedMotion, setReducedMotion] = useState(() => {
    return localStorage.getItem('rx_reduced_motion') === 'true' || 
           window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });

  const { data: health } = useQuery({
    queryKey: ['health'],
    queryFn: api.getHealth,
    refetchInterval: 10000,
  });

  const { data: ready } = useQuery({
    queryKey: ['ready'],
    queryFn: api.getReady,
    refetchInterval: 15000,
  });

  // Global keydown for Cmd/Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCmdOpen(prev => !prev);
      } else if (e.key === 'Escape') {
        setCmdOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const toggleReducedMotion = () => {
    const next = !reducedMotion;
    setReducedMotion(next);
    localStorage.setItem('rx_reduced_motion', String(next));
    if (next) {
      document.documentElement.classList.add('reduce-motion');
    } else {
      document.documentElement.classList.remove('reduce-motion');
    }
  };

  const handleReset = async () => {
    if (!confirm('Reset local demo mission state? Real immutable ledger will start a new cycle.')) return;
    setResetting(true);
    try {
      await api.resetDemo();
      navigate('/missions');
      window.location.reload();
    } finally {
      setResetting(false);
    }
  };

  const isOnline = health?.status === 'ok' || health?.status === 'OK';
  const mode = ready?.mode || 'LOCAL_DEMO';

  // Get active page title
  const currentNav = navItems.find(item => location.pathname.startsWith(item.path));
  const pageTitle = currentNav?.label || 'Mission Control';

  return (
    <div className="flex h-screen bg-page overflow-hidden relative selection:bg-predict-light selection:text-predict-text">
      {/* Ambient Aurora background */}
      <Aurora />

      {/* Floating Rounded Cream Sidebar */}
      <motion.aside
        animate={{ width: collapsed ? 80 : 250 }}
        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
        className="h-[calc(100vh-24px)] my-3 ml-3 shrink-0 flex flex-col bg-tile border border-border rounded-2xl shadow-tile z-20 relative overflow-hidden"
      >
        {/* Brand Header */}
        <div className="p-4 flex items-center justify-between border-b border-border/70">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-8 h-8 rounded-xl bg-predict flex items-center justify-center shrink-0 shadow-sm">
              <span className="font-headline font-bold text-cream text-base">X</span>
            </div>
            {!collapsed && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="whitespace-nowrap"
              >
                <div className="font-headline font-bold text-ink text-sm tracking-tight flex items-center gap-1.5">
                  REWIND X
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-pill bg-predict-light text-predict-text">v4.2</span>
                </div>
                <div className="font-mono text-[9px] uppercase tracking-wider text-ink-3">
                  Deterministic Operator
                </div>
              </motion.div>
            )}
          </div>

          <button
            onClick={() => setCollapsed(prev => !prev)}
            className="p-1.5 text-ink-3 hover:text-ink hover:bg-sand-light rounded-lg transition-colors"
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <span className="material-symbols-outlined text-sm">
              {collapsed ? 'chevron_right' : 'chevron_left'}
            </span>
          </button>
        </div>

        {/* Navigation items with sliding red indicator */}
        <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
          {navItems.map(item => {
            const isActive = location.pathname.startsWith(item.path);
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={`relative flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-headline font-medium text-xs transition-colors outline-none focus-visible:ring-2 focus-visible:ring-predict ${
                  isActive ? 'text-cream font-semibold' : 'text-ink-2 hover:text-ink hover:bg-sand-light/60'
                }`}
              >
                {/* Sliding active red indicator */}
                {isActive && (
                  <motion.div
                    layoutId="activeNavIndicator"
                    className="absolute inset-0 bg-predict rounded-xl shadow-sm z-0"
                    transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                  />
                )}

                <span className="material-symbols-outlined text-lg relative z-10 shrink-0">
                  {item.icon}
                </span>

                {!collapsed && (
                  <span className="relative z-10 whitespace-nowrap">
                    {item.label}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Footer with mode badge + live dot */}
        <div className="p-3 border-t border-border/70 space-y-2 bg-sand-light/30">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-prove animate-pulse' : 'bg-predict'}`} />
              {!collapsed && (
                <span className="font-mono text-[10px] uppercase font-medium text-ink-2">
                  {isOnline ? 'ONLINE (SSE)' : 'DISCONNECTED'}
                </span>
              )}
            </div>

            {!collapsed && (
              <span className="font-mono text-[9px] uppercase px-2 py-0.5 rounded-pill bg-sand text-ink-2 font-bold border border-border">
                {mode}
              </span>
            )}
          </div>

          {!collapsed && (
            <button
              onClick={handleReset}
              disabled={resetting}
              className="w-full font-headline text-xs py-1.5 px-3 rounded-lg border border-border text-ink-2 hover:bg-tile hover:text-predict-text transition-all text-center flex items-center justify-center gap-1.5"
            >
              <span className="material-symbols-outlined text-sm">restart_alt</span>
              <span>{resetting ? 'Resetting...' : 'Reset Demo'}</span>
            </button>
          )}
        </div>
      </motion.aside>

      {/* Main Content Area with Slim Glass Top Bar */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden pl-2 pr-3 py-3">
        {/* Slim Glass Top Bar */}
        <header className="h-14 px-6 rounded-2xl frosted-glass flex items-center justify-between shrink-0 mb-3 shadow-tile z-20">
          <div className="flex items-center gap-3">
            <h1 className="font-headline font-bold text-lg text-ink tracking-tight">
              {pageTitle}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            {/* Cmd+K Palette Trigger */}
            <button
              onClick={() => setCmdOpen(true)}
              className="flex items-center gap-2 px-3 py-1.5 bg-tile border border-border hover:border-border-strong rounded-button font-mono text-xs text-ink-2 shadow-sm transition-all"
            >
              <span className="material-symbols-outlined text-sm text-ink-3">search</span>
              <span className="hidden sm:inline">Search actions...</span>
              <kbd className="px-1.5 py-0.5 bg-sand-light text-ink-2 rounded text-[10px] font-mono border border-border">
                ⌘K
              </kbd>
            </button>

            {/* Reduce Motion Toggle */}
            <button
              onClick={toggleReducedMotion}
              className={`px-3 py-1.5 rounded-button text-xs font-mono border transition-all flex items-center gap-1.5 ${
                reducedMotion
                  ? 'bg-predict-light text-predict-text border-predict-border'
                  : 'bg-tile text-ink-2 border-border hover:border-border-strong'
              }`}
              title="Toggle prefers-reduced-motion"
            >
              <span className="material-symbols-outlined text-sm">
                {reducedMotion ? 'motion_photos_off' : 'motion_photos_on'}
              </span>
              <span className="hidden md:inline">
                {reducedMotion ? 'Reduced Motion' : 'Motion On'}
              </span>
            </button>

            {/* Mode & Live Dot */}
            <div className="flex items-center gap-2 px-2.5 py-1 rounded-pill bg-tile border border-border shadow-sm">
              <span className="w-2 h-2 rounded-full bg-prove animate-ping" />
              <span className="font-mono text-xs font-bold text-prove-text">LIVE</span>
            </div>
          </div>
        </header>

        {/* Scrollable Page Body */}
        <main className="flex-1 overflow-y-auto no-scrollbar relative pr-1">
          <Outlet />
        </main>
      </div>

      {/* Command Palette Modal (Cmd+K) */}
      <AnimatePresence>
        {cmdOpen && (
          <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 bg-ink/30 backdrop-blur-sm p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              transition={{ duration: 0.15 }}
              className="bg-tile border border-border-strong p-4 rounded-2xl shadow-modal max-w-lg w-full flex flex-col gap-3"
            >
              <div className="flex items-center gap-2 border-b border-border pb-3">
                <span className="material-symbols-outlined text-ink-2">search</span>
                <input
                  type="text"
                  autoFocus
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Jump to route or operator view..."
                  className="w-full bg-transparent text-ink placeholder:text-ink-3 font-headline text-sm outline-none"
                />
                <button 
                  onClick={() => setCmdOpen(false)}
                  className="p-1 rounded text-ink-3 hover:text-ink hover:bg-sand-light"
                >
                  <span className="material-symbols-outlined text-sm">close</span>
                </button>
              </div>

              <div className="space-y-1 max-h-64 overflow-y-auto">
                {navItems
                  .filter(item => item.label.toLowerCase().includes(searchQuery.toLowerCase()))
                  .map(item => (
                    <button
                      key={item.path}
                      onClick={() => {
                        navigate(item.path);
                        setCmdOpen(false);
                      }}
                      className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-sand-light text-left transition-colors font-headline text-xs text-ink"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="material-symbols-outlined text-base text-ink-2">{item.icon}</span>
                        <span>{item.label}</span>
                      </div>
                      <span className="font-mono text-[10px] text-ink-3 uppercase">{item.path}</span>
                    </button>
                  ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
