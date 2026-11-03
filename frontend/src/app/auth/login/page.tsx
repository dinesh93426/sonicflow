'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Radio, Lock, Mail, Sparkles, AlertCircle } from 'lucide-react';
import { useAuthStore } from '../../../stores/useAuthStore';

export default function LoginPage() {
  const router = useRouter();
  const { login, isLoading } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await login({ email, password });
      router.push('/');
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
    }
  };

  const fillDemo = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setError(null);
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4 select-none">
      <div className="w-full max-w-md p-8 rounded-2xl bg-surface-card border border-surface-border shadow-2xl space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-primary to-accent-lime mx-auto flex items-center justify-center shadow-lg shadow-primary/25">
            <Radio className="w-6 h-6 text-black stroke-[2.5]" />
          </div>
          <h1 className="text-2xl font-black text-white">Log in to SonicFlow</h1>
          <p className="text-xs text-muted">Pure Ad-Free High-Fidelity Music Streaming</p>
        </div>

        {/* Demo Fast Fill Buttons */}
        <div className="p-3.5 rounded-xl bg-surface-elevated border border-surface-border/60 space-y-2">
          <p className="text-[11px] font-semibold text-primary uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            Quick Demo Login
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => fillDemo('admin@sonicflow.app', 'AdminPass123!')}
              className="py-1.5 px-3 rounded-lg bg-surface hover:bg-surface-hover text-xs font-medium text-white border border-surface-border text-left truncate"
            >
              👑 Admin Demo
            </button>
            <button
              type="button"
              onClick={() => fillDemo('user@sonicflow.app', 'UserPass123!')}
              className="py-1.5 px-3 rounded-lg bg-surface hover:bg-surface-hover text-xs font-medium text-white border border-surface-border text-left truncate"
            >
              🎧 Listener Demo
            </button>
          </div>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-muted mb-1.5">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full bg-surface-elevated text-white text-xs pl-10 pr-3.5 py-3 rounded-lg border border-surface-border focus:border-primary focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-muted mb-1.5">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-surface-elevated text-white text-xs pl-10 pr-3.5 py-3 rounded-lg border border-surface-border focus:border-primary focus:outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 rounded-full bg-primary hover:bg-primary-hover text-black font-bold text-xs uppercase tracking-wider shadow-lg shadow-primary/20 transition-all hover:scale-105 disabled:opacity-50"
          >
            {isLoading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p className="text-center text-xs text-muted">
          Don't have an account?{' '}
          <Link href="/auth/register" className="text-primary hover:underline font-semibold">
            Sign up for free
          </Link>
        </p>
      </div>
    </div>
  );
}
