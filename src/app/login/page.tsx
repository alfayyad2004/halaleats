'use client';
import { useUser } from '@/firebase';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { HalalEatsLogo } from '@/components/halal-eats-logo';
import { Loader } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function LoginPage() {
  const { appUser, auth, loading } = useUser();
  const router = useRouter();
  const { toast } = useToast();

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
    if (!auth) {
        toast({
            variant: 'destructive',
            title: 'Firebase Not Initialized',
            description: 'The authentication service is not ready. Please refresh the page.',
        });
        return;
    }
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error: any) {
      // Don't show a toast for this common scenario
      if (error.code === 'auth/popup-closed-by-user') {
          console.log('Sign-in popup closed by user.');
          return;
      }

      console.error('Error during sign-in:', error);
      if (error.code === 'auth/configuration-not-found') {
          toast({
              variant: 'destructive',
              title: 'Sign-In Method Not Enabled',
              description: (
                  <div>
                      <p>Google Sign-In is not enabled for this Firebase project.</p>
                      <a 
                          href={`https://console.firebase.google.com/project/${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}/authentication/providers`}
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="underline"
                      >
                          Click here to enable it in the Firebase Console.
                      </a>
                  </div>
              ),
              duration: 10000,
          });
      } else if (error.code === 'auth/unauthorized-domain') {
          toast({
              variant: 'destructive',
              title: 'Domain Not Authorized',
              description: (
                  <div>
                      <p>This domain is not authorized for sign-in. Please add 'localhost' to the authorized domains in your Firebase console.</p>
                      <a
                          href={`https://console.firebase.google.com/project/${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}/authentication/settings`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="underline"
                      >
                          Click here to go to Authentication Settings.
                      </a>
                  </div>
              ),
              duration: 10000,
          });
      }
      else {
          toast({
              variant: 'destructive',
              title: 'Sign-In Error',
              description: error.message || 'An unknown error occurred during sign-in.',
          });
      }
    }
  };

  if (loading || appUser) {
    return (
        <div className="min-h-screen flex items-center justify-center">
            <Loader className="animate-spin" />
        </div>
    );
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
