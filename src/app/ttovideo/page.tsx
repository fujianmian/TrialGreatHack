'use client';

import TextToVideo from './texttovideo';
import { useRouter } from 'next/navigation';

export default function VideoPage() {
  const router = useRouter();
  
  return (
    <TextToVideo 
      inputText="Sample text for video generation" 
      onBack={() => router.back()} 
    />
  );
}
