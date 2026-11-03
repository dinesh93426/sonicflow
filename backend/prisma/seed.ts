import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import path from 'path';
import { generateProceduralTrack } from './generateAudio.js';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting SonicFlow database seeding...');

  // 1. Clean existing records in correct relation order
  await prisma.playbackEvent.deleteMany();
  await prisma.listeningHistory.deleteMany();
  await prisma.playlistTrack.deleteMany();
  await prisma.playlist.deleteMany();
  await prisma.favoriteSong.deleteMany();
  await prisma.savedAlbum.deleteMany();
  await prisma.followedArtist.deleteMany();
  await prisma.songGenre.deleteMany();
  await prisma.song.deleteMany();
  await prisma.album.deleteMany();
  await prisma.artist.deleteMany();
  await prisma.genre.deleteMany();
  await prisma.session.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.user.deleteMany();

  // 2. Seed Users
  const salt = await bcrypt.genSalt(10);
  const adminPasswordHash = await bcrypt.hash('AdminPass123!', salt);
  const userPasswordHash = await bcrypt.hash('UserPass123!', salt);

  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@sonicflow.app',
      passwordHash: adminPasswordHash,
      displayName: 'SonicFlow Admin',
      role: 'ADMIN',
      emailVerified: true,
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
    },
  });

  const demoUser = await prisma.user.create({
    data: {
      email: 'user@sonicflow.app',
      passwordHash: userPasswordHash,
      displayName: 'Alex Rivers',
      role: 'USER',
      emailVerified: true,
      avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=400&q=80',
    },
  });

  console.log(`✅ Seeded Users: ${adminUser.email} (Admin), ${demoUser.email} (User)`);

  // 3. Seed Genres
  const genresData = [
    { name: 'Synthwave', slug: 'synthwave', color: '#ec4899', icon: 'zap' },
    { name: 'Lo-Fi Chill', slug: 'lo-fi-chill', color: '#8b5cf6', icon: 'coffee' },
    { name: 'Ambient Space', slug: 'ambient-space', color: '#06b6d4', icon: 'moon' },
    { name: 'Cyberpunk', slug: 'cyberpunk', color: '#10b981', icon: 'terminal' },
    { name: 'Deep House', slug: 'deep-house', color: '#f59e0b', icon: 'disc' },
    { name: 'Neo-Classical', slug: 'neo-classical', color: '#6366f1', icon: 'music' },
  ];

  const genres: Record<string, any> = {};
  for (const g of genresData) {
    genres[g.slug] = await prisma.genre.create({ data: g });
  }
  console.log('✅ Seeded Genres');

  // 4. Seed Artists
  const artistsData = [
    {
      name: 'Aura Drift',
      bio: 'Pioneering ambient electronic soundscapes with ethereal analog synths and organic textures.',
      avatarUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=600&q=80',
      bannerUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=1600&q=80',
      verified: true,
    },
    {
      name: 'Neon Horizon',
      bio: 'Retro-futuristic synthwave duo from Tokyo crafting cinematic highway soundtracks.',
      avatarUrl: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&w=600&q=80',
      bannerUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1600&q=80',
      verified: true,
    },
    {
      name: 'Komorebi Beats',
      bio: 'Coffee shop lo-fi hip hop producer blending nostalgic vinyl crackle with jazz keys.',
      avatarUrl: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=600&q=80',
      bannerUrl: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=1600&q=80',
      verified: true,
    },
    {
      name: 'Solaris Echo',
      bio: 'Deep space melodic techno architect creating immersive cosmic frequencies.',
      avatarUrl: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&w=600&q=80',
      bannerUrl: 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?auto=format&fit=crop&w=1600&q=80',
      verified: true,
    },
  ];

  const artists: Record<string, any> = {};
  for (const a of artistsData) {
    artists[a.name] = await prisma.artist.create({ data: a });
  }
  console.log('✅ Seeded Artists');

  // 5. Seed Albums
  const albumsData = [
    {
      title: 'Celestial Drift',
      artistId: artists['Aura Drift'].id,
      coverUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=600&q=80',
      releaseYear: 2024,
      genre: 'Ambient Space',
    },
    {
      title: 'Midnight Overdrive',
      artistId: artists['Neon Horizon'].id,
      coverUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=600&q=80',
      releaseYear: 2024,
      genre: 'Synthwave',
    },
    {
      title: 'Rainy Day Thoughts',
      artistId: artists['Komorebi Beats'].id,
      coverUrl: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=600&q=80',
      releaseYear: 2023,
      genre: 'Lo-Fi Chill',
    },
    {
      title: 'Starlight Horizons',
      artistId: artists['Solaris Echo'].id,
      coverUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=600&q=80',
      releaseYear: 2024,
      genre: 'Cyberpunk',
    },
  ];

  const albums: Record<string, any> = {};
  for (const alb of albumsData) {
    albums[alb.title] = await prisma.album.create({ data: alb });
  }
  console.log('✅ Seeded Albums');

  // 6. Generate and Seed Authentic Audio Files & Songs
  const audioDir = path.resolve(process.cwd(), 'uploads', 'audio');
  const songsCatalog = [
    {
      title: 'Solar Winds',
      artistName: 'Aura Drift',
      albumTitle: 'Celestial Drift',
      duration: 34,
      genre: 'Ambient Space',
      trackNumber: 1,
      freq: 220,
      type: 'ambient' as const,
      artworkUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=600&q=80',
    },
    {
      title: 'Starlight Voyage',
      artistName: 'Aura Drift',
      albumTitle: 'Celestial Drift',
      duration: 42,
      genre: 'Ambient Space',
      trackNumber: 2,
      freq: 261.63,
      type: 'ambient' as const,
      artworkUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=600&q=80',
    },
    {
      title: 'Cyber Highway 101',
      artistName: 'Neon Horizon',
      albumTitle: 'Midnight Overdrive',
      duration: 38,
      genre: 'Synthwave',
      trackNumber: 1,
      freq: 146.83,
      type: 'synthwave' as const,
      artworkUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=600&q=80',
    },
    {
      title: 'Neon Nights',
      artistName: 'Neon Horizon',
      albumTitle: 'Midnight Overdrive',
      duration: 45,
      genre: 'Synthwave',
      trackNumber: 2,
      freq: 164.81,
      type: 'synthwave' as const,
      artworkUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=600&q=80',
    },
    {
      title: 'Midnight Coffee',
      artistName: 'Komorebi Beats',
      albumTitle: 'Rainy Day Thoughts',
      duration: 36,
      genre: 'Lo-Fi Chill',
      trackNumber: 1,
      freq: 196.0,
      type: 'lofi' as const,
      artworkUrl: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=600&q=80',
    },
    {
      title: 'Window Rain',
      artistName: 'Komorebi Beats',
      albumTitle: 'Rainy Day Thoughts',
      duration: 40,
      genre: 'Lo-Fi Chill',
      trackNumber: 2,
      freq: 174.61,
      type: 'lofi' as const,
      artworkUrl: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=600&q=80',
    },
    {
      title: 'Singularity Drift',
      artistName: 'Solaris Echo',
      albumTitle: 'Starlight Horizons',
      duration: 50,
      genre: 'Cyberpunk',
      trackNumber: 1,
      freq: 130.81,
      type: 'electronic' as const,
      artworkUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=600&q=80',
    },
    {
      title: 'Pulse of Eternity',
      artistName: 'Solaris Echo',
      albumTitle: 'Starlight Horizons',
      duration: 44,
      genre: 'Cyberpunk',
      trackNumber: 2,
      freq: 110.0,
      type: 'electronic' as const,
      artworkUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=600&q=80',
    },
  ];

  const createdSongs: any[] = [];
  for (const item of songsCatalog) {
    const filename = `${item.title.toLowerCase().replace(/[^a-z0-9]/g, '_')}.wav`;
    const fullAudioPath = path.join(audioDir, filename);

    // Generate genuine playable PCM WAV audio
    generateProceduralTrack(fullAudioPath, item.duration, item.freq, item.type);

    const song = await prisma.song.create({
      data: {
        title: item.title,
        artistId: artists[item.artistName].id,
        albumId: albums[item.albumTitle].id,
        duration: item.duration,
        genre: item.genre,
        trackNumber: item.trackNumber,
        artworkUrl: item.artworkUrl,
        storageKey: fullAudioPath,
        audioUrl: `/api/v1/playback/stream/${filename}`,
        isAvailable: true,
        playCount: Math.floor(Math.random() * 50) + 10,
      },
      include: {
        artist: true,
        album: true,
      },
    });

    createdSongs.push(song);
  }
  console.log(`✅ Generated and Seeded ${createdSongs.length} pristine playable audio tracks`);

  // 7. Seed Playlists
  const chillPlaylist = await prisma.playlist.create({
    data: {
      title: 'Deep Focus & Ambient Chill',
      description: 'Zero distractions, pure state of flow. Hand-curated ad-free electronic and lo-fi melodies.',
      coverUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=600&q=80',
      isPublic: true,
      userId: adminUser.id,
    },
  });

  const synthPlaylist = await prisma.playlist.create({
    data: {
      title: 'Night Drive 80s Cyberpunk',
      description: 'Pumping synth basslines and neon nostalgia for late night highways.',
      coverUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=600&q=80',
      isPublic: true,
      userId: demoUser.id,
    },
  });

  // Add tracks to playlists
  await prisma.playlistTrack.createMany({
    data: [
      { playlistId: chillPlaylist.id, songId: createdSongs[0].id, position: 0 },
      { playlistId: chillPlaylist.id, songId: createdSongs[1].id, position: 1 },
      { playlistId: chillPlaylist.id, songId: createdSongs[4].id, position: 2 },
      { playlistId: chillPlaylist.id, songId: createdSongs[5].id, position: 3 },
      { playlistId: synthPlaylist.id, songId: createdSongs[2].id, position: 0 },
      { playlistId: synthPlaylist.id, songId: createdSongs[3].id, position: 1 },
      { playlistId: synthPlaylist.id, songId: createdSongs[6].id, position: 2 },
      { playlistId: synthPlaylist.id, songId: createdSongs[7].id, position: 3 },
    ],
  });

  // Seed sample user favorites
  await prisma.favoriteSong.create({
    data: { userId: demoUser.id, songId: createdSongs[0].id },
  });
  await prisma.favoriteSong.create({
    data: { userId: demoUser.id, songId: createdSongs[2].id },
  });

  // Seed sample followed artist
  await prisma.followedArtist.create({
    data: { userId: demoUser.id, artistId: artists['Neon Horizon'].id },
  });

  console.log('✅ Seeded Playlists and Initial User Library');
  console.log('🎉 SonicFlow Database Seeding complete!');
}

main()
  .catch(e => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
