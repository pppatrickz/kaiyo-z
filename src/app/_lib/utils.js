// src/app/_lib/utils.js (或者是您習慣的共用工具檔)
import { cache } from "react"; // 🎯 引入 React 內建的請求記憶化功能

// ☁️ 請替換成您在 Cloudflare R2 設定的自訂網域或 R2 公開儲存池網址
const R2_PUBLIC_URL = "https://cdn.kaiyo-z.com"; 


/**
 * 根據目前的開發環境，動態返回作品（Works）圖片的基礎路徑
 * 本地開發：返回 "/works" (會去撈 /public/works)
 * 線上環境：返回 "https://.../images/works"
 * */
export function getWorksImagePath(category, imgName) {
  if (!imgName) return "";

  // 🎯 核心改造：識別圖片有無雙冒號 "::" 
  // 如果有（例如 "sculpture::statue.jpg"），就拆開並覆蓋掉傳進來的 category
  let finalCategory = category || "uncategorized";
  let finalFileName = imgName;

  if (imgName.includes("::")) {
    const [originCategory, realFileName] = imgName.split("::");
    finalCategory = originCategory; // 轉向真正存放圖片的來源分類資料夾
    finalFileName = realFileName;   // 拿掉冒號前綴，還原真實檔名
  }

  const isProd = process.env.NODE_ENV === "production";
  
  if (isProd) {
    // 線上環境對齊 R2 的結構：/images/works/分類/圖片名
    return `${R2_PUBLIC_URL}/images/works/${finalCategory}/${finalFileName}`;
  } else {
    // 本地端對齊原本的結構：/works/分類/圖片名 (對應 public/works/...)
    return `/works/${finalCategory}/${finalFileName}`;
  }
}
/**
 * 如果輪播圖（Carousel）也有用到，可以比照辦理
 * 本地開發：返回 "/carousel/img.jpg"
 * 線上環境：返回 "https://.../images/carousel/img.jpg"
 */
export function getCarouselImagePath(imgName) {
  const isProd = process.env.NODE_ENV === "production";
  if (isProd) {
    return `${R2_PUBLIC_URL}/images/carousel/${imgName}`; // 依照您描述的 R2 資料夾名稱
  } else {
    return `/carousel/${imgName}`;
  }
}

// 🎯 修正點 1：加上 cache() 並將 no-store 改為 force-cache 確保靜態編譯通過
export const fetchWorksData = cache(async () => {
  const isProd = process.env.NODE_ENV === "production";

  if (isProd) {
    try {
      // 生產環境：直接從雲端 R2 抓取最新的 works.json
      const res = await fetch(`${R2_PUBLIC_URL}/data/works.json`, { cache: "force-cache" });
      if (!res.ok) throw new Error("撈取 R2 資料失敗");
      return await res.json();
    } catch (err) {
      console.error("R2 fetch error, fallback to local:", err);
      // 如果 R2 出了什麼意外，讀取本地備份，確保前台絕不掛掉
      return require("@/app/_data/works.json");
    }
  } else {
    // 本地開發環境：直接讀取本機專案內的 _data/works.json
    return require("@/app/_data/works.json");
  }
});

// 🎯 新增 1：新聞圖片路徑工具 (本地 /public/news/ 網頁 R2 桶子)
export function getNewsImagePath(imgName) {
  const isProd = process.env.NODE_ENV === "production";
  if (isProd) {
    return `${R2_PUBLIC_URL}/images/news/${imgName}`;
  } else {
    return `/news/${imgName}`;
  }
}

// 🎯 修正點 2：加上 cache() 並將 no-store 改為 force-cache 確保靜態編譯通過
export const fetchNewsData = cache(async () => {
  const isProd = process.env.NODE_ENV === "production";
  if (isProd) {
    try {
      const res = await fetch(`${R2_PUBLIC_URL}/data/news.json`, { cache: "force-cache" });
      if (!res.ok) throw new Error("撈取 R2 消息失敗");
      return await res.json();
    } catch (err) {
      console.error("R2 news fetch error, fallback:", err);
      return require("@/app/_data/news.json");
    }
  } else {
    return require("@/app/_data/news.json");
  }
});

// 🎯 修正點 3：加上 cache() 並將 no-store 改為 force-cache 確保靜態編譯通過
export const fetchCarouselData = cache(async () => {
  const isProd = process.env.NODE_ENV === "production";
  if (isProd) {
    try {
      const res = await fetch(`${R2_PUBLIC_URL}/data/carousel.json`, { cache: "force-cache" });
      if (!res.ok) throw new Error("撈取 R2 輪播資料失敗");
      return await res.json();
    } catch (err) {
      console.error("R2 carousel fetch error, fallback:", err);
      return require("@/app/_data/carousel.json");
    }
  } else {
    return require("@/app/_data/carousel.json");
  }
});


export function getAboutImagePath(imgName) {
  const isProd = process.env.NODE_ENV === "production";
  if (isProd) {
    return `${R2_PUBLIC_URL}/images/about/${imgName}`;
  } else {
    return `/about/${imgName}`;
  }
}

// src/app/_lib/utils.js 內新增：

// 🎯 修正點 4：加上 cache() 並將 no-store 改為 force-cache 確保靜態編譯通過
export const fetchAboutData = cache(async () => {
  const isProd = process.env.NODE_ENV === "production";
  if (isProd) {
    try {
      // 生產環境：從雲端 R2 抓取最新的 about.json
      const res = await fetch(`${R2_PUBLIC_URL}/data/about.json`, { cache: "force-cache" });
      if (!res.ok) throw new Error("撈取 R2 About 資料失敗");
      return await res.json();
    } catch (err) {
      console.error("R2 about fetch error, fallback:", err);
      return require("@/app/_data/about.json");
    }
  } else {
    // 本地環境：直接讀取本機專案內的 _data/about.json
    return require("@/app/_data/about.json");
  }
});

export function getVideoImagePath(videoName) {
  const isProd = process.env.NODE_ENV === "production";
  if (isProd) {
    return `${R2_PUBLIC_URL}/videos/${videoName}`;
  } else {
    return `./${videoName}`; // 保持您本機的相對路徑形式
  }
}

/**
 * 取得前台作品圖片的真實完整網址（支援跨分類雙冒號引渡）
 * @param {string} currentCategory - 該作品目前所屬的分類 (例如: "jewelry")
 * @param {string} imgName - 儲存在 JSON 裡的圖片名稱 (例如: "ring.jpg" 或 "sculpture::statue.jpg")
 * @returns {string} 完整的圖片 URL 路徑
 */
export function getClientWorkImageSrc(currentCategory, imgName) {
  if (!imgName) return "";

  let finalCategory = currentCategory || "uncategorized";
  let finalFileName = imgName;

  // 🎯 核心識別：檢查是否包含雙冒號 "::"（跨分類引用）
  if (imgName.includes("::")) {
    const [originCategory, realFileName] = imgName.split("::");
    finalCategory = originCategory; // 強制將分類轉向來源分類
    finalFileName = realFileName;   // 取得真正的檔案名稱
  }

  const isProd = process.env.NODE_ENV === "production";

  // 根據環境輸出對應路徑
  if (isProd) {
    return `${R2_PUBLIC_URL}/images/works/${finalCategory}/${finalFileName}`;
  } else {
    return `/works/${finalCategory}/${finalFileName}`;
  }
}

/**
 * 工具函式：純粹用來解構雙冒號名稱
 * @param {string} imgName 
 * @returns {{ name: string, originCategory: string|null }}
 */
export function parseCrossCategoryName(imgName) {
  if (imgName && imgName.includes("::")) {
    const [originCategory, realFileName] = imgName.split("::");
    return { name: realFileName, originCategory };
  }
  return { name: imgName, originCategory: null };
}