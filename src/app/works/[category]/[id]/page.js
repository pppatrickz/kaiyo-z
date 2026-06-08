import { notFound } from "next/navigation";
import { slugify } from "@/app/_lib/slugify";
import WorkDetailClient from "./WorkDetailClient"; // 客戶端組件
// 🎯 引入我們剛才寫好的環境切換與資料獲取工具
import { fetchWorksData } from "@/app/_lib/utils"; 

export default async function WorkDetail({ params }) {
  const { category, id } = await params;

  // 🎯 核心修改：從 R2（線上環境）或本地備份（開發環境）非同步抓取最新的 works.json
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
    notFound(); // 找不到作品時觸發 404
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

// 🎯 如果你的 Next.js 是純靜態導出（Static Export），
// 請務必同時修改 generateStaticParams，確保打包時能順利生成所有作品網頁：
export async function generateStaticParams() {
  const data = await fetchWorksData();
  
  return (data?.works ?? []).map((work) => {
    return {
      category: work.category,
      id: String(work.id), // 直接拿後台幫你算好的唯一智慧 id 作為網址路由！
    };
  });
}