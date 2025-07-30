'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Shield, Key, AlertCircle, CheckCircle } from 'lucide-react';

export default function AdminSettingsPage() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState<{
    message: string;
    hashedPassword?: string;
    instructions?: string[];
  } | null>(null);
  const router = useRouter();

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(null);

    // Validation
    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters long');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/admin/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.hint) {
          throw new Error(`${data.error}\n\n${data.hint}`);
        }
        throw new Error(data.error || 'Failed to change password');
      }

      setSuccess(data);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Admin Settings</h1>
        <p className="text-gray-400">Manage your admin account security</p>
      </div>

      <div className="max-w-2xl">
        {/* Security Status */}
        <div className="bg-gray-800 rounded-lg p-6 mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Shield className="w-6 h-6 text-green-500" />
            <h2 className="text-xl font-semibold text-white">Security Status</h2>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span className="text-gray-300">Two-factor authentication: Recommended</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span className="text-gray-300">Rate limiting: Active</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span className="text-gray-300">Session security: Enhanced</span>
            </div>
          </div>
        </div>

        {/* Password Change Form */}
        <div className="bg-gray-800 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-6">
            <Key className="w-6 h-6 text-red-500" />
            <h2 className="text-xl font-semibold text-white">Change Admin Password</h2>
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-900/20 border border-red-700 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-red-400">{error}</p>
            </div>
          )}

          {success && (
            <div className="mb-4 p-4 bg-green-900/20 border border-green-700 rounded-lg">
              <div className="flex items-start gap-3 mb-3">
                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <p className="text-green-400">{success.message}</p>
              </div>
              {success.hashedPassword && (
                <div className="mt-4 space-y-3">
                  <div className="bg-gray-900 p-3 rounded font-mono text-xs break-all">
                    {success.hashedPassword}
                  </div>
                  {success.instructions && (
                    <div className="space-y-2">
                      <p className="text-sm text-gray-300 font-semibold">Instructions:</p>
                      <ol className="list-decimal list-inside space-y-1">
                        {success.instructions.map((instruction, index) => (
                          <li key={index} className="text-sm text-gray-400">
                            {instruction}
                          </li>
                        ))}
                      </ol>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Current Password
              </label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-red-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                New Password
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-red-500"
                required
                minLength={8}
              />
              <p className="mt-1 text-xs text-gray-500">
                Must be at least 8 characters long
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Confirm New Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-red-500"
                required
              />
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Changing Password...' : 'Change Password'}
              </button>
            </div>
          </form>

          <div className="mt-6 space-y-3">
            <div className="p-4 bg-yellow-900/20 border border-yellow-700 rounded-lg">
              <p className="text-sm text-yellow-400">
                <strong>Important:</strong> After changing your password, you must update the ADMIN_PASSWORD 
                environment variable in Vercel with the provided hash and redeploy your application.
              </p>
            </div>
            
            <div className="p-4 bg-blue-900/20 border border-blue-700 rounded-lg">
              <p className="text-sm text-blue-400">
                <strong>Initial Setup:</strong> If ADMIN_PASSWORD is not set in your environment variables, 
                use "SET_INITIAL_PASSWORD" as the current password to set your initial admin password.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}