
// src/app/works/WorksPageClient.jsx
"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import Link from "next/link";
import { slugify } from "@/app/_lib/slugify";
import { useLang } from "@/app/_lib/langContext";
import SafeImage from "@/app/_components/ui/safeImage";
import PaintingPumaImages from "../_components/deco/PaintingPumaImages";
// 🎯 引入我們做好的路徑轉換工具
import { getWorksImagePath } from "@/app/_lib/utils";

export default function WorksPageClient({ initialData }) {
  const { lang } = useLang();

  // 無限滾動
  const [visibleCount, setVisibleCount] = useState(9);
  const loadMoreRef = useRef(null);

  // 排序 & 篩選
  const [sortOrder, setSortOrder] = useState("newest"); // "newest" | "oldest"
  const [activeCategory, setActiveCategory] = useState("all");

  // 全部作品：資料來源改由傳進來的 initialData 提供
  const allWorks = useMemo(
    () =>
      (initialData?.works ?? []).map((work) => {
        let slug = String(work.id);
        return { ...work, slug };
      }),
    [initialData]
  );

  // 類別清單（含 All）
  const categoryOptions = useMemo(
    () => ["all", ...Array.from(new Set(allWorks.map((w) => w.category)))],
    [allWorks]
  );

  // 篩選 + 排序
  const sorted = useMemo(() => {
    const filtered =
      activeCategory === "all"
        ? allWorks
        : allWorks.filter((w) => w.category === activeCategory);

    return [...filtered].sort((a, b) => {
      const da = new Date(a.date);
      const db = new Date(b.date);
      return sortOrder === "newest" ? db - da : da - db;
    });
  }, [allWorks, activeCategory, sortOrder]);

  // 無限滾動觀察器
  useEffect(() => {
    if (visibleCount >= sorted.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setVisibleCount((p) => Math.min(p + 6, sorted.length));
        }
      },
      { threshold: 1.0 }
    );

    const target = loadMoreRef.current;
    if (target) observer.observe(target);

    return () => {
      if (target) observer.unobserve(target);
      observer.disconnect();
    };
  }, [visibleCount, sorted.length]);

  // 切換條件時重置可視數量
  useEffect(() => {
    setVisibleCount(9);
  }, [activeCategory, sortOrder]);

  // 標籤 Pill UI
  const Pill = ({ active, children, onClick }) => (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={[
        "shrink-0 max-w-[160px] h-12 px-3 py-2 leading-tight text-sm whitespace-normal break-words text-left",
        "clamp-2",
        "rounded-full transition",
        active
          ? "bg-black text-white shadow"
          : "bg-gray-100 text-gray-700 active:bg-gray-200",
        "md:hover:bg-gray-200",
        "snap-start"
      ].join(" ")}
    >
      {children}
    </button>
  );

  const t = (c) =>
    c === "all"
      ? (lang === "zh" ? "全部" : lang === "ja" ? "すべて" : "All")
      : initialData?.categories?.[c]?.[lang] ?? c;

  return (
    <section className="min-h-screen bg-white py-20">
      <h1 className="text-4xl font-bold text-center mb-6">Works</h1>

      {/* 控制列：分類標籤 + 排序標籤 */}
      <div className="max-w-6xl mx-auto px-6 mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="relative w-full">
          <div
            className="flex flex-nowrap items-stretch gap-2 overflow-x-auto no-scrollbar snap-x h-14 md:h-auto md:flex-wrap md:overflow-visible"
            role="tablist"
            aria-label="Categories"
          >
            {categoryOptions.map((c) => (
              <Pill
                key={c}
                active={activeCategory === c}
                onClick={() => setActiveCategory(c)}
              >
                {t(c)}
              </Pill>
            ))}
          </div>
        </div>

        {/* 排序標籤 */}
        <div className="flex items-center gap-2">
          <Pill active={sortOrder === "newest"} onClick={() => setSortOrder("newest")}>
            {lang === "zh" ? "最新" : "Newest"}
          </Pill>
          <Pill active={sortOrder === "oldest"} onClick={() => setSortOrder("oldest")}>
            {lang === "zh" ? "最舊" : "Oldest"}
          </Pill>
        </div>
      </div>

      {/* Masonry 作品網格 */}
      <div className="columns-1 sm:columns-2 md:columns-3 gap-6 px-6 max-w-6xl mx-auto space-y-6">
        {sorted.slice(0, visibleCount).map((work) => {
          const title = work.title?.[lang] ?? work.title?.en ?? work.slug;
          const year = work.date ? new Date(work.date).getFullYear() : (work.year ?? "");

          return (
            <Link
              key={work.slug}
              href={`/works/${work.category}/${work.slug}`}
              className="relative block w-full overflow-hidden break-inside-avoid group"
            >
              {/* 🎯 修改點：改用 getWorksImagePath 自動切換本地「/public/works」或線上「R2 雲端路徑」 */}
              <SafeImage
                src={getWorksImagePath(work.category, work.images[0])}
                alt={title}
                width={600}
                height={400}
                className="w-full h-auto object-cover rounded"
              />

              {/* Desktop Hover 遮罩 */}
              <div className="absolute inset-0 bg-black/50 opacity-0 md:group-hover:opacity-100 hidden md:flex items-center justify-center transition">
                <h2 className="text-white text-xl font-semibold text-center px-2">
                  {title}
                </h2>
              </div>

              {/* Mobile 常駐資訊 */}
              <div className="absolute left-0 right-0 bottom-0 md:hidden">
                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/70 to-transparent" />
                <div className="relative px-2 pb-2">
                  <div className="text-white text-xs leading-snug drop-shadow">
                    <div className="font-medium truncate">{title}</div>
                    <div className="opacity-90">{year}</div>
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* 無限滾動觸發點 */}
      {visibleCount < sorted.length && (
        <div ref={loadMoreRef} className="h-10 mt-10 flex justify-center items-center">
          <span className="text-gray-500">Loading more...</span>
        </div>
      )}
      <PaintingPumaImages />
    </section>
  );
}