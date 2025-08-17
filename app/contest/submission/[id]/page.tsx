'use client';

import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle, Trophy, ArrowLeft, Share2, Eye } from 'lucide-react';
import { motion } from 'framer-motion';
import SiteHeader from '@/components/SiteHeader';

export default function SubmissionSuccessPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const [showSuccess, setShowSuccess] = useState(false);
  
  useEffect(() => {
    if (searchParams.get('success') === 'true') {
      setShowSuccess(true);
      // Hide success message after 5 seconds
      const timer = setTimeout(() => setShowSuccess(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-black text-white">
      <SiteHeader />
      <div className="max-w-4xl mx-auto px-4 py-16 pt-28 md:pt-16">
        {showSuccess && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="mb-8 bg-green-900/20 border border-green-500/30 rounded-lg p-6"
          >
            <div className="flex items-center gap-3">
              <CheckCircle className="w-8 h-8 text-green-500" />
              <div>
                <h2 className="text-xl font-bold text-green-400">Submission Successful!</h2>
                <p className="text-gray-300">Your story has been submitted to the contest.</p>
              </div>
            </div>
          </motion.div>
        )}

        <div className="bg-gray-900 rounded-xl p-8 border border-gray-800">
          <div className="text-center mb-8">
            <Trophy className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
            <h1 className="text-3xl font-bold mb-2">Thank You for Your Submission!</h1>
            <p className="text-gray-400">
              Submission ID: <span className="font-mono text-purple-400">{params.id}</span>
            </p>
          </div>

          <div className="space-y-6 mb-8">
            <div className="bg-gray-800 rounded-lg p-4">
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <Eye className="w-5 h-5 text-blue-500" />
                What Happens Next?
              </h3>
              <ol className="space-y-2 text-sm text-gray-300 ml-7">
                <li>1. Your submission will be reviewed by our moderation team</li>
                <li>2. Once approved, it will appear in the contest for voting</li>
                <li>3. During the voting period, readers can vote for your story</li>
                <li>4. Winners will be announced after the judging period</li>
              </ol>
            </div>

            <div className="bg-purple-900/20 border border-purple-500/30 rounded-lg p-4">
              <h3 className="font-semibold mb-2 text-purple-300">Pro Tip</h3>
              <p className="text-sm text-gray-300">
                Share your story with friends and followers to get more votes! 
                The more engagement your story receives, the better your chances of winning.
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/contest"
              className="px-6 py-3 bg-gray-800 hover:bg-gray-700 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-5 h-5" />
              Back to Contest
            </Link>
            
            <Link
              href="/profile"
              className="px-6 py-3 bg-purple-600 hover:bg-purple-700 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
            >
              View Your Submissions
            </Link>
            
            <button
              onClick={() => {
                navigator.clipboard.writeText(window.location.href.split('?')[0]);
                alert('Submission link copied to clipboard!');
              }}
              className="px-6 py-3 bg-gray-800 hover:bg-gray-700 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
            >
              <Share2 className="w-5 h-5" />
              Share
            </button>
          </div>
        </div>

        <div className="mt-8 text-center text-sm text-gray-500">
          <p>Need help? Contact us at support@fabletech.studio</p>
        </div>
      </div>
    </div>
  );
}