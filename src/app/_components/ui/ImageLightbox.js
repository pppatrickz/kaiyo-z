"use client";
import { useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import SafeImage from "@/app/_components/ui/safeImage";

export default function ImageLightbox({
  open,
  images,                  // string[]
  currentIndex,            // number（父層控制）
  setCurrentIndex,         // (idx:number | (i:number)=>number) => void
  onClose,                 // () => void
  captions,                // string[]  可選
  classNameOverlay = "",   // 可選
}) {
  const hasImages = Array.isArray(images) && images.length > 0;
  const safeIndex = Math.min(
    Math.max(currentIndex ?? 0, 0),
    Math.max((images?.length ?? 1) - 1, 0)
  );

  const prev = useCallback(
  () => setCurrentIndex((i) => (i - 1 + images.length) % images.length),
  [images.length, setCurrentIndex]
);

const next = useCallback(
  () => setCurrentIndex((i) => (i + 1) % images.length),
  [images.length, setCurrentIndex]
);

  // ① Keyboard & event listeners（Hook 一律先宣告，再在內部檢查 open）
 useEffect(() => {
  if (!open) return;

  const onKey = (e) => {
    if (e.key === "Escape") onClose?.();
    if (e.key === "ArrowLeft") prev();
    if (e.key === "ArrowRight") next();
  };
  window.addEventListener("keydown", onKey);
  return () => window.removeEventListener("keydown", onKey);
}, [open, onClose, prev, next]); // ✅ 加入 prev 和 next


  // ② Scroll lock：固定 body，儲存/還原位置與樣式（避免關閉後無法捲動）
  useEffect(() => {
    if (!open) return;

    const html = document.documentElement;
    const body = document.body;

    const savedY = window.scrollY || window.pageYOffset;
    const prevHtmlOverflow = html.style.overflow;
    const prevBodyPos = body.style.position;
    const prevBodyTop = body.style.top;
    const prevBodyWidth = body.style.width;

    body.style.position = "fixed";
    body.style.top = `-${savedY}px`;
    body.style.width = "100%";
    html.style.overflow = "hidden";

    return () => {
      body.style.position = prevBodyPos || "";
      const y = Math.abs(parseInt(body.style.top || "0", 10)) || savedY;
      body.style.top = prevBodyTop || "";
      body.style.width = prevBodyWidth || "";
      html.style.overflow = prevHtmlOverflow || "";
      window.scrollTo(0, y);
    };
  }, [open]);

  // 只在這裡根據 open 決定是否渲染 UI（不影響 Hook 的呼叫順序）
  if (!open) return null;

  const portalRoot = document.getElementById("modal-root");
  if (!portalRoot) return null;

  return createPortal(
    <div
      className={`fixed inset-0 z-[9999] bg-black/95 flex items-center justify-center ${classNameOverlay}`}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose?.();
      }}
      role="dialog"
      aria-modal="true"
    >
      {hasImages && (
        <div className="relative w-full h-full">
          <SafeImage
            src={images[safeIndex]}
            alt={`image-${safeIndex}`}
            fill
            className="object-contain select-none"
          />

          {/* Close */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 px-3 py-1.5 rounded bg-white/10 hover:bg-white/20 text-white text-sm"
            aria-label="Close"
          >
            ✕
          </button>

          {/* Prev / Next */}
          {images.length > 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); prev(); }}
                className="absolute left-4 top-1/2 -translate-y-1/2 px-3 py-2 rounded bg-white/10 hover:bg-white/20 text-white text-2xl"
                aria-label="Previous"
              >
                ‹
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); next(); }}
                className="absolute right-4 top-1/2 -translate-y-1/2 px-3 py-2 rounded bg-white/10 hover:bg-white/20 text-white text-2xl"
                aria-label="Next"
              >
                ›
              </button>
            </>
          )}

          {/* Indicator & caption */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white text-xs opacity-80 px-3 py-1 rounded bg-black/30">
            {safeIndex + 1} / {images.length}
            {captions?.[safeIndex] && <span className="ml-2 opacity-90">{captions[safeIndex]}</span>}
          </div>
        </div>
      )}
    </div>,
    portalRoot
  );
}
