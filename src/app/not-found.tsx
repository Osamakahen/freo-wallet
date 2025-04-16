import React from 'react';
import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#1E1E1E] text-white flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-6xl font-bold mb-4">404</h1>
        <h2 className="text-2xl mb-8">Page Not Found</h2>
        <Link 
          href="/"
          className="px-6 py-3 bg-gradient-to-r from-[#A7D1EB] to-[#FFC107] rounded-lg font-semibold transition-all duration-300 hover:opacity-90"
        >
          Return Home
        </Link>
      </div>
    </div>
  )
} 