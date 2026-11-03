import crypto from 'crypto';
import prisma from '../config/prisma.js';
import { env } from '../config/env.js';
import { BadRequestError, ForbiddenError, NotFoundError, UnauthorizedError } from '../utils/errors.js';

export interface SpotifyImportResult {
  playlist: any;
  importedTracksCount: number;
  catalogMatchedCount: number;
  message: string;
}

export interface PKCESession {
  userId?: string;
  codeVerifier: string;
  state: string;
  returnUrl?: string;
  createdAt: number;
}

// In-memory PKCE state cache (15-minute TTL)
const pkceStore = new Map<string, PKCESession>();

// Cleanup stale PKCE sessions every 10 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, session] of pkceStore.entries()) {
    if (now - session.createdAt > 15 * 60 * 1000) {
      pkceStore.delete(key);
    }
  }
}, 10 * 60 * 1000);

export class SpotifyService {
  private readonly SPOTIFY_AUTH_URL = 'https://accounts.spotify.com/authorize';
  private readonly SPOTIFY_TOKEN_URL = 'https://accounts.spotify.com/api/token';
  private readonly SPOTIFY_API_BASE = 'https://api.spotify.com/v1';

  private readonly SCOPES = [
    'playlist-read-private',
    'playlist-read-collaborative',
    'streaming',
    'user-read-email',
    'user-read-private',
    'user-modify-playback-state',
    'user-read-playback-state',
  ];

  /**
   * Generates PKCE code_verifier and code_challenge using SHA256 base64url encoding
   */
  generatePKCE(): { codeVerifier: string; codeChallenge: string; state: string } {
    // 64-byte random verifier (86 base64url characters, fits 43-128 requirement)
    const codeVerifier = crypto
      .randomBytes(64)
      .toString('base64url')
      .replace(/[^a-zA-Z0-9\-._~]/g, '')
      .slice(0, 96);

    const hash = crypto.createHash('sha256').update(codeVerifier).digest();
    const codeChallenge = hash
      .toString('base64url')
      .replace(/=/g, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_');

    const state = crypto.randomBytes(24).toString('hex');

    return { codeVerifier, codeChallenge, state };
  }

  /**
   * Constructs the Spotify Authorization URL for PKCE flow
   */
  createAuthorizationUrl(userId?: string, returnUrl?: string): string {
    if (!env.SPOTIFY_CLIENT_ID) {
      throw new BadRequestError(
        'SPOTIFY_CLIENT_ID is not configured in backend/.env. Please configure your Spotify Developer App.'
      );
    }

    const { codeVerifier, codeChallenge, state } = this.generatePKCE();

    // Store verifier mapped to state
    pkceStore.set(state, {
      userId,
      codeVerifier,
      state,
      returnUrl,
      createdAt: Date.now(),
    });

    const params = new URLSearchParams({
      client_id: env.SPOTIFY_CLIENT_ID,
      response_type: 'code',
      redirect_uri: env.SPOTIFY_REDIRECT_URI,
      code_challenge_method: 'S256',
      code_challenge: codeChallenge,
      state,
      scope: this.SCOPES.join(' '),
      show_dialog: 'true',
    });

    return `${this.SPOTIFY_AUTH_URL}?${params.toString()}`;
  }

  /**
   * Handles Spotify OAuth callback, exchanges code for access & refresh tokens
   */
  async handleCallback(code: string, state: string, currentUserId?: string) {
    const session = pkceStore.get(state);
    if (!session) {
      throw new BadRequestError('Invalid, expired, or missing OAuth state parameter. Please try logging in again.');
    }

    pkceStore.delete(state);

    const userId = session.userId || currentUserId;
    if (!userId) {
      throw new UnauthorizedError('User session not found. Please log into SonicFlow before connecting Spotify.');
    }

    // Exchange authorization code for tokens using PKCE verifier
    const bodyParams = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: env.SPOTIFY_REDIRECT_URI,
      client_id: env.SPOTIFY_CLIENT_ID,
      code_verifier: session.codeVerifier,
    });

    const headers: Record<string, string> = {
      'Content-Type': 'application/x-www-form-urlencoded',
    };

    if (env.SPOTIFY_CLIENT_SECRET) {
      const basicAuth = Buffer.from(`${env.SPOTIFY_CLIENT_ID}:${env.SPOTIFY_CLIENT_SECRET}`).toString('base64');
      headers['Authorization'] = `Basic ${basicAuth}`;
    }

    const tokenRes = await fetch(this.SPOTIFY_TOKEN_URL, {
      method: 'POST',
      headers,
      body: bodyParams.toString(),
    });

    const tokenData = (await tokenRes.json()) as any;
    if (!tokenRes.ok || !tokenData.access_token) {
      console.error('Spotify token exchange failed:', tokenData);
      throw new BadRequestError(
        `Failed to exchange Spotify token: ${tokenData.error_description || tokenData.error || tokenRes.statusText}`
      );
    }

    // Fetch Spotify user profile to inspect product type ('premium' vs 'free')
    let profileData: any = null;
    try {
      const profileRes = await fetch(`${this.SPOTIFY_API_BASE}/me`, {
        headers: { Authorization: `Bearer ${tokenData.access_token}` },
      });
      if (profileRes.ok) {
        profileData = await profileRes.json();
      }
    } catch (err) {
      console.warn('Could not retrieve Spotify user profile:', err);
    }

    const expiresAt = new Date(Date.now() + (tokenData.expires_in || 3600) * 1000);

    // Persist Spotify credentials securely to User record
    await prisma.user.update({
      where: { id: userId },
      data: {
        spotifyAccessToken: tokenData.access_token,
        spotifyRefreshToken: tokenData.refresh_token || undefined,
        spotifyTokenExpiresAt: expiresAt,
        spotifyProduct: profileData?.product || 'free',
        spotifyUserId: profileData?.id || undefined,
      },
    });

    return {
      userId,
      returnUrl: session.returnUrl || '/library',
      product: profileData?.product || 'free',
      isPremium: profileData?.product === 'premium',
      spotifyUserId: profileData?.id,
    };
  }

  /**
   * Retrieves a valid Spotify access token for a user, automatically refreshing if expired
   */
  async getValidAccessToken(userId: string): Promise<string> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        spotifyAccessToken: true,
        spotifyRefreshToken: true,
        spotifyTokenExpiresAt: true,
        spotifyProduct: true,
      },
    });

    if (!user || !user.spotifyAccessToken) {
      throw new UnauthorizedError(
        'No connected Spotify account found. Connect your Spotify account to import playlists or stream Spotify tracks.'
      );
    }

    // Check if token expires within 2 minutes
    const isExpired =
      !user.spotifyTokenExpiresAt ||
      new Date(user.spotifyTokenExpiresAt).getTime() - Date.now() < 2 * 60 * 1000;

    if (!isExpired) {
      return user.spotifyAccessToken;
    }

    if (!user.spotifyRefreshToken) {
      throw new UnauthorizedError('Spotify refresh token missing. Please reconnect your Spotify account.');
    }

    // Refresh token via Spotify Web API
    const bodyParams = new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: user.spotifyRefreshToken,
      client_id: env.SPOTIFY_CLIENT_ID,
    });

    const headers: Record<string, string> = {
      'Content-Type': 'application/x-www-form-urlencoded',
    };

    if (env.SPOTIFY_CLIENT_SECRET) {
      const basicAuth = Buffer.from(`${env.SPOTIFY_CLIENT_ID}:${env.SPOTIFY_CLIENT_SECRET}`).toString('base64');
      headers['Authorization'] = `Basic ${basicAuth}`;
    }

    const refreshRes = await fetch(this.SPOTIFY_TOKEN_URL, {
      method: 'POST',
      headers,
      body: bodyParams.toString(),
    });

    const refreshData = (await refreshRes.json()) as any;
    if (!refreshRes.ok || !refreshData.access_token) {
      console.error('Spotify token refresh failed:', refreshData);
      throw new UnauthorizedError('Failed to refresh Spotify session. Please reconnect your Spotify account.');
    }

    const newExpiresAt = new Date(Date.now() + (refreshData.expires_in || 3600) * 1000);

    await prisma.user.update({
      where: { id: userId },
      data: {
        spotifyAccessToken: refreshData.access_token,
        spotifyRefreshToken: refreshData.refresh_token || user.spotifyRefreshToken,
        spotifyTokenExpiresAt: newExpiresAt,
      },
    });

    return refreshData.access_token;
  }

  /**
   * Extracts playlist ID from:
   * - https://open.spotify.com/playlist/{id}?si=...
   * - https://open.spotify.com/playlist/{id}
   * - spotify:playlist:{id}
   * - {id} (22-character alphanumeric id)
   */
  extractPlaylistId(input: string): string {
    if (!input || typeof input !== 'string') {
      throw new BadRequestError('Spotify playlist link or URI is required');
    }

    const trimmed = input.trim();

    // Match web URL format
    const urlMatch = trimmed.match(/playlist\/([a-zA-Z0-9]{22})/);
    if (urlMatch) return urlMatch[1];

    // Match spotify URI format
    const uriMatch = trimmed.match(/spotify:playlist:([a-zA-Z0-9]{22})/);
    if (uriMatch) return uriMatch[1];

    // Match raw 22-character Spotify ID
    if (/^[a-zA-Z0-9]{22}$/.test(trimmed)) {
      return trimmed;
    }

    throw new BadRequestError(
      'Invalid Spotify playlist link or URI. Expected format: https://open.spotify.com/playlist/{id} or spotify:playlist:{id}'
    );
  }

  /**
   * Fetches playlist details and traverses all paginated tracks (limit 100)
   */
  async fetchPlaylistWithAllTracks(playlistId: string, accessToken: string) {
    let nextUrl: string | null = `${this.SPOTIFY_API_BASE}/playlists/${playlistId}`;
    let playlistInfo: any = null;
    const allTracks: any[] = [];

    // First call fetches metadata + first 100 items
    const initialRes = await fetch(nextUrl, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!initialRes.ok) {
      if (initialRes.status === 401) {
        throw new UnauthorizedError('Spotify access token expired. Please reconnect your account.');
      }
      if (initialRes.status === 403) {
        throw new ForbiddenError(
          'Private playlist: This playlist is private or restricted. Please connect a Spotify account with access.'
        );
      }
      if (initialRes.status === 404) {
        throw new NotFoundError('Spotify playlist not found. Please verify the link or playlist ID.');
      }
      if (initialRes.status === 429) {
        const retryAfter = initialRes.headers.get('Retry-After') || '5';
        throw new BadRequestError(`Spotify rate limit reached. Please retry after ${retryAfter} seconds.`);
      }

      const errText = await initialRes.text().catch(() => '');
      throw new BadRequestError(`Spotify API error (HTTP ${initialRes.status}): ${errText}`);
    }

    playlistInfo = (await initialRes.json()) as any;
    const firstItems = playlistInfo.tracks?.items || [];
    allTracks.push(...firstItems);

    nextUrl = playlistInfo.tracks?.next || null;

    // Follow pagination until all tracks are acquired
    while (nextUrl) {
      const pageRes = await fetch(nextUrl, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (!pageRes.ok) {
        if (pageRes.status === 429) {
          const retryAfter = parseInt(pageRes.headers.get('Retry-After') || '2', 10);
          await new Promise((r) => setTimeout(r, (retryAfter + 1) * 1000));
          continue;
        }
        console.warn(`Pagination interrupted at ${nextUrl}: HTTP ${pageRes.status}`);
        break;
      }

      const pageData = (await pageRes.json()) as any;
      const items = pageData.items || [];
      allTracks.push(...items);
      nextUrl = pageData.next || null;
    }

    return {
      playlistInfo,
      items: allTracks,
    };
  }

  /**
   * Imports a Spotify playlist into SonicFlow database
   * - Deduplicates items
   * - Skips null, podcast, or local files
   * - Performs catalog matching against local songs
   * - Pure playback through Web Playback SDK / local files (no downloads)
   */
  async importPlaylist(spotifyUrl: string, userId: string): Promise<SpotifyImportResult> {
    const playlistId = this.extractPlaylistId(spotifyUrl);
    const accessToken = await this.getValidAccessToken(userId);

    const { playlistInfo, items } = await this.fetchPlaylistWithAllTracks(playlistId, accessToken);

    const title = playlistInfo.name || 'Imported Spotify Playlist';
    const description = playlistInfo.description || `Imported from Spotify (${playlistId}). Streamed with Spotify Web Playback.`;
    const coverUrl =
      playlistInfo.images?.[0]?.url ||
      'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=600&q=80';

    // 1. Create Playlist record
    const createdPlaylist = await prisma.playlist.create({
      data: {
        title,
        description,
        coverUrl,
        isPublic: true,
        userId,
        source: 'spotify',
        spotifyPlaylistId: playlistId,
      },
    });

    let importedCount = 0;
    let catalogMatchedCount = 0;
    const seenSpotifyTrackIds = new Set<string>();

    // 2. Iterate tracks
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (!item || !item.track) continue;

      const track = item.track;

      // Skip non-track items (episodes, podcasts, local files)
      if (track.is_local || track.type !== 'track' || !track.id) {
        continue;
      }

      // Deduplicate track within this import
      if (seenSpotifyTrackIds.has(track.id)) {
        continue;
      }
      seenSpotifyTrackIds.add(track.id);

      const trackTitle = track.name || `Track ${i + 1}`;
      const primaryArtistName = track.artists?.[0]?.name || 'Unknown Artist';
      const allArtists = (track.artists || []).map((a: any) => a.name).join(', ') || primaryArtistName;
      const albumTitle = track.album?.name || `${primaryArtistName} Collection`;
      const artworkUrl = track.album?.images?.[0]?.url || coverUrl;
      const durationMs = track.duration_ms || 180000;
      const durationSeconds = Math.round(durationMs / 1000);
      const isExplicit = Boolean(track.explicit);
      const spotifyUri = track.uri || `spotify:track:${track.id}`;

      try {
        // Catalog Matching: check whether matching uploaded track exists in library (case-insensitive)
        const matchedLocalSong = await prisma.song.findFirst({
          where: {
            title: { equals: trackTitle, mode: 'insensitive' },
            artist: { name: { equals: primaryArtistName, mode: 'insensitive' } },
            source: 'local',
          },
        });

        let targetSongId = '';

        if (matchedLocalSong) {
          // Link existing local song directly
          targetSongId = matchedLocalSong.id;
          catalogMatchedCount++;
        } else {
          // Check if we already have this spotify track stored
          let existingSpotifySong = await prisma.song.findUnique({
            where: { spotifyTrackId: track.id },
          });

          if (existingSpotifySong) {
            targetSongId = existingSpotifySong.id;
          } else {
            // Find or create Artist
            let artist = await prisma.artist.findFirst({
              where: { name: { equals: primaryArtistName, mode: 'insensitive' } },
            });
            if (!artist) {
              artist = await prisma.artist.create({
                data: {
                  name: primaryArtistName,
                  avatarUrl: artworkUrl,
                  verified: true,
                },
              });
            }

            // Find or create Album
            let album = await prisma.album.findFirst({
              where: {
                title: { equals: albumTitle, mode: 'insensitive' },
                artistId: artist.id,
              },
            });
            if (!album) {
              album = await prisma.album.create({
                data: {
                  title: albumTitle,
                  artistId: artist.id,
                  coverUrl: artworkUrl,
                  releaseYear: track.album?.release_date ? parseInt(track.album.release_date.slice(0, 4), 10) : new Date().getFullYear(),
                  genre: 'Spotify Import',
                },
              });
            }

            // Create Song with source: "spotify"
            const newSong = await prisma.song.create({
              data: {
                title: trackTitle,
                artistId: artist.id,
                albumId: album.id,
                duration: durationSeconds,
                durationMs,
                genre: 'Spotify Import',
                artworkUrl,
                source: 'spotify',
                spotifyTrackId: track.id,
                spotifyUri,
                storageKey: null,
                audioUrl: null,
                isExplicit,
                isAvailable: true,
                playCount: 0,
              },
            });
            targetSongId = newSong.id;
          }
        }

        // Add track to Playlist
        await prisma.playlistTrack.create({
          data: {
            playlistId: createdPlaylist.id,
            songId: targetSongId,
            position: importedCount,
          },
        });

        importedCount++;
      } catch (trackErr) {
        console.warn(`Failed to save track "${trackTitle}" (${track.id}):`, trackErr);
      }
    }

    const message =
      catalogMatchedCount > 0
        ? `Imported ${importedCount} tracks (${catalogMatchedCount} matched to local audio)`
        : `Imported ${importedCount} tracks`;

    return {
      playlist: createdPlaylist,
      importedTracksCount: importedCount,
      catalogMatchedCount,
      message,
    };
  }

  /**
   * Triggers playback on a Spotify Connect / Web Playback SDK device
   */
  async playOnDevice(userId: string, deviceId: string, uris: string[], positionMs = 0) {
    const accessToken = await this.getValidAccessToken(userId);

    const res = await fetch(`${this.SPOTIFY_API_BASE}/me/player/play?device_id=${encodeURIComponent(deviceId)}`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        uris: uris.length > 0 ? uris : undefined,
        position_ms: positionMs,
      }),
    });

    if (!res.ok) {
      if (res.status === 404) {
        throw new NotFoundError('Spotify player device not found or inactive. Please reconnect the web player.');
      }
      if (res.status === 403) {
        throw new ForbiddenError(
          'Spotify Premium is required for Web Playback SDK control. Please ensure your account has an active Premium subscription.'
        );
      }
      const errText = await res.text().catch(() => '');
      throw new BadRequestError(`Spotify playback command failed (HTTP ${res.status}): ${errText}`);
    }

    return { success: true };
  }

  /**
   * Disconnects a user's Spotify integration
   */
  async disconnectSpotify(userId: string) {
    await prisma.user.update({
      where: { id: userId },
      data: {
        spotifyAccessToken: null,
        spotifyRefreshToken: null,
        spotifyTokenExpiresAt: null,
        spotifyProduct: null,
        spotifyUserId: null,
      },
    });

    return { message: 'Spotify account disconnected successfully' };
  }
}

export const spotifyService = new SpotifyService();
