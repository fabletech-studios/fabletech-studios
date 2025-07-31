'use client';

import { useNotifications } from '@/hooks/useNotifications';
import PremiumLogo from '@/components/PremiumLogo';
import { 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Info, 
  CreditCard, 
  Loader,
  Sparkles
} from 'lucide-react';

export default function NotificationDemoPage() {
  const notify = useNotifications();

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <PremiumLogo />
          <h1 className="text-2xl font-bold">Notification System Demo</h1>
        </div>

        <div className="bg-gray-900 rounded-lg p-8">
          <h2 className="text-xl font-semibold mb-6">Click to test notifications:</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Success Notifications */}
            <button
              onClick={() => notify.success('Success!', 'Operation completed successfully')}
              className="flex items-center gap-3 p-4 bg-green-900/20 hover:bg-green-900/30 border border-green-600 rounded-lg transition-colors"
            >
              <CheckCircle className="w-5 h-5 text-green-400" />
              <div className="text-left">
                <div className="font-semibold">Success Notification</div>
                <div className="text-sm text-gray-400">General success message</div>
              </div>
            </button>

            {/* Error Notifications */}
            <button
              onClick={() => notify.error('Error Occurred', 'Something went wrong. Please try again.')}
              className="flex items-center gap-3 p-4 bg-red-900/20 hover:bg-red-900/30 border border-red-600 rounded-lg transition-colors"
            >
              <XCircle className="w-5 h-5 text-red-400" />
              <div className="text-left">
                <div className="font-semibold">Error Notification</div>
                <div className="text-sm text-gray-400">Error message</div>
              </div>
            </button>

            {/* Episode Unlocked */}
            <button
              onClick={() => notify.episodeUnlocked()}
              className="flex items-center gap-3 p-4 bg-purple-900/20 hover:bg-purple-900/30 border border-purple-600 rounded-lg transition-colors"
            >
              <Sparkles className="w-5 h-5 text-purple-400" />
              <div className="text-left">
                <div className="font-semibold">Episode Unlocked</div>
                <div className="text-sm text-gray-400">Show when episode is unlocked</div>
              </div>
            </button>

            {/* Credits Deducted */}
            <button
              onClick={() => notify.creditsDeducted(30)}
              className="flex items-center gap-3 p-4 bg-purple-900/20 hover:bg-purple-900/30 border border-purple-600 rounded-lg transition-colors"
            >
              <CreditCard className="w-5 h-5 text-purple-400" />
              <div className="text-left">
                <div className="font-semibold">Credits Deducted</div>
                <div className="text-sm text-gray-400">30 credits used</div>
              </div>
            </button>

            {/* Credits Added */}
            <button
              onClick={() => notify.creditsAdded(100)}
              className="flex items-center gap-3 p-4 bg-purple-900/20 hover:bg-purple-900/30 border border-purple-600 rounded-lg transition-colors"
            >
              <CreditCard className="w-5 h-5 text-purple-400" />
              <div className="text-left">
                <div className="font-semibold">Credits Added</div>
                <div className="text-sm text-gray-400">100 credits purchased</div>
              </div>
            </button>

            {/* Payment Processing */}
            <button
              onClick={() => {
                notify.paymentProcessing();
                setTimeout(() => {
                  notify.paymentSuccess();
                }, 3000);
              }}
              className="flex items-center gap-3 p-4 bg-gray-700/20 hover:bg-gray-700/30 border border-gray-600 rounded-lg transition-colors"
            >
              <Loader className="w-5 h-5 text-gray-400" />
              <div className="text-left">
                <div className="font-semibold">Payment Flow</div>
                <div className="text-sm text-gray-400">Processing → Success</div>
              </div>
            </button>

            {/* Login Success */}
            <button
              onClick={() => notify.loginSuccess()}
              className="flex items-center gap-3 p-4 bg-green-900/20 hover:bg-green-900/30 border border-green-600 rounded-lg transition-colors"
            >
              <CheckCircle className="w-5 h-5 text-green-400" />
              <div className="text-left">
                <div className="font-semibold">Login Success</div>
                <div className="text-sm text-gray-400">Welcome back message</div>
              </div>
            </button>

            {/* Warning */}
            <button
              onClick={() => notify.warning('Low Credits', 'You have only 5 credits remaining')}
              className="flex items-center gap-3 p-4 bg-yellow-900/20 hover:bg-yellow-900/30 border border-yellow-600 rounded-lg transition-colors"
            >
              <AlertCircle className="w-5 h-5 text-yellow-400" />
              <div className="text-left">
                <div className="font-semibold">Warning</div>
                <div className="text-sm text-gray-400">Warning message</div>
              </div>
            </button>
          </div>

          <div className="mt-8 p-4 bg-gray-800 rounded-lg">
            <h3 className="font-semibold mb-2">Features:</h3>
            <ul className="text-sm text-gray-300 space-y-1">
              <li>• Smooth slide-in animation with shimmer effect</li>
              <li>• Auto-dismiss after 4 seconds (customizable)</li>
              <li>• Click to dismiss immediately</li>
              <li>• Progress bar for timed notifications</li>
              <li>• Stacking support for multiple notifications</li>
              <li>• Persistent notifications for loading states</li>
              <li>• Mobile responsive design</li>
              <li>• Accessibility compliant (ARIA labels)</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}