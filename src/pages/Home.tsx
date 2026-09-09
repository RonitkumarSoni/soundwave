import React from 'react';
import { motion } from 'framer-motion';

// Import all 20 Home Page Sections
import GreetingHeader from '../components/home/GreetingHeader';
import SearchBar from '../components/home/SearchBar';
import HeroBanner from '../components/home/HeroBanner';
import ContinueListening from '../components/home/ContinueListening';
import MadeForYou from '../components/home/MadeForYou';
import RecentlyPlayed from '../components/home/RecentlyPlayed';
import TrendingNow from '../components/home/TrendingNow';
import PopularArtists from '../components/home/PopularArtists';
import PopularAlbums from '../components/home/PopularAlbums';
import DailyMix from '../components/home/DailyMix';
import NewReleases from '../components/home/NewReleases';
import TopCharts from '../components/home/TopCharts';
import MoodCategories from '../components/home/MoodCategories';
import Podcasts from '../components/home/Podcasts';
import RecentlyAdded from '../components/home/RecentlyAdded';
import MusicGenres from '../components/home/MusicGenres';
import ListeningStatistics from '../components/home/ListeningStatistics';
import RecommendedForYou from '../components/home/RecommendedForYou';
import Footer from '../components/home/Footer';

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const item = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
};

export default function Home() {
  return (
    <motion.div 
      variants={container}
      initial="hidden"
      animate="show"
      className="p-8 md:p-10 max-w-[1600px] mx-auto w-full"
    >
      <motion.div variants={item}><GreetingHeader /></motion.div>
      <motion.div variants={item}><SearchBar /></motion.div>
      <motion.div variants={item}><HeroBanner /></motion.div>
      <motion.div variants={item}><ContinueListening /></motion.div>
      <motion.div variants={item}><MadeForYou /></motion.div>
      <motion.div variants={item}><RecentlyPlayed /></motion.div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 mb-12">
        <motion.div variants={item} className="lg:col-span-2">
          <PopularAlbums />
        </motion.div>
        <motion.div variants={item} className="lg:col-span-1">
          <TrendingNow />
        </motion.div>
      </div>

      <motion.div variants={item}><PopularArtists /></motion.div>
      <motion.div variants={item}><DailyMix /></motion.div>
      <motion.div variants={item}><NewReleases /></motion.div>
      <motion.div variants={item}><TopCharts /></motion.div>
      <motion.div variants={item}><MoodCategories /></motion.div>
      <motion.div variants={item}><Podcasts /></motion.div>
      <motion.div variants={item}><RecentlyAdded /></motion.div>
      <motion.div variants={item}><MusicGenres /></motion.div>
      <motion.div variants={item}><ListeningStatistics /></motion.div>
      <motion.div variants={item}><RecommendedForYou /></motion.div>
      <motion.div variants={item}><Footer /></motion.div>
    </motion.div>
  );
}
