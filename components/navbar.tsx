'use client';

import Link from 'next/link';
import { useAuth } from './auth/AuthProvider';
import { Button } from './ui/button';
import { Activity, ArrowUpRight, LayoutDashboard, Building2, BarChart3, LogOut, User } from 'lucide-react';
import { auth } from '@/lib/firebase';
import { signOut } from 'firebase/auth';
import { useRouter, usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

export function Navbar() {
  const { userData, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  if (loading) return null;

  const handleLogout = async () => {
    await signOut(auth);
    router.push('/login');
  };

  const isHome = pathname === '/';

  return (
    <div className={`fixed ${isHome ? 'top-4 md:top-6' : 'bottom-4 md:bottom-6'} left-0 right-0 z-50 flex justify-center px-4 pointer-events-none transition-all duration-700 ease-in-out`}>
      <nav className="pointer-events-auto bg-[#121212]/95 backdrop-blur-2xl border border-white/10 rounded-xl md:rounded-lg p-1 md:p-1.5 flex items-center shadow-2xl shadow-black/80 gap-1 scale-95 sm:scale-100">
        
        {}
        <Link href="/" className="flex items-center justify-center w-10 h-10 group mr-2">
           <div className="bg-white text-black p-1.5 rounded-lg group-hover:rotate-12 transition-transform duration-500">
              <Activity className="h-4 w-4" />
           </div>
        </Link>

        {}
        <div className="flex items-center bg-white/5 rounded-lg p-1 gap-1">
          {userData ? (
            <>
              <NavLink href="/dashboard" label="Dashboard" icon={LayoutDashboard} />
              <NavLink href="/companies" label="Companies" icon={Building2} />
              <NavLink href="/analytics" label="Analytics" icon={BarChart3} />
            </>
          ) : (
             <>
               <NavLink href="/login" label="Sign In" icon={User} />
               <NavLink href="/signup" label="Join" icon={ArrowUpRight} />
             </>
          )}
        </div>

        {}
        {userData && (
          <div className="flex items-center gap-1 ml-2 pr-1">
            <Link href="/profile" className="hidden sm:block">
              <div className="w-10 h-10 flex items-center justify-center text-white/40 hover:text-white transition-colors">
                <User className="w-4 h-4" />
              </div>
            </Link>
            <button 
              onClick={handleLogout}
              className="w-10 h-10 flex items-center justify-center text-rose-400/40 hover:text-rose-400 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
      </nav>
    </div>
  );
}

function NavLink({ href, label, icon: Icon }: { href: string; label: string; icon: any }) {
  const pathname = usePathname();
  const isActive = pathname === href;

  return (
    <Link 
      href={href} 
      className={cn(
        "group flex items-center h-9 px-3 transition-all duration-500 rounded-md overflow-hidden",
        isActive 
          ? "bg-white text-black" 
          : "text-white/40 hover:text-white hover:bg-white/5"
      )}
    >
      <Icon className={cn("w-4 h-4 shrink-0 transition-transform duration-500", isActive ? "scale-110" : "group-hover:scale-110")} />
      <div className={cn(
        "grid transition-all duration-500 ease-in-out",
        isActive ? "grid-cols-[1fr] ml-2 opacity-100" : "grid-cols-[0fr] opacity-0 group-hover:grid-cols-[1fr] group-hover:ml-2 group-hover:opacity-100"
      )}>
        <span className="overflow-hidden whitespace-nowrap text-[11px] font-black uppercase tracking-widest font-serif leading-none">
          {label}
        </span>
      </div>
    </Link>
  );
}


