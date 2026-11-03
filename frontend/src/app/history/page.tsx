'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Clock, Trash2, Play, Pause, Disc } from 'lucide-react';
import { api } from '../../lib/api';
import { Song } from '../../types';
import { usePlayerStore } from '../../stores/usePlayerStore';
import { useAuthStore } from '../../stores/useAuthStore';

interface HistoryItem {
  id: string;
  playedAt: string;
  playedDuration: number;
  song: Song;
}

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffSec < 60) return 'Just now';
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
  return `${Math.floor(diffSec / 86400)}d ago`;
}

export default function HistoryPage() {
  const { user } = useAuthStore();
  const { currentSong, isPlaying, playSong } = usePlayerStore();
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadHistory = async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const res = await api.getHistory();
      setHistory(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, [user]);

  const handleClearHistory = async () => {
    if (!confirm('Clear your entire listening history?')) return;
    try {
      await api.clearHistory();
      setHistory([]);
    } catch (err) {
      console.error(err);
    }
  };

  if (!user) {
    return (
      <div className="text-center py-24 select-none">
        <h2 className="text-2xl font-black text-white">Log in to view Listening History</h2>
        <Link
          href="/auth/login"
          className="inline-block mt-4 px-6 py-2.5 rounded-full bg-primary text-black font-bold text-xs uppercase"
        >
          Log in
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-16 select-none max-w-4xl">
      <div className="flex items-center justify-between border-b border-surface-border/40 pb-4">
        <div>
          <h1 className="text-2xl font-black text-white">Listening History</h1>
          <p className="text-xs text-muted-dim mt-1">Tracks you have played on SonicFlow</p>
        </div>

        {history.length > 0 && (
          <button
            onClick={handleClearHistory}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-surface-elevated hover:bg-red-500/10 text-muted hover:text-red-400 text-xs font-semibold border border-surface-border transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Clear History
          </button>
        )}
      </div>

      {loading ? (
        <div className="text-center py-16 text-muted text-xs animate-pulse">
          Loading history...
        </div>
      ) : history.length === 0 ? (
        <div className="text-center py-20 space-y-3">
          <Clock className="w-12 h-12 text-muted-dim mx-auto stroke-[1.5]" />
          <h3 className="text-lg font-bold text-white">No listening history yet</h3>
          <p className="text-xs text-muted max-w-sm mx-auto">
            Play music from the home page or search to start tracking your listening history.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-surface-border/20">
          {history.map((item) => {
            const song = item.song;
            if (!song) return null;
            const isCurrent = currentSong?.id === song.id;

            return (
              <div
                key={item.id}
                onClick={() => playSong(song)}
                className="group flex items-center justify-between py-3 px-3 rounded-xl hover:bg-surface-elevated/80 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3.5 min-w-0 pr-4">
                  <img
                    src={song.artworkUrl || ''}
                    alt={song.title}
                    className="w-11 h-11 rounded-lg object-cover flex-shrink-0"
                  />
                  <div className="min-w-0">
                    <p
                      className={`text-sm font-semibold truncate ${
                        isCurrent ? 'text-primary' : 'text-white'
                      }`}
                    >
                      {song.title}
                    </p>
                    <p className="text-xs text-muted truncate">{song.artist?.name}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-xs text-muted-dim flex-shrink-0">
                  <span className="hidden sm:inline font-mono">
                    {formatRelativeTime(item.playedAt)}
                  </span>
                  <div className="w-8 h-8 rounded-full bg-primary text-black flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
