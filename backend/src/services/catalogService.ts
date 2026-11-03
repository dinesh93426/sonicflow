import prisma from '../config/prisma.js';
import { NotFoundError } from '../utils/errors.js';

export interface PaginationQuery {
  page?: number;
  limit?: number;
}

export class CatalogService {
  async getSongs(params: {
    page?: number;
    limit?: number;
    genre?: string;
    artistId?: string;
    albumId?: string;
    sortBy?: 'latest' | 'popular' | 'title';
  }) {
    const page = Math.max(1, params.page || 1);
    const limit = Math.min(100, Math.max(1, params.limit || 20));
    const skip = (page - 1) * limit;

    const where: any = { isAvailable: true };

    if (params.genre) {
      where.genre = { equals: params.genre, mode: 'insensitive' };
    }
    if (params.artistId) {
      where.artistId = params.artistId;
    }
    if (params.albumId) {
      where.albumId = params.albumId;
    }

    let orderBy: any = { createdAt: 'desc' };
    if (params.sortBy === 'popular') {
      orderBy = { playCount: 'desc' };
    } else if (params.sortBy === 'title') {
      orderBy = { title: 'asc' };
    }

    const [total, songs] = await Promise.all([
      prisma.song.count({ where }),
      prisma.song.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          artist: { select: { id: true, name: true, avatarUrl: true } },
          album: { select: { id: true, title: true, coverUrl: true, releaseYear: true } },
        },
      }),
    ]);

    return {
      songs,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getSongById(id: string, currentUserId?: string) {
    const song = await prisma.song.findUnique({
      where: { id },
      include: {
        artist: true,
        album: true,
        songGenres: { include: { genre: true } },
      },
    });

    if (!song || !song.isAvailable) {
      throw new NotFoundError('Song not found or is currently unavailable');
    }

    let isLiked = false;
    if (currentUserId) {
      const fav = await prisma.favoriteSong.findUnique({
        where: {
          userId_songId: { userId: currentUserId, songId: id },
        },
      });
      isLiked = !!fav;
    }

    return { ...song, isLiked };
  }

  async getArtists(params: { page?: number; limit?: number; query?: string }) {
    const page = Math.max(1, params.page || 1);
    const limit = Math.min(50, Math.max(1, params.limit || 20));
    const skip = (page - 1) * limit;

    const where: any = {};
    if (params.query) {
      where.name = { contains: params.query, mode: 'insensitive' };
    }

    const [total, artists] = await Promise.all([
      prisma.artist.count({ where }),
      prisma.artist.findMany({
        where,
        skip,
        take: limit,
        orderBy: { name: 'asc' },
        include: {
          _count: { select: { songs: true, albums: true, followers: true } },
        },
      }),
    ]);

    return {
      artists,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getArtistById(id: string, currentUserId?: string) {
    const artist = await prisma.artist.findUnique({
      where: { id },
      include: {
        albums: {
          orderBy: { releaseYear: 'desc' },
        },
        songs: {
          where: { isAvailable: true },
          take: 10,
          orderBy: { playCount: 'desc' },
          include: {
            album: { select: { id: true, title: true, coverUrl: true } },
          },
        },
        _count: {
          select: { followers: true, songs: true, albums: true },
        },
      },
    });

    if (!artist) {
      throw new NotFoundError('Artist not found');
    }

    let isFollowing = false;
    if (currentUserId) {
      const follow = await prisma.followedArtist.findUnique({
        where: {
          userId_artistId: { userId: currentUserId, artistId: id },
        },
      });
      isFollowing = !!follow;
    }

    return { ...artist, isFollowing };
  }

  async getAlbums(params: { page?: number; limit?: number; artistId?: string }) {
    const page = Math.max(1, params.page || 1);
    const limit = Math.min(50, Math.max(1, params.limit || 20));
    const skip = (page - 1) * limit;

    const where: any = {};
    if (params.artistId) {
      where.artistId = params.artistId;
    }

    const [total, albums] = await Promise.all([
      prisma.album.count({ where }),
      prisma.album.findMany({
        where,
        skip,
        take: limit,
        orderBy: { releaseYear: 'desc' },
        include: {
          artist: { select: { id: true, name: true, avatarUrl: true } },
          _count: { select: { songs: true } },
        },
      }),
    ]);

    return {
      albums,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getAlbumById(id: string, currentUserId?: string) {
    const album = await prisma.album.findUnique({
      where: { id },
      include: {
        artist: true,
        songs: {
          where: { isAvailable: true },
          orderBy: { trackNumber: 'asc' },
          include: {
            artist: { select: { id: true, name: true } },
          },
        },
      },
    });

    if (!album) {
      throw new NotFoundError('Album not found');
    }

    let isSaved = false;
    if (currentUserId) {
      const saved = await prisma.savedAlbum.findUnique({
        where: {
          userId_albumId: { userId: currentUserId, albumId: id },
        },
      });
      isSaved = !!saved;
    }

    const totalDuration = album.songs.reduce((acc, s) => acc + s.duration, 0);

    return { ...album, isSaved, totalDuration };
  }

  async getGenres() {
    return prisma.genre.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: { select: { songs: true } },
      },
    });
  }

  async search(query: string, limit = 10) {
    if (!query || query.trim() === '') {
      return { songs: [], artists: [], albums: [], playlists: [] };
    }

    const cleanQuery = query.trim();

    const [songs, artists, albums, playlists] = await Promise.all([
      prisma.song.findMany({
        where: {
          isAvailable: true,
          OR: [
            { title: { contains: cleanQuery, mode: 'insensitive' } },
            { genre: { contains: cleanQuery, mode: 'insensitive' } },
            { artist: { name: { contains: cleanQuery, mode: 'insensitive' } } },
          ],
        },
        take: limit,
        include: {
          artist: { select: { id: true, name: true, avatarUrl: true } },
          album: { select: { id: true, title: true, coverUrl: true } },
        },
        orderBy: { playCount: 'desc' },
      }),
      prisma.artist.findMany({
        where: {
          name: { contains: cleanQuery, mode: 'insensitive' },
        },
        take: limit,
        include: {
          _count: { select: { followers: true, songs: true } },
        },
      }),
      prisma.album.findMany({
        where: {
          OR: [
            { title: { contains: cleanQuery, mode: 'insensitive' } },
            { artist: { name: { contains: cleanQuery, mode: 'insensitive' } } },
          ],
        },
        take: limit,
        include: {
          artist: { select: { id: true, name: true } },
        },
      }),
      prisma.playlist.findMany({
        where: {
          isPublic: true,
          title: { contains: cleanQuery, mode: 'insensitive' },
        },
        take: limit,
        include: {
          user: { select: { id: true, displayName: true } },
          _count: { select: { tracks: true } },
        },
      }),
    ]);

    return { songs, artists, albums, playlists };
  }
}

export const catalogService = new CatalogService();
