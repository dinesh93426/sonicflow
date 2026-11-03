import prisma from '../config/prisma.js';
import { NotFoundError } from '../utils/errors.js';

export class LibraryService {
  async toggleLikeSong(userId: string, songId: string) {
    const song = await prisma.song.findUnique({ where: { id: songId } });
    if (!song) {
      throw new NotFoundError('Song not found');
    }

    const existing = await prisma.favoriteSong.findUnique({
      where: { userId_songId: { userId, songId } },
    });

    if (existing) {
      await prisma.favoriteSong.delete({
        where: { id: existing.id },
      });
      return { isLiked: false, message: 'Removed from Liked Songs' };
    } else {
      await prisma.favoriteSong.create({
        data: { userId, songId },
      });
      return { isLiked: true, message: 'Added to Liked Songs' };
    }
  }

  async getLikedSongs(userId: string, page = 1, limit = 50) {
    const skip = (page - 1) * limit;

    const [total, favorites] = await Promise.all([
      prisma.favoriteSong.count({ where: { userId } }),
      prisma.favoriteSong.findMany({
        where: { userId },
        skip,
        take: limit,
        orderBy: { addedAt: 'desc' },
        include: {
          song: {
            include: {
              artist: { select: { id: true, name: true } },
              album: { select: { id: true, title: true, coverUrl: true } },
            },
          },
        },
      }),
    ]);

    const songs = favorites.map(f => ({
      ...f.song,
      addedAt: f.addedAt,
      isLiked: true,
    }));

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

  async toggleSaveAlbum(userId: string, albumId: string) {
    const album = await prisma.album.findUnique({ where: { id: albumId } });
    if (!album) {
      throw new NotFoundError('Album not found');
    }

    const existing = await prisma.savedAlbum.findUnique({
      where: { userId_albumId: { userId, albumId } },
    });

    if (existing) {
      await prisma.savedAlbum.delete({
        where: { id: existing.id },
      });
      return { isSaved: false, message: 'Removed from Saved Albums' };
    } else {
      await prisma.savedAlbum.create({
        data: { userId, albumId },
      });
      return { isSaved: true, message: 'Saved to Your Library' };
    }
  }

  async getSavedAlbums(userId: string, page = 1, limit = 30) {
    const skip = (page - 1) * limit;

    const [total, saved] = await Promise.all([
      prisma.savedAlbum.count({ where: { userId } }),
      prisma.savedAlbum.findMany({
        where: { userId },
        skip,
        take: limit,
        orderBy: { addedAt: 'desc' },
        include: {
          album: {
            include: {
              artist: { select: { id: true, name: true, avatarUrl: true } },
              _count: { select: { songs: true } },
            },
          },
        },
      }),
    ]);

    return {
      albums: saved.map(s => ({ ...s.album, addedAt: s.addedAt, isSaved: true })),
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async toggleFollowArtist(userId: string, artistId: string) {
    const artist = await prisma.artist.findUnique({ where: { id: artistId } });
    if (!artist) {
      throw new NotFoundError('Artist not found');
    }

    const existing = await prisma.followedArtist.findUnique({
      where: { userId_artistId: { userId, artistId } },
    });

    if (existing) {
      await prisma.followedArtist.delete({
        where: { id: existing.id },
      });
      return { isFollowing: false, message: 'Unfollowed artist' };
    } else {
      await prisma.followedArtist.create({
        data: { userId, artistId },
      });
      return { isFollowing: true, message: 'Following artist' };
    }
  }

  async getFollowedArtists(userId: string, page = 1, limit = 30) {
    const skip = (page - 1) * limit;

    const [total, followed] = await Promise.all([
      prisma.followedArtist.count({ where: { userId } }),
      prisma.followedArtist.findMany({
        where: { userId },
        skip,
        take: limit,
        orderBy: { followedAt: 'desc' },
        include: {
          artist: {
            include: {
              _count: { select: { followers: true, songs: true, albums: true } },
            },
          },
        },
      }),
    ]);

    return {
      artists: followed.map(f => ({ ...f.artist, followedAt: f.followedAt, isFollowing: true })),
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async getListeningHistory(userId: string, page = 1, limit = 50) {
    const skip = (page - 1) * limit;

    const [total, history] = await Promise.all([
      prisma.listeningHistory.count({ where: { userId } }),
      prisma.listeningHistory.findMany({
        where: { userId },
        skip,
        take: limit,
        orderBy: { playedAt: 'desc' },
        include: {
          song: {
            include: {
              artist: { select: { id: true, name: true } },
              album: { select: { id: true, title: true, coverUrl: true } },
            },
          },
        },
      }),
    ]);

    return {
      history,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async clearListeningHistory(userId: string) {
    await prisma.listeningHistory.deleteMany({
      where: { userId },
    });
    return { message: 'Listening history successfully cleared' };
  }
}

export const libraryService = new LibraryService();
