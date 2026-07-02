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

const coverBase = "https://picsum.photos/seed";

export const popularTracks: Track[] = [
  {
    id: "trk_01",
    title: "Blinding Lights",
    artist: "The Weeknd",
    album: "After Hours",
    duration: "3:20",
    durationMs: 200000,
    coverUrl: `${coverBase}/blindinglights/200/200`,
    isPremium: false,
  },
  {
    id: "trk_02",
    title: "Ocean Eyes",
    artist: "Billie Eilish",
    album: "Don't Smile at Me",
    duration: "3:24",
    durationMs: 204000,
    coverUrl: `${coverBase}/oceaneyes/200/200`,
    isPremium: false,
  },
  {
    id: "trk_03",
    title: "Circles Run",
    artist: "Post Malone",
    album: "Hollywood's Bleeding",
    duration: "3:35",
    durationMs: 215000,
    coverUrl: `${coverBase}/circlesrun/200/200`,
    isPremium: false,
  },
  {
    id: "trk_04",
    title: "Levitating",
    artist: "Dua Lipa",
    album: "Future Nostalgia",
    duration: "3:23",
    durationMs: 203000,
    coverUrl: `${coverBase}/levitating/200/200`,
    isPremium: false,
  },
  {
    id: "trk_05",
    title: "Watermelon Sugar",
    artist: "Harry Styles",
    album: "Fine Line",
    duration: "2:54",
    durationMs: 174000,
    coverUrl: `${coverBase}/watermelon/200/200`,
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
    coverUrl: `${coverBase}/saveyourtears/200/200`,
    isPremium: false,
  },
  {
    id: "trk_07",
    title: "Happier Than Ever",
    artist: "Billie Eilish",
    album: "Happier Than Ever",
    duration: "4:57",
    durationMs: 297000,
    coverUrl: `${coverBase}/happierthanever/200/200`,
    isPremium: false,
  },
  {
    id: "trk_08",
    title: "Sunflower",
    artist: "Post Malone",
    album: "Spider-Man: Into the Spider-Verse",
    duration: "2:40",
    durationMs: 160000,
    coverUrl: `${coverBase}/sunflower/200/200`,
    isPremium: false,
  },
  {
    id: "trk_09",
    title: "Believer",
    artist: "Imagine Dragons",
    album: "Evolve",
    duration: "3:25",
    durationMs: 205000,
    coverUrl: `${coverBase}/believer/200/200`,
    isPremium: false,
  },
  {
    id: "trk_10",
    title: "Positions",
    artist: "Ariana Grande",
    album: "Positions",
    duration: "3:02",
    durationMs: 182000,
    coverUrl: `${coverBase}/positions/200/200`,
    isPremium: true,
  },
  {
    id: "trk_11",
    title: "Shivers",
    artist: "Ed Sheeran",
    album: "=",
    duration: "3:28",
    durationMs: 208000,
    coverUrl: `${coverBase}/shivers/200/200`,
    isPremium: false,
  },
  {
    id: "trk_12",
    title: "Ghost",
    artist: "Justin Bieber",
    album: "Justice",
    duration: "3:12",
    durationMs: 192000,
    coverUrl: `${coverBase}/ghost/200/200`,
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
    coverUrl: "https://encrypted-tbn1.gstatic.com/images?q=tbn:ANd9GcSrIUuL70iHJSUbse38NnHrmgPJubRXQrtJ63QfCFZifVbgfLx_",
  },
  {
    id: "promo_02",
    title: "Mood Booster",
    subtitle: "Uplifting tracks to brighten your day and lift your spirits.",
    cta: "Play Now",
    coverUrl: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRbAoNXmgOqrPF2UxTQnB6G0wFUUilo6hxxG1rdL9CjEFcNpUBV",
  },
  {
    id: "promo_04",
    title: "Party Starter",
    subtitle: "Get the energy going with high-tempo tracks and remixes.",
    cta: "Let's Party",
    coverUrl: "https://encrypted-tbn3.gstatic.com/images?q=tbn:ANd9GcTjzxXEGRgT2C-LYFs1soJyLJnVuHZ3bH0A3EnHigpGclIbLkS9",
  },
  {
    id: "promo_03",
    title: "Chill Vibes",
    subtitle: "Relax and unwind with the smoothest lo-fi and ambient beats.",
    cta: "Explore",
    coverUrl: `${coverBase}/chillvibes/400/200`,
  },
];

export const genres: Genre[] = [
  { id: "g1", name: "Pop", color: "#E23FD6", imageUrl: `${coverBase}/pop/150/150` },
  { id: "g2", name: "Hip Hop", color: "#8A3FFC", imageUrl: `${coverBase}/hiphop/150/150` },
  { id: "g3", name: "Rock", color: "#FF5C7A", imageUrl: `${coverBase}/rock/150/150` },
  { id: "g4", name: "Electronic", color: "#4B2079", imageUrl: `${coverBase}/electronic/150/150` },
  { id: "g5", name: "R&B", color: "#7B2FF7", imageUrl: `${coverBase}/rnb/150/150` },
  { id: "g6", name: "Jazz", color: "#B23FE0", imageUrl: `${coverBase}/jazz/150/150` },
  { id: "g7", name: "Classical", color: "#2B1354", imageUrl: `${coverBase}/classical/150/150` },
  { id: "g8", name: "Indie", color: "#FF6FD8", imageUrl: `${coverBase}/indie/150/150` },
];

export const filterChips = ["All", "New Artists", "Hot Tracks", "Editor's Picks"];
export const libraryTabs = ["All", "Liked Songs", "Playlists", "Downloads"];
