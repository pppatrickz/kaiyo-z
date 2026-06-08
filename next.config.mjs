/** @type {import('next').NextConfig} */
const isStaticExport = process.env.STATIC_EXPORT === 'true';

const nextConfig = {
  output: 'export',   // 啟用靜態導出
  images: {
    unoptimized: true // 靜態導出通常需要關閉預設的圖片優化
  },
  excludePages: ['/admin/api/r2'],
};

export default nextConfig;
