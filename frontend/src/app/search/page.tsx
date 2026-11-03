'use client';

import React, { useState, useEffect } from 'react';
import { Search, Music, Disc3, User, Radio, X } from 'lucide-react';
import { api } from '../../lib/api';
import { SearchResults, Genre } from '../../types';
import { SongCard } from '../../components/cards/SongCard';
import { AlbumCard } from '../../components/cards/AlbumCard';
import { ArtistCard } from '../../components/cards/ArtistCard';
import { PlaylistCard } from '../../components/cards/PlaylistCard';

type Tab = 'all' | 'songs' | 'artists' | 'albums' | 'playlists';

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState<Tab>('all');
  const [results, setResults] = useState<SearchResults>({
    songs: [],
    artists: [],
    albums: [],
    playlists: [],
  });
  const [genres, setGenres] = useState<Genre[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.getGenres().then((res) => setGenres(res.data || [])).catch(() => {});
  }, []);

  // Debounced search
  useEffect(() => {
    if (!query.trim()) {
      setResults({ songs: [], artists: [], albums: [], playlists: [] });
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await api.search(query.trim());
        setResults(res.data || { songs: [], artists: [], albums: [], playlists: [] });
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const hasResults =
    results.songs.length > 0 ||
    results.artists.length > 0 ||
    results.albums.length > 0 ||
    results.playlists.length > 0;

  return (
    <div className="space-y-8 pb-12 select-none">
      {/* Search Header Bar */}
      <div className="max-w-xl relative">
        <Search className="w-5 h-5 text-muted absolute left-4 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="What do you want to listen to?"
          className="w-full bg-surface-elevated text-white placeholder-muted pl-12 pr-10 py-3.5 rounded-full border border-surface-border/60 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary text-sm font-medium transition-all"
        />
        {query && (
          <button
            onClick={() => setQuery('')}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-muted hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Tabs */}
      {query.trim() && (
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {(['all', 'songs', 'artists', 'albums', 'playlists'] as Tab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold capitalize transition-all ${
                activeTab === tab
                  ? 'bg-primary text-black shadow-md shadow-primary/20'
                  : 'bg-surface-elevated text-muted hover:text-white hover:bg-surface-hover'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      )}

      {/* Search Results */}
      {query.trim() ? (
        loading ? (
          <div className="text-center py-16 text-muted text-sm animate-pulse">
            Searching SonicFlow catalog...
          </div>
        ) : !hasResults ? (
          <div className="text-center py-16 space-y-2">
            <h3 className="text-lg font-bold text-white">No results found for "{query}"</h3>
            <p className="text-xs text-muted">
              Check spelling or try searching for another artist, song, or album.
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Songs Results */}
            {(activeTab === 'all' || activeTab === 'songs') && results.songs.length > 0 && (
              <section className="space-y-4">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Music className="w-4 h-4 text-primary" />
                  Songs
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {results.songs.map((song) => (
                    <SongCard key={song.id} song={song} queueContext={results.songs} />
                  ))}
                </div>
              </section>
            )}

            {/* Artists Results */}
            {(activeTab === 'all' || activeTab === 'artists') && results.artists.length > 0 && (
              <section className="space-y-4">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <User className="w-4 h-4 text-orange-400" />
                  Artists
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {results.artists.map((artist) => (
                    <ArtistCard key={artist.id} artist={artist} />
                  ))}
                </div>
              </section>
            )}

            {/* Albums Results */}
            {(activeTab === 'all' || activeTab === 'albums') && results.albums.length > 0 && (
              <section className="space-y-4">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Disc3 className="w-4 h-4 text-accent-cyan" />
                  Albums
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {results.albums.map((album) => (
                    <AlbumCard key={album.id} album={album} />
                  ))}
                </div>
              </section>
            )}

            {/* Playlists Results */}
            {(activeTab === 'all' || activeTab === 'playlists') && results.playlists.length > 0 && (
              <section className="space-y-4">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Radio className="w-4 h-4 text-primary" />
                  Playlists
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {results.playlists.map((playlist) => (
                    <PlaylistCard key={playlist.id} playlist={playlist} />
                  ))}
                </div>
              </section>
            )}
          </div>
        )
      ) : (
        /* Empty Query: Browse All Genres */
        <div className="space-y-6">
          <h2 className="text-2xl font-black text-white">Browse All Categories</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {genres.map((genre) => (
              <div
                key={genre.id}
                onClick={() => setQuery(genre.name)}
                style={{ backgroundColor: genre.color || '#10b981' }}
                className="h-36 rounded-2xl p-5 flex flex-col justify-between cursor-pointer hover:scale-105 transition-transform duration-200 shadow-lg shadow-black/40 relative overflow-hidden"
              >
                <h3 className="text-lg font-extrabold text-white leading-tight">
                  {genre.name}
                </h3>
                <span className="text-[10px] uppercase font-bold tracking-wider text-black/80 bg-white/70 px-2 py-0.5 rounded-full w-max">
                  Explore
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
