import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { getSeriesById } from '@/lib/content-manager';

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ seriesId: string; episodeId: string }> }
) {
  try {
    const { seriesId, episodeId } = await context.params;
    
    // Read series data
    const seriesFilePath = path.join(process.cwd(), 'public/uploads/series', `${seriesId}.json`);
    const seriesData = JSON.parse(await fs.readFile(seriesFilePath, 'utf-8'));
    
    // Find the episode to delete
    const episodeIndex = seriesData.episodes.findIndex((ep: any) => ep.episodeId === episodeId);
    if (episodeIndex === -1) {
      return NextResponse.json(
        { success: false, error: 'Episode not found' },
        { status: 404 }
      );
    }
    
    const episode = seriesData.episodes[episodeIndex];
    
    // Delete episode files
    const filesToDelete = [
      episode.videoPath,
      episode.audioPath,
      episode.thumbnailPath
    ].filter(Boolean);
    
    for (const filePath of filesToDelete) {
      try {
        const fullPath = path.join(process.cwd(), 'public', filePath);
        await fs.unlink(fullPath);
      } catch (err) {
        console.error(`Failed to delete file: ${filePath}`, err);
      }
    }
    
    // Remove episode from series data
    seriesData.episodes.splice(episodeIndex, 1);
    
    // Save updated series data
    await fs.writeFile(seriesFilePath, JSON.stringify(seriesData, null, 2));
    
    return NextResponse.json({
      success: true,
      message: 'Episode deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting episode:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete episode' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ seriesId: string; episodeId: string }> }
) {
  try {
    const { seriesId, episodeId } = await context.params;
    const updateData = await request.json();
    
    // Read series data
    const seriesFilePath = path.join(process.cwd(), 'public/uploads/series', `${seriesId}.json`);
    const seriesData = JSON.parse(await fs.readFile(seriesFilePath, 'utf-8'));
    
    // Find and update the episode
    const episodeIndex = seriesData.episodes.findIndex((ep: any) => ep.episodeId === episodeId);
    if (episodeIndex === -1) {
      return NextResponse.json(
        { success: false, error: 'Episode not found' },
        { status: 404 }
      );
    }
    
    // Update episode data
    seriesData.episodes[episodeIndex] = {
      ...seriesData.episodes[episodeIndex],
      ...updateData
    };
    
    // Save updated series data
    await fs.writeFile(seriesFilePath, JSON.stringify(seriesData, null, 2));
    
    return NextResponse.json({
      success: true,
      message: 'Episode updated successfully',
      episode: seriesData.episodes[episodeIndex]
    });
  } catch (error) {
    console.error('Error updating episode:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update episode' },
      { status: 500 }
    );
  }
}