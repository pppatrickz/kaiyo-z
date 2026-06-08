"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import { useLang } from "@/app/_lib/langContext";
import { getCarouselImagePath } from "@/app/_lib/utils"; 

export default function Carousel({ slides }) {
  const { lang } = useLang();
  const [index, setIndex] = useState(0);
  const timerRef = useRef(null);

  // 🎯 安全防護：確保傳進來的 slides 必定是陣列，防範初始化或異步空檔時爆掉
  const activeSlides = Array.isArray(slides) ? slides : (slides?.slides || []);

  // ✅ 用 useCallback 固定 resetTimer，依賴 activeSlides.length
  const resetTimer = useCallback(() => {
    if (activeSlides.length <= 1) return; // 🎯 只有一張或沒圖時不需要計時器
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setIndex((i) => (i + 1) % activeSlides.length);
    }, 5000); // 5 秒自動切換
  }, [activeSlides.length]);

  // 初始化 & 當 index 改變時重設計時器
  useEffect(() => {
    resetTimer();
    return () => clearTimeout(timerRef.current);
    // ✅ 把 resetTimer 放進依賴陣列
  }, [index, activeSlides.length, resetTimer]);

  // 手動操作時：切換 index 並延後下一次自動輪播
  const goTo = (newIndex) => {
    setIndex(newIndex);
  };

  // 🎯 如果真的完全沒有任何輪播圖片，直接優雅隱藏，不報錯
  if (activeSlides.length === 0) {
    return <div className="w-full h-screen bg-slate-100 flex items-center justify-center text-gray-400">Loading Carousel...</div>;
  }

  return (
    <div className="relative w-full h-screen overflow-hidden">
      {/* slides */}
      <div
        className="flex transition-transform duration-500 w-full h-full"
        style={{ transform: `translateX(-${index * 100}%)` }}
      >
        {activeSlides.map((s, i) => (
          <div key={i} className="w-full h-screen flex-shrink-0 relative">
            <Image
              src={getCarouselImagePath(s.image)}
              // 🎯 智慧文字相容：相容您的新版結構 s.title[lang] 與舊版字串
              alt={typeof s.title === "object" ? (s.title?.[lang] || s.title?.en || "") : String(s.title || "")}
              fill
              className="object-cover"
              priority={i === 0} // 第一張大圖預先載入優化效能
            />
            
            {/* 只有當有填寫標題或描述時才顯示遮罩黑條 */}
            {(s.title || s.desc) && (
              <div className="absolute bottom-10 left-10 bg-black/60 text-white p-4 rounded max-w-[60%] transition-opacity">
                <h2 className="text-xl font-bold mb-2">
                  {typeof s.title === "object" ? (s.title?.[lang] || s.title?.en || "") : s.title}
                </h2>
                <p>
                  {typeof s.desc === "object" ? (s.desc?.[lang] || s.desc?.en || "") : (s.desc || s.content?.[lang] || "")}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* nav buttons - 只有多張圖時才顯示控制項 */}
      {activeSlides.length > 1 && (
        <>
          <div className="absolute top-1/2 left-0 right-0 flex justify-between z-10 -translate-y-1/2 pointer-events-none">
            <button
              onClick={() => goTo((index - 1 + activeSlides.length) % activeSlides.length)}
              className="bg-black/50 text-white p-4 text-2xl font-mono pointer-events-auto hover:bg-black/70 transition"
            >
              ‹
            </button>
            <button
              onClick={() => goTo((index + 1) % activeSlides.length)}
              className="bg-black/50 text-white p-4 text-2xl font-mono pointer-events-auto hover:bg-black/70 transition"
            >
              ›
            </button>
          </div>

          {/* dots */}
          <div className="absolute bottom-5 w-full text-center z-10">
            {activeSlides.map((_, i) => (
              <span
                key={i}
                onClick={() => goTo(i)}
                className={`inline-block h-3 w-3 mx-1 rounded-full cursor-pointer transition-colors ${
                  i === index ? "bg-white" : "bg-white/50 hover:bg-white/80"
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}