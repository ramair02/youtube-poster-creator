'use client';

import React, { useState } from 'react';

type ProcessState = 'idle' | 'scraping' | 'analyzing' | 'generating' | 'done' | 'error';

export default function PosterGenerator() {
  const [url, setUrl] = useState('');
  const [status, setStatus] = useState<ProcessState>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [posterUrl, setPosterUrl] = useState<string | null>(null);
  const [channelData, setChannelData] = useState<any>(null);
  const [themeData, setThemeData] = useState<any>(null);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;

    setStatus('scraping');
    setErrorMessage('');
    setPosterUrl(null);
    setChannelData(null);
    setThemeData(null);

    try {
      // Step 1: Scrape
      const scrapeRes = await fetch('/api/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });
      const scrapeData = await scrapeRes.json();
      if (!scrapeRes.ok) throw new Error(scrapeData.error || 'Failed to scrape channel.');
      setChannelData(scrapeData);

      // Step 2: Analyze
      setStatus('analyzing');
      const analyzeRes = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(scrapeData),
      });
      const analyzeData = await analyzeRes.json();
      if (!analyzeRes.ok) throw new Error(analyzeData.error || 'Failed to analyze channel data.');
      setThemeData(analyzeData);

      // Step 3: Generate
      setStatus('generating');
      const generateRes = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image_prompt: analyzeData.image_prompt }),
      });
      const generateData = await generateRes.json();
      if (!generateRes.ok) throw new Error(generateData.error || 'Failed to generate poster.');

      setPosterUrl(generateData.imageUrl);
      setStatus('done');
    } catch (err: any) {
      console.error(err);
      setStatus('error');
      setErrorMessage(err.message || 'An unexpected error occurred.');
    }
  };

  const getStatusMessage = () => {
    switch (status) {
      case 'scraping': return 'Connecting to YouTube...';
      case 'analyzing': return 'Analyzing brand and aesthetic with Gemini...';
      case 'generating': return 'Synthesizing layout and rendering poster...';
      default: return '';
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto flex flex-col md:flex-row gap-10">
      <div className="flex-1 flex flex-col gap-6">
        <div className="glass-panel rounded-2xl p-8 transform transition-all hover:scale-[1.01] duration-300">
          <h2 className="text-2xl font-semibold mb-2">Create Poster</h2>
          <p className="text-gray-400 text-sm mb-6">Paste any YouTube channel link below to extract its aesthetic and generate a cinematic poster.</p>
          
          <form onSubmit={handleGenerate} className="flex flex-col gap-4">
            <input 
              type="text"
              placeholder="e.g. https://www.youtube.com/@mkbhd"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full bg-[#1a1c23] border border-gray-700/50 rounded-xl px-4 py-3 outline-none focus:border-indigo-500 transition-colors placeholder-gray-600 text-sm"
              disabled={status !== 'idle' && status !== 'error' && status !== 'done'}
            />
            <button
              type="submit"
              disabled={!url || (status !== 'idle' && status !== 'error' && status !== 'done')}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-3 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(99,102,241,0.3)] hover:shadow-[0_0_25px_rgba(99,102,241,0.5)]"
            >
              {(status !== 'idle' && status !== 'error' && status !== 'done') ? 'Running Workflow...' : 'Generate Magic'}
            </button>
          </form>

          {status === 'error' && <div className="mt-4 text-red-400 text-sm">{errorMessage}</div>}

          {(status === 'scraping' || status === 'analyzing' || status === 'generating') && (
            <div className="mt-8 flex flex-col items-center justify-center space-y-4 py-6">
              <span className="loader"></span>
              <p className="text-indigo-300 text-sm font-medium animate-pulse">{getStatusMessage()}</p>
            </div>
          )}
        </div>

        {themeData && (
          <div className="glass-panel animate-fade-in rounded-2xl p-6">
            <h3 className="text-lg font-semibold mb-4 border-b border-gray-700/50 pb-2">Extracted Profile</h3>
            <div className="space-y-4">
              {channelData && (
                 <div className="flex items-center gap-4">
                    {channelData.avatarUrl && <img src={channelData.avatarUrl} alt="Avatar" className="w-12 h-12 rounded-full object-cover shadow-lg" />}
                    <div>
                      <p className="font-semibold text-sm">{channelData.channelTitle}</p>
                    </div>
                 </div>
              )}
              
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-widest font-semibold mb-2">Calculated Aesthetic</p>
                <div className="bg-[#1a1c23] inline-block px-3 py-1.5 rounded-lg border border-indigo-500/30 text-indigo-300 text-sm font-medium">
                  {themeData.aesthetic}
                </div>
              </div>

              <div>
                <p className="text-xs text-gray-500 uppercase tracking-widest font-semibold mb-2">Color Palette</p>
                <div className="flex gap-2">
                  {themeData.primary_colors?.map((color: string, i: number) => (
                    <div key={i} className="w-8 h-8 rounded-full shadow-md" style={{ backgroundColor: color }} title={color} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="flex-1 flex flex-col items-center">
        <div className="w-full max-w-[400px] aspect-[2/3] glass-panel rounded-2xl overflow-hidden relative shadow-2xl flex items-center justify-center p-2 group transition-all duration-500 hover:shadow-[0_0_40px_rgba(168,85,247,0.2)]">
          {!posterUrl ? (
             <div className="w-full h-full border-2 border-dashed border-gray-700/50 rounded-xl flex flex-col items-center justify-center text-gray-600">
               <svg className="w-12 h-12 mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
               </svg>
               <p className="text-sm">Poster will appear here</p>
             </div>
          ) : (
            <>
              <img src={posterUrl} alt="Generated Poster" className="w-full h-full object-cover rounded-xl animate-float opacity-0 transition-opacity duration-1000" onLoad={(e) => e.currentTarget.classList.remove('opacity-0')} />
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm rounded-2xl">
                <a href={posterUrl} download="youtube-poster.png" target="_blank" rel="noreferrer" className="bg-white/10 hover:bg-white/20 border border-white/30 text-white px-6 py-2 rounded-full font-medium transition-all transform translate-y-4 group-hover:translate-y-0 shadow-lg flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                  Download
                </a>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
