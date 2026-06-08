// src/app/layout.js
import './globals.css'
import PageLoader from './_components/layout/PageLoader';
import ScrollToTop from "./_components/ScrollToTop";

export const metadata = {
  title: "Kaiyo's Portfolio",
  description: "金工/珐瑯 設計作品集",
  openGraph: {
    title: "Kaiyo's Portfolio",
    description: "金工/珐瑯 設計作品集",
    url: "https://kaiyo-z.com",
    siteName: "Kaiyo's Portfolio",
  },
  charset: "utf-8"
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css" />
      </head>
      <body className="min-h-screen bg-white">
        <PageLoader src="/p-plane_optimized.png"/>
        {children}
        <div id="modal-root" />
        <ScrollToTop />
      </body>
    </html>
  );
}