"use client";

import { usePathname } from "next/navigation";
import Image from "next/image";

export default function PageLoader({ src }) {
  const pathname = usePathname();

  // 需要關閉過場的路徑規則（黑名單）
  const disableOn = [
    /^\/news\/[^/]+$/,            // /news/xxx
    /^\/works\/[^/]+\/[^/]+$/,    // /works/category/slug
  ];
  const disabled = disableOn.some((re) => re.test(pathname));

  if (disabled) return null; // 有 slug 的頁面：不顯示動畫

  return (
    <div className="fixed inset-0 z-[9999] pointer-events-none">
      <div className="relative w-full h-full">
        <Image
          key={pathname}       // 切頁時重建 → APNG 重新播放
          src={src}
          alt=""               // 不需要顯示 alt 文字
          fill                 // 全螢幕
          priority
          unoptimized          // 動圖直送
          className="object-cover"  // 或 object-contain
        />
      </div>
    </div>
  );
}
