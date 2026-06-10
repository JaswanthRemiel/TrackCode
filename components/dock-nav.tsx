'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from './auth/AuthProvider';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Building2,
  BarChart3,
  User,
  LogOut,
  Activity,
} from 'lucide-react';

export function DockNav() {
  const { userData, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

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
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex justify-center items-end pb-6 px-4 pointer-events-none">
      <div className="pointer-events-auto flex flex-col items-center gap-3">
        {/* Logo */}
        <Link
          href="/dashboard"
          className="flex items-center justify-center h-12 w-12 rounded-full bg-accent text-white font-bold text-lg hover:shadow-lg hover:shadow-accent/40 transition-all duration-300 hover:-translate-y-1 group"
          title="TrackCode"
        >
          <Activity className="h-6 w-6 group-hover:scale-110 transition-transform duration-300" />
        </Link>

        {/* Dock Container */}
        <div className="glass-dark p-2 rounded-3xl flex items-center gap-2 shadow-xl">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.href ||
              (item.href !== '/dashboard' &&
                pathname?.startsWith(item.href + '/'));
            const isHovered = hoveredItem === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                onMouseEnter={() => setHoveredItem(item.href)}
                onMouseLeave={() => setHoveredItem(null)}
                className={cn(
                  'relative px-4 py-3 rounded-2xl flex items-center gap-2.5 transition-all duration-300 group whitespace-nowrap',
                  isActive
                    ? 'bg-white text-black shadow-lg'
                    : 'text-white/60 hover:text-white hover:bg-white/5'
                )}
              >
                <Icon
                  className={cn(
                    'h-5 w-5 shrink-0 transition-transform duration-300',
                    isActive && 'scale-110',
                    !isActive && 'group-hover:scale-110'
                  )}
                />
                <span
                  className={cn(
                    'text-sm font-semibold transition-all duration-300 origin-left',
                    isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                  )}
                >
                  {item.label}
                </span>
              </Link>
            );
          })}

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="ml-2 pl-2 border-l border-white/10 px-4 py-3 rounded-2xl text-rose-400/60 hover:text-rose-400 hover:bg-rose-500/5 transition-all duration-300 group"
            title="Sign Out"
          >
            <LogOut className="h-5 w-5 shrink-0 group-hover:scale-110 transition-transform duration-300" />
          </button>
        </div>

        {/* User Info */}
        <div className="hidden sm:flex items-center gap-2 text-xs text-white/40">
          <div className="h-6 w-6 rounded-full bg-white/10 flex items-center justify-center font-semibold text-white/60 border border-white/10">
            {userData.email ? userData.email[0].toUpperCase() : 'U'}
          </div>
          <span className="max-w-[150px] truncate">{userData.email}</span>
        </div>
      </div>
    </nav>
  );
}
