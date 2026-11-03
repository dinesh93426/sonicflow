'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Play, Pause, Clock, Heart, Disc3 } from 'lucide-react';
import { api } from '../../../lib/api';
import { Album } from '../../../types';
import { usePlayerStore } from '../../../stores/usePlayerStore';

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s < 10 ? '0' : ''}${s}`;
}

export default function AlbumDetailPage() {
  const params = useParams();
  const { currentSong, isPlaying, playSong, togglePlay } = usePlayerStore();
  const [album, setAlbum] = useState<Album | null>(null);
  const [loading, setLoading] = useState(true);

  const albumId = params?.id as string;

  const loadAlbum = async () => {
    if (!albumId) return;
    try {
      setLoading(true);
      const res = await api.getAlbum(albumId);
      setAlbum(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAlbum();
  }, [albumId]);

  const handleToggleSave = async () => {
    if (!albumId) return;
    try {
      await api.toggleSaveAlbum(albumId);
      await loadAlbum();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-24 text-muted text-xs animate-pulse">
        Loading album...
      </div>
    );
  }

  if (!album) {
    return (
      <div className="text-center py-24 text-white">
        Album not found
      </div>
    );
  }

  const songs = album.songs || [];
  const isCurrentListPlaying =
    isPlaying && songs.some((s) => s.id === currentSong?.id);

  return (
    <div className="space-y-8 pb-16 select-none">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-end gap-6 p-6 sm:p-8 rounded-2xl bg-gradient-to-r from-surface-elevated via-surface-card to-background border border-surface-border/60">
        <div className="w-40 h-40 sm:w-48 sm:h-48 rounded-2xl bg-surface-elevated overflow-hidden flex-shrink-0 shadow-2xl shadow-black/80 border border-surface-border">
          <img
            src={album.coverUrl || ''}
            alt={album.title}
            className="w-full h-full object-cover"
          />
        </div>

        <div className="space-y-2 flex-1 min-w-0">
          <span className="text-[11px] font-bold uppercase tracking-widest text-accent-cyan">
            Album
          </span>

          <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight truncate">
            {album.title}
          </h1>

          <div className="flex items-center gap-2 text-xs text-muted-dim pt-1 flex-wrap">
            <Link
              href={`/artist/${album.artistId}`}
              className="font-bold text-white hover:underline"
            >
              {album.artist?.name}
            </Link>
            <span>•</span>
            <span>{album.releaseYear || '2024'}</span>
            <span>•</span>
            <span>{songs.length} songs</span>
            <span>•</span>
            <span>{Math.round((album.totalDuration || 0) / 60)} min</span>
            {album.genre && (
              <>
                <span>•</span>
                <span className="text-primary font-medium">{album.genre}</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Action Controls */}
      <div className="flex items-center gap-4">
        {songs.length > 0 && (
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
        )}

        <button
          onClick={handleToggleSave}
          className={`p-3 rounded-full border border-surface-border transition-colors ${
            album.isSaved
              ? 'bg-primary/10 border-primary text-primary'
              : 'bg-surface-elevated hover:bg-surface-hover text-muted hover:text-white'
          }`}
          title={album.isSaved ? 'Remove from Your Library' : 'Save to Your Library'}
        >
          <Heart className={`w-5 h-5 ${album.isSaved ? 'fill-primary' : ''}`} />
        </button>
      </div>

      {/* Tracks Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="border-b border-surface-border/60 text-muted-dim uppercase font-semibold text-[11px]">
            <tr>
              <th className="py-3 px-4 w-12 text-center">#</th>
              <th className="py-3 px-4">Title</th>
              <th className="py-3 px-4 hidden md:table-cell">Plays</th>
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
                      song.trackNumber || index + 1
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <p
                      className={`font-semibold truncate ${
                        isCurrent ? 'text-primary' : 'text-white'
                      }`}
                    >
                      {song.title}
                    </p>
                    <p className="text-[11px] text-muted truncate">
                      {album.artist?.name}
                    </p>
                  </td>
                  <td className="py-3 px-4 text-muted hidden md:table-cell font-mono">
                    {song.playCount?.toLocaleString() || 0}
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
    </div>
  );
}
