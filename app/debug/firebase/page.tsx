'use client';

import { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle, Loader } from 'lucide-react';
import PremiumLogo from '@/components/PremiumLogo';

export default function FirebaseDebugPage() {
  const [loading, setLoading] = useState(true);
  const [series, setSeries] = useState<any[]>([]);
  const [selectedSeries, setSelectedSeries] = useState<string>('');
  const [episodes, setEpisodes] = useState<any[]>([]);
  const [storageFiles, setStorageFiles] = useState<any[]>([]);
  const [diagnostics, setDiagnostics] = useState<any>({});

  useEffect(() => {
    loadSeries();
  }, []);

  const loadSeries = async () => {
    try {
      const response = await fetch('/api/content');
      const data = await response.json();
      if (data.series) {
        setSeries(data.series);
      }
    } catch (error) {
      console.error('Error loading series:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadEpisodes = async (seriesId: string) => {
    setSelectedSeries(seriesId);
    try {
      const response = await fetch(`/api/hybrid/episodes?seriesId=${seriesId}`);
      const data = await response.json();
      if (data.episodes) {
        setEpisodes(data.episodes);
        
        // Run diagnostics on each episode
        for (const episode of data.episodes) {
          await diagnoseEpisode(seriesId, episode);
        }
      }
    } catch (error) {
      console.error('Error loading episodes:', error);
    }
  };

  const diagnoseEpisode = async (seriesId: string, episode: any) => {
    const diagnosis: any = {
      episodeId: episode.id,
      episodeNumber: episode.episodeNumber,
      title: episode.title,
      issues: [],
      checks: {}
    };

    // Check 1: Video URL format
    const videoUrl = episode.videoUrl || episode.videoPath;
    if (videoUrl) {
      diagnosis.checks.videoUrl = videoUrl;
      if (episode.videoPath && !episode.videoUrl) {
        diagnosis.issues.push('Episode has videoPath but no videoUrl');
      }
      
      // Check if it's a Firebase Storage path
      if (videoUrl.startsWith('videos/') || videoUrl.startsWith('uploads/')) {
        diagnosis.checks.videoUrlType = 'Firebase Path';
        
        // Check if file exists in Firebase
        try {
          const checkResponse = await fetch('/api/debug/storage-check', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ filePath: videoUrl })
          });
          if (checkResponse.ok) {
            const checkData = await checkResponse.json();
            diagnosis.checks.fileExists = checkData.exists;
            diagnosis.checks.fileSize = checkData.size;
            if (!checkData.exists) {
              diagnosis.issues.push('Video file not found in Firebase Storage');
            }
          }
        } catch (error) {
          diagnosis.issues.push('Cannot verify file existence');
        }
      } else if (videoUrl.startsWith('http')) {
        diagnosis.checks.videoUrlType = 'HTTP URL';
        
        // Check if URL is accessible
        try {
          const response = await fetch(videoUrl, { method: 'HEAD' });
          diagnosis.checks.urlAccessible = response.ok;
          if (!response.ok) {
            diagnosis.issues.push(`Video URL returns ${response.status}`);
          }
        } catch (error) {
          diagnosis.issues.push('Video URL not accessible (CORS or network error)');
        }
      } else {
        diagnosis.checks.videoUrlType = 'Unknown format';
        diagnosis.issues.push('Video URL format not recognized');
      }
    } else {
      diagnosis.issues.push('No video URL');
    }

    // Check 2: Audio URL (if exists)
    if (episode.audioUrl) {
      diagnosis.checks.audioUrl = episode.audioUrl;
      // Similar checks as video...
    }

    // Check 3: Thumbnail URL
    if (episode.thumbnailUrl) {
      diagnosis.checks.thumbnailUrl = episode.thumbnailUrl;
    } else {
      diagnosis.issues.push('No thumbnail URL');
    }

    // Check 4: Media serving endpoint
    diagnosis.checks.mediaEndpoint = `/api/media/${episode.id}/video`;
    try {
      const mediaResponse = await fetch(diagnosis.checks.mediaEndpoint, { method: 'HEAD' });
      diagnosis.checks.mediaEndpointStatus = mediaResponse.status;
      if (!mediaResponse.ok) {
        diagnosis.issues.push(`Media endpoint returns ${mediaResponse.status}`);
      }
    } catch (error) {
      diagnosis.issues.push('Media endpoint not accessible');
    }

    setDiagnostics(prev => ({
      ...prev,
      [episode.id]: diagnosis
    }));
  };

  const checkFirebaseStorage = async () => {
    try {
      const response = await fetch('/api/debug/storage-list');
      if (response.ok) {
        const data = await response.json();
        setStorageFiles(data.files || []);
      }
    } catch (error) {
      console.error('Error checking storage:', error);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <PremiumLogo />
          <h1 className="text-2xl font-bold">Firebase Media Diagnostics</h1>
        </div>

        {/* Series Selection */}
        <div className="bg-gray-900 rounded-lg p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Select Series to Diagnose</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {series.map(s => (
              <button
                key={s.id}
                onClick={() => loadEpisodes(s.id)}
                className={`p-3 rounded-lg border transition-all ${
                  selectedSeries === s.id 
                    ? 'border-red-600 bg-red-900/20' 
                    : 'border-gray-700 hover:border-gray-600'
                }`}
              >
                <div className="font-medium">{s.title}</div>
                <div className="text-sm text-gray-400">{s.id}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Episodes Diagnostics */}
        {selectedSeries && (
          <div className="space-y-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Episodes in {selectedSeries}</h2>
              <button
                onClick={checkFirebaseStorage}
                className="px-4 py-2 bg-blue-600 rounded-lg hover:bg-blue-700"
              >
                Check Firebase Storage
              </button>
            </div>

            {episodes.map(episode => {
              const diag = diagnostics[episode.id];
              return (
                <div key={episode.id} className="bg-gray-900 rounded-lg p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-semibold">
                        Episode {episode.episodeNumber}: {episode.title}
                      </h3>
                      <p className="text-sm text-gray-400">ID: {episode.id}</p>
                    </div>
                    {diag && (
                      <div className="flex items-center gap-2">
                        {diag.issues.length === 0 ? (
                          <>
                            <CheckCircle className="w-5 h-5 text-green-500" />
                            <span className="text-green-500">OK</span>
                          </>
                        ) : (
                          <>
                            <AlertCircle className="w-5 h-5 text-red-500" />
                            <span className="text-red-500">{diag.issues.length} issues</span>
                          </>
                        )}
                      </div>
                    )}
                  </div>

                  {diag && (
                    <div className="space-y-3">
                      {/* URL Information */}
                      <div className="bg-black/50 rounded p-3">
                        <h4 className="font-medium mb-2">URLs:</h4>
                        <div className="space-y-1 text-sm">
                          <div>
                            <span className="text-gray-400">Video URL:</span>{' '}
                            <code className="text-blue-400">{diag.checks.videoUrl || 'None'}</code>
                          </div>
                          {episode.videoPath && !episode.videoUrl && (
                            <div>
                              <span className="text-gray-400">Video Path (legacy):</span>{' '}
                              <code className="text-yellow-400">{episode.videoPath}</code>
                            </div>
                          )}
                          <div>
                            <span className="text-gray-400">Type:</span>{' '}
                            <span className={diag.checks.videoUrlType === 'Firebase Path' ? 'text-green-400' : 'text-yellow-400'}>
                              {diag.checks.videoUrlType}
                            </span>
                          </div>
                          {diag.checks.fileExists !== undefined && (
                            <div>
                              <span className="text-gray-400">File Exists:</span>{' '}
                              <span className={diag.checks.fileExists ? 'text-green-400' : 'text-red-400'}>
                                {diag.checks.fileExists ? 'Yes' : 'No'}
                              </span>
                            </div>
                          )}
                          <div>
                            <span className="text-gray-400">Media Endpoint:</span>{' '}
                            <code className="text-blue-400">{diag.checks.mediaEndpoint}</code>
                            {diag.checks.mediaEndpointStatus && (
                              <span className={`ml-2 ${diag.checks.mediaEndpointStatus === 200 ? 'text-green-400' : 'text-red-400'}`}>
                                (Status: {diag.checks.mediaEndpointStatus})
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Issues */}
                      {diag.issues.length > 0 && (
                        <div className="bg-red-900/20 border border-red-800 rounded p-3">
                          <h4 className="font-medium mb-2 text-red-400">Issues Found:</h4>
                          <ul className="list-disc list-inside space-y-1 text-sm">
                            {diag.issues.map((issue, i) => (
                              <li key={i} className="text-red-300">{issue}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Quick Fix Button */}
                      {diag.issues.length > 0 && (
                        <button
                          onClick={() => fixEpisode(episode)}
                          className="px-4 py-2 bg-yellow-600 rounded-lg hover:bg-yellow-700 text-sm"
                        >
                          Attempt Auto-Fix
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Storage Files */}
        {storageFiles.length > 0 && (
          <div className="mt-8 bg-gray-900 rounded-lg p-6">
            <h2 className="text-lg font-semibold mb-4">Files in Firebase Storage</h2>
            <div className="space-y-2">
              {storageFiles.map((file, i) => (
                <div key={i} className="bg-black/50 rounded p-2 text-sm">
                  <code>{file.name}</code>
                  <span className="text-gray-400 ml-2">({(file.size / (1024 * 1024)).toFixed(2)}MB)</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  async function fixEpisode(episode: any) {
    // Implementation for auto-fixing common issues
    console.log('Attempting to fix episode:', episode);
    
    // If episode has videoPath but no videoUrl, update it
    if (episode.videoPath && !episode.videoUrl) {
      try {
        const response = await fetch(`/api/content/${selectedSeries}/episode/${episode.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            videoUrl: episode.videoPath,
            audioUrl: episode.audioPath || '',
            thumbnailUrl: episode.thumbnailPath || ''
          })
        });
        
        if (response.ok) {
          alert('Episode URLs updated! Refreshing...');
          loadEpisodes(selectedSeries);
        }
      } catch (error) {
        console.error('Fix failed:', error);
      }
    }
  }
}