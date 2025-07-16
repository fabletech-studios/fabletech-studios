import { NextRequest, NextResponse } from 'next/server';
import { serverDb } from '@/lib/firebase/server-config';
import { doc, setDoc } from 'firebase/firestore';

export async function POST(request: NextRequest) {
  try {
    if (!serverDb) {
      return NextResponse.json(
        { error: 'Firebase not initialized' },
        { status: 500 }
      );
    }
    
    // Migrate The Bloodline Keeper series
    const bloodlineKeeperSeries = {
      id: 'series-61392a88-7901-4659-a933-48cb89cfbf03',
      title: 'The Bloodline Keeper',
      description: 'A dark fantasy tale of ancient vampires, family curses, and the price of immortality. Follow the journey of the last keeper as they navigate a world where bloodlines determine power.',
      createdAt: new Date(),
      updatedAt: new Date(),
      episodes: [
        {
          episodeId: 'episode-1',
          episodeNumber: 1,
          title: 'The Awakening',
          description: 'The keeper awakens to their destiny',
          videoPath: '/uploads/bloodline-keeper/ep1-video.mp4',
          audioPath: '/uploads/bloodline-keeper/ep1-audio.mp3',
          thumbnailPath: '/uploads/bloodline-keeper/ep1-thumb.jpg',
          duration: '45:00',
          credits: 0,
          isFree: true
        },
        {
          episodeId: 'episode-2',
          episodeNumber: 2,
          title: 'Blood Bonds',
          description: 'Ancient alliances are tested',
          videoPath: '/uploads/bloodline-keeper/ep2-video.mp4',
          audioPath: '/uploads/bloodline-keeper/ep2-audio.mp3',
          thumbnailPath: '/uploads/bloodline-keeper/ep2-thumb.jpg',
          duration: '42:00',
          credits: 30,
          isFree: false
        },
        {
          episodeId: 'episode-3',
          episodeNumber: 3,
          title: 'The Hunt Begins',
          description: 'Enemies close in from all sides',
          videoPath: '/uploads/bloodline-keeper/ep3-video.mp4',
          audioPath: '/uploads/bloodline-keeper/ep3-audio.mp3',
          thumbnailPath: '/uploads/bloodline-keeper/ep3-thumb.jpg',
          duration: '48:00',
          credits: 30,
          isFree: false
        }
      ]
    };

    await setDoc(
      doc(serverDb, 'series', bloodlineKeeperSeries.id), 
      bloodlineKeeperSeries
    );

    return NextResponse.json({
      success: true,
      message: 'Content migrated successfully',
      series: bloodlineKeeperSeries
    });

  } catch (error: any) {
    console.error('Content migration error:', error);
    return NextResponse.json(
      { error: 'Migration failed', details: error.message },
      { status: 500 }
    );
  }
}