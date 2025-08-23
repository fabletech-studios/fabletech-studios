'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Plus, 
  Edit, 
  Trophy, 
  Calendar, 
  Users, 
  Eye, 
  ChevronRight,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';
import { Contest, getContestPhaseLabel, getContestPhaseColor } from '@/lib/types/contest';

export default function AdminContestsPage() {
  const router = useRouter();
  const [contests, setContests] = useState<Contest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    fetchContests();
  }, [filter]);

  const fetchContests = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filter !== 'all') params.append('status', filter);
      
      const response = await fetch(`/api/admin/contests?${params}`);
      const data = await response.json();
      
      if (data.success) {
        // Convert date strings to Date objects
        const contestsWithDates = data.contests.map((contest: any) => ({
          ...contest,
          createdAt: new Date(contest.createdAt),
          updatedAt: new Date(contest.updatedAt),
          dates: contest.dates ? {
            announced: contest.dates.announced ? new Date(contest.dates.announced) : null,
            submissionStart: contest.dates.submissionStart ? new Date(contest.dates.submissionStart) : null,
            submissionEnd: contest.dates.submissionEnd ? new Date(contest.dates.submissionEnd) : null,
            votingStart: contest.dates.votingStart ? new Date(contest.dates.votingStart) : null,
            votingEnd: contest.dates.votingEnd ? new Date(contest.dates.votingEnd) : null,
            winnersAnnounced: contest.dates.winnersAnnounced ? new Date(contest.dates.winnersAnnounced) : null,
          } : {}
        }));
        setContests(contestsWithDates);
      }
    } catch (error) {
      console.error('Error fetching contests:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'draft': return <Edit className="w-4 h-4" />;
      case 'upcoming': return <Clock className="w-4 h-4" />;
      case 'submission': return <AlertCircle className="w-4 h-4" />;
      case 'voting': return <Users className="w-4 h-4" />;
      case 'ended': return <XCircle className="w-4 h-4" />;
      case 'announced': return <Trophy className="w-4 h-4" />;
      default: return <AlertCircle className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-500';
      case 'upcoming': return 'bg-blue-500';
      case 'submission': return 'bg-green-500';
      case 'voting': return 'bg-purple-500';
      case 'ended': return 'bg-orange-500';
      case 'announced': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Contest Management</h1>
              <p className="text-gray-600 mt-2">Create and manage writing contests</p>
            </div>
            <Link
              href="/admin/contests/create"
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Create Contest
            </Link>
          </div>

          {/* Filters */}
          <div className="flex gap-2 flex-wrap">
            {['all', 'draft', 'upcoming', 'submission', 'voting', 'ended', 'announced'].map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filter === status
                    ? 'bg-purple-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Contest List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
            <p className="text-gray-600 mt-4">Loading contests...</p>
          </div>
        ) : contests.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <Trophy className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">No contests found</h2>
            <p className="text-gray-600 mb-6">
              {filter === 'all' 
                ? "You haven't created any contests yet." 
                : `No contests with status "${filter}".`}
            </p>
            <Link
              href="/admin/contests/create"
              className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Create Your First Contest
            </Link>
          </div>
        ) : (
          <div className="grid gap-6">
            {contests.map((contest) => (
              <div key={contest.id} className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow">
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-semibold text-gray-900">{contest.title}</h3>
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold text-white ${getStatusColor(contest.status)}`}>
                          {getStatusIcon(contest.status)}
                          {getContestPhaseLabel(contest.status)}
                        </span>
                        {contest.featured && (
                          <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-semibold rounded-full">
                            Featured
                          </span>
                        )}
                      </div>
                      <p className="text-gray-600">{contest.shortDescription}</p>
                    </div>
                    <Link
                      href={`/admin/contests/${contest.id}/edit`}
                      className="p-2 text-gray-600 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                    >
                      <Edit className="w-5 h-5" />
                    </Link>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-4 gap-4 mb-4">
                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="flex items-center gap-2 text-gray-600 text-sm mb-1">
                        <Edit className="w-4 h-4" />
                        Submissions
                      </div>
                      <p className="text-2xl font-bold text-gray-900">{contest.stats?.totalSubmissions || 0}</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="flex items-center gap-2 text-gray-600 text-sm mb-1">
                        <Users className="w-4 h-4" />
                        Votes
                      </div>
                      <p className="text-2xl font-bold text-gray-900">{contest.stats?.totalVotes || 0}</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="flex items-center gap-2 text-gray-600 text-sm mb-1">
                        <Users className="w-4 h-4" />
                        Participants
                      </div>
                      <p className="text-2xl font-bold text-gray-900">{contest.stats?.totalParticipants || 0}</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="flex items-center gap-2 text-gray-600 text-sm mb-1">
                        <Eye className="w-4 h-4" />
                        Views
                      </div>
                      <p className="text-2xl font-bold text-gray-900">{contest.stats?.totalViews || 0}</p>
                    </div>
                  </div>

                  {/* Dates */}
                  {contest.dates && contest.dates.submissionStart && contest.dates.votingStart && (
                    <div className="flex items-center gap-6 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>
                          Submissions: {contest.dates.submissionStart.toLocaleDateString()} - {contest.dates.submissionEnd?.toLocaleDateString() || 'TBD'}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        <span>
                          Voting: {contest.dates.votingStart.toLocaleDateString()} - {contest.dates.votingEnd?.toLocaleDateString() || 'TBD'}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-3 mt-4 pt-4 border-t">
                    <Link
                      href={`/admin/contests/${contest.id}/submissions`}
                      className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      View Submissions
                      <ChevronRight className="w-4 h-4" />
                    </Link>
                    <Link
                      href={`/contest/${contest.slug}`}
                      target="_blank"
                      className="flex items-center gap-2 px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors"
                    >
                      View Public Page
                      <Eye className="w-4 h-4" />
                    </Link>
                    {contest.status === 'ended' && !contest.winners && (
                      <Link
                        href={`/admin/contests/${contest.id}/announce-winners`}
                        className="flex items-center gap-2 px-4 py-2 bg-yellow-100 text-yellow-700 rounded-lg hover:bg-yellow-200 transition-colors"
                      >
                        <Trophy className="w-4 h-4" />
                        Announce Winners
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}