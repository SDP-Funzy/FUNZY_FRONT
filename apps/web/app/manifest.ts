import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Funzy', short_name: 'Funzy', lang: 'ko',
    start_url: '/home', scope: '/', display: 'standalone',
    background_color: '#fffdfa', theme_color: '#fffdfa',
  };
}
