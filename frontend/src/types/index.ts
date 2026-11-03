export interface User {
  id: string;
  email: string;
  displayName: string;
  avatarUrl?: string;
  role: 'USER' | 'CONTENT_MANAGER' | 'ADMIN';
  emailVerified: boolean;
  createdAt: string;
  isSpotifyConnected?: boolean;
  spotifyProduct?: string;
  hasSpotifyPremium?: boolean;
  spotifyUserId?: string;
  _count?: {
    playlists?: number;
    favoriteSongs?: number;
    savedAlbums?: number;
    followedArtists?: number;
  };
}

export interface Artist {
  id: string;
  name: string;
  bio?: string;
  avatarUrl?: string;
  bannerUrl?: string;
  verified?: boolean;
  isFollowing?: boolean;
  albums?: Album[];
  songs?: Song[];
  _count?: {
    followers?: number;
    songs?: number;
    albums?: number;
  };
}

export interface Album {
  id: string;
  title: string;
  artistId: string;
  artist: {
    id: string;
    name: string;
    avatarUrl?: string;
  };
  coverUrl?: string;
  releaseYear?: number;
  genre?: string;
  songs?: Song[];
  isSaved?: boolean;
  totalDuration?: number;
  _count?: {
    songs?: number;
  };
}

export interface Song {
  id: string;
  title: string;
  artistId: string;
  artist: {
    id: string;
    name: string;
    avatarUrl?: string;
  };
  albumId?: string;
  album?: {
    id: string;
    title: string;
    coverUrl?: string;
    releaseYear?: number;
  };
  duration: number; // in seconds
  genre?: string;
  artworkUrl?: string;
  storageKey?: string | null;
  audioUrl?: string | null;
  trackNumber?: number;
  isExplicit?: boolean;
  isAvailable?: boolean;
  playCount: number;
  isLiked?: boolean;
  addedAt?: string;
  source?: 'local' | 'spotify';
  spotifyTrackId?: string;
  spotifyUri?: string;
  durationMs?: number;
  localSongId?: string;
}

export interface Genre {
  id: string;
  name: string;
  slug: string;
  color: string;
  icon?: string;
  _count?: {
    songs?: number;
  };
}

export interface Playlist {
  id: string;
  title: string;
  description?: string;
  coverUrl?: string;
  isPublic: boolean;
  isUnlisted: boolean;
  source?: 'local' | 'spotify';
  spotifyPlaylistId?: string;
  userId: string;
  user: {
    id: string;
    displayName: string;
    avatarUrl?: string;
  };
  tracks?: {
    id: string;
    position: number;
    addedAt: string;
    song: Song;
  }[];
  isOwner?: boolean;
  totalDuration?: number;
  _count?: {
    tracks?: number;
  };
}

export interface SearchResults {
  songs: Song[];
  artists: Artist[];
  albums: Album[];
  playlists: Playlist[];
}

export interface DashboardMetrics {
  totalUsers: number;
  totalSongs: number;
  totalAlbums: number;
  totalArtists: number;
  totalPlaylists: number;
  totalPlaybacks: number;
  streamingErrors: number;
  recentSongs: Song[];
  recentUsers: User[];
}
