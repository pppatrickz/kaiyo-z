"use client";
import Image from "next/image";

export default function BannerGallery({ images = [] }) {
  if (!images.length) return null; // 沒圖片就不渲染

  return (
    <section className="w-[70vw] overflow-hidden">
      {/* 桌機版：三等分橫幅 */}
      <div
        className={`hidden md:grid w-full h-[60vh] ${
          images.length >= 3
            ? "grid-cols-3"
            : `grid-cols-${images.length}` // 少於3張時自動調整欄數
        }`}
      >
        {images.slice(0, 3).map((src, i) => (
          <div key={i} className="relative">
            <Image
              src={src}
              alt={`Banner ${i + 1}`}
              fill
              className="object-cover "
              sizes="33vw"
              priority={i === 0} // 優先載入第一張
            />
          </div>
        ))}
      </div>

      {/* 手機版：可滑動橫向區塊 */}
      <div className="flex md:hidden overflow-x-auto snap-x snap-mandatory scroll-smooth w-full h-[60vh]">
        {images.map((src, i) => (
          <div key={i} className="relative flex-shrink-0 w-screen snap-center">
            <Image
              src={src}
              alt={`Banner ${i + 1}`}
              fill
              className="object-cover"
              sizes="100vw"
            />
          </div>
        ))}
      </div>
    </section>
  );
}
