"use client";
import Image from "next/image";

export default function MessageGallery({ images = [] }) {
  if (!images.length) return null;

  return (
    <section
      className="
        flex flex-col gap-8 
        w-full
        mx-auto 
        mt-0 mb-10 px-4
      "
    >
      {images.map((src, i) => {
        const isLeft = i % 2 === 0; // 偶數靠左，奇數靠右

        return (
          <div
            key={i}
            className={`
              flex w-full items-start 
              ${isLeft ? "justify-start" : "justify-end"}
            `}
          >
            <div
              className={`
                relative 
                max-w-[55%] md:max-w-[30%] 
                rounded-[21px] shadow-md 
                bg-white/85 p-3 
              `}
            >
              <Image
                src={src}
                alt={`Message image ${i + 1}`}
                width={500}
                height={500}
                className="
                  w-full h-auto rounded-lg
                  object-cover
                "
              />
            </div>
          </div>
        );
      })}
    </section>
  );
}
