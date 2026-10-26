import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'PawLog — Дневник питомца', // Полное имя (для установки)
    short_name: 'PawLog',             // Короткое имя (для иконки на экране)
    description: 'Удобный дневник здоровья питомцев',
    start_url: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#ffffff',
    theme_color: '#e11d48',
    lang: 'ru',
    icons: [
      {
        src: '/icons/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-512.png', 
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable', 
      },
    ],
  }
}