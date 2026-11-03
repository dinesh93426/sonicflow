import prisma from '../config/prisma.js';
import { BadRequestError, NotFoundError } from '../utils/errors.js';

export interface CreateSongDTO {
  title: string;
  artistId: string;
  albumId?: string;
  duration: number;
  genre?: string;
  storageKey: string;
  artworkUrl?: string;
  audioUrl?: string;
  trackNumber?: number;
  isExplicit?: boolean;
}

export class AdminService {
  async getDashboardMetrics() {
    const [
      totalUsers,
      totalSongs,
      totalAlbums,
      totalArtists,
      totalPlaylists,
      playbackAggregate,
      errorCount,
      recentSongs,
      recentUsers,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.song.count({ where: { isAvailable: true } }),
      prisma.album.count(),
      prisma.artist.count(),
      prisma.playlist.count(),
      prisma.song.aggregate({ _sum: { playCount: true } }),
      prisma.playbackEvent.count({ where: { eventType: 'ERROR' } }),
      prisma.song.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          artist: { select: { name: true } },
          album: { select: { title: true } },
        },
      }),
      prisma.user.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: { id: true, email: true, displayName: true, role: true, createdAt: true },
      }),
    ]);

    return {
      totalUsers,
      totalSongs,
      totalAlbums,
      totalArtists,
      totalPlaylists,
      totalPlaybacks: playbackAggregate._sum.playCount || 0,
      streamingErrors: errorCount,
      recentSongs,
      recentUsers,
    };
  }

  async createSong(userId: string, data: CreateSongDTO, ipAddress?: string) {
    if (!data.title || !data.artistId || !data.storageKey) {
      throw new BadRequestError('Title, artistId, and audio storageKey are required');
    }

    const artist = await prisma.artist.findUnique({ where: { id: data.artistId } });
    if (!artist) {
      throw new NotFoundError('Specified artist does not exist');
    }

    const song = await prisma.song.create({
      data: {
        title: data.title.trim(),
        artistId: data.artistId,
        albumId: data.albumId || null,
        duration: data.duration,
        genre: data.genre,
        storageKey: data.storageKey,
        audioUrl: data.audioUrl,
        artworkUrl: data.artworkUrl,
        trackNumber: data.trackNumber || 1,
        isExplicit: data.isExplicit || false,
      },
      include: {
        artist: true,
        album: true,
      },
    });

    // Write audit log
    await prisma.auditLog.create({
      data: {
        userId,
        action: 'CREATE_SONG',
        targetType: 'Song',
        targetId: song.id,
        details: JSON.stringify({ title: song.title, artistId: song.artistId }),
        ipAddress,
      },
    });

    return song;
  }

  async updateSong(id: string, userId: string, data: Partial<CreateSongDTO> & { isAvailable?: boolean }, ipAddress?: string) {
    const existing = await prisma.song.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundError('Song not found');
    }

    const updated = await prisma.song.update({
      where: { id },
      data,
      include: { artist: true, album: true },
    });

    await prisma.auditLog.create({
      data: {
        userId,
        action: 'UPDATE_SONG',
        targetType: 'Song',
        targetId: id,
        details: JSON.stringify(data),
        ipAddress,
      },
    });

    return updated;
  }

  async deleteSong(id: string, userId: string, ipAddress?: string) {
    const existing = await prisma.song.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundError('Song not found');
    }

    await prisma.song.delete({ where: { id } });

    await prisma.auditLog.create({
      data: {
        userId,
        action: 'DELETE_SONG',
        targetType: 'Song',
        targetId: id,
        details: JSON.stringify({ title: existing.title }),
        ipAddress,
      },
    });

    return { message: 'Song deleted successfully' };
  }

  async createArtist(userId: string, data: { name: string; bio?: string; avatarUrl?: string; bannerUrl?: string; verified?: boolean }, ipAddress?: string) {
    const artist = await prisma.artist.create({
      data,
    });

    await prisma.auditLog.create({
      data: {
        userId,
        action: 'CREATE_ARTIST',
        targetType: 'Artist',
        targetId: artist.id,
        details: JSON.stringify({ name: artist.name }),
        ipAddress,
      },
    });

    return artist;
  }

  async createAlbum(userId: string, data: { title: string; artistId: string; coverUrl?: string; releaseYear?: number; genre?: string }, ipAddress?: string) {
    const album = await prisma.album.create({
      data,
      include: { artist: true },
    });

    await prisma.auditLog.create({
      data: {
        userId,
        action: 'CREATE_ALBUM',
        targetType: 'Album',
        targetId: album.id,
        details: JSON.stringify({ title: album.title, artistId: album.artistId }),
        ipAddress,
      },
    });

    return album;
  }

  async getUsers(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [total, users] = await Promise.all([
      prisma.user.count(),
      prisma.user.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          displayName: true,
          avatarUrl: true,
          role: true,
          emailVerified: true,
          createdAt: true,
          _count: {
            select: { playlists: true, favoriteSongs: true },
          },
        },
      }),
    ]);

    return {
      users,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async updateUserRole(targetUserId: string, newRole: 'USER' | 'CONTENT_MANAGER' | 'ADMIN', adminUserId: string, ipAddress?: string) {
    const user = await prisma.user.update({
      where: { id: targetUserId },
      data: { role: newRole },
      select: { id: true, email: true, displayName: true, role: true },
    });

    await prisma.auditLog.create({
      data: {
        userId: adminUserId,
        action: 'UPDATE_USER_ROLE',
        targetType: 'User',
        targetId: targetUserId,
        details: JSON.stringify({ newRole }),
        ipAddress,
      },
    });

    return user;
  }

  async getAuditLogs(page = 1, limit = 50) {
    const skip = (page - 1) * limit;
    const [total, logs] = await Promise.all([
      prisma.auditLog.count(),
      prisma.auditLog.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, email: true, displayName: true } },
        },
      }),
    ]);

    return {
      logs,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }
}

export const adminService = new AdminService();
