export interface SpotifyArtist {
  id: string;
  name: string;
  images?: { url: string }[];
  external_urls?: { spotify?: string };
}
export interface SpotifyAlbum {
  id: string;
  name: string;
  artists: SpotifyArtist[];
  images?: { url: string }[];
  release_date?: string;
  tracks?: { items: SpotifyTrack[]; total: number };
}
export interface SpotifyTrack {
  id: string;
  name: string;
  duration_ms: number;
  artists: SpotifyArtist[];
  album?: SpotifyAlbum;
  preview_url?: string | null;
  external_urls?: { spotify?: string };
}
export interface SpotifySearch {
  tracks?: { items: SpotifyTrack[]; total: number };
  artists?: { items: SpotifyArtist[]; total: number };
  albums?: { items: SpotifyAlbum[]; total: number };
}
export interface ImportedPlaylist {
  id: string;
  name: string;
  type: string;
  trackList: { title: string; subtitle: string }[];
  coverArt?: { sources?: { url: string }[] };
}
export interface YoutubeSong {
  videoId: string;
  name: string;
  duration?: number | null;
  artists?: { artistId?: string | null; name: string }[];
  album?: { name: string; albumId?: string | null } | null;
  thumbnails?: { url: string }[];
}
