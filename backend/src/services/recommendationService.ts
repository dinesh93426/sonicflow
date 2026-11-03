import prisma from '../config/prisma.js';

export class RecommendationService {
  async getRecommendations(userId?: string, limit = 20) {
    // If guest or no listening data, return curated/trending songs
    if (!userId) {
      return this.getCuratedTrending(limit);
    }

    // 1. Identify user's liked songs & followed artists & listening history
    const [likedSongs, followedArtists, recentHistory] = await Promise.all([
      prisma.favoriteSong.findMany({
        where: { userId },
        take: 30,
        select: { songId: true, song: { select: { genre: true, artistId: true } } },
      }),
      prisma.followedArtist.findMany({
        where: { userId },
        select: { artistId: true },
      }),
      prisma.listeningHistory.findMany({
        where: { userId },
        take: 30,
        orderBy: { playedAt: 'desc' },
        select: { songId: true, song: { select: { genre: true, artistId: true } } },
      }),
    ]);

    // If user has zero listening or liked data yet, provide popular/trending discovery
    if (likedSongs.length === 0 && followedArtists.length === 0 && recentHistory.length === 0) {
      return this.getCuratedTrending(limit);
    }

    // 2. Aggregate favorite genres and artists
    const genreScore: Record<string, number> = {};
    const artistScore: Record<string, number> = {};
    const excludedSongIds = new Set<string>();

    likedSongs.forEach(item => {
      excludedSongIds.add(item.songId);
      if (item.song?.genre) {
        genreScore[item.song.genre] = (genreScore[item.song.genre] || 0) + 3;
      }
      if (item.song?.artistId) {
        artistScore[item.song.artistId] = (artistScore[item.song.artistId] || 0) + 2;
      }
    });

    followedArtists.forEach(fa => {
      artistScore[fa.artistId] = (artistScore[fa.artistId] || 0) + 4;
    });

    // Exclude recently played to avoid instant repetition
    recentHistory.slice(0, 10).forEach(h => {
      excludedSongIds.add(h.songId);
      if (h.song?.genre) {
        genreScore[h.song.genre] = (genreScore[itemGenre(h.song.genre)] || 0) + 1;
      }
    });

    function itemGenre(g: string) {
      return g;
    }

    const topGenres = Object.entries(genreScore)
      .sort((a, b) => b[1] - a[1])
      .map(entry => entry[0])
      .slice(0, 3);

    const topArtistIds = Object.entries(artistScore)
      .sort((a, b) => b[1] - a[1])
      .map(entry => entry[0])
      .slice(0, 5);

    // 3. Find candidates matching top genres or artists
    const candidates = await prisma.song.findMany({
      where: {
        isAvailable: true,
        id: { notIn: Array.from(excludedSongIds) },
        OR: [
          ...(topGenres.length > 0 ? [{ genre: { in: topGenres } }] : []),
          ...(topArtistIds.length > 0 ? [{ artistId: { in: topArtistIds } }] : []),
        ],
      },
      take: limit * 2,
      include: {
        artist: { select: { id: true, name: true, avatarUrl: true } },
        album: { select: { id: true, title: true, coverUrl: true } },
      },
    });

    // If not enough personalized candidates, supplement with popular songs
    if (candidates.length < limit) {
      const popular = await prisma.song.findMany({
        where: {
          isAvailable: true,
          id: { notIn: [...Array.from(excludedSongIds), ...candidates.map(c => c.id)] },
        },
        take: limit - candidates.length,
        orderBy: { playCount: 'desc' },
        include: {
          artist: { select: { id: true, name: true, avatarUrl: true } },
          album: { select: { id: true, title: true, coverUrl: true } },
        },
      });
      candidates.push(...popular);
    }

    // 4. Rank candidates by matching score + popularity
    const ranked = candidates.map(song => {
      let score = 0;
      if (song.genre && genreScore[song.genre]) score += genreScore[song.genre];
      if (artistScore[song.artistId]) score += artistScore[song.artistId];
      score += Math.min(10, Math.log10(song.playCount + 1));
      return { song, score };
    });

    ranked.sort((a, b) => b.score - a.score);

    return ranked.slice(0, limit).map(r => r.song);
  }

  private async getCuratedTrending(limit = 20) {
    return prisma.song.findMany({
      where: { isAvailable: true },
      take: limit,
      orderBy: { playCount: 'desc' },
      include: {
        artist: { select: { id: true, name: true, avatarUrl: true } },
        album: { select: { id: true, title: true, coverUrl: true } },
      },
    });
  }
}

export const recommendationService = new RecommendationService();
