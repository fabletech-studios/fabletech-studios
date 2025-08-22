'use client';

import { useState } from 'react';
import { Send, Mail, CheckCircle, XCircle, Info, Lock } from 'lucide-react';
import SiteHeader from '@/components/SiteHeader';

export default function EmailTestPage() {
  const [testType, setTestType] = useState<'welcome' | 'reset' | 'purchase'>('welcome');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  const sendTestEmail = async () => {
    if (!recipientEmail || !adminPassword) {
      setResult({ success: false, message: 'Please fill in all fields' });
      return;
    }

    setSending(true);
    setResult(null);

    try {
      const response = await fetch('/api/email/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: testType,
          recipientEmail,
          adminPassword
        })
      });

      const data = await response.json();
      setResult({
        success: response.ok,
        message: data.message || (response.ok ? 'Email sent successfully!' : 'Failed to send email')
      });
    } catch (error) {
      setResult({ success: false, message: 'Network error. Please try again.' });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <SiteHeader />
      
      <div className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold mb-8 flex items-center gap-3">
          <Mail className="w-8 h-8 text-purple-500" />
          Email Service Test
        </h1>

        {/* Configuration Status */}
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Info className="w-5 h-5 text-blue-500" />
            Configuration Requirements
          </h2>
          
          <div className="space-y-3 text-sm">
            <div className="flex items-start gap-3">
              <span className="text-gray-400 font-mono">1.</span>
              <div>
                <p className="font-medium">Add to .env.local:</p>
                <pre className="bg-black/50 p-3 rounded mt-2 overflow-x-auto">
EMAIL_HOST=smtp.ionos.com
EMAIL_PORT=587
EMAIL_USER=admin@fabletech.studio
EMAIL_PASSWORD=your_ionos_password_here
EMAIL_FROM_NAME=FableTech Studios</pre>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <span className="text-gray-400 font-mono">2.</span>
              <div>
                <p className="font-medium">IONOS SMTP Settings:</p>
                <ul className="mt-2 space-y-1 text-gray-400">
                  <li>• Server: smtp.ionos.com</li>
                  <li>• Port: 587 (STARTTLS) or 465 (SSL)</li>
                  <li>• Authentication: Required</li>
                  <li>• Username: Your full email address</li>
                  <li>• Password: Your IONOS email password</li>
                </ul>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <span className="text-gray-400 font-mono">3.</span>
              <div>
                <p className="font-medium">Security Note:</p>
                <p className="text-gray-400 mt-1">
                  You may need to enable "Allow less secure apps" or generate an app-specific password in your IONOS account settings.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Test Form */}
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-6">Send Test Email</h2>
          
          {/* Email Type Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium mb-3">Email Type</label>
            <div className="grid grid-cols-3 gap-3">
              <button
                onClick={() => setTestType('welcome')}
                className={`p-3 rounded-lg border transition-all ${
                  testType === 'welcome'
                    ? 'bg-purple-600 border-purple-500 text-white'
                    : 'bg-gray-800 border-gray-700 hover:border-gray-600'
                }`}
              >
                <div className="font-medium mb-1">Welcome</div>
                <div className="text-xs opacity-75">New user email</div>
              </button>
              
              <button
                onClick={() => setTestType('reset')}
                className={`p-3 rounded-lg border transition-all ${
                  testType === 'reset'
                    ? 'bg-purple-600 border-purple-500 text-white'
                    : 'bg-gray-800 border-gray-700 hover:border-gray-600'
                }`}
              >
                <div className="font-medium mb-1">Password Reset</div>
                <div className="text-xs opacity-75">Reset link email</div>
              </button>
              
              <button
                onClick={() => setTestType('purchase')}
                className={`p-3 rounded-lg border transition-all ${
                  testType === 'purchase'
                    ? 'bg-purple-600 border-purple-500 text-white'
                    : 'bg-gray-800 border-gray-700 hover:border-gray-600'
                }`}
              >
                <div className="font-medium mb-1">Purchase</div>
                <div className="text-xs opacity-75">Receipt email</div>
              </button>
            </div>
          </div>
          
          {/* Recipient Email */}
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">
              Recipient Email
            </label>
            <input
              type="email"
              value={recipientEmail}
              onChange={(e) => setRecipientEmail(e.target.value)}
              placeholder="test@example.com"
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:border-purple-500 focus:outline-none"
            />
          </div>
          
          {/* Admin Password for Security */}
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2 flex items-center gap-2">
              <Lock className="w-4 h-4" />
              Admin Password (for security)
            </label>
            <input
              type="password"
              value={adminPassword}
              onChange={(e) => setAdminPassword(e.target.value)}
              placeholder="Enter admin password"
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:border-purple-500 focus:outline-none"
            />
            <p className="text-xs text-gray-500 mt-2">
              This prevents unauthorized email testing. Use your admin account password.
            </p>
          </div>
          
          {/* Send Button */}
          <button
            onClick={sendTestEmail}
            disabled={sending || !recipientEmail || !adminPassword}
            className="w-full py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
          >
            {sending ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Sending...
              </>
            ) : (
              <>
                <Send className="w-5 h-5" />
                Send Test Email
              </>
            )}
          </button>
          
          {/* Result Message */}
          {result && (
            <div className={`mt-6 p-4 rounded-lg flex items-start gap-3 ${
              result.success ? 'bg-green-900/30 border border-green-500/30' : 'bg-red-900/30 border border-red-500/30'
            }`}>
              {result.success ? (
                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
              ) : (
                <XCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              )}
              <div>
                <p className={result.success ? 'text-green-400' : 'text-red-400'}>
                  {result.message}
                </p>
                {!result.success && result.message.includes('configuration') && (
                  <p className="text-sm text-gray-400 mt-2">
                    Make sure you've added EMAIL_PASSWORD to your .env.local file and restarted the development server.
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Help Section */}
        <div className="mt-8 bg-blue-900/20 border border-blue-500/30 rounded-lg p-6">
          <h3 className="font-semibold mb-3 text-blue-400">Troubleshooting Tips</h3>
          <ul className="space-y-2 text-sm text-gray-300">
            <li>• If emails aren't sending, check that EMAIL_PASSWORD is set in .env.local</li>
            <li>• Ensure you're using your IONOS email password, not your account password</li>
            <li>• The email service uses port 587 by default (STARTTLS)</li>
            <li>• Check your IONOS account for any security restrictions</li>
            <li>• Look at the server console for detailed error messages</li>
          </ul>
        </div>
      </div>
    </div>
  );
}