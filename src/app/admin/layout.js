// src/app/admin/layout.js
import { LangProvider } from "@/app/_lib/langContext";

export default function AdminLayout({ children }) {
  return (
    <LangProvider>
      {/* 🎯 後台專屬：完全滿版、不留白邊、無干擾元件 */}
      <div className="w-full min-h-screen bg-slate-50 antialiased">
        {children}
      </div>
    </LangProvider>
  );
}