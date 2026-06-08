"use client";
import Image from "next/image";
import { useLang } from "@/app/_lib/langContext";
// 🎯 引入圖片路徑轉換工具
import { getAboutImagePath } from "@/app/_lib/utils"; 

export default function About({ initialAboutData }) {
  const { lang } = useLang();
  
  // 🎯 安全防護：確保資料層級安全，若尚未載入完成則給予預設空值
  const activeAbout = initialAboutData?.[lang] || initialAboutData?.en || { title: "", content: "" };
  const { title, content } = activeAbout;

  return (
    <div
      className="
      bg-white/85 
      max-w-[1000px] 
      mt-10 mb-10 mx-auto 
      p-6 md:p-10 
      rounded-[21px] shadow-md 
      flex flex-col md:flex-row md:flex-wrap 
      gap-6 md:gap-[30px]
    "
    >
      {/* 圖片 */}
      <div className="flex-1 text-center">
        <Image
          alt="Kaiyo Photo"
          // 🎯 修改點：大頭貼路徑自動響應 本地(/public/about/KAIYO.png) 或 線上(R2)
          src={getAboutImagePath("kaiyo.png")}
          width={300}
          height={300}
          className="
            mx-auto rounded-lg 
            w-[150px] md:w-[300px] 
            h-auto
          "
        />
      </div>

      {/* 文字 */}
      <div className="flex-[2] text-base md:text-[1.1em] leading-7 md:leading-8 leading-relaxed text-justify [text-justify:inter-character] tracking-tight">
        <h2 className="text-xl md:text-2xl font-bold mb-4">{title}</h2>
        <p className="py-2">{content}</p>
      </div>
    </div>
  );
}