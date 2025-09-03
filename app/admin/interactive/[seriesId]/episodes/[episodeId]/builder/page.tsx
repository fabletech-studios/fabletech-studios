'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  Plus, 
  GitBranch, 
  Save, 
  X, 
  Upload,
  Clock,
  PlayCircle,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { InteractiveEpisode, StoryNode, Choice } from '@/types/interactive';

export default function StoryBuilderPage() {
  const params = useParams();
  const router = useRouter();
  const seriesId = params.seriesId as string;
  const episodeId = params.episodeId as string;
  
  const [episode, setEpisode] = useState<InteractiveEpisode | null>(null);
  const [nodes, setNodes] = useState<StoryNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedNode, setSelectedNode] = useState<StoryNode | null>(null);
  const [showNodeModal, setShowNodeModal] = useState(false);
  
  // Node form state
  const [nodeTitle, setNodeTitle] = useState('');
  const [nodeDescription, setNodeDescription] = useState('');
  const [nodeTimestamp, setNodeTimestamp] = useState(0);
  const [nodeAudioFile, setNodeAudioFile] = useState<File | null>(null);
  const [nodeChoices, setNodeChoices] = useState<Choice[]>([]);
  
  useEffect(() => {
    fetchEpisodeData();
  }, [episodeId]);

  const fetchEpisodeData = async () => {
    try {
      const response = await fetch(`/api/interactive-series/${seriesId}/episodes`);
      const data = await response.json();
      if (data.success) {
        const currentEpisode = data.episodes.find((ep: InteractiveEpisode) => ep.id === episodeId);
        if (currentEpisode) {
          setEpisode(currentEpisode);
          setNodes(currentEpisode.nodes || []);
        }
      }
    } catch (error) {
      console.error('Failed to fetch episode:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddChoice = () => {
    const newChoice: Choice = {
      id: `choice_${Date.now()}`,
      text: '',
      leadsToNodeId: '',
    };
    setNodeChoices([...nodeChoices, newChoice]);
  };

  const handleRemoveChoice = (index: number) => {
    setNodeChoices(nodeChoices.filter((_, i) => i !== index));
  };

  const handleUpdateChoice = (index: number, field: keyof Choice, value: string) => {
    const updated = [...nodeChoices];
    updated[index] = { ...updated[index], [field]: value };
    setNodeChoices(updated);
  };

  const handleCreateNode = () => {
    setSelectedNode(null);
    setNodeTitle('');
    setNodeDescription('');
    setNodeTimestamp(0);
    setNodeAudioFile(null);
    setNodeChoices([]);
    setShowNodeModal(true);
  };

  const handleEditNode = (node: StoryNode) => {
    setSelectedNode(node);
    setNodeTitle(node.title);
    setNodeDescription(node.description || '');
    setNodeTimestamp(node.timestamp || 0);
    setNodeChoices(node.choices || []);
    setShowNodeModal(true);
  };

  const handleSaveNode = async () => {
    if (!nodeTitle) {
      alert('Please provide a title for the node');
      return;
    }

    const newNode: StoryNode = {
      id: selectedNode?.id || `node_${Date.now()}`,
      episodeId,
      nodeType: nodeChoices.length > 0 ? 'choice' : 'start',
      audioUrl: selectedNode?.audioUrl || '', // Will be populated when audio upload is implemented
      duration: 0,
      title: nodeTitle,
      description: nodeDescription,
      timestamp: nodeTimestamp,
      choices: nodeChoices.length > 0 ? nodeChoices : undefined,
    };

    let updatedNodes = [...nodes];
    if (selectedNode) {
      // Update existing node
      updatedNodes = updatedNodes.map(n => n.id === selectedNode.id ? newNode : n);
    } else {
      // Add new node
      updatedNodes.push(newNode);
    }

    setNodes(updatedNodes);
    setShowNodeModal(false);
    
    // Auto-save
    await saveNodes(updatedNodes);
  };

  const handleDeleteNode = async (nodeId: string) => {
    if (!confirm('Delete this node? This will also remove all references to it.')) {
      return;
    }

    const updatedNodes = nodes.filter(n => n.id !== nodeId);
    
    // Remove references to this node in choices
    updatedNodes.forEach(node => {
      if (node.choices) {
        node.choices = node.choices.filter(c => c.leadsToNodeId !== nodeId);
      }
    });

    setNodes(updatedNodes);
    await saveNodes(updatedNodes);
  };

  const saveNodes = async (nodesToSave: StoryNode[]) => {
    setSaving(true);
    try {
      const response = await fetch(`/api/interactive-series/${seriesId}/episodes/${episodeId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nodes: nodesToSave,
        }),
      });

      const data = await response.json();
      if (!data.success) {
        alert(`Error saving: ${data.error}`);
      }
    } catch (error) {
      console.error('Failed to save nodes:', error);
      alert('Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (!episode) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl text-gray-400">Episode not found</p>
          <button
            onClick={() => router.back()}
            className="mt-4 px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => router.back()}
            className="p-2 bg-gray-800 hover:bg-gray-700 rounded-lg"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <GitBranch className="w-6 h-6 text-purple-500" />
              Story Builder - {episode.title}
            </h1>
            <p className="text-gray-400 mt-1">Create branching paths for your interactive story</p>
          </div>
          {saving && (
            <div className="flex items-center gap-2 text-yellow-400">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-400" />
              Saving...
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="bg-purple-900/20 border border-purple-700 rounded-lg p-4 mb-8">
          <h3 className="font-bold text-purple-400 mb-2 flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            How to Build Your Story
          </h3>
          <ol className="space-y-1 text-sm text-gray-300">
            <li>1. <strong>Add Nodes</strong> - Each node is a point in your story</li>
            <li>2. <strong>Set Timestamps</strong> - When choices appear (in seconds)</li>
            <li>3. <strong>Create Choices</strong> - What options players have</li>
            <li>4. <strong>Connect Nodes</strong> - Link choices to other nodes</li>
            <li>5. <strong>Upload Audio</strong> - Different audio for each path</li>
          </ol>
        </div>

        {/* Nodes Grid */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Story Nodes ({nodes.length})</h2>
            <button
              onClick={handleCreateNode}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Node
            </button>
          </div>

          {nodes.length === 0 ? (
            <div className="bg-gray-900/50 rounded-lg p-12 text-center border-2 border-dashed border-gray-700">
              <GitBranch className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <p className="text-xl text-gray-400">No story nodes yet</p>
              <p className="text-sm text-gray-500 mt-2">Start by adding your first story node</p>
              <button
                onClick={handleCreateNode}
                className="mt-4 px-6 py-3 bg-purple-600 hover:bg-purple-700 rounded-lg"
              >
                Create First Node
              </button>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {nodes.map((node) => (
                <div key={node.id} className="bg-gray-900/50 rounded-lg p-4 border border-gray-800">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold flex items-center gap-2">
                        {node.nodeType === 'start' && <PlayCircle className="w-4 h-4 text-green-400" />}
                        {node.nodeType === 'choice' && <GitBranch className="w-4 h-4 text-purple-400" />}
                        {node.nodeType === 'end' && <CheckCircle className="w-4 h-4 text-red-400" />}
                        {node.title}
                      </h3>
                      {node.timestamp !== undefined && (
                        <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          At {node.timestamp}s
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => handleDeleteNode(node.id)}
                      className="text-red-400 hover:text-red-300"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  
                  {node.description && (
                    <p className="text-sm text-gray-400 mb-3">{node.description}</p>
                  )}

                  {node.choices && node.choices.length > 0 && (
                    <div className="space-y-1 mb-3">
                      <p className="text-xs text-gray-500 font-semibold">Choices:</p>
                      {node.choices.map((choice, index) => (
                        <div key={choice.id} className="text-xs bg-gray-800 rounded px-2 py-1">
                          {index + 1}. {choice.text || 'Untitled choice'}
                          {choice.leadsToNodeId && (
                            <span className="text-purple-400 ml-1">
                              → {nodes.find(n => n.id === choice.leadsToNodeId)?.title || 'Unknown'}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleEditNode(node)}
                      className="flex-1 px-3 py-1 bg-gray-800 hover:bg-gray-700 rounded text-sm"
                    >
                      Edit
                    </button>
                    {!node.audioUrl && (
                      <button className="flex-1 px-3 py-1 bg-purple-900/30 hover:bg-purple-900/50 rounded text-sm flex items-center justify-center gap-1">
                        <Upload className="w-3 h-3" />
                        Audio
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Node Flow Visualization (Simple) */}
        <div className="bg-gray-900/30 rounded-lg p-6 border border-gray-800">
          <h3 className="font-semibold mb-4">Story Flow</h3>
          <div className="text-sm text-gray-400">
            {nodes.length === 0 ? (
              <p>Add nodes to see your story flow</p>
            ) : (
              <div className="space-y-2">
                {nodes.map((node, index) => (
                  <div key={node.id} className="flex items-center gap-2">
                    <span className="text-purple-400">{node.title}</span>
                    {node.choices && node.choices.length > 0 && (
                      <>
                        <span>→</span>
                        <span className="text-gray-500">
                          {node.choices.length} choice{node.choices.length !== 1 ? 's' : ''}
                        </span>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Node Modal */}
        {showNodeModal && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-900 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between p-4 border-b border-gray-700">
                <h4 className="font-semibold text-lg">
                  {selectedNode ? 'Edit Node' : 'Create Node'}
                </h4>
                <button
                  onClick={() => setShowNodeModal(false)}
                  className="text-gray-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Node Title</label>
                  <input
                    type="text"
                    value={nodeTitle}
                    onChange={(e) => setNodeTitle(e.target.value)}
                    className="w-full bg-gray-800 rounded-lg px-4 py-2"
                    placeholder="e.g., The Dark Forest"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Description (Optional)</label>
                  <textarea
                    value={nodeDescription}
                    onChange={(e) => setNodeDescription(e.target.value)}
                    className="w-full bg-gray-800 rounded-lg px-4 py-2 h-20"
                    placeholder="What happens at this point in the story?"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Timestamp (seconds) - When this plays
                  </label>
                  <input
                    type="number"
                    value={nodeTimestamp}
                    onChange={(e) => setNodeTimestamp(parseInt(e.target.value) || 0)}
                    className="w-full bg-gray-800 rounded-lg px-4 py-2"
                    min="0"
                    placeholder="e.g., 45 (for 45 seconds)"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Audio for this Node</label>
                  <div className="bg-gray-800 rounded-lg p-4 border-2 border-dashed border-gray-600 text-center">
                    <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                    <input
                      type="file"
                      accept="audio/*"
                      onChange={(e) => setNodeAudioFile(e.target.files?.[0] || null)}
                      className="hidden"
                      id="node-audio"
                    />
                    <label htmlFor="node-audio" className="cursor-pointer">
                      {nodeAudioFile ? (
                        <span className="text-sm text-purple-400">{nodeAudioFile.name}</span>
                      ) : (
                        <span className="text-sm text-gray-400">Click to upload audio</span>
                      )}
                    </label>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium">Choices (Optional)</label>
                    <button
                      onClick={handleAddChoice}
                      className="px-3 py-1 bg-purple-600 hover:bg-purple-700 rounded text-sm"
                    >
                      Add Choice
                    </button>
                  </div>
                  
                  {nodeChoices.length === 0 ? (
                    <p className="text-xs text-gray-500">No choices - this will be a linear node</p>
                  ) : (
                    <div className="space-y-2">
                      {nodeChoices.map((choice, index) => (
                        <div key={choice.id} className="bg-gray-800 rounded-lg p-3">
                          <div className="flex items-start gap-2">
                            <div className="flex-1 space-y-2">
                              <input
                                type="text"
                                value={choice.text}
                                onChange={(e) => handleUpdateChoice(index, 'text', e.target.value)}
                                className="w-full bg-gray-700 rounded px-3 py-1 text-sm"
                                placeholder={`Choice ${index + 1} text`}
                              />
                              <select
                                value={choice.leadsToNodeId}
                                onChange={(e) => handleUpdateChoice(index, 'leadsToNodeId', e.target.value)}
                                className="w-full bg-gray-700 rounded px-3 py-1 text-sm"
                              >
                                <option value="">Select destination node...</option>
                                {nodes.filter(n => n.id !== selectedNode?.id).map(node => (
                                  <option key={node.id} value={node.id}>
                                    {node.title}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <button
                              onClick={() => handleRemoveChoice(index)}
                              className="text-red-400 hover:text-red-300"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-3 p-4 border-t border-gray-700">
                <button
                  onClick={() => setShowNodeModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveNode}
                  disabled={!nodeTitle}
                  className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-lg flex items-center justify-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  {selectedNode ? 'Update Node' : 'Create Node'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}