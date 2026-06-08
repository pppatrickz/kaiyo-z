/** @type {import('next').NextConfig} */
const isStaticExport = process.env.STATIC_EXPORT === 'true';

const nextConfig = {
  output: 'export',   // 啟用靜態導出
  images: {
    unoptimized: true // 靜態導出通常需要關閉預設的圖片優化
  },
// 🎯 關鍵黑魔法：在 webpack 準備打包時，把本地專用的 api 路由徹底抹消
  webpack: (config, { isServer, dev }) => {
    if (!dev) {
      // 如果不是本地開發模式（也就是正在執行 next build 線上靜態打包時）
      config.plugins.push(
        new webpack.IgnorePlugin({
          resourceRegExp: /src\/app\/admin\/api\/r2/, // 讓編譯器裝作沒看到這個資料夾
        })
      );
    }
    return config;
  },
};

import webpack from 'webpack'; // 記得在最外層引入 webpack

export default nextConfig;
