// import { useEffect, useState } from "react";
// import Image from "next/image";

// export default function Hero({ progress }) {
//   const [step, setStep] = useState(0);

//   useEffect(() => {
//     const timers = [
//       setTimeout(() => setStep(1), 300),
//       setTimeout(() => setStep(2), 800),
//       setTimeout(() => setStep(3), 1100),
//       setTimeout(() => setStep(4), 1400),
//       setTimeout(() => setStep(5), 1900),
//       setTimeout(() => setStep(6), 2600),
//     ];
//     return () => timers.forEach(clearTimeout);
//   }, []);

//   return (
//     <section
//       className="fixed top-0 left-0 w-screen h-screen z-10 flex items-center justify-center transition-all duration-700"
//       style={{
//         opacity: 1 - progress, // 捲動越多越透明
//         transform: `translateY(${progress * 50}px)`, // 微微下移
//       }}
//     >
//       <div className={`hero w-screen h-screen flex flex-row items-stretch ${step>1?"pointer-events-auto":"pointer-events-none"}`}>
//         <div
//           className={`${
//             step >= 1 ? "animate-bounce-in-place pointer-events-none" : "opacity-0"
//           } absolute w-screen h-screen bottom-0 z-10 pointer-events-none`}
//         >
//           <Image
//             src="/hero/p-plane.png"
//             alt="a dog fly an airplane"
//             className="absolute z-1 h-full object-contain"
//             width={1280}
//             height={720}
//             unoptimized
//           />
//         </div>
//         <div className="relative w-1/4">
//           <div
//             className={`${
//               step >= 2 ? "animate-bounce-in-place" : "opacity-0"
//             } group h-full`}
//           >
//             <Image
//               src="/hero/puma-wave.png"
//               alt="a dog wave hands"
//               className="group-hover:visible invisible h-full object-contain object-bottom-left transition-opacity bottom-0"
//               width={329}
//               height={525}
//               unoptimized
//             />
//             <Image
//               src="/hero/puma-idle.png"
//               alt="a dog"
//               className="group-hover:invisible visible absolute z-1 h-full object-contain object-bottom-left transition-opacity bottom-0"
//               width={329}
//               height={525}
//             />
//           </div>
//           <div
//             className={`${
//               step >= 3 ? "animate-bounce-in-place" : "opacity-0"
//             } group`}
//           >
//             <Image
//               src="/hero/duck-wave.png"
//               alt="a duck wave hands"
//               className="group-hover:visible invisible absolute z-1 w-3/4 object-contain object-bottom-left transition-opacity bottom-0"
//               width={268}
//               height={200}
//               unoptimized
//             />
//             <Image
//               src="/hero/duck-idle.png"
//               alt="a duck"
//               className="group-hover:invisible visible absolute z-1 w-3/4 object-contain object-bottom-left transition-opacity bottom-0"
//               width={268}
//               height={200}
//             />
//           </div>
//         </div>
//         <div className="relative w-1/2 flex flex-column pointer-events-none">
//           <p
//             className={`${
//               step >= 6 ? "animate-fade" : "opacity-0"
//             } text-3xl absolute top-1/4 w-full text-center transition-opacity`}
//             id="intro-text"
//           >
//             Hello.
//           </p>
//           <Image
//             src="/hero/mid.png"
//             alt="three pumpkin man in clothes with ZOE"
//             className={`${
//               step >= 5 ? "animate-bounce-in-place" : "invisible"
//             }  absolute z-1 h-full object-contain object-bottom transition-opacity`}
//             width={800}
//             height={514}
//           />
//         </div>
//         <div className="relative w-1/4 pointer-events-none">
//           <Image
//             src="/hero/pumpkin.png"
//             alt="two pumpkin man"
//             className={`${
//               step >= 4 ? "animate-bounce-in-place" : "opacity-0"
//             } absolute z-1 h-full object-contain object-bottom-right right-0 `}
//             width={234}
//             height={622}
//           />
//         </div>
//       </div>
//     </section>
//   );
// }
import { useEffect, useState } from "react";
import Image from "next/image";

export default function Hero({ progress }) {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setStep(1), 300),
      setTimeout(() => setStep(2), 800),
      setTimeout(() => setStep(3), 1100),
      setTimeout(() => setStep(4), 1400),
      setTimeout(() => setStep(5), 1900),
      setTimeout(() => setStep(6), 2600),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <section
      className="fixed top-0 left-0 w-screen h-screen z-10 transition-all duration-700"
      style={{
        opacity: 1 - progress,
        transform: `translateY(${progress * 50}px)`,
      }}
    >
      <div className={`${step > 1 ? "pointer-events-auto" : "pointer-events-none"} relative w-full h-full`}>
        {/* 飛機 */}
        <Image
          src="/hero/p-plane.png"
          alt="a dog fly an airplane"
          className={`${step >= 1 ? "animate-bounce-in-place" : "opacity-0"}
                      absolute bottom-0 left-1/2 -translate-x-1/2
                      h-[60vh] md:h-full w-auto object-contain pointer-events-none`}
          width={1280}
          height={720}
          unoptimized
        />

        {/* puma：用一個 relative 容器當基準 */}
        <div className="group absolute h-[90vh] bottom-0 w-[54vh] z-2">
          <Image
            src="/hero/puma-wave.png"
            alt="a dog wave hands"
            className={`${step >= 2 ? "" : "opacity-0"}
                        group-hover:visible invisible
                        absolute bottom-0 left-0
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
                        absolute bottom-0 left-0
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
                        absolute bottom-0 left-0
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
                        absolute bottom-0  left-0
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
                      absolute bottom-0 left-1/2 -translate-x-1/2 z-0
                      h-[30vh] md:h-full w-auto object-contain transition-opacity`}
          width={800}
          height={514}
          unoptimized
        />

        {/* 標題 */}
        <p
          className={`${step >= 6 ? "animate-fade" : "opacity-0"}
                      absolute w-full text-center text-2xl md:text-3xl`}
          style={{ top: "18vh" }}
          id="intro-text"
        >
          Hello.
        </p>

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
