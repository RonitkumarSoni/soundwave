import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import Home from './pages/Home';
import Discover from './pages/Discover';
import Search from './pages/Search';
import Library from './pages/Library';
import Album from './pages/Album';
import LikedSongs from './pages/LikedSongs';
import Artists from './pages/Artists';
import Podcasts from './pages/Podcasts';
import Downloads from './pages/Downloads';
import Settings from './pages/Settings';
import Profile from './pages/Profile';
import Login from './pages/Login';
import Signup from './pages/Signup';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/" element={<MainLayout />}>
          <Route index element={<Home />} />
          <Route path="discover" element={<Discover />} />
          <Route path="search" element={<Search />} />
          <Route path="playlists" element={<Library />} />
          <Route path="liked" element={<LikedSongs />} />
          <Route path="artists" element={<Artists />} />
          <Route path="podcasts" element={<Podcasts />} />
          <Route path="downloads" element={<Downloads />} />
          <Route path="settings" element={<Settings />} />
          <Route path="profile" element={<Profile />} />
          <Route path="albums" element={<Album />} />
          <Route path="*" element={
            <div className="flex-1 flex items-center justify-center text-text-secondary h-full flex-col gap-4">
              <h1 className="text-4xl font-bold text-white">Coming Soon</h1>
              <p>This premium feature is under construction.</p>
            </div>
          } />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
