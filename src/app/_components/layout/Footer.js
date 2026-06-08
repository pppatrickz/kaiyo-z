export default function Footer() {
  return <footer className="relative bottom-0 w-full bg-gray-800 text-white text-center py-6 mt-auto z-100">
        <p>&copy; 2025 Kaiyo</p>
        <div className="flex justify-center gap-6 mt-3 text-xl">
          <a href="https://www.instagram.com/kaiyo.z" target="_blank" rel="noopener noreferrer" className="hover:scale-125 transition"><i className="fab fa-instagram"></i></a>
          <a href="https://pudomade.etsy.com" target="_blank" rel="noopener noreferrer" className="hover:scale-125 transition"><i className="fab fa-etsy"></i></a>
          <a href="https://www.creema.jp/c/Pudomade" target="_blank" rel="noopener noreferrer" className="hover:scale-125 transition"><i className="fas fa-store"></i></a>
        </div>
      </footer>
}