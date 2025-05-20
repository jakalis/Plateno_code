import { useState, useEffect, useRef } from "react";
import { Link } from "wouter";
import logo from "@/assets/logo_icon.svg";

export default function PublicLayout({
  children,
  hotelId,
}: {
  children: React.ReactNode;
  hotelId: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Auto-collapse when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-800">
      {/* Navbar */}
      <nav className="bg-gray-100 shadow-md w-full">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="relative flex items-center justify-between h-10">
            {/* Left: Logo */}
            <div className="flex items-center">
              <img
                src={logo}
                alt="Logo"
                className="h-10 w-10 object-contain rounded-full border border-gray-300 shadow-sm"
              />
            </div>

            {/* Center - Title */}
            <div className="text-center absolute left-1/2 transform -translate-x-1/2">
              <h1
                className="text-2xl sm:text-3xl md:text-4xl font-semibold text-gray-700 tracking-wide"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                Plateno
              </h1>
            </div>

            {/* Right: Dots Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsOpen((prev) => !prev)}
                className="p-2 rounded-full hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-black"
                aria-label="Menu"
              >
                <svg
                  className="w-6 h-6 text-gray-700"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 5a1.5 1.5 0 110-3 1.5 1.5 0 010 3zm0 7a1.5 1.5 0 110-3 1.5 1.5 0 010 3zm0 7a1.5 1.5 0 110-3 1.5 1.5 0 010 3z" />
                </svg>
              </button>

              {isOpen && (
                <div className="absolute right-0 mt-2 w-36 bg-white border border-gray-200 rounded-md shadow-lg z-20">
                  <Link
                    href={`/menu/${hotelId}`}
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    onClick={() => setIsOpen(false)}
                  >
                    Menu
                  </Link>
                  <Link
                    href={`/service/${hotelId}`}
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    onClick={() => setIsOpen(false)}
                  >
                    Services
                  </Link>
                  <Link
                    href={`/contact/${hotelId}`}
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    onClick={() => setIsOpen(false)}
                  >
                    Contacts
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Page content */}
      <main className="relative p-4 sm:p-6 lg:p-8">{children}</main>
    </div>
  );
}
