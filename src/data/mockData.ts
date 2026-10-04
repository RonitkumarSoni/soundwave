// Mock data for Soundwave — matches reference screenshots

export interface Track {
  id: string;
  title: string;
  artist: string;
  album: string;
  duration: string;
  durationMs: number;
  coverUrl: string;
  isPremium: boolean;
}

export interface PromoCard {
  id: string;
  title: string;
  subtitle: string;
  cta: string;
  coverUrl: string;
  searchQuery: string;
}

export interface Genre {
  id: string;
  name: string;
  color: string;
  imageUrl: string;
}

export const currentUser = {
  id: "user_01",
  name: "Alex",
  avatarUrl: "https://i.pravatar.cc/150?img=47",
};



export const popularTracks: Track[] = [
  {
    id: "trk_01",
    title: "Blinding Lights",
    artist: "The Weeknd",
    album: "After Hours",
    duration: "3:20",
    durationMs: 200000,
    coverUrl: "https://c.saavncdn.com/artists/The_Weeknd_500x500.jpg",
    isPremium: false,
  },
  {
    id: "trk_02",
    title: "Ocean Eyes",
    artist: "Billie Eilish",
    album: "Don't Smile at Me",
    duration: "3:24",
    durationMs: 204000,
    coverUrl: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500&auto=format&fit=crop&q=80",
    isPremium: false,
  },
  {
    id: "trk_03",
    title: "Circles Run",
    artist: "Post Malone",
    album: "Hollywood's Bleeding",
    duration: "3:35",
    durationMs: 215000,
    coverUrl: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=500&auto=format&fit=crop&q=80",
    isPremium: false,
  },
  {
    id: "trk_04",
    title: "Levitating",
    artist: "Dua Lipa",
    album: "Future Nostalgia",
    duration: "3:23",
    durationMs: 203000,
    coverUrl: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=500&auto=format&fit=crop&q=80",
    isPremium: false,
  },
  {
    id: "trk_05",
    title: "Watermelon Sugar",
    artist: "Harry Styles",
    album: "Fine Line",
    duration: "2:54",
    durationMs: 174000,
    coverUrl: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=500&auto=format&fit=crop&q=80",
    isPremium: true,
  },
];

export const libraryTracks: Track[] = [
  {
    id: "trk_06",
    title: "Save Your Tears",
    artist: "The Weeknd",
    album: "After Hours",
    duration: "3:35",
    durationMs: 215000,
    coverUrl: "https://c.saavncdn.com/artists/The_Weeknd_500x500.jpg",
    isPremium: false,
  },
  {
    id: "trk_07",
    title: "Happier Than Ever",
    artist: "Billie Eilish",
    album: "Happier Than Ever",
    duration: "4:57",
    durationMs: 297000,
    coverUrl: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500&auto=format&fit=crop&q=80",
    isPremium: false,
  },
  {
    id: "trk_08",
    title: "Sunflower",
    artist: "Post Malone",
    album: "Spider-Man: Into the Spider-Verse",
    duration: "2:40",
    durationMs: 160000,
    coverUrl: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=500&auto=format&fit=crop&q=80",
    isPremium: false,
  },
  {
    id: "trk_09",
    title: "Believer",
    artist: "Imagine Dragons",
    album: "Evolve",
    duration: "3:25",
    durationMs: 205000,
    coverUrl: "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=500&auto=format&fit=crop&q=80",
    isPremium: false,
  },
  {
    id: "trk_10",
    title: "Positions",
    artist: "Ariana Grande",
    album: "Positions",
    duration: "3:02",
    durationMs: 182000,
    coverUrl: "https://c.saavncdn.com/artists/Ariana_Grande_500x500.jpg",
    isPremium: true,
  },
  {
    id: "trk_11",
    title: "Shivers",
    artist: "Ed Sheeran",
    album: "=",
    duration: "3:28",
    durationMs: 208000,
    coverUrl: "https://c.saavncdn.com/artists/Ed_Sheeran_500x500.jpg",
    isPremium: false,
  },
  {
    id: "trk_12",
    title: "Ghost",
    artist: "Justin Bieber",
    album: "Justice",
    duration: "3:12",
    durationMs: 192000,
    coverUrl: "https://c.saavncdn.com/artists/Justin_Bieber_500x500.jpg",
    isPremium: false,
  },
];

export const allTracks: Track[] = [...popularTracks, ...libraryTracks];

export const promoCards: PromoCard[] = [
  {
    id: "promo_01",
    title: "Feel the Beat",
    subtitle: "Explore trending tracks and hidden gems curated just for you.",
    cta: "Start Listening",
    coverUrl: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=500&auto=format&fit=crop&q=80",
    searchQuery: "pop",
  },
  {
    id: "promo_02",
    title: "Mood Booster",
    subtitle: "Uplifting tracks to brighten your day and lift your spirits.",
    cta: "Play Now",
    coverUrl: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=500&auto=format&fit=crop&q=80",
    searchQuery: "happy",
  },
  {
    id: "promo_04",
    title: "Party Starter",
    subtitle: "Get the energy going with high-tempo tracks and remixes.",
    cta: "Let's Party",
    coverUrl: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=500&auto=format&fit=crop&q=80",
    searchQuery: "electronic",
  },
  {
    id: "promo_03",
    title: "Chill Vibes",
    subtitle: "Relax and unwind with the smoothest lo-fi and ambient beats.",
    cta: "Explore",
    coverUrl: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500&auto=format&fit=crop&q=80",
    searchQuery: "chill",
  },
];

export const genres: Genre[] = [
  { id: "g1", name: "Pop", color: "#E23FD6", imageUrl: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300&auto=format&fit=crop&q=80" },
  { id: "g2", name: "Hip Hop", color: "#8A3FFC", imageUrl: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=300&auto=format&fit=crop&q=80" },
  { id: "g3", name: "Rock", color: "#FF5C7A", imageUrl: "https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?w=300&auto=format&fit=crop&q=80" },
  { id: "g4", name: "Electronic", color: "#4B2079", imageUrl: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=300&auto=format&fit=crop&q=80" },
  { id: "g5", name: "R&B", color: "#7B2FF7", imageUrl: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300&auto=format&fit=crop&q=80" },
  { id: "g6", name: "Jazz", color: "#B23FE0", imageUrl: "https://images.unsplash.com/photo-1511192336575-5a79af67a629?w=300&auto=format&fit=crop&q=80" },
  { id: "g7", name: "Classical", color: "#2B1354", imageUrl: "https://images.unsplash.com/photo-1507838153414-b4b713384a76?w=300&auto=format&fit=crop&q=80" },
  { id: "g8", name: "Indie", color: "#FF6FD8", imageUrl: "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=300&auto=format&fit=crop&q=80" },
];

export const filterChips = ["All", "New Artists", "Hot Tracks", "Editor's Picks"];
export const libraryTabs = ["All", "Playlists", "Liked Songs", "Downloads", "Recently Played"];

export const trendingSearches = [
  "Taylor Swift",
  "Lofi Girl",
  "Workout Pop",
  "Top 50 Global",
  "Arijit Singh",
];

export interface MixCard {
  id: string;
  title: string;
  description: string;
  coverUrl: string;
}

export const dailyMixes: MixCard[] = [
  { id: "dm_1", title: "Daily Mix 1", description: "Made for you", coverUrl: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300&auto=format&fit=crop&q=80" },
  { id: "dm_2", title: "Daily Mix 2", description: "Pop & Dance", coverUrl: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=300&auto=format&fit=crop&q=80" },
  { id: "dm_3", title: "Daily Mix 3", description: "Hip Hop", coverUrl: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=300&auto=format&fit=crop&q=80" },
  { id: "dm_4", title: "Daily Mix 4", description: "Chill Beats", coverUrl: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300&auto=format&fit=crop&q=80" },
];

export const newReleases: MixCard[] = [
  { id: "nr_1", title: "Midnight", description: "New Single", coverUrl: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300&auto=format&fit=crop&q=80" },
  { id: "nr_2", title: "Dawn", description: "Latest Album", coverUrl: "https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?w=300&auto=format&fit=crop&q=80" },
  { id: "nr_3", title: "Eclipse", description: "EP Release", coverUrl: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=300&auto=format&fit=crop&q=80" },
  { id: "nr_4", title: "Horizon", description: "Remix Pack", coverUrl: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=300&auto=format&fit=crop&q=80" },
];

export const topPodcasts = [
  { id: "pc_1", title: "The Daily", host: "The New York Times", coverUrl: "https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=300&auto=format&fit=crop&q=80" },
  { id: "pc_2", title: "Huberman Lab", host: "Scicomm Media", coverUrl: "https://images.unsplash.com/photo-1478737270239-2f02b77fc618?w=300&auto=format&fit=crop&q=80" },
  { id: "pc_3", title: "Design Matters", host: "Debbie Millman", coverUrl: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=300&auto=format&fit=crop&q=80" },
  { id: "pc_4", title: "Syntax", host: "Wes Bos & Scott Tolinski", coverUrl: "https://images.unsplash.com/photo-1589903308904-1010c2294adc?w=300&auto=format&fit=crop&q=80" },
];
