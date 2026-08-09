/**
 * Register Page
 * 
 * Create a new account with email + password.
 * If Supabase has email confirmation enabled, shows a confirmation message.
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

export default function RegisterPage() {
  const { register, isAuthenticating, error, isAuthenticated } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [localError, setLocalError] = useState('');
  const [needsConfirmation, setNeedsConfirmation] = useState(false);

  // If already authenticated, redirect
  if (isAuthenticated) {
    return (
      <div className="glass rounded-xl p-8 text-center animate-fade-in">
        <p className="text-muted-foreground">Account created. Redirecting...</p>
      </div>
    );
  }

  // If email confirmation is needed
  if (needsConfirmation) {
    return (
      <div className="glass rounded-xl p-8 text-center animate-fade-in">
        <div className="mb-4 flex justify-center">
          <div className="h-12 w-12 rounded-full bg-bullish/20 flex items-center justify-center">
            <svg className="h-6 w-6 text-bullish" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
        </div>
        <h2 className="text-xl font-semibold text-foreground mb-2">Check your email</h2>
        <p className="text-sm text-muted-foreground mb-4">
          We sent a confirmation link to <strong className="text-foreground">{email}</strong>
        </p>
        <p className="text-xs text-muted-foreground">
          Click the link in the email to activate your account, then come back and log in.
        </p>
        <Link
          href="/login"
          className="mt-6 block w-full rounded-lg bg-primary/20 px-4 py-2.5 text-sm font-medium text-primary text-center hover:bg-primary/30 transition-colors"
        >
          Go to Login
        </Link>
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLocalError('');

    // Client-side validation
    if (password !== confirmPassword) {
      setLocalError('Passwords do not match.');
      return;
    }

    if (password.length < 6) {
      setLocalError('Password must be at least 6 characters.');
      return;
    }

    const result = await register(email, password);

    if (result.needsConfirmation) {
      setNeedsConfirmation(true);
    }
  }

  const displayError = localError || error;

  return (
    <div className="glass rounded-xl p-8 animate-fade-in">
      <div className="mb-6 text-center">
        <h2 className="text-xl font-semibold text-foreground">Create account</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Start your AI-powered trading journey
        </p>
      </div>

      {/* Error message */}
      {displayError && (
        <div className="mb-4 rounded-lg bg-destructive/10 border border-destructive/20 p-3">
          <p className="text-sm text-destructive">{displayError}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Email */}
        <div className="space-y-2">
          <label htmlFor="email" className="text-sm font-medium text-foreground">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="trader@example.com"
            required
            autoComplete="email"
            className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors"
          />
        </div>

        {/* Password */}
        <div className="space-y-2">
          <label htmlFor="password" className="text-sm font-medium text-foreground">
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Minimum 6 characters"
            required
            autoComplete="new-password"
            minLength={6}
            className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors"
          />
        </div>

        {/* Confirm Password */}
        <div className="space-y-2">
          <label htmlFor="confirmPassword" className="text-sm font-medium text-foreground">
            Confirm Password
          </label>
          <input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Re-enter password"
            required
            autoComplete="new-password"
            minLength={6}
            className={cn(
              'w-full rounded-lg border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 transition-colors',
              localError && localError.includes('match')
                ? 'border-destructive focus:border-destructive focus:ring-destructive'
                : 'border-input focus:border-primary focus:ring-primary'
            )}
          />
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={isAuthenticating}
          className={cn(
            'w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-all',
            'hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background',
            'disabled:opacity-50 disabled:cursor-not-allowed'
          )}
        >
          {isAuthenticating ? (
            <span className="flex items-center justify-center gap-2">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              Creating account...
            </span>
          ) : (
            'Create Account'
          )}
        </button>
      </form>

      {/* Login link */}
      <p className="mt-6 text-center text-sm text-muted-foreground">
        Already have an account?{' '}
        <Link
          href="/login"
          className="font-medium text-primary hover:text-primary/80 transition-colors"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}
