"use client";
import React, { useState, useEffect } from "react";
import WorksBuilder from "./_components/WorksBuilder";
import NewsBuilder from "./_components/NewsBuilder";
import CarouselBuilder from "./_components/CarouselBuilder"; 
import AboutPageBuilder from "./_components/AboutPageBuilder"; 

export default function AdminDashboard() {
  const [activeMenu, setActiveMenu] = useState("works"); 
  const [isCloud, setIsCloud] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false); // 🎯 控制手機版選單開關

  useEffect(() => {
    if (typeof window !== "undefined") {
      const isLocal = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
      setIsCloud(!isLocal);
    }
  }, []);

  // 🎯 點擊選單後自動關閉手機側邊欄
  const handleMenuClick = (menuKey) => {
    setActiveMenu(menuKey);
    setIsMobileMenuOpen(false);
  };

  // 根據 activeMenu 顯示標題
  const getMenuTitle = () => {
    switch (activeMenu) {
      case "works": return "作品集管理";
      case "news": return "最新消息管理";
      case "carousel": return "首頁輪播管理";
      case "about": return "關於我管理";
      default: return "主控台";
    }
  };

  // 🎯 共用的選單按鈕組件，徹底融入 WorksPageClient 的 Pill 膠囊與優雅風格
  const NavButton = ({ menuKey, icon, label }) => {
    const isActive = activeMenu === menuKey;
    return (
      <button
        type="button"
        onClick={() => handleMenuClick(menuKey)}
        className={`w-full text-left px-4 py-3 rounded-full text-sm font-medium transition duration-200 flex items-center gap-2.5 ${
          isActive
            ? "bg-black text-white shadow-sm"
            : "text-gray-600 hover:bg-gray-100 hover:text-gray-900 active:bg-gray-200"
        }`}
      >
        <span className="text-base">{icon}</span>
        <span>{label}</span>
      </button>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 text-gray-900 flex flex-col md:flex-row antialiased bg-paper">
      
      {/* 📱 行動裝置頂部導覽列 (Mobile Top Header) */}
      <header className="md:hidden w-full bg-white/95 backdrop-blur border-b border-gray-100 px-5 py-3.5 flex items-center justify-between sticky top-0 z-30 shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
        <div className="flex items-center gap-3">
          {/* 漢堡排按鈕 */}
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-1.5 text-gray-700 hover:bg-gray-100 rounded-lg transition"
            aria-label="Toggle menu"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={isMobileMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
            </svg>
          </button>
          <div>
            <h1 className="text-sm font-bold text-gray-900">{getMenuTitle()}</h1>
            <p className="text-[10px] text-gray-400 font-mono">P_DO LAB Control</p>
          </div>
        </div>

        {/* 右側同步狀態微型小點 */}
        <div className="flex items-center gap-1 bg-gray-50 border border-gray-100 px-2.5 py-1 rounded-full">
          <span className={`h-1.5 w-1.5 rounded-full ${isCloud ? "bg-emerald-500 animate-pulse" : "bg-amber-500"}`} />
          <span className="text-[10px] text-gray-500 font-mono font-medium">{isCloud ? "R2" : "Local"}</span>
        </div>
      </header>

      {/* 📱 手機版左側滑出選單的黑色半透明背景遮罩 */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/30 z-40 md:hidden backdrop-blur-xs transition-opacity duration-300"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* 💻 桌機固定側邊欄 & 📱 手機滑出側邊欄 */}
      <aside 
        className={`
          fixed top-0 bottom-0 left-0 z-50 w-64 bg-white border-r border-gray-100 p-6 flex flex-col justify-between shrink-0 transition-transform duration-300 transform
          md:translate-x-0 md:sticky md:h-screen md:z-20
          ${isMobileMenuOpen ? "translate-x-0 shadow-xl" : "-translate-x-full md:shadow-none"}
        `}
      >
        <div className="space-y-8">
          {/* 頂部 LOGO 區塊：優雅白淨風 */}
          <div className="border-b border-gray-50 pb-4">
            <h1 className="text-xl font-bold tracking-wider text-gray-900 font-sans">
              P_DO 主控台
            </h1>
            <div className="mt-2.5 inline-flex items-center gap-2 bg-slate-50 border border-gray-100 px-3 py-1 rounded-full">
              <span className={`h-2 w-2 rounded-full ${isCloud ? "bg-emerald-500" : "bg-amber-500"}`} />
              <span className="text-[11px] text-gray-500 font-mono font-medium">
                {isCloud ? "Cloudflare R2 模式" : "本地 Live 儲存模式"}
              </span>
            </div>
          </div>

          {/* 導覽功能選單 */}
          <nav className="space-y-1.5">
            <NavButton menuKey="works" icon="📁" label="作品集管理 (works.json)" />
            <NavButton menuKey="news" icon="📰" label="最新消息管理 (news.json)" />
            <NavButton menuKey="carousel" icon="🎠" label="首頁輪播管理 (carousel.json)" />
            <NavButton menuKey="about" icon="👤" label="關於自我介紹 (about.json)" />
          </nav>
        </div>

        {/* 底部系統版本標記 */}
        <div className="text-[10px] text-gray-400 font-mono text-center border-t border-gray-50 pt-4">
          v2.5 · Jamstack Studio System
        </div>
      </aside>

      {/* 🖥️ 主要內容顯示區域 (Main Content Area) */}
      <main className="flex-1 overflow-y-auto w-full min-w-0">
        <div className="p-4 md:p-0"> {/* 手機版增加一層舒適的彈性內距 */}
          {activeMenu === "works" && <WorksBuilder isCloud={isCloud} />}
          {activeMenu === "news" && <NewsBuilder isCloud={isCloud} />}
          {activeMenu === "carousel" && <CarouselBuilder isCloud={isCloud} />}
          {activeMenu === "about" && (
            <AboutPageBuilder isCloud={isCloud} targetFile="about.json" pageTitle="關於我" />
          )}
        </div>
      </main>

    </div>
  );
}