const { defineConfig } = require('eslint/config');
const expo = require('eslint-config-expo/flat');
module.exports = defineConfig([
  expo,
  { ignores: ['backend/**', 'android/**', 'dist/**', '.audit-*/**', 'CustomLyrics-Spotify/**'] },
  { files: ['src/**/*.{ts,tsx}'], rules: { 'react/no-unescaped-entities': 'off' } },
]);
