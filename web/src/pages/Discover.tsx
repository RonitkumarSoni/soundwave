import React from 'react';
import { motion } from 'framer-motion';

import DiscoverHeader from '../components/discover/DiscoverHeader';
import SmartSearch from '../components/discover/SmartSearch';
import FeaturedBanner from '../components/discover/FeaturedBanner';
import TrendingNow from '../components/discover/TrendingNow';
import TopCharts from '../components/discover/TopCharts';
import PopularArtists from '../components/discover/PopularArtists';
import NewReleases from '../components/discover/NewReleases';
import MoodsAndGenres from '../components/discover/MoodsAndGenres';
import AiRecommended from '../components/discover/AiRecommended';
import EditorsPicks from '../components/discover/EditorsPicks';
import LiveEvents from '../components/discover/LiveEvents';
import TrendingPlaylists from '../components/discover/TrendingPlaylists';
import PodcastDiscovery from '../components/discover/PodcastDiscovery';
import ShortMusicVideos from '../components/discover/ShortMusicVideos';
import MusicByCountry from '../components/discover/MusicByCountry';
import DiscoverStats from '../components/discover/DiscoverStats';
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

export default function Discover() {
  return (
    <motion.div 
      variants={container}
      initial="hidden"
      animate="show"
      className="p-8 md:p-10 max-w-[1600px] mx-auto w-full"
    >
      <motion.div variants={item}><DiscoverHeader /></motion.div>
      <motion.div variants={item} className="flex justify-center"><SmartSearch /></motion.div>
      <motion.div variants={item}><FeaturedBanner /></motion.div>
      <motion.div variants={item}><TrendingNow /></motion.div>
      <motion.div variants={item}><TopCharts /></motion.div>
      <motion.div variants={item}><PopularArtists /></motion.div>
      <motion.div variants={item}><AiRecommended /></motion.div>
      <motion.div variants={item}><NewReleases /></motion.div>
      <motion.div variants={item}><MoodsAndGenres /></motion.div>
      <motion.div variants={item}><ShortMusicVideos /></motion.div>
      <motion.div variants={item}><LiveEvents /></motion.div>
      <motion.div variants={item}><EditorsPicks /></motion.div>
      <motion.div variants={item}><TrendingPlaylists /></motion.div>
      <motion.div variants={item}><PodcastDiscovery /></motion.div>
      <motion.div variants={item}><MusicByCountry /></motion.div>
      <motion.div variants={item}><DiscoverStats /></motion.div>
      <motion.div variants={item}><Footer /></motion.div>
    </motion.div>
  );
}
