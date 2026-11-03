import { create } from 'zustand';
import { Song } from '../types';
import { api } from '../lib/api';

type RepeatMode = 'off' | 'one' | 'all';

declare global {
  interface Window {
    onSpotifyWebPlaybackSDKReady?: () => void;
    Spotify?: {
      Player: any;
    };
  }
}

interface PlayerState {
  currentSong: Song | null;
  isPlaying: boolean;
  isLoading: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  repeatMode: RepeatMode;
  isShuffled: boolean;
  queue: Song[];
  originalQueue: Song[];
  queueIndex: number;
  isExpanded: boolean;
  isQueueOpen: boolean;

  // Spotify Web Playback SDK State
  spotifyDeviceId: string | null;
  isSpotifyReady: boolean;
  spotifyPremiumModalOpen: boolean;

  // Actions
  playSong: (song: Song, newQueue?: Song[]) => Promise<void>;
  togglePlay: () => Promise<void>;
  pause: () => Promise<void>;
  resume: () => Promise<void>;
  nextTrack: () => void;
  previousTrack: () => void;
  seek: (seconds: number) => Promise<void>;
  setVolume: (level: number) => Promise<void>;
  toggleMute: () => Promise<void>;
  toggleShuffle: () => void;
  cycleRepeatMode: () => void;
  addToQueue: (song: Song) => void;
  playNext: (song: Song) => void;
  removeFromQueue: (index: number) => void;
  clearQueue: () => void;
  toggleExpanded: () => void;
  toggleQueue: () => void;
  toggleLikeCurrentSong: () => Promise<void>;
  setSpotifyPremiumModalOpen: (open: boolean) => void;
  initSpotifyPlayer: () => Promise<void>;
}

// Global Audio Singleton (for local tracks)
let globalAudio: HTMLAudioElement | null = null;
// Global Spotify Player Singleton
let globalSpotifyPlayer: any = null;
let spotifyProgressTimer: NodeJS.Timeout | null = null;

if (typeof window !== 'undefined') {
  globalAudio = new Audio();
  globalAudio.preload = 'metadata';
}

export const usePlayerStore = create<PlayerState>((set, get) => {
  // Bind HTML5 audio element events once
  if (globalAudio && typeof window !== 'undefined') {
    globalAudio.addEventListener('timeupdate', () => {
      if (globalAudio && get().currentSong?.source !== 'spotify') {
        set({ currentTime: globalAudio.currentTime });
      }
    });

    globalAudio.addEventListener('loadedmetadata', () => {
      if (globalAudio && get().currentSong?.source !== 'spotify') {
        set({
          duration: globalAudio.duration || get().currentSong?.duration || 0,
          isLoading: false,
        });
      }
    });

    globalAudio.addEventListener('waiting', () => {
      if (get().currentSong?.source !== 'spotify') {
        set({ isLoading: true });
      }
    });

    globalAudio.addEventListener('canplay', () => {
      if (get().currentSong?.source !== 'spotify') {
        set({ isLoading: false });
      }
    });

    globalAudio.addEventListener('ended', () => {
      if (get().currentSong?.source === 'spotify') return;

      const { repeatMode, currentSong, currentTime } = get();
      if (currentSong) {
        api
          .recordPlaybackEvent({
            songId: currentSong.id,
            eventType: 'COMPLETE',
            playedDuration: Math.floor(currentTime),
          })
          .catch(() => {});
      }

      if (repeatMode === 'one' && globalAudio) {
        globalAudio.currentTime = 0;
        globalAudio.play().catch(() => {});
      } else {
        get().nextTrack();
      }
    });

    globalAudio.addEventListener('error', (e) => {
      if (get().currentSong?.source === 'spotify') return;
      console.warn('Audio streaming notice:', e);
      set({ isPlaying: false, isLoading: false });
      const { currentSong } = get();
      if (currentSong) {
        api
          .recordPlaybackEvent({
            songId: currentSong.id,
            eventType: 'ERROR',
          })
          .catch(() => {});
      }
    });
  }

  const startSpotifyProgressTimer = () => {
    if (spotifyProgressTimer) clearInterval(spotifyProgressTimer);
    spotifyProgressTimer = setInterval(() => {
      const { isPlaying, currentSong, currentTime, duration } = get();
      if (isPlaying && currentSong?.source === 'spotify') {
        const nextTime = currentTime + 0.5;
        if (duration > 0 && nextTime >= duration) {
          get().nextTrack();
        } else {
          set({ currentTime: nextTime });
        }
      }
    }, 500);
  };

  const stopSpotifyProgressTimer = () => {
    if (spotifyProgressTimer) {
      clearInterval(spotifyProgressTimer);
      spotifyProgressTimer = null;
    }
  };

  return {
    currentSong: null,
    isPlaying: false,
    isLoading: false,
    currentTime: 0,
    duration: 0,
    volume: 0.8,
    isMuted: false,
    repeatMode: 'off',
    isShuffled: false,
    queue: [],
    originalQueue: [],
    queueIndex: -1,
    isExpanded: false,
    isQueueOpen: false,

    spotifyDeviceId: null,
    isSpotifyReady: false,
    spotifyPremiumModalOpen: false,

    setSpotifyPremiumModalOpen: (open: boolean) => set({ spotifyPremiumModalOpen: open }),

    initSpotifyPlayer: async () => {
      if (typeof window === 'undefined') return;
      if (globalSpotifyPlayer) return;

      // Ensure SDK script tag is injected
      if (!window.Spotify) {
        await new Promise<void>((resolve) => {
          const existingScript = document.getElementById('spotify-player-script');
          if (!existingScript) {
            const script = document.createElement('script');
            script.id = 'spotify-player-script';
            script.src = 'https://sdk.scdn.co/spotify-player.js';
            script.async = true;
            document.body.appendChild(script);
          }

          const previousCallback = window.onSpotifyWebPlaybackSDKReady;
          window.onSpotifyWebPlaybackSDKReady = () => {
            if (previousCallback) previousCallback();
            resolve();
          };
        });
      }

      try {
        const player = new window.Spotify!.Player({
          name: 'SonicFlow Web Player',
          getOAuthToken: async (cb: (token: string) => void) => {
            try {
              const res = await api.getSpotifyToken();
              cb(res.data.accessToken);
            } catch {
              cb('');
            }
          },
          volume: get().volume,
        });

        player.addListener('ready', ({ device_id }: { device_id: string }) => {
          console.log('Spotify Web Player ready with device ID:', device_id);
          set({ spotifyDeviceId: device_id, isSpotifyReady: true });
        });

        player.addListener('not_ready', ({ device_id }: { device_id: string }) => {
          console.warn('Spotify device is offline:', device_id);
          set({ isSpotifyReady: false });
        });

        player.addListener('player_state_changed', (state: any) => {
          if (!state) return;
          const { currentSong } = get();
          if (currentSong?.source === 'spotify') {
            const isPaused = state.paused;
            set({
              isPlaying: !isPaused,
              currentTime: state.position / 1000,
              duration: state.duration ? state.duration / 1000 : currentSong.duration,
              isLoading: false,
            });

            if (!isPaused) {
              startSpotifyProgressTimer();
            } else {
              stopSpotifyProgressTimer();
            }
          }
        });

        player.addListener('account_error', (e: any) => {
          console.warn('Spotify account error (Premium required):', e);
          set({
            isPlaying: false,
            isLoading: false,
            spotifyPremiumModalOpen: true,
          });
        });

        player.addListener('authentication_error', (e: any) => {
          console.warn('Spotify authentication error:', e);
          set({ isPlaying: false, isLoading: false });
        });

        player.addListener('initialization_error', (e: any) => {
          console.warn('Spotify initialization error:', e);
          set({ isPlaying: false, isLoading: false });
        });

        await player.connect();
        globalSpotifyPlayer = player;
      } catch (err) {
        console.warn('Failed to initialize Spotify Web Playback SDK:', err);
      }
    },

    playSong: async (song, newQueue) => {
      let queue = get().queue;
      let originalQueue = get().originalQueue;

      if (newQueue && newQueue.length > 0) {
        queue = [...newQueue];
        originalQueue = [...newQueue];
      } else if (!queue.some((s) => s.id === song.id)) {
        queue = [song, ...queue];
        originalQueue = [song, ...originalQueue];
      }

      const songIdx = queue.findIndex((s) => s.id === song.id);

      set({
        currentSong: song,
        queue,
        originalQueue,
        queueIndex: songIdx !== -1 ? songIdx : 0,
        isLoading: true,
        currentTime: 0,
        duration: song.duration || 180,
      });

      // --- SPOTIFY-SOURCED TRACK PLAYBACK ---
      if (song.source === 'spotify') {
        // Pause HTML5 audio
        if (globalAudio) {
          globalAudio.pause();
        }

        try {
          // Initialize SDK if not yet initialized
          if (!globalSpotifyPlayer) {
            await get().initSpotifyPlayer();
          }

          // Wait briefly for device_id if needed
          let deviceId = get().spotifyDeviceId;
          if (!deviceId) {
            for (let i = 0; i < 15; i++) {
              await new Promise((r) => setTimeout(r, 200));
              deviceId = get().spotifyDeviceId;
              if (deviceId) break;
            }
          }

          if (!deviceId) {
            // Check Spotify status to prompt user
            const statusRes = await api.getSpotifyStatus().catch(() => null);
            if (!statusRes?.data?.connected || !statusRes?.data?.isPremium) {
              set({
                isLoading: false,
                isPlaying: false,
                spotifyPremiumModalOpen: true,
              });
              return;
            }
          }

          const trackUri = song.spotifyUri || `spotify:track:${song.spotifyTrackId}`;

          await api.playSpotifyTrack(deviceId || '', [trackUri]);

          set({
            isPlaying: true,
            isLoading: false,
          });
          startSpotifyProgressTimer();

          // Record playback event
          api
            .recordPlaybackEvent({
              songId: song.id,
              eventType: 'PLAY',
            })
            .catch(() => {});
        } catch (err: any) {
          console.warn('Spotify playback trigger notice:', err);
          set({
            isPlaying: false,
            isLoading: false,
            spotifyPremiumModalOpen: true,
          });
        }
        return;
      }

      // --- LOCAL AUDIO PLAYBACK ---
      stopSpotifyProgressTimer();
      if (globalSpotifyPlayer) {
        try {
          await globalSpotifyPlayer.pause();
        } catch {}
      }

      if (!globalAudio) return;

      try {
        let streamUrl = song.audioUrl;
        if (!streamUrl || streamUrl.startsWith('/')) {
          const apiHost =
            process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') || 'http://localhost:4000';
          streamUrl = `${apiHost}/api/v1/playback/stream/${song.id}`;
        }

        globalAudio.src = streamUrl;
        globalAudio.currentTime = 0;
        globalAudio.volume = get().isMuted ? 0 : get().volume;
        await globalAudio.play();

        set({ isPlaying: true, isLoading: false });

        api
          .recordPlaybackEvent({
            songId: song.id,
            eventType: 'PLAY',
          })
          .catch(() => {});
      } catch (err) {
        console.warn('Playback start error:', err);
        set({ isPlaying: false, isLoading: false });
      }
    },

    togglePlay: async () => {
      const { isPlaying, currentSong } = get();

      if (!currentSong) {
        const { queue } = get();
        if (queue.length > 0) {
          get().playSong(queue[0]);
        }
        return;
      }

      if (currentSong.source === 'spotify') {
        if (isPlaying) {
          if (globalSpotifyPlayer) {
            await globalSpotifyPlayer.pause().catch(() => {});
          }
          stopSpotifyProgressTimer();
          set({ isPlaying: false });
        } else {
          if (globalSpotifyPlayer) {
            await globalSpotifyPlayer.resume().catch(() => {});
          }
          startSpotifyProgressTimer();
          set({ isPlaying: true });
        }
        return;
      }

      // Local playback
      if (!globalAudio) return;
      if (isPlaying) {
        globalAudio.pause();
        set({ isPlaying: false });
        api
          .recordPlaybackEvent({
            songId: currentSong.id,
            eventType: 'PAUSE',
            playedDuration: Math.floor(get().currentTime),
          })
          .catch(() => {});
      } else {
        globalAudio
          .play()
          .then(() => set({ isPlaying: true }))
          .catch(() => {});
      }
    },

    pause: async () => {
      const { currentSong } = get();
      if (currentSong?.source === 'spotify') {
        if (globalSpotifyPlayer) {
          await globalSpotifyPlayer.pause().catch(() => {});
        }
        stopSpotifyProgressTimer();
      } else if (globalAudio) {
        globalAudio.pause();
      }
      set({ isPlaying: false });
    },

    resume: async () => {
      const { currentSong } = get();
      if (currentSong?.source === 'spotify') {
        if (globalSpotifyPlayer) {
          await globalSpotifyPlayer.resume().catch(() => {});
        }
        startSpotifyProgressTimer();
      } else if (globalAudio) {
        await globalAudio.play().catch(() => {});
      }
      set({ isPlaying: true });
    },

    nextTrack: () => {
      const { queue, queueIndex, repeatMode } = get();
      if (queue.length === 0) return;

      let nextIndex = queueIndex + 1;
      if (nextIndex >= queue.length) {
        if (repeatMode === 'all') {
          nextIndex = 0;
        } else {
          set({ isPlaying: false });
          return;
        }
      }

      get().playSong(queue[nextIndex]);
    },

    previousTrack: () => {
      const { queue, queueIndex, currentTime } = get();
      if (queue.length === 0) return;

      if (currentTime > 3) {
        get().seek(0);
        return;
      }

      let prevIndex = queueIndex - 1;
      if (prevIndex < 0) {
        prevIndex = queue.length - 1;
      }

      get().playSong(queue[prevIndex]);
    },

    seek: async (seconds) => {
      const { currentSong } = get();
      set({ currentTime: seconds });

      if (currentSong?.source === 'spotify') {
        if (globalSpotifyPlayer) {
          await globalSpotifyPlayer.seek(Math.floor(seconds * 1000)).catch(() => {});
        }
      } else if (globalAudio) {
        globalAudio.currentTime = seconds;
      }

      if (currentSong) {
        api
          .recordPlaybackEvent({
            songId: currentSong.id,
            eventType: 'SEEK',
            playedDuration: Math.floor(seconds),
          })
          .catch(() => {});
      }
    },

    setVolume: async (level) => {
      const clamped = Math.max(0, Math.min(1, level));
      if (globalAudio) {
        globalAudio.volume = clamped;
      }
      if (globalSpotifyPlayer) {
        await globalSpotifyPlayer.setVolume(clamped).catch(() => {});
      }
      set({ volume: clamped, isMuted: clamped === 0 });
    },

    toggleMute: async () => {
      const { isMuted, volume } = get();
      const targetVolume = isMuted ? volume || 0.5 : 0;
      if (globalAudio) {
        globalAudio.volume = targetVolume;
      }
      if (globalSpotifyPlayer) {
        await globalSpotifyPlayer.setVolume(targetVolume).catch(() => {});
      }
      set({ isMuted: !isMuted });
    },

    toggleShuffle: () => {
      const { isShuffled, queue, originalQueue, currentSong } = get();
      if (!isShuffled) {
        const otherSongs = queue.filter((s) => s.id !== currentSong?.id);
        const shuffled = [...otherSongs].sort(() => Math.random() - 0.5);
        const newQueue = currentSong ? [currentSong, ...shuffled] : shuffled;
        set({ isShuffled: true, queue: newQueue, queueIndex: 0 });
      } else {
        const songIndex = originalQueue.findIndex((s) => s.id === currentSong?.id);
        set({
          isShuffled: false,
          queue: [...originalQueue],
          queueIndex: songIndex !== -1 ? songIndex : 0,
        });
      }
    },

    cycleRepeatMode: () => {
      const modes: RepeatMode[] = ['off', 'all', 'one'];
      const currentIndex = modes.indexOf(get().repeatMode);
      const nextMode = modes[(currentIndex + 1) % modes.length];
      set({ repeatMode: nextMode });
    },

    addToQueue: (song) => {
      const { queue, originalQueue } = get();
      set({
        queue: [...queue, song],
        originalQueue: [...originalQueue, song],
      });
    },

    playNext: (song) => {
      const { queue, queueIndex } = get();
      const updated = [...queue];
      updated.splice(queueIndex + 1, 0, song);
      set({ queue: updated });
    },

    removeFromQueue: (index) => {
      const { queue, queueIndex } = get();
      const updated = queue.filter((_, i) => i !== index);
      let newIdx = queueIndex;
      if (index < queueIndex) {
        newIdx--;
      }
      set({ queue: updated, queueIndex: newIdx });
    },

    clearQueue: () => {
      const { currentSong } = get();
      set({
        queue: currentSong ? [currentSong] : [],
        originalQueue: currentSong ? [currentSong] : [],
        queueIndex: 0,
      });
    },

    toggleExpanded: () => {
      set({ isExpanded: !get().isExpanded });
    },

    toggleQueue: () => {
      set({ isQueueOpen: !get().isQueueOpen });
    },

    toggleLikeCurrentSong: async () => {
      const { currentSong } = get();
      if (!currentSong) return;

      try {
        const res = await api.toggleLikeSong(currentSong.id);
        set({
          currentSong: {
            ...currentSong,
            isLiked: res.data.isLiked,
          },
        });
      } catch (err) {
        console.error('Like toggle error:', err);
      }
    },
  };
});
