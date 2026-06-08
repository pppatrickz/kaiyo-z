"use client";

import Image from "next/image";

export default function PumaBottomImage() {
  return (
    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[70vw] z-50 animate-fadeUp pointer-events-none">
      <Image
        src="/assets/pumacontact.png" // ← 換成你的圖片路徑
        alt="Puma the dog and his friends"
        width={2062} // 給一個大致尺寸，Next.js 需要寬高
        height={599}
        className="w-full h-auto"
        priority
      />
    </div>
  );
}
