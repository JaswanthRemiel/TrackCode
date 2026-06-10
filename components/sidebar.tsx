'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from './auth/AuthProvider';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { cn } from '@/lib/utils';
import {
  Activity,
  LayoutDashboard,
  Building2,
  BarChart3,
  User,
  LogOut,
  Menu,
  X
} from 'lucide-react';

export function Sidebar() {
  const { userData, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  if (loading || !userData) return null;

  const handleLogout = async () => {
    await signOut(auth);
    router.push('/login');
  };

  const menuItems = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/companies', label: 'Companies', icon: Building2 },
    { href: '/analytics', label: 'Analytics', icon: BarChart3 },
    { href: '/profile', label: 'Profile', icon: User },
  ];

  return (
    <>
      {/* Mobile Top Header */}
      <header className="md:hidden flex items-center justify-between h-16 px-6 bg-[#121212] border-b border-white/10 text-white sticky top-0 z-50">
        <Link href="/" className="flex items-center gap-2 font-serif text-lg font-bold">
          <span>TrackCode</span>
        </Link>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 text-white/70 hover:text-white transition-colors focus:outline-none"
          aria-label="Toggle menu"
        >
          {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </header>

      {/* Backdrop for Mobile */}
      {isOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity duration-300"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={cn(
          "fixed top-0 bottom-0 left-0 z-40 w-64 bg-[#121212] text-white border-r border-white/10 flex flex-col justify-between transition-transform duration-300 md:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full",
          "h-full pt-20 md:pt-8"
        )}
      >
        <div className="flex flex-col gap-8 px-6">
          {/* Logo - Desktop only */}
          <div className="hidden md:flex items-center gap-2">
            <Link href="/" className="flex items-center gap-2 font-serif text-xl font-bold">
              <span>TrackCode</span>
            </Link>
          </div>

          {/* Navigation Links */}
          <nav className="flex flex-col gap-2 mt-4">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname?.startsWith(item.href + '/'));

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 group",
                    isActive
                      ? "bg-white text-black font-semibold shadow-lg shadow-black/20"
                      : "text-white/60 hover:text-white hover:bg-white/5"
                  )}
                >
                  <Icon className={cn("h-4 w-4 shrink-0 transition-transform", isActive ? "scale-110" : "group-hover:scale-110")} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User profile & Logout */}
        <div className="p-6 border-t border-white/10 flex flex-col gap-4">
          <div className="flex items-center gap-3 px-2">
            <div className="h-9 w-9 rounded-full bg-white/10 flex items-center justify-center font-bold text-sm text-white/80 border border-white/10 uppercase">
              {userData.email ? userData.email[0].toUpperCase() : 'U'}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-[9px] text-white/40 uppercase font-black tracking-widest leading-none mb-1">
                Signed In
              </span>
              <span className="text-xs font-medium truncate text-white/95 leading-tight">
                {userData.email}
              </span>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-medium text-rose-400 hover:bg-rose-500/10 transition-all duration-300 text-left cursor-pointer"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
}
