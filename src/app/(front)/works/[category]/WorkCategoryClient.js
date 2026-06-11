// src/app/works/[category]/CategoryPageClient.jsx
"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useLang } from "@/app/_lib/langContext";
import SafeImage from "@/app/_components/ui/safeImage";
import PaintingPumaImages from "@/app/_components/deco/PaintingPumaImages";
import { getWorksImagePath } from "@/app/_lib/utils"; 

function formatDate(input, full = false) {
  const d = new Date(input);
  if (Number.isNaN(d.getTime())) return String(input ?? "");
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return full ? `${y}/${m}` : `${y}`;
}

export default function WorkCategoryClient({ category, initialData }) {
  const { lang } = useLang();

  // 根據傳進來的 data 動態計算該分類的作品列表
  const works = useMemo(() => {
    if (!initialData) return [];
    return (initialData.works ?? [])
      .filter((w) => w.category === category)
      .sort((a, b) => {
        const da = new Date(a.date);
        const db = new Date(b.date);
        // 改為最新日期排在最前面 (與詳細頁面排序邏輯完全一致)
        return db.getTime() - da.getTime();
      });
  }, [initialData, category]);

  // 動態計算分類名稱
  const categoryName = useMemo(() => {
    if (!initialData) return String(category);
    return (
      initialData.categories?.[category]?.[lang] ??
      initialData.categories?.[category]?.en ??
      String(category)
    );
  }, [initialData, category, lang]);

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-[#1A1A1A] font-sans antialiased selection:bg-neutral-200">
      
      {/* 頂部精品式導航列 - 與詳細頁面完美對齊 */}
      <header className="w-full px-6 py-5 md:px-12 flex justify-between items-center bg-white/80 backdrop-blur-md sticky top-0 z-40 border-b border-neutral-100 pt-18">
        <Link
          href="/works"
          className="group flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-neutral-500 hover:text-black transition-colors"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-3.5 h-3.5 transform group-hover:-translate-x-1 transition-transform"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
          </svg>
          <span className="font-light">{lang === "zh" ? "所有作品" : "All Works"}</span>
        </Link>
        <div className="text-xs tracking-[0.3em] uppercase text-neutral-400 font-light">
          Collection Index
        </div>
      </header>

      {/* 策展大氣大標題 */}
      <div className="max-w-6xl mx-auto px-6 pt-16 pb-12 md:pt-24 md:pb-20 border-b border-neutral-200/60">
        <p className="text-xs font-mono tracking-[0.4em] uppercase text-neutral-400 mb-3">
          Category Collection
        </p>
        <h1 className="text-3xl md:text-5xl font-light tracking-wide text-neutral-900">
          {categoryName}
        </h1>
      </div>

      {/* 藝術畫冊交錯網格區塊 */}
      <main className="max-w-6xl mx-auto px-6 py-12 md:py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-16 md:gap-y-28 items-start">
          {works.map((work, i) => {
            const slug = String(work.id);
            const firstImage = work?.images?.[0];
            const title = work?.title?.[lang] ?? work?.title?.en ?? slug;
            const material = work?.material?.[lang] || work?.material?.ja || work?.material?.en || "";
            const dateStr = formatDate(work?.date, work?.showFullDate === true);
            
            // 創造雜誌错落呼吸感：偶數項在桌面端往下偏移，打破死板的左右平齊
            const isEven = i % 2 === 1;

            return (
              <Link 
                key={work.id} 
                href={`/works/${category}/${slug}`} 
                className={`group block w-full ${isEven ? "md:mt-24" : "md:mt-0"}`}
              >
                <div className="space-y-4 md:space-y-6">
                  
                  {/* 圖片容器：不限死 aspect-square，改為靈活的長方形並帶有優雅的白色內縮邊框襯托 */}
                  <div className="relative w-full aspect-[4/3] md:aspect-[3/2] bg-neutral-100 overflow-hidden rounded-lg shadow-sm border border-neutral-200/40 p-3 md:p-4 bg-white transition-shadow duration-500 group-hover:shadow-md">
                    <div className="relative w-full h-full overflow-hidden rounded-md bg-neutral-50">
                      <SafeImage
                        src={firstImage ? getWorksImagePath(category, firstImage) : "/placeholder.png"}
                        alt={title}
                        fill
                        className="object-cover transition-transform duration-700 ease-out group-hover:scale-102"
                      />
                    </div>
                  </div>

                  {/* 精品文字排印資訊區塊 */}
                  <div className="flex justify-between items-start pt-1 gap-4">
                    <div className="space-y-1 md:space-y-2 max-w-[75%]">
                      <h2 className="text-base md:text-lg font-light text-neutral-800 tracking-wide group-hover:text-black transition-colors line-clamp-1">
                        {title}
                      </h2>
                      {material && (
                        <p className="text-xs text-neutral-400 font-light line-clamp-1 tracking-wide">
                          {material}
                        </p>
                      )}
                    </div>
                    
                    {/* 右側：精緻的序號感與日期 */}
                    <div className="text-right font-mono text-[11px] tracking-widest text-neutral-400 space-y-1">
                      <p className="text-neutral-300 group-hover:text-neutral-500 transition-colors">
                        {(i + 1).toString().padStart(2, "0")} / {works.length.toString().padStart(2, "0")}
                      </p>
                      <p className="font-light">{dateStr}</p>
                    </div>
                  </div>

                </div>
              </Link>
            );
          })}
        </div>
      </main>

      {/* 裝飾性底部插畫 */}
      <div className="opacity-70 mt-12 md:mt-24">
        <PaintingPumaImages />
      </div>
    </div>
  );
}