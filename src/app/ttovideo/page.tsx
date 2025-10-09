'use client';

import TextToVideo from './texttovideo';
import { useRouter } from 'next/navigation';
import ChatBox from '../chatbox';

export default function VideoPage() {
  const router = useRouter();
  
  return (
    <div>
      <TextToVideo 
        inputText="Sample text for video generation" 
        onBack={() => router.back()} 
      />
      <ChatBox />
    </div>
    
  );
}
