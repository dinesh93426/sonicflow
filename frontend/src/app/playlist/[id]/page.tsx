'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Play,
  Pause,
  Clock,
  Trash2,
  Edit2,
  Plus,
  Share2,
  Lock,
  Globe,
  X,
} from 'lucide-react';
import { api } from '../../../lib/api';
import { Playlist, Song } from '../../../types';
import { usePlayerStore } from '../../../stores/usePlayerStore';
import { useAuthStore } from '../../../stores/useAuthStore';
import { SpotifyBadge } from '../../../components/common/SpotifyBadge';

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s < 10 ? '0' : ''}${s}`;
}

export default function PlaylistDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuthStore();
  const { currentSong, isPlaying, playSong, togglePlay } = usePlayerStore();

  const [playlist, setPlaylist] = useState<Playlist | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Edit Modal State
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editPublic, setEditPublic] = useState(true);

  // Add Track Search Modal
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Song[]>([]);

  const playlistId = params?.id as string;

  const loadPlaylist = async () => {
    if (!playlistId) return;
    try {
      setLoading(true);
      setError(null);
      const res = await api.getPlaylist(playlistId);
      setPlaylist(res.data);
      setEditTitle(res.data.title);
      setEditDesc(res.data.description || '');
      setEditPublic(res.data.isPublic);
    } catch (err: any) {
      setError(err.message || 'Failed to load playlist');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPlaylist();
  }, [playlistId]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!playlistId) return;
    try {
      await api.updatePlaylist(playlistId, {
        title: editTitle,
        description: editDesc,
        isPublic: editPublic,
      });
      setIsEditOpen(false);
      await loadPlaylist();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this playlist?')) return;
    try {
      await api.deletePlaylist(playlistId);
      router.push('/library');
    } catch (err) {
      console.error(err);
    }
  };

  const handleRemoveTrack = async (songId: string) => {
    try {
      await api.removeTrackFromPlaylist(playlistId, songId);
      await loadPlaylist();
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddTrack = async (songId: string) => {
    try {
      await api.addTrackToPlaylist(playlistId, songId);
      setIsAddOpen(false);
      await loadPlaylist();
    } catch (err) {
      console.error(err);
    }
  };

  // Search tracks for adding
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    const t = setTimeout(async () => {
      try {
        const res = await api.search(searchQuery.trim());
        setSearchResults(res.data?.songs || []);
      } catch (err) {
        console.error(err);
      }
    }, 250);
    return () => clearTimeout(t);
  }, [searchQuery]);

  if (loading) {
    return (
      <div className="text-center py-24 text-muted text-xs animate-pulse">
        Loading playlist...
      </div>
    );
  }

  if (error || !playlist) {
    return (
      <div className="text-center py-24 space-y-4">
        <h2 className="text-xl font-bold text-white">{error || 'Playlist Not Found'}</h2>
        <button
          onClick={() => router.push('/library')}
          className="px-6 py-2 rounded-full bg-surface-elevated text-xs text-white border border-surface-border"
        >
          Back to Library
        </button>
      </div>
    );
  }

  const tracks = playlist.tracks?.map((t) => t.song).filter(Boolean) || [];
  const isCurrentListPlaying =
    isPlaying && tracks.some((s) => s.id === currentSong?.id);

  return (
    <div className="space-y-8 pb-16 select-none">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-end gap-6 p-6 sm:p-8 rounded-2xl bg-gradient-to-r from-surface-elevated via-surface-card to-background border border-surface-border/60">
        <div className="w-40 h-40 sm:w-48 sm:h-48 rounded-2xl bg-surface-elevated overflow-hidden flex-shrink-0 shadow-2xl shadow-black/80 border border-surface-border">
          <img
            src={playlist.coverUrl || 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=600&q=80'}
            alt={playlist.title}
            className="w-full h-full object-cover"
          />
        </div>

        <div className="space-y-2 flex-1 min-w-0">
          <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-primary">
            {playlist.source === 'spotify' && <SpotifyBadge size="sm" showLabel />}
            {playlist.isPublic ? (
              <span className="flex items-center gap-1">
                <Globe className="w-3.5 h-3.5" /> Public Playlist
              </span>
            ) : (
              <span className="flex items-center gap-1 text-orange-400">
                <Lock className="w-3.5 h-3.5" /> Private Playlist
              </span>
            )}
          </div>

          <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight truncate">
            {playlist.title}
          </h1>

          {playlist.description && (
            <p className="text-xs text-muted leading-relaxed line-clamp-2 max-w-xl">
              {playlist.description}
            </p>
          )}

          <p className="text-xs text-muted-dim flex items-center gap-2 pt-1">
            <span className="font-semibold text-white">
              {playlist.user?.displayName || 'User'}
            </span>
            <span>•</span>
            <span>{tracks.length} tracks</span>
            <span>•</span>
            <span>{Math.round((playlist.totalDuration || 0) / 60)} min</span>
          </p>
        </div>
      </div>

      {/* Action Controls */}
      <div className="flex items-center gap-4">
        {tracks.length > 0 && (
          <button
            onClick={() => {
              if (isCurrentListPlaying) {
                togglePlay();
              } else {
                playSong(tracks[0], tracks);
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

        {playlist.isOwner && (
          <>
            <button
              onClick={() => setIsAddOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-surface-elevated hover:bg-surface-hover text-xs font-semibold text-white border border-surface-border transition-colors"
            >
              <Plus className="w-4 h-4 text-primary" />
              Add Songs
            </button>

            <button
              onClick={() => setIsEditOpen(true)}
              className="p-2.5 rounded-full bg-surface-elevated hover:bg-surface-hover text-muted hover:text-white border border-surface-border transition-colors"
              title="Edit Playlist Details"
            >
              <Edit2 className="w-4 h-4" />
            </button>

            <button
              onClick={handleDelete}
              className="p-2.5 rounded-full bg-surface-elevated hover:bg-red-500/10 text-muted hover:text-red-400 border border-surface-border transition-colors"
              title="Delete Playlist"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </>
        )}
      </div>

      {/* Tracks Table */}
      {tracks.length === 0 ? (
        <div className="text-center py-20 space-y-3">
          <h3 className="text-lg font-bold text-white">This playlist is empty</h3>
          <p className="text-xs text-muted max-w-sm mx-auto">
            {playlist.isOwner
              ? 'Click "Add Songs" above to add tracks from the catalog.'
              : 'The creator has not added any songs yet.'}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-surface-border/60 text-muted-dim uppercase font-semibold text-[11px]">
              <tr>
                <th className="py-3 px-4 w-12 text-center">#</th>
                <th className="py-3 px-4">Title</th>
                <th className="py-3 px-4 hidden md:table-cell">Album</th>
                {playlist.isOwner && <th className="py-3 px-4 w-16 text-center">Action</th>}
                <th className="py-3 px-4 w-20 text-right">
                  <Clock className="w-4 h-4 ml-auto" />
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border/20">
              {tracks.map((song, index) => {
                const isCurrent = currentSong?.id === song.id;
                return (
                  <tr
                    key={`${song.id}-${index}`}
                    onClick={() => playSong(song, tracks)}
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
                          <div className="flex items-center gap-1.5 truncate">
                            <p
                              className={`font-semibold truncate ${
                                isCurrent ? 'text-primary' : 'text-white'
                              }`}
                            >
                              {song.title}
                            </p>
                            {song.source === 'spotify' && <SpotifyBadge size="sm" />}
                          </div>
                          <p className="text-[11px] text-muted truncate">
                            {song.artist?.name}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-muted hidden md:table-cell truncate">
                      {song.album?.title || 'Single'}
                    </td>
                    {playlist.isOwner && (
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveTrack(song.id);
                          }}
                          title="Remove from playlist"
                          className="opacity-0 group-hover:opacity-100 p-1 text-muted hover:text-red-400 transition-opacity"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    )}
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

      {/* Edit Details Modal */}
      {isEditOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-2xl bg-surface-card border border-surface-border p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-surface-border/60 pb-3">
              <h3 className="text-base font-bold text-white">Edit Playlist</h3>
              <button onClick={() => setIsEditOpen(false)} className="text-muted hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-muted mb-1.5">Title</label>
                <input
                  type="text"
                  required
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full bg-surface-elevated text-white text-xs px-3.5 py-2.5 rounded-lg border border-surface-border focus:border-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted mb-1.5">Description</label>
                <textarea
                  rows={3}
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  className="w-full bg-surface-elevated text-white text-xs px-3.5 py-2.5 rounded-lg border border-surface-border focus:border-primary focus:outline-none resize-none"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="editPublic"
                  checked={editPublic}
                  onChange={(e) => setEditPublic(e.target.checked)}
                  className="w-4 h-4 rounded accent-primary cursor-pointer"
                />
                <label htmlFor="editPublic" className="text-xs text-muted cursor-pointer">
                  Public playlist
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditOpen(false)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-muted hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-primary hover:bg-primary-hover text-black text-xs font-bold transition-all"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Track Search Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-lg rounded-2xl bg-surface-card border border-surface-border p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-surface-border/60 pb-3">
              <h3 className="text-base font-bold text-white">Add Songs to Playlist</h3>
              <button onClick={() => setIsAddOpen(false)} className="text-muted hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <input
              type="text"
              autoFocus
              placeholder="Search by song or artist name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-surface-elevated text-white text-xs px-3.5 py-2.5 rounded-lg border border-surface-border focus:border-primary focus:outline-none"
            />

            <div className="max-h-64 overflow-y-auto space-y-2">
              {searchResults.length === 0 ? (
                <p className="text-xs text-muted-dim text-center py-6">
                  {searchQuery ? 'No matching songs found' : 'Type to search songs'}
                </p>
              ) : (
                searchResults.map((song) => (
                  <div
                    key={song.id}
                    className="flex items-center justify-between p-2 rounded-lg hover:bg-surface-elevated transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0 pr-2">
                      <img
                        src={song.artworkUrl || ''}
                        alt={song.title}
                        className="w-9 h-9 rounded object-cover flex-shrink-0"
                      />
                      <div className="truncate">
                        <p className="text-xs font-semibold text-white truncate">{song.title}</p>
                        <p className="text-[11px] text-muted truncate">{song.artist?.name}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleAddTrack(song.id)}
                      className="px-3 py-1.5 rounded-full bg-primary hover:bg-primary-hover text-black text-[11px] font-bold flex-shrink-0"
                    >
                      Add
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
