'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';

export default function LoginPage() {
  const { login, isAuthenticating, error, isAuthenticated } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // New state for forgot password
  const [showForgot, setShowForgot] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState('');

  if (isAuthenticated) {
    return (
      <div className="glass rounded-xl p-8 text-center animate-fade-in">
        <p className="text-muted-foreground">Already logged in. Redirecting...</p>
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await login(email, password);
  }

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault();
    setResetLoading(true);
    setResetError('');
    
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/dashboard`, 
    });

    if (error) {
      setResetError(error.message);
      setResetLoading(false);
    } else {
      setResetSent(true);
      setResetLoading(false);
    }
  }

  if (showForgot) {
    return (
      <div className="glass rounded-xl p-8 animate-fade-in">
        <div className="mb-6 text-center">
          <h2 className="text-xl font-semibold text-foreground">Reset Password</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Enter your email to receive a reset link.
          </p>
        </div>

        {resetSent ? (
          <div className="text-center space-y-4">
            <div className="rounded-lg bg-bullish/10 border border-bullish/20 p-4">
              <p className="text-sm text-bullish font-medium">Reset link sent!</p>
              <p className="text-xs text-muted-foreground mt-1">Check your inbox.</p>
            </div>
            <button 
              onClick={() => setShowForgot(false)} 
              className="text-sm text-primary hover:text-primary/80"
            >
              ← Back to login
            </button>
          </div>
        ) : (
          <form onSubmit={handleResetPassword} className="space-y-4">
            {resetError && (
              <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3">
                <p className="text-sm text-destructive">{resetError}</p>
              </div>
            )}
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium text-foreground">Email</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="trader@example.com"
                required
                className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none"
              />
            </div>
            <button
              type="submit"
              disabled={resetLoading}
              className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {resetLoading ? 'Sending...' : 'Send Reset Link'}
            </button>
            <button 
              type="button" 
              onClick={() => setShowForgot(false)}
              className="w-full text-sm text-muted-foreground hover:text-foreground"
            >
              ← Back to Login
            </button>
          </form>
        )}
      </div>
    );
  }

  return (
    <div className="glass rounded-xl p-8 animate-fade-in">
      <div className="mb-6 text-center">
        <h2 className="text-xl font-semibold text-foreground">Welcome back</h2>
        <p className="mt-1 text-sm text-muted-foreground">Sign in to your trading account</p>
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-destructive/10 border border-destructive/20 p-3">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="email" className="text-sm font-medium text-foreground">Email</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="trader@example.com"
            required
            className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none"
          />
        </div>

        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <label htmlFor="password" className="text-sm font-medium text-foreground">Password</label>
            <button 
              type="button" 
              onClick={() => setShowForgot(true)}
              className="text-xs text-primary hover:text-primary/80"
            >
              Forgot password?
            </button>
          </div>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
            className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none"
          />
        </div>

        <button
          type="submit"
          disabled={isAuthenticating}
          className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {isAuthenticating ? 'Signing in...' : 'Sign In'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Don&apos;t have an account?{' '}
        <Link href="/register" className="font-medium text-primary hover:text-primary/80">Create one</Link>
      </p>
    </div>
  );
}
