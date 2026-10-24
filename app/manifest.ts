import { MetadataRoute } from 'next'
 
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'PawLog - Дневник питомца',
    short_name: 'PawLog',
    description: 'Удобный дневник здоровья питомцев',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#e11d48',
    icons: [
      {
        src: 'https://cdn-icons-png.flaticon.com/192/6163/6163544.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: 'https://cdn-icons-png.flaticon.com/512/6163/6163544.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  }
}