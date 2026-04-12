'use client';

import { useAuth } from '@/components/auth/AuthProvider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { auth } from '@/lib/firebase';
import { signOut } from 'firebase/auth';
import { useRouter } from 'next/navigation';

export default function ProfilePage() {
  const { userData } = useAuth();
  const router = useRouter();

  if (!userData) return null;

  const handleLogout = async () => {
    await signOut(auth);
    router.push('/login');
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto py-12">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Profile</h1>
        <p className="text-slate-500">Manage your account settings.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Account Information</CardTitle>
          <CardDescription>Your registered account details.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Email</Label>
            <Input disabled value={userData.email} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Joined At</Label>
              <Input disabled value={new Date(userData.createdAt).toLocaleDateString()} />
            </div>
            <div className="space-y-2">
              <Label>User ID</Label>
              <Input disabled value={userData.uid.slice(0, 8) + '...'} />
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-end gap-2">
          <Button variant="destructive" onClick={handleLogout}>Log Out</Button>
        </CardFooter>
      </Card>
    </div>
  );
}
