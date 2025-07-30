'use client';

import { useState } from 'react';
import { Shield, AlertCircle, CheckCircle, Copy } from 'lucide-react';
import bcrypt from 'bcryptjs';

export default function AdminResetPasswordPage() {
  const [password, setPassword] = useState('');
  const [hash, setHash] = useState('');
  const [copied, setCopied] = useState(false);

  const generateHash = async () => {
    if (!password || password.length < 8) {
      alert('Password must be at least 8 characters long');
      return;
    }

    try {
      const generatedHash = await bcrypt.hash(password, 10);
      setHash(generatedHash);
    } catch (error) {
      console.error('Error generating hash:', error);
      alert('Failed to generate hash');
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(hash);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-gray-900 rounded-lg p-8">
          <div className="flex items-center gap-3 mb-6">
            <Shield className="w-8 h-8 text-red-600" />
            <h1 className="text-2xl font-bold">Admin Password Reset</h1>
          </div>

          <div className="mb-6 p-4 bg-yellow-900/20 border border-yellow-700 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-yellow-400">
                <p className="mb-2">
                  <strong>Important:</strong> This page helps you generate a password hash for your Vercel environment variables.
                </p>
                <p>
                  Use this when you're locked out or need to set up the initial admin password.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                New Admin Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-red-500"
                placeholder="Enter your new password"
                minLength={8}
              />
              <p className="mt-1 text-xs text-gray-500">
                Must be at least 8 characters long
              </p>
            </div>

            <button
              onClick={generateHash}
              className="w-full py-3 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition"
            >
              Generate Password Hash
            </button>

            {hash && (
              <div className="mt-6 space-y-4">
                <div className="p-4 bg-green-900/20 border border-green-700 rounded-lg">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-green-400">
                      Password hash generated successfully!
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Generated Hash
                  </label>
                  <div className="relative">
                    <div className="bg-gray-800 p-3 rounded font-mono text-xs break-all">
                      {hash}
                    </div>
                    <button
                      onClick={copyToClipboard}
                      className="absolute top-2 right-2 p-2 bg-gray-700 hover:bg-gray-600 rounded transition"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                  {copied && (
                    <p className="text-xs text-green-500 mt-1">Copied to clipboard!</p>
                  )}
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-semibold text-gray-300">Instructions:</p>
                  <ol className="list-decimal list-inside space-y-1 text-sm text-gray-400">
                    <li>Copy the hash above</li>
                    <li>Go to Vercel Dashboard → Settings → Environment Variables</li>
                    <li>Update or add ADMIN_PASSWORD with this hash</li>
                    <li>Redeploy your application</li>
                    <li>Login at /admin/login with your new password</li>
                  </ol>
                </div>

                <div className="p-4 bg-blue-900/20 border border-blue-700 rounded-lg">
                  <p className="text-sm text-blue-400">
                    <strong>Note:</strong> After setting the environment variable, you'll login with the password you entered above, 
                    NOT the hash. The hash is only for storage in Vercel.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}