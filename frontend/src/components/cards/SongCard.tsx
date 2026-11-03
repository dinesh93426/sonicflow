'use client';

import React from 'react';
import Link from 'next/link';
import { Play, Pause, Heart, MoreVertical, Plus } from 'lucide-react';
import { Song } from '../../types';
import { usePlayerStore } from '../../stores/usePlayerStore';
import { api } from '../../lib/api';

interface SongCardProps {
  song: Song;
  queueContext?: Song[];
}

export const SongCard: React.FC<SongCardProps> = ({ song, queueContext }) => {
  const { currentSong, isPlaying, playSong, togglePlay, addToQueue } = usePlayerStore();
  const isCurrent = currentSong?.id === song.id;

  const handlePlayClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isCurrent) {
      togglePlay();
    } else {
      playSong(song, queueContext);
    }
  };

  return (
    <div
      onClick={() => playSong(song, queueContext)}
      className="group relative p-3 rounded-xl bg-surface-card hover:bg-surface-hover border border-surface-border/40 hover:border-surface-border transition-all duration-200 cursor-pointer flex flex-col justify-between"
    >
      <div className="relative aspect-square rounded-lg overflow-hidden mb-3 bg-surface-elevated">
        <img
          src={song.artworkUrl || ''}
          alt={song.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />

        {/* Play Button Overlay */}
        <button
          onClick={handlePlayClick}
          aria-label={isCurrent && isPlaying ? 'Pause track' : 'Play track'}
          className={`absolute bottom-2.5 right-2.5 w-10 h-10 rounded-full bg-primary text-black flex items-center justify-center shadow-lg shadow-black/60 transition-all duration-200 hover:scale-105 ${
            isCurrent
              ? 'opacity-100 translate-y-0 scale-100'
              : 'opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0'
          }`}
        >
          {isCurrent && isPlaying ? (
            <Pause className="w-5 h-5 fill-current" />
          ) : (
            <Play className="w-5 h-5 fill-current ml-0.5" />
          )}
        </button>
      </div>

      <div className="min-w-0">
        <h4
          className={`text-sm font-semibold truncate ${
            isCurrent ? 'text-primary' : 'text-white group-hover:text-primary transition-colors'
          }`}
        >
          {song.title}
        </h4>
        <p className="text-xs text-muted truncate mt-0.5">
          {song.artist?.name || 'Artist'}
        </p>
      </div>

      <div className="flex items-center justify-between mt-2 pt-2 border-t border-surface-border/30 text-[11px] text-muted-dim">
        <span>{song.genre || 'Song'}</span>
        <button
          onClick={(e) => {
            e.stopPropagation();
            addToQueue(song);
          }}
          title="Add to queue"
          className="opacity-0 group-hover:opacity-100 hover:text-white transition-opacity p-1"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
