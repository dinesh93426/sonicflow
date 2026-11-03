'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus, Heart, Disc3, User, Radio, X } from 'lucide-react';
import { api } from '../../lib/api';
import { Playlist, Album, Artist } from '../../types';
import { useAuthStore } from '../../stores/useAuthStore';
import { PlaylistCard } from '../../components/cards/PlaylistCard';
import { AlbumCard } from '../../components/cards/AlbumCard';
import { ArtistCard } from '../../components/cards/ArtistCard';
import { ImportSpotifyModal } from '../../components/common/ImportSpotifyModal';

type LibraryTab = 'playlists' | 'albums' | 'artists';

export default function LibraryPage() {
  const { user, checkAuth } = useAuthStore();
  const [activeTab, setActiveTab] = useState<LibraryTab>('playlists');
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [artists, setArtists] = useState<Artist[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSpotifyModalOpen, setIsSpotifyModalOpen] = useState(false);
  const [spotifyBanner, setSpotifyBanner] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [creating, setCreating] = useState(false);

  const loadData = async () => {
    if (!user) return;
    try {
      const [plRes, albRes, artRes] = await Promise.all([
        api.getUserPlaylists().catch(() => ({ data: [] })),
        api.getSavedAlbums().catch(() => ({ data: [] })),
        api.getFollowedArtists().catch(() => ({ data: [] })),
      ]);
      setPlaylists(plRes.data || []);
      setAlbums(albRes.data || []);
      setArtists(artRes.data || []);
    } catch (err) {
      console.error('Error fetching library:', err);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('spotify') === 'connected') {
        const isPrem = urlParams.get('premium') === '1';
        setSpotifyBanner(
          `Spotify account successfully connected! ${
            isPrem ? 'Spotify Premium active.' : 'Free account detected (Premium required for Web SDK streaming).'
          }`
        );
        checkAuth();
        window.history.replaceState({}, document.title, window.location.pathname);
      } else if (urlParams.get('spotify_error')) {
        setSpotifyBanner(`Spotify notice: ${urlParams.get('spotify_error')}`);
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    }
  }, []);

  const handleCreatePlaylist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    setCreating(true);
    try {
      await api.createPlaylist({
        title: newTitle.trim(),
        description: newDescription.trim(),
        isPublic,
      });
      setNewTitle('');
      setNewDescription('');
      setIsModalOpen(false);
      await loadData();
    } catch (err) {
      console.error('Failed to create playlist:', err);
    } finally {
      setCreating(false);
    }
  };

  if (!user) {
    return (
      <div className="text-center py-24 space-y-4 max-w-md mx-auto select-none">
        <div className="w-16 h-16 rounded-full bg-surface-elevated mx-auto flex items-center justify-center text-primary">
          <Radio className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-black text-white">Your Library Awaits</h2>
        <p className="text-sm text-muted">
          Log in to save songs, create custom playlists, and follow your favorite artists.
        </p>
        <Link
          href="/auth/login"
          className="inline-block px-8 py-3 rounded-full bg-primary text-black font-bold text-xs uppercase tracking-wider hover:bg-primary-hover shadow-lg shadow-primary/20 transition-all hover:scale-105"
        >
          Log in now
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12 select-none">
      {/* Spotify Connection Notice Banner */}
      {spotifyBanner && (
        <div className="p-3.5 rounded-xl bg-[#1DB954]/15 border border-[#1DB954]/30 text-[#1DB954] text-xs flex items-center justify-between animate-in fade-in duration-200">
          <div className="flex items-center gap-2.5">
            <svg className="w-4 h-4 fill-current flex-shrink-0" viewBox="0 0 24 24">
              <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.498 17.306c-.218.358-.685.473-1.043.255-2.857-1.745-6.455-2.14-10.692-1.172-.41.093-.815-.164-.908-.574-.093-.41.164-.815.574-.908 4.636-1.06 8.608-.611 11.814 1.356.358.218.473.685.255 1.043zm1.467-3.262c-.275.448-.86.592-1.308.317-3.27-2.01-8.256-2.593-12.124-1.418-.503.153-1.037-.134-1.19-.637-.153-.503.134-1.037.637-1.19 4.417-1.34 9.907-.692 13.668 1.62.448.275.592.86.317 1.308zm.126-3.41c-3.922-2.33-10.384-2.544-14.12-1.408-.6.183-1.242-.158-1.424-.758-.182-.6.158-1.242.758-1.424 4.29-1.302 11.423-1.055 15.932 1.62.542.321.72 1.025.398 1.567-.321.542-1.025.72-1.544.403z" />
            </svg>
            <span>{spotifyBanner}</span>
          </div>
          <button
            onClick={() => setSpotifyBanner(null)}
            className="text-muted hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Top Header & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-surface-border/40 pb-4">
        <div className="flex items-center gap-2">
          {(['playlists', 'albums', 'artists'] as LibraryTab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-full text-xs font-bold capitalize transition-all ${
                activeTab === tab
                  ? 'bg-white text-black shadow-md'
                  : 'bg-surface-elevated text-muted hover:text-white'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <button
            onClick={() => setIsSpotifyModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#1DB954]/15 hover:bg-[#1DB954]/25 text-[#1DB954] border border-[#1DB954]/30 text-xs font-bold transition-all hover:scale-105"
          >
            <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
              <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.498 17.306c-.218.358-.685.473-1.043.255-2.857-1.745-6.455-2.14-10.692-1.172-.41.093-.815-.164-.908-.574-.093-.41.164-.815.574-.908 4.636-1.06 8.608-.611 11.814 1.356.358.218.473.685.255 1.043zm1.467-3.262c-.275.448-.86.592-1.308.317-3.27-2.01-8.256-2.593-12.124-1.418-.503.153-1.037-.134-1.19-.637-.153-.503.134-1.037.637-1.19 4.417-1.34 9.907-.692 13.668 1.62.448.275.592.86.317 1.308zm.126-3.41c-3.922-2.33-10.384-2.544-14.12-1.408-.6.183-1.242-.158-1.424-.758-.182-.6.158-1.242.758-1.424 4.29-1.302 11.423-1.055 15.932 1.62.542.321.72 1.025.398 1.567-.321.542-1.025.72-1.544.403z" />
            </svg>
            Import from Spotify
          </button>

          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary hover:bg-primary-hover text-black text-xs font-bold transition-all shadow-md shadow-primary/20 hover:scale-105"
          >
            <Plus className="w-4 h-4" />
            Create Playlist
          </button>
        </div>
      </div>

      {/* Content depending on active tab */}
      {activeTab === 'playlists' && (
        <div className="space-y-4">
          {/* Quick link to Liked Songs */}
          <Link
            href="/liked-songs"
            className="flex items-center gap-4 p-4 rounded-xl bg-gradient-to-r from-violet-900/60 to-surface-card border border-surface-border/60 hover:border-primary/40 transition-all group max-w-md"
          >
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-violet-600 to-indigo-700 flex items-center justify-center flex-shrink-0 shadow-lg shadow-violet-900/40">
              <Heart className="w-6 h-6 text-white fill-white" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white group-hover:text-primary transition-colors">
                Liked Songs
              </h3>
              <p className="text-xs text-muted-dim">Your personal collection of favorites</p>
            </div>
          </Link>

          {playlists.length === 0 ? (
            <div className="text-center py-16 text-muted text-xs">
              No playlists created yet. Click "Create Playlist" above!
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 pt-2">
              {playlists.map((pl) => (
                <PlaylistCard key={pl.id} playlist={pl} />
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'albums' && (
        <div>
          {albums.length === 0 ? (
            <div className="text-center py-16 text-muted text-xs">
              No saved albums yet. Save albums from the discovery page!
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {albums.map((alb) => (
                <AlbumCard key={alb.id} album={alb} />
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'artists' && (
        <div>
          {artists.length === 0 ? (
            <div className="text-center py-16 text-muted text-xs">
              No followed artists yet. Follow artists to personalize your flow!
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {artists.map((art) => (
                <ArtistCard key={art.id} artist={art} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Create Playlist Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-2xl bg-surface-card border border-surface-border p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-surface-border/60 pb-3">
              <h3 className="text-base font-bold text-white">Create New Playlist</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-muted hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreatePlaylist} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-muted mb-1.5">
                  Playlist Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Midnight Focus Beats"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full bg-surface-elevated text-white text-xs px-3.5 py-2.5 rounded-lg border border-surface-border focus:border-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted mb-1.5">
                  Description (Optional)
                </label>
                <textarea
                  rows={3}
                  placeholder="Give your playlist a custom description..."
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="w-full bg-surface-elevated text-white text-xs px-3.5 py-2.5 rounded-lg border border-surface-border focus:border-primary focus:outline-none resize-none"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isPublic"
                  checked={isPublic}
                  onChange={(e) => setIsPublic(e.target.checked)}
                  className="w-4 h-4 rounded accent-primary bg-surface-elevated cursor-pointer"
                />
                <label htmlFor="isPublic" className="text-xs text-muted cursor-pointer">
                  Make playlist public to other listeners
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-muted hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating || !newTitle.trim()}
                  className="px-5 py-2 rounded-lg bg-primary hover:bg-primary-hover text-black text-xs font-bold transition-all disabled:opacity-50"
                >
                  {creating ? 'Creating...' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Import from Spotify Modal */}
      <ImportSpotifyModal
        isOpen={isSpotifyModalOpen}
        onClose={() => setIsSpotifyModalOpen(false)}
        onSuccess={() => loadData()}
      />
    </div>
  );
}
