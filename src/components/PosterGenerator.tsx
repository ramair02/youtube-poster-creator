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

  const handleRegenerate = async () => {
    if (!themeData?.image_prompt) return;
    setStatus('generating');
    setErrorMessage('');
    
    try {
      const generateRes = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image_prompt: themeData.image_prompt }),
      });
      const generateData = await generateRes.json();
      if (!generateRes.ok) throw new Error(generateData.error || 'Failed to generate poster.');
      
      setPosterUrl(generateData.imageUrl);
      setStatus('done');
    } catch (err: any) {
      console.error(err);
      setStatus('error');
      setErrorMessage(err.message || 'An unexpected error occurred during regeneration.');
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
    <div className="w-full max-w-6xl mx-auto flex flex-col lg:flex-row gap-12 mt-8">
      {/* Left Panel: Controls & Status */}
      <div className="flex-1 flex flex-col gap-8">
        
        {/* Input Panel */}
        <div className="glass-panel relative overflow-hidden rounded-3xl p-10 transform transition-all hover:scale-[1.02] duration-500 shadow-2xl border border-white/5 bg-gradient-to-br from-black/60 to-indigo-900/10">
          <div className="absolute top-0 right-0 p-8 opacity-10">
             <svg width="120" height="120" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14.5v-9l6 4.5-6 4.5z"/></svg>
          </div>
          
          <h2 className="text-3xl font-extrabold mb-3 text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">Generate Magic</h2>
          <p className="text-gray-300 text-sm mb-8 leading-relaxed">Enter a YouTube channel URL. Our AI will scrape the brand assets, synthesize the aesthetic, and render a cinematic custom poster using Google Deepmind architecture.</p>
          
          <form onSubmit={handleGenerate} className="flex flex-col gap-5 relative z-10">
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-gray-500 group-focus-within:text-indigo-400 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
              </div>
              <input 
                type="text"
                placeholder="e.g. https://www.youtube.com/@mkbhd"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="w-full bg-[#0a0b10]/80 border border-gray-700/60 rounded-2xl pl-12 pr-4 py-4 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all placeholder-gray-600 text-sm shadow-inner"
                disabled={status !== 'idle' && status !== 'error' && status !== 'done'}
              />
            </div>
            
            <button
              type="submit"
              disabled={!url || (status !== 'idle' && status !== 'error' && status !== 'done')}
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold tracking-wide py-4 rounded-2xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_30px_rgba(99,102,241,0.2)] hover:shadow-[0_0_40px_rgba(168,85,247,0.4)] flex justify-center items-center gap-2"
            >
              {(status !== 'idle' && status !== 'error' && status !== 'done') ? (
                 <>
                   <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                     <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                     <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                   </svg>
                   Executing Pipeline...
                 </>
              ) : 'Generate Poster'}
            </button>
          </form>

          {status === 'error' && (
            <div className="mt-6 bg-red-900/30 border border-red-500/30 rounded-xl p-4 text-red-300 text-sm flex items-start gap-3">
              <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              <span>{errorMessage}</span>
            </div>
          )}
        </div>

        {/* Dynamic Status / Analysis Panel */}
        <div className={`transition-all duration-700 ease-in-out origin-top ${themeData || status !== 'idle' ? 'opacity-100 scale-y-100 h-auto' : 'opacity-0 scale-y-0 h-0 overflow-hidden'}`}>
          <div className="glass-panel border-t-4 border-t-indigo-500 rounded-3xl p-8 bg-black/40">
            {(status === 'scraping' || status === 'analyzing' || status === 'generating') && !posterUrl ? (
              <div className="flex flex-col items-center justify-center space-y-5 py-8">
                <span className="loader scale-110"></span>
                <p className="text-indigo-300 text-sm font-semibold tracking-widest uppercase animate-pulse">
                  {getStatusMessage()}
                </p>
              </div>
            ) : themeData ? (
              <div className="animate-fade-in">
                <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                  <svg className="w-6 h-6 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg>
                  Profile Extracted
                </h3>
                
                <div className="space-y-6">
                  {channelData && (
                     <div className="flex items-center gap-5 bg-white/5 p-4 rounded-2xl border border-white/5">
                        {channelData.avatarUrl && <img src={channelData.avatarUrl} alt="Avatar" className="w-16 h-16 rounded-full object-cover ring-2 ring-indigo-500/50 shadow-[0_0_15px_rgba(99,102,241,0.3)]" />}
                        <div>
                          <p className="font-bold text-lg text-white">{channelData.channelTitle}</p>
                          <p className="text-xs text-gray-400 line-clamp-1">{channelData.channelDescription || 'No description found.'}</p>
                        </div>
                     </div>
                  )}
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white/5 p-4 rounded-2xl border border-white/5 flex flex-col justify-center">
                      <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-2">Calculated Aesthetic</p>
                      <p className="text-indigo-300 font-semibold">{themeData.aesthetic}</p>
                    </div>

                    <div className="bg-white/5 p-4 rounded-2xl border border-white/5 flex flex-col justify-center">
                      <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-2">Color Matrix</p>
                      <div className="flex gap-2">
                        {themeData.primary_colors?.map((color: string, i: number) => (
                          <div key={i} className="w-8 h-8 rounded-full shadow-inner ring-1 ring-white/10" style={{ backgroundColor: color }} title={color} />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {/* Right Panel: Poster Preview */}
      <div className="flex-1 flex flex-col items-center justify-center lg:items-end">
        <div className="w-full max-w-[500px] aspect-[2/3] glass-panel rounded-3xl overflow-hidden relative shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-white/10 flex items-center justify-center p-2 group transition-all duration-700 bg-[#0a0b10]">
          {!posterUrl ? (
             <div className="w-full h-full border-2 border-dashed border-gray-700/40 rounded-2xl flex flex-col items-center justify-center text-gray-600 bg-gradient-to-b from-transparent to-white/5">
               <svg className="w-16 h-16 mb-4 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
               </svg>
               <p className="text-sm font-medium tracking-wide uppercase">Awaiting Transmission</p>
             </div>
          ) : (
            <>
              <img src={posterUrl} alt="Generated Poster" className="w-full h-full object-cover rounded-2xl animate-float opacity-0 transition-opacity duration-1000" onLoad={(e) => e.currentTarget.classList.remove('opacity-0')} />
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col gap-4 items-center justify-center backdrop-blur-md rounded-3xl">
                <a href={posterUrl} download={`${channelData?.channelTitle || 'youtube'}-poster.jpg`} target="_blank" rel="noreferrer" className="bg-white hover:bg-indigo-50 text-indigo-900 px-8 py-3 rounded-full font-bold shadow-2xl transition-all transform scale-95 group-hover:scale-100 flex items-center gap-3">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                  Download HQ Image
                </a>
                
                <button onClick={handleRegenerate} disabled={status === 'generating'} className="bg-white/10 hover:bg-white/20 border border-white/20 text-white px-8 py-3 rounded-full font-bold shadow-lg transition-all transform scale-95 group-hover:scale-100 flex items-center gap-3">
                  <svg className={`w-5 h-5 ${status === 'generating' ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                  Regenerate Image
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
