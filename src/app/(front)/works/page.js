// src/app/works/page.js
import { fetchWorksData } from "@/app/_lib/utils";
import WorksPageClient from "./WorksPageClient"; // 引入下方抽離的前端本體

export default async function WorksPage() {
  // 伺服器端直接 await 撈取 R2 的 JSON 檔案
  const initialData = await fetchWorksData();

  return <WorksPageClient initialData={initialData} />;
}