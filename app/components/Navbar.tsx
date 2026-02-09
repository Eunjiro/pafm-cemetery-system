import Link from "next/link"
import Image from "next/image"

export default function Navbar() {
  return (
    <nav className="bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-3">
              <Image 
                src="/logo.png" 
                alt="GoServePh Logo" 
                width={40} 
                height={40}
                className="rounded-lg"
              />
              <span className="text-xl font-bold">
                <span className="text-blue-600">Go</span>
                <span className="text-green-600">Serve</span>
                <span className="text-blue-600">Ph</span>
              </span>
            </Link>
          </div>

          {/* Navigation Links */}
          <div className="flex items-center space-x-4">
            <Link
              href="/login"
              className="px-4 py-2 text-gray-700 hover:text-green-600 font-medium transition-colors"
            >
              Login
            </Link>
            <Link
              href="/register"
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition-colors shadow-md"
            >
              Register
            </Link>
          </div>
        </div>
      </div>
    </nav>
  )
}
