// Register Android headless playback before loading navigation.
require('./src/services/playbackService').registerPlayback();
require('expo-router/entry');
