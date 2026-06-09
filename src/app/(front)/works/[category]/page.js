// src/app/works/[category]/page.js

import { slugify } from "@/app/_lib/slugify";
import { fetchWorksData, getWorksImagePath } from "@/app/_lib/utils"; 
import WorkCategoryClient from "./WorkCategoryClient";

// 🎯 1. 靜態路由生成（保持不變）
export async function generateStaticParams() {
  const data = await fetchWorksData();
  const categories = Object.keys(data?.categories ?? {});
  return categories.map((category) => ({ category }));
}

// 🎯 2. 新增：分類頁面專屬的動態 SEO Metadata
export async function generateMetadata({ params }) {
  const { category } = await params;
  const data = await fetchWorksData();

  if (!data) {
    return { title: "作品集 | Portfolio - Kaiyo-Z" };
  }

  // 取得當前分類的多語系名稱
  const currentCategoryInfo = data.categories?.[category] || {};
  const zhCat = currentCategoryInfo.zh || category;
  const jaCat = currentCategoryInfo.ja || category;
  const enCat = currentCategoryInfo.en || category;

  // 撈出屬於這個分類的所有作品，並依照日期排序，取得最新的一件
  const categoryWorks = (data.works || [])
    .filter((w) => String(w.category) === String(category))
    .sort((a, b) => String(b.date || "").localeCompare(String(a.date || "")));

  const latestWork = categoryWorks[0];
  
  // 智慧型動態 OG Image：精準抓取該分類下最新作品的第一張圖
  let ogImage = getWorksImagePath("og.png");
  if (latestWork && latestWork.images?.length > 0) {
    ogImage = getWorksImagePath(latestWork.images[0]);
  }

  // 組合三語系分類標題 (呈現：珠寶設計 | ジュエリー | Jewelry Design - Kaiyo-Z)
  const combinedTitle = `${zhCat} | ${jaCat} | ${enCat} - Kaiyo-Z`;

  // 組合描述：告訴爬蟲這個分類總共有幾件作品，並附上最新作品的精華簡介
  const workCountText = `共收錄 ${categoryWorks.length} 件專屬創作。`;
  const latestWorkDesc = latestWork 
    ? `最新作品：《${latestWork.title?.zh || latestWork.title?.en}》- ${latestWork.desc?.zh?.substring(0, 60)}...`
    : "歡迎瀏覽 Kaiyo-Z 的精選創作。";

  const combinedDescription = `${zhCat} / ${jaCat} / ${enCat} 作品集。${workCountText}${latestWorkDesc}`;

  return {
    title: combinedTitle,
    description: combinedDescription.substring(0, 160),
    
    // Open Graph (FB, Line, Threads)
    openGraph: {
      title: combinedTitle,
      description: combinedDescription.substring(0, 160),
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: `${zhCat} Portfolio - Kaiyo-Z`,
        },
      ],
      type: "website",
    },
    
    // X (Twitter)
    twitter: {
      card: "summary_large_image",
      title: combinedTitle,
      description: combinedDescription.substring(0, 160),
      images: [ogImage],
    },
  };
}

// 🎯 3. 頁面主體渲染（與你原本的邏輯完全對齊）
export default async function CategoryPage({ params }) {
  const { category } = await params;
  const data = await fetchWorksData();

  return (
    <WorkCategoryClient 
      category={category} 
      initialData={data} 
    />
  );
}