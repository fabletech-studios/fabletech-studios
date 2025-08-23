'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Trophy, 
  Calendar, 
  FileText,
  DollarSign,
  Users,
  Settings,
  Save,
  Eye
} from 'lucide-react';
import { Contest, ContestCategory } from '@/lib/types/contest';

export default function CreateContestPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');
  
  // Form state
  const [formData, setFormData] = useState({
    // Basic Info
    title: '',
    shortDescription: '',
    description: '',
    category: 'general' as ContestCategory,
    genres: [] as string[],
    featured: false,
    
    // Prizes
    prizes: {
      first: { title: 'First Place', description: '', value: '$500' },
      second: { title: 'Second Place', description: '', value: '$250' },
      third: { title: 'Third Place', description: '', value: '$100' },
      honorableMentions: 5
    },
    
    // Rules
    rules: {
      minWords: 1000,
      maxWords: 5000,
      eligibility: ['Must be 18 or older', 'Original work only'],
      submissionLimit: 1,
      allowMultipleSubmissions: false
    },
    
    // Dates
    dates: {
      submissionStart: '',
      submissionEnd: '',
      votingStart: '',
      votingEnd: '',
      winnersAnnounced: ''
    },
    
    // Voting
    voting: {
      allowMultipleVotes: true,
      votesPerUser: null,
      voteTypes: {
        free: true,
        premium: true,
        super: true
      }
    }
  });

  const availableGenres = [
    'Fiction', 'Non-Fiction', 'Mystery', 'Thriller', 'Romance', 
    'Sci-Fi', 'Fantasy', 'Horror', 'Historical', 'Adventure',
    'Drama', 'Comedy', 'Poetry', 'Essay', 'Short Story'
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Generate slug from title
      const slug = formData.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');

      const contestData = {
        ...formData,
        slug,
        status: 'draft',
        stats: {
          totalSubmissions: 0,
          totalVotes: 0,
          totalParticipants: 0,
          totalViews: 0
        }
      };

      const response = await fetch('/api/admin/contests/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(contestData)
      });

      const data = await response.json();

      if (data.success) {
        router.push(`/admin/contests/${data.contestId}/edit`);
      } else {
        alert('Failed to create contest: ' + data.error);
      }
    } catch (error) {
      console.error('Error creating contest:', error);
      alert('Failed to create contest');
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'basic', label: 'Basic Info', icon: FileText },
    { id: 'prizes', label: 'Prizes', icon: Trophy },
    { id: 'rules', label: 'Rules', icon: Settings },
    { id: 'dates', label: 'Dates', icon: Calendar },
    { id: 'voting', label: 'Voting', icon: Users }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/admin/contests"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Contests
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Create New Contest</h1>
          <p className="text-gray-600 mt-2">Set up a new writing contest for your community</p>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6" aria-label="Tabs">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                      activeTab === tab.id
                        ? 'border-purple-600 text-purple-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </div>

          <form onSubmit={handleSubmit} className="p-6">
            {/* Basic Info Tab */}
            {activeTab === 'basic' && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Contest Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                    placeholder="Summer Writing Contest 2024"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Short Description *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.shortDescription}
                    onChange={(e) => setFormData({ ...formData, shortDescription: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                    placeholder="A brief tagline for the contest"
                    maxLength={100}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Description *
                  </label>
                  <textarea
                    required
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                    rows={6}
                    placeholder="Detailed description of the contest, theme, and what you're looking for..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as ContestCategory })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                  >
                    <option value="general">General</option>
                    <option value="fiction">Fiction</option>
                    <option value="non-fiction">Non-Fiction</option>
                    <option value="poetry">Poetry</option>
                    <option value="screenplay">Screenplay</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Allowed Genres
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {availableGenres.map((genre) => (
                      <label key={genre} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={formData.genres.includes(genre)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFormData({ ...formData, genres: [...formData.genres, genre] });
                            } else {
                              setFormData({ ...formData, genres: formData.genres.filter(g => g !== genre) });
                            }
                          }}
                          className="rounded text-purple-600 focus:ring-purple-500"
                        />
                        <span className="text-sm text-gray-700">{genre}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.featured}
                      onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                      className="rounded text-purple-600 focus:ring-purple-500"
                    />
                    <span className="text-sm font-medium text-gray-700">Feature this contest on homepage</span>
                  </label>
                </div>
              </div>
            )}

            {/* Prizes Tab */}
            {activeTab === 'prizes' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 gap-6">
                  <div className="border border-gray-200 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-900 mb-4">🥇 First Place</h3>
                    <div className="space-y-3">
                      <input
                        type="text"
                        value={formData.prizes.first.value}
                        onChange={(e) => setFormData({
                          ...formData,
                          prizes: {
                            ...formData.prizes,
                            first: { ...formData.prizes.first, value: e.target.value }
                          }
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        placeholder="Prize value (e.g., $1000)"
                      />
                      <textarea
                        value={formData.prizes.first.description}
                        onChange={(e) => setFormData({
                          ...formData,
                          prizes: {
                            ...formData.prizes,
                            first: { ...formData.prizes.first, description: e.target.value }
                          }
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        placeholder="Prize description"
                        rows={2}
                      />
                    </div>
                  </div>

                  <div className="border border-gray-200 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-900 mb-4">🥈 Second Place</h3>
                    <div className="space-y-3">
                      <input
                        type="text"
                        value={formData.prizes.second.value}
                        onChange={(e) => setFormData({
                          ...formData,
                          prizes: {
                            ...formData.prizes,
                            second: { ...formData.prizes.second, value: e.target.value }
                          }
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        placeholder="Prize value (e.g., $500)"
                      />
                      <textarea
                        value={formData.prizes.second.description}
                        onChange={(e) => setFormData({
                          ...formData,
                          prizes: {
                            ...formData.prizes,
                            second: { ...formData.prizes.second, description: e.target.value }
                          }
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        placeholder="Prize description"
                        rows={2}
                      />
                    </div>
                  </div>

                  <div className="border border-gray-200 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-900 mb-4">🥉 Third Place</h3>
                    <div className="space-y-3">
                      <input
                        type="text"
                        value={formData.prizes.third.value}
                        onChange={(e) => setFormData({
                          ...formData,
                          prizes: {
                            ...formData.prizes,
                            third: { ...formData.prizes.third, value: e.target.value }
                          }
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        placeholder="Prize value (e.g., $250)"
                      />
                      <textarea
                        value={formData.prizes.third.description}
                        onChange={(e) => setFormData({
                          ...formData,
                          prizes: {
                            ...formData.prizes,
                            third: { ...formData.prizes.third, description: e.target.value }
                          }
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        placeholder="Prize description"
                        rows={2}
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Number of Honorable Mentions
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.prizes.honorableMentions}
                    onChange={(e) => setFormData({
                      ...formData,
                      prizes: {
                        ...formData.prizes,
                        honorableMentions: parseInt(e.target.value)
                      }
                    })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>
            )}

            {/* Rules Tab */}
            {activeTab === 'rules' && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Minimum Words *
                    </label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={formData.rules.minWords}
                      onChange={(e) => setFormData({
                        ...formData,
                        rules: { ...formData.rules, minWords: parseInt(e.target.value) }
                      })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Maximum Words *
                    </label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={formData.rules.maxWords}
                      onChange={(e) => setFormData({
                        ...formData,
                        rules: { ...formData.rules, maxWords: parseInt(e.target.value) }
                      })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Submissions Per User
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.rules.submissionLimit}
                    onChange={(e) => setFormData({
                      ...formData,
                      rules: { ...formData.rules, submissionLimit: parseInt(e.target.value) }
                    })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.rules.allowMultipleSubmissions}
                      onChange={(e) => setFormData({
                        ...formData,
                        rules: { ...formData.rules, allowMultipleSubmissions: e.target.checked }
                      })}
                      className="rounded text-purple-600 focus:ring-purple-500"
                    />
                    <span className="text-sm font-medium text-gray-700">
                      Allow multiple submissions per user
                    </span>
                  </label>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Eligibility Requirements
                  </label>
                  <textarea
                    value={formData.rules.eligibility.join('\n')}
                    onChange={(e) => setFormData({
                      ...formData,
                      rules: { ...formData.rules, eligibility: e.target.value.split('\n').filter(e => e.trim()) }
                    })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    rows={4}
                    placeholder="One requirement per line"
                  />
                </div>
              </div>
            )}

            {/* Dates Tab */}
            {activeTab === 'dates' && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Submission Start Date *
                    </label>
                    <input
                      type="datetime-local"
                      required
                      value={formData.dates.submissionStart}
                      onChange={(e) => setFormData({
                        ...formData,
                        dates: { ...formData.dates, submissionStart: e.target.value }
                      })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Submission End Date *
                    </label>
                    <input
                      type="datetime-local"
                      required
                      value={formData.dates.submissionEnd}
                      onChange={(e) => setFormData({
                        ...formData,
                        dates: { ...formData.dates, submissionEnd: e.target.value }
                      })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Voting Start Date *
                    </label>
                    <input
                      type="datetime-local"
                      required
                      value={formData.dates.votingStart}
                      onChange={(e) => setFormData({
                        ...formData,
                        dates: { ...formData.dates, votingStart: e.target.value }
                      })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Voting End Date *
                    </label>
                    <input
                      type="datetime-local"
                      required
                      value={formData.dates.votingEnd}
                      onChange={(e) => setFormData({
                        ...formData,
                        dates: { ...formData.dates, votingEnd: e.target.value }
                      })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Winners Announcement Date *
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={formData.dates.winnersAnnounced}
                    onChange={(e) => setFormData({
                      ...formData,
                      dates: { ...formData.dates, winnersAnnounced: e.target.value }
                    })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>
            )}

            {/* Voting Tab */}
            {activeTab === 'voting' && (
              <div className="space-y-6">
                <div>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.voting.allowMultipleVotes}
                      onChange={(e) => setFormData({
                        ...formData,
                        voting: { ...formData.voting, allowMultipleVotes: e.target.checked }
                      })}
                      className="rounded text-purple-600 focus:ring-purple-500"
                    />
                    <span className="text-sm font-medium text-gray-700">
                      Allow users to vote multiple times
                    </span>
                  </label>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Vote Types Allowed
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formData.voting.voteTypes.free}
                        onChange={(e) => setFormData({
                          ...formData,
                          voting: {
                            ...formData.voting,
                            voteTypes: { ...formData.voting.voteTypes, free: e.target.checked }
                          }
                        })}
                        className="rounded text-purple-600 focus:ring-purple-500"
                      />
                      <span className="text-sm text-gray-700">Free Votes (1 point)</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formData.voting.voteTypes.premium}
                        onChange={(e) => setFormData({
                          ...formData,
                          voting: {
                            ...formData.voting,
                            voteTypes: { ...formData.voting.voteTypes, premium: e.target.checked }
                          }
                        })}
                        className="rounded text-purple-600 focus:ring-purple-500"
                      />
                      <span className="text-sm text-gray-700">Premium Votes (2 points)</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formData.voting.voteTypes.super}
                        onChange={(e) => setFormData({
                          ...formData,
                          voting: {
                            ...formData.voting,
                            voteTypes: { ...formData.voting.voteTypes, super: e.target.checked }
                          }
                        })}
                        className="rounded text-purple-600 focus:ring-purple-500"
                      />
                      <span className="text-sm text-gray-700">Super Votes (5 points)</span>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center justify-between mt-8 pt-6 border-t">
              <button
                type="button"
                onClick={() => router.push('/admin/contests')}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <div className="flex items-center gap-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center gap-2 px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  Save as Draft
                </button>
                <button
                  type="button"
                  disabled={loading}
                  className="flex items-center gap-2 px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
                >
                  <Eye className="w-4 h-4" />
                  Save & Publish
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}