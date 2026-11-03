import prisma from '../config/prisma.js';
import { BadRequestError, ForbiddenError, NotFoundError } from '../utils/errors.js';

export interface CreatePlaylistDTO {
  title: string;
  description?: string;
  coverUrl?: string;
  isPublic?: boolean;
  isUnlisted?: boolean;
}

export class PlaylistService {
  async createPlaylist(userId: string, data: CreatePlaylistDTO) {
    if (!data.title || data.title.trim() === '') {
      throw new BadRequestError('Playlist title is required');
    }

    const playlist = await prisma.playlist.create({
      data: {
        title: data.title.trim(),
        description: data.description,
        coverUrl: data.coverUrl,
        isPublic: data.isPublic !== undefined ? data.isPublic : true,
        isUnlisted: data.isUnlisted || false,
        userId,
      },
      include: {
        user: { select: { id: true, displayName: true, avatarUrl: true } },
        _count: { select: { tracks: true } },
      },
    });

    return playlist;
  }

  async getUserPlaylists(userId: string) {
    const playlists = await prisma.playlist.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      include: {
        user: { select: { id: true, displayName: true } },
        _count: { select: { tracks: true } },
      },
    });

    return playlists;
  }

  async getPublicPlaylists(page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [total, playlists] = await Promise.all([
      prisma.playlist.count({ where: { isPublic: true, isUnlisted: false } }),
      prisma.playlist.findMany({
        where: { isPublic: true, isUnlisted: false },
        skip,
        take: limit,
        orderBy: { updatedAt: 'desc' },
        include: {
          user: { select: { id: true, displayName: true, avatarUrl: true } },
          _count: { select: { tracks: true } },
        },
      }),
    ]);

    return {
      playlists,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async getPlaylistById(id: string, currentUserId?: string) {
    const playlist = await prisma.playlist.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, displayName: true, avatarUrl: true } },
        tracks: {
          orderBy: { position: 'asc' },
          include: {
            song: {
              include: {
                artist: { select: { id: true, name: true } },
                album: { select: { id: true, title: true, coverUrl: true } },
              },
            },
          },
        },
      },
    });

    if (!playlist) {
      throw new NotFoundError('Playlist not found');
    }

    // Privacy check
    const isOwner = currentUserId && playlist.userId === currentUserId;
    if (!playlist.isPublic && !isOwner) {
      throw new ForbiddenError('This playlist is private');
    }

    const totalDuration = playlist.tracks.reduce((acc, t) => acc + (t.song?.duration || 0), 0);

    return { ...playlist, isOwner, totalDuration };
  }

  async updatePlaylist(id: string, userId: string, data: Partial<CreatePlaylistDTO>) {
    const playlist = await prisma.playlist.findUnique({ where: { id } });
    if (!playlist) {
      throw new NotFoundError('Playlist not found');
    }
    if (playlist.userId !== userId) {
      throw new ForbiddenError('You do not have permission to edit this playlist');
    }

    const updated = await prisma.playlist.update({
      where: { id },
      data: {
        title: data.title?.trim() || playlist.title,
        description: data.description !== undefined ? data.description : playlist.description,
        coverUrl: data.coverUrl !== undefined ? data.coverUrl : playlist.coverUrl,
        isPublic: data.isPublic !== undefined ? data.isPublic : playlist.isPublic,
        isUnlisted: data.isUnlisted !== undefined ? data.isUnlisted : playlist.isUnlisted,
      },
      include: {
        user: { select: { id: true, displayName: true } },
        _count: { select: { tracks: true } },
      },
    });

    return updated;
  }

  async deletePlaylist(id: string, userId: string) {
    const playlist = await prisma.playlist.findUnique({ where: { id } });
    if (!playlist) {
      throw new NotFoundError('Playlist not found');
    }
    if (playlist.userId !== userId) {
      throw new ForbiddenError('You do not have permission to delete this playlist');
    }

    await prisma.playlist.delete({ where: { id } });
    return { message: 'Playlist deleted successfully' };
  }

  async addTrackToPlaylist(playlistId: string, songId: string, userId: string) {
    const playlist = await prisma.playlist.findUnique({ where: { id: playlistId } });
    if (!playlist) {
      throw new NotFoundError('Playlist not found');
    }
    if (playlist.userId !== userId) {
      throw new ForbiddenError('You do not have permission to modify this playlist');
    }

    const song = await prisma.song.findUnique({ where: { id: songId } });
    if (!song) {
      throw new NotFoundError('Song not found');
    }

    const existingTrack = await prisma.playlistTrack.findUnique({
      where: { playlistId_songId: { playlistId, songId } },
    });
    if (existingTrack) {
      throw new BadRequestError('This song is already in the playlist');
    }

    const maxPosition = await prisma.playlistTrack.aggregate({
      where: { playlistId },
      _max: { position: true },
    });

    const nextPosition = (maxPosition._max.position ?? -1) + 1;

    const track = await prisma.playlistTrack.create({
      data: {
        playlistId,
        songId,
        position: nextPosition,
      },
      include: {
        song: {
          include: {
            artist: { select: { id: true, name: true } },
            album: { select: { id: true, title: true, coverUrl: true } },
          },
        },
      },
    });

    return track;
  }

  async removeTrackFromPlaylist(playlistId: string, songId: string, userId: string) {
    const playlist = await prisma.playlist.findUnique({ where: { id: playlistId } });
    if (!playlist) {
      throw new NotFoundError('Playlist not found');
    }
    if (playlist.userId !== userId) {
      throw new ForbiddenError('You do not have permission to modify this playlist');
    }

    const track = await prisma.playlistTrack.findUnique({
      where: { playlistId_songId: { playlistId, songId } },
    });
    if (!track) {
      throw new NotFoundError('Track not found in playlist');
    }

    await prisma.playlistTrack.delete({
      where: { id: track.id },
    });

    return { message: 'Track removed from playlist' };
  }

  async reorderTracks(playlistId: string, userId: string, trackIdsInOrder: string[]) {
    const playlist = await prisma.playlist.findUnique({ where: { id: playlistId } });
    if (!playlist) {
      throw new NotFoundError('Playlist not found');
    }
    if (playlist.userId !== userId) {
      throw new ForbiddenError('You do not have permission to modify this playlist');
    }

    // Execute within transaction
    await prisma.$transaction(
      trackIdsInOrder.map((trackId, index) =>
        prisma.playlistTrack.update({
          where: { id: trackId },
          data: { position: index },
        })
      )
    );

    return { message: 'Playlist tracks reordered successfully' };
  }
}

export const playlistService = new PlaylistService();
