import './globals.css'
import { LangProvider } from "@/app/_lib/langContext";

import Header from "./_components/layout/Header";
import Footer from "./_components/layout/Footer";

import PageLoader from './_components/layout/PageLoader';
import ScrollToTop from "./_components/ScrollToTop";

export const metadata = {
  title: "Kaiyo's Portofolio",
  description: "金工/珐瑯 設計作品集",
  openGraph: {
    title: "Kaiyo's Portofolio",
    description: "金工/珐瑯 設計作品集",
    url: "https://kaiyo-z.com",
    siteName: "Kaiyo's Portofolio",
  },
  charset:"utf-8"
};
export const viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css"></link>
      </head>
      <body>
        <PageLoader src="/p-plane_optimized.png"/>
        <LangProvider>
        <Header />
         {children}
        <Footer />
        </LangProvider>
        <div id="modal-root" />
         <ScrollToTop />
        </body>
    </html>
  )
}



//園角矩形版
// import './globals.css'
// import { LangProvider } from "@/app/_lib/langContext";
// import Header from "./_components/layout/Header";
// import Footer from "./_components/layout/Footer";
// import PageLoader from './_components/layout/PageLoader';
// import ScrollToTop from "./_components/ScrollToTop";

// export const metadata = {
//   title: "Kaiyo's Portfolio",
//   description: "金工/珐瑯 設計作品集",
//   openGraph: {
//     title: "Kaiyo's Portfolio",
//     description: "金工/珐瑯 設計作品集",
//     url: "https://kaiyo-z.com",
//     siteName: "Kaiyo's Portfolio",
//   },
//   charset: "utf-8",
// };

// export const viewport = {
//   width: "device-width",
//   initialScale: 1,
// };

// export default function RootLayout({ children }) {
//   return (
//     <html lang="en">
//       <head>
//         <link
//           rel="stylesheet"
//           href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css"
//         />
//       </head>

//       {/* 外層白色背景 */}
//       <body className="bg-white flex justify-center items-center min-h-screen">
//         {/* 中間內容容器 */}
//         <div
//           className="relative bg-neutral-50 rounded-3xl shadow-lg overflow-hidden"
//           style={{
//             width: "calc(100vw - 40px)",
//             height: "calc(100vh - 40px)",
//           }}
//         >
//           <PageLoader src="/p-plane_optimized.png" />
//           <LangProvider>
//             <Header />
//             <main className="h-full overflow-y-auto">
//               {children}
//             </main>
//             <Footer />
//           </LangProvider>
//         </div>

//         <div id="modal-root" />
//         <ScrollToTop />
//       </body>
//     </html>
//   );
// }


