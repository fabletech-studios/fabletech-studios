// Interactive Series Types

export interface InteractiveSeries {
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  coverImageUrl?: string;
  author: string;
  narrator?: string;
  tags: string[];
  totalEpisodes: number;
  isActive: boolean;
  isPremium: boolean;
  creditCost: number;
  createdAt: Date;
  updatedAt: Date;
  stats: {
    totalPlays: number;
    uniquePlayers: number;
    averageCompletion: number;
    totalPaths: number;
  };
}

export interface StoryNode {
  id: string;
  episodeId: string;
  nodeType: 'start' | 'choice' | 'merge' | 'end' | 'checkpoint' | 'scene';
  audioUrl: string;
  duration: number;
  title: string;
  description?: string;
  timestamp?: number; // When this node plays in the episode
  choices?: Choice[];
  requiredFlags?: string[]; // Previous choices that must be made to reach this
  setsFlags?: string[]; // Flags this node sets when reached (memory for next episodes)
  nextNodeId?: string; // For linear progression
  leadsToEpisode?: number; // For end nodes that lead to specific next episodes
  position?: { x: number; y: number }; // Visual position in the flow editor
}

export interface Choice {
  id: string;
  text: string;
  shortText?: string; // For UI display
  leadsToNodeId: string;
  consequence?: string; // Flag that gets set
  requiresFlags?: string[]; // Only show if user has these flags
  isPremium?: boolean; // Premium choice option
}

export interface InteractiveEpisode {
  id: string;
  seriesId: string;
  episodeNumber: number;
  title: string;
  description: string;
  thumbnailUrl?: string;
  nodes: StoryNode[];
  startNodeId: string;
  forkType: 'episode' | 'series'; // Episode forks reset, series forks persist
  mergePoint?: string; // Node ID where paths reconverge
  estimatedDuration: number; // Average playtime
  creditCost: number;
  isPublished: boolean;
  publishedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserStoryState {
  userId: string;
  seriesId: string;
  currentEpisodeId: string;
  currentNodeId: string;
  pathHistory: {
    episodeId: string;
    nodeId: string;
    choiceId?: string;
    timestamp: Date;
  }[];
  storyFlags: string[]; // Accumulated consequences
  episodeFlags: string[]; // Temporary flags for current episode
  decisions: {
    episodeId: string;
    nodeId: string;
    choiceMade: string;
    timestamp: Date;
  }[];
  saveSlots: {
    slot1?: SaveState;
    slot2?: SaveState;
    slot3?: SaveState;
  };
  playthrough: number; // Which playthrough (1st, 2nd, etc.)
  lastPlayedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface SaveState {
  name: string; // User-defined or auto-generated
  episodeId: string;
  nodeId: string;
  storyFlags: string[];
  episodeFlags: string[];
  savedAt: Date;
}

export interface InteractiveProgress {
  episodeId: string;
  nodeId: string;
  completed: boolean;
  choicesMade: string[];
  playTime: number;
}

export interface InteractiveAnalytics {
  seriesId: string;
  episodeId: string;
  nodeId: string;
  choiceId?: string;
  choiceCount: number;
  averageTimeToChoice: number;
  dropOffRate: number;
}