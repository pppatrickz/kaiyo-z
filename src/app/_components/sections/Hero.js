'use client';
import { useEffect, useState } from "react";
import Image from "next/image";
import { useLang } from "@/app/_lib/langContext";

export default function Hero({ progress }) {
  const { lang } = useLang();
  const [step, setStep] = useState(0);

  const greetings =
    lang === "zh"
      ? ["你好", "Hello.", "こんにちは"]
      : lang === "ja"
      ? ["こんにちは", "Hello.", "你好"]
      : ["Hello.", "你好", "こんにちは"];

  useEffect(() => {
    const timers = [
      setTimeout(() => setStep(1), 300),  // 飛機
      setTimeout(() => setStep(2), 800),  // puma
      setTimeout(() => setStep(3), 1100), // duck
      setTimeout(() => setStep(4), 1400), // pumpkin
      setTimeout(() => setStep(5), 1900), // 中央主視覺
      setTimeout(() => setStep(6), 2600), // Hello.
      setTimeout(() => setStep(7), 3100), // 🎯 新增：你好 (Hello 後 500ms)
      setTimeout(() => setStep(8), 3600), // 🎯 新增：こんにちは (你好 後 500ms)
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  // 🎯 改用 step 狀態來控制文字堆疊，確保絕對看得到特效！
  const showZh = step >= 7;
  const showJa = step >= 8;

  return (
    <section
      className="relative w-full h-screen transition-all duration-700 overflow-hidden"
      style={{
        opacity: 1 - progress,
        transform: `translateY(${progress * 50}px)`,
      }}
    >
      {/* 全螢幕容器：手機版集體上移 */}
      <div className={`${step > 1 ? "pointer-events-auto" : "pointer-events-none"} relative w-full h-full bottom-12 md:bottom-0 transition-all`}>
        
        {/* 飛機 */}
        <Image
          src="/hero/p-plane.png"
          alt="a dog fly an airplane"
          className={`${step >= 1 ? "animate-bounce-in-place" : "opacity-0"}
                      absolute bottom-0 left-1/2 -translate-x-1/2
                      h-[55vh] md:h-full w-auto object-contain pointer-events-none`}
          width={1280}
          height={720}
          unoptimized
        />

        {/* puma */}
        <div className="group absolute h-[90vh] bottom-0 w-[54vh] z-2">
          <Image
            src="/hero/puma-wave.png"
            alt="a dog wave hands"
            className={`${step >= 2 ? "" : "opacity-0"}
                        group-hover:visible invisible
                        absolute bottom-10 left-0
                        h-[32vh] md:h-full w-auto object-contain transition-opacity`}
            width={329}
            height={525}
            unoptimized
          />
          <Image
            src="/hero/puma-idle.png"
            alt="a dog"
            className={`${step >= 2 ? "" : "opacity-0"}
                        group-hover:invisible visible
                        absolute bottom-10 left-0
                        h-[32vh] md:h-full w-auto object-contain transition-opacity`}
            width={329}
            height={525}
            unoptimized
          />
        </div>

        {/* duck */}
        <div className="group absolute h-[30vh] w-[40.2vh] left-0 bottom-0 z-3">
          <Image
            src="/hero/duck-wave.png"
            alt="a duck wave hands"
            className={`${step >= 3 ? "" : "opacity-0"}
                        group-hover:visible invisible
                        absolute bottom-10 left-0
                        h-[18vh] md:h-auto w-auto object-contain transition-opacity`}
            width={268}
            height={200}
            unoptimized
          />
          <Image
            src="/hero/duck-idle.png"
            alt="a duck"
            className={`${step >= 3 ? "" : "opacity-0"}
                        group-hover:invisible visible
                        absolute bottom-10 left-0
                        h-[18vh] md:h-auto w-auto object-contain transition-opacity`}
            width={268}
            height={200}
            unoptimized
          />
        </div>

        {/* 中央主視覺 */}
        <Image
          src="/hero/mid.png"
          alt="three pumpkin man in clothes with ZOE"
          className={`${step >= 5 ? "animate-bounce-in-place" : "invisible"}
                      absolute bottom-10 left-1/2 -translate-x-1/2 z-0
                      h-[30vh] md:h-full w-auto object-contain transition-opacity`}
          width={800}
          height={514}
          unoptimized
        />

        {/* 🎯 標題與自動時間差堆疊文字區塊 */}
        <div 
          className="absolute w-full text-center flex flex-col items-center gap-2 transition-all duration-500 z-10"
          style={{ top: "12vh" }}
        >
          {/* 第一層：Hello (手機版修正為 text-4xl 避免太大，桌機 text-5xl) */}
          <p className={`${step >= 6 ? "animate-fade opacity-100" : "opacity-0"} text-4xl md:text-5xl font-bold tracking-wide transition-all duration-700`}>
            {greetings[0]}
          </p>

          {/* 第二層：你好 */}
          <p className={`text-2xl md:text-3xl text-gray-700 font-medium transition-all duration-700 transform ${
            showZh ? "opacity-100 translate-y-0 scale-100" : "opacity-0 -translate-y-4 scale-95 pointer-events-none"
          }`}>
            {greetings[1]}
          </p>

          {/* 第三層：こんにちは */}
          <p className={`text-xl md:text-2xl text-gray-500 transition-all duration-700 transform ${
            showJa ? "opacity-100 translate-y-0 scale-100" : "opacity-0 -translate-y-4 scale-95 pointer-events-none"
          }`}>
            {greetings[2]}
          </p>
        </div>

        {/* 右側 pumpkin */}
        <Image
          src="/hero/pumpkin.png"
          alt="two pumpkin man"
          className={`${step >= 4 ? "animate-bounce-in-place" : "opacity-0"}
                      absolute bottom-0 right-0
                      h-[38vh] md:h-full w-auto object-contain`}
          width={234}
          height={622}
          unoptimized
        />
      </div>
    </section>
  );
}