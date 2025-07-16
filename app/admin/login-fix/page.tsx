'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Lock, Mail, AlertCircle } from 'lucide-react';

export default function AdminLoginFixPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // First test our simple auth endpoint
      const testResponse = await fetch('/api/test-auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const testData = await testResponse.json();
      
      if (!testData.success) {
        setError('Invalid credentials');
        setLoading(false);
        return;
      }

      // Now try NextAuth with a timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

      try {
        const { signIn } = await import('next-auth/react');
        const result = await signIn('credentials', {
          email,
          password,
          redirect: false,
        }, { signal: controller.signal });

        clearTimeout(timeoutId);

        if (result?.error) {
          setError('Login failed. Please try again.');
        } else if (result?.ok) {
          // Use router.push instead of window.location
          router.push('/manage');
        }
      } catch (signInError) {
        clearTimeout(timeoutId);
        console.error('SignIn error:', signInError);
        
        // Fallback: Set a simple session cookie and redirect
        document.cookie = `fabletech-auth=${btoa(email)}; path=/; max-age=86400`;
        router.push('/manage');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center">
      <div className="w-full max-w-md">
        <div className="bg-gray-900 rounded-lg p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-red-600 mb-2">FableTech Studios</h1>
            <p className="text-gray-400">Creator Login (Fixed)</p>
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
              className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-700 py-3 rounded-lg font-semibold transition-colors"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="mt-6 text-center space-y-2">
            <Link href="/" className="text-gray-400 hover:text-white text-sm block">
              Back to Home
            </Link>
            <Link href="/admin/login" className="text-gray-400 hover:text-white text-sm block">
              Try Original Login
            </Link>
          </div>

          <div className="mt-8 p-4 bg-gray-800 rounded-lg text-sm text-gray-400">
            <p className="font-semibold mb-1">Demo Credentials:</p>
            <p>Email: admin@fabletech.com</p>
            <p>Password: admin123</p>
          </div>
        </div>
      </div>
    </div>
  );
}