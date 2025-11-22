'use client';
import { useUser } from '@/firebase';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { HalalEatsLogo } from '@/components/halal-eats-logo';
import { Loader } from 'lucide-react';

export default function LoginPage() {
  const { appUser, auth, loading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!loading && appUser) {
      if (appUser.role === 'admin') {
        router.push('/admin');
      } else {
        router.push('/');
      }
    }
  }, [appUser, loading, router]);

  const handleGoogleSignIn = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error('Error during sign-in:', error);
    }
  };

  if (loading) {
    return (
        <div className="min-h-screen flex items-center justify-center">
            <Loader className="animate-spin" />
        </div>
    );
  }
  
  if (appUser) {
    return null; // Don't render anything while redirecting
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <HalalEatsLogo className="w-40" />
          </div>
          <CardTitle>Admin Login</CardTitle>
          <CardDescription>Sign in to manage HalalEats.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button className="w-full" onClick={handleGoogleSignIn}>
            Sign In with Google
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
