/**
 * Auth Layout
 * 
 * Centered layout for login and register pages.
 * No sidebar, no header — just the auth form.
 * 
 * Design: Dark gradient background with centered card.
 */

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-gradient-subtle">
      {/* Background pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/5 via-transparent to-transparent" />
      
      {/* Content */}
      <div className="relative z-10 w-full max-w-md px-4">
        {/* Brand */}
        <div className="mb-8 flex flex-col items-center gap-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/20 flex items-center justify-center">
              <svg
                className="h-6 w-6 text-primary"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                />
              </svg>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-gradient">
              AI Trading Platform
            </h1>
          </div>
        </div>

        {/* Auth Form Container */}
        {children}
      </div>
    </div>
  );
}
