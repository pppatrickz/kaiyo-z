"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/admin/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ password }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        router.push("/admin");
      } else {
        setError(data.error || "密碼不正確，請再試一次。");
      }
    } catch (err) {
      setError("連線伺服器失敗，請檢查環境變數設定。");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="min-h-screen bg-white bg-paper flex flex-col items-center justify-center px-6 relative py-20">
      
      {/* 核心登入卡片：優雅白底、溫和陰影、大圓角 */}
      <div className="max-w-md w-full bg-white/90 border border-gray-100 rounded-[24px] p-8 md:p-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] space-y-8 relative z-10">
        
        {/* 標題區：乾淨極簡藝術感 */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-gray-900 tracking-wide font-sans">
            KAIYO-Z
          </h1>
          <div className="w-8 h-[2px] bg-black mx-auto my-3" /> {/* 極簡分割線 */}
          <p className="text-xs tracking-widest text-gray-400 uppercase">
            Dashboard Access
          </p>
        </div>

        {/* 錯誤訊息提示：柔和不刺眼 */}
        {error && (
          <div className="bg-red-50 text-red-600 text-xs p-3.5 rounded-full text-center border border-red-100 animate-fade-in">
            {error}
          </div>
        )}

        {/* 登入表單 */}
        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-2">
            <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest text-center">
              安全存取金鑰 (Password)
            </label>
            <input
              type="password"
              autoFocus
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-full text-gray-900 placeholder-gray-300 focus:outline-none focus:bg-white focus:ring-2 focus:ring-black/5 focus:border-black transition text-center tracking-widest text-sm"
            />
          </div>

          {/* 登入按鈕：對齊黑底白字 Pill 風格 */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-black text-white font-medium rounded-full shadow hover:bg-gray-800 active:scale-[0.99] transition disabled:opacity-40 disabled:pointer-events-none text-sm tracking-wider"
          >
            {loading ? "驗證中..." : "進入主控台"}
          </button>
        </form>

        {/* 底部安全防護文字 */}
        <div className="text-center pt-2">
          <span className="text-[10px] text-gray-400 font-mono tracking-tight">
            Protected by Cloudflare Edge Network
          </span>
          <span className="text-[10px] text-gray-400 font-mono tracking-tight">
            Powered by P-Do Lab
          </span>
        </div>

      </div>

      {/* 🎯 靈魂畫布背景：讓管理面板頁面完美收尾、不留白 */}
    </section>
  );
}