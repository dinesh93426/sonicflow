'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldCheck, Volume2, Database, Trash2, AlertTriangle } from 'lucide-react';
import { useAuthStore } from '../../stores/useAuthStore';
import { api } from '../../lib/api';

export default function SettingsPage() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const [quality, setQuality] = useState('lossless');
  const [offlineCache, setOfflineCache] = useState(true);
  const [deleting, setDeleting] = useState(false);

  const handleDeleteAccount = async () => {
    if (!confirm('Are you absolutely sure you want to permanently delete your SonicFlow account? All playlists and library data will be removed.')) {
      return;
    }
    setDeleting(true);
    try {
      await api.deleteAccount();
      await logout();
      router.push('/');
    } catch (err) {
      console.error(err);
      setDeleting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8 pb-16 select-none">
      <div>
        <h1 className="text-2xl font-black text-white">Settings</h1>
        <p className="text-xs text-muted-dim mt-1">Manage streaming preferences and your SonicFlow account</p>
      </div>

      {/* Ad-Free Status Banner */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-primary/10 to-surface-card border border-primary/30 flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-primary/20 text-primary flex items-center justify-center flex-shrink-0">
          <ShieldCheck className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-white">Pure Ad-Free Active</h3>
          <p className="text-xs text-muted mt-0.5">
            Your account receives 100% ad-free playback, zero promotional popups, and uninterrupted listening.
          </p>
        </div>
      </div>

      {/* Audio Playback Settings */}
      <section className="p-6 rounded-2xl bg-surface-card border border-surface-border/60 space-y-5">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Volume2 className="w-4 h-4 text-primary" />
          Audio Quality & Delivery
        </h3>

        <div>
          <label className="block text-xs font-semibold text-muted mb-2">Streaming Bitrate</label>
          <div className="grid grid-cols-3 gap-3">
            {[
              { id: 'normal', name: 'Normal (160 kbps)' },
              { id: 'high', name: 'High (320 kbps)' },
              { id: 'lossless', name: 'Lossless (PCM)' },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setQuality(item.id)}
                className={`py-2 px-3 rounded-lg text-xs font-semibold border transition-all text-center ${
                  quality === item.id
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-surface-border text-muted hover:text-white bg-surface-elevated'
                }`}
              >
                {item.name}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between pt-2">
          <div>
            <p className="text-xs font-semibold text-white">Browser Audio Caching</p>
            <p className="text-[11px] text-muted">Cache streamed chunks locally to reduce network usage</p>
          </div>
          <input
            type="checkbox"
            checked={offlineCache}
            onChange={(e) => setOfflineCache(e.target.checked)}
            className="w-4 h-4 rounded accent-primary cursor-pointer"
          />
        </div>
      </section>

      {/* Connected Services: Spotify */}
      {user && (
        <section className="p-6 rounded-2xl bg-surface-card border border-surface-border/60 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#1DB954]/20 border border-[#1DB954]/40 flex items-center justify-center text-[#1DB954]">
                <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
                  <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.498 17.306c-.218.358-.685.473-1.043.255-2.857-1.745-6.455-2.14-10.692-1.172-.41.093-.815-.164-.908-.574-.093-.41.164-.815.574-.908 4.636-1.06 8.608-.611 11.814 1.356.358.218.473.685.255 1.043zm1.467-3.262c-.275.448-.86.592-1.308.317-3.27-2.01-8.256-2.593-12.124-1.418-.503.153-1.037-.134-1.19-.637-.153-.503.134-1.037.637-1.19 4.417-1.34 9.907-.692 13.668 1.62.448.275.592.86.317 1.308zm.126-3.41c-3.922-2.33-10.384-2.544-14.12-1.408-.6.183-1.242-.158-1.424-.758-.182-.6.158-1.242.758-1.424 4.29-1.302 11.423-1.055 15.932 1.62.542.321.72 1.025.398 1.567-.321.542-1.025.72-1.544.403z" />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Spotify Integration</h3>
                <p className="text-xs text-muted">
                  {user.isSpotifyConnected
                    ? `Connected (${user.spotifyProduct || 'account'}) • Web Playback enabled`
                    : 'Connect your Spotify account to import playlists and enable Web Playback'}
                </p>
              </div>
            </div>

            {user.isSpotifyConnected ? (
              <button
                type="button"
                onClick={async () => {
                  if (confirm('Disconnect your Spotify account?')) {
                    await api.disconnectSpotify();
                    window.location.reload();
                  }
                }}
                className="px-4 py-2 rounded-full border border-surface-border text-xs font-semibold text-muted hover:text-red-400 hover:border-red-400/40 transition-colors"
              >
                Disconnect
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  window.location.href = api.getSpotifyLoginUrl('/settings');
                }}
                className="px-5 py-2 rounded-full bg-[#1DB954] hover:bg-[#1ed760] text-black text-xs font-bold transition-all shadow-md shadow-[#1DB954]/20"
              >
                Connect Spotify
              </button>
            )}
          </div>
        </section>
      )}

      {/* Danger Zone: Account Deletion */}
      {user && (
        <section className="p-6 rounded-2xl bg-red-950/20 border border-red-900/30 space-y-4">
          <h3 className="text-sm font-bold text-red-400 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            Danger Zone
          </h3>
          <p className="text-xs text-muted leading-relaxed">
            Deleting your account will permanently wipe your profile, playlists, listening history, and liked songs from the database.
          </p>
          <button
            onClick={handleDeleteAccount}
            disabled={deleting}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-colors disabled:opacity-50"
          >
            <Trash2 className="w-4 h-4" />
            {deleting ? 'Deleting account...' : 'Delete My Account'}
          </button>
        </section>
      )}
    </div>
  );
}
