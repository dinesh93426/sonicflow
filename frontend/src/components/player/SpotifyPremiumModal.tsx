'use client';

import React from 'react';
import { X, Sparkles, ExternalLink, ShieldCheck } from 'lucide-react';
import { usePlayerStore } from '../../stores/usePlayerStore';
import { api } from '../../lib/api';

export const SpotifyPremiumModal: React.FC = () => {
  const { spotifyPremiumModalOpen, setSpotifyPremiumModalOpen } = usePlayerStore();

  if (!spotifyPremiumModalOpen) return null;

  const handleConnectSpotify = () => {
    // Redirect to Spotify PKCE OAuth flow on backend
    const currentPath = typeof window !== 'undefined' ? window.location.pathname : '/library';
    window.location.href = api.getSpotifyLoginUrl(currentPath);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200 select-none">
      <div className="w-full max-w-md rounded-2xl bg-surface-card border border-surface-border p-6 shadow-2xl shadow-black/80 space-y-5 relative">
        {/* Close Button */}
        <button
          onClick={() => setSpotifyPremiumModalOpen(false)}
          className="absolute top-4 right-4 p-1.5 rounded-full text-muted hover:text-white hover:bg-surface-elevated transition-colors"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Icon */}
        <div className="w-14 h-14 rounded-2xl bg-[#1DB954]/20 border border-[#1DB954]/40 flex items-center justify-center text-[#1DB954] shadow-lg shadow-[#1DB954]/20">
          <svg className="w-8 h-8 fill-current" viewBox="0 0 24 24">
            <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.498 17.306c-.218.358-.685.473-1.043.255-2.857-1.745-6.455-2.14-10.692-1.172-.41.093-.815-.164-.908-.574-.093-.41.164-.815.574-.908 4.636-1.06 8.608-.611 11.814 1.356.358.218.473.685.255 1.043zm1.467-3.262c-.275.448-.86.592-1.308.317-3.27-2.01-8.256-2.593-12.124-1.418-.503.153-1.037-.134-1.19-.637-.153-.503.134-1.037.637-1.19 4.417-1.34 9.907-.692 13.668 1.62.448.275.592.86.317 1.308zm.126-3.41c-3.922-2.33-10.384-2.544-14.12-1.408-.6.183-1.242-.158-1.424-.758-.182-.6.158-1.242.758-1.424 4.29-1.302 11.423-1.055 15.932 1.62.542.321.72 1.025.398 1.567-.321.542-1.025.72-1.544.403z" />
          </svg>
        </div>

        {/* Message */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#1DB954]/10 border border-[#1DB954]/25 text-[11px] font-semibold text-[#1DB954]">
            <Sparkles className="w-3.5 h-3.5" />
            Spotify Web Playback
          </div>

          <h3 className="text-xl font-black text-white tracking-tight">
            Connect a Spotify Premium account to play imported songs
          </h3>

          <p className="text-xs text-muted leading-relaxed">
            The official Spotify Web Playback SDK requires an active Spotify Premium subscription to stream full audio tracks in third-party web apps without audio ripping or piracy.
          </p>
        </div>

        {/* Features bullet points */}
        <div className="p-3.5 rounded-xl bg-surface-elevated/70 border border-surface-border/60 space-y-2 text-xs text-muted">
          <div className="flex items-center gap-2 text-white">
            <ShieldCheck className="w-4 h-4 text-[#1DB954] flex-shrink-0" />
            <span>Pure official playback via Spotify Connect</span>
          </div>
          <div className="flex items-center gap-2 text-white">
            <ShieldCheck className="w-4 h-4 text-[#1DB954] flex-shrink-0" />
            <span>Local catalog tracks play automatically from local files</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={() => setSpotifyPremiumModalOpen(false)}
            className="px-4 py-2.5 rounded-full text-xs font-semibold text-muted hover:text-white transition-colors"
          >
            Dismiss
          </button>

          <button
            type="button"
            onClick={handleConnectSpotify}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-[#1DB954] hover:bg-[#1ed760] text-black text-xs font-bold shadow-lg shadow-[#1DB954]/25 transition-all hover:scale-105"
          >
            <span>Connect Spotify</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
