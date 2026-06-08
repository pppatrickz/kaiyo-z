import { notFound } from "next/navigation";

export default function AdminLayout({ children }) {
  // 只有在生產環境編譯（Build）時，才故意讓 /admin 變成 404 不被導出
  // 本地開發開發端 (development) 則會正常放行
  // if (process.env.NODE_ENV === "production") {
  //   notFound(); 
  // }
  
  return <>
   <div className="w-full h-screen my-10">
  {children}  
  </div>
  </>
}