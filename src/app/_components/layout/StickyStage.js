'use client'
import { useEffect, useRef, useState } from 'react';

export default function StickyStage({
  children,
  className = "",
  zIndex = 1,
  innerClassName = ""
}) {
  const innerRef = useRef(null);
  const [sectionMinH, setSectionMinH] = useState('100dvh');
  const [stickyTop, setStickyTop] = useState('0px');

  useEffect(() => {
    const el = innerRef.current;
    if (!el) return;

    const update = () => {
      const vh = window.innerHeight;
      const h = el.offsetHeight || 0;
      const offset = 0.1 * vh; // 5%
      // 父層舞台高度：比內容或視窗高多一點點，sticky 才有空間「黏」
      const stage = Math.max(vh, h) + 1;
      setSectionMinH(`${stage}px`);

      // 內容比視窗高 → sticky top 往上移
      if (h > vh) {
        // setStickyTop(`${vh - h}px`); // 例如 h=103vh → top=-3vh
        setStickyTop(`${vh - h + offset}px`);
      } else {
        setStickyTop('0px');
      }
    };

    const ro = new ResizeObserver(update);
    ro.observe(el);
    update();
    window.addEventListener('resize', update, { passive: true });

    return () => {
      ro.disconnect();
      window.removeEventListener('resize', update);
    };
  }, []);

  return (
    <section
      className={`sticky ${className}`}
      style={{
        top: stickyTop,       // 動態 top
        minHeight: sectionMinH,
        zIndex
      }}
    >
      <div
        ref={innerRef}
        className={`min-h-[100dvh] ${innerClassName}`}
      >
        {children}
      </div>
    </section>
  );
}
