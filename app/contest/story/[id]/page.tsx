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
  Eye,
  Settings,
  X,
  Palette,
  Type
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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

type BackgroundTheme = 'dark' | 'light' | 'sepia' | 'gray' | 'blue';

export default function StoryViewPage() {
  const params = useParams();
  const router = useRouter();
  const [story, setStory] = useState<Story | null>(null);
  const [loading, setLoading] = useState(true);
  const [fontSize, setFontSize] = useState('text-base');
  const [backgroundTheme, setBackgroundTheme] = useState<BackgroundTheme>('dark');
  const [showControls, setShowControls] = useState(false);
  const [viewCounted, setViewCounted] = useState(false);

  useEffect(() => {
    loadStory();
  }, [params.id]);

  useEffect(() => {
    // Load saved preferences
    const savedFontSize = localStorage.getItem('storyFontSize') || 'text-base';
    const savedTheme = (localStorage.getItem('storyTheme') || 'dark') as BackgroundTheme;
    setFontSize(savedFontSize);
    setBackgroundTheme(savedTheme);
  }, []);

  const loadStory = async () => {
    try {
      setLoading(true);
      
      // Fetch story from API
      const response = await fetch(`/api/contests/get-story?id=${params.id}`);
      const result = await response.json();
      
      if (result.success && result.story) {
        setStory(result.story);
        
        // Track view only once per session
        if (!viewCounted) {
          await fetch('/api/contests/track-view', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ storyId: params.id })
          });
          setViewCounted(true);
        }
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

  const updateFontSize = (size: string) => {
    setFontSize(size);
    localStorage.setItem('storyFontSize', size);
  };

  const updateTheme = (theme: BackgroundTheme) => {
    setBackgroundTheme(theme);
    localStorage.setItem('storyTheme', theme);
  };

  const themes = {
    dark: {
      bg: 'bg-gray-900/50',
      text: 'text-gray-100',
      border: 'border-gray-800',
      label: 'Dark',
      icon: '🌙'
    },
    light: {
      bg: 'bg-white',
      text: 'text-gray-900',
      border: 'border-gray-300',
      label: 'Light',
      icon: '☀️'
    },
    sepia: {
      bg: 'bg-amber-50',
      text: 'text-amber-950',
      border: 'border-amber-200',
      label: 'Sepia',
      icon: '📜'
    },
    gray: {
      bg: 'bg-gray-800',
      text: 'text-gray-200',
      border: 'border-gray-700',
      label: 'Gray',
      icon: '🌫️'
    },
    blue: {
      bg: 'bg-blue-950/30',
      text: 'text-blue-100',
      border: 'border-blue-900',
      label: 'Night',
      icon: '🌌'
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

  const currentTheme = themes[backgroundTheme];

  return (
    <div className="min-h-screen bg-black text-white">
      <SiteHeader />
      
      {/* Floating Reading Controls - Mobile Optimized */}
      <div className="fixed bottom-4 right-4 z-50 md:bottom-8 md:right-8">
        <AnimatePresence>
          {showControls && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-gray-900 border border-gray-700 rounded-2xl p-4 shadow-2xl mb-4 w-72"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <Settings className="w-4 h-4" />
                  Reading Settings
                </h3>
                <button
                  onClick={() => setShowControls(false)}
                  className="p-1 hover:bg-gray-800 rounded-lg transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              
              {/* Font Size Controls */}
              <div className="mb-4">
                <label className="text-sm text-gray-400 mb-2 block flex items-center gap-2">
                  <Type className="w-3 h-3" />
                  Text Size
                </label>
                <div className="flex gap-2">
                  <button
                    onClick={() => updateFontSize('text-sm')}
                    className={`flex-1 py-2 px-3 rounded-lg font-medium transition-all ${
                      fontSize === 'text-sm' 
                        ? 'bg-purple-600 text-white' 
                        : 'bg-gray-800 hover:bg-gray-700 text-gray-300'
                    }`}
                  >
                    Small
                  </button>
                  <button
                    onClick={() => updateFontSize('text-base')}
                    className={`flex-1 py-2 px-3 rounded-lg font-medium transition-all ${
                      fontSize === 'text-base' 
                        ? 'bg-purple-600 text-white' 
                        : 'bg-gray-800 hover:bg-gray-700 text-gray-300'
                    }`}
                  >
                    Medium
                  </button>
                  <button
                    onClick={() => updateFontSize('text-lg')}
                    className={`flex-1 py-2 px-3 rounded-lg font-medium transition-all ${
                      fontSize === 'text-lg' 
                        ? 'bg-purple-600 text-white' 
                        : 'bg-gray-800 hover:bg-gray-700 text-gray-300'
                    }`}
                  >
                    Large
                  </button>
                </div>
              </div>
              
              {/* Background Theme Controls */}
              <div>
                <label className="text-sm text-gray-400 mb-2 block flex items-center gap-2">
                  <Palette className="w-3 h-3" />
                  Background
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {Object.entries(themes).map(([key, theme]) => (
                    <button
                      key={key}
                      onClick={() => updateTheme(key as BackgroundTheme)}
                      className={`py-2 px-3 rounded-lg text-xs font-medium transition-all border ${
                        backgroundTheme === key
                          ? 'ring-2 ring-purple-500 ring-offset-2 ring-offset-gray-900'
                          : 'hover:ring-2 hover:ring-gray-600 hover:ring-offset-2 hover:ring-offset-gray-900'
                      } ${theme.bg} ${theme.text} ${theme.border}`}
                    >
                      <span className="block text-lg mb-1">{theme.icon}</span>
                      {theme.label}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Toggle Button */}
        <button
          onClick={() => setShowControls(!showControls)}
          className={`p-3 md:p-4 bg-purple-600 hover:bg-purple-700 rounded-full shadow-lg transition-all transform hover:scale-110 ${
            showControls ? 'rotate-45' : ''
          }`}
        >
          <Settings className="w-5 h-5 md:w-6 md:h-6" />
        </button>
      </div>

      {/* Secondary Header */}
      <div className="bg-gray-900 border-b border-gray-800 sticky top-28 md:top-16 z-10">
        <div className="max-w-4xl mx-auto px-4 py-3 md:py-4">
          <div className="flex items-center justify-between">
            <Link
              href="/contest"
              className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm md:text-base"
            >
              <ChevronLeft className="w-4 h-4 md:w-5 md:h-5" />
              <span className="hidden sm:inline">Back to Contest</span>
              <span className="sm:hidden">Back</span>
            </Link>
            
            <div className="flex items-center gap-2 md:gap-4">
              <button
                onClick={handleShare}
                className="p-2 text-gray-400 hover:text-white transition-colors"
                title="Share Story"
              >
                <Share2 className="w-4 h-4 md:w-5 md:h-5" />
              </button>
              
              <button
                onClick={reportStory}
                className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                title="Report Story"
              >
                <Flag className="w-4 h-4 md:w-5 md:h-5" />
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
            <div className="flex flex-wrap items-center justify-center gap-3 md:gap-4 text-sm md:text-base text-gray-400">
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
                {story.views.toLocaleString()} views
              </span>
            </div>
            <div className="mt-2">
              {story.genre.map((g) => (
                <span
                  key={g}
                  className="inline-block px-3 py-1 bg-purple-900/30 text-purple-300 rounded-full text-xs md:text-sm mr-2"
                >
                  {g}
                </span>
              ))}
            </div>
          </div>

          {/* Synopsis */}
          <div className="bg-gray-900 rounded-lg p-4 md:p-6 mb-8 border border-gray-800">
            <h2 className="text-lg md:text-xl font-semibold mb-3">Synopsis</h2>
            <p className="text-gray-300 italic text-sm md:text-base">{story.synopsis}</p>
          </div>

          {/* Main Content with Dynamic Background */}
          <div className={`prose prose-invert max-w-none ${fontSize}`}>
            <div className={`rounded-lg p-6 md:p-8 border transition-all duration-300 ${currentTheme.bg} ${currentTheme.border}`}>
              <div className={`whitespace-pre-wrap leading-relaxed ${currentTheme.text}`}>
                {story.content}
              </div>
            </div>
          </div>

          {/* Voting Stats */}
          <div className="mt-8 bg-purple-900/20 border border-purple-500/30 rounded-lg p-4 md:p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-base md:text-lg font-semibold mb-2 flex items-center gap-2">
                  <Award className="w-4 h-4 md:w-5 md:h-5 text-yellow-500" />
                  Contest Performance
                </h3>
                <div className="flex flex-wrap items-center gap-3 md:gap-6 text-xs md:text-sm">
                  <span>Total Votes: <strong className="text-purple-400">{story.votes.total}</strong></span>
                  <span>Free: {story.votes.free}</span>
                  <span>Premium: {story.votes.premium}</span>
                  <span>Super: {story.votes.super}</span>
                </div>
              </div>
              
              <Link
                href="/contest"
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg font-medium transition-colors text-sm md:text-base"
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