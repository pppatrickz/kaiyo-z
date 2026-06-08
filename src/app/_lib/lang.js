// /app/_lib/lang.js
const SUPPORTED = ["en", "ja", "zh"];

export function detectInitialLang() {
  if (typeof window === "undefined") return "en";
  const saved = localStorage.getItem("lang");
  if (saved && SUPPORTED.includes(saved)) return saved;

  const nav = (navigator.language || "").toLowerCase();
  if (nav.startsWith("ja")) return "ja";
  if (nav.startsWith("zh")) return "zh";
  return "en"; // 預設英文
}

export function applyLang(lang) {
  if (typeof document === "undefined") return;

  // 設定 <html lang="...">
  document.documentElement.setAttribute("lang", lang);

  // 找出所有有任一語系資料的元素
  const nodes = document.querySelectorAll("[data-en], [data-ja], [data-zh]");

  nodes.forEach((el) => {
    const txt = el.getAttribute(`data-${lang}`);
    if (txt == null) return;

    // 若是可輸入元件，就設 placeholder；否則設置文字
    const tag = el.tagName;
    if (tag === "INPUT" || tag === "TEXTAREA") {
      el.setAttribute("placeholder", txt);
    } else {
      el.textContent = txt;
    }
  });

  // 可選：把選擇記住
  try { localStorage.setItem("lang", lang); } catch {}
}
