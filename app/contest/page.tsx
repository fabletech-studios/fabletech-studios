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
  Crown
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
      {/* Contest Header */}
      <div className="bg-gradient-to-b from-purple-900/20 to-black border-b border-purple-500/20 pt-28 md:pt-0">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6"
          >
            <div>
              <h1 className="text-4xl font-bold mb-3 flex items-center gap-3">
                <Trophy className="w-10 h-10 text-yellow-500" />
                {contest.title}
              </h1>
              <p className="text-gray-300 text-lg">{contest.description}</p>
              {contest.theme && (
                <p className="mt-2 text-purple-400 font-medium">
                  Theme: {contest.theme}
                </p>
              )}
            </div>
            
            <div className="flex flex-col items-end gap-3">
              <div className="px-4 py-2 bg-purple-900/30 rounded-lg border border-purple-500/30">
                <p className="text-sm text-gray-400">Status</p>
                <p className="text-lg font-semibold capitalize text-purple-300">
                  {contest.status === 'submission' ? 'Accepting Submissions' : 
                   contest.status === 'voting' ? 'Voting Open' :
                   contest.status}
                </p>
              </div>
              
              {contest.status === 'submission' && (
                <Link
                  href="/contest/submit"
                  className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-lg font-semibold transition-all flex items-center gap-2"
                >
                  <BookOpen className="w-5 h-5" />
                  Submit Your Story
                </Link>
              )}
            </div>
          </motion.div>
          
          {/* Contest Timeline */}
          <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gray-900/50 rounded-lg p-3">
              <p className="text-xs text-gray-500">Submission Deadline</p>
              <p className="text-sm font-semibold">
                {contest.submissionEndDate?.seconds 
                  ? new Date(contest.submissionEndDate.seconds * 1000).toLocaleDateString()
                  : new Date(contest.submissionEndDate).toLocaleDateString()}
              </p>
            </div>
            <div className="bg-gray-900/50 rounded-lg p-3">
              <p className="text-xs text-gray-500">Voting Opens</p>
              <p className="text-sm font-semibold">
                {contest.votingStartDate?.seconds
                  ? new Date(contest.votingStartDate.seconds * 1000).toLocaleDateString()
                  : new Date(contest.votingStartDate).toLocaleDateString()}
              </p>
            </div>
            <div className="bg-gray-900/50 rounded-lg p-3">
              <p className="text-xs text-gray-500">Voting Ends</p>
              <p className="text-sm font-semibold">
                {contest.votingEndDate?.seconds
                  ? new Date(contest.votingEndDate.seconds * 1000).toLocaleDateString()
                  : new Date(contest.votingEndDate).toLocaleDateString()}
              </p>
            </div>
            <div className="bg-gray-900/50 rounded-lg p-3">
              <p className="text-xs text-gray-500">Word Limit</p>
              <p className="text-sm font-semibold">
                {contest.minWordCount}-{contest.maxWordCount}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Status Messages */}
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

      {contest.status === 'upcoming' && (
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="bg-gray-900 border border-gray-700 rounded-lg p-6 text-center">
            <Clock className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Contest Coming Soon</h2>
            <p className="text-gray-300">
              Submissions will open on {' '}
              {contest.submissionStartDate?.seconds 
                ? new Date(contest.submissionStartDate.seconds * 1000).toLocaleDateString()
                : new Date(contest.submissionStartDate).toLocaleDateString()}
            </p>
          </div>
        </div>
      )}

      {contest.status === 'judging' && (
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-6 text-center">
            <Award className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Judging in Progress</h2>
            <p className="text-gray-300">
              Voting has ended. Winners will be announced soon!
            </p>
          </div>
        </div>
      )}

      {contest.status === 'completed' && (
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-6 text-center">
            <Trophy className="w-12 h-12 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Contest Complete</h2>
            <p className="text-gray-300">
              This contest has ended. Check back for future contests!
            </p>
          </div>
        </div>
      )}

      {/* Voting Section */}
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
              
              {/* Vote Packages - Better value for bulk purchases */}
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

          {/* Leaderboard */}
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
                Top 5
              </h2>
              
              <div className="bg-gradient-to-b from-yellow-900/20 to-gray-900 rounded-xl p-6 space-y-4">
                {leaderboard.map((submission, index) => (
                  <div key={submission.id} className="flex items-center gap-3">
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
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Prizes Section */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <Award className="w-6 h-6 text-yellow-500" />
          Contest Prizes
        </h2>
        
        <div className="grid md:grid-cols-3 gap-6">
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="bg-gradient-to-b from-yellow-900/30 to-gray-900 rounded-xl p-6 border border-yellow-500/30"
          >
            <div className="text-center mb-4">
              <Trophy className="w-16 h-16 text-yellow-500 mx-auto" />
              <h3 className="text-xl font-bold mt-2">1st Place</h3>
            </div>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <Star className="w-4 h-4 text-yellow-500" />
                {contest.prizes.first.credits} Credits
              </li>
              {contest.prizes.first.production && (
                <li className="flex items-center gap-2">
                  <Star className="w-4 h-4 text-yellow-500" />
                  Professional Audio Production
                </li>
              )}
              {contest.prizes.first.royaltyPercentage && (
                <li className="flex items-center gap-2">
                  <Star className="w-4 h-4 text-yellow-500" />
                  {contest.prizes.first.royaltyPercentage}% Revenue Share
                </li>
              )}
            </ul>
          </motion.div>
          
          {contest.prizes.second && (
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="bg-gradient-to-b from-gray-600/30 to-gray-900 rounded-xl p-6 border border-gray-500/30"
            >
              <div className="text-center mb-4">
                <Trophy className="w-16 h-16 text-gray-300 mx-auto" />
                <h3 className="text-xl font-bold mt-2">2nd Place</h3>
              </div>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <Star className="w-4 h-4 text-gray-300" />
                  {contest.prizes.second.credits} Credits
                </li>
              </ul>
            </motion.div>
          )}
          
          {contest.prizes.third && (
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="bg-gradient-to-b from-orange-900/30 to-gray-900 rounded-xl p-6 border border-orange-500/30"
            >
              <div className="text-center mb-4">
                <Trophy className="w-16 h-16 text-orange-600 mx-auto" />
                <h3 className="text-xl font-bold mt-2">3rd Place</h3>
              </div>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <Star className="w-4 h-4 text-orange-600" />
                  {contest.prizes.third.credits} Credits
                </li>
              </ul>
            </motion.div>
          )}
        </div>
      </div>

      {/* Story Preview Modal */}
      <AnimatePresence>
        {selectedStory && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedStory(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-gray-900 rounded-xl p-6 max-w-3xl max-h-[80vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-2xl font-bold">{selectedStory.title}</h3>
                  <p className="text-gray-400">by {selectedStory.authorName}</p>
                </div>
                <button
                  onClick={() => setSelectedStory(null)}
                  className="text-gray-400 hover:text-white"
                >
                  ×
                </button>
              </div>
              
              <div className="prose prose-invert max-w-none">
                <h4 className="text-lg font-semibold mb-3">Synopsis</h4>
                <p className="text-gray-300 mb-6">{selectedStory.synopsis}</p>
                
                <h4 className="text-lg font-semibold mb-3">First Chapter</h4>
                <div className="text-gray-300 whitespace-pre-wrap">
                  {selectedStory.content.substring(0, 1500)}...
                </div>
              </div>
              
              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setSelectedStory(null)}
                  className="px-6 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}