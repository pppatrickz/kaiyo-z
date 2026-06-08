"use client";
import Image from "next/image";

export default function RoundGallery({ images = [] }) {
  if (!images.length) return null;

  return (
    <section className="w-screen flex flex-col items-center py-10">
      {/* 桌機版：三張圖片橫向排列 */}
      <div
        className={`hidden md:flex justify-center gap-8 ${
          images.length >= 3 ? "flex-wrap" : ""
        }`}
      >
        {images.slice(0, 3).map((src, i) => (
          <div
            key={i}
            className="relative w-64 h-64 rounded-full overflow-hidden"
          >
            <Image
              src={src}
              alt={`Image ${i + 1}`}
              fill
              className="object-cover"
              sizes="256px"
              priority={i === 0}
            />
          </div>
        ))}
      </div>

      {/* 手機版：橫向可滑動圓形展示 */}
      <div className="md:hidden w-full overflow-x-auto scrollbar-hide">
        <div className="flex gap-6 px-4 py-4 w-max">
          {images.map((src, i) => (
            <div
              key={i}
              className="relative flex-shrink-0 w-56 h-56 rounded-full overflow-hidden"
            >
              <Image
                src={src}
                alt={`Image ${i + 1}`}
                fill
                className="object-cover"
                sizes="224px"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
