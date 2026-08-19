'use client';

import { useState } from 'react';
import { AuthGuard } from '@/components/shared/AuthGuard';
import { useAuth } from '@/hooks/useAuth';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: '' },
  { name: 'Market', href: '/dashboard/market', icon: '' },
  { name: 'AI Analysis', href: '/dashboard/analysis', icon: '' },
  { name: 'Journal', href: '/dashboard/journal', icon: '📓' },
  { name: 'Strategies', href: '/dashboard/strategies', icon: '' },
  { name: 'History', href: '/dashboard/history', icon: '🕐' },
  { name: 'Replay', href: '/dashboard/replay', icon: '▶️' },
  { name: 'Settings', href: '/dashboard/settings', icon: '⚙️' },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <DashboardShell>{children}</DashboardShell>
    </AuthGuard>
  );
}

function DashboardShell({ children }: { children: React.ReactNode }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-background flex">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:w-64 flex-col border-r border-border bg-card/50">
        <div className="flex h-16 items-center gap-3 border-b border-border px-6">
          <div className="h-8 w-8 rounded-lg bg-primary/20 flex items-center justify-center">
            <svg className="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
          </div>
          <span className="text-lg font-semibold text-foreground">Trading AI</span>
        </div>
        <nav className="flex-1 space-y-1 px-3 py-4">
          {navigation.map((item) => {
            const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn('flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors', isActive ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted hover:text-foreground')}
              >
                <span className="text-base">{item.icon}</span> {item.name}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-border p-4">
          <p className="text-xs text-muted-foreground text-center">Phase 8 • Production</p>
        </div>
      </aside>

      {/* Mobile Menu Overlay (Slide-in) */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop */}
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)} />
          
          {/* Sidebar Panel */}
          <div className="fixed inset-y-0 left-0 w-64 bg-card border-r border-border p-4 flex flex-col shadow-2xl animate-slide-in">
            <div className="flex items-center justify-between mb-6">
              <span className="text-lg font-bold text-foreground">Menu</span>
              <button onClick={() => setIsMobileMenuOpen(false)} className="text-muted-foreground hover:text-foreground text-2xl">×</button>
            </div>
            <nav className="space-y-1 flex-1">
              {navigation.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={cn('flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition-colors', isActive ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted')}
                  >
                    <span className="text-lg">{item.icon}</span> {item.name}
                  </Link>
                );
              })}
            </nav>
            <div className="border-t border-border pt-4 mt-4">
               <div className="flex items-center gap-3 mb-4">
                  <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">
                    {user?.email?.[0]?.toUpperCase()}
                  </div>
                  <div className="text-xs text-muted-foreground truncate">{user?.email}</div>
               </div>
               <button onClick={logout} className="w-full rounded-lg border border-destructive/50 text-destructive px-3 py-2 text-sm hover:bg-destructive/10">Logout</button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-16 flex items-center justify-between border-b border-border px-4 lg:px-6 bg-background sticky top-0 z-40">
          <div className="flex items-center gap-4">
            {/* Mobile Menu Button */}
            <button 
              onClick={() => setIsMobileMenuOpen(true)} 
              className="lg:hidden text-foreground p-1 rounded-md hover:bg-muted"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" /></svg>
            </button>
            <h1 className="text-lg font-semibold text-foreground truncate">
              {navigation.find(n => n.href === pathname)?.name || 'Dashboard'}
            </h1>
          </div>

          {/* Desktop User Profile */}
          <div className="hidden lg:flex items-center gap-4">
            {user && (
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">
                  {user.email?.[0]?.toUpperCase()}
                </div>
                <span className="text-sm text-muted-foreground">{user.email}</span>
              </div>
            )}
            <button onClick={logout} className="rounded-lg border border-border px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
              Logout
            </button>
          </div>
          
          {/* Mobile Logout Icon */}
          <button onClick={logout} className="lg:hidden text-muted-foreground hover:text-destructive">
             <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
          </button>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-x-hidden p-4 lg:p-6 w-full">
          {children}
        </main>
      </div>
    </div>
  );
}
