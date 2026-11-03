'use client';

import React, { useState, useEffect } from 'react';
import { User, Mail, Shield, Calendar, Edit3, Check } from 'lucide-react';
import { useAuthStore } from '../../stores/useAuthStore';
import { api } from '../../lib/api';

export default function ProfilePage() {
  const { user, setUser } = useAuthStore();
  const [editing, setEditing] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [saving, setSaving] = useState(false);
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName);
      setAvatarUrl(user.avatarUrl || '');
      api.getMe().then((res) => {
        setStats(res.data?._count || null);
      }).catch(() => {});
    }
  }, [user]);

  if (!user) {
    return <div className="text-center py-24 text-muted">Please log in to view your profile.</div>;
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await api.updateMe({ displayName, avatarUrl });
      setUser(res.data);
      setEditing(false);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8 pb-16 select-none">
      {/* Profile Header */}
      <div className="p-8 rounded-2xl bg-surface-card border border-surface-border/60 flex flex-col sm:flex-row items-center sm:items-start gap-6 text-center sm:text-left">
        {user.avatarUrl ? (
          <img
            src={user.avatarUrl}
            alt={user.displayName}
            className="w-24 h-24 rounded-full object-cover border-2 border-primary/40 shadow-xl"
          />
        ) : (
          <div className="w-24 h-24 rounded-full bg-primary/20 text-primary flex items-center justify-center font-black text-3xl shadow-xl">
            {user.displayName.charAt(0).toUpperCase()}
          </div>
        )}

        <div className="space-y-2 flex-1">
          <div className="flex items-center justify-center sm:justify-start gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-primary/20 text-primary">
              {user.role}
            </span>
          </div>

          <h1 className="text-2xl font-black text-white">{user.displayName}</h1>
          <p className="text-xs text-muted flex items-center justify-center sm:justify-start gap-1.5">
            <Mail className="w-3.5 h-3.5" />
            {user.email}
          </p>

          <button
            onClick={() => setEditing(!editing)}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-surface-elevated hover:bg-surface-hover text-xs font-semibold text-white border border-surface-border mt-2 transition-colors"
          >
            <Edit3 className="w-3.5 h-3.5" />
            {editing ? 'Cancel' : 'Edit Profile'}
          </button>
        </div>
      </div>

      {/* Edit Profile Form */}
      {editing && (
        <form onSubmit={handleSave} className="p-6 rounded-2xl bg-surface-card border border-surface-border space-y-4 animate-in fade-in duration-150">
          <h3 className="text-sm font-bold text-white">Edit Your Details</h3>
          <div>
            <label className="block text-xs font-semibold text-muted mb-1.5">Display Name</label>
            <input
              type="text"
              required
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full bg-surface-elevated text-white text-xs px-3.5 py-2.5 rounded-lg border border-surface-border focus:border-primary focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-muted mb-1.5">Avatar Image URL</label>
            <input
              type="url"
              placeholder="https://..."
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              className="w-full bg-surface-elevated text-white text-xs px-3.5 py-2.5 rounded-lg border border-surface-border focus:border-primary focus:outline-none"
            />
          </div>
          <button
            type="submit"
            disabled={saving}
            className="px-5 py-2 rounded-lg bg-primary hover:bg-primary-hover text-black text-xs font-bold transition-all disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="p-5 rounded-xl bg-surface-card border border-surface-border/40 text-center space-y-1">
          <p className="text-2xl font-black text-primary">{stats?.playlists || 0}</p>
          <p className="text-xs text-muted font-medium">Playlists</p>
        </div>
        <div className="p-5 rounded-xl bg-surface-card border border-surface-border/40 text-center space-y-1">
          <p className="text-2xl font-black text-primary">{stats?.favoriteSongs || 0}</p>
          <p className="text-xs text-muted font-medium">Liked Songs</p>
        </div>
        <div className="p-5 rounded-xl bg-surface-card border border-surface-border/40 text-center space-y-1">
          <p className="text-2xl font-black text-primary">{stats?.followedArtists || 0}</p>
          <p className="text-xs text-muted font-medium">Followed Artists</p>
        </div>
      </div>
    </div>
  );
}
