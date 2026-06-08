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
    <div className="relative bg-white min-h-screen">
      {/* 主視覺 */}
      <div
        className="relative w-full h-[60vh] hover:h-[90vh] transition-[height] duration-150 cursor-pointer"
        onClick={() => { setLbIndex(0); setLbOpen(true); }}
      >
        <SafeImage
          src={getWorksImagePath(work.category, mainImage)}
          alt={work.title?.[lang] || work.id}
          fill
          className="object-cover select-none"
        />
      </div>

      {/* ====== 描述內容區塊：左側絕對定位返回欄（只作用於本區） ====== */}
     {/* ====== 描述內容區塊 ====== */}
<section className="relative">
  {/* 返回按鈕（手機固定、桌面內容區垂直置中） */}
  <div
    className="
      fixed bottom-[25%] left-2 z-30
      flex justify-center
    "
  >
    <Link
      href={backHref}
      className="
        pointer-events-auto flex flex-row items-center justify-center
        text-gray-600 py-5 hover:opacity-80 transition
      "
      aria-label='Back to works list'
    >
      <svg
        xmlns='http://www.w3.org/2000/svg'
        className='w-7 h-7 mb-1'
        fill='none'
        viewBox='0 0 24 24'
        stroke='currentColor'
        strokeWidth={2}
      >
        <path strokeLinecap='round' strokeLinejoin='round' d='M15.75 19.5 8.25 12l7.5-7.5' />
      </svg>
      <span>{lang === "zh" ? "" : ""}</span>
    </Link>
  </div>

  {/* 內容本體：左側留白，避免被按鈕蓋住 */}
  <div className="pl-16 md:pl-24 lg:pl-40">
    <div className="max-w-4xl mx-auto p-6">
      <h2 className="text-3xl font-bold mb-2 flex items-baseline justify-between">
        <span>{work.title?.[lang] || "(Untitled)"}</span>
        {work.material?.[lang]?.trim() && (
          <span className="text-sm text-gray-600 ml-4">{work.material[lang]}</span>
        )}
      </h2>

      <p className="text-gray-600 mb-4">
        {work.showFullDate ? work.date : work.date?.slice(0, 4)} · {categoriesDict?.[category]?.[lang] || category}
      </p>
      <p className="mb-8">{work.desc?.[lang]}</p>

      {/* 縮圖清單 */}
      <div className="columns-1 sm:columns-2 md:columns-3 gap-4 space-y-4">
        {thumbs.map((img, i) => (
          <button
            key={i}
            type="button"
            className="rounded overflow-hidden cursor-pointer break-inside-avoid relative block"
            onClick={() => { setLbIndex(i + 1); setLbOpen(true); }}
            aria-label={`open image ${i + 2}`}
          >
            <SafeImage
              src={`/works/${work.category}/${img}`}
              alt={`${work.title?.[lang] || work.id}-${i}`}
              width={600}
              height={400}
              className="block w-full h-auto select-none"
            />
          </button>
        ))}
      </div>

      {/* 前後作品連結 */}
<div className="flex mt-12 border-t border-gray-200">
  {/* 上一個作品 */}
  {prev ? (
    <Link
      href={`/works/${category}/${prev.slug}`}
      className="
        w-1/2 flex items-center gap-2 pr-4 py-4
        text-gray-700 hover:text-black transition
        overflow-hidden
      "
    >
      <span className="text-xl flex-shrink-0">←</span>
      <span
        className="truncate"
        title={prev.title?.[lang] || "(Untitled)"}
      >
        {prev.title?.[lang] || "(Untitled)"}
      </span>
    </Link>
  ) : (
    <div className="w-1/2" />
  )}

  {/* 下一個作品 */}
  {next ? (
    <Link
      href={`/works/${category}/${next.slug}`}
      className="
        w-1/2 flex items-center justify-end gap-2 pl-4 py-4
        text-gray-700 hover:text-black transition
        overflow-hidden
      "
    >
      <span
        className="truncate text-right"
        title={next.title?.[lang] || "(Untitled)"}
      >
        {next.title?.[lang] || "(Untitled)"}
      </span>
      <span className="text-xl flex-shrink-0">→</span>
    </Link>
  ) : (
    <div className="w-1/2" />
  )}
</div>

    </div>
  </div>
</section>


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
