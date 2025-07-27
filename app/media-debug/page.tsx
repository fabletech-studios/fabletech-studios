'use client';

import { useState, useEffect } from 'react';
import { useFirebaseCustomerAuth } from '@/contexts/FirebaseCustomerContext';

export default function MediaDebugPage() {
  const { customer } = useFirebaseCustomerAuth();
  const [series, setSeries] = useState<any>(null);
  const [error, setError] = useState('');
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `${new Date().toISOString().slice(11, 19)}: ${message}`]);
  };

  useEffect(() => {
    // Fetch first series to test
    fetch('/api/content')
      .then(res => res.json())
      .then(data => {
        addLog(`API Response: ${JSON.stringify(data).slice(0, 100)}...`);
        if (data.success && data.series?.length > 0) {
          const firstSeries = data.series[0];
          setSeries(firstSeries);
          addLog(`Found series: ${firstSeries.title}`);
          
          if (firstSeries.episodes?.length > 0) {
            const firstEpisode = firstSeries.episodes[0];
            addLog(`First episode: ${firstEpisode.title}`);
            addLog(`Video path: ${firstEpisode.videoPath || 'MISSING'}`);
            addLog(`Audio path: ${firstEpisode.audioPath || 'MISSING'}`);
            addLog(`Thumbnail: ${firstEpisode.thumbnailPath || 'MISSING'}`);
            
            // Test if URLs are accessible
            if (firstEpisode.videoPath) {
              testMediaUrl(firstEpisode.videoPath, 'Video');
            }
            if (firstEpisode.audioPath) {
              testMediaUrl(firstEpisode.audioPath, 'Audio');
            }
          }
        }
      })
      .catch(err => {
        setError(err.message);
        addLog(`Error fetching content: ${err.message}`);
      });
  }, []);

  const testMediaUrl = async (url: string, type: string) => {
    try {
      addLog(`Testing ${type} URL...`);
      const response = await fetch(url, { method: 'HEAD' });
      addLog(`${type} response: ${response.status} ${response.statusText}`);
      
      if (!response.ok) {
        addLog(`${type} headers: ${JSON.stringify(Object.fromEntries(response.headers))}`);
      }
    } catch (error: any) {
      addLog(`${type} fetch error: ${error.message}`);
    }
  };

  const testVideoElement = (url: string) => {
    addLog('Creating video element test...');
    const video = document.createElement('video');
    
    video.onloadedmetadata = () => {
      addLog('✅ Video metadata loaded successfully');
      addLog(`Duration: ${video.duration}s`);
    };
    
    video.onerror = (e) => {
      addLog(`❌ Video error: ${JSON.stringify(e)}`);
      // @ts-ignore
      if (video.error) {
        // @ts-ignore
        addLog(`Error code: ${video.error.code}, message: ${video.error.message}`);
      }
    };
    
    video.src = url;
    video.load();
  };

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <h1 className="text-2xl font-bold mb-4">Media Debug Page</h1>
      
      {error && (
        <div className="bg-red-900/50 p-4 rounded mb-4">
          Error: {error}
        </div>
      )}
      
      {series && (
        <div className="mb-8 bg-gray-900 p-4 rounded">
          <h2 className="font-bold">Series: {series.title}</h2>
          <p>Episodes: {series.episodes?.length || 0}</p>
          
          {series.episodes?.[0] && (
            <div className="mt-4 space-y-2">
              <p>First Episode: {series.episodes[0].title}</p>
              <div className="text-xs font-mono">
                <p>Video: {series.episodes[0].videoPath?.slice(0, 80)}...</p>
                <p>Audio: {series.episodes[0].audioPath?.slice(0, 80)}...</p>
              </div>
              
              {series.episodes[0].videoPath && (
                <button
                  onClick={() => testVideoElement(series.episodes[0].videoPath)}
                  className="px-4 py-2 bg-blue-600 rounded hover:bg-blue-700 mt-2"
                >
                  Test Video Element
                </button>
              )}
            </div>
          )}
        </div>
      )}
      
      <div className="bg-gray-900 rounded p-4">
        <h3 className="font-bold mb-2">Debug Logs:</h3>
        <pre className="text-xs font-mono whitespace-pre-wrap">
          {logs.join('\n')}
        </pre>
      </div>
    </div>
  );
}