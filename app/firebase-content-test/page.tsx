'use client';

import { useState, useEffect } from 'react';
import { FileText, Plus, Trash2, Edit, Film } from 'lucide-react';

interface Series {
  id: string;
  title: string;
  description: string;
  author: string;
  totalEpisodes: number;
  genre: string;
}

export default function FirebaseContentTest() {
  const [series, setSeries] = useState<Series[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [newSeries, setNewSeries] = useState({
    title: '',
    description: '',
    author: '',
    genre: 'Fiction'
  });

  useEffect(() => {
    fetchSeries();
  }, []);

  const fetchSeries = async () => {
    try {
      const res = await fetch('/api/hybrid/series');
      const data = await res.json();
      if (data.success) {
        setSeries(data.series);
      }
    } catch (error) {
      console.error('Error fetching series:', error);
    } finally {
      setLoading(false);
    }
  };

  const createSeries = async () => {
    if (!newSeries.title || !newSeries.description) {
      alert('Title and description are required');
      return;
    }

    setIsCreating(true);
    try {
      const res = await fetch('/api/hybrid/series', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSeries)
      });

      const data = await res.json();
      if (data.success) {
        setSeries([data.series, ...series]);
        setNewSeries({ title: '', description: '', author: '', genre: 'Fiction' });
        alert('Series created successfully!');
      } else {
        alert(`Failed to create series: ${data.error}`);
      }
    } catch (error) {
      console.error('Error creating series:', error);
      alert('Error creating series');
    } finally {
      setIsCreating(false);
    }
  };

  const deleteSeries = async (seriesId: string) => {
    if (!confirm('Are you sure you want to delete this series?')) return;

    try {
      const res = await fetch(`/api/hybrid/series/${seriesId}`, {
        method: 'DELETE'
      });

      const data = await res.json();
      if (data.success) {
        setSeries(series.filter(s => s.id !== seriesId));
        alert('Series deleted successfully!');
      } else {
        alert(`Failed to delete series: ${data.error}`);
      }
    } catch (error) {
      console.error('Error deleting series:', error);
      alert('Error deleting series');
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Firebase Content Management Test</h1>

        <div className="bg-green-900/20 border border-green-600 rounded-lg p-4 mb-8">
          <p className="text-green-300">
            ✅ This demonstrates content management using Firestore without Firebase Auth.
            All CRUD operations work directly with Firestore.
          </p>
        </div>

        {/* Create Series Form */}
        <div className="bg-gray-900 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Create New Series</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Series Title"
              value={newSeries.title}
              onChange={(e) => setNewSeries({ ...newSeries, title: e.target.value })}
              className="bg-gray-800 text-white px-4 py-2 rounded-lg"
            />
            <input
              type="text"
              placeholder="Author"
              value={newSeries.author}
              onChange={(e) => setNewSeries({ ...newSeries, author: e.target.value })}
              className="bg-gray-800 text-white px-4 py-2 rounded-lg"
            />
            <textarea
              placeholder="Description"
              value={newSeries.description}
              onChange={(e) => setNewSeries({ ...newSeries, description: e.target.value })}
              className="bg-gray-800 text-white px-4 py-2 rounded-lg col-span-2"
              rows={3}
            />
            <select
              value={newSeries.genre}
              onChange={(e) => setNewSeries({ ...newSeries, genre: e.target.value })}
              className="bg-gray-800 text-white px-4 py-2 rounded-lg"
            >
              <option value="Fiction">Fiction</option>
              <option value="Non-Fiction">Non-Fiction</option>
              <option value="Mystery">Mystery</option>
              <option value="Science Fiction">Science Fiction</option>
              <option value="Fantasy">Fantasy</option>
            </select>
            <button
              onClick={createSeries}
              disabled={isCreating}
              className="bg-red-600 hover:bg-red-700 disabled:bg-gray-700 px-4 py-2 rounded-lg flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              {isCreating ? 'Creating...' : 'Create Series'}
            </button>
          </div>
        </div>

        {/* Series List */}
        <div className="bg-gray-900 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Series in Firestore</h2>
          
          {loading ? (
            <p className="text-gray-400">Loading series...</p>
          ) : series.length === 0 ? (
            <p className="text-gray-400">No series found. Create one above!</p>
          ) : (
            <div className="space-y-4">
              {series.map((s) => (
                <div key={s.id} className="bg-gray-800 rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold flex items-center gap-2">
                        <Film className="w-5 h-5 text-red-400" />
                        {s.title}
                      </h3>
                      <p className="text-sm text-gray-400 mt-1">
                        by {s.author || 'Unknown'} • {s.genre} • {s.totalEpisodes || 0} episodes
                      </p>
                      <p className="text-gray-300 mt-2">{s.description}</p>
                      <p className="text-xs text-gray-500 mt-2">ID: {s.id}</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => alert('Edit functionality not implemented in demo')}
                        className="p-2 bg-blue-600 hover:bg-blue-700 rounded-lg"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => deleteSeries(s.id)}
                        className="p-2 bg-red-600 hover:bg-red-700 rounded-lg"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-8 text-center space-y-2">
          <a 
            href="/firebase-hybrid-mode"
            className="inline-block text-sm text-gray-400 hover:text-white"
          >
            ← Back to Hybrid Mode
          </a>
          <br />
          <a 
            href="/"
            className="inline-block text-sm text-gray-400 hover:text-white"
          >
            Go to Home
          </a>
        </div>
      </div>
    </div>
  );
}