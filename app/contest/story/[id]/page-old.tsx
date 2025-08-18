'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import SiteHeader from '@/components/SiteHeader';
import { 
  BookOpen, 
  Clock, 
  User, 
  Heart, 
  Share2, 
  Flag,
  ChevronLeft,
  Award,
  Eye
} from 'lucide-react';
import { motion } from 'framer-motion';

interface Story {
  id: string;
  title: string;
  authorName: string;
  authorId: string;
  genre: string[];
  synopsis: string;
  content: string;
  wordCount: number;
  votes: {
    free: number;
    premium: number;
    super: number;
    total: number;
  };
  submittedAt: any;
  views: number;
  coverImageUrl?: string;
}

export default function StoryViewPage() {
  const params = useParams();
  const router = useRouter();
  const [story, setStory] = useState<Story | null>(null);
  const [loading, setLoading] = useState(true);
  const [fontSize, setFontSize] = useState('text-base');

  useEffect(() => {
    loadStory();
  }, [params.id]);

  const loadStory = async () => {
    try {
      setLoading(true);
      
      // Fetch story from API
      const response = await fetch(`/api/contests/get-story?id=${params.id}`);
      const result = await response.json();
      
      if (result.success && result.story) {
        setStory(result.story);
        
        // Track view
        await fetch('/api/contests/track-view', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ storyId: params.id })
        });
      } else {
        // Story not found or not approved
        router.push('/contest');
      }
    } catch (error) {
      console.error('Error loading story:', error);
      router.push('/contest');
    } finally {
      setLoading(false);
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: story?.title,
        text: `Read "${story?.title}" by ${story?.authorName} in the contest!`,
        url: window.location.href
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Link copied to clipboard!');
    }
  };

  const reportStory = () => {
    if (confirm('Report this story for inappropriate content?')) {
      // TODO: Implement reporting
      alert('Thank you for your report. We will review this submission.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    );
  }

  if (!story) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Story Not Found</h1>
          <Link href="/contest" className="text-purple-400 hover:text-purple-300">
            Back to Contest
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <SiteHeader />
      {/* Secondary Header */}
      <div className="bg-gray-900 border-b border-gray-800 sticky top-28 md:top-16 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link
              href="/contest"
              className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
              Back to Contest
            </Link>
            
            <div className="flex items-center gap-4">
              {/* Font Size Controls */}
              <div className="flex items-center gap-2 text-sm">
                <button
                  onClick={() => setFontSize('text-sm')}
                  className={`px-2 py-1 rounded ${fontSize === 'text-sm' ? 'bg-purple-600' : 'bg-gray-800'}`}
                >
                  A-
                </button>
                <button
                  onClick={() => setFontSize('text-base')}
                  className={`px-2 py-1 rounded ${fontSize === 'text-base' ? 'bg-purple-600' : 'bg-gray-800'}`}
                >
                  A
                </button>
                <button
                  onClick={() => setFontSize('text-lg')}
                  className={`px-2 py-1 rounded ${fontSize === 'text-lg' ? 'bg-purple-600' : 'bg-gray-800'}`}
                >
                  A+
                </button>
              </div>
              
              <button
                onClick={handleShare}
                className="p-2 text-gray-400 hover:text-white transition-colors"
                title="Share Story"
              >
                <Share2 className="w-5 h-5" />
              </button>
              
              <button
                onClick={reportStory}
                className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                title="Report Story"
              >
                <Flag className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Story Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          {/* Cover Image */}
          {story.coverImageUrl && (
            <div className="mb-8 flex justify-center">
              <img 
                src={story.coverImageUrl} 
                alt={story.title}
                className="max-w-full md:max-w-2xl h-auto rounded-lg shadow-2xl"
                style={{ maxHeight: '400px', objectFit: 'cover' }}
              />
            </div>
          )}
          
          {/* Story Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold mb-4">{story.title}</h1>
            <div className="flex items-center justify-center gap-4 text-gray-400">
              <span className="flex items-center gap-1">
                <User className="w-4 h-4" />
                {story.authorName}
              </span>
              <span className="flex items-center gap-1">
                <BookOpen className="w-4 h-4" />
                {story.wordCount.toLocaleString()} words
              </span>
              <span className="flex items-center gap-1">
                <Eye className="w-4 h-4" />
                {story.views} views
              </span>
            </div>
            <div className="mt-2">
              {story.genre.map((g) => (
                <span
                  key={g}
                  className="inline-block px-3 py-1 bg-purple-900/30 text-purple-300 rounded-full text-sm mr-2"
                >
                  {g}
                </span>
              ))}
            </div>
          </div>

          {/* Synopsis */}
          <div className="bg-gray-900 rounded-lg p-6 mb-8 border border-gray-800">
            <h2 className="text-xl font-semibold mb-3">Synopsis</h2>
            <p className="text-gray-300 italic">{story.synopsis}</p>
          </div>

          {/* Main Content */}
          <div className={`prose prose-invert max-w-none ${fontSize}`}>
            <div className="bg-gray-900/50 rounded-lg p-8 border border-gray-800">
              <div className="whitespace-pre-wrap leading-relaxed">
                {story.content}
              </div>
            </div>
          </div>

          {/* Voting Stats */}
          <div className="mt-8 bg-purple-900/20 border border-purple-500/30 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                  <Award className="w-5 h-5 text-yellow-500" />
                  Contest Performance
                </h3>
                <div className="flex items-center gap-6 text-sm">
                  <span>Total Votes: <strong className="text-purple-400">{story.votes.total}</strong></span>
                  <span>Free: {story.votes.free}</span>
                  <span>Premium: {story.votes.premium}</span>
                  <span>Super: {story.votes.super}</span>
                </div>
              </div>
              
              <Link
                href="/contest"
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg font-medium transition-colors"
              >
                Vote for This Story
              </Link>
            </div>
          </div>

          {/* Legal Notice */}
          <div className="mt-8 text-xs text-gray-500 text-center">
            <p>© {new Date().getFullYear()} {story.authorName}. All rights reserved.</p>
            <p className="mt-2">
              This story is protected by copyright law. Reproduction, distribution, or unauthorized use
              without permission is prohibited. FableTech Studios is not responsible for user-generated content.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}