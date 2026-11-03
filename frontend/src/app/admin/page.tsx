'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  ShieldAlert,
  Users,
  Music,
  Disc3,
  User,
  Radio,
  Play,
  AlertTriangle,
  Plus,
  Trash2,
  CheckCircle,
  XCircle,
  Upload,
  X,
} from 'lucide-react';
import { api } from '../../lib/api';
import { DashboardMetrics, Song, User as UserType, Artist, Album } from '../../types';
import { useAuthStore } from '../../stores/useAuthStore';

export default function AdminDashboardPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [songs, setSongs] = useState<Song[]>([]);
  const [usersList, setUsersList] = useState<UserType[]>([]);
  const [artists, setArtists] = useState<Artist[]>([]);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [loading, setLoading] = useState(true);

  // New Song Modal State
  const [isAddSongOpen, setIsAddSongOpen] = useState(false);
  const [songTitle, setSongTitle] = useState('');
  const [selectedArtistId, setSelectedArtistId] = useState('');
  const [selectedAlbumId, setSelectedAlbumId] = useState('');
  const [songGenre, setSongGenre] = useState('Electronic');
  const [duration, setDuration] = useState('180');
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [artworkFile, setArtworkFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const loadAdminData = async () => {
    try {
      setLoading(true);
      const [metricsRes, songsRes, usersRes, artistsRes, albumsRes] =
        await Promise.all([
          api.getAdminDashboard(),
          api.getSongs({ limit: 50 }),
          api.getAdminUsers(),
          api.getArtists({ limit: 50 }),
          api.getAlbums({ limit: 50 }),
        ]);

      setMetrics(metricsRes.data);
      setSongs(songsRes.data || []);
      setUsersList(usersRes.data || []);
      setArtists(artistsRes.data || []);
      setAlbums(albumsRes.data || []);
    } catch (err) {
      console.error('Failed to load admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && (user.role === 'ADMIN' || user.role === 'CONTENT_MANAGER')) {
      loadAdminData();
    }
  }, [user]);

  if (!user || (user.role !== 'ADMIN' && user.role !== 'CONTENT_MANAGER')) {
    return (
      <div className="text-center py-24 select-none">
        <ShieldAlert className="w-12 h-12 text-red-400 mx-auto mb-3" />
        <h2 className="text-xl font-bold text-white">Access Restricted</h2>
        <p className="text-xs text-muted mt-1">This area requires administrative privileges.</p>
      </div>
    );
  }

  const handleDeleteSong = async (id: string) => {
    if (!confirm('Are you sure you want to delete this track?')) return;
    try {
      await api.deleteSong(id);
      await loadAdminData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleAvailability = async (song: Song) => {
    try {
      await api.updateSong(song.id, { isAvailable: !song.isAvailable });
      await loadAdminData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateRole = async (targetUserId: string, newRole: string) => {
    try {
      await api.updateUserRole(targetUserId, newRole);
      await loadAdminData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateSongSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!songTitle.trim() || !selectedArtistId || !audioFile) {
      alert('Please fill title, select artist, and choose an audio file.');
      return;
    }

    setUploading(true);
    try {
      // 1. Upload audio file
      const audioFormData = new FormData();
      audioFormData.append('file', audioFile);
      const audioUploadRes = await api.uploadFile(audioFormData);

      // 2. Upload artwork file if selected
      let artworkUrl = 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=600&q=80';
      if (artworkFile) {
        const artFormData = new FormData();
        artFormData.append('file', artworkFile);
        const artUploadRes = await api.uploadFile(artFormData);
        artworkUrl = artUploadRes.data.publicUrl;
      }

      // 3. Create Song record
      await api.createSong({
        title: songTitle.trim(),
        artistId: selectedArtistId,
        albumId: selectedAlbumId || undefined,
        duration: parseInt(duration, 10) || 180,
        genre: songGenre,
        storageKey: audioUploadRes.data.storageKey,
        audioUrl: audioUploadRes.data.publicUrl,
        artworkUrl,
      });

      setIsAddSongOpen(false);
      setSongTitle('');
      setAudioFile(null);
      setArtworkFile(null);
      await loadAdminData();
    } catch (err: any) {
      alert(`Upload failed: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-10 pb-20 select-none">
      {/* Admin Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-surface-border/40 pb-4">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2.5">
            <ShieldAlert className="w-6 h-6 text-primary" />
            SonicFlow Management Console
          </h1>
          <p className="text-xs text-muted-dim mt-1">
            Real-time catalog analytics and administrative controls
          </p>
        </div>

        <button
          onClick={() => setIsAddSongOpen(true)}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary hover:bg-primary-hover text-black text-xs font-bold transition-all shadow-lg shadow-primary/25 hover:scale-105"
        >
          <Plus className="w-4 h-4" />
          Upload New Song
        </button>
      </div>

      {/* Metrics Cards Grid */}
      {metrics && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { label: 'Total Users', value: metrics.totalUsers, icon: Users, color: 'text-blue-400' },
            { label: 'Active Tracks', value: metrics.totalSongs, icon: Music, color: 'text-primary' },
            { label: 'Albums', value: metrics.totalAlbums, icon: Disc3, color: 'text-cyan-400' },
            { label: 'Artists', value: metrics.totalArtists, icon: User, color: 'text-orange-400' },
            { label: 'Playlists', value: metrics.totalPlaylists, icon: Radio, color: 'text-violet-400' },
            { label: 'Total Plays', value: metrics.totalPlaybacks, icon: Play, color: 'text-emerald-400' },
          ].map((m, i) => {
            const Icon = m.icon;
            return (
              <div
                key={i}
                className="p-4 rounded-xl bg-surface-card border border-surface-border/60 flex flex-col justify-between"
              >
                <div className="flex items-center justify-between text-muted-dim">
                  <span className="text-[11px] font-semibold">{m.label}</span>
                  <Icon className={`w-4 h-4 ${m.color}`} />
                </div>
                <p className="text-2xl font-black text-white mt-2 font-mono">
                  {m.value.toLocaleString()}
                </p>
              </div>
            );
          })}
        </div>
      )}

      {/* Songs Management Table */}
      <section className="space-y-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <Music className="w-5 h-5 text-primary" />
          Catalog Songs ({songs.length})
        </h2>

        <div className="overflow-x-auto rounded-xl border border-surface-border/60 bg-surface-card">
          <table className="w-full text-left text-xs">
            <thead className="bg-surface-elevated text-muted-dim uppercase font-semibold text-[11px] border-b border-surface-border">
              <tr>
                <th className="py-3 px-4">Title</th>
                <th className="py-3 px-4">Artist</th>
                <th className="py-3 px-4 hidden md:table-cell">Genre</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Plays</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border/30">
              {songs.map((song) => (
                <tr key={song.id} className="hover:bg-surface-elevated/50 transition-colors">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={song.artworkUrl || ''}
                        alt={song.title}
                        className="w-9 h-9 rounded object-cover flex-shrink-0"
                      />
                      <span className="font-semibold text-white truncate max-w-[200px]">
                        {song.title}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-muted truncate">{song.artist?.name}</td>
                  <td className="py-3 px-4 text-muted hidden md:table-cell">{song.genre || 'Various'}</td>
                  <td className="py-3 px-4 text-center">
                    <button
                      onClick={() => handleToggleAvailability(song)}
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        song.isAvailable
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-red-500/10 text-red-400 border border-red-500/20'
                      }`}
                    >
                      {song.isAvailable ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                      {song.isAvailable ? 'Available' : 'Disabled'}
                    </button>
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-muted">
                    {song.playCount?.toLocaleString() || 0}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => handleDeleteSong(song.id)}
                      className="p-1.5 text-muted hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
                      title="Delete Song"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Users Role Management (ADMIN only) */}
      {user.role === 'ADMIN' && (
        <section className="space-y-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-400" />
            Registered Users & Permissions ({usersList.length})
          </h2>

          <div className="overflow-x-auto rounded-xl border border-surface-border/60 bg-surface-card">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-elevated text-muted-dim uppercase font-semibold text-[11px] border-b border-surface-border">
                <tr>
                  <th className="py-3 px-4">User</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4 text-right">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border/30">
                {usersList.map((u) => (
                  <tr key={u.id} className="hover:bg-surface-elevated/50 transition-colors">
                    <td className="py-3 px-4 font-semibold text-white">{u.displayName}</td>
                    <td className="py-3 px-4 text-muted">{u.email}</td>
                    <td className="py-3 px-4">
                      <select
                        value={u.role}
                        onChange={(e) => handleUpdateRole(u.id, e.target.value)}
                        disabled={u.id === user.id}
                        className="bg-surface-elevated text-white text-xs px-2.5 py-1 rounded border border-surface-border focus:border-primary focus:outline-none cursor-pointer"
                      >
                        <option value="USER">USER</option>
                        <option value="CONTENT_MANAGER">CONTENT_MANAGER</option>
                        <option value="ADMIN">ADMIN</option>
                      </select>
                    </td>
                    <td className="py-3 px-4 text-right text-muted-dim font-mono">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Upload Song Modal */}
      {isAddSongOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-lg rounded-2xl bg-surface-card border border-surface-border p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-surface-border/60 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Upload className="w-4 h-4 text-primary" />
                Upload Authorized Audio Track
              </h3>
              <button onClick={() => setIsAddSongOpen(false)} className="text-muted hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSongSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-muted mb-1">Song Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Celestial Aurora"
                  value={songTitle}
                  onChange={(e) => setSongTitle(e.target.value)}
                  className="w-full bg-surface-elevated text-white text-xs px-3.5 py-2.5 rounded-lg border border-surface-border focus:border-primary focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-muted mb-1">Artist *</label>
                  <select
                    required
                    value={selectedArtistId}
                    onChange={(e) => setSelectedArtistId(e.target.value)}
                    className="w-full bg-surface-elevated text-white text-xs px-3 py-2.5 rounded-lg border border-surface-border focus:border-primary focus:outline-none"
                  >
                    <option value="">Select Artist...</option>
                    {artists.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-muted mb-1">Album (Optional)</label>
                  <select
                    value={selectedAlbumId}
                    onChange={(e) => setSelectedAlbumId(e.target.value)}
                    className="w-full bg-surface-elevated text-white text-xs px-3 py-2.5 rounded-lg border border-surface-border focus:border-primary focus:outline-none"
                  >
                    <option value="">None / Single</option>
                    {albums.map((alb) => (
                      <option key={alb.id} value={alb.id}>
                        {alb.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-muted mb-1">Genre</label>
                  <input
                    type="text"
                    value={songGenre}
                    onChange={(e) => setSongGenre(e.target.value)}
                    className="w-full bg-surface-elevated text-white text-xs px-3.5 py-2.5 rounded-lg border border-surface-border focus:border-primary focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted mb-1">Duration (Seconds)</label>
                  <input
                    type="number"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    className="w-full bg-surface-elevated text-white text-xs px-3.5 py-2.5 rounded-lg border border-surface-border focus:border-primary focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted mb-1">Audio File (.mp3, .wav) *</label>
                <input
                  type="file"
                  required
                  accept="audio/*"
                  onChange={(e) => setAudioFile(e.target.files?.[0] || null)}
                  className="w-full text-xs text-muted file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-surface-elevated file:text-primary hover:file:bg-surface-hover cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted mb-1">Artwork Image (.jpg, .png, .webp)</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setArtworkFile(e.target.files?.[0] || null)}
                  className="w-full text-xs text-muted file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-surface-elevated file:text-primary hover:file:bg-surface-hover cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-surface-border/60">
                <button
                  type="button"
                  onClick={() => setIsAddSongOpen(false)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-muted hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="px-6 py-2.5 rounded-lg bg-primary hover:bg-primary-hover text-black text-xs font-bold transition-all disabled:opacity-50"
                >
                  {uploading ? 'Uploading & Processing...' : 'Save & Distribute'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
