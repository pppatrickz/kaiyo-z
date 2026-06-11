// src/app/_components/sections/About.js

"use client";
import Image from "next/image";
import { useLang } from "@/app/_lib/langContext";
import { getAboutImagePath } from "@/app/_lib/utils"; 

export default function About({ initialAboutData }) {
  const { lang } = useLang();
  
  const activeAbout = initialAboutData?.[lang] || initialAboutData?.en || { title: "", content: "" };
  const { title, content } = activeAbout;

  return (
    <div
      className="
        bg-white/85 
        max-w-[1000px] 
        mt-10 mb-10 mx-auto
        p-6 md:p-10 
        rounded-[16px] md:rounded-[21px] // 手機端圓角稍微縮小
        shadow-md 
        flex flex-col md:flex-row // 手機端垂直排列，桌面端水平排列
        gap-6 md:gap-[30px]
        items-center // 手機端置中
      "
    >
      {/* 圖片 - 手機端設定 */}
      <div className="flex-none text-center w-[40%] md:flex-1 md:w-auto"> 
        {/* 手機端寬度設為 40%，與文字區域分開 */}
        <div className="relative aspect-square w-full"> 
          {/* 使用 relative 和 aspect-square 來控制大小和比例 */}
          <Image
            alt="Kaiyo Photo"
            src={getAboutImagePath("kaiyo.png")}
            fill // 使用 fill 讓圖片填滿父容器
            sizes="(max-w: 768px) 40vw, 300px" // RWD sizes
            className="
              mx-auto rounded-full 
              object-contain // 🎯 關鍵修改：將圖片設定為 contain
            "
          />
        </div>
      </div>

      {/* 文字 - 手機端設定 */}
      <div className="flex-1 text-sm md:text-[1.1em] leading-6 md:leading-8 leading-relaxed text-center md:text-justify [text-justify:inter-character] tracking-tight text-slate-800">
        {/* 手機端字級縮小 (text-sm)，行高縮小 (leading-6)，置中 (text-center) */}
        <h2 className="text-lg md:text-2xl font-bold mb-3 md:mb-4">{title}</h2>
        {/* 手機端標題字級 (text-lg) 和下邊距 (mb-3) */}
        <p className="py-1 md:py-2 whitespace-pre-line pb-10 md:pb-0">{content}</p>
        {/* 手機端段落上下邊距 (py-1) */}
      </div>
    </div>
  );
}