'use client';

import { useAuth } from '@/components/auth/AuthProvider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { auth } from '@/lib/firebase';
import { signOut } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { LogOut, Mail, Calendar, User } from 'lucide-react';

export default function ProfilePage() {
  const { userData } = useAuth();
  const router = useRouter();

  if (!userData) return null;

  const handleLogout = async () => {
    await signOut(auth);
    router.push('/login');
  };

  return (
    <div className="space-y-8 max-w-2xl animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="space-y-2">
        <h1 className="text-3xl sm:text-4xl font-bold">Profile</h1>
        <p className="text-muted-foreground text-sm">Manage your account settings</p>
      </div>

      {/* Account Information Card */}
      <div className="card-elevated overflow-hidden">
        <div className="p-6 border-b border-border">
          <h2 className="text-xl font-bold">Account Information</h2>
          <p className="text-sm text-muted-foreground mt-1">Your registered account details</p>
        </div>

        <div className="p-6 space-y-6">
          {/* Email Field */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-accent" />
              <label className="text-sm font-semibold text-foreground">Email</label>
            </div>
            <Input
              disabled
              value={userData.email}
              className="bg-secondary border-border text-foreground font-medium"
            />
          </div>

          {/* Joined Date */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-accent" />
              <label className="text-sm font-semibold text-foreground">Joined</label>
            </div>
            <Input
              disabled
              value={new Date(userData.createdAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
              className="bg-secondary border-border text-foreground font-medium"
            />
          </div>

          {/* User ID */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <User className="h-5 w-5 text-accent" />
              <label className="text-sm font-semibold text-foreground">User ID</label>
            </div>
            <Input
              disabled
              value={userData.uid.slice(0, 8) + '...'}
              className="bg-secondary border-border text-foreground font-medium font-mono text-xs"
            />
          </div>
        </div>

        {/* Footer with Logout Button */}
        <div className="p-6 border-t border-border flex justify-end">
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-destructive text-destructive foreground font-semibold text-sm hover:bg-destructive/90 active:scale-95 transition-all duration-200"
          >
            <LogOut className="h-4 w-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </div>
  );
}
