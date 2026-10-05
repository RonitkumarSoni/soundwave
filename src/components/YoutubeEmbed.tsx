import React from 'react';
export default function YoutubeEmbed({ id }: { id: string; onError: (message: string) => void }) {
  return <iframe title="YouTube player" src={`https://www.youtube.com/embed/${encodeURIComponent(id)}?playsinline=1`} width="100%" height="100%" style={{ border: 0 }} allow="autoplay; encrypted-media; fullscreen" allowFullScreen />;
}
