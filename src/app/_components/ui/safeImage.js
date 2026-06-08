"use client";
import { useEffect, useState } from "react";
import Image from "next/image";

export default function SafeImage({ src, alt = "", ...props }) {
  const [imgSrc, setImgSrc] = useState(src);

  // 當父層的 src 改變時，同步更新本地 state
  useEffect(() => {
    setImgSrc(src);
  }, [src]);

  return (
    <Image
      {...props}                 // onClick、fill、width/height、sizes 都會被帶進去
      src={imgSrc}
      alt={alt}
      onError={() => {
        // 只在不是 fallback 時才切到 dummy，避免重複觸發
        if (imgSrc !== "/dummy.jpg") setImgSrc("/dummy.jpg");
      }}
    />
  );
}
