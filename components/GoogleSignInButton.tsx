'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { signInWithGoogle, handleGoogleRedirect } from '@/lib/firebase/google-auth';
import AuthLoadingScreen from '@/components/AuthLoadingScreen';

export default function GoogleSignInButton({ 
  text = "Continue with Google",
  className = "" 
}: { 
  text?: string;
  className?: string;
}) {
  const [loading, setLoading] = useState(false);
  const [checkingRedirect, setCheckingRedirect] = useState(true);
  const router = useRouter();
  
  // Check for redirect result on component mount
  useEffect(() => {
    const checkRedirect = async () => {
      try {
        const result = await handleGoogleRedirect();
        if (result && result.success) {
          setLoading(true);
          console.log('Google redirect successful');
          
          // Add small delay to ensure Firebase auth state is set
          setTimeout(() => {
            router.push('/browse');
          }, 1000);
        }
      } catch (error) {
        console.error('Redirect check error:', error);
      } finally {
        setCheckingRedirect(false);
      }
    };
    
    checkRedirect();
  }, [router]);
  
  const handleGoogleSignIn = async () => {
    setLoading(true);
    let result: any = null;
    
    try {
      result = await signInWithGoogle();
      
      if (result.success) {
        // Check if it's a new user for welcome message
        if (result.isNewUser) {
          console.log('Welcome new user! You received 100 free credits!');
        }
        
        // Add delay to ensure auth state is propagated
        setTimeout(() => {
          router.push('/browse');
        }, 1000);
        
        return; // Keep loading state
      } else {
        console.error('Google sign-in failed:', result.error);
        
        // Better error messages
        let errorMessage = result.error || 'Failed to sign in with Google';
        if (errorMessage.includes('popup-closed')) {
          errorMessage = 'Sign-in cancelled';
        } else if (errorMessage.includes('network')) {
          errorMessage = 'Network error. Please check your connection.';
        }
        
        alert(errorMessage);
      }
    } catch (error) {
      console.error('Unexpected error:', error);
      alert('An unexpected error occurred. Please try again.');
    } finally {
      if (!result?.success) {
        setLoading(false);
      }
    }
  };
  
  // Show loading screen during auth
  if (loading) {
    return <AuthLoadingScreen 
      message="Signing in with Google" 
      subMessage="Redirecting to your dashboard..."
    />;
  }
  
  // Show loading state while checking for redirect
  if (checkingRedirect) {
    return (
      <button disabled className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-gray-100 text-gray-400 rounded-lg font-medium cursor-not-allowed">
        <div className="w-5 h-5 border-2 border-gray-300 border-t-transparent rounded-full animate-spin" />
        <span>Loading...</span>
      </button>
    );
  }
  
  return (
    <button
      onClick={handleGoogleSignIn}
      disabled={loading}
      className={`
        w-full flex items-center justify-center gap-3 
        px-4 py-3 bg-white text-gray-900 rounded-lg
        hover:bg-gray-100 transition-colors
        font-medium disabled:opacity-50 disabled:cursor-not-allowed
        ${className}
      `}
    >
      {loading ? (
        <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
      ) : (
        <svg className="w-5 h-5" viewBox="0 0 24 24">
          <path
            fill="#4285F4"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="#34A853"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="#FBBC05"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
          />
          <path
            fill="#EA4335"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
          />
        </svg>
      )}
      <span>{loading ? 'Signing in...' : text}</span>
    </button>
  );
}