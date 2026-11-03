'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Heart, Play, Pause, Clock, Shuffle } from 'lucide-react';
import { api } from '../../lib/api';
import { Song } from '../../types';
import { usePlayerStore } from '../../stores/usePlayerStore';
import { useAuthStore } from '../../stores/useAuthStore';

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s < 10 ? '0' : ''}${s}`;
}

export default function LikedSongsPage() {
  const { user } = useAuthStore();
  const { currentSong, isPlaying, playSong, togglePlay } = usePlayerStore();
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);

  const loadLikedSongs = async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const res = await api.getLikedSongs();
      setSongs(res.data || []);
    } catch (err) {
      console.error('Failed to load liked songs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLikedSongs();
  }, [user]);

  const handleToggleLike = async (songId: string) => {
    try {
      await api.toggleLikeSong(songId);
      setSongs((prev) => prev.filter((s) => s.id !== songId));
    } catch (err) {
      console.error(err);
    }
  };

  const isCurrentListPlaying =
    isPlaying && songs.some((s) => s.id === currentSong?.id);

  const totalSeconds = songs.reduce((acc, s) => acc + s.duration, 0);

  if (!user) {
    return (
      <div className="text-center py-24 select-none">
        <h2 className="text-2xl font-black text-white">Log in to view your Liked Songs</h2>
        <p className="text-xs text-muted mt-2">All your favorite tracks in one place.</p>
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
    <div className="space-y-8 pb-16 select-none">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-end gap-6 p-6 sm:p-8 rounded-2xl bg-gradient-to-r from-violet-900/80 via-indigo-950/60 to-surface border border-surface-border/60">
        <div className="w-40 h-40 sm:w-48 sm:h-48 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-700 flex items-center justify-center flex-shrink-0 shadow-2xl shadow-violet-900/60">
          <Heart className="w-20 h-20 text-white fill-white" />
        </div>

        <div className="space-y-2">
          <span className="text-[11px] font-bold uppercase tracking-widest text-violet-300">
            Playlist
          </span>
          <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
            Liked Songs
          </h1>
          <p className="text-xs text-muted-dim flex items-center gap-2 pt-1">
            <span className="font-semibold text-white">{user.displayName}</span>
            <span>•</span>
            <span>{songs.length} songs</span>
            <span>•</span>
            <span>{Math.round(totalSeconds / 60)} min</span>
          </p>
        </div>
      </div>

      {/* Action Controls */}
      {songs.length > 0 && (
        <div className="flex items-center gap-4">
          <button
            onClick={() => {
              if (isCurrentListPlaying) {
                togglePlay();
              } else {
                playSong(songs[0], songs);
              }
            }}
            className="w-14 h-14 rounded-full bg-primary hover:bg-primary-hover text-black flex items-center justify-center shadow-xl shadow-primary/25 hover:scale-105 transition-all"
          >
            {isCurrentListPlaying ? (
              <Pause className="w-6 h-6 fill-current" />
            ) : (
              <Play className="w-6 h-6 fill-current ml-0.5" />
            )}
          </button>
        </div>
      )}

      {/* Tracks Table */}
      {loading ? (
        <div className="text-center py-16 text-muted text-xs animate-pulse">
          Loading your favorites...
        </div>
      ) : songs.length === 0 ? (
        <div className="text-center py-20 space-y-3">
          <Heart className="w-12 h-12 text-muted-dim mx-auto stroke-[1.5]" />
          <h3 className="text-lg font-bold text-white">Songs you like will appear here</h3>
          <p className="text-xs text-muted max-w-sm mx-auto">
            Save songs by tapping the heart icon while exploring or playing music.
          </p>
          <Link
            href="/search"
            className="inline-block mt-2 px-6 py-2 rounded-full bg-surface-elevated hover:bg-surface-hover text-xs font-semibold text-white border border-surface-border"
          >
            Find music
          </Link>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-surface-border/60 text-muted-dim uppercase font-semibold text-[11px]">
              <tr>
                <th className="py-3 px-4 w-12 text-center">#</th>
                <th className="py-3 px-4">Title</th>
                <th className="py-3 px-4 hidden md:table-cell">Album</th>
                <th className="py-3 px-4 w-16 text-center">
                  <Heart className="w-4 h-4 mx-auto" />
                </th>
                <th className="py-3 px-4 w-20 text-right">
                  <Clock className="w-4 h-4 ml-auto" />
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border/20">
              {songs.map((song, index) => {
                const isCurrent = currentSong?.id === song.id;
                return (
                  <tr
                    key={song.id}
                    onClick={() => playSong(song, songs)}
                    className="group hover:bg-surface-elevated/80 transition-colors cursor-pointer"
                  >
                    <td className="py-3 px-4 text-center text-muted group-hover:text-white font-mono">
                      {isCurrent && isPlaying ? (
                        <span className="w-2.5 h-2.5 rounded-full bg-primary inline-block animate-pulse" />
                      ) : (
                        index + 1
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={song.artworkUrl || ''}
                          alt={song.title}
                          className="w-10 h-10 rounded object-cover flex-shrink-0"
                        />
                        <div className="min-w-0">
                          <p
                            className={`font-semibold truncate ${
                              isCurrent ? 'text-primary' : 'text-white'
                            }`}
                          >
                            {song.title}
                          </p>
                          <p className="text-[11px] text-muted truncate">
                            {song.artist?.name}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-muted hidden md:table-cell truncate">
                      {song.album?.title || 'Single'}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleLike(song.id);
                        }}
                        className="text-primary hover:scale-110 transition-transform p-1"
                      >
                        <Heart className="w-4 h-4 fill-primary" />
                      </button>
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-muted">
                      {formatDuration(song.duration)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
