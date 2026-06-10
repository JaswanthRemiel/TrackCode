'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from './auth/AuthProvider';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { cn } from '@/lib/utils';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import {
  Activity,
  LayoutDashboard,
  Building2,
  BarChart3,
  User,
  LogOut,
  ArrowUpRight,
  Sun,
  Moon,
} from 'lucide-react';

const AUTH_NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/companies', label: 'Companies', icon: Building2 },
  { href: '/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/profile', label: 'Profile', icon: User },
];

const GUEST_NAV_ITEMS = [
  { href: '/login', label: 'Sign In', icon: User },
  { href: '/signup', label: 'Join', icon: ArrowUpRight },
];

export function Dock() {
  const { userData, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (loading) return null;

  const handleLogout = async () => {
    await signOut(auth);
    router.push('/login');
  };

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  const navItems = userData ? AUTH_NAV_ITEMS : GUEST_NAV_ITEMS;

  return (
    <div className="fixed bottom-5 md:bottom-6 left-0 right-0 z-50 flex justify-center px-4 pointer-events-none dock-enter">
      <nav className="pointer-events-auto dock-glass rounded-2xl p-1.5 flex items-center shadow-2xl shadow-black/50 gap-1 scale-[0.92] sm:scale-100 transition-transform duration-300">
        
        {/* Logo */}
        <Link href="/" className="flex items-center justify-center w-10 h-10 group mr-1.5">
          <div className="bg-white text-black p-1.5 rounded-xl group-hover:rotate-12 transition-transform duration-500">
            <Activity className="h-4 w-4" />
          </div>
        </Link>

        {/* Separator */}
        <div className="h-6 w-px bg-white/10 mx-0.5" />

        {/* Nav Links */}
        <div className="flex items-center bg-white/[0.04] rounded-xl p-1 gap-0.5">
          {navItems.map((item) => (
            <DockItem
              key={item.href}
              href={item.href}
              label={item.label}
              icon={item.icon}
              pathname={pathname}
            />
          ))}
        </div>

        {/* Separator */}
        <div className="h-6 w-px bg-white/10 mx-0.5" />

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="w-9 h-9 rounded-xl flex items-center justify-center text-white/40 hover:text-amber-300 hover:bg-white/[0.06] transition-all duration-300 cursor-pointer"
          aria-label="Toggle theme"
        >
          {mounted ? (
            theme === 'dark' ? (
              <Sun className="w-4 h-4 transition-transform duration-500 rotate-0 hover:rotate-90" />
            ) : (
              <Moon className="w-4 h-4 transition-transform duration-500" />
            )
          ) : (
            <Moon className="w-4 h-4" />
          )}
        </button>

        {/* User Actions */}
        {userData && (
          <>
            <div className="flex items-center gap-0.5 pr-0.5">
              {/* Avatar */}
              <div className="w-9 h-9 rounded-xl bg-white/10 border border-white/[0.06] flex items-center justify-center text-[11px] font-black text-white/70 uppercase select-none">
                {userData.email ? userData.email[0] : 'U'}
              </div>
              {/* Logout */}
              <button
                onClick={handleLogout}
                className="w-9 h-9 rounded-xl flex items-center justify-center text-rose-400/50 hover:text-rose-400 hover:bg-rose-500/10 transition-all duration-300 cursor-pointer"
                aria-label="Sign out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </>
        )}
      </nav>
    </div>
  );
}

function DockItem({
  href,
  label,
  icon: Icon,
  pathname,
}: {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  pathname: string | null;
}) {
  const isActive =
    pathname === href ||
    (href !== '/dashboard' && href !== '/login' && pathname?.startsWith(href + '/'));

  return (
    <Link
      href={href}
      className={cn(
        'group relative flex items-center h-9 px-3 transition-all duration-500 rounded-lg overflow-hidden',
        isActive
          ? 'bg-white text-black'
          : 'text-white/40 hover:text-white hover:bg-white/[0.06]'
      )}
    >
      <Icon
        className={cn(
          'w-4 h-4 shrink-0 transition-transform duration-500',
          isActive ? 'scale-110' : 'group-hover:scale-110'
        )}
      />
      <div
        className={cn(
          'grid transition-all duration-500 ease-in-out',
          isActive
            ? 'grid-cols-[1fr] ml-2 opacity-100'
            : 'grid-cols-[0fr] opacity-0 group-hover:grid-cols-[1fr] group-hover:ml-2 group-hover:opacity-100'
        )}
      >
        <span className="overflow-hidden whitespace-nowrap text-[11px] font-black uppercase tracking-widest leading-none">
          {label}
        </span>
      </div>
    </Link>
  );
}
