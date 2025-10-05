
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
import ComicDialogue from './comic-dialogue';

const LottieAnimation = dynamic(() => import('@/components/lottie-animation'), {
  ssr: false,
  loading: () => (
    <div className="w-32 h-32 rounded-full bg-background flex items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  ),
});

const MAX_RECORDING_TIME = 30; // 30 seconds

// Map dialogue types to appropriate emojis
const DIALOGUE_EMOJIS = {
  confused: ['😵‍💫', '🤷‍♂️', '😵', '🤨'],
  puzzled: ['🤔', '🧐', '🤷‍♀️', '😶'],
  shocked: ['😱', '🤯', '😳', '🙀'],
  frustrated: ['😤', '🙄', '😠', '🤦‍♂️'],
  skeptical: ['🤨', '😒', '🙃', '👀'],
  glitched: ['🤖', '💀', '🔥', '⚡']
};

// Fallback generic expressions
const GENERIC_EXPRESSIONS = ['🤔', '😂', '😴', '🤮', '🙄', '🤯', '💰', '📉'];


interface RecorderUIProps {
  judge?: Judge;
  judges?: Judge[];
  onRecordingComplete: (transcript: string) => void;
  setAppState: (state: AppState) => void;
}

export default function RecorderUI({ judge, judges, onRecordingComplete, setAppState }: RecorderUIProps) {
  const [countdown, setCountdown] = useState(MAX_RECORDING_TIME);
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [currentExpression, setCurrentExpression] = useState('😬');
  const [currentDialogueType, setCurrentDialogueType] = useState<string | null>(null);
  const [judgeExpressions, setJudgeExpressions] = useState<Record<string, string>>({});
  const [judgeDialogueTypes, setJudgeDialogueTypes] = useState<Record<string, string | null>>({});
  const [judgeDialogueVisibility, setJudgeDialogueVisibility] = useState<Record<string, boolean>>({});
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const expressionIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const judgeIntervalsRef = useRef<Record<string, NodeJS.Timeout>>({});
  const recordingStartedRef = useRef(false);
  const { toast } = useToast();
  const isPanel = !!judges && judges.length > 0;
  const currentJudge = judge || (judges && judges[0]);
  const isGlitched = currentJudge?.rarity === 'glitch';

  // Initialize expressions for all judges in panel mode
  useEffect(() => {
    if (isPanel && judges) {
      const initialExpressions: Record<string, string> = {};
      const initialDialogueTypes: Record<string, string | null> = {};
      const initialDialogueVisibility: Record<string, boolean> = {};
      judges.forEach((judge, index) => {
        // Give each judge a different starting emoji
        const startingEmojis = ['😬', '🤔', '🧐', '😐'];
        initialExpressions[judge.id] = startingEmojis[index] || '😬';
        initialDialogueTypes[judge.id] = null;
        initialDialogueVisibility[judge.id] = false;
      });
      setJudgeExpressions(initialExpressions);
      setJudgeDialogueTypes(initialDialogueTypes);
      setJudgeDialogueVisibility(initialDialogueVisibility);
    }
  }, [isPanel, judges]);

  // Function to get an emoji that matches the current dialogue type
  const getMatchingEmoji = useCallback((dialogueType: string | null) => {
    if (isGlitched && dialogueType === 'glitched') {
      const glitchedEmojis = DIALOGUE_EMOJIS.glitched;
      return glitchedEmojis[Math.floor(Math.random() * glitchedEmojis.length)];
    }
    
    if (dialogueType && DIALOGUE_EMOJIS[dialogueType as keyof typeof DIALOGUE_EMOJIS]) {
      const emojis = DIALOGUE_EMOJIS[dialogueType as keyof typeof DIALOGUE_EMOJIS];
      return emojis[Math.floor(Math.random() * emojis.length)];
    }
    
    // Fallback to generic expressions
    return GENERIC_EXPRESSIONS[Math.floor(Math.random() * GENERIC_EXPRESSIONS.length)];
  }, [isGlitched]);

  // Function to update emoji based on current context
  const updateEmoji = useCallback(() => {
    const newEmoji = getMatchingEmoji(currentDialogueType);
    setCurrentExpression(newEmoji);
  }, [currentDialogueType, getMatchingEmoji]);

  // Function to create individual dialogue change handler for each judge and each dialogue box
  const createJudgeDialogueHandler = useCallback((judgeId: string, dialogueIndex: number) => {
    return (dialogueType: string | null) => {
      // Create a unique key for this specific dialogue box
      const dialogueKey = `${judgeId}-${dialogueIndex}`;
      
      setJudgeDialogueTypes(prev => ({
        ...prev,
        [dialogueKey]: dialogueType
      }));
      
      // Update expression for this specific judge only when a dialogue is active
      if (dialogueType) {
        const newEmoji = getMatchingEmoji(dialogueType);
        setJudgeExpressions(prev => ({
          ...prev,
          [judgeId]: newEmoji
        }));
      }
      
      // Update dialogue visibility
      setJudgeDialogueVisibility(prev => ({
        ...prev,
        [dialogueKey]: !!dialogueType
      }));
    };
  }, [getMatchingEmoji]);

  // Function to update emoji for a specific judge
  const updateJudgeEmoji = useCallback((judgeId: string, dialogueType: string | null) => {
    const newEmoji = getMatchingEmoji(dialogueType);
    setJudgeExpressions(prev => ({ ...prev, [judgeId]: newEmoji }));
  }, [getMatchingEmoji]);

  // Function to set dialogue type for a specific judge
  const setJudgeDialogueType = useCallback((judgeId: string, dialogueType: string | null) => {
    setJudgeDialogueTypes(prev => ({ ...prev, [judgeId]: dialogueType }));
    updateJudgeEmoji(judgeId, dialogueType);
  }, [updateJudgeEmoji]);

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
    // Clear all judge intervals
    Object.values(judgeIntervalsRef.current).forEach(interval => {
      clearInterval(interval);
    });
    judgeIntervalsRef.current = {};
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
      
      if (isPanel && judges) {
        // Set up different expression intervals for each judge
        judges.forEach((panelJudge, index) => {
          setTimeout(() => {
            const judgeInterval = setInterval(() => {
              // Get a random dialogue type occasionally to vary expressions
              const randomDialogueTypes = ['confused', 'puzzled', 'shocked', 'frustrated', 'skeptical'];
              const shouldRandomize = Math.random() < 0.3; // 30% chance to randomize
              
              if (shouldRandomize) {
                const randomType = randomDialogueTypes[Math.floor(Math.random() * randomDialogueTypes.length)];
                updateJudgeEmoji(panelJudge.id, randomType);
              } else {
                // Check if any dialogue box for this judge is active
                const dialogue1Key = `${panelJudge.id}-0`;
                const dialogue2Key = `${panelJudge.id}-1`;
                const activeDialogueType = judgeDialogueTypes[dialogue1Key] || judgeDialogueTypes[dialogue2Key];
                updateJudgeEmoji(panelJudge.id, activeDialogueType || null);
              }
            }, 2000 + (index * 400)); // Different intervals for each judge (2000ms, 2400ms, 2800ms, 3200ms)
            
            // Store the interval for this specific judge
            judgeIntervalsRef.current[panelJudge.id] = judgeInterval;
          }, index * 600); // Stagger the start times (0ms, 600ms, 1200ms, 1800ms)
        });
      } else {
        expressionIntervalRef.current = setInterval(() => {
          updateEmoji();
        }, 3000);
      }

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

  // Update emoji when dialogue type changes
  useEffect(() => {
    if (currentDialogueType) {
      updateEmoji();
    }
  }, [currentDialogueType, updateEmoji]);

  // Initialize judge expressions
  useEffect(() => {
    if (judges) {
      const initialExpressions: Record<string, string> = {};
      const initialEmojis = ['😬', '🤔', '🧐', '😏']; // Different starting emojis
      judges.forEach((judge, index) => {
        initialExpressions[judge.id] = initialEmojis[index] || '😬';
      });
      setJudgeExpressions(initialExpressions);
    }
  }, [judges]);

  useEffect(() => {
    startRecording();
    return () => {
      stopRecording();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Cleanup effect
  useEffect(() => {
    return () => {
      // Clear all judge intervals on cleanup
      Object.values(judgeIntervalsRef.current).forEach(interval => {
        clearInterval(interval);
      });
      judgeIntervalsRef.current = {};
    };
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

  if (isPanel && judges) {
    return (
      <div className="flex flex-col items-center justify-center space-y-8 w-full max-w-4xl">
        <div className="text-center mb-4">
          <h2 className="text-2xl font-headline font-bold mb-2">The Panel is Listening...</h2>
          <p className="text-muted-foreground">All four judges are evaluating your pitch</p>
        </div>
        
        <div className="grid grid-cols-2 gap-6 w-full max-w-2xl">
          {judges.map((panelJudge, index) => (
            <div key={panelJudge.id} className="relative flex flex-col items-center">
              <div 
                className={cn(
                  "absolute inset-0 rounded-full bg-background",
                  isRecording && "animate-pulse shadow-neumorphic-inset dark:shadow-neumorphic-inset-dark"
                )}
                style={{ animationDuration: pulseDuration }}
              ></div>

              <div className='relative flex flex-col items-center'>
                <div className='relative'>
                  <div className="relative w-24 h-24 rounded-full bg-background overflow-hidden">
                    <Suspense fallback={
                      <div className="flex items-center justify-center w-full h-full">
                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                      </div>
                    }>
                      <LottieAnimation 
                        animationPath={panelJudge.lottieAnimation || '/lottie/Businessman Giving Presentation.json'}
                        className="w-full h-full"
                        autoplay={true}
                        loop={true}
                        isGlitched={panelJudge.rarity === 'glitch'}
                      />
                    </Suspense>
                  </div>
                  
                  {/* Emoji reaction overlay */}
                  <div className="absolute -top-1 -right-1 text-2xl bg-background rounded-full p-1 shadow-neumorphic dark:shadow-neumorphic-dark transition-all animate-in zoom-in-50">
                    {judgeExpressions[panelJudge.id] || '😬'}
                  </div>
                  
                  {/* Comic dialogue boxes for each judge - multiple boxes for variety */}
                  <ComicDialogue 
                    className={index % 2 === 0 ? "-top-12 -left-16" : "-top-12 -right-16"}
                    isVisible={isRecording}
                    isGlitched={panelJudge.rarity === 'glitch'}
                    delay={1000 + (index * 1500)}
                    frequency={5000 + (index * 1000)}
                    recordingTime={MAX_RECORDING_TIME - countdown}
                    onDialogueChange={createJudgeDialogueHandler(panelJudge.id, 0)}
                  />
                  <ComicDialogue 
                    className={index % 2 === 0 ? "-bottom-12 -right-16" : "-bottom-12 -left-16"}
                    isVisible={isRecording}
                    isGlitched={panelJudge.rarity === 'glitch'}
                    delay={2500 + (index * 1500)}
                    frequency={6000 + (index * 1000)}
                    recordingTime={MAX_RECORDING_TIME - countdown}
                    onDialogueChange={createJudgeDialogueHandler(panelJudge.id, 1)}
                  />
                </div>
                <div className="flex flex-col items-center gap-1 mt-2">
                  <h3 className={cn('text-sm font-bold font-headline text-center', panelJudge.rarity === 'glitch' && 'glitch-text')}>
                    {panelJudge.name}
                  </h3>
                  {panelJudge.rarity !== 'common' && (
                    <Badge 
                      variant={panelJudge.rarity === 'glitch' ? 'destructive' : 'secondary'} 
                      className={cn('text-xs', panelJudge.rarity === 'glitch' && 'glitch-text')}
                    >
                      {panelJudge.rarity.toUpperCase()}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          ))}
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

  // Single judge mode
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
                      <LottieAnimation 
                        animationPath={currentJudge?.lottieAnimation || '/lottie/Businessman Giving Presentation.json'}
                        className="w-full h-full"
                        autoplay={true}
                        loop={true}
                        isGlitched={isGlitched}
                      />
                    </Suspense>
                </div>
                
                {/* Emoji reaction overlay */}
                <div className="absolute -top-2 -right-2 text-4xl bg-background rounded-full p-1 shadow-neumorphic dark:shadow-neumorphic-dark transition-all animate-in zoom-in-50">
                    {currentExpression}
                </div>
                
                {/* Comic dialogue boxes positioned around the judge */}
                <ComicDialogue 
                  className="-top-16 -left-20"
                  isVisible={isRecording}
                  isGlitched={isGlitched}
                  delay={1000}
                  frequency={5000}
                  recordingTime={MAX_RECORDING_TIME - countdown}
                  onDialogueChange={setCurrentDialogueType}
                />
                
                <ComicDialogue 
                  className="-top-12 -right-24"
                  isVisible={isRecording}
                  isGlitched={isGlitched}
                  delay={3000}
                  frequency={6000}
                  recordingTime={MAX_RECORDING_TIME - countdown}
                  onDialogueChange={setCurrentDialogueType}
                />
            </div>
            <div className="flex items-center gap-2 mt-4">
                <h2 className={cn('text-xl font-bold font-headline', isGlitched && 'glitch-text')}>{currentJudge?.name}</h2>
                {currentJudge?.rarity !== 'common' && <Badge variant={isGlitched ? 'destructive' : 'secondary'} className={cn(isGlitched && 'glitch-text')}>{currentJudge?.rarity.toUpperCase()}</Badge>}
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
