'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Play, Pause, CheckCircle2, Clock, UserPlus, UserCheck } from 'lucide-react';
import { api } from '../../../lib/api';
import { Artist, Song } from '../../../types';
import { usePlayerStore } from '../../../stores/usePlayerStore';
import { AlbumCard } from '../../../components/cards/AlbumCard';

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s < 10 ? '0' : ''}${s}`;
}

export default function ArtistDetailPage() {
  const params = useParams();
  const { currentSong, isPlaying, playSong, togglePlay } = usePlayerStore();
  const [artist, setArtist] = useState<Artist | null>(null);
  const [loading, setLoading] = useState(true);

  const artistId = params?.id as string;

  const loadArtist = async () => {
    if (!artistId) return;
    try {
      setLoading(true);
      const res = await api.getArtist(artistId);
      setArtist(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadArtist();
  }, [artistId]);

  const handleToggleFollow = async () => {
    if (!artistId) return;
    try {
      await api.toggleFollowArtist(artistId);
      await loadArtist();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-24 text-muted text-xs animate-pulse">
        Loading artist profile...
      </div>
    );
  }

  if (!artist) {
    return <div className="text-center py-24 text-white">Artist not found</div>;
  }

  const songs = artist.songs || [];
  const isCurrentListPlaying =
    isPlaying && songs.some((s) => s.id === currentSong?.id);

  return (
    <div className="space-y-10 pb-16 select-none">
      {/* Hero Banner */}
      <div className="relative rounded-2xl overflow-hidden min-h-[280px] p-8 flex flex-col justify-end border border-surface-border/60 shadow-2xl">
        {artist.bannerUrl && (
          <img
            src={artist.bannerUrl}
            alt={artist.name}
            className="absolute inset-0 w-full h-full object-cover filter brightness-50"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-end gap-6">
          <img
            src={artist.avatarUrl || ''}
            alt={artist.name}
            className="w-28 h-28 sm:w-36 sm:h-36 rounded-full object-cover border-4 border-surface shadow-2xl"
          />

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-primary flex items-center gap-1 uppercase tracking-widest">
                <CheckCircle2 className="w-4 h-4" /> Verified Artist
              </span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
              {artist.name}
            </h1>

            <p className="text-xs text-muted max-w-xl leading-relaxed">
              {artist.bio}
            </p>

            <p className="text-xs text-muted-dim pt-1">
              {artist._count?.followers || 0} followers • {artist._count?.songs || 0} tracks
            </p>
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
          onClick={handleToggleFollow}
          className={`px-6 py-2.5 rounded-full text-xs font-bold transition-all border ${
            artist.isFollowing
              ? 'bg-transparent text-white border-white/40 hover:border-white'
              : 'bg-white text-black border-transparent hover:scale-105'
          }`}
        >
          {artist.isFollowing ? 'Following' : 'Follow'}
        </button>
      </div>

      {/* Popular Tracks */}
      {songs.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-white">Popular Tracks</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <tbody className="divide-y divide-surface-border/20">
                {songs.map((song, index) => {
                  const isCurrent = currentSong?.id === song.id;
                  return (
                    <tr
                      key={song.id}
                      onClick={() => playSong(song, songs)}
                      className="group hover:bg-surface-elevated/80 transition-colors cursor-pointer"
                    >
                      <td className="py-3 px-4 w-12 text-center text-muted group-hover:text-white font-mono">
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
                          <p
                            className={`font-semibold truncate ${
                              isCurrent ? 'text-primary' : 'text-white'
                            }`}
                          >
                            {song.title}
                          </p>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-muted hidden md:table-cell truncate">
                        {song.album?.title || 'Single'}
                      </td>
                      <td className="py-3 px-4 text-muted hidden sm:table-cell font-mono">
                        {song.playCount?.toLocaleString() || 0} plays
                      </td>
                      <td className="py-3 px-4 w-20 text-right font-mono text-muted">
                        {formatDuration(song.duration)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Discography / Albums */}
      {artist.albums && artist.albums.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-white">Discography</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {artist.albums.map((album) => (
              <AlbumCard key={album.id} album={{ ...album, artist }} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
