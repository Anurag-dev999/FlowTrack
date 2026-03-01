'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { BarChart3, Settings, Menu, X, Moon, Sun, LogOut, User, ListTodo, PieChart, Users } from 'lucide-react';
import { supabaseClient } from '@/lib/supabase/client';

const navigation = [
  { name: 'Dashboard', href: '/', icon: BarChart3 },
  { name: 'Tasks', href: '/tasks', icon: ListTodo },
  { name: 'Analytics', href: '/analytics', icon: PieChart },
  { name: 'Team', href: '/team', icon: Users },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const pathname = usePathname();
  const router = useRouter();

  // Client-side auth guard with session-change listener
  useEffect(() => {
    let mounted = true;

    const checkAuth = async () => {
      try {
        const { data: { user } } = await supabaseClient.auth.getUser();
        if (!mounted) return;
        if (!user) {
          router.replace('/login?redirect_to=' + encodeURIComponent(pathname));
          return;
        }
        setUserEmail(user.email || '');
        setAuthChecked(true);
      } catch {
        // Network failure — still show loading but don't crash
        if (mounted) setAuthChecked(true);
      }
    };

    checkAuth();

    // Listen for sign-out / token expiry — redirect immediately
    const { data: { subscription } } = supabaseClient.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        router.replace('/login');
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [pathname, router]);

  // Initialize dark mode from system preference or localStorage
  useEffect(() => {
    const saved = localStorage.getItem('flowtrack-dark-mode');
    if (saved === 'true') {
      setDarkMode(true);
      document.documentElement.classList.add('dark');
    } else if (saved === null && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setDarkMode(true);
      document.documentElement.classList.add('dark');
    }
  }, []);

  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    if (newMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('flowtrack-dark-mode', 'true');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('flowtrack-dark-mode', 'false');
    }
  };

  const handleLogout = async () => {
    await supabaseClient.auth.signOut();
    window.location.href = '/login';
  };

  // Show loading while checking auth
  if (!authChecked) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex h-dvh bg-background text-foreground overflow-hidden bg-app">
        {/* Sidebar */}
        <div
          className={`fixed inset-y-0 left-0 z-50 w-64 bg-gradient-to-b from-card to-card/95 border-r border-border/50 transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
            } lg:translate-x-0 lg:static`}
        >
          <div className="flex items-center justify-between p-6 border-b border-border">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              FlowTrack
            </h1>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden text-muted-foreground hover:text-foreground"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <nav className="p-6 space-y-2">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link key={item.href} href={item.href}>
                  <button
                    onClick={() => setSidebarOpen(false)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group ${isActive
                      ? 'bg-sidebar-active text-white shadow-glow scale-[1.02]'
                      : 'text-muted-foreground hover:bg-white/5 hover:text-foreground'
                      }`}
                  >
                    <Icon className={`w-5 h-5 transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-110 group-hover:text-primary'}`} />
                    <span>{item.name}</span>
                  </button>
                </Link>
              );
            })}
          </nav>

          {/* Sidebar footer - developer credit */}
          <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-border/50">
            <p className="text-xs text-muted-foreground text-center">Built With ❤️ by Anurag</p>
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <header className="glass-surface backdrop-blur-md bg-white/80 dark:bg-black/20 border-b border-slate-200 dark:border-white/10 px-6 py-4 flex items-center justify-between sticky top-0 z-40">

            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 hover:bg-muted rounded-lg text-muted-foreground"
              >
                <Menu className="w-5 h-5" />
              </button>
              <h2 className="text-xl font-bold tracking-tight text-foreground/90">Welcome to FlowTrack</h2>
            </div>

            <div className="flex items-center gap-3">
              {/* Dark mode toggle */}
              <button
                onClick={toggleDarkMode}
                className="p-2 hover:bg-muted rounded-lg text-muted-foreground transition-colors"
                title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
              >
                {darkMode ? (
                  <Sun className="w-5 h-5" />
                ) : (
                  <Moon className="w-5 h-5" />
                )}
              </button>

              {/* Profile button */}
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl glass-surface border-slate-200 dark:border-white/10 hover:bg-white/50 dark:hover:bg-white/10 transition-colors cursor-pointer group/profile">
                <div className="w-7 h-7 rounded-full bg-sidebar-active flex items-center justify-center shadow-glow">
                  <User className="w-4 h-4 text-white" />
                </div>
                <span className="text-sm font-semibold hidden sm:inline max-w-[150px] truncate text-foreground/80 group-hover/profile:text-foreground">
                  {userEmail || 'User'}
                </span>
              </div>

              {/* Logout */}
              <button
                onClick={handleLogout}
                className="p-2 hover:bg-red-100 dark:hover:bg-red-900/20 rounded-lg text-muted-foreground hover:text-red-600 transition-colors"
                title="Logout"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </header>

          {/* Page content */}
          <main className="flex-1 overflow-y-auto overflow-x-hidden bg-background">
            {children}
          </main>
        </div>

        {/* Mobile sidebar backdrop */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </div>
    </>
  );
}
