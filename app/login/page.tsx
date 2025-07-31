'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Mail, Lock, AlertCircle, CheckCircle } from 'lucide-react';
import { useFirebaseCustomerAuth } from '@/contexts/FirebaseCustomerContext';
import { useNotifications } from '@/hooks/useNotifications';
import PremiumLogo from '@/components/PremiumLogo';
import MobileNav from '@/components/MobileNav';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useFirebaseCustomerAuth();
  const notify = useNotifications();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.email || !formData.password) {
      setError('All fields are required');
      return;
    }

    setLoading(true);

    try {
      const result = await login(formData.email, formData.password);
      console.log('Login result:', result);
      
      if (result.success) {
        // If remember me is checked, store token for longer
        if (formData.rememberMe) {
          // This would be handled by the auth context ideally
          localStorage.setItem('rememberMe', 'true');
        }
        notify.loginSuccess();
        console.log('Login successful, redirecting to /browse...');
        // Add a small delay to ensure the notification shows before redirect
        setTimeout(() => {
          router.push('/browse');
        }, 500);
      } else {
        setError(result.error || 'Login failed');
        notify.error('Login Failed', result.error || 'Please check your credentials');
      }
    } catch (error) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Clear error when user starts typing
    if (error) {
      setError('');
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Mobile Navigation */}
      <MobileNav />
      
      <div className="flex items-center justify-center min-h-screen p-4 pt-20 md:pt-4">
        <div className="w-full max-w-md">
          {/* Logo/Brand */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <PremiumLogo size="lg" />
            </div>
            <p className="text-gray-400 mt-2">Welcome back</p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="bg-gray-900 rounded-lg p-8 shadow-xl">
            <h2 className="text-2xl font-bold mb-6">Sign In</h2>

            {/* Error Message */}
            {error && (
            <div className="mb-4 p-3 bg-red-900/20 border border-red-600 rounded-lg flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
              <p className="text-sm text-red-300">{error}</p>
            </div>
            )}

            {/* Email Field */}
            <div className="mb-4">
            <label htmlFor="email" className="block text-sm font-medium mb-2">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full pl-10 pr-3 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                placeholder="you@example.com"
                autoComplete="email"
              />
            </div>
            </div>

            {/* Password Field */}
            <div className="mb-4">
            <label htmlFor="password" className="block text-sm font-medium mb-2">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="w-full pl-10 pr-12 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                placeholder="••••••••"
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300"
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between mb-6">
            <label className="flex items-center">
              <input
                type="checkbox"
                name="rememberMe"
                checked={formData.rememberMe}
                onChange={handleChange}
                className="mr-2"
              />
              <span className="text-sm text-gray-300">Remember me</span>
            </label>
            <Link href="/forgot-password" className="text-sm text-red-400 hover:text-red-300">
              Forgot Password?
            </Link>
            </div>

            {/* Submit Button */}
            <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-red-600 hover:bg-red-700 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-lg font-semibold transition-colors"
          >
            {loading ? 'Signing In...' : 'Sign In'}
            </button>

          </form>

          {/* Sign Up Link */}
          <div className="mt-6 text-center">
          <p className="text-gray-400">
            Don't have an account?{' '}
            <Link href="/signup" className="text-red-400 hover:text-red-300 font-medium">
              Sign Up
            </Link>
            <span className="text-gray-400 ml-1">and get 100 free credits!</span>
          </p>
          </div>

          {/* Admin Link */}
          <div className="mt-8 text-center">
            <Link href="/admin/login-fix" className="text-sm text-gray-500 hover:text-gray-400">
              Admin Login →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}