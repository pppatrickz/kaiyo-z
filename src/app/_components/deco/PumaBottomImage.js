"use client";

import Image from "next/image";

export default function PumaBottomImage() {
  return (
    // 🎯 關鍵修改：手機端使用 relative 自然排列，並縮小上邊距 (mt) 防止與表單貼太近
    // 桌面端 (md:) 自動切換回絕對定位固定在最底部
    <div className="
      relative md:absolute 
      bottom-0 md:left-1/2 md:-translate-x-1/2 
      w-[85vw] sm:w-[70vw] md:w-[65vw] lg:w-[55vw]
      mx-auto md:mx-0
      mt-4 md:mt-0
      z-10 md:z-50 
      animate-fadeUp 
      pointer-events-none
    ">
      <Image
        src="/assets/pumacontact.png"
        alt="Puma the dog and his friends"
        width={2062}
        height={599}
        className="w-full h-auto object-contain"
        priority
      />
    </div>
  );
}