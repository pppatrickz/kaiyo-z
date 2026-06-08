// src/app/works/[category]/CategoryPageClient.jsx
"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useLang } from "@/app/_lib/langContext";
import { slugify } from "@/app/_lib/slugify";
import SafeImage from "@/app/_components/ui/safeImage";
import PaintingPumaImages from "@/app/_components/deco/PaintingPumaImages";
import { getWorksImagePath } from "@/app/_lib/utils"; 

function formatDate(input, full = false) {
  const d = new Date(input);
  if (Number.isNaN(d.getTime())) return String(input ?? "");
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return full ? `${y}/${m}/${day}` : `${y}`;
}

// 🎯 接收 Server 端傳進來的當前分類與初始 JSON 資料
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
    <section className="min-h-screen bg-white py-20">
      <h1 className="text-4xl font-bold text-center mb-12">{categoryName}</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 px-6 max-w-6xl mx-auto">
        {works.map((work) => {
          let slug = String(work.id);

          const firstImage = work?.images?.[0];
          const title = work?.title?.[lang] ?? work?.title?.en ?? slug;
          const material =
            work?.material?.[lang] ?? work?.material?.en ?? work?.material ?? "";
          const dateStr = formatDate(work?.date, work?.showFullDate === true);

          return (
            <Link key={work.id} href={`/works/${category}/${slug}`} className="block">
              <div className="space-y-2">
                {/* Mobile: date + title above image */}
                <div className="md:hidden">
                  <p className="text-[13px] leading-tight text-gray-700 line-clamp-2">
                    {dateStr}
                  </p>
                  <h2 className="mt-1 text-[13px] leading-snug font-medium text-gray-900 line-clamp-2">
                    {title}
                  </h2>
                </div>

                {/* Image */}
                <div className="relative aspect-square group overflow-hidden">
                  <SafeImage
                    src={
                      firstImage
                        ? getWorksImagePath(category, firstImage)
                        : "/placeholder.png"
                    }
                    alt={title}
                    fill
                    className="object-cover"
                  />
                  {/* Desktop hover overlay */}
                  <div className="hidden md:flex absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 items-center justify-center transition">
                    <h2 className="text-white text-xl font-semibold text-center px-2">
                      {title}
                    </h2>
                  </div>
                </div>

                {/* Mobile: material below image */}
                {material ? (
                  <div className="md:hidden">
                    <p className="text-xs leading-snug text-gray-600 line-clamp-2">
                      {material}
                    </p>
                  </div>
                ) : null}
              </div>
            </Link>
          );
        })}
      </div>
      <PaintingPumaImages />
    </section>
  );
}