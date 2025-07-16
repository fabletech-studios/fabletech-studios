import fs from 'fs/promises';
import path from 'path';

export interface SeriesData {
  id: string;
  title: string;
  description: string;
  author?: string;
  genre?: string;
  episodes: {
    episodeId: string;
    episodeNumber: number;
    title: string;
    videoPath: string;
    audioPath: string;
    thumbnailPath: string;
    duration?: string;
    credits?: number;
    isFree?: boolean;
    description?: string;
  }[];
  createdAt: string;
}

const CONTENT_DIR = path.join(process.cwd(), 'public/uploads/series');

export async function getAllSeries(): Promise<SeriesData[]> {
  try {
    await fs.mkdir(CONTENT_DIR, { recursive: true });
    const files = await fs.readdir(CONTENT_DIR);
    const jsonFiles = files.filter(f => f.endsWith('.json'));
    
    const series = await Promise.all(
      jsonFiles.map(async (file) => {
        const content = await fs.readFile(path.join(CONTENT_DIR, file), 'utf-8');
        const seriesData = JSON.parse(content) as SeriesData;
        // Sort episodes by episode number
        seriesData.episodes.sort((a, b) => a.episodeNumber - b.episodeNumber);
        return seriesData;
      })
    );
    
    return series.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  } catch (error) {
    console.error('Error reading series:', error);
    return [];
  }
}

export async function getSeriesById(seriesId: string): Promise<SeriesData | null> {
  try {
    const filePath = path.join(CONTENT_DIR, `${seriesId}.json`);
    const content = await fs.readFile(filePath, 'utf-8');
    const seriesData = JSON.parse(content) as SeriesData;
    // Sort episodes by episode number
    seriesData.episodes.sort((a, b) => a.episodeNumber - b.episodeNumber);
    return seriesData;
  } catch (error) {
    console.error('Error reading series:', error);
    return null;
  }
}

export async function getEpisodeData(seriesId: string, episodeNumber: number) {
  const series = await getSeriesById(seriesId);
  if (!series) return null;
  
  return series.episodes.find(ep => ep.episodeNumber === episodeNumber);
}