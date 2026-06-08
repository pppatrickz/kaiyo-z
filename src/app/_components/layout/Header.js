// "use client";
// import Link from "next/link";
// import Image from "next/image";
// import { usePathname } from "next/navigation";
// import { useLang } from "@/app/_lib/langContext";
// import data from "@/app/_data/works.json"; // ← 直接載入分類資料

// export default function Header() {
//   const { lang, changeLang } = useLang();
//   const pathname = usePathname();

//   const getLinkClass = (path) =>
//     `px-2 py-1 transition-colors ${
//       pathname === path ? "text-[#8c8c8c]" : "text-white"
//     } hover:text-[#8c8c8c]`;

//   return (
//     <header className="fixed t-0 flex items-center justify-between z-[100] w-full">
//       {/* Logo */}
//       <div className="px-5 flex items-center">
//         <Link href="/">
//           <Image
//             src="/KAIYO.png"
//             alt="Kaiyo Icon"
//             width={80}
//             height={80}
//             className="cursor-pointer"
//           />
//         </Link>
//       </div>

//       {/* Right section */}
//       <div className="fixed top-5 right-5 flex items-center gap-5 z-50">
//         {/* Language Switch */}
//         <div className="text-sm text-gray-300">
//           <button
//             onClick={() => changeLang("en")}
//             className={lang === "en" ? "font-bold" : ""}
//           >
//             EN
//           </button>{" "}
//           /{" "}
//           <button
//             onClick={() => changeLang("ja")}
//             className={lang === "ja" ? "font-bold" : ""}
//           >
//             日本語
//           </button>{" "}
//           /{" "}
//           <button
//             onClick={() => changeLang("zh")}
//             className={lang === "zh" ? "font-bold" : ""}
//           >
//             中文
//           </button>
//         </div>

//         {/* Navigation */}
//         <nav className="bg-black/60 px-4 py-2 rounded flex items-center gap-4">
//           <Link href="/" className={getLinkClass("/")}>
//             Home
//           </Link>
//           <Link href="/news" className={getLinkClass("/news")}>
//             News
//           </Link>
//           <Link href="/about" className={getLinkClass("/about")}>
//             About
//           </Link>

//           {/* Works dropdown */}
//           <div className="relative group">
//             {/* 改成 Link → 可點擊 */}
//             <Link href="/works" className={getLinkClass("/works")}>
//               Works
//             </Link>

//             <div className="absolute left-0 top-full mt-1 hidden w-64 bg-gray-800 rounded shadow-lg group-hover:block z-50">
//               {Object.entries(data.categories).map(([key, value]) => (
//                 <Link
//                   key={key}
//                   href={`/works/${key}`}
//                   className="block px-4 py-2 text-white hover:bg-gray-200 hover:text-black"
//                 >
//                   {value[lang]}
//                 </Link>
//               ))}
//             </div>
//           </div>

//           <Link href="/contact" className={getLinkClass("/contact")}>
//             Contact
//           </Link>
//         </nav>
//       </div>
//     </header>
//   );
// }


"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useLang } from "@/app/_lib/langContext";
import data from "@/app/_data/works.json";

export default function Header() {
  const { lang, changeLang } = useLang();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);         // 漢堡選單
  const [worksOpen, setWorksOpen] = useState(false); // Works 下拉（桌機）
  const worksRef = useRef(null);

  // 鎖定背景捲動 + ESC 關閉（手機/平板 modal）
  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  // 桌機 Works：點外面/ESC 關閉
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && setWorksOpen(false);
    const onClick = (e) => {
      if (worksRef.current && !worksRef.current.contains(e.target)) {
        setWorksOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("click", onClick);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("click", onClick);
    };
  }, []);

  // 路由變更時關閉下拉
  useEffect(() => {
    setWorksOpen(false);
    setOpen(false);
  }, [pathname]);

  const getLinkClass = (path) =>
    `px-2 py-1 transition-colors ${
      pathname === path ? "text-[#8c8c8c]" : "text-white"
    } hover:text-[#8c8c8c]`;

  return (
    <header className="fixed top-0 left-0 right-0 z-[100] w-full pointer-events-none">
      <div className="flex items-center justify-between pointer-events-none">
        {/* Logo */}
        <div className="px-5 py-3 flex items-center pointer-events-auto">
          <Link href="/" aria-label="Home">
            <Image
              src="/KAIYO.png"
              alt="Kaiyo Icon"
              width={80}
              height={80}
              className="cursor-pointer"
              priority
            />
          </Link>
        </div>

        {/* 右上角區域 */}
        <div className="px-5 py-3 flex items-center gap-5 pointer-events-auto">
          {/* 語系切換（lg 以上顯示） */}
          <div className="hidden lg:block text-sm text-gray-300">
            <button onClick={() => changeLang("en")} className={lang === "en" ? "font-bold" : ""}>EN</button>{" / "}
            <button onClick={() => changeLang("ja")} className={lang === "ja" ? "font-bold" : ""}>日本語</button>{" / "}
            <button onClick={() => changeLang("zh")} className={lang === "zh" ? "font-bold" : ""}>中文</button>
          </div>

          {/* 桌機導覽（lg 以上顯示） */}
          <nav className="hidden lg:flex bg-black/60 px-4 py-2 rounded items-center gap-4">
            <Link href="/" className={getLinkClass("/")}>Home</Link>
            <Link href="/news" className={getLinkClass("/news")}>News</Link>
            <Link href="/about" className={getLinkClass("/about")}>About</Link>

            {/* Works：hover + click 皆可打開 */}
            <div
              ref={worksRef}
              className="relative group"
              onMouseEnter={() => setWorksOpen(true)}
              onMouseLeave={() => setWorksOpen(false)}
            >
              {/* 讓文字可直接進入 /works，箭頭按鈕負責切換下拉 */}
              <div className="flex items-center">
                <Link href="/works" className={getLinkClass("/works")}>Works</Link>
                <button
                  aria-label="Toggle Works submenu"
                  aria-haspopup="menu"
                  aria-expanded={worksOpen}
                  onClick={(e) => {
                    e.stopPropagation();
                    setWorksOpen((v) => !v);
                  }}
                  className="ml-1 p-1 text-white hover:text-[#8c8c8c] rounded"
                >
                  {/* chevron */}
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className={`w-4 h-4 transition-transform ${worksOpen ? "rotate-180" : ""}`}
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 10.115l3.71-2.885a.75.75 0 01.92 1.18l-4.2 3.27a.75.75 0 01-.92 0l-4.2-3.27a.75.75 0 01-.08-1.2z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>

              {/* 下拉選單（hover 或 worksOpen 時顯示） */}
              <div
                role="menu"
                className={`absolute left-0 top-full mt-1 w-64 bg-gray-800 rounded shadow-lg z-50
                  ${worksOpen ? "block" : "hidden lg:group-hover:block"}`}
              >
                {/* 也提供「All Works」入口 */}
                <Link
                  href="/works"
                  className="block px-4 py-2 text-white hover:bg-gray-200 hover:text-black"
                >
                  All Works
                </Link>
                <div className="h-px bg-white/10 my-1" />
                {Object.entries(data.categories).map(([key, value]) => (
                  <Link
                    key={key}
                    href={`/works/${key}`}
                    className="block px-4 py-2 text-white hover:bg-gray-200 hover:text-black"
                  >
                    {value[lang]}
                  </Link>
                ))}
              </div>
            </div>

            <Link href="/contact" className={getLinkClass("/contact")}>Contact</Link>
          </nav>

          {/* 手機/平板：漢堡（lg 以下顯示） */}
          <button
            aria-label="Open menu"
            aria-expanded={open}
            onClick={() => setOpen(true)}
            className="lg:hidden inline-flex items-center justify-center w-10 h-10 rounded bg-black/60 text-white"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </div>

      {/* 手機/平板：全螢幕 Modal（lg 以下顯示） */}
      <div
        className={`lg:hidden fixed inset-0 z-[99] bg-black/80 text-white flex items-center justify-center
        transition-opacity duration-300 ${open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
        onClick={() => setOpen(false)}
      >
        <div className="w-full px-8 relative" onClick={(e) => e.stopPropagation()}>
          <button
            aria-label="Close menu"
            onClick={() => setOpen(false)}
            className="absolute top-4 right-4 w-10 h-10 rounded bg-white/10 flex items-center justify-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <nav className="flex flex-col items-center justify-center gap-6 text-2xl text-center min-h-screen">
            <Link href="/" onClick={() => setOpen(false)} className="hover:text-gray-300 transition">Home</Link>
            <Link href="/news" onClick={() => setOpen(false)} className="hover:text-gray-300 transition">News</Link>
            <Link href="/about" onClick={() => setOpen(false)} className="hover:text-gray-300 transition">About</Link>

            <Link href="/works" onClick={() => setOpen(false)} className="hover:text-gray-300 transition">Works</Link>
            <div className="flex flex-col items-center gap-3 text-base mt-2">
              {Object.entries(data.categories).map(([key, value]) => (
                <Link
                  key={key}
                  href={`/works/${key}`}
                  onClick={() => setOpen(false)}
                  className="hover:text-gray-300 transition"
                >
                  {value[lang]}
                </Link>
              ))}
            </div>

            <Link href="/contact" onClick={() => setOpen(false)} className="hover:text-gray-300 transition">Contact</Link>

            {/* 語系（手機/平板版） */}
            <div className="pt-4 text-sm text-gray-300">
              <button onClick={() => { changeLang("en"); setOpen(false); }} className={lang === "en" ? "font-bold" : ""}>EN</button>{" / "}
              <button onClick={() => { changeLang("ja"); setOpen(false); }} className={lang === "ja" ? "font-bold" : ""}>日本語</button>{" / "}
              <button onClick={() => { changeLang("zh"); setOpen(false); }} className={lang === "zh" ? "font-bold" : ""}>中文</button>
            </div>
          </nav>
        </div>
      </div>
    </header>
  );
}
