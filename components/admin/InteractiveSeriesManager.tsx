'use client';

import { useState, useEffect } from 'react';
import { 
  Gamepad2, 
  Plus, 
  Edit, 
  Trash2, 
  Upload, 
  Eye, 
  EyeOff,
  GitBranch,
  Users,
  BarChart3,
  Save,
  X
} from 'lucide-react';
import { InteractiveSeries } from '@/types/interactive';

export default function InteractiveSeriesManager() {
  const [series, setSeries] = useState<InteractiveSeries[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingSeries, setEditingSeries] = useState<InteractiveSeries | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    author: '',
    narrator: '',
    tags: '',
    creditCost: 1,
    isPremium: false,
    thumbnailUrl: ''
  });
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchInteractiveSeries();
  }, []);

  const fetchInteractiveSeries = async () => {
    try {
      const response = await fetch('/api/interactive-series');
      const data = await response.json();
      if (data.success) {
        setSeries(data.series);
      }
    } catch (error) {
      console.error('Failed to fetch interactive series:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);

    try {
      const url = editingSeries 
        ? `/api/interactive-series/${editingSeries.id}`
        : '/api/interactive-series';
      
      const method = editingSeries ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean)
        }),
      });

      const data = await response.json();
      if (data.success) {
        await fetchInteractiveSeries();
        resetForm();
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error('Failed to save interactive series:', error);
      alert('Failed to save series');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this interactive series?')) {
      return;
    }

    try {
      const response = await fetch(`/api/interactive-series/${id}`, {
        method: 'DELETE',
      });

      const data = await response.json();
      if (data.success) {
        await fetchInteractiveSeries();
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error('Failed to delete interactive series:', error);
      alert('Failed to delete series');
    }
  };

  const toggleActive = async (id: string, currentState: boolean) => {
    try {
      const response = await fetch(`/api/interactive-series/${id}/toggle`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isActive: !currentState }),
      });

      const data = await response.json();
      if (data.success) {
        await fetchInteractiveSeries();
      }
    } catch (error) {
      console.error('Failed to toggle series status:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      author: '',
      narrator: '',
      tags: '',
      creditCost: 1,
      isPremium: false,
      thumbnailUrl: ''
    });
    setEditingSeries(null);
    setShowCreateModal(false);
  };

  const openEditModal = (series: InteractiveSeries) => {
    setEditingSeries(series);
    setFormData({
      title: series.title,
      description: series.description,
      author: series.author,
      narrator: series.narrator || '',
      tags: series.tags.join(', '),
      creditCost: series.creditCost,
      isPremium: series.isPremium,
      thumbnailUrl: series.thumbnailUrl
    });
    setShowCreateModal(true);
  };

  if (loading) {
    return (
      <div className="bg-black/50 backdrop-blur rounded-xl p-6 border border-purple-900/20">
        <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Gamepad2 className="w-6 h-6 text-purple-500" />
          Interactive Series Manager
        </h3>
        <div className="animate-pulse">
          <div className="h-32 bg-gray-800 rounded-lg mb-4"></div>
          <div className="h-4 bg-gray-800 rounded w-1/3"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-black/50 backdrop-blur rounded-xl p-6 border border-purple-900/20">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold flex items-center gap-2">
          <Gamepad2 className="w-6 h-6 text-purple-500" />
          Interactive Series Manager
          <span className="text-xs text-gray-500 ml-2">Choose Your Own Adventure</span>
        </h3>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 px-4 py-2 rounded-lg font-semibold flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Create Interactive Series
        </button>
      </div>

      {/* Series List */}
      <div className="space-y-4">
        {series.length === 0 ? (
          <div className="text-center py-12 bg-gray-900/30 rounded-lg border border-gray-800">
            <Gamepad2 className="w-12 h-12 mx-auto mb-4 text-gray-600" />
            <p className="text-gray-400">No interactive series yet</p>
            <p className="text-sm text-gray-500 mt-2">Create your first branching story!</p>
          </div>
        ) : (
          series.map((item) => (
            <div key={item.id} className="bg-gray-900/30 rounded-lg p-4 border border-gray-800">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h4 className="font-semibold text-lg">{item.title}</h4>
                    {item.isPremium && (
                      <span className="bg-gradient-to-r from-yellow-600 to-yellow-700 px-2 py-1 rounded text-xs">
                        PREMIUM
                      </span>
                    )}
                    <span className={`px-2 py-1 rounded text-xs ${
                      item.isActive ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'
                    }`}>
                      {item.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  
                  <p className="text-sm text-gray-400 mb-3">{item.description}</p>
                  
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <GitBranch className="w-3 h-3" />
                      {item.totalEpisodes} Episodes
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      {item.stats?.uniquePlayers || 0} Players
                    </span>
                    <span className="flex items-center gap-1">
                      <BarChart3 className="w-3 h-3" />
                      {item.stats?.totalPaths || 0} Paths
                    </span>
                    <span>
                      {item.creditCost} credit{item.creditCost !== 1 ? 's' : ''}/episode
                    </span>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-1">
                    {item.tags.map((tag, index) => (
                      <span key={index} className="bg-gray-800 px-2 py-1 rounded text-xs">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-2 ml-4">
                  <button
                    onClick={() => toggleActive(item.id, item.isActive)}
                    className="p-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
                    title={item.isActive ? 'Deactivate' : 'Activate'}
                  >
                    {item.isActive ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => window.location.href = `/admin/interactive/${item.id}/episodes`}
                    className="p-2 bg-purple-900/30 hover:bg-purple-900/50 rounded-lg transition-colors"
                    title="Manage Episodes"
                  >
                    <GitBranch className="w-4 h-4 text-purple-400" />
                  </button>
                  <button
                    onClick={() => openEditModal(item)}
                    className="p-2 bg-blue-900/30 hover:bg-blue-900/50 rounded-lg transition-colors"
                    title="Edit"
                  >
                    <Edit className="w-4 h-4 text-blue-400" />
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="p-2 bg-red-900/30 hover:bg-red-900/50 rounded-lg transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4 text-red-400" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create/Edit Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-gray-700">
              <h4 className="font-semibold text-lg flex items-center gap-2">
                <Gamepad2 className="w-5 h-5 text-purple-500" />
                {editingSeries ? 'Edit Interactive Series' : 'Create Interactive Series'}
              </h4>
              <button
                onClick={resetForm}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full bg-gray-800 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full bg-gray-800 rounded-lg px-4 py-2 h-24 resize-none focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Author</label>
                  <input
                    type="text"
                    value={formData.author}
                    onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                    className="w-full bg-gray-800 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Narrator (Optional)</label>
                  <input
                    type="text"
                    value={formData.narrator}
                    onChange={(e) => setFormData({ ...formData, narrator: e.target.value })}
                    className="w-full bg-gray-800 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Tags (comma-separated)</label>
                <input
                  type="text"
                  value={formData.tags}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                  className="w-full bg-gray-800 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="adventure, mystery, sci-fi"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Thumbnail URL</label>
                <input
                  type="url"
                  value={formData.thumbnailUrl}
                  onChange={(e) => setFormData({ ...formData, thumbnailUrl: e.target.value })}
                  className="w-full bg-gray-800 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="https://..."
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Credit Cost per Episode</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.creditCost}
                    onChange={(e) => setFormData({ ...formData, creditCost: parseInt(e.target.value) })}
                    className="w-full bg-gray-800 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div className="flex items-center">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.isPremium}
                      onChange={(e) => setFormData({ ...formData, isPremium: e.target.checked })}
                      className="w-4 h-4 text-purple-600 bg-gray-800 border-gray-600 rounded focus:ring-purple-500"
                    />
                    <span className="text-sm">Premium Content</span>
                  </label>
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="submit"
                  disabled={uploading}
                  className="flex-1 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 disabled:from-gray-700 disabled:to-gray-800 px-6 py-3 rounded-lg font-semibold flex items-center justify-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  {uploading ? 'Saving...' : (editingSeries ? 'Update Series' : 'Create Series')}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-6 py-3 bg-gray-800 hover:bg-gray-700 rounded-lg font-semibold"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}