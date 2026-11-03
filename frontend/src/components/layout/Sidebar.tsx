'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  Search,
  Library,
  Heart,
  PlusSquare,
  ShieldAlert,
  Radio,
  Clock,
  Music2,
} from 'lucide-react';
import { useAuthStore } from '../../stores/useAuthStore';
import { api } from '../../lib/api';
import { Playlist } from '../../types';
import { ImportSpotifyModal } from '../common/ImportSpotifyModal';

export const Sidebar: React.FC = () => {
  const pathname = usePathname();
  const { user } = useAuthStore();
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  useEffect(() => {
    if (user) {
      api.getUserPlaylists()
        .then((res) => setPlaylists(res.data || []))
        .catch(() => {});
    } else {
      setPlaylists([]);
    }
  }, [user]);

  const navLinks = [
    { name: 'Home', href: '/', icon: Home },
    { name: 'Search', href: '/search', icon: Search },
    { name: 'Your Library', href: '/library', icon: Library },
  ];

  return (
    <aside className="w-64 bg-surface flex flex-col border-r border-surface-border select-none z-20 flex-shrink-0 h-screen pb-24">
      {/* SonicFlow Brand */}
      <div className="p-6 pb-4">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-primary to-accent-lime flex items-center justify-center shadow-lg shadow-primary/20 group-hover:scale-105 transition-transform duration-300">
            <Radio className="w-5 h-5 text-black stroke-[2.5]" />
          </div>
          <div>
            <span className="text-xl font-bold tracking-tight text-white flex items-center gap-1.5">
              Sonic<span className="text-primary font-black">Flow</span>
            </span>
            <span className="text-[10px] tracking-wider uppercase font-semibold text-primary/80 block">
              Pure Ad-Free
            </span>
          </div>
        </Link>
      </div>

      {/* Main Nav */}
      <nav className="px-3 space-y-1">
        {navLinks.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-4 px-3 py-2.5 rounded-lg font-medium text-sm transition-all duration-200 ${
                isActive
                  ? 'bg-surface-elevated text-primary font-semibold'
                  : 'text-muted hover:text-white hover:bg-surface-hover'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'text-primary' : 'text-muted'}`} />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* Library Actions */}
      <div className="px-3 mt-6 pt-4 border-t border-surface-border/50 space-y-1">
        <Link
          href="/liked-songs"
          className={`flex items-center gap-3.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
            pathname === '/liked-songs'
              ? 'bg-surface-elevated text-white'
              : 'text-muted hover:text-white hover:bg-surface-hover'
          }`}
        >
          <div className="w-6 h-6 rounded bg-gradient-to-br from-violet-600 to-indigo-800 flex items-center justify-center">
            <Heart className="w-3.5 h-3.5 text-white fill-white" />
          </div>
          Liked Songs
        </Link>

        <Link
          href="/history"
          className={`flex items-center gap-3.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
            pathname === '/history'
              ? 'bg-surface-elevated text-white'
              : 'text-muted hover:text-white hover:bg-surface-hover'
          }`}
        >
          <div className="w-6 h-6 rounded bg-surface-elevated flex items-center justify-center border border-surface-border">
            <Clock className="w-3.5 h-3.5 text-muted" />
          </div>
          Listening History
        </Link>

        {user && (user.role === 'ADMIN' || user.role === 'CONTENT_MANAGER') && (
          <Link
            href="/admin"
            className={`flex items-center gap-3.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
              pathname.startsWith('/admin')
                ? 'bg-primary/10 text-primary border border-primary/20'
                : 'text-muted hover:text-primary hover:bg-surface-hover'
            }`}
          >
            <ShieldAlert className="w-5 h-5 text-primary" />
            Admin Panel
          </Link>
        )}
      </div>

      {/* User Playlists Scroll area */}
      <div className="flex-1 px-3 mt-4 overflow-y-auto scrollbar-thin scrollbar-thumb-surface-border">
        <div className="flex items-center justify-between px-3 py-2">
          <span className="text-[11px] font-semibold text-muted-dim uppercase tracking-wider">
            Playlists
          </span>
          <button
            onClick={() => setIsImportModalOpen(true)}
            title="Import playlist from Spotify"
            className="text-[11px] font-semibold text-[#1DB954] hover:text-[#1ed760] transition-colors flex items-center gap-1"
          >
            <span>+ Spotify</span>
          </button>
        </div>
        {playlists.length === 0 ? (
          <div className="px-3 py-2 text-xs text-muted-dim">
            No playlists yet. Create your first playlist in Library!
          </div>
        ) : (
          <div className="space-y-0.5">
            {playlists.map((pl) => (
              <Link
                key={pl.id}
                href={`/playlist/${pl.id}`}
                className={`block px-3 py-2 text-xs rounded truncate transition-colors duration-150 ${
                  pathname === `/playlist/${pl.id}`
                    ? 'text-primary font-medium bg-surface-elevated'
                    : 'text-muted hover:text-white'
                }`}
              >
                {pl.title}
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Ad-Free Guarantee Badge */}
      <div className="p-4 mx-3 mb-2 rounded-xl bg-gradient-to-br from-surface-elevated to-surface-card border border-surface-border/60">
        <div className="flex items-center gap-2 text-xs font-semibold text-primary">
          <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          100% Ad-Free Guarantee
        </div>
        <p className="text-[11px] text-muted-dim mt-1 leading-relaxed">
          Zero banner ads, zero audio interruptions. Just uninterrupted pure music.
        </p>
      </div>

      <ImportSpotifyModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onSuccess={() => {
          if (user) {
            api.getUserPlaylists().then((res) => setPlaylists(res.data || [])).catch(() => {});
          }
        }}
      />
    </aside>
  );
};
