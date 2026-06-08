import webpack from 'next/dist/compiled/webpack/webpack.js';
/** @type {import('next').NextConfig} */
const isStaticExport = process.env.STATIC_EXPORT === 'true';

const nextConfig = {
  webpack: (config, { dev }) => {
    if (dev) {
      // 限制快取的最大存活時間或強制使用記憶體快取
      config.cache = {
        type: 'memory', // 改用記憶體快取，缺點是重開 dev 會稍微慢一點點，但絕不佔硬碟
      };
    }
    return config;
  },
  output: 'export',   // 啟用靜態導出
  images: {
    unoptimized: true // 靜態導出通常需要關閉預設的圖片優化
  },
    env: {
  },
};


export default nextConfig;
