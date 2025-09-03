import { NextRequest, NextResponse } from 'next/server';

// Dynamic import to avoid initialization issues
async function getAdminDb() {
  try {
    const { getAdminDb } = await import('@/lib/firebase/admin');
    return await getAdminDb();
  } catch (error) {
    console.error('Failed to import admin services:', error);
    return null;
  }
}

// POST - Fix episodes with missing or broken node structure
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const adminDb = await getAdminDb();
    
    if (!adminDb) {
      return NextResponse.json(
        { success: false, error: 'Database not initialized' },
        { status: 500 }
      );
    }

    const { id: seriesId } = params;

    // Get all episodes for this series
    const snapshot = await adminDb
      .collection('interactiveEpisodes')
      .where('seriesId', '==', seriesId)
      .get();

    let fixedCount = 0;
    const batch = adminDb.batch();

    snapshot.forEach((doc) => {
      const episode = doc.data();
      
      // Check if episode needs fixing
      if (!episode.nodes || episode.nodes.length === 0) {
        // Add default nodes
        const defaultNodes = [
          {
            id: 'start_node',
            episodeId: doc.id,
            nodeType: 'start',
            audioUrl: '',
            duration: 0,
            title: 'Episode Start',
            description: 'The beginning of your story',
            timestamp: 0,
            nextNodeId: 'end_node'
          },
          {
            id: 'end_node',
            episodeId: doc.id,
            nodeType: 'end',
            audioUrl: '',
            duration: 0,
            title: 'Episode End',
            description: 'The end of this path',
            timestamp: 0
          }
        ];

        batch.update(doc.ref, {
          nodes: defaultNodes,
          startNodeId: 'start_node',
          updatedAt: new Date()
        });
        
        fixedCount++;
      } else {
        // Ensure all nodes have required fields
        const fixedNodes = episode.nodes.map((node: any) => ({
          ...node,
          episodeId: node.episodeId || doc.id,
          duration: node.duration || 0,
          timestamp: node.timestamp || 0,
          audioUrl: node.audioUrl || ''
        }));

        if (JSON.stringify(fixedNodes) !== JSON.stringify(episode.nodes)) {
          batch.update(doc.ref, {
            nodes: fixedNodes,
            updatedAt: new Date()
          });
          fixedCount++;
        }
      }
    });

    await batch.commit();

    return NextResponse.json({
      success: true,
      message: `Fixed ${fixedCount} episodes`,
      totalEpisodes: snapshot.size
    });
  } catch (error: any) {
    console.error('Error fixing episodes:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}