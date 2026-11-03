'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight, User as UserIcon, LogOut, Settings, Shield, Sparkles } from 'lucide-react';
import { useAuthStore } from '../../stores/useAuthStore';

export const Header: React.FC = () => {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  return (
    <header className="h-16 px-8 flex items-center justify-between sticky top-0 bg-background/80 backdrop-blur-md border-b border-surface-border/40 z-10 select-none">
      {/* Navigation history controls */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => router.back()}
          aria-label="Go back"
          className="w-8 h-8 rounded-full bg-surface-elevated/80 hover:bg-surface-hover flex items-center justify-center text-muted hover:text-white transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <button
          onClick={() => router.forward()}
          aria-label="Go forward"
          className="w-8 h-8 rounded-full bg-surface-elevated/80 hover:bg-surface-hover flex items-center justify-center text-muted hover:text-white transition-colors"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* User Actions & Profile */}
      <div className="flex items-center gap-4">
        {user ? (
          <div className="relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-3 py-1.5 px-3 rounded-full bg-surface-elevated hover:bg-surface-hover border border-surface-border/80 transition-all duration-200"
            >
              {user.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={user.displayName}
                  className="w-7 h-7 rounded-full object-cover border border-primary/40"
                />
              ) : (
                <div className="w-7 h-7 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-xs">
                  {user.displayName.charAt(0).toUpperCase()}
                </div>
              )}
              <span className="text-xs font-semibold text-white max-w-[120px] truncate">
                {user.displayName}
              </span>
            </button>

            {/* Dropdown Menu */}
            {dropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-30"
                  onClick={() => setDropdownOpen(false)}
                />
                <div className="absolute right-0 mt-2 w-48 rounded-xl bg-surface-card border border-surface-border shadow-2xl py-1 z-40 animate-in fade-in duration-150">
                  <div className="px-4 py-2 border-b border-surface-border/60">
                    <p className="text-xs font-medium text-white truncate">{user.displayName}</p>
                    <p className="text-[10px] text-muted-dim truncate">{user.email}</p>
                    {user.role !== 'USER' && (
                      <span className="inline-block mt-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-primary/20 text-primary uppercase">
                        {user.role}
                      </span>
                    )}
                  </div>

                  <Link
                    href="/profile"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2 text-xs text-muted hover:text-white hover:bg-surface-hover transition-colors"
                  >
                    <UserIcon className="w-4 h-4" />
                    Profile
                  </Link>

                  <Link
                    href="/settings"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2 text-xs text-muted hover:text-white hover:bg-surface-hover transition-colors"
                  >
                    <Settings className="w-4 h-4" />
                    Account Settings
                  </Link>

                  {user.role === 'ADMIN' && (
                    <Link
                      href="/admin"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2 text-xs text-primary hover:bg-surface-hover transition-colors font-medium"
                    >
                      <Shield className="w-4 h-4" />
                      Admin Dashboard
                    </Link>
                  )}

                  <div className="border-t border-surface-border/60 mt-1 pt-1">
                    <button
                      onClick={() => {
                        setDropdownOpen(false);
                        logout();
                      }}
                      className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors text-left"
                    >
                      <LogOut className="w-4 h-4" />
                      Log out
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <Link
              href="/auth/register"
              className="text-xs font-semibold text-muted hover:text-white px-3 py-2 transition-colors"
            >
              Sign up
            </Link>
            <Link
              href="/auth/login"
              className="text-xs font-semibold text-black bg-primary hover:bg-primary-hover px-5 py-2 rounded-full transition-all duration-200 shadow-md shadow-primary/20 hover:scale-105"
            >
              Log in
            </Link>
          </div>
        )}
      </div>
    </header>
  );
};
