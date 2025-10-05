'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { Pause, Play, ArrowRight, Loader2, Users, Swords, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import type { PanelFeedbackResponse, JudgeFeedbackResponse } from '@/lib/types';
import { Badge } from './ui/badge';
import dynamic from 'next/dynamic';
import { Suspense } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';

const LottieAnimation = dynamic(() => import('@/components/lottie-animation'), {
  ssr: false,
  loading: () => (
    <div className="w-20 h-20 rounded-full bg-background flex items-center justify-center">
      <Loader2 className="h-6 w-6 animate-spin text-primary" />
    </div>
  ),
});

interface PanelFeedbackCardProps {
  panelFeedback: PanelFeedbackResponse;
  onNext: () => void;
}

function JudgeFeedbackItem({ feedback, index, isFightMode }: { feedback: JudgeFeedbackResponse; index: number; isFightMode?: boolean }) {
  const { judge, response, sentiment, isGlitched, reversedSpeech, audioDataUri, targetJudges } = feedback;
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const voicesRef = useRef<SpeechSynthesisVoice[] | null>(null);

  // Simplified sentiment for styling
  const sentimentCategory = sentiment.includes('positive') ? 'positive' : sentiment.includes('negative') ? 'negative' : 'neutral';

  const sentimentGlow = {
    positive: 'shadow-[0_0_15px_2px] shadow-green-400/30 dark:shadow-green-400/15',
    negative: 'shadow-[0_0_15px_2px] shadow-red-400/30 dark:shadow-red-400/15',
    neutral: '',
  };
  
  useEffect(() => {
    if (typeof window !== 'undefined') {
      synthRef.current = window.speechSynthesis;
      const loadVoices = () => {
        const v = synthRef.current?.getVoices() || [];
        if (v.length) voicesRef.current = v;
      };
      loadVoices();
      synthRef.current?.addEventListener('voiceschanged', loadVoices);
      return () => synthRef.current?.removeEventListener('voiceschanged', loadVoices);
    }
  }, []);

  const playAudio = useCallback(() => {
    if (audioDataUri && !reversedSpeech) {
      if (!audioRef.current) {
        audioRef.current = new Audio(audioDataUri);
        audioRef.current.addEventListener('ended', () => setIsPlaying(false));
        audioRef.current.addEventListener('error', () => setIsPlaying(false));
      }
      
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        audioRef.current.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
      }
    } else if (synthRef.current && voicesRef.current) {
      if (isPlaying) {
        synthRef.current.cancel();
        setIsPlaying(false);
      } else {
        const utterance = new SpeechSynthesisUtterance(reversedSpeech ? response.split('').reverse().join('') : response);
        
        const availableVoices = voicesRef.current.filter(voice => voice.lang.startsWith('en'));
        if (availableVoices.length > 0) {
          const randomVoice = availableVoices[Math.floor(Math.random() * availableVoices.length)];
          utterance.voice = randomVoice;
        }
        
        utterance.rate = isGlitched ? 0.7 + Math.random() * 0.6 : 0.9;
        utterance.pitch = isGlitched ? 0.5 + Math.random() * 1.0 : 1.0;
        utterance.onstart = () => setIsPlaying(true);
        utterance.onend = () => setIsPlaying(false);
        utterance.onerror = () => setIsPlaying(false);
        
        synthRef.current.speak(utterance);
      }
    }
  }, [audioDataUri, response, reversedSpeech, isGlitched, isPlaying]);

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      if (synthRef.current) {
        synthRef.current.cancel();
      }
    };
  }, []);

  return (
    <Card className={cn(
      "w-full transition-all duration-300",
      isFightMode ? "border-red-500 shadow-[0_0_20px_3px] shadow-red-500/40 dark:shadow-red-500/20" : sentimentGlow[sentimentCategory],
      isGlitched && "animate-pulse"
    )}>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <div className="relative w-16 h-16 rounded-full bg-background shadow-neumorphic-inset dark:shadow-neumorphic-inset-dark overflow-hidden">
            <Suspense fallback={
              <div className="flex items-center justify-center w-full h-full">
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
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
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <h4 className="font-semibold text-lg">{judge.name}</h4>
              <Badge variant={judge.rarity === 'rare' ? 'default' : judge.rarity === 'glitch' ? 'destructive' : 'secondary'}>
                {judge.rarity}
              </Badge>
              {isGlitched && <Badge variant="destructive" className="animate-pulse">GLITCHED</Badge>}
              {isFightMode && targetJudges && targetJudges.length > 0 && (
                <Badge variant="destructive" className="flex items-center gap-1">
                  <Swords className="h-3 w-3" />
                  ROASTING
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground italic">{judge.description}</p>
            {isFightMode && targetJudges && targetJudges.length > 0 && (
              <div className="flex items-center gap-1 mt-1 flex-wrap">
                <span className="text-xs text-red-500 font-semibold">Target{targetJudges.length > 1 ? 's' : ''}:</span>
                {targetJudges.map((target, idx) => (
                  <Badge key={idx} variant="outline" className="text-xs border-red-500 text-red-500">
                    {target.name}
                  </Badge>
                ))}
              </div>
            )}
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={playAudio}
            className="rounded-full"
            disabled={!audioDataUri && !synthRef.current}
          >
            {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className={cn(
          "p-4 rounded-lg bg-muted/50 border-l-4 transition-colors",
          isFightMode ? "border-l-red-500 bg-red-50/50 dark:bg-red-950/20" : (
            sentimentCategory === 'positive' ? "border-l-green-500 bg-green-50/50 dark:bg-green-950/20" :
            sentimentCategory === 'negative' ? "border-l-red-500 bg-red-50/50 dark:bg-red-950/20" :
            "border-l-gray-500"
          )
        )}>
          <p className={cn(
            "text-sm leading-relaxed",
            isGlitched && reversedSpeech && "font-mono tracking-wider",
            isFightMode && "font-semibold"
          )}>
            {response}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

export default function PanelFeedbackCard({ panelFeedback, onNext }: PanelFeedbackCardProps) {
  const { responses, isFightMode } = panelFeedback;
  const [activeTab, setActiveTab] = useState("0");

  return (
    <div className="w-full max-w-4xl space-y-6">
      {isFightMode ? (
        <Alert className="border-red-500 bg-red-50/50 dark:bg-red-950/20">
          <Swords className="h-5 w-5 text-red-500" />
          <AlertDescription className="ml-2">
            <span className="font-bold text-red-600 dark:text-red-400">🔥 JUDGE FIGHT ACTIVATED! 🔥</span>
            <br />
            <span className="text-sm">The judges have forgotten about your pitch and are roasting each other instead!</span>
          </AlertDescription>
        </Alert>
      ) : null}

      <Card>
        <CardHeader className="text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            {isFightMode ? (
              <>
                <Zap className="h-6 w-6 text-red-500 animate-pulse" />
                <CardTitle className="text-2xl font-headline text-red-600 dark:text-red-400">Judge Battle Royale!</CardTitle>
                <Zap className="h-6 w-6 text-red-500 animate-pulse" />
              </>
            ) : (
              <>
                <Users className="h-6 w-6 text-primary" />
                <CardTitle className="text-2xl font-headline">Panel Verdict</CardTitle>
              </>
            )}
          </div>
          <p className="text-muted-foreground">
            {isFightMode 
              ? "Things got heated in the deliberation room..."
              : "The judges have spoken. Here's what they think of your pitch."
            }
          </p>
        </CardHeader>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          {responses.map((response, index) => (
            <TabsTrigger key={index} value={index.toString()} className="text-xs">
              {isFightMode && <Swords className="h-3 w-3 mr-1 text-red-500" />}
              {response.judge.name}
            </TabsTrigger>
          ))}
        </TabsList>
        
        {responses.map((response, index) => (
          <TabsContent key={index} value={index.toString()} className="mt-4">
            <JudgeFeedbackItem feedback={response} index={index} isFightMode={isFightMode} />
          </TabsContent>
        ))}
      </Tabs>

      <div className="flex justify-center">
        <Button 
          onClick={onNext}
          className={cn(
            "gap-2",
            isFightMode 
              ? "bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600"
              : "bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
          )}
        >
          {isFightMode ? "View Results Anyway" : "Get Report Card"} <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}