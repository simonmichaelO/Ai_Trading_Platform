/**
 * Dashboard Layout
 * 
 * Protected layout for all dashboard pages.
 * Wraps content in AuthGuard — only authenticated users can access.
 * 
 * Includes:
 * - Sidebar navigation (placeholder for now)
 * - Top header with user info and logout
 * - Main content area
 * 
 * All pages under /dashboard/* will use this layout.
 */

'use client';

import { AuthGuard } from '@/components/shared/AuthGuard';
import { useAuth } from '@/hooks/useAuth';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

// Navigation items — will be expanded in later phases
const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: '📊' },
  { name: 'Market', href: '/dashboard/market', icon: '📈' },
  { name: 'AI Analysis', href: '/dashboard/analysis', icon: '🤖' },
  { name: 'Journal', href: '/dashboard/journal', icon: '📓' },
  { name: 'Strategies', href: '/dashboard/strategies', icon: '🎯' },
  { name: 'History', href: '/dashboard/history', icon: '🕐' },
  { name: 'Replay', href: '/dashboard/replay', icon: '▶️' },
  { name: 'Settings', href: '/dashboard/settings', icon: '⚙️' },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <div className="flex min-h-screen bg-background">
        {/* Sidebar */}
        <Sidebar />

        {/* Main Content */}
        <div className="flex flex-1 flex-col">
          {/* Top Header */}
          <Header />

          {/* Page Content */}
          <main className="flex-1 overflow-auto p-6">
            {children}
          </main>
        </div>
      </div>
    </AuthGuard>
  );
}

// ──────────────────────────────────────────────
// Sidebar Component
// ──────────────────────────────────────────────

function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:border-r lg:border-border">
      <div className="flex h-full flex-col">
        {/* Brand */}
        <div className="flex h-16 items-center gap-3 border-b border-border px-6">
          <div className="h-8 w-8 rounded-lg bg-primary/20 flex items-center justify-center">
            <svg
              className="h-5 w-5 text-primary"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          </div>
          <span className="text-lg font-semibold text-foreground">Trading AI</span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 px-3 py-4">
          {navigation.map((item) => {
            const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');

            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                <span className="text-base">{item.icon}</span>
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="border-t border-border p-4">
          <p className="text-xs text-muted-foreground text-center">
            Phase 2 • Auth System
          </p>
        </div>
      </div>
    </aside>
  );
}

// ──────────────────────────────────────────────
// Header Component
// ──────────────────────────────────────────────

function Header() {
  const { user, logout } = useAuth();

  return (
    <header className="flex h-16 items-center justify-between border-b border-border px-6">
      <div>
        <h1 className="text-lg font-semibold text-foreground">Dashboard</h1>
      </div>

      <div className="flex items-center gap-4">
        {/* User info */}
        {user && (
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center">
              <span className="text-xs font-medium text-primary">
                {user.email?.charAt(0).toUpperCase()}
              </span>
            </div>
            <span className="hidden text-sm text-muted-foreground md:block">
              {user.email}
            </span>
          </div>
        )}

        {/* Logout button */}
        <button
          onClick={logout}
          className="rounded-lg border border-border px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          Logout
        </button>
      </div>
    </header>
  );
}
