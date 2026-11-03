'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Play, Sparkles, Flame, Radio, Disc3, Headphones } from 'lucide-react';
import { api } from '../lib/api';
import { Song, Album, Artist, Playlist, Genre } from '../types';
import { SongCard } from '../components/cards/SongCard';
import { AlbumCard } from '../components/cards/AlbumCard';
import { ArtistCard } from '../components/cards/ArtistCard';
import { PlaylistCard } from '../components/cards/PlaylistCard';
import { useAuthStore } from '../stores/useAuthStore';
import { usePlayerStore } from '../stores/usePlayerStore';

export default function HomePage() {
  const { user } = useAuthStore();
  const { playSong } = usePlayerStore();

  const [recommendations, setRecommendations] = useState<Song[]>([]);
  const [popularSongs, setPopularSongs] = useState<Song[]>([]);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [artists, setArtists] = useState<Artist[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [genres, setGenres] = useState<Genre[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadHomeData() {
      try {
        setLoading(true);
        const [recsRes, songsRes, albumsRes, artistsRes, playlistsRes, genresRes] =
          await Promise.all([
            api.getRecommendations().catch(() => ({ data: [] })),
            api.getSongs({ sortBy: 'popular', limit: 8 }),
            api.getAlbums({ limit: 6 }),
            api.getArtists({ limit: 6 }),
            api.getPlaylists(),
            api.getGenres(),
          ]);

        setRecommendations(recsRes.data || []);
        setPopularSongs(songsRes.data || []);
        setAlbums(albumsRes.data || []);
        setArtists(artistsRes.data || []);
        setPlaylists(playlistsRes.data || []);
        setGenres(genresRes.data || []);
      } catch (err) {
        console.error('Failed to load homepage data:', err);
      } finally {
        setLoading(false);
      }
    }

    loadHomeData();
  }, [user]);

  return (
    <div className="space-y-10 pb-12 select-none">
      {/* Hero Welcome Banner */}
      <div className="relative rounded-2xl overflow-hidden p-8 sm:p-10 bg-gradient-to-r from-surface-elevated via-surface-card to-background border border-surface-border/60 shadow-xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs font-semibold text-primary">
            <Sparkles className="w-3.5 h-3.5" />
            Zero Ads • 100% Uninterrupted Flow
          </div>

          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
            {user ? `Welcome back, ${user.displayName}` : 'Pure Music, Zero Distractions'}
          </h1>

          <p className="text-sm text-muted leading-relaxed">
            Experience high-fidelity music streaming engineered for deep focus. No commercial
            breaks, no video ads, and no algorithmic promotions.
          </p>

          {popularSongs.length > 0 && (
            <div className="pt-2">
              <button
                onClick={() => playSong(popularSongs[0], popularSongs)}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-primary hover:bg-primary-hover text-black font-bold text-xs uppercase tracking-wider shadow-lg shadow-primary/25 hover:scale-105 transition-all"
              >
                <Play className="w-4 h-4 fill-current ml-0.5" />
                Listen Now
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Quick Play Grid (Top 6 songs) */}
      {popularSongs.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <Headphones className="w-5 h-5 text-primary" />
            Quick Listen
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {popularSongs.slice(0, 6).map((song) => (
              <div
                key={song.id}
                onClick={() => playSong(song, popularSongs)}
                className="group flex items-center gap-3 p-2 rounded-xl bg-surface-card hover:bg-surface-hover border border-surface-border/40 transition-all cursor-pointer shadow-sm"
              >
                <img
                  src={song.artworkUrl || ''}
                  alt={song.title}
                  className="w-14 h-14 rounded-lg object-cover flex-shrink-0"
                />
                <div className="flex-1 min-w-0 pr-2">
                  <p className="text-xs font-semibold text-white group-hover:text-primary transition-colors truncate">
                    {song.title}
                  </p>
                  <p className="text-[11px] text-muted truncate">{song.artist?.name}</p>
                </div>
                <div className="w-9 h-9 rounded-full bg-primary text-black flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 mr-2 flex-shrink-0 shadow-md">
                  <Play className="w-4 h-4 fill-current ml-0.5" />
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Made For You / Recommendations */}
      {recommendations.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-accent-lime" />
              Made For You
            </h2>
            <Link href="/search" className="text-xs font-semibold text-muted hover:text-white transition-colors">
              Show all
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {recommendations.slice(0, 6).map((song) => (
              <SongCard key={song.id} song={song} queueContext={recommendations} />
            ))}
          </div>
        </section>
      )}

      {/* Popular Playlists */}
      {playlists.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              <Radio className="w-5 h-5 text-primary" />
              Featured Playlists
            </h2>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {playlists.map((playlist) => (
              <PlaylistCard key={playlist.id} playlist={playlist} />
            ))}
          </div>
        </section>
      )}

      {/* Recommended Albums */}
      {albums.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              <Disc3 className="w-5 h-5 text-accent-cyan" />
              Recommended Albums
            </h2>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {albums.map((album) => (
              <AlbumCard key={album.id} album={album} />
            ))}
          </div>
        </section>
      )}

      {/* Top Artists */}
      {artists.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              <Flame className="w-5 h-5 text-orange-400" />
              Popular Artists
            </h2>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {artists.map((artist) => (
              <ArtistCard key={artist.id} artist={artist} />
            ))}
          </div>
        </section>
      )}

      {/* Browse by Genre */}
      {genres.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-xl font-bold tracking-tight text-white">Browse by Genre</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
            {genres.map((genre) => (
              <Link
                key={genre.id}
                href={`/search?genre=${encodeURIComponent(genre.name)}`}
                className="p-4 rounded-xl border border-surface-border/50 hover:border-primary/40 bg-surface-card hover:bg-surface-hover transition-all duration-200 group"
              >
                <div
                  className="w-3 h-3 rounded-full mb-3"
                  style={{ backgroundColor: genre.color || '#10b981' }}
                />
                <h3 className="text-sm font-bold text-white group-hover:text-primary transition-colors">
                  {genre.name}
                </h3>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
