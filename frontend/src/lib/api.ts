const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

class ApiClient {
  private getHeaders(): HeadersInit {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('sonicflow_token');
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }
    return headers;
  }

  async request<T>(endpoint: string, options: RequestInit = {}): Promise<{ data: T; meta?: any; success: boolean; message?: string }> {
    const url = `${API_BASE}${endpoint}`;
    const headers = { ...this.getHeaders(), ...(options.headers as Record<string, string>) };

    // Remove Content-Type if uploading FormData
    if (options.body instanceof FormData) {
      delete (headers as any)['Content-Type'];
    }

    const response = await fetch(url, {
      ...options,
      headers,
      credentials: 'include', // sends cookies
    });

    const json = await response.json().catch(() => ({}));

    if (!response.ok) {
      const message = json.message || `Request failed with status ${response.status}`;
      throw new Error(message);
    }

    return json;
  }

  // Auth
  register(body: any) {
    return this.request<any>('/auth/register', { method: 'POST', body: JSON.stringify(body) });
  }
  login(body: any) {
    return this.request<any>('/auth/login', { method: 'POST', body: JSON.stringify(body) });
  }
  logout() {
    return this.request<any>('/auth/logout', { method: 'POST' });
  }
  getMe() {
    return this.request<any>('/auth/me');
  }
  updateMe(body: any) {
    return this.request<any>('/auth/me', { method: 'PATCH', body: JSON.stringify(body) });
  }
  deleteAccount() {
    return this.request<any>('/auth/me', { method: 'DELETE' });
  }

  // Catalog
  getSongs(params: Record<string, any> = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request<any[]>(`/songs?${query}`);
  }
  getSong(id: string) {
    return this.request<any>(`/songs/${id}`);
  }
  getArtists(params: Record<string, any> = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request<any[]>(`/artists?${query}`);
  }
  getArtist(id: string) {
    return this.request<any>(`/artists/${id}`);
  }
  getAlbums(params: Record<string, any> = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request<any[]>(`/albums?${query}`);
  }
  getAlbum(id: string) {
    return this.request<any>(`/albums/${id}`);
  }
  getGenres() {
    return this.request<any[]>('/genres');
  }
  search(q: string) {
    return this.request<any>(`/search?q=${encodeURIComponent(q)}`);
  }
  getRecommendations() {
    return this.request<any[]>('/recommendations');
  }

  // Playlists
  getPlaylists() {
    return this.request<any[]>('/playlists');
  }
  getUserPlaylists() {
    return this.request<any[]>('/playlists/user/me');
  }
  getPlaylist(id: string) {
    return this.request<any>(`/playlists/${id}`);
  }
  createPlaylist(body: any) {
    return this.request<any>('/playlists', { method: 'POST', body: JSON.stringify(body) });
  }
  updatePlaylist(id: string, body: any) {
    return this.request<any>(`/playlists/${id}`, { method: 'PATCH', body: JSON.stringify(body) });
  }
  deletePlaylist(id: string) {
    return this.request<any>(`/playlists/${id}`, { method: 'DELETE' });
  }
  addTrackToPlaylist(playlistId: string, songId: string) {
    return this.request<any>(`/playlists/${playlistId}/tracks`, { method: 'POST', body: JSON.stringify({ songId }) });
  }
  removeTrackFromPlaylist(playlistId: string, songId: string) {
    return this.request<any>(`/playlists/${playlistId}/tracks/${songId}`, { method: 'DELETE' });
  }
  reorderTracks(playlistId: string, trackIds: string[]) {
    return this.request<any>(`/playlists/${playlistId}/tracks/reorder`, { method: 'PATCH', body: JSON.stringify({ trackIds }) });
  }

  // Library
  toggleLikeSong(songId: string) {
    return this.request<any>(`/library/liked-songs/${songId}`, { method: 'POST' });
  }
  getLikedSongs() {
    return this.request<any[]>('/library/liked-songs');
  }
  toggleSaveAlbum(albumId: string) {
    return this.request<any>(`/library/albums/${albumId}`, { method: 'POST' });
  }
  getSavedAlbums() {
    return this.request<any[]>('/library/albums');
  }
  toggleFollowArtist(artistId: string) {
    return this.request<any>(`/library/artists/${artistId}`, { method: 'POST' });
  }
  getFollowedArtists() {
    return this.request<any[]>('/library/artists');
  }
  getHistory() {
    return this.request<any[]>('/library/history');
  }
  clearHistory() {
    return this.request<any>('/library/history', { method: 'DELETE' });
  }

  // Playback
  recordPlaybackEvent(body: any) {
    return this.request<any>('/playback/events', { method: 'POST', body: JSON.stringify(body) });
  }
  getStreamUrl(songId: string) {
    return this.request<{ streamUrl: string; duration: number }>('/playback/stream-url', { method: 'POST', body: JSON.stringify({ songId }) });
  }

  // Spotify
  importSpotifyPlaylist(url: string) {
    return this.request<any>('/playlists/import-spotify', {
      method: 'POST',
      body: JSON.stringify({ url }),
    });
  }
  getSpotifyToken() {
    return this.request<{ accessToken: string }>('/auth/spotify/token');
  }
  getSpotifyStatus() {
    return this.request<{
      connected: boolean;
      product: string | null;
      isPremium: boolean;
      spotifyUserId: string | null;
    }>('/auth/spotify/status');
  }
  disconnectSpotify() {
    return this.request<any>('/auth/spotify/disconnect', { method: 'POST' });
  }
  playSpotifyTrack(deviceId: string, uris: string[], positionMs = 0) {
    return this.request<any>('/playback/spotify/play', {
      method: 'POST',
      body: JSON.stringify({ deviceId, uris, positionMs }),
    });
  }
  getSpotifyLoginUrl(returnUrl = '/library') {
    const apiHost = process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') || 'http://localhost:4000';
    return `${apiHost}/auth/spotify/login?returnUrl=${encodeURIComponent(returnUrl)}`;
  }

  // Admin
  getAdminDashboard() {
    return this.request<any>('/admin/dashboard');
  }
  createSong(body: any) {
    return this.request<any>('/admin/songs', { method: 'POST', body: JSON.stringify(body) });
  }
  updateSong(id: string, body: any) {
    return this.request<any>(`/admin/songs/${id}`, { method: 'PATCH', body: JSON.stringify(body) });
  }
  deleteSong(id: string) {
    return this.request<any>(`/admin/songs/${id}`, { method: 'DELETE' });
  }
  uploadFile(formData: FormData) {
    return this.request<any>('/admin/upload', { method: 'POST', body: formData });
  }
  getAdminUsers() {
    return this.request<any[]>('/admin/users');
  }
  updateUserRole(userId: string, role: string) {
    return this.request<any>(`/admin/users/${userId}/role`, { method: 'PATCH', body: JSON.stringify({ role }) });
  }
}

export const api = new ApiClient();
