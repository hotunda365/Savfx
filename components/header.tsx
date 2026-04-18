import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';

const Header: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <header className="bg-white sticky top-0 z-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          <div className="flex-shrink-0">
            <Link href="/" className="flex items-center">
              <Image src="/images/logo.png" alt="SAVFX" width={60} height={60} />
              <div className="ml-2">
                <div className="text-2xl font-bold">SAVFX</div>
              </div>
            </Link>
          </div>
          <nav className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-4">
              <Link href="/course-introduction" className="text-gray-500 hover:text-gray-900">課程介紹</Link>
              <Link href="/one-on-one" className="text-gray-500 hover:text-gray-900">個人課程</Link>
              <Link href="/instructor-introduction" className="text-gray-500 hover:text-gray-900">導師簡介</Link>
              <Link href="/event-rewind" className="text-gray-500 hover:text-gray-900">活動重溫</Link>
              <Link href="/contact-us" className="text-gray-500 hover:text-gray-900">聯絡我們</Link>
              <Link href="/login" className="text-gray-500 hover:text-gray-900">登入</Link>
            </div>
          </nav>
          <div className="md:hidden">
            <button onClick={toggleMenu} className="text-gray-500 hover:text-gray-600 focus:outline-none focus:text-gray-600">
              <svg className="h-6 w-6" stroke="currentColor" fill="none" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>
      {isMenuOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <Link href="/course-introduction" className="block text-gray-500 hover:text-gray-900">課程介紹</Link>
            <Link href="/one-on-one" className="block text-gray-500 hover:text-gray-900">個人課程</Link>
            <Link href="/instructor-introduction" className="block text-gray-500 hover:text-gray-900">導師簡介</Link>
            <Link href="/event-rewind" className="block text-gray-500 hover:text-gray-900">活動重溫</Link>
            <Link href="/contact-us" className="block text-gray-500 hover:text-gray-900">聯絡我們</Link>
            <Link href="/login" className="block text-gray-500 hover:text-gray-900">登入</Link>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
