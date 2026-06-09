// src/app/(front)/layout.js
import Header from "@/app/_components/layout/Header";
import Footer from "@/app/_components/layout/Footer";
import { LangProvider } from "@/app/_lib/langContext";

export default function FrontLayout({ children }) {
  return (
    <LangProvider>
      {/* 外層白色背景底，置中大框 */}
      <div className="w-full min-h-screen bg-white flex justify-center items-center">
        {/* 中間精緻的內容容器容器 */}
        <div
          className="relative bg-neutral-50 rounded-[32px] shadow-lg overflow-hidden border border-gray-100 flex flex-col"
          style={{
            width: "100%",
            maxWidth: "calc(100vw - 40px)",
            height: "calc(100vh - 40px)",
          }}
        >
          {/* 🎯 導覽列 */}
          <Header />
          
          {/* 🎯 獨立的前台專屬局部捲動區域，完美鎖住外層滾動條 */}
          <main className="flex-1 overflow-y-auto no-scrollbar mt-15 md:mt-0">
            {children}
            <Footer />
          </main>
        </div>
      </div>
    </LangProvider>
  );
}