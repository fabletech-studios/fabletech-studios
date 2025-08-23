// Mock data for local development when Firebase Admin SDK is not configured
export const mockContests = [
  {
    id: 'contest-1',
    title: 'Summer Writing Contest 2024',
    shortDescription: 'Share your best summer stories',
    description: 'Submit your most captivating summer-themed stories for a chance to win amazing prizes!',
    category: 'general',
    genres: ['Fiction', 'Adventure', 'Romance'],
    status: 'voting',
    featured: true,
    slug: 'summer-writing-contest-2024',
    
    prizes: {
      first: { title: 'First Place', description: 'Cash prize + Publication', value: '$1000' },
      second: { title: 'Second Place', description: 'Cash prize', value: '$500' },
      third: { title: 'Third Place', description: 'Cash prize', value: '$250' },
      honorableMentions: 5
    },
    
    rules: {
      minWords: 1000,
      maxWords: 5000,
      eligibility: ['Must be 18 or older', 'Original work only'],
      submissionLimit: 1,
      allowMultipleSubmissions: false
    },
    
    dates: {
      announced: '2024-07-01T00:00:00Z',
      submissionStart: '2024-07-15T00:00:00Z',
      submissionEnd: '2024-08-15T23:59:59Z',
      votingStart: '2024-08-16T00:00:00Z',
      votingEnd: '2024-08-31T23:59:59Z',
      winnersAnnounced: '2024-09-05T00:00:00Z'
    },
    
    voting: {
      allowMultipleVotes: true,
      votesPerUser: null,
      voteTypes: {
        free: true,
        premium: true,
        super: true
      }
    },
    
    stats: {
      totalSubmissions: 142,
      totalVotes: 3847,
      totalParticipants: 256,
      totalViews: 12543
    },
    
    createdAt: '2024-07-01T00:00:00Z',
    updatedAt: '2024-08-20T00:00:00Z',
    createdBy: 'admin@fabletech.studio'
  },
  {
    id: 'contest-2',
    title: 'Horror Story Competition',
    shortDescription: 'Unleash your darkest tales',
    description: 'Submit your most spine-chilling horror stories and compete for exclusive prizes!',
    category: 'fiction',
    genres: ['Horror', 'Thriller', 'Mystery'],
    status: 'submission',
    featured: false,
    slug: 'horror-story-competition',
    
    prizes: {
      first: { title: 'First Place', description: 'Publishing deal', value: 'Book Deal' },
      second: { title: 'Second Place', description: 'Cash prize', value: '$300' },
      third: { title: 'Third Place', description: 'Cash prize', value: '$150' },
      honorableMentions: 3
    },
    
    rules: {
      minWords: 2000,
      maxWords: 8000,
      eligibility: ['Must be 18 or older', 'Original work only', 'No AI-generated content'],
      submissionLimit: 2,
      allowMultipleSubmissions: true
    },
    
    dates: {
      announced: '2024-08-01T00:00:00Z',
      submissionStart: '2024-08-10T00:00:00Z',
      submissionEnd: '2024-09-10T23:59:59Z',
      votingStart: '2024-09-11T00:00:00Z',
      votingEnd: '2024-09-25T23:59:59Z',
      winnersAnnounced: '2024-09-30T00:00:00Z'
    },
    
    voting: {
      allowMultipleVotes: true,
      votesPerUser: 5,
      voteTypes: {
        free: true,
        premium: true,
        super: true
      }
    },
    
    stats: {
      totalSubmissions: 67,
      totalVotes: 0,
      totalParticipants: 89,
      totalViews: 4521
    },
    
    createdAt: '2024-08-01T00:00:00Z',
    updatedAt: '2024-08-22T00:00:00Z',
    createdBy: 'admin@fabletech.studio'
  },
  {
    id: 'contest-3',
    title: 'Poetry Slam 2024',
    shortDescription: 'Express yourself through verse',
    description: 'Share your most powerful poetry and compete with talented poets worldwide!',
    category: 'poetry',
    genres: ['Poetry'],
    status: 'upcoming',
    featured: true,
    slug: 'poetry-slam-2024',
    
    prizes: {
      first: { title: 'First Place', description: 'Poetry anthology inclusion', value: '$500' },
      second: { title: 'Second Place', description: 'Cash prize', value: '$250' },
      third: { title: 'Third Place', description: 'Cash prize', value: '$100' },
      honorableMentions: 10
    },
    
    rules: {
      minWords: 50,
      maxWords: 500,
      eligibility: ['Open to all ages', 'Original work only'],
      submissionLimit: 3,
      allowMultipleSubmissions: true
    },
    
    dates: {
      announced: '2024-08-20T00:00:00Z',
      submissionStart: '2024-09-01T00:00:00Z',
      submissionEnd: '2024-09-30T23:59:59Z',
      votingStart: '2024-10-01T00:00:00Z',
      votingEnd: '2024-10-15T23:59:59Z',
      winnersAnnounced: '2024-10-20T00:00:00Z'
    },
    
    voting: {
      allowMultipleVotes: false,
      votesPerUser: 1,
      voteTypes: {
        free: true,
        premium: true,
        super: false
      }
    },
    
    stats: {
      totalSubmissions: 0,
      totalVotes: 0,
      totalParticipants: 0,
      totalViews: 823
    },
    
    createdAt: '2024-08-20T00:00:00Z',
    updatedAt: '2024-08-20T00:00:00Z',
    createdBy: 'admin@fabletech.studio'
  }
];