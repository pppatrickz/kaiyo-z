"use client";

import { useEffect, useMemo, useState } from "react";
import { useLang } from "@/app/_lib/langContext";
import SafeImage from "@/app/_components/ui/safeImage";
import Link from "next/link";
import ImageLightbox from "@/app/_components/ui/ImageLightbox";
import { getWorksImagePath } from "@/app/_lib/utils";

export default function ClientWorkDetail({ work, category, prev, next, categoriesDict }) {
  const { lang } = useLang();

  const [mainImage, setMainImage] = useState(work.images[0]);
  const [thumbs, setThumbs] = useState(work.images.slice(1));

  useEffect(() => {
    setMainImage(work.images[0]);
    setThumbs(work.images.slice(1));
  }, [work]);

  const [lbOpen, setLbOpen] = useState(false);
  const [lbIndex, setLbIndex] = useState(0);

  const imagePaths = useMemo(
    () => work.images.map((img) => getWorksImagePath(work.category, img)),
    [work]
  );

  const backHref = category ? `/works/${category}` : "/works";
  const backLabel = categoriesDict?.[category]?.[lang] || "Back";

  return (
    <div className="relative bg-[#FAFAFA] min-h-screen text-[#1A1A1A] font-sans antialiased selection:bg-neutral-200">
      
      {/* 頂部精品式導航列 (手機端完美解放空間，不遮擋內容) */}
      <header className="w-full px-6 py-5 md:px-12 flex justify-between items-center bg-white/80 backdrop-blur-md sticky top-0 pt-18 z-40 border-b border-neutral-100">
        <Link
          href={backHref}
          className="group flex items-center gap-2 text-sm uppercase tracking-[0.2em] text-neutral-500 hover:text-black transition-colors"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-4 h-4 transform group-hover:-translate-x-1 transition-transform"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
          </svg>
          <span className="text-xs md:text-sm font-light">{backLabel}</span>
        </Link>
        <div className="text-xs tracking-[0.3em] uppercase text-neutral-400 font-light hidden sm:block">
          Kaiyo-Z Portfolio
        </div>
      </header>

      {/* 主視覺區塊：手機端帶有白框（經典畫廊感），桌面端可互動放大 */}
      <div className="p-4 md:p-0">
        <div
          className="relative w-full h-[50vh] md:h-[75vh] lg:h-[85vh] transition-[height] duration-300 cursor-zoom-in bg-neutral-100 overflow-hidden rounded-lg md:rounded-none shadow-sm md:shadow-none"
          onClick={() => { setLbIndex(0); setLbOpen(true); }}
        >
          <SafeImage
            src={getWorksImagePath(work.category, mainImage)}
            alt={work.title?.[lang] || work.id}
            fill
            className="object-contain md:object-cover select-none transition-transform duration-700 hover:scale-105"
            priority
          />
        </div>
      </div>

      {/* 雜誌排版內容區 */}
      <main className="max-w-5xl mx-auto px-6 py-12 md:py-24">
        
        {/* 標題與元數據：非對稱精品雜誌佈局 */}
        <div className="border-b border-neutral-200 pb-8 mb-12 flex flex-col md:flex-row md:justify-between md:items-end gap-6">
          <div className="space-y-3 max-w-2xl">
            <p className="text-xs uppercase tracking-[0.25em] text-neutral-400 font-medium">
              {categoriesDict?.[category]?.[lang] || category}
            </p>
            <h1 className="text-3xl md:text-5xl font-light tracking-tight leading-tight text-neutral-900">
              {work.title?.[lang] || "(Untitled)"}
            </h1>
          </div>
          
          <div className="text-left md:text-right space-y-1 font-light text-sm text-neutral-500 min-w-[200px]">
            {work.material?.[lang]?.trim() && (
              <p className="tracking-wide text-neutral-700 font-normal">{work.material[lang]}</p>
            )}
            <p className="tracking-widest font-mono text-xs">
              {work.showFullDate ? work.date : work.date?.slice(0, 4)}
            </p>
          </div>
        </div>

        {/* 作品敘述：經典雜誌前導文排版 */}
        <div className="mb-20 max-w-3xl">
          <p className="text-base md:text-lg leading-relaxed text-neutral-700 font-light text-justify [text-justify:inter-character] tracking-wide whitespace-pre-line ">
            {work.desc?.[lang]}
          </p>
        </div>

        {/* 縮圖清單：擺脫無聊網格，採用精品畫冊交錯比例 */}
        {thumbs.length > 0 && (
          <div className="space-y-12 md:space-y-24 mb-24">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-16 items-start">
              {thumbs.map((img, i) => {
                // 創造雜誌特有的錯落感：奇數張與偶數張在桌面端有不同的比例與間距
                const isEven = i % 2 === 0;
                return (
                  <div 
                    key={i} 
                    className={`w-full ${isEven ? "md:mt-0" : "md:mt-16"} transition-transform duration-500 hover:translate-y-[-4px]`}
                  >
                    <button
                      type="button"
                      className="w-full bg-neutral-50 rounded-lg overflow-hidden cursor-zoom-in block relative shadow-sm hover:shadow-md transition-shadow"
                      onClick={() => { setLbIndex(i + 1); setLbOpen(true); }}
                      aria-label={`open image ${i + 2}`}
                    >
                      <SafeImage
                        src={getWorksImagePath(work.category, img)}
                        alt={`${work.title?.[lang] || work.id}-${i}`}
                        width={800}
                        height={600}
                        className="block w-full h-auto select-none object-cover"
                      />
                    </button>
                    <p className="mt-3 font-mono text-[10px] tracking-widest text-neutral-400 uppercase">
                      Detail Fig. 0{i + 2}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 精品式前後作品切換：極簡、大氣 */}
        <footer className="border-t border-neutral-200 pt-12 mt-16">
          <div className="flex justify-between items-center font-light text-xs tracking-[0.2em] uppercase text-neutral-400 mb-4">
            <span>Previous Piece</span>
            <span>Next Piece</span>
          </div>
          
          <div className="flex justify-between items-center gap-8">
            {/* 上一個作品 */}
            {prev ? (
              <Link
                href={`/works/${category}/${prev.slug}`}
                className="group w-1/2 text-left"
              >
                <div className="text-base md:text-lg text-neutral-700 group-hover:text-black transition-colors font-light truncate">
                  <span className="inline-block transform group-hover:-translate-x-1 transition-transform mr-2">←</span>
                  {prev.title?.[lang] || "(Untitled)"}
                </div>
              </Link>
            ) : (
              <div className="w-1/2" />
            )}

            {/* 下一個作品 */}
            {next ? (
              <Link
                href={`/works/${category}/${next.slug}`}
                className="group w-1/2 text-right"
              >
                <div className="text-base md:text-lg text-neutral-700 group-hover:text-black transition-colors font-light truncate">
                  {next.title?.[lang] || "(Untitled)"}
                  <span className="inline-block transform group-hover:translate-x-1 transition-transform ml-2">→</span>
                </div>
              </Link>
            ) : (
              <div className="w-1/2" />
            )}
          </div>
        </footer>

      </main>

      {/* Lightbox */}
      <ImageLightbox
        open={lbOpen}
        images={imagePaths}
        currentIndex={lbIndex}
        setCurrentIndex={setLbIndex}
        onClose={() => setLbOpen(false)}
      />
    </div>
  );
}