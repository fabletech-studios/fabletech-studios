'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useFirebaseCustomerAuth } from '@/contexts/FirebaseCustomerContext';

// Force dynamic rendering to prevent build errors
export const dynamic = 'force-dynamic';
import { 
  Trophy, 
  Medal, 
  Award, 
  Crown,
  Star,
  ChevronLeft,
  Check,
  Send,
  Users,
  BarChart3,
  Calendar,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ContestSubmission {
  id: string;
  title: string;
  authorName: string;
  authorEmail: string;
  votes: number;
  weightedVotes: number;
  views: number;
}

export default function AnnounceWinnersPage() {
  const router = useRouter();
  const { customer, user } = useFirebaseCustomerAuth();
  const [submissions, setSubmissions] = useState<ContestSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [announcing, setAnnouncing] = useState(false);
  const [selectedWinners, setSelectedWinners] = useState({
    first: '',
    second: '',
    third: '',
    honorableMentions: [] as string[]
  });
  const [announcementMessage, setAnnouncementMessage] = useState('');
  const [sendNotifications, setSendNotifications] = useState(true);
  const [publishToSite, setPublishToSite] = useState(true);

  // Check if user is admin
  useEffect(() => {
    console.log('Auth state:', {
      user,
      customer,
      userUndefined: user === undefined,
      userNull: user === null,
      customerUndefined: customer === undefined,
      customerNull: customer === null
    });
    
    // Skip check during initial load
    if (user === undefined) {
      console.log('User is undefined, waiting for auth...');
      return;
    }
    
    const adminEmailsEnv = process.env.NEXT_PUBLIC_ADMIN_EMAILS;
    console.log('Admin emails from env:', adminEmailsEnv);
    
    const adminEmails = adminEmailsEnv?.split(',').map(e => e.trim()) || [];
    const userEmail = user?.email || customer?.email;
    
    console.log('Admin check:', { 
      userEmail: userEmail,
      firebaseUser: user?.email,
      customerEmail: customer?.email,
      adminEmails,
      isAdmin: userEmail && adminEmails.includes(userEmail)
    });
    
    if (!user || !userEmail || !adminEmails.includes(userEmail)) {
      console.log('Not admin, redirecting to contest page');
      console.log('Reason:', {
        noUser: !user,
        noEmail: !userEmail,
        notInList: userEmail && !adminEmails.includes(userEmail)
      });
      router.push('/contest');
    } else {
      console.log('Admin verified, allowing access');
      setCheckingAuth(false);
    }
  }, [user, customer, router]);

  useEffect(() => {
    // Only fetch submissions after auth check passes
    if (!checkingAuth) {
      fetchSubmissions();
    }
  }, [checkingAuth]);

  const fetchSubmissions = async () => {
    try {
      // Fetch contest submissions sorted by votes
      const res = await fetch('/api/contests/leaderboard');
      const data = await res.json();
      
      if (data.success) {
        setSubmissions(data.submissions);
        // Auto-select top 3 as default winners
        if (data.submissions.length > 0) {
          setSelectedWinners({
            first: data.submissions[0]?.id || '',
            second: data.submissions[1]?.id || '',
            third: data.submissions[2]?.id || '',
            honorableMentions: data.submissions.slice(3, 8).map((s: any) => s.id)
          });
        }
      }
    } catch (error) {
      console.error('Error fetching submissions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAnnounceWinners = async () => {
    if (!selectedWinners.first) {
      alert('Please select at least a first place winner');
      return;
    }

    setAnnouncing(true);
    try {
      const res = await fetch('/api/admin/announce-winners', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          winners: selectedWinners,
          announcementMessage,
          sendNotifications,
          publishToSite
        })
      });

      const data = await res.json();
      if (data.success) {
        alert('Winners announced successfully!');
        router.push('/contest');
      } else {
        alert('Failed to announce winners: ' + data.error);
      }
    } catch (error) {
      console.error('Error announcing winners:', error);
      alert('Failed to announce winners');
    } finally {
      setAnnouncing(false);
    }
  };

  const toggleHonorableMention = (submissionId: string) => {
    setSelectedWinners(prev => ({
      ...prev,
      honorableMentions: prev.honorableMentions.includes(submissionId)
        ? prev.honorableMentions.filter(id => id !== submissionId)
        : [...prev.honorableMentions, submissionId]
    }));
  };

  const getWinnerBadge = (submissionId: string) => {
    if (selectedWinners.first === submissionId) {
      return { icon: Crown, color: 'text-yellow-500', label: '1st Place' };
    }
    if (selectedWinners.second === submissionId) {
      return { icon: Medal, color: 'text-gray-400', label: '2nd Place' };
    }
    if (selectedWinners.third === submissionId) {
      return { icon: Award, color: 'text-orange-600', label: '3rd Place' };
    }
    if (selectedWinners.honorableMentions.includes(submissionId)) {
      return { icon: Star, color: 'text-purple-500', label: 'Honorable Mention' };
    }
    return null;
  };

  if (checkingAuth || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"></div>
          <p className="text-white mt-4">
            {checkingAuth ? 'Checking authorization...' : 'Loading submissions...'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/contest"
            className="inline-flex items-center gap-2 text-white/80 hover:text-white mb-4 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to Contest
          </Link>
          <h1 className="text-4xl font-bold text-white mb-2">Announce Contest Winners</h1>
          <p className="text-white/80">Select the winners and announce them to the community</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Winner Selection */}
          <div className="lg:col-span-2 space-y-6">
            {/* Top 3 Winners */}
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-6">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <Trophy className="w-5 h-5 text-yellow-400" />
                Select Winners
              </h2>
              
              <div className="space-y-4">
                {/* First Place */}
                <div>
                  <label className="text-white/80 text-sm mb-2 block">🥇 First Place</label>
                  <select
                    value={selectedWinners.first}
                    onChange={(e) => setSelectedWinners(prev => ({ ...prev, first: e.target.value }))}
                    className="w-full px-4 py-2 bg-white/10 text-white rounded-lg border border-white/20 focus:border-yellow-400 focus:outline-none"
                  >
                    <option value="">Select First Place Winner</option>
                    {submissions.map(submission => (
                      <option key={submission.id} value={submission.id}>
                        {submission.title} by {submission.authorName} ({submission.weightedVotes} votes)
                      </option>
                    ))}
                  </select>
                </div>

                {/* Second Place */}
                <div>
                  <label className="text-white/80 text-sm mb-2 block">🥈 Second Place</label>
                  <select
                    value={selectedWinners.second}
                    onChange={(e) => setSelectedWinners(prev => ({ ...prev, second: e.target.value }))}
                    className="w-full px-4 py-2 bg-white/10 text-white rounded-lg border border-white/20 focus:border-gray-400 focus:outline-none"
                  >
                    <option value="">Select Second Place Winner</option>
                    {submissions.filter(s => s.id !== selectedWinners.first).map(submission => (
                      <option key={submission.id} value={submission.id}>
                        {submission.title} by {submission.authorName} ({submission.weightedVotes} votes)
                      </option>
                    ))}
                  </select>
                </div>

                {/* Third Place */}
                <div>
                  <label className="text-white/80 text-sm mb-2 block">🥉 Third Place</label>
                  <select
                    value={selectedWinners.third}
                    onChange={(e) => setSelectedWinners(prev => ({ ...prev, third: e.target.value }))}
                    className="w-full px-4 py-2 bg-white/10 text-white rounded-lg border border-white/20 focus:border-orange-500 focus:outline-none"
                  >
                    <option value="">Select Third Place Winner</option>
                    {submissions.filter(s => s.id !== selectedWinners.first && s.id !== selectedWinners.second).map(submission => (
                      <option key={submission.id} value={submission.id}>
                        {submission.title} by {submission.authorName} ({submission.weightedVotes} votes)
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Honorable Mentions */}
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-6">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <Star className="w-5 h-5 text-purple-400" />
                Honorable Mentions
              </h2>
              
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {submissions
                  .filter(s => 
                    s.id !== selectedWinners.first && 
                    s.id !== selectedWinners.second && 
                    s.id !== selectedWinners.third
                  )
                  .map(submission => (
                    <label
                      key={submission.id}
                      className="flex items-center gap-3 p-3 bg-white/5 rounded-lg hover:bg-white/10 cursor-pointer transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={selectedWinners.honorableMentions.includes(submission.id)}
                        onChange={() => toggleHonorableMention(submission.id)}
                        className="rounded text-purple-500 focus:ring-purple-500"
                      />
                      <div className="flex-1">
                        <p className="text-white font-medium">{submission.title}</p>
                        <p className="text-white/60 text-sm">
                          by {submission.authorName} • {submission.weightedVotes} votes
                        </p>
                      </div>
                    </label>
                  ))}
              </div>
            </div>

            {/* Announcement Message */}
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-6">
              <h2 className="text-xl font-bold text-white mb-4">Announcement Message</h2>
              <textarea
                value={announcementMessage}
                onChange={(e) => setAnnouncementMessage(e.target.value)}
                placeholder="Write a congratulatory message for the winners..."
                className="w-full px-4 py-3 bg-white/10 text-white rounded-lg border border-white/20 focus:border-purple-400 focus:outline-none placeholder-white/40"
                rows={4}
              />
            </div>
          </div>

          {/* Preview & Settings */}
          <div className="space-y-6">
            {/* Winners Preview */}
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-6">
              <h2 className="text-xl font-bold text-white mb-4">Winners Preview</h2>
              
              <div className="space-y-3">
                {selectedWinners.first && (
                  <div className="flex items-center gap-3">
                    <Crown className="w-6 h-6 text-yellow-400" />
                    <div>
                      <p className="text-white font-medium">1st Place</p>
                      <p className="text-white/60 text-sm">
                        {submissions.find(s => s.id === selectedWinners.first)?.title}
                      </p>
                    </div>
                  </div>
                )}
                
                {selectedWinners.second && (
                  <div className="flex items-center gap-3">
                    <Medal className="w-6 h-6 text-gray-300" />
                    <div>
                      <p className="text-white font-medium">2nd Place</p>
                      <p className="text-white/60 text-sm">
                        {submissions.find(s => s.id === selectedWinners.second)?.title}
                      </p>
                    </div>
                  </div>
                )}
                
                {selectedWinners.third && (
                  <div className="flex items-center gap-3">
                    <Award className="w-6 h-6 text-orange-500" />
                    <div>
                      <p className="text-white font-medium">3rd Place</p>
                      <p className="text-white/60 text-sm">
                        {submissions.find(s => s.id === selectedWinners.third)?.title}
                      </p>
                    </div>
                  </div>
                )}
                
                {selectedWinners.honorableMentions.length > 0 && (
                  <div className="pt-2 border-t border-white/10">
                    <p className="text-white/80 text-sm mb-2">
                      {selectedWinners.honorableMentions.length} Honorable Mentions
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Announcement Settings */}
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-6">
              <h2 className="text-xl font-bold text-white mb-4">Settings</h2>
              
              <div className="space-y-3">
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={sendNotifications}
                    onChange={(e) => setSendNotifications(e.target.checked)}
                    className="rounded text-purple-500 focus:ring-purple-500"
                  />
                  <div>
                    <p className="text-white">Send Email Notifications</p>
                    <p className="text-white/60 text-xs">Notify winners via email</p>
                  </div>
                </label>
                
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={publishToSite}
                    onChange={(e) => setPublishToSite(e.target.checked)}
                    className="rounded text-purple-500 focus:ring-purple-500"
                  />
                  <div>
                    <p className="text-white">Publish to Site</p>
                    <p className="text-white/60 text-xs">Display winners on contest page</p>
                  </div>
                </label>
              </div>
            </div>

            {/* Announce Button */}
            <button
              onClick={handleAnnounceWinners}
              disabled={!selectedWinners.first || announcing}
              className="w-full px-6 py-3 bg-gradient-to-r from-yellow-400 to-orange-500 text-white font-bold rounded-lg hover:from-yellow-500 hover:to-orange-600 transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {announcing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Announcing...
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  Announce Winners
                </>
              )}
            </button>

            {/* Warning */}
            <div className="bg-yellow-500/20 border border-yellow-500/50 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-yellow-200 text-sm font-medium">Important</p>
                  <p className="text-yellow-200/80 text-xs mt-1">
                    Once announced, winners cannot be changed. Make sure you've selected the correct winners before proceeding.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}