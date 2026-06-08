// src/app/news/[slug]/NewsDetailClient.js
"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { useLang } from "@/app/_lib/langContext";
import SafeImage from "@/app/_components/ui/safeImage";
import ImageLightbox from "@/app/_components/ui/ImageLightbox";
// 🎯 引入動態路徑工具，徹底告別硬編碼
import { getNewsImagePath } from "@/app/_lib/utils"; 

/** i18n（搬到組件外） */
const I18N = {
  backlist: { en: "Back to list", ja: "一覧に戻る", zh: "回到列表" },
  prev: { en: "prev", ja: "前の記事", zh: "上一則" },
  next: { en: "next", ja: "後の記事", zh: "下一則" },
  prevnew: { en: "prev (new)", ja: "前の記事 (新しい)", zh: "上一則 (較新)" },
  nextold: { en: "next (old)", ja: "後の記事 (古い)", zh: "下一則(較舊)" },
  nomorenew: { en: "No more new articles", ja: "新しい記事はありません", zh: "沒有更新的文章" },
  nomoreold: { en: "No more old articles", ja: "古い記事はありません", zh: "沒有更舊的文章" },
  navTop: { en: "news navigation (top)", ja: "ニュースナビ（上部）", zh: "新聞導覽（上方）" },
  navBottom: { en: "news navigation (bottom)", ja: "ニュースナビ（下部）", zh: "新聞導覽（下方）" },
  openImageN: { en: "open image {n}", ja: "画像を開く {n}", zh: "開啟圖片 {n}" },
  imageAltN: { en: "news image {n}", ja: "ニュース画像 {n}", zh: "新聞圖片 {n}" },
  by: { en: "by", ja: "by", zh: "by" }
};

/** Icons (inline SVG) */
function ChevronLeft({ className = "w-5 h-5" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M15 19l-7-7 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}
function ChevronRight({ className = "w-5 h-5" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M9 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}
function ListIcon({ className = "w-5 h-5" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  );
}

// 🎯 接收由 Server 端精準計算好的外殼資料
export default function NewsDetailClient({ newsItem, prevItem, nextItem }) {
  const { lang } = useLang();

  /** 簡易多語工具 */
  const t = (key) => I18N[key]?.[lang] ?? I18N[key]?.en ?? key;
  const tf = (key, vars = {}) => {
    const base = t(key);
    return Object.entries(vars).reduce((s, [k, v]) => s.replaceAll(`{${k}}`, v), base);
  };

  const getTitle = (item) =>
    item?.title?.[lang] ?? item?.title?.en ?? item?.title ?? "";

  const getContent = (item) =>
    item?.content?.[lang] ?? item?.content?.en ?? item?.content ?? "";

  /** 🎯 Lightbox 與內文圖片：全部透過 getNewsImagePath 動態指派路徑 */
  const imagePaths = useMemo(
    () => (newsItem.images ?? []).map((p) => getNewsImagePath(p)),
    [newsItem.images]
  );

  const articleImages = useMemo(
    () => newsItem.images?.slice(1)?.map((p) => getNewsImagePath(p)) ?? [],
    [newsItem.images]
  );

  const [lbIndex, setLbIndex] = useState(0);
  
  // 共用 Lightbox 狀態
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxImages, setLightboxImages] = useState([]);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  /** 下方 Nav：icon + 標題 */
  const BottomNav = () => (
    <nav className="mt-10 pt-6 border-t border-gray-200" aria-label={t("navBottom")}>
      <div className="flex items-center justify-between mb-6 text-gray-700">
        {/* 左：上一則（較新） */}
        {prevItem ? (
          <Link
            href={`/news/${prevItem.id}`} // 🎯 改為 .id
            className="group flex items-center gap-2 px-3 py-3 w-[40%] min-w-0"
            aria-label={`${t("prev")}：${getTitle(prevItem)}`}
            rel="prev"
          >
            <ChevronLeft className="w-5 h-5 shrink-0" />
            <span className="block overflow-hidden text-ellipsis whitespace-nowrap">
              {getTitle(prevItem)}
            </span>
          </Link>
        ) : (
          <span className="flex items-center gap-2 px-3 py-3 text-gray-300 cursor-not-allowed w-[40%] min-w-0" aria-disabled="true">
            <ChevronLeft className="w-5 h-5 shrink-0" />
            <span className="block overflow-hidden text-ellipsis whitespace-nowrap">
              {t("nomorenew")}
            </span>
          </span>
        )}

        {/* 中：回列表 */}
        <Link href="/news" className="px-4 py-3 shrink-0" aria-label={t("backlist")} title={t("backlist")}>
          <ListIcon className="w-5 h-5" />
        </Link>

        {/* 右：下一則（較舊） */}
        {nextItem ? (
          <Link
            href={`/news/${nextItem.id}`} // 🎯 改為 .id
            className="group flex items-center justify-end gap-2 px-3 py-3 w-[40%] min-w-0"
            aria-label={`${t("next")}：${getTitle(nextItem)}`}
            rel="next"
          >
            <span className="block overflow-hidden text-ellipsis whitespace-nowrap text-right">
              {getTitle(nextItem)}
            </span>
            <ChevronRight className="w-5 h-5 shrink-0" />
          </Link>
        ) : (
          <span className="flex items-center justify-end gap-2 px-3 py-3 cursor-not-allowed w-[40%] min-w-0" aria-disabled="true">
            <span className="block overflow-hidden text-ellipsis whitespace-nowrap text-right">
              {t("nomoreold")}
            </span>
            <ChevronRight className="w-5 h-5 shrink-0" />
          </span>
        )}
      </div>
    </nav>
  );

  return (
    <div className="relative w-full min-h-screen overflow-x-hidden bg-white flex flex-col md:block">
      {/* 圖片區（手機：上方；桌機：左側固定） */}
      <div
        className="relative w-full h-[60vh] md:fixed md:top-0 md:left-0 md:w-[40vw] md:h-screen bg-black flex items-center justify-center"
        onTouchStart={(e) => (window.__touchStartX = e.touches[0].clientX)}
        onTouchEnd={(e) => {
          const deltaX = e.changedTouches[0].clientX - window.__touchStartX;
          if (Math.abs(deltaX) > 50) {
            if (deltaX > 0) {
              setLbIndex((prev) => (prev - 1 + imagePaths.length) % imagePaths.length);
            } else {
              setLbIndex((prev) => (prev + 1) % imagePaths.length);
            }
          }
        }}
      >
        {imagePaths.length > 0 && (
          <SafeImage
            src={imagePaths[lbIndex]}
            alt={tf("imageAltN", { n: lbIndex + 1 })}
            width={800}
            height={600}
            className="object-cover w-full h-full cursor-pointer select-none"
            onClick={() => {
              setLightboxImages(imagePaths);
              setLightboxIndex(lbIndex);
              setLightboxOpen(true);
            }}
          />
        )}

        {/* 切換圖片按鈕 */}
        {imagePaths.length > 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-4 md:bottom-6 md:right-6 md:left-auto md:translate-x-0">
            <button
              onClick={() => setLbIndex((lbIndex - 1 + imagePaths.length) % imagePaths.length)}
              className="w-10 h-10 flex items-center justify-center rounded-full border border-white text-white bg-black/50 hover:bg-black/70 transition"
              aria-label="Previous image"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button
              onClick={() => setLbIndex((lbIndex + 1) % imagePaths.length)}
              className="w-10 h-10 flex items-center justify-center rounded-full border border-white text-white bg-black/50 hover:bg-black/70 transition"
              aria-label="Next image"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>
        )}
      </div>

      {/* 文章內容區（手機：下方；桌機：右側） */}
      <div className="w-full md:ml-[40vw] md:w-[60vw] min-h-screen p-6 md:p-10 pt-10 overflow-y-auto">
        <div className="mb-6">
          <Link href="/news" className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition">
            <ChevronLeft className="w-5 h-5" />
            <span>{t("backlist")}</span>
          </Link>
        </div>

        <h1 className="text-3xl md:text-4xl font-bold my-6 md:my-10">
          {getTitle(newsItem)}
        </h1>
        <p className="text-gray-500 mb-8 text-sm md:text-base">
          {t("by")} Kaiyo | {newsItem.date}
        </p>

        <div className="leading-relaxed text-justify whitespace-pre-line mb-10">
          {getContent(newsItem)}
        </div>

        {/* 內文圖片清單 */}
        {newsItem.images?.slice(1)?.map((img, i) => (
          <button
            key={i}
            type="button"
            onClick={() => {
              setLightboxImages(articleImages);
              setLightboxIndex(i);
              setLightboxOpen(true);
            }}
            className="block mb-8 rounded overflow-hidden focus:outline-none"
          >
            <SafeImage
              src={getNewsImagePath(img)} // 🎯 改為動態雲端/本地路徑
              alt={tf("imageAltN", { n: i + 2 })}
              width={600}
              height={400}
              className="object-cover rounded transition-transform duration-300 hover:scale-105"
            />
          </button>
        ))}

        <BottomNav />
      </div>

      {/* 共用 Lightbox */}
      <ImageLightbox
        open={lightboxOpen}
        images={lightboxImages}
        currentIndex={lightboxIndex}
        setCurrentIndex={setLightboxIndex}
        onClose={() => setLightboxOpen(false)}
      />
    </div>
  );
}