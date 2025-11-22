
'use client';

import { useEffect } from 'react';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { useToast } from '@/hooks/use-toast';

// This is a client component that will listen for permission errors
// and display them as toasts. It also throws the error in development
// to make it visible in the Next.js error overlay.
export function FirebaseErrorListener() {
  const { toast } = useToast();

  useEffect(() => {
    const handleError = (error: FirestorePermissionError) => {
      console.error('Caught a Firestore permission error:', error.message);
      
      if (process.env.NODE_ENV === 'development') {
        // In development, we want to see the full error overlay for debugging.
        throw error;
      } else {
        // In production, just show a generic toast.
        toast({
          variant: 'destructive',
          title: 'Permission Denied',
          description: 'You do not have permission to perform this action.',
        });
      }
    };

    errorEmitter.on('permission-error', handleError);

    return () => {
      errorEmitter.removeListener('permission-error', handleError);
    };
  }, [toast]);

  return null; // This component does not render anything
}
