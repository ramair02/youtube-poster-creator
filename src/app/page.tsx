import PosterGenerator from '@/components/PosterGenerator';

export const metadata = {
  title: 'YouTube Poster Generator',
  description: 'Generate cinematic posters based on YouTube channel aesthetic.',
};

export default function Home() {
  return (
    <main className="min-h-screen py-20 px-4 md:px-8 flex flex-col items-center">
      <div className="text-center mb-16 max-w-2xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-extrabold mb-4 tracking-tight">
          YouTube <span className="text-gradient">Poster Generator</span>
        </h1>
        <p className="text-gray-400 text-lg">
          AI-powered aesthetic extraction and cinematic poster generation.
        </p>
      </div>

      <PosterGenerator />
    </main>
  );
}
