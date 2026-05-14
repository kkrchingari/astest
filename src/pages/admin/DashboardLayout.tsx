import { useState } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { 
  Users, 
  ClipboardCheck, 
  BarChart3, 
  BookOpen, 
  Settings, 
  LogOut,
  Menu,
  X,
  Sparkles
} from 'lucide-react';
import Rankings from './Rankings';
import CandidatesList from './CandidatesList';
import CreateTest from './CreateTest';
import PersonasList from './PersonasList';
import McqManagement from './McqManagement';
import SettingsPage from './Settings';
import { cn } from '@/lib/utils';

interface DashboardLayoutProps {
  user: any;
  onLogout: () => void;
}

export default function DashboardLayout({ user, onLogout }: DashboardLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const location = useLocation();

  const navItems = [
    { name: 'Candidates', path: '/dashboard', icon: Users },
    { name: 'Create Test', path: '/dashboard/create-test', icon: ClipboardCheck },
    { name: 'Analytics & AI', path: '/dashboard/analytics', icon: BarChart3 },
    { name: 'MCQ Bank', path: '/dashboard/mcq', icon: BookOpen },
    { name: 'Personas', path: '/dashboard/personas', icon: Sparkles },
    { name: 'Settings', path: '/dashboard/settings', icon: Settings },
  ];

  return (
    <div className="flex h-screen bg-astro-cream overflow-hidden">
      {/* Sidebar */}
      <aside 
        className={cn(
          "bg-[#9f7aea] text-white transition-all duration-300 ease-in-out flex flex-col border-r border-[#9f7aea]/20 relative z-20",
          isSidebarOpen ? "w-64" : "w-16"
        )}
      >
        <div className="p-6 flex items-center justify-between mb-2">
          {isSidebarOpen ? (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shrink-0 shadow-sm overflow-hidden p-1">
                <img src="https://astrolive.app/assets/logo-DU-wQ3eD.png" alt="Astrolive" className="w-full h-full object-contain" onError={(e) => { e.currentTarget.src = "https://ui-avatars.com/api/?name=AL&background=db2777&color=fff"; }} />
              </div>
              <span className="font-sans text-2xl font-black tracking-tight text-[#1e1b4b]">
                ASTROLIVE
              </span>
            </div>
          ) : (
            <div className="w-full flex justify-center">
              <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shrink-0 shadow-sm">
                 <img src="https://astrolive.app/assets/logo-DU-wQ3eD.png" alt="AL" className="w-8 h-8 object-contain" onError={(e) => { e.currentTarget.src = "https://ui-avatars.com/api/?name=AL&background=db2777&color=fff"; }} />
              </div>
            </div>
          )}
        </div>

        <nav className="flex-1 px-4 py-4 space-y-4">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center gap-4 px-2 py-1 rounded-md transition-all group relative",
                location.pathname === item.path 
                  ? "text-white" 
                  : "text-white/80 hover:text-white"
              )}
            >
              {isSidebarOpen && <span className="text-xl font-bold uppercase tracking-wider">{item.name}</span>}
              {!isSidebarOpen && (
                <div className="absolute left-full ml-4 px-2 py-1 bg-white text-[#9f7aea] text-xs font-bold uppercase tracking-widest rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50 shadow-md">
                  {item.name}
                </div>
              )}
            </Link>
          ))}
        </nav>

        <div className="mt-auto border-t border-white/5 p-4 space-y-4">
          {isSidebarOpen && (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-astro-gold/20 flex items-center justify-center font-bold text-xs text-astro-gold border border-astro-gold/20">
                {user.name[0]}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-bold text-white truncate">{user.name}</p>
                <p className="text-[9px] text-astro-gold opacity-60 uppercase tracking-widest truncate">{user.role.replace('_', ' ')}</p>
              </div>
            </div>
          )}
          <Button 
            className="w-full bg-white/5 text-white/60 hover:bg-white/10 hover:text-white transition-all py-2 rounded border border-white/10 h-9"
            variant="ghost"
            onClick={onLogout}
          >
            <LogOut className="w-3 h-3 mr-2" />
            {isSidebarOpen && <span className="text-[10px] uppercase font-bold tracking-widest">Exit Portal</span>}
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        <header className="h-16 flex items-center justify-between px-8 bg-white border-b border-astro-gold/10 relative z-10 shrink-0">
          <div className="flex items-center gap-4">
            <Button 
               variant="ghost" 
               size="icon" 
               onClick={() => setIsSidebarOpen(!isSidebarOpen)}
               className="text-astro-navy/40 hover:text-astro-navy h-8 w-8"
             >
               {isSidebarOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
             </Button>
             <div className="h-4 w-[1px] bg-astro-gold/20" />
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-astro-gold opacity-60">Admin Panel</span>
              <span className="text-astro-gold/30">/</span>
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-astro-navy">
                {navItems.find(i => i.path === location.pathname)?.name || 'Pipeline'}
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[9px] font-bold uppercase tracking-widest text-astro-navy/60">System Synced</span>
            </div>
            <div className="h-8 w-[1px] bg-astro-gold/20" />
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-[10px] font-bold text-astro-navy uppercase tracking-widest leading-none">Global Active</p>
                <p className="text-[14px] font-serif font-black text-astro-gold leading-none mt-1">14 CANDIDATES</p>
              </div>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto bg-astro-cream">
          <section className="p-8 min-h-full max-w-7xl mx-auto w-full">
            <div className="mb-10">
              <p className="text-astro-gold font-serif italic text-lg opacity-80 mb-1">
                {navItems.find(i => i.path === location.pathname)?.name || 'Dashboard'}
              </p>
              <h1 className="text-4xl font-serif font-semibold text-astro-navy tracking-tight">
                {navItems.find(i => i.path === location.pathname)?.name === 'Candidates' ? 'Audition Pipeline' : 
                 navItems.find(i => i.path === location.pathname)?.name || 'Control Panel'}
              </h1>
            </div>

            <div className="bg-transparent rounded-none">
              <Routes>
                <Route index element={<CandidatesList />} />
                <Route path="create-test" element={<CreateTest />} />
                <Route path="analytics" element={<Rankings />} />
                <Route path="mcq" element={<McqManagement />} />
                <Route path="personas" element={<PersonasList />} />
                <Route path="settings" element={<SettingsPage user={user} />} />
              </Routes>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
