"use client";
import React, { useState, useEffect } from "react";
import WorksBuilder from "./_components/WorksBuilder";
import NewsBuilder from "./_components/NewsBuilder";
import  CarouselBuilder  from "./_components/CarouselBuilder"; // ⚡ 引入全新輪播大圖組件
import  AboutPageBuilder  from "./_components/AboutPageBuilder"; // 關於我

export default function AdminDashboard() {
  const [activeMenu, setActiveMenu] = useState("works"); // "works" | "news" | "carousel" | "about"
  const [isCloud, setIsCloud] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const isLocal = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
      setIsCloud(!isLocal);
    }
  }, []);

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-950 border-r border-slate-800 p-6 flex flex-col justify-between shrink-0">
        <div className="space-y-6">
          <div>
            <h1 className="text-xl font-bold tracking-wider text-white">P_DO 主控台</h1>
            <div className="mt-2 flex items-center gap-1.5">
              <span className={`h-2 w-2 rounded-full ${isCloud ? "bg-emerald-500" : "bg-amber-500"}`} />
              <span className="text-xs text-slate-400 font-mono">
                {isCloud ? "Cloudflare R2 模式" : "本地 Live 儲存模式"}
              </span>
            </div>
          </div>

          <nav className="space-y-1">
            <button
              onClick={() => setActiveMenu("works")}
              className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition ${
                activeMenu === "works" ? "bg-white text-slate-950 shadow" : "text-slate-400 hover:bg-slate-900 hover:text-white"
              }`}
            >
              📁 作品集管理 (works.json)
            </button>
            <button
              onClick={() => setActiveMenu("news")}
              className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition ${
                activeMenu === "news" ? "bg-white text-slate-950 shadow" : "text-slate-400 hover:bg-slate-900 hover:text-white"
              }`}
            >
              📰 最新消息管理 (news.json)
            </button>
            
            {/* ⚡ 切換到專屬的 CarouselBuilder */}
            <button
              onClick={() => setActiveMenu("carousel")}
              className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition ${
                activeMenu === "carousel" ? "bg-white text-slate-950 shadow" : "text-slate-400 hover:bg-slate-900 hover:text-white"
              }`}
            >
              🎠 首頁輪播管理 (carousel.json)
            </button>

            <button
              onClick={() => setActiveMenu("about")}
              className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition ${
                activeMenu === "about" ? "bg-white text-slate-950 shadow" : "text-slate-400 hover:bg-slate-900 hover:text-white"
              }`}
            >
              👤 關於自我介紹 (about.json)
            </button>
          </nav>
        </div>

        <div className="text-[11px] text-slate-600 font-mono text-center">
          v2.2 · Next.js Jamstack System
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        {activeMenu === "works" && <WorksBuilder isCloud={isCloud} />}
        {activeMenu === "news" && <NewsBuilder isCloud={isCloud} />}
        
        {/* ⚡ 根據不同菜單渲染對應元件 */}
        {activeMenu === "carousel" && <CarouselBuilder isCloud={isCloud} />}
        {activeMenu === "about" && (
          <AboutPageBuilder isCloud={isCloud} targetFile="about.json" pageTitle="關於我" />
        )}
      </main>
    </div>
  );
}