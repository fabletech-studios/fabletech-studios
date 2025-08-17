'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  collection,
  doc,
  getDocs,
  addDoc,
  updateDoc,
  query,
  orderBy,
  where,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { Contest, ContestSubmission } from '@/lib/types/contest.types';
import {
  Trophy,
  Plus,
  Edit,
  Eye,
  EyeOff,
  Check,
  X,
  Clock,
  Users,
  BookOpen,
  BarChart3,
  Download,
  Settings,
  Award,
  TrendingUp,
  Calendar,
  AlertCircle,
  Copy,
  Sparkles,
  MoreVertical,
  Trash2,
  Archive
} from 'lucide-react';
import { motion } from 'framer-motion';

export default function AdminContestPage() {
  const router = useRouter();
  const [contests, setContests] = useState<Contest[]>([]);
  const [selectedContest, setSelectedContest] = useState<Contest | null>(null);
  const [submissions, setSubmissions] = useState<ContestSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editingContest, setEditingContest] = useState<Contest | null>(null);
  const [showActionsMenu, setShowActionsMenu] = useState<string | null>(null);
  const [permissionError, setPermissionError] = useState(false);
  const [stats, setStats] = useState({
    totalSubmissions: 0,
    approvedSubmissions: 0,
    pendingReview: 0,
    rejectedSubmissions: 0,
    totalVotes: 0,
    uniqueVoters: 0,
    creditRevenue: 0,
    avgVotesPerSubmission: 0,
    topGenre: '',
    engagementRate: 0
  });
  const [bulkAction, setBulkAction] = useState<'approve' | 'reject' | ''>('');
  const [selectedSubmissions, setSelectedSubmissions] = useState<Set<string>>(new Set());

  // New contest form
  const [newContest, setNewContest] = useState({
    title: '',
    description: '',
    theme: '',
    status: 'upcoming' as Contest['status'],
    submissionStartDate: '',
    submissionEndDate: '',
    votingStartDate: '',
    votingEndDate: '',
    minWordCount: 5000,
    maxWordCount: 10000,
    prizes: {
      first: { credits: 1000, production: true, royaltyPercentage: 20 },
      second: { credits: 500, production: false },
      third: { credits: 200, production: false }
    }
  });

  useEffect(() => {
    checkAdminAndLoadData();
  }, []);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setShowActionsMenu(null);
    };
    
    if (showActionsMenu) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [showActionsMenu]);

  const setupAdminAccess = async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        alert('Please log in first');
        router.push('/login');
        return;
      }
      
      const response = await fetch('/api/admin/setup-admin', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const result = await response.json();
      
      if (result.success) {
        alert('Admin access granted! Refreshing...');
        setPermissionError(false);
        await loadContests();
      } else {
        alert(result.error || 'Failed to setup admin access');
      }
    } catch (error) {
      console.error('Setup admin error:', error);
      alert('Error setting up admin access');
    }
  };

  const checkAdminAndLoadData = async () => {
    // Temporarily allow all authenticated users
    setIsAdmin(true);
    await loadContests();
  };

  const loadContests = async () => {
    try {
      setLoading(true);
      
      // Use server-side endpoint to bypass Firestore rules
      const response = await fetch('/api/admin/get-contests');
      const result = await response.json();
      
      if (result.success) {
        const contestList = result.contests as Contest[];
        setContests(contestList);
        
        // Load first contest's submissions by default
        if (contestList.length > 0) {
          await loadContestDetails(contestList[0]);
        }
      } else {
        console.error('Error loading contests:', result.error);
        // Try client-side as fallback
        try {
          const q = query(collection(db, 'contests'), orderBy('createdAt', 'desc'));
          const snapshot = await getDocs(q);
          
          const contestList = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          } as Contest));
          
          setContests(contestList);
          
          if (contestList.length > 0) {
            await loadContestDetails(contestList[0]);
          }
        } catch (clientError) {
          console.error('Client-side fallback also failed:', clientError);
        }
      }
    } catch (error: any) {
      console.error('Error loading contests:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadContestDetails = async (contest: Contest) => {
    setSelectedContest(contest);
    
    try {
      // Load submissions using server-side endpoint
      const response = await fetch(`/api/admin/get-submissions?contestId=${contest.id}`);
      const result = await response.json();
      
      if (result.success) {
        const subs = result.submissions || [];
        setSubmissions(subs);
        
        // Calculate enhanced stats
        const approved = subs.filter((s: any) => s.isApproved);
        const pending = subs.filter((s: any) => s.status === 'submitted' && !s.isApproved);
        const rejected = subs.filter((s: any) => s.status === 'rejected');
        const totalVotes = subs.reduce((sum: number, s: any) => sum + (s.votes?.total || 0), 0);
        
        // Calculate genre distribution
        const genreCounts: Record<string, number> = {};
        subs.forEach((s: any) => {
          if (s.genre && Array.isArray(s.genre)) {
            s.genre.forEach((g: string) => {
              genreCounts[g] = (genreCounts[g] || 0) + 1;
            });
          }
        });
        const topGenre = Object.entries(genreCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';
        
        setStats({
          totalSubmissions: subs.length,
          approvedSubmissions: approved.length,
          pendingReview: pending.length,
          rejectedSubmissions: rejected.length,
          totalVotes,
          uniqueVoters: 0, // Would need to query votes collection
          creditRevenue: 0, // Would need to track this
          avgVotesPerSubmission: subs.length > 0 ? Math.round(totalVotes / subs.length) : 0,
          topGenre,
          engagementRate: subs.length > 0 ? Math.round((totalVotes / (subs.length * 10)) * 100) : 0
        });
      } else {
        console.error('Error loading submissions:', result.error);
      }
    } catch (error) {
      console.error('Error loading contest details:', error);
    }
  };

  const createContest = async () => {
    try {
      const contestData = {
        ...newContest,
        submissionStartDate: new Date(newContest.submissionStartDate),
        submissionEndDate: new Date(newContest.submissionEndDate),
        votingStartDate: new Date(newContest.votingStartDate),
        votingEndDate: new Date(newContest.votingEndDate)
      };
      
      // Use server-side endpoint to bypass Firestore rules
      const response = await fetch('/api/admin/create-contest', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(contestData)
      });
      
      const result = await response.json();
      
      if (result.success) {
        setShowCreateForm(false);
        await loadContests();
      } else {
        alert('Failed to create contest: ' + result.error);
      }
    } catch (error) {
      console.error('Error creating contest:', error);
      alert('Error creating contest');
    }
  };

  const updateContestStatus = async (contestId: string, newStatus: Contest['status']) => {
    try {
      // Use server-side endpoint to bypass Firestore rules
      const response = await fetch('/api/admin/update-contest-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ contestId, status: newStatus })
      });
      
      const result = await response.json();
      
      if (result.success) {
        await loadContests();
      } else {
        alert('Failed to update status: ' + result.error);
      }
    } catch (error) {
      console.error('Error updating contest status:', error);
      alert('Error updating contest status');
    }
  };

  const approveSubmission = async (submissionId: string, approved: boolean) => {
    try {
      const response = await fetch('/api/admin/get-submissions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          submissionId,
          action: approved ? 'approve' : 'reject'
        })
      });
      
      const result = await response.json();
      
      if (result.success && selectedContest) {
        await loadContestDetails(selectedContest);
      } else {
        alert('Failed to update submission: ' + result.error);
      }
    } catch (error) {
      console.error('Error updating submission:', error);
    }
  };

  const declareWinner = async (submissionId: string, place: 'winner' | 'finalist') => {
    try {
      const response = await fetch('/api/admin/get-submissions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          submissionId,
          action: 'declare-winner',
          data: { place }
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        // TODO: Trigger winner notification and prize distribution
        if (selectedContest) {
          await loadContestDetails(selectedContest);
        }
      } else {
        alert('Failed to declare winner: ' + result.error);
      }
    } catch (error) {
      console.error('Error declaring winner:', error);
    }
  };

  const handleBulkAction = async () => {
    if (!bulkAction || selectedSubmissions.size === 0) {
      alert('Please select submissions and an action');
      return;
    }
    
    const confirmMsg = `Are you sure you want to ${bulkAction} ${selectedSubmissions.size} submissions?`;
    if (!confirm(confirmMsg)) return;
    
    try {
      for (const submissionId of selectedSubmissions) {
        await fetch('/api/admin/get-submissions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            submissionId,
            action: bulkAction
          })
        });
      }
      
      // Clear selections and reload
      setSelectedSubmissions(new Set());
      setBulkAction('');
      if (selectedContest) {
        await loadContestDetails(selectedContest);
      }
      alert(`Successfully ${bulkAction}d ${selectedSubmissions.size} submissions`);
    } catch (error) {
      console.error('Error with bulk action:', error);
      alert('Failed to perform bulk action');
    }
  };

  const toggleSubmissionSelection = (submissionId: string) => {
    const newSelection = new Set(selectedSubmissions);
    if (newSelection.has(submissionId)) {
      newSelection.delete(submissionId);
    } else {
      newSelection.add(submissionId);
    }
    setSelectedSubmissions(newSelection);
  };

  const selectAllSubmissions = () => {
    if (selectedSubmissions.size === submissions.length) {
      setSelectedSubmissions(new Set());
    } else {
      setSelectedSubmissions(new Set(submissions.map(s => s.id)));
    }
  };

  const duplicateContest = async (contestId: string) => {
    if (!confirm('Duplicate this contest as a template for a new one?')) return;
    
    try {
      const response = await fetch('/api/admin/duplicate-contest', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ contestId })
      });
      
      const result = await response.json();
      
      if (result.success) {
        await loadContests();
        alert('Contest duplicated successfully!');
      } else {
        alert('Failed to duplicate contest: ' + result.error);
      }
    } catch (error) {
      console.error('Error duplicating contest:', error);
      alert('Error duplicating contest');
    }
  };

  const startEditContest = (contest: Contest) => {
    setEditingContest(contest);
    setNewContest({
      title: contest.title,
      description: contest.description,
      theme: contest.theme || '',
      status: contest.status,
      submissionStartDate: contest.submissionStartDate?.seconds 
        ? new Date(contest.submissionStartDate.seconds * 1000).toISOString().split('T')[0]
        : '',
      submissionEndDate: contest.submissionEndDate?.seconds
        ? new Date(contest.submissionEndDate.seconds * 1000).toISOString().split('T')[0]
        : '',
      votingStartDate: contest.votingStartDate?.seconds
        ? new Date(contest.votingStartDate.seconds * 1000).toISOString().split('T')[0]
        : '',
      votingEndDate: contest.votingEndDate?.seconds
        ? new Date(contest.votingEndDate.seconds * 1000).toISOString().split('T')[0]
        : '',
      minWordCount: contest.minWordCount || 5000,
      maxWordCount: contest.maxWordCount || 10000,
      prizes: contest.prizes || {
        first: { credits: 1000, production: true, royaltyPercentage: 20 },
        second: { credits: 500, production: false },
        third: { credits: 200, production: false }
      }
    });
    setShowEditForm(true);
    setShowActionsMenu(null);
  };

  const saveEditedContest = async () => {
    if (!editingContest) return;
    
    try {
      const updates = {
        title: newContest.title,
        description: newContest.description,
        theme: newContest.theme,
        status: newContest.status,
        submissionStartDate: new Date(newContest.submissionStartDate),
        submissionEndDate: new Date(newContest.submissionEndDate),
        votingStartDate: new Date(newContest.votingStartDate),
        votingEndDate: new Date(newContest.votingEndDate),
        minWordCount: newContest.minWordCount,
        maxWordCount: newContest.maxWordCount,
        prizes: newContest.prizes
      };
      
      const response = await fetch('/api/admin/edit-contest', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ contestId: editingContest.id, updates })
      });
      
      const result = await response.json();
      
      if (result.success) {
        setShowEditForm(false);
        setEditingContest(null);
        await loadContests();
        alert('Contest updated successfully!');
      } else {
        alert('Failed to update contest: ' + result.error);
      }
    } catch (error) {
      console.error('Error updating contest:', error);
      alert('Error updating contest');
    }
  };

  const deleteContest = async (contestId: string) => {
    if (!confirm('Are you sure you want to delete this contest? This action cannot be undone.')) return;
    
    try {
      const response = await fetch(`/api/admin/edit-contest?contestId=${contestId}`, {
        method: 'DELETE'
      });
      
      const result = await response.json();
      
      if (result.success) {
        await loadContests();
        if (selectedContest?.id === contestId) {
          setSelectedContest(null);
          setSubmissions([]);
        }
        alert('Contest deleted successfully!');
      } else {
        alert(result.error || 'Failed to delete contest');
      }
    } catch (error) {
      console.error('Error deleting contest:', error);
      alert('Error deleting contest');
    }
    setShowActionsMenu(null);
  };

  const exportSubmissions = () => {
    // Create CSV export
    const csv = [
      ['Title', 'Author', 'Genre', 'Word Count', 'Votes', 'Status'],
      ...submissions.map(s => [
        s.title,
        s.authorName,
        s.genre.join(', '),
        s.wordCount.toString(),
        s.votes.total.toString(),
        s.status
      ])
    ].map(row => row.join(',')).join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `contest-${selectedContest?.id}-submissions.csv`;
    a.click();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    );
  }

  // Temporarily disabled admin check
  // if (!isAdmin) {
  //   return (
  //     <div className="min-h-screen bg-black text-white flex items-center justify-center">
  //       <div className="text-center">
  //         <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
  //         <h1 className="text-2xl font-bold">Admin Access Required</h1>
  //       </div>
  //     </div>
  //   );
  // }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="bg-gray-900 border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <Trophy className="w-8 h-8 text-yellow-500" />
              Contest Admin Dashboard
            </h1>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Permission Error */}
        {permissionError && (
          <div className="mb-8 p-6 bg-red-900/20 border border-red-500/30 rounded-lg">
            <div className="flex items-start gap-4">
              <AlertCircle className="w-6 h-6 text-red-500 mt-1" />
              <div className="flex-1">
                <h3 className="text-lg font-semibold mb-2">Admin Access Required</h3>
                <p className="text-gray-300 mb-4">
                  You need admin permissions to manage contests. If you are the admin, click the button below to set up your access.
                </p>
                <button
                  onClick={setupAdminAccess}
                  className="px-6 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
                >
                  Setup Admin Access
                </button>
              </div>
            </div>
          </div>
        )}
        {/* Contest List */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Contests</h2>
            <button
              onClick={() => setShowCreateForm(true)}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Create Contest
            </button>
          </div>
          
          <div className="grid md:grid-cols-3 gap-4">
            {contests.map(contest => (
              <div
                key={contest.id}
                onClick={() => loadContestDetails(contest)}
                className={`bg-gray-900 rounded-lg shadow p-4 cursor-pointer hover:shadow-lg transition-shadow border border-gray-800 ${
                  selectedContest?.id === contest.id ? 'ring-2 ring-red-500' : ''
                }`}
              >
                <h3 className="font-semibold mb-2">{contest.title}</h3>
                <p className="text-sm text-gray-400 mb-3">{contest.description}</p>
                <div className="flex items-center justify-between">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    contest.status === 'submission' ? 'bg-green-100 text-green-800' :
                    contest.status === 'voting' ? 'bg-blue-100 text-blue-800' :
                    contest.status === 'completed' ? 'bg-gray-100 text-gray-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {contest.status}
                  </span>
                  <div className="relative">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowActionsMenu(showActionsMenu === contest.id ? null : contest.id);
                      }}
                      className="text-gray-400 hover:text-white p-1 rounded hover:bg-gray-700"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>
                    
                    {showActionsMenu === contest.id && (
                      <div className="absolute right-0 top-8 bg-gray-800 border border-gray-700 rounded-lg shadow-lg z-10 py-2 w-48">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            startEditContest(contest);
                          }}
                          className="w-full text-left px-4 py-2 hover:bg-gray-700 flex items-center gap-2"
                        >
                          <Edit className="w-4 h-4" />
                          Edit Contest
                        </button>
                        
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            duplicateContest(contest.id);
                          }}
                          className="w-full text-left px-4 py-2 hover:bg-gray-700 flex items-center gap-2"
                        >
                          <Copy className="w-4 h-4" />
                          Duplicate
                        </button>
                        
                        <hr className="my-2 border-gray-700" />
                        
                        <div className="px-4 py-2">
                          <label className="text-xs text-gray-400">Change Status:</label>
                          <select
                            onClick={(e) => e.stopPropagation()}
                            onChange={(e) => {
                              updateContestStatus(contest.id, e.target.value as Contest['status']);
                              setShowActionsMenu(null);
                            }}
                            value={contest.status}
                            className="w-full mt-1 px-2 py-1 bg-gray-700 border border-gray-600 rounded text-sm"
                          >
                            <option value="upcoming">Upcoming</option>
                            <option value="submission">Accepting Submissions</option>
                            <option value="voting">Voting Open</option>
                            <option value="judging">Judging</option>
                            <option value="completed">Completed</option>
                            <option value="archived">Archived</option>
                          </select>
                        </div>
                        
                        <hr className="my-2 border-gray-700" />
                        
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteContest(contest.id);
                          }}
                          className="w-full text-left px-4 py-2 hover:bg-red-900/30 text-red-400 flex items-center gap-2"
                        >
                          <Trash2 className="w-4 h-4" />
                          Delete Contest
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Contest Details */}
        {selectedContest && (
          <div className="space-y-6">
            {/* Enhanced Stats Dashboard */}
            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-purple-500" />
                Contest Analytics
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              <div className="bg-gray-900 rounded-lg shadow p-4 border border-gray-800">
                <div className="flex items-center justify-between">
                  <BookOpen className="w-8 h-8 text-blue-500" />
                  <span className="text-2xl font-bold">{stats.totalSubmissions}</span>
                </div>
                <p className="text-sm text-gray-400 mt-2">Total Submissions</p>
              </div>
              
              <div className="bg-gray-900 rounded-lg shadow p-4 border border-gray-800">
                <div className="flex items-center justify-between">
                  <Check className="w-8 h-8 text-green-500" />
                  <span className="text-2xl font-bold">{stats.approvedSubmissions}</span>
                </div>
                <p className="text-sm text-gray-400 mt-2">Approved</p>
              </div>
              
              <div className="bg-gray-900 rounded-lg shadow p-4 border border-gray-800">
                <div className="flex items-center justify-between">
                  <BarChart3 className="w-8 h-8 text-purple-500" />
                  <span className="text-2xl font-bold">{stats.totalVotes}</span>
                </div>
                <p className="text-sm text-gray-400 mt-2">Total Votes</p>
              </div>
              
              <div className="bg-gray-900 rounded-lg shadow p-4 border border-gray-800">
                <div className="flex items-center justify-between">
                  <Users className="w-8 h-8 text-orange-500" />
                  <span className="text-2xl font-bold">{stats.uniqueVoters}</span>
                </div>
                <p className="text-sm text-gray-400 mt-2">Unique Voters</p>
              </div>
              
              <div className="bg-gray-900 rounded-lg shadow p-4 border border-gray-800">
                <div className="flex items-center justify-between">
                  <TrendingUp className="w-8 h-8 text-green-500" />
                  <span className="text-2xl font-bold">${stats.creditRevenue}</span>
                </div>
                <p className="text-sm text-gray-400 mt-2">Credit Revenue</p>
              </div>
            </div>
            
            {/* Additional Analytics Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
              <div className="bg-gray-900 rounded-lg shadow p-4 border border-gray-800">
                <div className="flex items-center justify-between">
                  <Clock className="w-6 h-6 text-yellow-500" />
                  <span className="text-xl font-bold">{stats.pendingReview}</span>
                </div>
                <p className="text-sm text-gray-400 mt-2">Pending Review</p>
              </div>
              
              <div className="bg-gray-900 rounded-lg shadow p-4 border border-gray-800">
                <div className="flex items-center justify-between">
                  <X className="w-6 h-6 text-red-500" />
                  <span className="text-xl font-bold">{stats.rejectedSubmissions}</span>
                </div>
                <p className="text-sm text-gray-400 mt-2">Rejected</p>
              </div>
              
              <div className="bg-gray-900 rounded-lg shadow p-4 border border-gray-800">
                <div className="flex items-center justify-between">
                  <BarChart3 className="w-6 h-6 text-cyan-500" />
                  <span className="text-xl font-bold">{stats.avgVotesPerSubmission}</span>
                </div>
                <p className="text-sm text-gray-400 mt-2">Avg Votes/Story</p>
              </div>
              
              <div className="bg-gray-900 rounded-lg shadow p-4 border border-gray-800">
                <div className="flex items-center justify-between">
                  <Sparkles className="w-6 h-6 text-pink-500" />
                  <span className="text-xl font-bold">{stats.topGenre}</span>
                </div>
                <p className="text-sm text-gray-400 mt-2">Top Genre</p>
              </div>
            </div>
            </div>

            {/* Submissions Table with Bulk Actions */}
            <div className="bg-gray-900 rounded-lg shadow overflow-hidden border border-gray-800">
              <div className="px-6 py-4 border-b">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Submissions Management</h3>
                  <button
                    onClick={exportSubmissions}
                    className="px-3 py-1 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Export CSV
                  </button>
                </div>
                
                {/* Bulk Actions Bar */}
                {selectedSubmissions.size > 0 && (
                  <div className="bg-purple-900/20 border border-purple-500/30 rounded-lg p-3 flex items-center justify-between">
                    <span className="text-sm">
                      {selectedSubmissions.size} submission{selectedSubmissions.size !== 1 ? 's' : ''} selected
                    </span>
                    <div className="flex items-center gap-3">
                      <select
                        value={bulkAction}
                        onChange={(e) => setBulkAction(e.target.value as any)}
                        className="px-3 py-1 bg-gray-800 border border-gray-700 rounded text-sm"
                      >
                        <option value="">Select Action</option>
                        <option value="approve">Approve All</option>
                        <option value="reject">Reject All</option>
                      </select>
                      <button
                        onClick={handleBulkAction}
                        disabled={!bulkAction}
                        className="px-3 py-1 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 rounded text-sm"
                      >
                        Apply
                      </button>
                      <button
                        onClick={() => setSelectedSubmissions(new Set())}
                        className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-sm"
                      >
                        Clear
                      </button>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-800">
                    <tr>
                      <th className="px-6 py-3 text-center">
                        <input
                          type="checkbox"
                          checked={selectedSubmissions.size === submissions.length && submissions.length > 0}
                          onChange={selectAllSubmissions}
                          className="rounded border-gray-600 bg-gray-700"
                        />
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        Title / Author
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        Genre
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        Words
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        Votes
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-gray-900 divide-y divide-gray-700">
                    {submissions.map(submission => (
                      <tr key={submission.id} className="hover:bg-gray-800">
                        <td className="px-6 py-3 text-center">
                          <input
                            type="checkbox"
                            checked={selectedSubmissions.has(submission.id)}
                            onChange={() => toggleSubmissionSelection(submission.id)}
                            className="rounded border-gray-600 bg-gray-700"
                          />
                        </td>
                        <td className="px-6 py-4">
                          <div>
                            <div className="text-sm font-medium text-white">
                              {submission.title}
                            </div>
                            <div className="text-sm text-gray-500">
                              by {submission.authorName}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-400">
                          {submission.genre.join(', ')}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-400">
                          {submission.wordCount.toLocaleString()}
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-white">
                            {submission.votes.total}
                          </div>
                          <div className="text-xs text-gray-500">
                            F:{submission.votes.free} P:{submission.votes.premium} S:{submission.votes.super}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            submission.status === 'winner' ? 'bg-yellow-100 text-yellow-800' :
                            submission.status === 'finalist' ? 'bg-purple-100 text-purple-800' :
                            submission.isApproved ? 'bg-green-100 text-green-800' :
                            submission.status === 'rejected' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {submission.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <div className="flex items-center gap-2">
                            {!submission.isApproved && submission.status === 'submitted' && (
                              <>
                                <button
                                  onClick={() => approveSubmission(submission.id, true)}
                                  className="text-green-600 hover:text-green-800"
                                  title="Approve"
                                >
                                  <Check className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => approveSubmission(submission.id, false)}
                                  className="text-red-600 hover:text-red-800"
                                  title="Reject"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </>
                            )}
                            
                            {submission.isApproved && selectedContest.status === 'judging' && (
                              <button
                                onClick={() => declareWinner(submission.id, 'winner')}
                                className="text-yellow-600 hover:text-yellow-800"
                                title="Declare Winner"
                              >
                                <Award className="w-4 h-4" />
                              </button>
                            )}
                            
                            <button
                              onClick={() => window.open(`/contest/submission/${submission.id}`, '_blank')}
                              className="text-blue-600 hover:text-blue-800"
                              title="View"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Edit Contest Modal */}
        {showEditForm && editingContest && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-gray-900 rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-gray-800">
              <h2 className="text-2xl font-bold mb-4">Edit Contest</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Contest Status
                  </label>
                  <select
                    value={newContest.status}
                    onChange={(e) => setNewContest(prev => ({ ...prev, status: e.target.value as Contest['status'] }))}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-red-500 text-white"
                  >
                    <option value="upcoming">Upcoming</option>
                    <option value="submission">Accepting Submissions</option>
                    <option value="voting">Voting Open</option>
                    <option value="judging">Judging</option>
                    <option value="completed">Completed</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Contest Title
                  </label>
                  <input
                    type="text"
                    value={newContest.title}
                    onChange={(e) => setNewContest(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-red-500 text-white"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Description
                  </label>
                  <textarea
                    value={newContest.description}
                    onChange={(e) => setNewContest(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-red-500 text-white"
                    rows={3}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Theme (optional)
                  </label>
                  <input
                    type="text"
                    value={newContest.theme}
                    onChange={(e) => setNewContest(prev => ({ ...prev, theme: e.target.value }))}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-red-500 text-white"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Submission Start
                    </label>
                    <input
                      type="date"
                      value={newContest.submissionStartDate}
                      onChange={(e) => setNewContest(prev => ({ ...prev, submissionStartDate: e.target.value }))}
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-red-500 text-white"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Submission End
                    </label>
                    <input
                      type="date"
                      value={newContest.submissionEndDate}
                      onChange={(e) => setNewContest(prev => ({ ...prev, submissionEndDate: e.target.value }))}
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-red-500 text-white"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Voting Start
                    </label>
                    <input
                      type="date"
                      value={newContest.votingStartDate}
                      onChange={(e) => setNewContest(prev => ({ ...prev, votingStartDate: e.target.value }))}
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-red-500 text-white"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Voting End
                    </label>
                    <input
                      type="date"
                      value={newContest.votingEndDate}
                      onChange={(e) => setNewContest(prev => ({ ...prev, votingEndDate: e.target.value }))}
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-red-500 text-white"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Min Word Count
                    </label>
                    <input
                      type="number"
                      value={newContest.minWordCount}
                      onChange={(e) => setNewContest(prev => ({ ...prev, minWordCount: parseInt(e.target.value) }))}
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-red-500 text-white"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Max Word Count
                    </label>
                    <input
                      type="number"
                      value={newContest.maxWordCount}
                      onChange={(e) => setNewContest(prev => ({ ...prev, maxWordCount: parseInt(e.target.value) }))}
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-red-500 text-white"
                    />
                  </div>
                </div>
                
                <div className="flex justify-end gap-3 mt-6">
                  <button
                    onClick={() => {
                      setShowEditForm(false);
                      setEditingContest(null);
                    }}
                    className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-white"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={saveEditedContest}
                    className="px-4 py-2 bg-red-600 text-white hover:bg-red-700 rounded-lg"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Create Contest Modal */}
        {showCreateForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-gray-900 rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-gray-800">
              <h2 className="text-2xl font-bold mb-4">Create New Contest</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Contest Title
                  </label>
                  <input
                    type="text"
                    value={newContest.title}
                    onChange={(e) => setNewContest(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-red-500 text-white"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Description
                  </label>
                  <textarea
                    value={newContest.description}
                    onChange={(e) => setNewContest(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-red-500 text-white"
                    rows={3}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Theme (optional)
                  </label>
                  <input
                    type="text"
                    value={newContest.theme}
                    onChange={(e) => setNewContest(prev => ({ ...prev, theme: e.target.value }))}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-red-500 text-white"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Submission Start
                    </label>
                    <input
                      type="date"
                      value={newContest.submissionStartDate}
                      onChange={(e) => setNewContest(prev => ({ ...prev, submissionStartDate: e.target.value }))}
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-red-500 text-white"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Submission End
                    </label>
                    <input
                      type="date"
                      value={newContest.submissionEndDate}
                      onChange={(e) => setNewContest(prev => ({ ...prev, submissionEndDate: e.target.value }))}
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-red-500 text-white"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Voting Start
                    </label>
                    <input
                      type="date"
                      value={newContest.votingStartDate}
                      onChange={(e) => setNewContest(prev => ({ ...prev, votingStartDate: e.target.value }))}
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-red-500 text-white"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Voting End
                    </label>
                    <input
                      type="date"
                      value={newContest.votingEndDate}
                      onChange={(e) => setNewContest(prev => ({ ...prev, votingEndDate: e.target.value }))}
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-red-500 text-white"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Min Word Count
                    </label>
                    <input
                      type="number"
                      value={newContest.minWordCount}
                      onChange={(e) => setNewContest(prev => ({ ...prev, minWordCount: parseInt(e.target.value) }))}
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-red-500 text-white"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Max Word Count
                    </label>
                    <input
                      type="number"
                      value={newContest.maxWordCount}
                      onChange={(e) => setNewContest(prev => ({ ...prev, maxWordCount: parseInt(e.target.value) }))}
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-red-500 text-white"
                    />
                  </div>
                </div>
                
                <div className="flex justify-end gap-3 mt-6">
                  <button
                    onClick={() => setShowCreateForm(false)}
                    className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-white"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={createContest}
                    className="px-4 py-2 bg-red-600 text-white hover:bg-red-700 rounded-lg"
                  >
                    Create Contest
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}