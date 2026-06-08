import Image from "next/image";

const cardClasses =
  "w-full aspect-[5/8] border border-gray-300 text-center no-underline text-gray-800 transform transition-transform duration-300 hover:scale-105 flex flex-col";
const titleClasses = "text-lg my-2";
const dateClasses = "text-gray-500 mb-2";

export default function NewsCard({ href, image, alt, title, date }) {
  return (
    <a className={cardClasses} href={href}>
      {/* 上 3/5 圖片區 */}
      <div className="flex-[5] relative w-full overflow-hidden">
        <Image
          src={image}
          alt={alt}
          fill
          className="object-cover"
        />
      </div>

      {/* 下 2/5 文字區 */}
      <div className="flex-[2] flex flex-col justify-center px-3 bg-white">
        <h2 className={titleClasses}>{title}</h2>
        <p className={dateClasses}>{date}</p>
      </div>
    </a>
  );
}
