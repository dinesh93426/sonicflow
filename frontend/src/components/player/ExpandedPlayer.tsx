'use client';

import React from 'react';
import {
  X,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Shuffle,
  Repeat,
  Repeat1,
  Volume2,
  VolumeX,
  Heart,
  Music2,
  Sparkles,
} from 'lucide-react';
import { usePlayerStore } from '../../stores/usePlayerStore';

function formatTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

export const ExpandedPlayer: React.FC = () => {
  const {
    isExpanded,
    toggleExpanded,
    currentSong,
    isPlaying,
    currentTime,
    duration,
    volume,
    isMuted,
    repeatMode,
    isShuffled,
    togglePlay,
    nextTrack,
    previousTrack,
    seek,
    setVolume,
    toggleMute,
    toggleShuffle,
    cycleRepeatMode,
    toggleLikeCurrentSong,
  } = usePlayerStore();

  if (!isExpanded || !currentSong) return null;

  return (
    <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-2xl flex flex-col justify-between p-8 sm:p-12 overflow-hidden select-none animate-in fade-in zoom-in-95 duration-200">
      {/* Dynamic blurred ambient light behind artwork */}
      <div
        className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full bg-primary/20 blur-[140px] pointer-events-none"
      />
      <div
        className="absolute -bottom-40 -right-40 w-[600px] h-[600px] rounded-full bg-accent-violet/20 blur-[140px] pointer-events-none"
      />

      {/* Top Header */}
      <div className="relative z-10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" />
          <span className="text-xs font-bold tracking-widest uppercase text-muted-dim">
            Now Playing • Ad-Free Hi-Res
          </span>
        </div>
        <button
          onClick={toggleExpanded}
          className="p-2.5 rounded-full bg-surface-elevated/80 hover:bg-surface-hover text-white transition-colors"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* Center Artwork & Track info */}
      <div className="relative z-10 flex flex-col items-center justify-center max-w-md mx-auto w-full">
        <div className="relative group w-72 h-72 sm:w-88 sm:h-88 rounded-2xl overflow-hidden shadow-2xl shadow-black/80 border border-white/10 mb-8">
          <img
            src={currentSong.artworkUrl || ''}
            alt={currentSong.title}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
          {isPlaying && (
            <div className="absolute bottom-4 right-4 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-md flex items-center gap-1.5 text-xs text-primary font-semibold">
              <span className="w-1.5 h-3 bg-primary animate-equalizer" />
              <span className="w-1.5 h-4 bg-primary animate-equalizer" style={{ animationDelay: '0.2s' }} />
              <span className="w-1.5 h-2 bg-primary animate-equalizer" style={{ animationDelay: '0.4s' }} />
              Playing
            </div>
          )}
        </div>

        {/* Title & Artist */}
        <div className="w-full flex items-center justify-between mb-6">
          <div className="min-w-0 pr-4">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white truncate tracking-tight">
              {currentSong.title}
            </h1>
            <p className="text-base text-muted truncate mt-1">
              {currentSong.artist?.name} {currentSong.album?.title ? `— ${currentSong.album.title}` : ''}
            </p>
          </div>
          <button
            onClick={toggleLikeCurrentSong}
            className="p-3 text-muted hover:text-white transition-colors"
          >
            <Heart
              className={`w-7 h-7 ${currentSong.isLiked ? 'text-primary fill-primary' : ''}`}
            />
          </button>
        </div>

        {/* Seek Scrubber */}
        <div className="w-full space-y-2 mb-6">
          <input
            type="range"
            min={0}
            max={duration || 100}
            step={0.1}
            value={currentTime}
            onChange={(e) => seek(parseFloat(e.target.value))}
            className="w-full h-1.5 bg-surface-card rounded-lg appearance-none cursor-pointer accent-primary"
          />
          <div className="flex justify-between text-xs font-mono text-muted-dim">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Primary Controls */}
        <div className="flex items-center justify-between w-full max-w-xs mb-8">
          <button
            onClick={toggleShuffle}
            className={`p-2 transition-colors ${
              isShuffled ? 'text-primary' : 'text-muted hover:text-white'
            }`}
          >
            <Shuffle className="w-5 h-5" />
          </button>

          <button
            onClick={previousTrack}
            className="p-2 text-white hover:text-primary transition-colors"
          >
            <SkipBack className="w-7 h-7 fill-current" />
          </button>

          <button
            onClick={togglePlay}
            className="w-16 h-16 rounded-full bg-primary hover:bg-primary-hover text-black flex items-center justify-center shadow-xl shadow-primary/30 transition-all hover:scale-105"
          >
            {isPlaying ? (
              <Pause className="w-8 h-8 fill-current" />
            ) : (
              <Play className="w-8 h-8 fill-current ml-1" />
            )}
          </button>

          <button
            onClick={nextTrack}
            className="p-2 text-white hover:text-primary transition-colors"
          >
            <SkipForward className="w-7 h-7 fill-current" />
          </button>

          <button
            onClick={cycleRepeatMode}
            className={`p-2 transition-colors ${
              repeatMode !== 'off' ? 'text-primary' : 'text-muted hover:text-white'
            }`}
          >
            {repeatMode === 'one' ? <Repeat1 className="w-5 h-5" /> : <Repeat className="w-5 h-5" />}
          </button>
        </div>

        {/* Volume */}
        <div className="flex items-center gap-3 w-full max-w-xs">
          <button onClick={toggleMute} className="text-muted hover:text-white transition-colors">
            {isMuted || volume === 0 ? (
              <VolumeX className="w-5 h-5 text-red-400" />
            ) : (
              <Volume2 className="w-5 h-5" />
            )}
          </button>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={isMuted ? 0 : volume}
            onChange={(e) => setVolume(parseFloat(e.target.value))}
            className="flex-1 h-1 bg-surface-card rounded-lg appearance-none cursor-pointer accent-primary"
          />
        </div>
      </div>

      {/* Footer Details */}
      <div className="relative z-10 flex items-center justify-between text-xs text-muted-dim max-w-md mx-auto w-full pt-4 border-t border-surface-border/40">
        <span>Genre: {currentSong.genre || 'Various'}</span>
        <span>Bitrate: 320 kbps Lossless PCM</span>
      </div>
    </div>
  );
};
