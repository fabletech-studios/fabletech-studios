'use client';

import Link from "next/link";
import { TrendingUp, Film, Music, Radio } from "lucide-react";
import CustomerHeader from "@/components/CustomerHeader";
import HomepageBanner from "@/components/HomepageBanner";

export default function Home() {
  return (
    <div className="min-h-screen bg-black text-white">
      <header className="border-b border-gray-800">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl lg:text-2xl font-bold text-red-600">
                <span className="hidden sm:inline">FableTech Studios</span>
                <span className="sm:hidden">FableTech</span>
              </h1>
            </div>
            <div className="flex items-center space-x-4 lg:space-x-8">
              <Link href="/browse" className="hover:text-gray-300 text-sm lg:text-base">Browse</Link>
              <CustomerHeader />
            </div>
          </div>
        </nav>
      </header>

      <main>
        <HomepageBanner />

        <section className="py-12 lg:py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <h3 className="text-xl lg:text-2xl font-bold mb-6 lg:mb-8 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 lg:w-6 lg:h-6 text-red-600" /> Featured Content
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
            <div className="bg-gray-900 rounded-lg p-4 lg:p-6 hover:bg-gray-800 transition-colors">
              <Film className="w-10 h-10 lg:w-12 lg:h-12 text-red-600 mb-3 lg:mb-4" />
              <h4 className="text-lg lg:text-xl font-semibold mb-2">Audiobooks</h4>
              <p className="text-gray-400 text-sm lg:text-base">Immerse yourself in captivating stories and adventures</p>
            </div>
            <div className="bg-gray-900 rounded-lg p-4 lg:p-6 hover:bg-gray-800 transition-colors">
              <Music className="w-10 h-10 lg:w-12 lg:h-12 text-red-600 mb-3 lg:mb-4" />
              <h4 className="text-lg lg:text-xl font-semibold mb-2">Series</h4>
              <p className="text-gray-400 text-sm lg:text-base">Follow ongoing narratives with episodic content</p>
            </div>
            <div className="bg-gray-900 rounded-lg p-4 lg:p-6 hover:bg-gray-800 transition-colors">
              <Radio className="w-10 h-10 lg:w-12 lg:h-12 text-red-600 mb-3 lg:mb-4" />
              <h4 className="text-lg lg:text-xl font-semibold mb-2">Premium</h4>
              <p className="text-gray-400 text-sm lg:text-base">Unlock exclusive content with our credit system</p>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-gray-800 mt-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <p className="text-center text-gray-400">
            © 2024 FableTech Studios. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
