import { ScrollViewStyleReset } from 'expo-router/html';

// This file is web-only and used to configure the root HTML for every web page during static rendering.
// The contents of this function only run in Node.js environments and do not have access to the DOM or browser APIs.
export default function Root({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
        
        {/* Title and Description */}
        <title>Soundwave — Premium Music Player</title>
        <meta name="description" content="Discover, stream, and enjoy your favorite music with Soundwave. A premium listening experience." />
        
        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:title" content="Soundwave — Premium Music Player" />
        <meta property="og:description" content="Discover, stream, and enjoy your favorite music with Soundwave. A premium listening experience." />
        <meta property="og:image" content="https://soundwave-studio-app.vercel.app/og-image.jpg" />
        
        {/* Twitter */}
        <meta property="twitter:card" content="summary_large_image" />
        <meta property="twitter:title" content="Soundwave — Premium Music Player" />
        <meta property="twitter:description" content="Discover, stream, and enjoy your favorite music with Soundwave. A premium listening experience." />
        <meta property="twitter:image" content="https://soundwave-studio-app.vercel.app/og-image.jpg" />

        {/*
          Disable body scrolling on web. This makes ScrollView components work closer to how they do on native.
          However, body scrolling is often nice to have for web. If you want to enable it, remove this line.
        */}
        <ScrollViewStyleReset />
        <style dangerouslySetInnerHTML={{ __html: `
          body {
            background-color: #0A0514;
            color: #fff;
          }
        ` }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
