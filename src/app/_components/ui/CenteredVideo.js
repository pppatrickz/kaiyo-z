import React from 'react';
// 注意：由於檔案在 public/ 目錄下，我們不需要使用 import 來引入它，
// 而是直接在 src 屬性中使用相對於網站根目錄的路徑。

const CenteredVideo = ({src}) => {
  // 檔案路徑是 /TV.webm，因為它在 public/TV.webm

  return (
    // 外層容器：使用 flexbox 將內容在螢幕上完全置中
    // min-h-screen: 確保容器至少佔滿整個視窗高度 (如果您希望它佔滿整個螢幕)
    // flex items-center: 垂直置中
    // justify-center: 水平置中
    <div className="min-h-screen flex items-center justify-center p-4 pt-16 pointer-events-none">
      
      {/* 影片元素 */}
      <video
        // 設置循環播放和靜音
        autoPlay
        loop
        muted 
        
        // 設定影片的樣式，使其在容器中佔滿並保持適當的比例
        // max-w-full 和 max-h-full 確保影片不會溢出
        // object-contain 保持長寬比
        className="h-[98vh] object-contain pointer-events-none mix-blend-darken" 
      >
        {/* 使用絕對路徑指向 public 資料夾中的檔案 */}
        <source src={src} type="video/webm" />
        
        您的瀏覽器不支持 video 標籤。
      </video>
    </div>
  );
};

export default CenteredVideo;