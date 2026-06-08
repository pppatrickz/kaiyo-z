// src/app/page.js

import Carousel from "@/app/_components/ui/Carousel";
import About from "@/app/_components/sections/About";
import MessageGallery from "@/app/_components/ui/MessageGallery";
import { fetchCarouselData, fetchAboutData, getAboutImagePath } from "@/app/_lib/utils"; 

export default async function Page() {
  // 同步撈取雲端 R2 或是本地專案最新的輪播圖與關於我資料
  const currentSlides = await fetchCarouselData();
  const currentAboutData = await fetchAboutData();

  // 🎯 核心修改：動態從載入的 JSON 中讀取圖片陣列，並使用路徑工具智慧轉換
  const rawBannerList = currentAboutData?.bannerImages || ["1.jpg", "4.jpg", "2.jpg"];
  const bannerImages = rawBannerList.map(imgName => getAboutImagePath(imgName));

  return (
    <div className="sticky top-0 min-h-screen z-20 bg-[var(--background)] bg-paper">
      <Carousel slides={currentSlides} />

      <section className="relative w-full my-10">
        <div className="w-full opacity-[0.7] py-10">
          <MessageGallery images={bannerImages} />
        </div>

        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="pointer-events-auto">
            {/* 將完整 JSON 餵入，About 內的大頭貼也會完美運作 */}
            <About initialAboutData={currentAboutData} />
          </div>
        </div>
      </section>
    </div>
  );
}