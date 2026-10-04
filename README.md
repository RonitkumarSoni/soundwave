# Soundwave Music App 🎵

## Repository layout

- The repository root contains the Expo Android/iOS app and its web export.
- `backend/` contains the NestJS backend and the merged backend recovery fixes.
- `web/` preserves the separate Vite web frontend previously on GitHub main, with its own dependencies and build configuration. Run `npm ci --prefix web`, then `npm --prefix web run dev` or `npm --prefix web run build` to work on that version. Its Firebase configuration still contains placeholders.


Soundwave is a beautiful, modern, cross-platform music streaming application built with React Native and Expo. Designed with performance and aesthetics in mind, Soundwave aggregates music from various platforms (YouTube Music, Spotify, JioSaavn) and offers a premium user experience with custom playlist creation, offline downloads, and smooth animations.

## Features ✨
- **Universal Search:** Seamlessly search and stream music aggregated from multiple sources (JioSaavn, Spotify, YouTube Music).
- **Custom Playlists:** Create personalized playlists, add your favorite tracks, and play them directly from your library.
- **Offline Downloads:** Download your favorite tracks for offline listening.
- **Stunning UI/UX:** Built with a beautiful dark mode interface featuring glassmorphism elements, animated transitions, and haptic feedback.
- **Audio Player:** Robust background audio playback and control using `expo-av` and Zustand for state management.
- **Cross-Platform:** Works on Android, iOS, and the Web.

## Tech Stack 🛠
- **Frontend Framework:** React Native / Expo (Expo Router)
- **State Management:** Zustand (with AsyncStorage for persistence)
- **Styling:** React Native Stylesheet, Expo Linear Gradient, Blur Views
- **Animations:** React Native Reanimated
- **Icons:** Expo Vector Icons, Feather Icons
- **Backend/API:** Custom NestJS API (Soundwave Backend) for track resolution

## Getting Started 🚀

### Prerequisites
Make sure you have Node.js and npm installed. You will also need the [Expo CLI](https://docs.expo.dev/get-started/installation/) if you don't have it.

### Installation

1. **Clone the repository** (if you haven't already):
   ```bash
   git clone https://github.com/yourusername/soundwave.git
   cd soundwave
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Environment Setup:**
   Create a `.env` file in the root directory and add your backend API URL (if applicable).
   ```env
   EXPO_PUBLIC_API_URL=http://localhost:3000
   ```

4. **Run the Application:**
   Start the Expo development server:
   ```bash
   npx expo start -c
   ```
   
   From the Expo CLI, you can press:
   - `a` to open on an Android emulator/device
   - `i` to open on an iOS simulator
   - `w` to open on the web browser

## Project Structure 📁

- `src/app/` - Expo Router file-based navigation (tabs, screens, modals)
- `src/components/` - Reusable UI components (TrackRow, AppHeader, Modals)
- `src/stores/` - Zustand global state management stores
- `src/lib/` - API clients, utility functions
- `src/theme/` - Centralized colors, gradients, and styling constants
- `src/data/` - Mock data and placeholder files

## Contributing 🤝
Pull requests are welcome! For major changes, please open an issue first to discuss what you would like to change. 

## License 📄
This project is licensed under the MIT License - see the LICENSE file for details.
