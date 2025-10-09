import { Suspense } from 'react';
import TextToMap from './texttomap';
import ChatBox from '../chatbox';

interface MindmapPageProps {
  searchParams: Promise<{ text?: string }>;
}

// this is the page for the mindmap
function MindmapPageContent({ searchParams }: MindmapPageProps) {
  return <TextToMap searchParams={searchParams} />;
}

export default function MindmapPage({ searchParams }: MindmapPageProps) {
  return (
    <div>
      <Suspense fallback={<div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-2xl w-full text-center">
          <div className="text-gray-400 text-6xl mb-6">🧠</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Loading...</h2>
          <p className="text-gray-600 mb-6">Preparing your mind map</p>
        </div>
      </div>}>
        <MindmapPageContent searchParams={searchParams} />
      </Suspense>
      <ChatBox />
    </div>
    
  );
}
