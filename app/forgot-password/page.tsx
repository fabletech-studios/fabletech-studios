'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Mail, AlertCircle, CheckCircle } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resetToken, setResetToken] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (!email) {
      setError('Email is required');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/customer/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      const data = await res.json();

      if (data.success) {
        setSuccess(true);
        // In demo, we show the token - remove in production
        if (data.resetToken) {
          setResetToken(data.resetToken);
        }
      } else {
        setError(data.error || 'Failed to send reset email');
      }
    } catch (error) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo/Brand */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-block">
            <h1 className="text-3xl font-bold text-red-600">FableTech Studios</h1>
          </Link>
          <p className="text-gray-400 mt-2">Reset your password</p>
        </div>

        {!success ? (
          <form onSubmit={handleSubmit} className="bg-gray-900 rounded-lg p-8 shadow-xl">
            <h2 className="text-2xl font-bold mb-6">Reset Password</h2>
            
            {error && (
              <div className="mb-4 p-3 bg-red-900/20 border border-red-600 rounded-lg flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                <p className="text-sm text-red-300">{error}</p>
              </div>
            )}

            <div className="mb-6">
              <label htmlFor="email" className="block text-sm font-medium mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="you@example.com"
                  autoComplete="email"
                />
              </div>
              <p className="mt-2 text-xs text-gray-500">
                We'll send you a link to reset your password
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-red-600 hover:bg-red-700 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-lg font-semibold transition-colors"
            >
              {loading ? 'Sending...' : 'Send Reset Link'}
            </button>
          </form>
        ) : (
          <div className="bg-gray-900 rounded-lg p-8 shadow-xl">
            <div className="bg-green-900/20 border border-green-600 rounded-lg p-4 flex items-center gap-3 mb-6">
              <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
              <div>
                <p className="text-green-300 font-medium">Check your email!</p>
                <p className="text-green-300/70 text-sm">We've sent password reset instructions to {email}</p>
              </div>
            </div>

            {/* Demo only - remove in production */}
            {resetToken && (
              <div className="bg-yellow-900/20 border border-yellow-600 rounded-lg p-4">
                <p className="text-sm text-yellow-300 mb-2 font-medium">🔐 Demo Mode - Reset Token:</p>
                <code className="text-xs break-all text-yellow-400 bg-black/50 p-2 rounded block mb-3">{resetToken}</code>
                <Link
                  href={`/reset-password?token=${resetToken}`}
                  className="block text-center py-2 bg-red-600 hover:bg-red-700 rounded-lg font-medium transition-colors"
                >
                  Continue to Reset Password
                </Link>
              </div>
            )}

            <div className="mt-6 text-center">
              <Link href="/login" className="text-gray-400 hover:text-white text-sm">
                Back to Login
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}