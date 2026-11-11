'use client';

import Link from 'next/link';
import { LogoMark } from './brand/Logo';
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
  User,
  LogOut,
  ArrowUpRight,
  Sun,
  Moon,
  BookOpen,
  Settings,
  Sparkles,
} from 'lucide-react';

const AUTH_NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/companies', label: 'Companies', icon: Building2 },
  { href: '/problems', label: 'Problems', icon: BookOpen },
  { href: '/remiel', label: 'Remiel AI', icon: Sparkles },
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
    <div className="fixed bottom-5 left-0 right-0 justify-center px-4 z-50 flex pointer-events-none md:fixed md:top-0 md:bottom-0 md:left-0 md:h-screen md:w-16 md:right-auto md:px-0 md:flex-col md:justify-between">
      <nav className="pointer-events-auto flex flex-row md:flex-col justify-between items-center w-full h-full p-1.5 md:p-3 bg-white/95 dark:bg-zinc-950/95 border border-zinc-200 dark:border-zinc-850 md:bg-white md:dark:bg-black md:border-0 md:border-r md:border-zinc-200 md:dark:border-zinc-900 rounded-2xl md:rounded-none shadow-xl md:shadow-none transition-all duration-300">

        {/* Top Section */}
        <div className="flex md:flex-col items-center gap-1.5 md:gap-4 w-auto md:w-full">
          {/* Logo */}
          <div className="relative group">
            <Link href="/" className="w-10 h-10 rounded-xl bg-[var(--mark-tile)] border border-[var(--mark-tile-border)] flex items-center justify-center hover:scale-105 transition-transform" aria-label="TrackCode home">
              <LogoMark size={22} />
            </Link>
            <div className="absolute bottom-12 left-1/2 -translate-x-1/2 md:bottom-auto md:top-1/2 md:-translate-y-1/2 md:left-14 md:translate-x-0 ml-0 md:ml-2 px-2.5 py-1.5 rounded-lg bg-zinc-950 dark:bg-zinc-900 text-zinc-50 dark:text-zinc-200 text-[10px] font-bold uppercase tracking-wider opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-xl border border-zinc-800 dark:border-zinc-700 z-50">
              Home
            </div>
          </div>

          {/* Separator - only on desktop */}
          <div className="hidden md:block w-8 h-px bg-zinc-200 dark:bg-zinc-800/80 my-1" />

          {/* Nav Items */}
          <div className="flex md:flex-col items-center gap-1 w-auto md:w-full">
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
        </div>

        {/* Bottom Section */}
        <div className="flex md:flex-col items-center gap-1.5 md:gap-4 w-auto md:w-full">
          {/* Theme Toggle */}
          <div className="relative group">
            <button
              onClick={toggleTheme}
              className="w-10 h-10 rounded-xl flex items-center justify-center text-zinc-500 dark:text-zinc-400 hover:text-amber-500 dark:hover:text-amber-300 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-all duration-300 cursor-pointer"
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
            <div className="absolute bottom-12 left-1/2 -translate-x-1/2 md:bottom-auto md:top-1/2 md:-translate-y-1/2 md:left-14 md:translate-x-0 ml-0 md:ml-2 px-2.5 py-1.5 rounded-lg bg-zinc-950 dark:bg-zinc-900 text-zinc-50 dark:text-zinc-200 text-[10px] font-bold uppercase tracking-wider opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-xl border border-zinc-800 dark:border-zinc-700 z-50">
              Theme
            </div>
          </div>

          {/* Profile Avatar */}
          {userData ? (
            <>
              <Link
                href="/profile"
                className={cn(
                  "relative group w-10 h-10 rounded-xl border flex items-center justify-center text-[11px] font-black uppercase select-none transition-all duration-300 pointer-events-auto",
                  pathname === '/profile'
                    ? "bg-zinc-950 text-zinc-50 dark:bg-white dark:text-black border-transparent shadow-lg"
                    : "bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-805 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100"
                )}
              >
                {userData.email ? userData.email[0] : 'U'}
                <div className="absolute bottom-12 left-1/2 -translate-x-1/2 md:bottom-auto md:top-1/2 md:-translate-y-1/2 md:left-14 md:translate-x-0 ml-0 md:ml-2 px-2.5 py-1.5 rounded-lg bg-zinc-950 dark:bg-zinc-900 text-zinc-50 dark:text-zinc-200 text-[10px] font-bold uppercase tracking-wider opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-xl border border-zinc-800 dark:border-zinc-700 z-50">
                  Profile
                </div>
              </Link>

              {/* Logout */}
              <div className="relative group hidden md:block">
                <button
                  onClick={handleLogout}
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-zinc-500 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-all duration-300 cursor-pointer pointer-events-auto"
                  aria-label="Sign out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
                <div className="absolute bottom-12 left-1/2 -translate-x-1/2 md:bottom-auto md:top-1/2 md:-translate-y-1/2 md:left-14 md:translate-x-0 ml-0 md:ml-2 px-2.5 py-1.5 rounded-lg bg-zinc-950 dark:bg-zinc-900 text-zinc-50 dark:text-zinc-200 text-[10px] font-bold uppercase tracking-wider opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-xl border border-zinc-800 dark:border-zinc-700 z-50">
                  Sign Out
                </div>
              </div>
            </>
          ) : null}

          {/* Settings Gear Icon */}

        </div>
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
        'group relative flex items-center justify-center w-10 h-10 transition-all duration-300 rounded-xl pointer-events-auto',
        isActive
          ? 'bg-zinc-950 text-zinc-50 dark:bg-white dark:text-black shadow-md'
          : 'text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-50 dark:hover:bg-zinc-900'
      )}
    >
      <Icon
        className={cn(
          'w-4 h-4 shrink-0 transition-transform duration-300',
          isActive ? 'scale-105' : 'group-hover:scale-105'
        )}
      />
      <div className="absolute bottom-12 left-1/2 -translate-x-1/2 md:bottom-auto md:top-1/2 md:-translate-y-1/2 md:left-14 md:translate-x-0 ml-0 md:ml-2 px-2.5 py-1.5 rounded-lg bg-zinc-950 dark:bg-zinc-900 text-zinc-50 dark:text-zinc-200 text-[10px] font-bold uppercase tracking-wider opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-xl border border-zinc-800 dark:border-zinc-700 z-50">
        {label}
      </div>
    </Link>
  );
}


