// src/app/works/[category]/[id]/page.js

import { notFound } from "next/navigation";
import { slugify } from "@/app/_lib/slugify";
import WorkDetailClient from "./WorkDetailClient"; 
import { fetchWorksData, getWorksImagePath } from "@/app/_lib/utils"; // 🎯 引入作品圖片路徑工具

// 🎯 1. 靜態路由生成（保持不變）
export async function generateStaticParams() {
  const data = await fetchWorksData();
  
  return (data?.works ?? []).map((work) => {
    return {
      category: work.category,
      id: String(work.id),
    };
  });
}

// 🎯 2. 新增：單一作品內頁專屬的極致動態 SEO Metadata
export async function generateMetadata({ params }) {
  const { category, id } = await params;
  const data = await fetchWorksData();

  if (!data) return { title: "作品詳情 | Portfolio - Kaiyo-Z" };

  // 依照 id 尋找當前作品
  const work = (data.works || []).find((w) => String(w.id) === String(id));

  // 如果找不到作品，回傳最基礎的標題防炸
  if (!work) {
    return { title: "作品未找到 | Portfolio - Kaiyo-Z" };
  }

  // 撈取當前作品的多語系標題與描述
  const zhTitle = work.title?.zh || "";
  const jaTitle = work.title?.ja || "";
  const enTitle = work.title?.en || "";

  const zhDesc = work.desc?.zh || "";
  const jaDesc = work.desc?.ja || "";
  const enDesc = work.desc?.en || "";

  // 取得當前分類的多語系名稱，增加 SEO 關聯權重
  const currentCategoryInfo = data.categories?.[category] || {};
  const zhCat = currentCategoryInfo.zh || category;

  // 取得作品材質資訊 (如果有提供的話)
  const materialText = work.material?.zh || work.material?.ja || work.material?.en || "";
  const materialSeparator = materialText ? ` [${materialText}]` : "";

  // 🎯 核心亮點：精準將這件作品的「第一張主視覺圖」直接拔出來當作 Open Graph 分享圖
  const ogImage = work.images?.length > 0 
    ? getWorksImagePath(work.images[0]) 
    : getWorksImagePath("og.png");

  // 組合三語系黃金作品標題 (呈現：作品名 Title | 分類名 - Kaiyo-Z)
  // 如果中日文標題一模一樣（例如 Saturn），程式碼會自動過濾重複，保持精簡
  const titleSet = new Set([zhTitle, jaTitle, enTitle].filter(Boolean));
  const cleanTitles = Array.from(titleSet).join(" / ");
  const combinedTitle = `${cleanTitles} | ${zhCat} - Kaiyo-Z`;

  // 組合極致豐富的作品描述（包含作品本身的背景故事與媒材）
  const combinedDescription = [
    zhDesc ? `${zhDesc.substring(0, 60)}...` : "",
    jaDesc ? `${jaDesc.substring(0, 60)}...` : "",
    enDesc ? `${enDesc.substring(0, 70)}...` : ""
  ].filter(Boolean).join(" / ");

  const finalDescription = `【Kaiyo-Z 藝術作品${materialSeparator}】${combinedDescription}`;

  return {
    title: combinedTitle,
    description: finalDescription.substring(0, 160), // 控制在安全字數內
    
    // Open Graph (FB, Line, Threads, Discord)
    openGraph: {
      title: combinedTitle,
      description: finalDescription.substring(0, 160),
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: zhTitle || "Kaiyo-Z Art Piece",
        },
      ],
      type: "article", // 👈 藝術品單頁在架構上更偏向獨立的靜態物件（article）
    },
    
    // X (Twitter)
    twitter: {
      card: "summary_large_image",
      title: combinedTitle,
      description: finalDescription.substring(0, 160),
      images: [ogImage],
    },
  };
}

// 🎯 3. 頁面主體渲染（與你原本的邏輯與排序完全對齊）
export default async function WorkDetail({ params }) {
  const { category, id } = await params;
  const data = await fetchWorksData();

  const works = (data?.works ?? [])
    .filter((w) => w.category === category)
    .sort((a, b) => {
      const da = new Date(a.date);
      const db = new Date(b.date);
      return db - da;
    })
    .map((w) => ({
      ...w,
      slug: w?.title?.en ? slugify(w.title.en) : String(w.id),
    }));

  const index = works.findIndex((w) => String(w.id) === String(id));
  const work = works[index];

  if (!work) {
    notFound();
  }

  const prev = index > 0 ? works[index - 1] : null;
  const next = index < works.length - 1 ? works[index + 1] : null;

  return (
    <WorkDetailClient
      work={work}
      category={category}
      prev={prev}
      next={next}
      categoriesDict={data?.categories || {}}
    />
  );
}