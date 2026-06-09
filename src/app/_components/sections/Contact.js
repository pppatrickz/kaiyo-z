"use client";
import { useState } from "react";
import { useLang } from "@/app/_lib/langContext";
import contactData from "@/app/_data/contact.json";

export default function Contact() {
  const { lang } = useLang();
  const t = contactData[lang] || contactData.en || {}; // 取得對應語言字串，加安全防護

  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [status, setStatus] = useState("idle"); // idle | loading | success | error
  const [emailError, setEmailError] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (e.target.name === "email") setEmailError(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.email)) {
      setEmailError(true);
      setStatus("error");
      return;
    }

    setStatus("loading");
    try {
      const res = await fetch(
        "https://script.google.com/macros/s/AKfycbz2rd0EB0WTN1vvJ7vYCTQ_wnDBIdaE-fXtOfuezl7cCEsJ3fYOALgTJt0DqFlhZq0Y/exec" +
          "?origin=" +
          encodeURIComponent(window.location.origin),
        {
          method: "POST",
          headers: { "Content-Type": "text/plain;charset=utf-8" },
          body: JSON.stringify(form),
        }
      );

      const result = await res.json();
      if (result.status === "success") {
        setStatus("success");
        setForm({ name: "", email: "", message: "" });
      } else {
        throw new Error(result.message || "API error");
      }
    } catch (err) {
      console.error(err);
      setStatus("error");
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-[#1A1A1A] font-sans antialiased flex flex-col selection:bg-neutral-200">
      
      {/* 精品式導航頭（純裝飾，維持全站一致視覺線條） */}
      {/* <header className="w-full px-6 py-5 md:px-12 flex justify-between items-center bg-white/80 backdrop-blur-md border-b border-neutral-100">
        <div className="text-xs tracking-[0.2em] uppercase text-neutral-500 font-light">
          {lang === "zh" ? "聯絡我們" : lang === "ja" ? "お問い合わせ" : "Contact"}
        </div>
        <div className="text-xs tracking-[0.3em] uppercase text-neutral-400 font-light hidden sm:block">
          Kaiyo-Z Studio
        </div>
      </header> */}

      {/* 表單主體區塊 */}
      <main className="flex-grow flex flex-col items-center justify-center px-6 py-12 md:py-20 max-w-4xl mx-auto w-full">
        
        {/* 書信式策展前導 */}
        <div className="text-center mb-10 md:mb-16 space-y-3">
          <h1 className="text-3xl md:text-5xl font-light tracking-[0.15em] uppercase text-neutral-900">
            {t.title}
          </h1>
          <p className="text-xs tracking-[0.2em] text-neutral-400 font-light">
            {lang === "zh" ? "留下您的訊息，我們盡快與您連繫" : "Leave a message, I will reply shortly."}
          </p>
        </div>

        {/* 輕量信封感表單卡片 */}
        <form
          onSubmit={handleSubmit}
          className="w-full max-w-xl bg-white/90 backdrop-blur-sm p-8 md:p-12 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.02)] border border-neutral-200/50 space-y-8"
        >
          {/* 姓名欄位 */}
          <div className="relative group">
            <label className="block text-xs uppercase tracking-[0.25em] text-neutral-400 font-light mb-1 transition-colors group-focus-within:text-neutral-900">
              {t.name}
            </label>
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              required
              className="w-full bg-transparent py-2 border-b border-neutral-200 text-sm font-light text-neutral-800 focus:outline-none focus:border-neutral-900 transition-colors"
            />
          </div>

          {/* 信箱欄位 */}
          <div className="relative group">
            <label className="block text-xs uppercase tracking-[0.25em] text-neutral-400 font-light mb-1 transition-colors group-focus-within:text-neutral-900">
              {t.email}
            </label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              required
              className={`w-full bg-transparent py-2 border-b text-sm font-light text-neutral-800 focus:outline-none transition-colors ${
                emailError 
                  ? "border-red-500 animate-shake focus:border-red-500" 
                  : "border-neutral-200 focus:border-neutral-900"
              }`}
            />
          </div>

          {/* 訊息欄位 */}
          <div className="relative group">
            <label className="block text-xs uppercase tracking-[0.25em] text-neutral-400 font-light mb-2 transition-colors group-focus-within:text-neutral-900">
              {t.message}
            </label>
            <textarea
              name="message"
              value={form.message}
              onChange={handleChange}
              rows="4"
              required
              className="w-full bg-neutral-50/50 p-4 border border-neutral-200/70 rounded-lg text-sm font-light text-neutral-800 focus:outline-none focus:border-neutral-900 focus:bg-white transition-all resize-none leading-relaxed"
            />
          </div>

          {/* 大氣的寬版精品按鈕 */}
          <div className="pt-4">
            <button
              type="submit"
              disabled={status === "loading"}
              className="w-full h-12 flex items-center justify-center bg-neutral-900 text-white rounded-full text-xs uppercase tracking-[0.25em] font-light transition-all duration-300 hover:bg-neutral-800 active:scale-[0.99] disabled:bg-neutral-300 disabled:cursor-not-allowed shadow-sm"
            >
              {status === "loading" ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  {t.sending}
                </span>
              ) : (
                t.submit
              )}
            </button>
          </div>

          {/* 反饋狀態排印 */}
          <div className="text-center text-xs tracking-wide font-light">
            {status === "success" && (
              <p className="text-emerald-600 font-medium py-1 bg-emerald-50/50 rounded-md animate-fade-in">
                † {t.success}
              </p>
            )}
            {status === "error" && !emailError && (
              <p className="text-red-500 font-medium py-1 bg-red-50/50 rounded-md animate-fade-in">
                ‡ {t.error}
              </p>
            )}
            {emailError && (
              <p className="text-red-500 font-medium py-1 bg-red-50/50 rounded-md animate-fade-in">
                ‡ {t.emailError}
              </p>
            )}
          </div>
        </form>
      </main>
    </div>
  );
}