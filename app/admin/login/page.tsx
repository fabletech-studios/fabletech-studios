'use client';

import { useState, useEffect } from 'react';
import { signIn, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Lock, Mail, AlertCircle } from 'lucide-react';

export default function AdminLoginPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    console.log("Session status:", status);
    console.log("Session data:", session);
    
    if (status === "authenticated") {
      console.log("Already authenticated, redirecting...");
      window.location.href = "/manage";
    }
  }, [status, session]);

  const handleSubmit = async (e: React.FormEvent) => {
    console.log('=== FORM SUBMIT START ===');
    console.log('1. handleSubmit called');
    
    try {
      e.preventDefault();
      console.log('2. preventDefault called');
    } catch (err) {
      console.error('Error calling preventDefault:', err);
    }
    
    console.log('3. Current state:', { email, password: '***' });
    setError('');
    console.log('4. Error cleared');
    
    setLoading(true);
    console.log('5. Loading set to true');

    try {
      console.log('6. About to import/call signIn');
      console.log('7. signIn function exists?', typeof signIn);
      
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });
      
      console.log('8. Sign in completed, result:', result);

      if (result?.error && result.error !== "undefined") {
        console.log("Sign in failed with error:", result.error);
        setError("Invalid email or password");
      } else if (result?.ok) {
        console.log("Sign in successful, redirecting to /manage");
        console.log("Using window.location for redirect");
        window.location.href = "/manage";
      } else {
        console.log("Unexpected sign in result:", result);
        setError("An unexpected error occurred");
      }
    } catch (err: any) {
      console.error("Login error:", err);
      console.error("Error details:", err.stack);
      setError("An error occurred. Please try again.");
    } finally {
      console.log("9. Finally block - setting loading to false");
      setLoading(false);
      console.log("=== FORM SUBMIT END ===");
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center">
      <div className="w-full max-w-md">
        <div className="bg-gray-900 rounded-lg p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-red-600 mb-2">FableTech Studios</h1>
            <p className="text-gray-400">Creator Login</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-900/20 border border-red-600 rounded-lg p-3 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-red-600" />
                <span className="text-sm">{error}</span>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-2">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600"
                  placeholder="admin@fabletech.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600"
                  placeholder="Enter your password"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-700 py-3 rounded-lg font-semibold"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <Link href="/" className="text-gray-400 hover:text-white text-sm">
              Back to Home
            </Link>
          </div>

          <div className="mt-8 p-4 bg-gray-800 rounded-lg text-sm text-gray-400">
            <p className="font-semibold mb-1">Demo Credentials:</p>
            <p>Email: admin@fabletech.com</p>
            <p>Password: admin123</p>
            <div className="mt-2 space-x-2">
              <button 
                type="button"
                onClick={() => {
                  console.log('Test button clicked');
                  alert('JavaScript is working!');
                }}
                className="text-xs underline"
              >
                Test JS
              </button>
              <button 
                type="button"
                onClick={() => {
                  console.log('Manual submit test');
                  const form = document.querySelector('form');
                  if (form) {
                    console.log('Found form, triggering submit');
                    form.requestSubmit();
                  }
                }}
                className="text-xs underline"
              >
                Test Submit
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}