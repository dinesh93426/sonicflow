'use client';

import React from 'react';
import { X, Trash2, Play, Music } from 'lucide-react';
import { usePlayerStore } from '../../stores/usePlayerStore';

export const QueueDrawer: React.FC = () => {
  const {
    isQueueOpen,
    toggleQueue,
    queue,
    queueIndex,
    currentSong,
    playSong,
    removeFromQueue,
    clearQueue,
  } = usePlayerStore();

  if (!isQueueOpen) return null;

  const upcomingSongs = queue.slice(queueIndex + 1);

  return (
    <div className="fixed inset-y-0 right-0 w-80 bg-surface-card border-l border-surface-border shadow-2xl z-40 flex flex-col pb-24 animate-in slide-in-from-right duration-200 select-none">
      {/* Header */}
      <div className="p-4 border-b border-surface-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Music className="w-4 h-4 text-primary" />
          <h2 className="text-sm font-bold text-white">Play Queue</h2>
          <span className="text-xs text-muted font-mono">({queue.length})</span>
        </div>
        <div className="flex items-center gap-2">
          {queue.length > 1 && (
            <button
              onClick={clearQueue}
              title="Clear queue"
              className="p-1.5 text-muted hover:text-red-400 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={toggleQueue}
            aria-label="Close queue"
            className="p-1.5 text-muted hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Currently Playing */}
        <div>
          <h3 className="text-xs font-semibold text-muted-dim uppercase tracking-wider mb-2">
            Now Playing
          </h3>
          {currentSong ? (
            <div className="flex items-center gap-3 p-2.5 rounded-xl bg-surface-elevated border border-primary/20">
              <img
                src={currentSong.artworkUrl || ''}
                alt={currentSong.title}
                className="w-10 h-10 rounded-lg object-cover"
              />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-primary truncate">{currentSong.title}</p>
                <p className="text-[11px] text-muted truncate">{currentSong.artist?.name}</p>
              </div>
            </div>
          ) : (
            <p className="text-xs text-muted-dim">No track playing</p>
          )}
        </div>

        {/* Next in Queue */}
        <div>
          <h3 className="text-xs font-semibold text-muted-dim uppercase tracking-wider mb-2">
            Next in Queue
          </h3>
          {upcomingSongs.length === 0 ? (
            <p className="text-xs text-muted-dim py-4 text-center">
              The queue is empty. Use "Add to queue" on any track.
            </p>
          ) : (
            <div className="space-y-1.5">
              {upcomingSongs.map((song, idx) => {
                const actualIndex = queueIndex + 1 + idx;
                return (
                  <div
                    key={`${song.id}-${actualIndex}`}
                    className="group flex items-center justify-between p-2 rounded-lg hover:bg-surface-elevated transition-colors"
                  >
                    <div
                      className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer"
                      onClick={() => playSong(song)}
                    >
                      <img
                        src={song.artworkUrl || ''}
                        alt={song.title}
                        className="w-9 h-9 rounded object-cover flex-shrink-0"
                      />
                      <div className="truncate">
                        <p className="text-xs font-medium text-white group-hover:text-primary transition-colors truncate">
                          {song.title}
                        </p>
                        <p className="text-[10px] text-muted truncate">{song.artist?.name}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => removeFromQueue(actualIndex)}
                      className="opacity-0 group-hover:opacity-100 p-1.5 text-muted hover:text-red-400 transition-opacity"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
