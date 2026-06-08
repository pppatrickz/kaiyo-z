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
      // 串接你寫在 functions 中的 Cloudflare API
      const res = await fetch("/admin/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ password }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        // 登入成功，跳轉到後台作品管理主頁
        router.push("/admin/works");
      } else {
        setError(data.error || "密碼錯誤，請再試一次。");
      }
    } catch (err) {
      setError("連線伺服器失敗，請檢查網路或環境變數。");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl space-y-6">
        
        {/* 標題區 */}
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white tracking-wider">P_DO LAB</h1>
          <p className="text-sm text-slate-400 mt-2">管理後台主控台</p>
        </div>

        {/* 錯誤訊息提示 */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm p-3 rounded-xl text-center">
            {error}
          </div>
        )}

        {/* 登入表單 */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">
              安全存取密碼
            </label>
            <input
              type="password"
              autoFocus
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="請輸入密碼"
              className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition text-center tracking-widest"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-white text-slate-950 font-semibold rounded-xl hover:bg-slate-200 active:scale-[0.99] transition disabled:opacity-50 disabled:pointer-events-none"
          >
            {loading ? "驗證中..." : "確認登入"}
          </button>
        </form>

        {/* 底部裝飾文字 */}
        <div className="text-center">
          <span className="text-[10px] text-slate-600 font-mono">
            Protected by Cloudflare Edge Network
          </span>
        </div>

      </div>
    </div>
  );
}