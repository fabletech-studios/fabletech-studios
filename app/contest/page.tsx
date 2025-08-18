'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useFirebaseCustomerAuth } from '@/contexts/FirebaseCustomerContext';
import { auth } from '@/lib/firebase/config';
import SiteHeader from '@/components/SiteHeader';
import {
  getActiveContest,
  getContestSubmissions,
  getContestLeaderboard,
  castVote,
  getUserVotesRemaining,
  claimDailyVote,
  purchaseVotes
} from '@/lib/firebase/contest-service';
import { Contest, ContestSubmission } from '@/lib/types/contest.types';
import {
  Trophy,
  Clock,
  Users,
  Star,
  ChevronRight,
  Award,
  TrendingUp,
  Gift,
  Zap,
  BookOpen,
  Heart,
  Share2,
  BarChart3,
  Sparkles,
  Crown,
  Flame,
  Medal,
  Target,
  ArrowUp
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ContestPage() {
  const router = useRouter();
  const { customer } = useFirebaseCustomerAuth();
  const [contest, setContest] = useState<Contest | null>(null);
  const [submissions, setSubmissions] = useState<ContestSubmission[]>([]);
  const [leaderboard, setLeaderboard] = useState<ContestSubmission[]>([]);
  const [votesRemaining, setVotesRemaining] = useState({ free: 0, premium: 0, super: 0 });
  const [loading, setLoading] = useState(true);
  const [votingStory, setVotingStory] = useState<string | null>(null);
  const [selectedStory, setSelectedStory] = useState<ContestSubmission | null>(null);
  const [dailyClaimSuccess, setDailyClaimSuccess] = useState(false);

  useEffect(() => {
    loadContestData();
  }, [customer]);

  const loadContestData = async () => {
    try {
      setLoading(true);
      
      // Get active contest using server-side endpoint
      const response = await fetch('/api/contests/get-active');
      const result = await response.json();
      
      if (!result.success || !result.contests || result.contests.length === 0) {
        return;
      }
      
      const activeContest = result.contests[0];
      setContest(activeContest);
      
      // Get submissions if in voting phase
      if (activeContest.status === 'voting') {
        // Use server-side endpoint for submissions
        const submissionsResponse = await fetch(`/api/contests/get-submissions?contestId=${activeContest.id}&status=approved`);
        const submissionsResult = await submissionsResponse.json();
        
        if (submissionsResult.success) {
          const subs = submissionsResult.submissions || [];
          setSubmissions(subs);
          
          // Set top 5 as leaderboard
          setLeaderboard(subs.slice(0, 5));
        }
        
        // Get user's remaining votes using server endpoint
        if (customer) {
          try {
            const token = await auth.currentUser?.getIdToken();
            if (token) {
              const votesResponse = await fetch(`/api/contests/get-votes-remaining?contestId=${activeContest.id}`, {
                headers: {
                  'Authorization': `Bearer ${token}`
                }
              });
              const votesResult = await votesResponse.json();
              if (votesResult.success) {
                setVotesRemaining(votesResult.votesRemaining);
              }
            }
          } catch (error) {
            console.error('Error getting votes:', error);
          }
        }
      }
    } catch (error) {
      console.error('Error loading contest:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async (submissionId: string, voteType: 'free' | 'premium' | 'super') => {
    if (!customer || !contest) return;
    
    setVotingStory(submissionId);
    try {
      // Get the Firebase auth token
      const token = await auth.currentUser?.getIdToken();
      if (!token) {
        alert('Please sign in to vote');
        setVotingStory(null);
        return;
      }
      
      const response = await fetch('/api/contests/cast-vote', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          contestId: contest.id,
          submissionId,
          voteType
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        // Reload data to show updated votes
        await loadContestData();
        
        // Show success animation
        const submission = submissions.find(s => s.id === submissionId);
        if (submission) {
          // Could add a toast notification here
        }
      } else {
        alert(result.error || 'Failed to cast vote');
      }
    } catch (error) {
      console.error('Error voting:', error);
      alert('Failed to cast vote. Please try again.');
    } finally {
      setVotingStory(null);
    }
  };

  const handleClaimDaily = async () => {
    if (!customer || !contest) return;
    
    try {
      // Get the Firebase auth token
      const token = await auth.currentUser?.getIdToken();
      if (!token) {
        alert('Please sign in to claim daily votes');
        return;
      }
      
      const response = await fetch('/api/contests/claim-daily-vote', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ contestId: contest.id })
      });
      
      const result = await response.json();
      
      if (result.success) {
        setDailyClaimSuccess(true);
        await loadContestData();
        
        if (result.bonusVotes) {
          alert(`Streak bonus! You got ${result.bonusVotes} extra votes!`);
        }
      } else {
        alert(result.error || 'Failed to claim daily vote');
      }
    } catch (error) {
      console.error('Error claiming daily:', error);
      alert('Failed to claim daily vote. Please try again.');
    }
  };

  const handlePurchaseVotes = async (packageType: 'basic' | 'pro' | 'super') => {
    if (!customer || !contest) return;
    
    try {
      // Get the Firebase auth token
      const token = await auth.currentUser?.getIdToken();
      if (!token) {
        alert('Please sign in to purchase votes');
        return;
      }
      
      const response = await fetch('/api/contests/purchase-votes', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          contestId: contest.id,
          packageType
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        await loadContestData();
        alert(`Votes purchased successfully! Added ${result.votesAdded.premium || 0} premium and ${result.votesAdded.super || 0} super votes.`);
      } else {
        alert(result.error || 'Failed to purchase votes');
      }
    } catch (error) {
      console.error('Error purchasing votes:', error);
      alert('Failed to purchase votes. Please try again.');
    }
  };

  const handleShare = async (submission: ContestSubmission) => {
    const shareUrl = `${window.location.origin}/contest/story/${submission.id}`;
    const shareText = `Check out "${submission.title}" by ${submission.authorName} in the contest!`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: submission.title,
          text: shareText,
          url: shareUrl
        });
      } catch (error) {
        // User cancelled or error occurred
        console.log('Share cancelled or failed:', error);
      }
    } else {
      // Fallback to copying to clipboard
      try {
        await navigator.clipboard.writeText(shareUrl);
        alert('Story link copied to clipboard!');
      } catch (error) {
        console.error('Failed to copy:', error);
        alert('Share not supported on this device');
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white">
        <SiteHeader />
        <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
        </div>
      </div>
    );
  }

  if (!contest) {
    return (
      <div className="min-h-screen bg-black text-white">
        <SiteHeader />
        <div className="max-w-6xl mx-auto px-4 py-16 pt-28 md:pt-16">
          <div className="text-center">
            <Trophy className="w-24 h-24 text-gray-600 mx-auto mb-6" />
            <h1 className="text-4xl font-bold mb-4">No Active Contest</h1>
            <p className="text-gray-400 text-lg mb-8">
              Check back soon for our next writing contest!
            </p>
            <Link
              href="/"
              className="px-6 py-3 bg-red-600 hover:bg-red-700 rounded-lg inline-flex items-center gap-2 transition-colors"
            >
              Browse Stories
              <ChevronRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <SiteHeader />
      
      {/* Contest Header with Enhanced Visuals */}
      <div className="relative bg-gradient-to-b from-purple-900/30 via-purple-900/10 to-black pt-28 md:pt-0 overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 left-10 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>
        
        <div className="relative max-w-6xl mx-auto px-4 py-12">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-900/30 rounded-full border border-purple-500/30 mb-4">
              <Flame className="w-4 h-4 text-orange-500 animate-pulse" />
              <span className="text-sm font-medium">LIVE CONTEST</span>
            </div>
            
            <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">
              {contest.title}
            </h1>
            
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">{contest.description}</p>
            {contest.theme && (
              <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-900/40 to-pink-900/40 rounded-lg border border-purple-500/20">
                <Target className="w-5 h-5 text-purple-400" />
                <span className="font-medium">Theme: {contest.theme}</span>
              </div>
            )}
          </motion.div>
          
          {/* Status Banner */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="bg-gradient-to-r from-purple-900/20 to-pink-900/20 rounded-2xl p-6 border border-purple-500/20"
          >
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="text-center md:text-left">
                <p className="text-sm text-gray-400 mb-1">Contest Status</p>
                <p className="text-2xl font-bold capitalize text-purple-300">
                  {contest.status === 'submission' ? '📝 Accepting Submissions' : 
                   contest.status === 'voting' ? '🗳️ Voting Open' :
                   contest.status === 'judging' ? '⚖️ Judging in Progress' :
                   contest.status === 'completed' ? '🏆 Contest Complete' :
                   contest.status}
                </p>
              </div>
              
              {/* Timeline Pills */}
              <div className="flex flex-wrap gap-3">
                <div className="px-4 py-2 bg-black/50 rounded-lg">
                  <p className="text-xs text-gray-500">Submission Ends</p>
                  <p className="text-sm font-semibold">
                    {contest.submissionEndDate?.seconds 
                      ? new Date(contest.submissionEndDate.seconds * 1000).toLocaleDateString()
                      : new Date(contest.submissionEndDate).toLocaleDateString()}
                  </p>
                </div>
                <div className="px-4 py-2 bg-black/50 rounded-lg">
                  <p className="text-xs text-gray-500">Voting Ends</p>
                  <p className="text-sm font-semibold">
                    {contest.votingEndDate?.seconds
                      ? new Date(contest.votingEndDate.seconds * 1000).toLocaleDateString()
                      : new Date(contest.votingEndDate).toLocaleDateString()}
                  </p>
                </div>
                <div className="px-4 py-2 bg-black/50 rounded-lg">
                  <p className="text-xs text-gray-500">Word Count</p>
                  <p className="text-sm font-semibold">
                    {contest.minWordCount}-{contest.maxWordCount}
                  </p>
                </div>
              </div>
              
              {/* CTA Button */}
              {(contest.status === 'submission' || contest.status === 'voting') && (
                <Link
                  href="/contest/submit"
                  className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-lg font-semibold transition-all transform hover:scale-105 flex items-center gap-2 shadow-lg"
                >
                  <BookOpen className="w-5 h-5" />
                  Submit Your Story
                </Link>
              )}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Prizes Section - Enhanced and Moved Up */}
      <div className="bg-gradient-to-b from-black via-purple-900/5 to-black py-16 relative overflow-hidden">
        
        <div className="relative max-w-6xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl font-bold mb-4">
              <span className="bg-gradient-to-r from-yellow-400 via-orange-400 to-yellow-400 bg-clip-text text-transparent">
                Incredible Prizes Await
              </span>
            </h2>
            <p className="text-gray-400 text-lg">Your story could win you amazing rewards and opportunities</p>
          </motion.div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {/* First Place */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              whileHover={{ y: -10, transition: { duration: 0.3 } }}
              className="relative group"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-yellow-600 to-orange-600 rounded-2xl blur-xl opacity-30 group-hover:opacity-50 transition-opacity"></div>
              <div className="relative bg-gradient-to-b from-yellow-900/60 to-black rounded-2xl p-8 border-2 border-yellow-500/50 shadow-2xl">
                <div className="absolute -top-6 left-1/2 transform -translate-x-1/2">
                  <div className="bg-gradient-to-r from-yellow-500 to-orange-500 text-black px-6 py-2 rounded-full text-sm font-bold shadow-lg">
                    🥇 GRAND CHAMPION
                  </div>
                </div>
                
                <div className="text-center mb-6 pt-4">
                  <motion.div
                    animate={{ 
                      rotate: [0, -5, 5, -5, 0],
                      scale: [1, 1.1, 1]
                    }}
                    transition={{ 
                      duration: 3,
                      repeat: Infinity,
                      repeatDelay: 2
                    }}
                  >
                    <Trophy className="w-24 h-24 text-yellow-500 mx-auto drop-shadow-2xl" />
                  </motion.div>
                  <h3 className="text-3xl font-bold mt-4 text-yellow-400">1st Place</h3>
                </div>
                
                <div className="space-y-4">
                  <div className="bg-black/40 rounded-xl p-4 border border-yellow-500/20">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-yellow-500/20 rounded-full flex items-center justify-center">
                        <Star className="w-5 h-5 text-yellow-500" />
                      </div>
                      <div>
                        <p className="font-bold text-lg">{contest.prizes.first.credits} Credits</p>
                        <p className="text-xs text-gray-400">Platform currency reward</p>
                      </div>
                    </div>
                  </div>
                  
                  {contest.prizes.first.production && (
                    <div className="bg-black/40 rounded-xl p-4 border border-yellow-500/20">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-yellow-500/20 rounded-full flex items-center justify-center">
                          <Award className="w-5 h-5 text-yellow-500" />
                        </div>
                        <div>
                          <p className="font-bold text-lg">Pro Audio Production</p>
                          <p className="text-xs text-gray-400">Professional voice narration</p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {contest.prizes.first.royaltyPercentage && (
                    <div className="bg-black/40 rounded-xl p-4 border border-yellow-500/20">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-yellow-500/20 rounded-full flex items-center justify-center">
                          <TrendingUp className="w-5 h-5 text-yellow-500" />
                        </div>
                        <div>
                          <p className="font-bold text-lg">{contest.prizes.first.royaltyPercentage}% Royalties</p>
                          <p className="text-xs text-gray-400">Ongoing revenue share</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
            
            {/* Second Place */}
            {contest.prizes.second && (
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                whileHover={{ y: -10, transition: { duration: 0.3 } }}
                className="relative group"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-gray-500 to-gray-600 rounded-2xl blur-xl opacity-20 group-hover:opacity-40 transition-opacity"></div>
                <div className="relative bg-gradient-to-b from-gray-800/60 to-black rounded-2xl p-8 border-2 border-gray-500/50 shadow-2xl">
                  <div className="absolute -top-5 left-1/2 transform -translate-x-1/2">
                    <div className="bg-gradient-to-r from-gray-400 to-gray-600 text-white px-5 py-1.5 rounded-full text-sm font-bold shadow-lg">
                      🥈 RUNNER UP
                    </div>
                  </div>
                  
                  <div className="text-center mb-6 pt-3">
                    <Medal className="w-20 h-20 text-gray-300 mx-auto" />
                    <h3 className="text-2xl font-bold mt-3 text-gray-300">2nd Place</h3>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="bg-black/40 rounded-xl p-4 border border-gray-500/20">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-500/20 rounded-full flex items-center justify-center">
                          <Star className="w-5 h-5 text-gray-300" />
                        </div>
                        <div>
                          <p className="font-bold text-lg">{contest.prizes.second.credits} Credits</p>
                          <p className="text-xs text-gray-400">Platform currency reward</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-black/40 rounded-xl p-4 border border-gray-500/20">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-500/20 rounded-full flex items-center justify-center">
                          <Users className="w-5 h-5 text-gray-300" />
                        </div>
                        <div>
                          <p className="font-bold text-lg">Featured Story</p>
                          <p className="text-xs text-gray-400">Homepage spotlight for 30 days</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-black/40 rounded-xl p-4 border border-gray-500/20">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-500/20 rounded-full flex items-center justify-center">
                          <Medal className="w-5 h-5 text-gray-300" />
                        </div>
                        <div>
                          <p className="font-bold text-lg">Silver Badge</p>
                          <p className="text-xs text-gray-400">Permanent profile achievement</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
            
            {/* Third Place */}
            {contest.prizes.third && (
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                whileHover={{ y: -10, transition: { duration: 0.3 } }}
                className="relative group"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-orange-600 to-red-600 rounded-2xl blur-xl opacity-20 group-hover:opacity-40 transition-opacity"></div>
                <div className="relative bg-gradient-to-b from-orange-900/60 to-black rounded-2xl p-8 border-2 border-orange-500/50 shadow-2xl">
                  <div className="absolute -top-5 left-1/2 transform -translate-x-1/2">
                    <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-5 py-1.5 rounded-full text-sm font-bold shadow-lg">
                      🥉 FINALIST
                    </div>
                  </div>
                  
                  <div className="text-center mb-6 pt-3">
                    <Medal className="w-20 h-20 text-orange-500 mx-auto" />
                    <h3 className="text-2xl font-bold mt-3 text-orange-400">3rd Place</h3>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="bg-black/40 rounded-xl p-4 border border-orange-500/20">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-orange-500/20 rounded-full flex items-center justify-center">
                          <Star className="w-5 h-5 text-orange-500" />
                        </div>
                        <div>
                          <p className="font-bold text-lg">{contest.prizes.third.credits} Credits</p>
                          <p className="text-xs text-gray-400">Platform currency reward</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-black/40 rounded-xl p-4 border border-orange-500/20">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-orange-500/20 rounded-full flex items-center justify-center">
                          <BookOpen className="w-5 h-5 text-orange-500" />
                        </div>
                        <div>
                          <p className="font-bold text-lg">Editor's Pick</p>
                          <p className="text-xs text-gray-400">Featured in newsletter</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-black/40 rounded-xl p-4 border border-orange-500/20">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-orange-500/20 rounded-full flex items-center justify-center">
                          <Medal className="w-5 h-5 text-orange-500" />
                        </div>
                        <div>
                          <p className="font-bold text-lg">Bronze Badge</p>
                          <p className="text-xs text-gray-400">Permanent profile achievement</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
          
          {/* Participation Rewards */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mt-12 bg-gradient-to-r from-purple-900/20 via-pink-900/20 to-purple-900/20 rounded-2xl p-8 border border-purple-500/20"
          >
            <div className="text-center">
              <h3 className="text-xl font-semibold mb-4 text-purple-300">
                🎁 Every Participant Receives
              </h3>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="flex flex-col items-center gap-2">
                  <div className="w-12 h-12 bg-purple-500/20 rounded-full flex items-center justify-center">
                    <Users className="w-6 h-6 text-purple-400" />
                  </div>
                  <p className="font-medium">Community Recognition</p>
                  <p className="text-xs text-gray-400">Featured author profile</p>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <div className="w-12 h-12 bg-purple-500/20 rounded-full flex items-center justify-center">
                    <BarChart3 className="w-6 h-6 text-purple-400" />
                  </div>
                  <p className="font-medium">Performance Analytics</p>
                  <p className="text-xs text-gray-400">Detailed reader insights</p>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <div className="w-12 h-12 bg-purple-500/20 rounded-full flex items-center justify-center">
                    <Award className="w-6 h-6 text-purple-400" />
                  </div>
                  <p className="font-medium">Contest Badge</p>
                  <p className="text-xs text-gray-400">Profile achievement</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Stats Bar for Voting Phase */}
      {contest.status === 'voting' && submissions.length > 0 && (
        <div className="bg-gradient-to-r from-gray-900 to-gray-800 border-y border-gray-700">
          <div className="max-w-6xl mx-auto px-4 py-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 }}
                className="text-center"
              >
                <div className="text-3xl font-bold text-white mb-1">{submissions.length}</div>
                <div className="text-sm text-gray-400">Total Stories</div>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
                className="text-center"
              >
                <div className="text-3xl font-bold text-purple-400 mb-1">
                  {submissions.reduce((sum, s) => sum + s.votes.total, 0)}
                </div>
                <div className="text-sm text-gray-400">Total Votes Cast</div>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 }}
                className="text-center"
              >
                <div className="text-3xl font-bold text-yellow-400 mb-1">
                  {Math.max(0, Math.ceil((new Date(contest.votingEndDate?.seconds ? contest.votingEndDate.seconds * 1000 : contest.votingEndDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))}
                </div>
                <div className="text-sm text-gray-400">Days Remaining</div>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4 }}
                className="text-center"
              >
                <div className="flex items-center justify-center gap-2">
                  <ArrowUp className="w-5 h-5 text-green-400" />
                  <div className="text-3xl font-bold text-green-400">{leaderboard[0]?.votes.total || 0}</div>
                </div>
                <div className="text-sm text-gray-400">Leading Score</div>
              </motion.div>
            </div>
          </div>
        </div>
      )}

      {/* Status-specific content sections remain the same */}
      {contest.status === 'submission' && (
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="bg-purple-900/20 border border-purple-500/30 rounded-lg p-6 text-center">
            <BookOpen className="w-12 h-12 text-purple-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Submission Period Open</h2>
            <p className="text-gray-300 mb-4">
              Authors are currently submitting their stories. Voting will begin on {' '}
              {contest.votingStartDate?.seconds 
                ? new Date(contest.votingStartDate.seconds * 1000).toLocaleDateString()
                : new Date(contest.votingStartDate).toLocaleDateString()}
            </p>
            <Link
              href="/contest/submit"
              className="inline-block px-6 py-3 bg-purple-600 hover:bg-purple-700 rounded-lg font-medium transition-colors"
            >
              Submit Your Story
            </Link>
          </div>
        </div>
      )}

      {/* Voting Section with improved layout */}
      {contest.status === 'voting' && (
        <div className="max-w-6xl mx-auto px-4 py-8">
          {/* Submit Story CTA for logged in users */}
          {customer && (
            <div className="bg-gradient-to-r from-purple-900/20 to-pink-900/20 rounded-xl p-4 mb-6 border border-purple-500/20 text-center">
              <p className="text-sm text-gray-300 mb-2">Haven't submitted your story yet?</p>
              <Link
                href="/contest/submit"
                className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-sm font-medium transition-colors"
              >
                <BookOpen className="w-4 h-4" />
                Submit Your Story
              </Link>
            </div>
          )}
          
          {/* Your Votes */}
          {customer && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-r from-purple-900/20 to-pink-900/20 rounded-xl p-6 mb-8 border border-purple-500/20"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <Zap className="w-5 h-5 text-yellow-500" />
                  Your Voting Power
                </h2>
                
                {!dailyClaimSuccess && (
                  <button
                    onClick={handleClaimDaily}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                  >
                    <Gift className="w-4 h-4" />
                    Claim Daily Vote
                  </button>
                )}
              </div>
              
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="bg-gray-900/50 rounded-lg p-4">
                  <p className="text-sm text-gray-400">Free Votes</p>
                  <p className="text-2xl font-bold">{votesRemaining.free}</p>
                  <p className="text-xs text-gray-500">1x power</p>
                </div>
                <div className="bg-gray-900/50 rounded-lg p-4">
                  <p className="text-sm text-gray-400">Premium Votes</p>
                  <p className="text-2xl font-bold text-purple-400">{votesRemaining.premium}</p>
                  <p className="text-xs text-gray-500">3x power</p>
                </div>
                <div className="bg-gray-900/50 rounded-lg p-4">
                  <p className="text-sm text-gray-400">Super Votes</p>
                  <p className="text-2xl font-bold text-yellow-400">{votesRemaining.super}</p>
                  <p className="text-xs text-gray-500">10x power</p>
                </div>
              </div>
              
              {/* Vote Packages */}
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => handlePurchaseVotes('basic')}
                  className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm transition-colors"
                >
                  <div className="font-semibold">Starter Pack</div>
                  <div className="text-xs">5 Premium votes • 10 credits</div>
                </button>
                <button
                  onClick={() => handlePurchaseVotes('pro')}
                  className="px-4 py-2 bg-purple-800 hover:bg-purple-700 rounded-lg text-sm transition-colors"
                >
                  <div className="font-semibold">Pro Pack</div>
                  <div className="text-xs">15 Premium + 2 Super • 25 credits</div>
                </button>
                <button
                  onClick={() => handlePurchaseVotes('super')}
                  className="px-4 py-2 bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700 rounded-lg text-sm transition-colors"
                >
                  <div className="font-semibold">Power Pack</div>
                  <div className="text-xs">25 Premium + 10 Super • 50 credits • BEST VALUE!</div>
                </button>
              </div>
            </motion.div>
          )}

          {/* Story Cards and Leaderboard */}
          <div className="grid md:grid-cols-3 gap-8">
            <div className="md:col-span-2">
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <BookOpen className="w-6 h-6 text-blue-500" />
                Vote for Your Favorite
              </h2>
              
              {/* Story Cards */}
              <div className="space-y-4">
                {submissions.map((submission) => (
                  <motion.div
                    key={submission.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="bg-gray-900 rounded-xl p-6 hover:bg-gray-800/70 transition-all"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold mb-1">{submission.title}</h3>
                        <p className="text-sm text-gray-400 mb-2">
                          by {submission.authorName} • {submission.genre.join(', ')}
                        </p>
                        <p className="text-gray-300 line-clamp-2">{submission.synopsis}</p>
                      </div>
                      
                      <div className="text-center ml-4">
                        <p className="text-3xl font-bold text-purple-400">{submission.votes.total}</p>
                        <p className="text-xs text-gray-500">votes</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3 mt-4">
                      <Link
                        href={`/contest/story/${submission.id}`}
                        className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm transition-colors inline-block"
                      >
                        Read Full Story
                      </Link>
                      
                      {customer && votesRemaining.free > 0 && (
                        <button
                          onClick={() => handleVote(submission.id, 'free')}
                          disabled={votingStory === submission.id}
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm transition-colors disabled:opacity-50"
                        >
                          {votingStory === submission.id ? 'Voting...' : 'Vote Free'}
                        </button>
                      )}
                      
                      {customer && votesRemaining.premium > 0 && (
                        <button
                          onClick={() => handleVote(submission.id, 'premium')}
                          disabled={votingStory === submission.id}
                          className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-sm transition-colors disabled:opacity-50"
                        >
                          Vote 3x
                        </button>
                      )}
                      
                      {customer && votesRemaining.super > 0 && (
                        <button
                          onClick={() => handleVote(submission.id, 'super')}
                          disabled={votingStory === submission.id}
                          className="px-4 py-2 bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700 rounded-lg text-sm transition-colors disabled:opacity-50"
                        >
                          Vote 10x
                        </button>
                      )}
                      
                      <button 
                        onClick={() => handleShare(submission)}
                        className="p-2 text-gray-400 hover:text-white transition-colors"
                        title="Share Story"
                      >
                        <Share2 className="w-4 h-4" />
                      </button>
                    </div>
                    
                    {submission.hasAudioBonus && (
                      <div className="mt-3 inline-flex items-center gap-1 px-2 py-1 bg-purple-900/30 rounded-full text-xs text-purple-300">
                        <Sparkles className="w-3 h-3" />
                        Has Audio Preview
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            </div>
            
            {/* Top 5 Leaderboard */}
            <div>
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <Crown className="w-6 h-6 text-yellow-500" />
                Top 5 Leaders
              </h2>
              
              <div className="bg-gradient-to-b from-yellow-900/20 to-gray-900 rounded-xl p-6 space-y-4">
                {leaderboard.map((submission, index) => (
                  <motion.div 
                    key={submission.id} 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center gap-3 p-3 rounded-lg bg-black/30 hover:bg-black/50 transition-colors"
                  >
                    <div className={`text-2xl font-bold ${
                      index === 0 ? 'text-yellow-500' :
                      index === 1 ? 'text-gray-300' :
                      index === 2 ? 'text-orange-600' :
                      'text-gray-500'
                    }`}>
                      #{index + 1}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium truncate">{submission.title}</p>
                      <p className="text-sm text-gray-400">{submission.votes.total} votes</p>
                    </div>
                    {index === 0 && <Crown className="w-5 h-5 text-yellow-500" />}
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}