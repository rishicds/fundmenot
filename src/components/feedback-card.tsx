
'use client';

import { useEffect, useState, useRef } from 'react';
import { Pause, Play, ArrowRight, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import type { JudgeFeedbackResponse } from '@/lib/types';
import { Badge } from './ui/badge';
import dynamic from 'next/dynamic';
import { Suspense } from 'react';

const LottieAnimation = dynamic(() => import('@/components/lottie-animation'), {
  ssr: false,
  loading: () => (
    <div className="w-32 h-32 rounded-full bg-background flex items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  ),
});

interface FeedbackCardProps {
  feedback: JudgeFeedbackResponse;
  onNext: () => void;
}

export default function FeedbackCard({ feedback, onNext }: FeedbackCardProps) {
  const { judge, response, sentiment, isGlitched, reversedSpeech, audioDataUri } = feedback;
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);

  // Simplified sentiment for styling
  const sentimentCategory = sentiment.includes('positive') ? 'positive' : sentiment.includes('negative') ? 'negative' : 'neutral';

  const sentimentGlow = {
    positive: 'shadow-[0_0_20px_4px] shadow-green-400/40 dark:shadow-green-400/20',
    negative: 'shadow-[0_0_20px_4px] shadow-red-400/40 dark:shadow-red-400/20',
    neutral: '',
  };
  
  useEffect(() => {
    if (typeof window !== 'undefined') {
      synthRef.current = window.speechSynthesis;
    }
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (audioDataUri && audio) {
      audio.src = audioDataUri;
      audio.onplay = () => setIsPlaying(true);
      audio.onpause = () => setIsPlaying(false);
      audio.onended = () => setIsPlaying(false);
    }
    return () => {
      if (audio) {
        audio.pause();
        audio.src = '';
      }
      if (synthRef.current) {
        synthRef.current.cancel();
      }
    };
  }, [audioDataUri]);

  const handleSpeech = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play().catch(console.error);
      }
      return;
    }

    if (!synthRef.current) return;
    if (synthRef.current.speaking) {
      synthRef.current.cancel();
      setIsPlaying(false);
      return;
    }

    const textToSpeak = reversedSpeech ? response.split('').reverse().join('') : response;
    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.onstart = () => setIsPlaying(true);
    utterance.onend = () => setIsPlaying(false);
    utterance.onerror = () => setIsPlaying(false);
    
    synthRef.current.speak(utterance);
  };
  
  return (
    <Card
      className={cn(
        'w-full max-w-md text-center transition-all duration-500',
        sentimentGlow[sentimentCategory],
        isGlitched && 'animate-pulse border-accent'
      )}
    >
      <CardHeader className="items-center">
        <div className={cn('relative w-32 h-32 rounded-full bg-background shadow-neumorphic-inset dark:shadow-neumorphic-inset-dark overflow-hidden', isGlitched && 'animate-pulse')}>
          <Suspense fallback={
            <div className="flex items-center justify-center w-full h-full">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          }>
            <LottieAnimation 
              animationPath={judge.lottieAnimation || '/lottie/Businessman Giving Presentation.json'}
              className="w-full h-full"
              autoplay={true}
              loop={true}
              isGlitched={isGlitched}
            />
          </Suspense>
        </div>
        <div className='flex items-center gap-2'>
            <h2 className={cn('text-3xl font-bold font-headline', isGlitched && 'glitch-text')}>{judge.name}</h2>
            {judge.rarity !== 'common' && <Badge variant={isGlitched ? 'destructive' : 'secondary'} className={cn('shadow-neumorphic-sm dark:shadow-neumorphic-sm-dark', isGlitched && 'glitch-text')}>{judge.rarity.toUpperCase()}</Badge>}
        </div>
        <p className="text-muted-foreground">{judge.description}</p>
      </CardHeader>
      <CardContent>
        <div className="relative rounded-xl bg-background shadow-neumorphic-inset dark:shadow-neumorphic-inset-dark p-6">
          <p className={cn('text-lg text-foreground/90', isGlitched && 'glitch-text', reversedSpeech && 'italic')}>
            &ldquo;{response}&rdquo;
          </p>
        </div>
        {audioDataUri && <audio ref={audioRef} className="hidden" />}
      </CardContent>
      <CardFooter className="flex-col gap-4 sm:flex-row justify-center">
        <Button onClick={onNext} variant="default" size="lg">
          See Report Card
          <ArrowRight />
        </Button>
        <Button onClick={handleSpeech} variant="outline" size="lg">
          {isPlaying ? <Pause/> : <Play />}
          {isPlaying ? 'Stop' : 'Hear It'}
        </Button>
      </CardFooter>
    </Card>
  );
}
