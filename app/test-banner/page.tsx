'use client';

import { useState, useEffect } from 'react';

export default function TestBannerPage() {
  const [series, setSeries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/content')
      .then(res => res.json())
      .then(data => {
        if (data.series) {
          setSeries(data.series);
        }
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="p-8">Loading...</div>;
  if (error) return <div className="p-8 text-red-500">Error: {error}</div>;

  return (
    <div className="p-8 bg-gray-900 min-h-screen text-white">
      <h1 className="text-2xl font-bold mb-6">Banner Test Page</h1>
      
      {series.length === 0 ? (
        <p>No series found</p>
      ) : (
        <div className="space-y-8">
          {series.map(s => (
            <div key={s.id} className="border border-gray-700 rounded-lg p-4">
              <h2 className="text-xl font-semibold mb-2">{s.title}</h2>
              
              <div className="mb-4">
                <p className="text-sm text-gray-400">Banner URL: {s.bannerUrl || 'Not set'}</p>
                <p className="text-sm text-gray-400">Banner Image: {s.bannerImage || 'Not set'}</p>
              </div>
              
              {s.bannerUrl && (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-semibold mb-2">Banner Display Test:</h3>
                    <div className="relative h-64 bg-gray-800 rounded overflow-hidden">
                      <img 
                        src={s.bannerUrl} 
                        alt={s.title}
                        className="w-full h-full object-cover"
                        onLoad={(e) => console.log('Banner loaded:', s.title)}
                        onError={(e) => {
                          console.error('Banner failed to load:', s.title, e);
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          target.insertAdjacentHTML('afterend', 
                            '<div class="text-red-500 p-4">Failed to load banner image</div>'
                          );
                        }}
                      />
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-semibold mb-2">Direct Link Test:</h3>
                    <a 
                      href={s.bannerUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:underline text-sm break-all"
                    >
                      {s.bannerUrl}
                    </a>
                  </div>
                </div>
              )}
              
              {!s.bannerUrl && !s.bannerImage && (
                <p className="text-yellow-500">No banner configured for this series</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}