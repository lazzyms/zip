import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Zip - Logic Puzzle Game',
    short_name: 'Zip',
    description: 'Connect the numbers in a continuous path. A challenging and addictive logic puzzle game.',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#f97316',
    orientation: 'portrait',
    categories: ['games', 'entertainment', 'puzzle'],
    icons: [
      {
        src: '/icon?size=72',
        sizes: '72x72',
        type: 'image/png',
      },
      {
        src: '/icon?size=96',
        sizes: '96x96',
        type: 'image/png',
      },
      {
        src: '/icon?size=128',
        sizes: '128x128',
        type: 'image/png',
      },
      {
        src: '/icon?size=144',
        sizes: '144x144',
        type: 'image/png',
      },
      {
        src: '/icon?size=152',
        sizes: '152x152',
        type: 'image/png',
      },
      {
        src: '/icon?size=192',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/icon?size=384',
        sizes: '384x384',
        type: 'image/png',
      },
      {
        src: '/icon?size=512',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  };
}
