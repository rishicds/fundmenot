
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Square, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { handleAudioTranscription } from '@/app/actions';
import type { AppState, Judge } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Badge } from './ui/badge';
import dynamic from 'next/dynamic';
import { Suspense } from 'react';

const ModelViewer = dynamic(() => import('@/components/model-viewer'), {
  ssr: false,
  loading: () => (
    <div className="w-32 h-32 rounded-full bg-background flex items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  ),
});

const MAX_RECORDING_TIME = 30; // 30 seconds
const EXPRESSIONS = ['🤔', '😂', '😴', '🤮', '🙄', '🤯', '💰', '📉'];


interface RecorderUIProps {
  judge: Judge;
  onRecordingComplete: (transcript: string) => void;
  setAppState: (state: AppState) => void;
}

export default function RecorderUI({ judge, onRecordingComplete, setAppState }: RecorderUIProps) {
  const [countdown, setCountdown] = useState(MAX_RECORDING_TIME);
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [currentExpression, setCurrentExpression] = useState('😬');
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const expressionIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const recordingStartedRef = useRef(false);
  const { toast } = useToast();
  const isGlitched = judge.rarity === 'glitch';


  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
    if (expressionIntervalRef.current) {
        clearInterval(expressionIntervalRef.current);
        expressionIntervalRef.current = null;
    }
    setIsRecording(false);
  }, []);

  const startRecording = useCallback(async () => {
    if (recordingStartedRef.current) return;
    recordingStartedRef.current = true;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setIsRecording(true);
      setCountdown(MAX_RECORDING_TIME);
      audioChunksRef.current = [];

      mediaRecorderRef.current = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
            audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = async () => {
        stream.getTracks().forEach(track => track.stop());
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        
        setIsTranscribing(true);
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = async () => {
          const base64Audio = reader.result as string;
          const { transcript, error } = await handleAudioTranscription(base64Audio);
          setIsTranscribing(false);
          if (error || !transcript) {
            toast({
              variant: 'destructive',
              title: 'Transcription Failed',
              description: error || 'Could not understand audio. Please try recording again.',
            });
            setAppState('error');
          } else {
            onRecordingComplete(transcript);
          }
        };
      };

      mediaRecorderRef.current.start();

      countdownIntervalRef.current = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            stopRecording();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      
      expressionIntervalRef.current = setInterval(() => {
        const randomIndex = Math.floor(Math.random() * EXPRESSIONS.length);
        setCurrentExpression(EXPRESSIONS[randomIndex]);
      }, 3000);

    } catch (error) {
      console.error('Error starting recording:', error);
      toast({
        variant: 'destructive',
        title: 'Microphone Access Denied',
        description: 'Please allow microphone access to record your pitch.',
      });
      setAppState('error');
    }
  }, [stopRecording, onRecordingComplete, setAppState, toast]);

  useEffect(() => {
    startRecording();
    return () => {
      stopRecording();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  if (isTranscribing) {
      return (
        <div className="flex flex-col items-center justify-center gap-4 text-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <h2 className="text-2xl font-headline font-bold">Transcribing Audio...</h2>
            <p className="text-muted-foreground">Turning your genius words into text.</p>
        </div>
      )
  }
  
  const pulseDuration = Math.max(1, 3 - (MAX_RECORDING_TIME - countdown) / 10) + 's';

  return (
    <div className="flex flex-col items-center justify-center space-y-8 w-full max-w-sm">
      <div className="relative flex items-center justify-center w-64 h-64">
        <div 
          className={cn(
            "absolute inset-0 rounded-full bg-background",
            isRecording && "animate-pulse shadow-neumorphic-inset dark:shadow-neumorphic-inset-dark"
          )}
          style={{ animationDuration: pulseDuration }}
        ></div>

        <div className='relative flex flex-col items-center'>
            <div className='relative'>
                 <div className="relative w-32 h-32 rounded-full bg-background overflow-hidden">
                    <Suspense fallback={
                      <div className="flex items-center justify-center w-full h-full">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      </div>
                    }>
                      <ModelViewer 
                        modelPath={judge.modelPath}
                        className="w-full h-full"
                        scale={2.5}
                        autoRotate={true}
                        isGlitched={isGlitched}
                        cameraPosition={[0, 0.5, 3]}
                        modelVariation={judge.modelVariation}
                      />
                    </Suspense>
                </div>
                <div className="absolute -top-2 -right-2 text-4xl bg-background rounded-full p-1 shadow-neumorphic dark:shadow-neumorphic-dark transition-all animate-in zoom-in-50">
                    {currentExpression}
                </div>
            </div>
            <div className="flex items-center gap-2 mt-4">
                <h2 className={cn('text-xl font-bold font-headline', isGlitched && 'glitch-text')}>{judge.name}</h2>
                {judge.rarity !== 'common' && <Badge variant={isGlitched ? 'destructive' : 'secondary'} className={cn(isGlitched && 'glitch-text')}>{judge.rarity.toUpperCase()}</Badge>}
            </div>
        </div>

      </div>
      <div className="text-center">
        <p className="text-lg text-muted-foreground">Recording...</p>
        <p className="text-7xl font-bold font-headline tracking-tighter text-primary">{countdown}</p>
      </div>
      <Button
        size="lg"
        variant="destructive"
        className="w-24 h-24 rounded-full shadow-lg active:scale-95"
        onClick={stopRecording}
        disabled={!isRecording}
      >
        <Square className="h-8 w-8 fill-white" />
        <span className="sr-only">Stop Recording</span>
      </Button>
    </div>
  );
}
