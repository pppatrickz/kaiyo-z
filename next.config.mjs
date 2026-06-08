/** @type {import('next').NextConfig} */
const isStaticExport = process.env.STATIC_EXPORT === 'true';

const nextConfig = {
  // 只有在靜態導出時才開啟 export
  ...(isStaticExport ? { output: 'export', images: { unoptimized: true } } : {}),
};

export default nextConfig;
