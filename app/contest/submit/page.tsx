'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useFirebaseCustomerAuth } from '@/contexts/FirebaseCustomerContext';
import { 
  getActiveContest, 
  submitStory, 
  getOrCreateAuthorProfile,
  updateAuthorProfile 
} from '@/lib/firebase/contest-service';
import { Contest, AuthorProfile } from '@/lib/types/contest.types';
import { 
  BookOpen, 
  Upload, 
  User, 
  Info, 
  AlertCircle, 
  Sparkles,
  Trophy,
  Clock,
  FileText,
  Image as ImageIcon,
  Mic
} from 'lucide-react';
import { motion } from 'framer-motion';

export default function ContestSubmissionPage() {
  const router = useRouter();
  const { customer, loading: authLoading } = useFirebaseCustomerAuth();
  const [contest, setContest] = useState<Contest | null>(null);
  const [authorProfile, setAuthorProfile] = useState<AuthorProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [wordCount, setWordCount] = useState(0);
  
  // Form fields
  const [formData, setFormData] = useState({
    title: '',
    genre: [] as string[],
    synopsis: '',
    content: '',
    penName: '',
    bio: '',
    coverImageUrl: '',
    // Ready for hybrid model
    audioPreviewUrl: '',
    narratorPreference: ''
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const genres = [
    'Mystery', 'Romance', 'Fantasy', 'Sci-Fi', 'Thriller', 
    'Horror', 'Literary Fiction', 'Historical', 'Comedy', 'Drama'
  ];

  useEffect(() => {
    if (!authLoading) {
      if (!customer) {
        router.push('/login');
      } else {
        loadContestAndProfile();
      }
    }
  }, [customer, authLoading, router]);

  const loadContestAndProfile = async () => {
    try {
      setLoading(true);
      
      // Get active contest using server-side endpoint
      const response = await fetch('/api/contests/get-active');
      const result = await response.json();
      
      if (!result.success || !result.contests || result.contests.length === 0) {
        setErrors({ contest: 'No active contest at the moment' });
        return;
      }
      
      const activeContest = result.contests[0];
      
      if (activeContest.status !== 'submission') {
        setErrors({ contest: 'Contest is not accepting submissions' });
        return;
      }
      
      setContest(activeContest);
      
      // Get or create author profile using API endpoint
      if (customer) {
        try {
          const profileResponse = await fetch(`/api/contests/author-profile?userId=${customer.uid}`);
          const profileResult = await profileResponse.json();
          
          if (profileResult.success) {
            const profile = profileResult.profile;
            setAuthorProfile(profile);
            setFormData(prev => ({
              ...prev,
              penName: profile.penName || customer.name || '',
              bio: profile.bio || ''
            }));
          }
        } catch (error) {
          console.error('Error loading author profile:', error);
        }
      }
    } catch (error) {
      console.error('Error loading contest:', error);
      setErrors({ contest: 'Failed to load contest' });
    } finally {
      setLoading(false);
    }
  };

  const handleContentChange = (content: string) => {
    setFormData(prev => ({ ...prev, content }));
    const words = content.trim().split(/\s+/).filter(word => word.length > 0);
    setWordCount(words.length);
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }
    
    if (formData.genre.length === 0) {
      newErrors.genre = 'Select at least one genre';
    }
    
    if (!formData.synopsis.trim()) {
      newErrors.synopsis = 'Synopsis is required';
    } else if (formData.synopsis.split(' ').length > 300) {
      newErrors.synopsis = 'Synopsis must be under 300 words';
    }
    
    if (!formData.content.trim()) {
      newErrors.content = 'Story content is required';
    } else if (contest) {
      if (wordCount < contest.minWordCount) {
        newErrors.content = `Story must be at least ${contest.minWordCount} words`;
      } else if (wordCount > contest.maxWordCount) {
        newErrors.content = `Story must be under ${contest.maxWordCount} words`;
      }
    }
    
    if (!formData.penName.trim()) {
      newErrors.penName = 'Pen name is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm() || !customer || !contest) return;
    
    setSubmitting(true);
    try {
      // Update author profile using API
      await fetch('/api/contests/author-profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId: customer.uid,
          penName: formData.penName,
          bio: formData.bio
        })
      });
      
      // Submit story using API
      const response = await fetch('/api/contests/submit-story', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contestId: contest.id,
          authorId: customer.uid,
          authorName: formData.penName,
          title: formData.title,
          genre: formData.genre,
          synopsis: formData.synopsis,
          content: formData.content,
          wordCount,
          coverImageUrl: formData.coverImageUrl || undefined,
          audioPreviewUrl: formData.audioPreviewUrl || undefined,
          narratorPreference: formData.narratorPreference || undefined,
          hasAudioBonus: !!formData.audioPreviewUrl,
          isFeatured: false
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        router.push(`/contest/submission/${result.submissionId}?success=true`);
      } else {
        setErrors({ submit: result.error || 'Failed to submit story' });
      }
    } catch (error) {
      console.error('Error submitting:', error);
      setErrors({ submit: 'Failed to submit story' });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    );
  }

  if (errors.contest) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">No Active Contest</h1>
          <p className="text-gray-400 mb-6">{errors.contest}</p>
          <button
            onClick={() => router.push('/contest')}
            className="px-6 py-3 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
          >
            View Contest Schedule
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Contest Header */}
        {contest && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-purple-900/20 to-pink-900/20 rounded-2xl p-6 mb-8 border border-purple-500/20"
          >
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
                  <Trophy className="w-8 h-8 text-yellow-500" />
                  {contest.title}
                </h1>
                <p className="text-gray-400">{contest.description}</p>
                {contest.theme && (
                  <p className="mt-2 text-purple-400">Theme: {contest.theme}</p>
                )}
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-400">Submission Deadline</p>
                <p className="text-lg font-semibold text-red-400">
                  <Clock className="inline w-4 h-4 mr-1" />
                  {new Date(contest.submissionEndDate).toLocaleDateString()}
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Submission Form */}
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Author Information */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-gray-900 rounded-xl p-6"
          >
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-blue-500" />
              Author Information
            </h2>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Pen Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.penName}
                  onChange={(e) => setFormData(prev => ({ ...prev, penName: e.target.value }))}
                  className="w-full px-4 py-2 bg-gray-800 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                  placeholder="Your author name"
                />
                {errors.penName && (
                  <p className="text-red-400 text-sm mt-1">{errors.penName}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">
                  Author Bio
                </label>
                <textarea
                  value={formData.bio}
                  onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                  className="w-full px-4 py-2 bg-gray-800 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                  placeholder="Tell readers about yourself"
                  rows={3}
                />
              </div>
            </div>
          </motion.div>

          {/* Story Details */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-gray-900 rounded-xl p-6"
          >
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-green-500" />
              Story Details
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-4 py-2 bg-gray-800 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                  placeholder="Your story title"
                />
                {errors.title && (
                  <p className="text-red-400 text-sm mt-1">{errors.title}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">
                  Genre(s) <span className="text-red-500">*</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {genres.map(genre => (
                    <button
                      key={genre}
                      type="button"
                      onClick={() => {
                        setFormData(prev => ({
                          ...prev,
                          genre: prev.genre.includes(genre)
                            ? prev.genre.filter(g => g !== genre)
                            : [...prev.genre, genre]
                        }));
                      }}
                      className={`px-3 py-1 rounded-full text-sm transition-colors ${
                        formData.genre.includes(genre)
                          ? 'bg-purple-600 text-white'
                          : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                      }`}
                    >
                      {genre}
                    </button>
                  ))}
                </div>
                {errors.genre && (
                  <p className="text-red-400 text-sm mt-1">{errors.genre}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">
                  Synopsis <span className="text-red-500">*</span>
                  <span className="text-gray-500 text-xs ml-2">
                    ({formData.synopsis.split(' ').filter(w => w).length}/300 words)
                  </span>
                </label>
                <textarea
                  value={formData.synopsis}
                  onChange={(e) => setFormData(prev => ({ ...prev, synopsis: e.target.value }))}
                  className="w-full px-4 py-2 bg-gray-800 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                  placeholder="A brief summary of your story..."
                  rows={4}
                />
                {errors.synopsis && (
                  <p className="text-red-400 text-sm mt-1">{errors.synopsis}</p>
                )}
              </div>
            </div>
          </motion.div>

          {/* Story Content */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-gray-900 rounded-xl p-6"
          >
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-orange-500" />
              Story Content
            </h2>
            
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium">
                  Your Story <span className="text-red-500">*</span>
                </label>
                <div className="text-sm">
                  <span className={`font-semibold ${
                    contest && (wordCount < contest.minWordCount || wordCount > contest.maxWordCount)
                      ? 'text-red-400'
                      : 'text-green-400'
                  }`}>
                    {wordCount}
                  </span>
                  <span className="text-gray-500">
                    {contest && ` / ${contest.minWordCount}-${contest.maxWordCount} words`}
                  </span>
                </div>
              </div>
              
              <textarea
                value={formData.content}
                onChange={(e) => handleContentChange(e.target.value)}
                className="w-full px-4 py-3 bg-gray-800 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none font-mono text-sm"
                placeholder="Paste or write your story here..."
                rows={20}
              />
              {errors.content && (
                <p className="text-red-400 text-sm mt-1">{errors.content}</p>
              )}
            </div>
          </motion.div>

          {/* Optional Enhancements (Ready for Hybrid) */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-gradient-to-r from-purple-900/10 to-pink-900/10 rounded-xl p-6 border border-purple-500/20"
          >
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-500" />
              Optional Enhancements
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                  <ImageIcon className="w-4 h-4" />
                  Cover Image URL
                </label>
                <input
                  type="url"
                  value={formData.coverImageUrl}
                  onChange={(e) => setFormData(prev => ({ ...prev, coverImageUrl: e.target.value }))}
                  className="w-full px-4 py-2 bg-gray-800 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                  placeholder="https://example.com/cover.jpg"
                />
              </div>
              
              <div className="p-4 bg-purple-900/20 rounded-lg border border-purple-500/20">
                <div className="flex items-start gap-3">
                  <Mic className="w-5 h-5 text-purple-400 mt-1" />
                  <div className="flex-1">
                    <p className="font-medium text-purple-300 mb-1">
                      🎙️ Audio Preview (Coming Soon!)
                    </p>
                    <p className="text-sm text-gray-400">
                      In future contests, you'll be able to add audio previews to boost your visibility!
                    </p>
                    {contest?.audioEnabled && (
                      <div className="mt-3">
                        <input
                          type="url"
                          value={formData.audioPreviewUrl}
                          onChange={(e) => setFormData(prev => ({ ...prev, audioPreviewUrl: e.target.value }))}
                          className="w-full px-4 py-2 bg-gray-800 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                          placeholder="Audio preview URL (optional)"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Submit Button */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="flex items-center justify-between"
          >
            <button
              type="button"
              onClick={() => router.push('/contest')}
              className="px-6 py-3 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
            >
              Cancel
            </button>
            
            <button
              type="submit"
              disabled={submitting}
              className="px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {submitting ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Submitting...
                </>
              ) : (
                <>
                  <Upload className="w-5 h-5" />
                  Submit Story
                </>
              )}
            </button>
          </motion.div>
          
          {errors.submit && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="p-4 bg-red-900/20 border border-red-500/20 rounded-lg"
            >
              <p className="text-red-400 flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                {errors.submit}
              </p>
            </motion.div>
          )}
        </form>
      </div>
    </div>
  );
}