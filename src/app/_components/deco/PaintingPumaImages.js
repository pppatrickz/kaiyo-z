"use client";

import Image from "next/image";

export default function PaintingPumaImages() {
  return  (
    <>
      {/* 左上裝飾圖：距離頂端 25% 的位置 */}
      <div className="fixed top-1/4 left-0 h-[25vmin] z-40 animate-fadeIn pointer-events-none">
        <Image
          src="/assets/pumalooking.png" // ← 換成你的圖片路徑
          alt="Left Decoration Puma the dog looking"
          width={309}
          height={622}
          className="h-full w-auto"
          priority
        />
      </div>

      {/* 右下裝飾圖 */}
      <div className="fixed bottom-0 right-0 h-[25vmin] z-40 animate-fadeIn pointer-events-none">
        <Image
          src="/assets/paintingpuma.png" // ← 換成你的圖片路徑
          alt="Right Decoration Puma the dog painting"
          width={1141}
          height={713}
          className="h-full w-auto"
          priority
        />
      </div>
    </>
  );
}
