'use client';

import React from 'react';
import Link from 'next/link';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Shuffle,
  Repeat,
  Repeat1,
  Volume2,
  VolumeX,
  Volume1,
  Maximize2,
  ListMusic,
  Heart,
  Loader2,
} from 'lucide-react';
import { usePlayerStore } from '../../stores/usePlayerStore';
import { SpotifyBadge } from '../common/SpotifyBadge';
import { SpotifyPremiumModal } from './SpotifyPremiumModal';

function formatTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

export const PlayerBar: React.FC = () => {
  const {
    currentSong,
    isPlaying,
    isLoading,
    currentTime,
    duration,
    volume,
    isMuted,
    repeatMode,
    isShuffled,
    queue,
    togglePlay,
    nextTrack,
    previousTrack,
    seek,
    setVolume,
    toggleMute,
    toggleShuffle,
    cycleRepeatMode,
    toggleExpanded,
    toggleQueue,
    toggleLikeCurrentSong,
  } = usePlayerStore();

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    seek(val);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
  };

  return (
    <>
      <footer className="fixed bottom-0 left-0 right-0 h-24 bg-surface-elevated/95 backdrop-blur-xl border-t border-surface-border px-6 flex items-center justify-between z-30 select-none">
      {/* Left: Song Info */}
      <div className="w-1/4 min-w-[180px] flex items-center gap-4">
        {currentSong ? (
          <>
            <div className="relative group flex-shrink-0 cursor-pointer" onClick={toggleExpanded}>
              {currentSong.artworkUrl ? (
                <img
                  src={currentSong.artworkUrl}
                  alt={currentSong.title}
                  className="w-14 h-14 rounded-lg object-cover shadow-md shadow-black/40 group-hover:opacity-80 transition-opacity"
                />
              ) : (
                <div className="w-14 h-14 rounded-lg bg-surface-card flex items-center justify-center text-muted font-bold">
                  SF
                </div>
              )}
            </div>

            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-1.5 truncate">
                <span
                  onClick={toggleExpanded}
                  className="text-sm font-semibold text-white truncate cursor-pointer hover:underline"
                >
                  {currentSong.title}
                </span>
                {currentSong.source === 'spotify' && <SpotifyBadge size="sm" />}
              </div>
              <Link
                href={`/artist/${currentSong.artistId}`}
                className="text-xs text-muted hover:text-white truncate transition-colors"
              >
                {currentSong.artist?.name || 'Unknown Artist'}
              </Link>
            </div>

            <button
              onClick={toggleLikeCurrentSong}
              aria-label="Like song"
              className="p-2 text-muted hover:text-white transition-colors ml-1"
            >
              <Heart
                className={`w-5 h-5 ${
                  currentSong.isLiked ? 'text-primary fill-primary' : ''
                }`}
              />
            </button>
          </>
        ) : (
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-lg bg-surface-card border border-surface-border/50 flex items-center justify-center text-muted-dim text-xs">
              SonicFlow
            </div>
            <div>
              <p className="text-xs font-semibold text-muted">Ready to stream</p>
              <p className="text-[11px] text-muted-dim">Select a track to start</p>
            </div>
          </div>
        )}
      </div>

      {/* Center: Playback Controls & Progress Bar */}
      <div className="w-2/4 max-w-2xl flex flex-col items-center gap-2">
        <div className="flex items-center gap-6">
          {/* Shuffle */}
          <button
            onClick={toggleShuffle}
            title={isShuffled ? 'Shuffle on' : 'Shuffle off'}
            className={`p-1.5 transition-colors ${
              isShuffled ? 'text-primary' : 'text-muted hover:text-white'
            }`}
          >
            <Shuffle className="w-4 h-4" />
          </button>

          {/* Previous */}
          <button
            onClick={previousTrack}
            disabled={!currentSong}
            title="Previous track"
            className="p-1.5 text-muted hover:text-white disabled:opacity-40 disabled:hover:text-muted transition-colors"
          >
            <SkipBack className="w-5 h-5 fill-current" />
          </button>

          {/* Play/Pause */}
          <button
            onClick={togglePlay}
            disabled={!currentSong && queue.length === 0}
            title={isPlaying ? 'Pause' : 'Play'}
            className="w-10 h-10 rounded-full bg-white hover:bg-primary hover:scale-105 text-black flex items-center justify-center transition-all duration-200 shadow-lg shadow-white/10 disabled:opacity-40 disabled:hover:bg-white disabled:hover:scale-100"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : isPlaying ? (
              <Pause className="w-5 h-5 fill-current" />
            ) : (
              <Play className="w-5 h-5 fill-current ml-0.5" />
            )}
          </button>

          {/* Next */}
          <button
            onClick={nextTrack}
            disabled={!currentSong}
            title="Next track"
            className="p-1.5 text-muted hover:text-white disabled:opacity-40 disabled:hover:text-muted transition-colors"
          >
            <SkipForward className="w-5 h-5 fill-current" />
          </button>

          {/* Repeat */}
          <button
            onClick={cycleRepeatMode}
            title={`Repeat mode: ${repeatMode}`}
            className={`p-1.5 transition-colors relative ${
              repeatMode !== 'off' ? 'text-primary' : 'text-muted hover:text-white'
            }`}
          >
            {repeatMode === 'one' ? (
              <Repeat1 className="w-4 h-4" />
            ) : (
              <Repeat className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* Time Progress Bar */}
        <div className="w-full flex items-center gap-3">
          <span className="text-[11px] font-mono text-muted-dim w-9 text-right select-none">
            {formatTime(currentTime)}
          </span>

          <div className="relative flex-1 flex items-center group">
            <input
              type="range"
              min={0}
              max={duration || 100}
              step={0.1}
              value={currentTime}
              onChange={handleSeek}
              disabled={!currentSong}
              aria-label="Seek track position"
              className="w-full h-1 bg-surface-card rounded-lg appearance-none cursor-pointer accent-primary group-hover:h-1.5 transition-all"
            />
          </div>

          <span className="text-[11px] font-mono text-muted-dim w-9 text-left select-none">
            {formatTime(duration)}
          </span>
        </div>
      </div>

      {/* Right: Auxiliary Controls (Queue, Fullscreen, Volume) */}
      <div className="w-1/4 min-w-[180px] flex items-center justify-end gap-3.5">
        {/* Queue Drawer Button */}
        <button
          onClick={toggleQueue}
          title="Playback Queue"
          className="p-2 text-muted hover:text-white transition-colors relative"
        >
          <ListMusic className="w-5 h-5" />
          {queue.length > 0 && (
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-primary" />
          )}
        </button>

        {/* Fullscreen Expand */}
        <button
          onClick={toggleExpanded}
          title="Full-screen player"
          className="p-2 text-muted hover:text-white transition-colors"
        >
          <Maximize2 className="w-4 h-4" />
        </button>

        {/* Volume */}
        <div className="flex items-center gap-2 group">
          <button
            onClick={toggleMute}
            aria-label={isMuted ? 'Unmute' : 'Mute'}
            className="text-muted hover:text-white transition-colors"
          >
            {isMuted || volume === 0 ? (
              <VolumeX className="w-5 h-5 text-red-400" />
            ) : volume < 0.5 ? (
              <Volume1 className="w-5 h-5" />
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
            onChange={handleVolumeChange}
            aria-label="Volume level"
            className="w-20 h-1 bg-surface-card rounded-lg appearance-none cursor-pointer accent-primary group-hover:accent-accent-lime transition-all"
          />
        </div>
      </div>
    </footer>
    <SpotifyPremiumModal />
  </>
);
};
