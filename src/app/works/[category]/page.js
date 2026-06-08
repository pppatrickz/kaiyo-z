// src/app/works/[category]/page.js
import { slugify } from "@/app/_lib/slugify";
import { fetchWorksData } from "@/app/_lib/utils"; 
import WorkCategoryClient from "./WorkCategoryClient"; // 引入剛才獨立出去的前端

// 🎯 1. 這裡的 generateStaticParams 是百分之百正確的！放在 Server 端完美執行
export async function generateStaticParams() {
  const data = await fetchWorksData();
  const categories = Object.keys(data?.categories ?? {});
  return categories.map((category) => ({ category }));
}

// 🎯 2. 伺服器端直接 await 撈取 R2 的 JSON，速度極快且沒有載入狀態（Loading）的問題
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