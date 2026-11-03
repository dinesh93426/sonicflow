'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  X,
  Link as LinkIcon,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Sparkles,
} from 'lucide-react';
import { api } from '../../lib/api';
import { useAuthStore } from '../../stores/useAuthStore';

interface ImportSpotifyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (playlistId: string) => void;
}

export const ImportSpotifyModal: React.FC<ImportSpotifyModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const router = useRouter();
  const { user } = useAuthStore();
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [createdPlaylistId, setCreatedPlaylistId] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleImport = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedUrl = url.trim();
    if (!trimmedUrl) return;

    setError(null);
    setSuccessMessage(null);
    setLoading(true);

    try {
      const res = await api.importSpotifyPlaylist(trimmedUrl);
      const playlist = res.data;
      const count = res.meta?.importedTracksCount || 0;
      const matched = res.meta?.catalogMatchedCount || 0;

      let msg = res.message || `Imported ${count} tracks`;
      if (matched > 0 && !msg.includes('matched')) {
        msg += ` (${matched} matched to local audio)`;
      }

      setSuccessMessage(msg);
      setCreatedPlaylistId(playlist.id);

      if (onSuccess) {
        onSuccess(playlist.id);
      }
    } catch (err: any) {
      const errMsg = err.message || 'Failed to import Spotify playlist';
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleConnectSpotify = () => {
    const currentPath = typeof window !== 'undefined' ? window.location.pathname : '/library';
    window.location.href = api.getSpotifyLoginUrl(currentPath);
  };

  const handleViewPlaylist = () => {
    if (createdPlaylistId) {
      onClose();
      router.push(`/playlist/${createdPlaylistId}`);
    }
  };

  const isAuthError =
    error &&
    (error.toLowerCase().includes('connect') ||
      error.toLowerCase().includes('private') ||
      error.toLowerCase().includes('token') ||
      error.toLowerCase().includes('unauthorized') ||
      error.toLowerCase().includes('reconnect'));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200 select-none">
      <div className="w-full max-w-lg rounded-2xl bg-surface-card border border-surface-border p-6 shadow-2xl shadow-black/80 space-y-5 relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full text-muted hover:text-white hover:bg-surface-elevated transition-colors"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 border-b border-surface-border/60 pb-4">
          <div className="w-10 h-10 rounded-xl bg-[#1DB954]/20 border border-[#1DB954]/40 flex items-center justify-center text-[#1DB954] shadow-md shadow-[#1DB954]/20 flex-shrink-0">
            <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
              <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.498 17.306c-.218.358-.685.473-1.043.255-2.857-1.745-6.455-2.14-10.692-1.172-.41.093-.815-.164-.908-.574-.093-.41.164-.815.574-.908 4.636-1.06 8.608-.611 11.814 1.356.358.218.473.685.255 1.043zm1.467-3.262c-.275.448-.86.592-1.308.317-3.27-2.01-8.256-2.593-12.124-1.418-.503.153-1.037-.134-1.19-.637-.153-.503.134-1.037.637-1.19 4.417-1.34 9.907-.692 13.668 1.62.448.275.592.86.317 1.308zm.126-3.41c-3.922-2.33-10.384-2.544-14.12-1.408-.6.183-1.242-.158-1.424-.758-.182-.6.158-1.242.758-1.424 4.29-1.302 11.423-1.055 15.932 1.62.542.321.72 1.025.398 1.567-.321.542-1.025.72-1.544.403z" />
            </svg>
          </div>
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              Import from Spotify
              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#1DB954]/20 text-[#1DB954]">
                Web API
              </span>
            </h3>
            <p className="text-xs text-muted">
              Sync complete Spotify playlists into your SonicFlow library
            </p>
          </div>
        </div>

        {/* Success Alert */}
        {successMessage && (
          <div className="p-4 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs space-y-2 animate-in fade-in duration-200">
            <div className="flex items-center gap-2 font-bold text-sm text-emerald-200">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
              <span>{successMessage}</span>
            </div>
            <p className="text-[11px] text-emerald-300/80 leading-relaxed">
              All tracks are loaded into your SonicFlow library. You can now stream them via the Web Playback SDK or local files.
            </p>
            <div className="pt-2 flex items-center justify-end">
              <button
                type="button"
                onClick={handleViewPlaylist}
                className="px-4 py-1.5 rounded-full bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold transition-all shadow-md"
              >
                Open Playlist Now
              </button>
            </div>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="p-4 rounded-xl bg-red-500/15 border border-red-500/30 text-red-300 text-xs space-y-2 animate-in fade-in duration-200">
            <div className="flex items-center gap-2 font-bold text-red-200">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>

            {isAuthError && (
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleConnectSpotify}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1DB954] hover:bg-[#1ed760] text-black text-xs font-bold transition-all"
                >
                  <span>Connect Spotify Account</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        )}

        {/* Input Form */}
        {!successMessage && (
          <form onSubmit={handleImport} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-muted mb-2">
                Paste Spotify playlist link *
              </label>
              <div className="relative">
                <LinkIcon className="w-4 h-4 text-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  autoFocus
                  placeholder="https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  disabled={loading}
                  className="w-full bg-surface-elevated text-white text-xs pl-10 pr-3.5 py-3 rounded-lg border border-surface-border focus:border-[#1DB954] focus:outline-none placeholder:text-muted-dim transition-colors"
                />
              </div>
              <p className="text-[11px] text-muted-dim mt-2 leading-relaxed">
                Accepted formats:{' '}
                <span className="font-mono text-muted">https://open.spotify.com/playlist/...</span>{' '}
                or <span className="font-mono text-muted">spotify:playlist:...</span>
              </p>
            </div>

            {/* Spotify Account Connection status notice */}
            {user && (
              <div className="p-3 rounded-xl bg-surface-elevated/80 border border-surface-border/50 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      user.isSpotifyConnected ? 'bg-[#1DB954]' : 'bg-muted-dim'
                    }`}
                  />
                  <span className="text-muted">
                    Spotify Account:{' '}
                    <strong className="text-white">
                      {user.isSpotifyConnected
                        ? `Connected (${user.spotifyProduct || 'standard'})`
                        : 'Not Connected'}
                    </strong>
                  </span>
                </div>

                {!user.isSpotifyConnected && (
                  <button
                    type="button"
                    onClick={handleConnectSpotify}
                    className="text-xs font-semibold text-[#1DB954] hover:underline flex items-center gap-1"
                  >
                    <span>Connect</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-surface-border/60">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="px-4 py-2.5 rounded-full text-xs font-semibold text-muted hover:text-white transition-colors"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={loading || !url.trim()}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-[#1DB954] hover:bg-[#1ed760] text-black text-xs font-bold transition-all disabled:opacity-50 shadow-lg shadow-[#1DB954]/20 hover:scale-105"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Importing Playlist...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Import Playlist</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
