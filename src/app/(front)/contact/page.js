// src/app/contact/page.js
'use client'
import Contact from "../../_components/sections/Contact";
import PumaBottomImage from "../../_components/deco/PumaBottomImage";

export default function Page() {
  return (
    // 🎯 關鍵修改：使用 flex flex-col 讓手機端的內容能自然向下延伸滾動
    <div className="relative min-h-screen bg-[var(--background)] bg-paper flex flex-col justify-between">
      <div className="flex-grow">
        <Contact />
      </div>
      
      {/* 插圖區塊 */}
      <PumaBottomImage />
    </div>
  );
}