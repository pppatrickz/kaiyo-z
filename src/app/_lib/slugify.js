// app/_lib/slugify.js
export function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")  // 非字母數字換成 dash
    .replace(/^-+|-+$/g, "");     // 移除開頭/結尾多餘的 dash
}