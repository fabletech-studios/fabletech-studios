'use client';

import { useCallback, useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import ReactFlow, {
  Node,
  Edge,
  addEdge,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  Connection,
  MarkerType,
  Position,
  Handle,
  NodeProps,
  Panel,
  ReactFlowProvider,
  useReactFlow,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { 
  ArrowLeft, 
  Save, 
  Plus,
  GitBranch,
  PlayCircle,
  Flag,
  AlertCircle,
  Zap,
  Eye,
  Download,
  Upload,
  Layers,
  Map,
  CheckCircle,
  XCircle,
  Edit2,
  Trash2,
  Copy,
  Settings,
  Volume2,
  Clock,
  FileText,
  ChevronRight,
  Target,
  Sparkles
} from 'lucide-react';
import { InteractiveSeries, InteractiveEpisode, StoryNode } from '@/types/interactive';

// Custom node types
const nodeTypes = {
  start: StartNode,
  choice: ChoiceNode,
  checkpoint: CheckpointNode,
  merge: MergeNode,
  end: EndNode,
  scene: SceneNode,
};

// Start Node Component
function StartNode({ data, selected }: NodeProps) {
  return (
    <div className={`px-4 py-3 rounded-lg border-2 ${selected ? 'border-purple-500' : 'border-green-500'} bg-gradient-to-br from-green-900 to-green-800 min-w-[200px]`}>
      <Handle type="target" position={Position.Top} className="w-3 h-3" />
      <div className="flex items-center gap-2">
        <PlayCircle className="w-5 h-5 text-green-400" />
        <div>
          <div className="font-bold text-white">{data.label || 'Episode Start'}</div>
          <div className="text-xs text-green-300">{data.description || 'Entry point'}</div>
        </div>
      </div>
      <Handle type="source" position={Position.Bottom} className="w-3 h-3" />
    </div>
  );
}

// Choice Node Component
function ChoiceNode({ data, selected }: NodeProps) {
  return (
    <div className={`px-4 py-3 rounded-lg border-2 ${selected ? 'border-purple-500' : 'border-blue-500'} bg-gradient-to-br from-blue-900 to-blue-800 min-w-[250px]`}>
      <Handle type="target" position={Position.Top} className="w-3 h-3" />
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <GitBranch className="w-5 h-5 text-blue-400" />
          <div className="font-bold text-white">{data.label || 'Decision Point'}</div>
        </div>
        {data.timestamp !== undefined && (
          <div className="flex items-center gap-1 text-xs text-blue-300">
            <Clock className="w-3 h-3" />
            {data.timestamp}s
          </div>
        )}
        <div className="space-y-1 mt-2">
          {data.choices?.map((choice: any, index: number) => (
            <div key={index} className="text-xs bg-blue-800/50 rounded px-2 py-1 flex items-center gap-1">
              <ChevronRight className="w-3 h-3 text-blue-400" />
              <span className="text-gray-300">{choice.text || `Option ${index + 1}`}</span>
            </div>
          ))}
        </div>
      </div>
      <Handle type="source" position={Position.Bottom} className="w-3 h-3" style={{ left: '30%' }} id="choice1" />
      <Handle type="source" position={Position.Bottom} className="w-3 h-3" style={{ left: '70%' }} id="choice2" />
    </div>
  );
}

// Checkpoint Node Component
function CheckpointNode({ data, selected }: NodeProps) {
  return (
    <div className={`px-4 py-3 rounded-lg border-2 ${selected ? 'border-purple-500' : 'border-yellow-500'} bg-gradient-to-br from-yellow-900 to-yellow-800 min-w-[220px]`}>
      <Handle type="target" position={Position.Top} className="w-3 h-3" />
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Flag className="w-5 h-5 text-yellow-400" />
          <div>
            <div className="font-bold text-white">{data.label || 'Checkpoint'}</div>
            <div className="text-xs text-yellow-300">Saves progress</div>
          </div>
        </div>
        {data.setsFlags && (
          <div className="text-xs bg-yellow-800/50 rounded px-2 py-1">
            <span className="text-yellow-400">📝 Sets: </span>
            <span className="text-gray-300">{data.setsFlags.join(', ')}</span>
          </div>
        )}
      </div>
      <Handle type="source" position={Position.Bottom} className="w-3 h-3" />
    </div>
  );
}

// Merge Node Component
function MergeNode({ data, selected }: NodeProps) {
  return (
    <div className={`px-4 py-3 rounded-lg border-2 ${selected ? 'border-purple-500' : 'border-purple-600'} bg-gradient-to-br from-purple-900 to-purple-800 min-w-[180px]`}>
      <Handle type="target" position={Position.Top} className="w-3 h-3" style={{ left: '30%' }} id="merge1" />
      <Handle type="target" position={Position.Top} className="w-3 h-3" style={{ left: '70%' }} id="merge2" />
      <div className="flex items-center gap-2">
        <Target className="w-5 h-5 text-purple-400" />
        <div>
          <div className="font-bold text-white">{data.label || 'Merge Point'}</div>
          <div className="text-xs text-purple-300">Paths converge</div>
        </div>
      </div>
      <Handle type="source" position={Position.Bottom} className="w-3 h-3" />
    </div>
  );
}

// End Node Component
function EndNode({ data, selected }: NodeProps) {
  return (
    <div className={`px-4 py-3 rounded-lg border-2 ${selected ? 'border-purple-500' : 'border-red-500'} bg-gradient-to-br from-red-900 to-red-800 min-w-[200px]`}>
      <Handle type="target" position={Position.Top} className="w-3 h-3" />
      <div className="flex items-center gap-2">
        <CheckCircle className="w-5 h-5 text-red-400" />
        <div>
          <div className="font-bold text-white">{data.label || 'Episode End'}</div>
          <div className="text-xs text-red-300">{data.leadsToEpisode ? `→ Episode ${data.leadsToEpisode}` : 'End of path'}</div>
        </div>
      </div>
    </div>
  );
}

// Scene Node Component (regular story beat)
function SceneNode({ data, selected }: NodeProps) {
  return (
    <div className={`px-4 py-3 rounded-lg border-2 ${selected ? 'border-purple-500' : 'border-gray-500'} bg-gradient-to-br from-gray-800 to-gray-700 min-w-[200px]`}>
      <Handle type="target" position={Position.Top} className="w-3 h-3" />
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-gray-400" />
          <div>
            <div className="font-bold text-white">{data.label || 'Scene'}</div>
            <div className="text-xs text-gray-400">{data.description || 'Story beat'}</div>
          </div>
        </div>
        {data.audioUrl && (
          <div className="flex items-center gap-1 text-xs text-gray-400">
            <Volume2 className="w-3 h-3" />
            Audio attached
          </div>
        )}
      </div>
      <Handle type="source" position={Position.Bottom} className="w-3 h-3" />
    </div>
  );
}

// Main Visual Builder Component
function VisualBuilderFlow() {
  const params = useParams();
  const router = useRouter();
  const { fitView, getNodes, getEdges } = useReactFlow();
  const seriesId = params.seriesId as string;
  const episodeId = params.episodeId as string;
  
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [series, setSeries] = useState<InteractiveSeries | null>(null);
  const [episode, setEpisode] = useState<InteractiveEpisode | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [showNodeEditor, setShowNodeEditor] = useState(false);
  const [showSeasonMap, setShowSeasonMap] = useState(false);
  
  // Node editor state
  const [nodeLabel, setNodeLabel] = useState('');
  const [nodeDescription, setNodeDescription] = useState('');
  const [nodeTimestamp, setNodeTimestamp] = useState(0);
  const [nodeChoices, setNodeChoices] = useState<any[]>([]);
  const [nodeFlags, setNodeFlags] = useState<string[]>([]);
  const [nodeAudioUrl, setNodeAudioUrl] = useState('');

  useEffect(() => {
    fetchData();
  }, [seriesId, episodeId]);

  const fetchData = async () => {
    try {
      // Fetch series
      const seriesRes = await fetch('/api/interactive-series');
      const seriesData = await seriesRes.json();
      if (seriesData.success) {
        const currentSeries = seriesData.series.find((s: InteractiveSeries) => s.id === seriesId);
        setSeries(currentSeries);
      }

      // Fetch episode
      const episodeRes = await fetch(`/api/interactive-series/${seriesId}/episodes`);
      const episodeData = await episodeRes.json();
      if (episodeData.success) {
        const currentEpisode = episodeData.episodes.find((ep: InteractiveEpisode) => ep.id === episodeId);
        if (currentEpisode) {
          setEpisode(currentEpisode);
          loadNodesFromEpisode(currentEpisode);
        }
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadNodesFromEpisode = (ep: InteractiveEpisode) => {
    if (!ep.nodes || ep.nodes.length === 0) {
      // Initialize with a start node
      setNodes([
        {
          id: 'start',
          type: 'start',
          position: { x: 400, y: 50 },
          data: { label: 'Episode Start', description: `Episode ${ep.episodeNumber}: ${ep.title}` },
        },
      ]);
      return;
    }

    // Convert episode nodes to ReactFlow nodes
    const flowNodes: Node[] = ep.nodes.map((node, index) => {
      const position = calculateNodePosition(index, ep.nodes?.length || 1);
      return {
        id: node.id,
        type: getNodeType(node),
        position,
        data: {
          label: node.title,
          description: node.description,
          timestamp: node.timestamp,
          choices: node.choices,
          setsFlags: node.setsFlags,
          audioUrl: node.audioUrl,
        },
      };
    });

    setNodes(flowNodes);

    // Create edges based on node connections
    const flowEdges: Edge[] = [];
    ep.nodes.forEach((node) => {
      if (node.nextNodeId) {
        flowEdges.push({
          id: `${node.id}-${node.nextNodeId}`,
          source: node.id,
          target: node.nextNodeId,
          animated: true,
          style: { stroke: '#9333ea' },
          markerEnd: { type: MarkerType.ArrowClosed, color: '#9333ea' },
        });
      }
      if (node.choices) {
        node.choices.forEach((choice, index) => {
          flowEdges.push({
            id: `${node.id}-choice${index}-${choice.leadsToNodeId}`,
            source: node.id,
            sourceHandle: `choice${index + 1}`,
            target: choice.leadsToNodeId,
            animated: true,
            label: choice.text,
            style: { stroke: '#3b82f6' },
            markerEnd: { type: MarkerType.ArrowClosed, color: '#3b82f6' },
          });
        });
      }
    });

    setEdges(flowEdges);
  };

  const getNodeType = (node: StoryNode): string => {
    if (node.nodeType === 'start') return 'start';
    if (node.nodeType === 'end') return 'end';
    if (node.nodeType === 'merge') return 'merge';
    if (node.choices && node.choices.length > 0) return 'choice';
    if (node.setsFlags && node.setsFlags.length > 0) return 'checkpoint';
    return 'scene';
  };

  const calculateNodePosition = (index: number, total: number) => {
    const cols = 4;
    const xSpacing = 300;
    const ySpacing = 200;
    const col = index % cols;
    const row = Math.floor(index / cols);
    return { x: 200 + col * xSpacing, y: 100 + row * ySpacing };
  };

  const onConnect = useCallback(
    (params: Connection) => {
      setEdges((eds) => addEdge({
        ...params,
        animated: true,
        style: { stroke: '#9333ea' },
        markerEnd: { type: MarkerType.ArrowClosed, color: '#9333ea' },
      }, eds));
    },
    [setEdges]
  );

  const onNodeClick = (event: React.MouseEvent, node: Node) => {
    setSelectedNode(node);
    setNodeLabel(node.data.label || '');
    setNodeDescription(node.data.description || '');
    setNodeTimestamp(node.data.timestamp || 0);
    setNodeChoices(node.data.choices || []);
    setNodeFlags(node.data.setsFlags || []);
    setNodeAudioUrl(node.data.audioUrl || '');
    setShowNodeEditor(true);
  };

  const addNewNode = (type: string) => {
    const newNode: Node = {
      id: `node_${Date.now()}`,
      type,
      position: { x: 400, y: 300 },
      data: {
        label: `New ${type} node`,
        description: '',
      },
    };
    setNodes((nds) => [...nds, newNode]);
  };

  const updateSelectedNode = () => {
    if (!selectedNode) return;

    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === selectedNode.id) {
          return {
            ...node,
            data: {
              ...node.data,
              label: nodeLabel,
              description: nodeDescription,
              timestamp: nodeTimestamp,
              choices: nodeChoices,
              setsFlags: nodeFlags,
              audioUrl: nodeAudioUrl,
            },
          };
        }
        return node;
      })
    );

    setShowNodeEditor(false);
  };

  const deleteSelectedNode = () => {
    if (!selectedNode) return;

    setNodes((nds) => nds.filter((node) => node.id !== selectedNode.id));
    setEdges((eds) => eds.filter((edge) => edge.source !== selectedNode.id && edge.target !== selectedNode.id));
    setShowNodeEditor(false);
    setSelectedNode(null);
  };

  const saveEpisodeFlow = async () => {
    const flowNodes = getNodes();
    const flowEdges = getEdges();

    // Convert ReactFlow nodes back to StoryNodes
    const storyNodes: StoryNode[] = flowNodes.map((node) => ({
      id: node.id,
      episodeId,
      nodeType: node.type as any,
      audioUrl: node.data.audioUrl || '',
      duration: 0,
      title: node.data.label || '',
      description: node.data.description,
      timestamp: node.data.timestamp,
      choices: node.data.choices,
      setsFlags: node.data.setsFlags,
      requiredFlags: node.data.requiredFlags,
      nextNodeId: flowEdges.find(e => e.source === node.id && !e.sourceHandle)?.target,
    }));

    try {
      const response = await fetch(`/api/interactive-series/${seriesId}/episodes/${episodeId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nodes: storyNodes }),
      });

      const data = await response.json();
      if (data.success) {
        alert('Episode flow saved successfully!');
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error('Failed to save episode flow:', error);
      alert('Failed to save episode flow');
    }
  };

  const autoLayout = () => {
    const layoutedNodes = getNodes().map((node, index) => {
      const position = calculateNodePosition(index, getNodes().length);
      return { ...node, position };
    });
    setNodes(layoutedNodes);
    setTimeout(() => fitView(), 0);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-black text-white flex">
      {/* Main Canvas */}
      <div className="flex-1 relative">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={onNodeClick}
          nodeTypes={nodeTypes}
          fitView
          className="bg-gray-950"
        >
          <Background color="#4a5568" gap={20} />
          <MiniMap 
            className="!bg-gray-900" 
            nodeColor={(node) => {
              switch (node.type) {
                case 'start': return '#10b981';
                case 'end': return '#ef4444';
                case 'choice': return '#3b82f6';
                case 'checkpoint': return '#eab308';
                case 'merge': return '#9333ea';
                default: return '#6b7280';
              }
            }}
          />
          <Controls className="!bg-gray-900" />
          
          {/* Top Panel */}
          <Panel position="top-left" className="bg-black/80 backdrop-blur rounded-lg p-4 m-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push(`/admin/interactive/${seriesId}/episodes`)}
                className="p-2 bg-gray-800 hover:bg-gray-700 rounded-lg"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-xl font-bold flex items-center gap-2">
                  <Map className="w-6 h-6 text-purple-500" />
                  Visual Story Builder
                </h1>
                <p className="text-sm text-gray-400">
                  {series?.title} - Episode {episode?.episodeNumber}: {episode?.title}
                </p>
              </div>
            </div>
          </Panel>

          {/* Toolbar */}
          <Panel position="top-right" className="bg-black/80 backdrop-blur rounded-lg p-4 m-4">
            <div className="flex gap-2">
              <button
                onClick={saveEpisodeFlow}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                Save Flow
              </button>
              <button
                onClick={autoLayout}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg flex items-center gap-2"
              >
                <Layers className="w-4 h-4" />
                Auto Layout
              </button>
              <button
                onClick={() => setShowSeasonMap(true)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg flex items-center gap-2"
              >
                <Map className="w-4 h-4" />
                Season Map
              </button>
            </div>
          </Panel>

          {/* Add Node Panel */}
          <Panel position="bottom-left" className="bg-black/80 backdrop-blur rounded-lg p-4 m-4">
            <p className="text-sm font-semibold mb-2 text-gray-400">Add Node:</p>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => addNewNode('scene')}
                className="p-2 bg-gray-800 hover:bg-gray-700 rounded flex flex-col items-center gap-1"
                title="Scene Node"
              >
                <FileText className="w-4 h-4" />
                <span className="text-xs">Scene</span>
              </button>
              <button
                onClick={() => addNewNode('choice')}
                className="p-2 bg-blue-800 hover:bg-blue-700 rounded flex flex-col items-center gap-1"
                title="Choice Node"
              >
                <GitBranch className="w-4 h-4" />
                <span className="text-xs">Choice</span>
              </button>
              <button
                onClick={() => addNewNode('checkpoint')}
                className="p-2 bg-yellow-800 hover:bg-yellow-700 rounded flex flex-col items-center gap-1"
                title="Checkpoint Node"
              >
                <Flag className="w-4 h-4" />
                <span className="text-xs">Check</span>
              </button>
              <button
                onClick={() => addNewNode('merge')}
                className="p-2 bg-purple-800 hover:bg-purple-700 rounded flex flex-col items-center gap-1"
                title="Merge Node"
              >
                <Target className="w-4 h-4" />
                <span className="text-xs">Merge</span>
              </button>
              <button
                onClick={() => addNewNode('end')}
                className="p-2 bg-red-800 hover:bg-red-700 rounded flex flex-col items-center gap-1"
                title="End Node"
              >
                <CheckCircle className="w-4 h-4" />
                <span className="text-xs">End</span>
              </button>
            </div>
          </Panel>

          {/* Node Statistics */}
          <Panel position="bottom-right" className="bg-black/80 backdrop-blur rounded-lg p-4 m-4">
            <div className="text-sm space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-gray-400">Total Nodes:</span>
                <span className="font-bold">{nodes.length}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-400">Connections:</span>
                <span className="font-bold">{edges.length}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-400">Choice Points:</span>
                <span className="font-bold">{nodes.filter(n => n.type === 'choice').length}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-400">Checkpoints:</span>
                <span className="font-bold">{nodes.filter(n => n.type === 'checkpoint').length}</span>
              </div>
            </div>
          </Panel>
        </ReactFlow>
      </div>

      {/* Node Editor Sidebar */}
      {showNodeEditor && selectedNode && (
        <div className="w-96 bg-gray-900 border-l border-gray-800 p-6 overflow-y-auto">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Edit2 className="w-5 h-5 text-purple-400" />
              Edit Node
            </h3>
            <button
              onClick={() => setShowNodeEditor(false)}
              className="text-gray-400 hover:text-white"
            >
              <XCircle className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Node Type</label>
              <div className="bg-gray-800 rounded px-3 py-2 text-gray-400">
                {selectedNode.type}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Title</label>
              <input
                type="text"
                value={nodeLabel}
                onChange={(e) => setNodeLabel(e.target.value)}
                className="w-full bg-gray-800 rounded px-3 py-2"
                placeholder="Enter node title"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Description</label>
              <textarea
                value={nodeDescription}
                onChange={(e) => setNodeDescription(e.target.value)}
                className="w-full bg-gray-800 rounded px-3 py-2 h-20"
                placeholder="Enter node description"
              />
            </div>

            {selectedNode.type === 'choice' && (
              <>
                <div>
                  <label className="block text-sm font-medium mb-2">Timestamp (seconds)</label>
                  <input
                    type="number"
                    value={nodeTimestamp}
                    onChange={(e) => setNodeTimestamp(Number(e.target.value))}
                    className="w-full bg-gray-800 rounded px-3 py-2"
                    placeholder="When to show choices"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Choices</label>
                  <div className="space-y-2">
                    {nodeChoices.map((choice, index) => (
                      <div key={index} className="flex gap-2">
                        <input
                          type="text"
                          value={choice.text || ''}
                          onChange={(e) => {
                            const updated = [...nodeChoices];
                            updated[index] = { ...choice, text: e.target.value };
                            setNodeChoices(updated);
                          }}
                          className="flex-1 bg-gray-800 rounded px-3 py-2 text-sm"
                          placeholder={`Choice ${index + 1}`}
                        />
                        <button
                          onClick={() => {
                            setNodeChoices(nodeChoices.filter((_, i) => i !== index));
                          }}
                          className="p-2 bg-red-800 hover:bg-red-700 rounded"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={() => {
                        setNodeChoices([...nodeChoices, { id: `choice_${Date.now()}`, text: '' }]);
                      }}
                      className="w-full px-3 py-2 bg-blue-800 hover:bg-blue-700 rounded flex items-center justify-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      Add Choice
                    </button>
                  </div>
                </div>
              </>
            )}

            {selectedNode.type === 'checkpoint' && (
              <div>
                <label className="block text-sm font-medium mb-2">Sets Flags (Memory)</label>
                <div className="space-y-2">
                  {nodeFlags.map((flag, index) => (
                    <div key={index} className="flex gap-2">
                      <input
                        type="text"
                        value={flag}
                        onChange={(e) => {
                          const updated = [...nodeFlags];
                          updated[index] = e.target.value;
                          setNodeFlags(updated);
                        }}
                        className="flex-1 bg-gray-800 rounded px-3 py-2 text-sm"
                        placeholder="Flag name"
                      />
                      <button
                        onClick={() => {
                          setNodeFlags(nodeFlags.filter((_, i) => i !== index));
                        }}
                        className="p-2 bg-red-800 hover:bg-red-700 rounded"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={() => setNodeFlags([...nodeFlags, ''])}
                    className="w-full px-3 py-2 bg-yellow-800 hover:bg-yellow-700 rounded flex items-center justify-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Add Flag
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Flags are remembered and can affect future episodes
                </p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-2">Audio URL</label>
              <input
                type="text"
                value={nodeAudioUrl}
                onChange={(e) => setNodeAudioUrl(e.target.value)}
                className="w-full bg-gray-800 rounded px-3 py-2"
                placeholder="Audio file URL"
              />
            </div>

            <div className="flex gap-2 pt-4 border-t border-gray-700">
              <button
                onClick={updateSelectedNode}
                className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4" />
                Update Node
              </button>
              <button
                onClick={deleteSelectedNode}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded flex items-center justify-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Season Map Modal */}
      {showSeasonMap && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-lg max-w-4xl w-full max-h-[80vh] overflow-y-auto">
            <div className="sticky top-0 bg-gray-900 border-b border-gray-800 p-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold flex items-center gap-2">
                  <Sparkles className="w-6 h-6 text-purple-400" />
                  Season Overview Map
                </h3>
                <button
                  onClick={() => setShowSeasonMap(false)}
                  className="text-gray-400 hover:text-white"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="bg-gray-800 rounded-lg p-6 mb-4">
                <h4 className="font-semibold mb-3">Episode Flow Structure</h4>
                <div className="space-y-3 text-sm">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-green-600 rounded flex items-center justify-center">
                      <span className="font-bold">1</span>
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold">Episode 1: {episode?.title}</p>
                      <p className="text-gray-400 text-xs">
                        {nodes.filter(n => n.type === 'choice').length} choices,{' '}
                        {nodes.filter(n => n.type === 'checkpoint').length} checkpoints
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-4">
                <h4 className="font-semibold text-blue-400 mb-2">Memory System</h4>
                <p className="text-sm text-gray-300">
                  Checkpoints save player progress and choices. These memories carry forward to future episodes,
                  allowing you to create branching narratives that remember player decisions across the entire season.
                </p>
                <div className="mt-3 space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Flag className="w-4 h-4 text-yellow-400" />
                    <span>Checkpoint nodes save specific flags/states</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Target className="w-4 h-4 text-purple-400" />
                    <span>Merge nodes bring different paths back together</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <GitBranch className="w-4 h-4 text-blue-400" />
                    <span>Choice nodes create branching paths</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Main export with ReactFlowProvider
export default function VisualBuilderPage() {
  return (
    <ReactFlowProvider>
      <VisualBuilderFlow />
    </ReactFlowProvider>
  );
}