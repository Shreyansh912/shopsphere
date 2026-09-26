"use client";

import Link from "next/link";
import { useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useCartStore } from "@/store/useCartStore";
import VisualSearchModal from "@/components/products/VisualSearchModal";

export default function Navbar() {
  const router = useRouter();
  const { data: session } = useSession();
  const cartItems = useCartStore((state) => state.items);
  const [searchQuery, setSearchQuery] = useState("");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const totalCartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);
  const userRole = (session?.user as { role?: string } | undefined)?.role;

  const handleTextSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    router.push(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
  };

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-gray-100 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          
          {/* Logo */}
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2">
              <span className="text-xl font-extrabold tracking-tight text-gray-900">
                Shop<span className="text-indigo-600">Sphere</span>
              </span>
            </Link>

            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-600">
              <Link href="/products" className="hover:text-gray-900 transition">
                All Products
              </Link>
              <Link href="/products?category=mens-watches" className="hover:text-gray-900 transition">
                Watches
              </Link>
              <Link href="/products?category=mobile-accessories" className="hover:text-gray-900 transition">
                Accessories
              </Link>
            </nav>
          </div>

          {/* Search Bar + Visual Search Trigger */}
          <div className="flex-1 max-w-md hidden sm:flex items-center gap-2">
            <form onSubmit={handleTextSearch} className="relative w-full">
              <input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
              />
              <svg
                className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </form>

            {/* AI Computer Vision Search Modal */}
            <VisualSearchModal />
          </div>

          {/* Right Action Icons */}
          <div className="flex items-center gap-3">
            
            {/* Visual Search Button for mobile */}
            <div className="sm:hidden">
              <VisualSearchModal />
            </div>

            {/* Cart Button */}
            <Link
              href="/cart"
              className="relative p-2 text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition"
              aria-label="Shopping Cart"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                />
              </svg>
              {totalCartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-indigo-600 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
                  {totalCartCount > 99 ? "99+" : totalCartCount}
                </span>
              )}
            </Link>

            {/* Session Navigation */}
            {session?.user ? (
              <div className="flex items-center gap-2">
                {userRole === "ADMIN" && (
                  <Link
                    href="/admin"
                    className="hidden sm:inline-block text-xs font-semibold px-2.5 py-1 bg-amber-100 text-amber-800 rounded border border-amber-200 hover:bg-amber-200 transition"
                  >
                    Admin
                  </Link>
                )}

                <Link
                  href="/profile"
                  className="text-xs font-medium text-gray-700 hover:text-gray-900 border border-gray-200 rounded-lg px-3 py-1.5 hover:bg-gray-50 transition"
                >
                  {session.user.name?.split(" ")[0] || "Profile"}
                </Link>

                <button
                  onClick={() => signOut({ callbackUrl: "/login" })}
                  className="text-xs text-red-600 hover:text-red-700 hover:bg-red-50 px-2.5 py-1.5 rounded-lg transition"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className="text-xs font-semibold px-3 py-1.5 text-gray-700 hover:text-gray-900 transition"
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  className="text-xs font-semibold px-3 py-1.5 bg-gray-900 hover:bg-black text-white rounded-lg transition shadow-sm"
                >
                  Register
                </Link>
              </div>
            )}

            {/* Mobile Hamburger Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 text-gray-600 hover:text-gray-900 rounded-lg"
              aria-label="Toggle Navigation"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {isMobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>

          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-gray-100 bg-white px-4 pt-3 pb-5 space-y-3">
          <form onSubmit={handleTextSearch} className="relative w-full">
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none"
            />
            <svg
              className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </form>

          <div className="flex flex-col space-y-2 text-sm font-medium text-gray-700">
            <Link
              href="/products"
              onClick={() => setIsMobileMenuOpen(false)}
              className="px-2 py-1.5 hover:bg-gray-50 rounded-md"
            >
              All Products
            </Link>
            <Link
              href="/products?category=mens-watches"
              onClick={() => setIsMobileMenuOpen(false)}
              className="px-2 py-1.5 hover:bg-gray-50 rounded-md"
            >
              Watches
            </Link>
            <Link
              href="/products?category=mobile-accessories"
              onClick={() => setIsMobileMenuOpen(false)}
              className="px-2 py-1.5 hover:bg-gray-50 rounded-md"
            >
              Accessories
            </Link>
            {userRole === "ADMIN" && (
              <Link
                href="/admin"
                onClick={() => setIsMobileMenuOpen(false)}
                className="px-2 py-1.5 text-amber-700 hover:bg-amber-50 rounded-md font-semibold"
              >
                Admin Panel
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}