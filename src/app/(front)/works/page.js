// src/app/works/page.js

import { fetchWorksData, getWorksImagePath } from "@/app/_lib/utils"; // 確保你有 getWorksImagePath
import WorksPageClient from "./WorksPageClient";

// 🎯 動態生成作品集列表頁的 SEO Metadata
export async function generateMetadata() {
  const worksData = await fetchWorksData();

  if (!worksData) {
    return {
      title: "作品集 | Portfolio | 作品一覧 - Kaiyo-Z",
      description: "瀏覽 Kaiyo-Z 的珠寶設計、七寶燒工藝與插畫藝術作品。",
    };
  }

  const { categories = {}, works = [] } = worksData;

  // --- 1. 提取所有分類關鍵字 (中/日/英) ---
  const allCategories = Object.values(categories).map(cat => [
    cat.zh, cat.ja, cat.en
  ].filter(Boolean)).flat();
  const categoryKeywords = allCategories.join(", ");

  // --- 2. 排序並撈出最新 3 件作品的標題 ---
  const latest3Works = [...works]
    .sort((a, b) => String(b.date || "").localeCompare(String(a.date || "")))
    .slice(0, 3);

  const latestWorksTitles = latest3Works.map(w => {
    const zhT = w.title?.zh || "";
    const jaT = w.title?.ja || "";
    const enT = w.title?.en || "";
    // 如果該作品剛好沒寫標題，用 id 代替
    return zhT || jaT || enT || w.id;
  }).join(", ");

  // --- 3. 智慧型動態全站 OG Image ---
  // 挑選最新的一件作品的第一張圖作為這張列表頁的分享圖！如果沒有就用預設的
  let ogImage = getWorksImagePath("og.png"); 
  if (latest3Works.length > 0 && latest3Works[0].images?.length > 0) {
    ogImage = getWorksImagePath(latest3Works[0].images[0]); 
  }

  // --- 4. 組合三語系黃金標題 ---
  const combinedTitle = `作品集 | 作品一覧 | Portfolio - Kaiyo-Z`;

  // --- 5. 組合完美的描述 (包含最新作品與全部分類) ---
  const combinedDescription = [
    `【最新作品】${latestWorksTitles}`,
    `【創作範疇】${categoryKeywords}`,
    `歡迎來到 Kaiyo-Z 的個人藝術空間，探索融合日本傳統七寶燒（琺瑯）、金工技法與溫柔繪本插畫的多語系創作世界。`
  ].join(" / ");

  return {
    title: combinedTitle,
    description: combinedDescription.substring(0, 160), // 控制在安全字數內
    
    // Open Graph (FB, Line, Threads)
    openGraph: {
      title: combinedTitle,
      description: combinedDescription.substring(0, 160),
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: "Kaiyo-Z Portfolio Collection",
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

// 頁面主體（保持不變）
export default async function WorksPage() {
  const initialData = await fetchWorksData();

  return <WorksPageClient initialData={initialData} />;
}