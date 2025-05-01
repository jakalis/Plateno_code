import { Link } from "wouter";
import logo from "@/assets/logo.png"; 

export default function PublicLayout({
  children,
  hotelId,
}: {
  children: React.ReactNode;
  hotelId: string;
}) {
  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-800">
      {/* Navbar */}
      <nav className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo + Title */}
            <div className="flex items-center space-x-3">
              <img
                src={logo} 
                alt="Logo"
                className="h-10 w-10 object-contain rounded-full border border-gray-300 shadow-sm"
              />
              <span className="text-xl font-semibold tracking-tight">Plateno</span>
            </div>

            {/* Links */}
            <div className="space-x-6 text-sm font-medium">
              <Link
                href={`/menu/${hotelId}`}
                className="text-gray-600 hover:text-black transition-colors"
              >
                Menu
              </Link>

              <Link
                href={`/service/${hotelId}`}
                className="text-gray-600 hover:text-black transition-colors"
              >
                Services
              </Link>

              <Link
                href={`/contact/${hotelId}`}
                className="text-gray-600 hover:text-black transition-colors"
              >
                Contacts
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Page content */}
      <main className="relative p-4 sm:p-6 lg:p-8">{children}</main>
    </div>
  );
}
