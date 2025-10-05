
'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import type { Judge } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Badge } from './ui/badge';
import { RotateCcw } from 'lucide-react';
import dynamic from 'next/dynamic';
import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';

const ModelViewer = dynamic(() => import('@/components/model-viewer'), {
  ssr: false,
  loading: () => (
    <div className="w-32 h-32 rounded-full bg-background shadow-neumorphic-inset dark:shadow-neumorphic-inset-dark flex items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  ),
});

interface JudgeIntroProps {
  judge: Judge;
  onStartRecording: () => void;
  onReroll: () => void;
  rerollCount: number;
  maxRerolls: number;
}

export default function JudgeIntro({ judge, onStartRecording, onReroll, rerollCount, maxRerolls }: JudgeIntroProps) {
  const isGlitched = judge.rarity === 'glitch';
  const canReroll = rerollCount < maxRerolls;

  const cardContent = (
    <>
      <div className="relative w-32 h-32 rounded-full bg-background shadow-neumorphic-inset dark:shadow-neumorphic-inset-dark overflow-hidden">
        <Suspense fallback={
          <div className="flex items-center justify-center w-full h-full">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        }>
          <ModelViewer 
            modelPath={judge.modelPath}
            className="w-full h-full"
            scale={4}
            autoRotate={false}
            isGlitched={isGlitched}
            cameraPosition={[0, 2, 3]}
            modelVariation={judge.modelVariation}
          />
        </Suspense>
      </div>
      <div className="flex items-center gap-2">
        <h2 className={cn('text-3xl font-bold font-headline', isGlitched && 'glitch-text')}>{judge.name}</h2>
        {judge.rarity !== 'common' && <Badge variant={isGlitched ? 'destructive' : 'secondary'} className={cn(isGlitched && 'glitch-text', 'shadow-neumorphic-sm dark:shadow-neumorphic-sm-dark')}>{judge.rarity.toUpperCase()}</Badge>}
      </div>
    </>
  );

  if (!canReroll) {
    return (
        <Card className="w-full max-w-sm text-center">
            <CardHeader>
                <CardTitle className="text-5xl font-headline text-destructive">Scaredy Cat!</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-4">
                <p className="text-lg text-muted-foreground">You&apos;ve dodged enough judges. Time to face your fears and pitch to this one.</p>
                {cardContent}
            </CardContent>
            <CardFooter>
                <Button onClick={onStartRecording} className="w-full" size="lg">
                 Face Your Fears & Start
                </Button>
            </CardFooter>
        </Card>
    )
  }
  
  return (
    <Card className="w-full max-w-sm text-center">
      <CardHeader>
        <p className="text-sm font-medium text-primary">Your Judge is...</p>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-4">
        {cardContent}
        <CardDescription>{judge.description}</CardDescription>
      </CardContent>
      <CardFooter className="flex-col gap-4">
        <Button onClick={onStartRecording} className="w-full" size="lg">
          I&apos;m Ready, Start the Clock!
        </Button>
        <Button onClick={onReroll} variant="outline" className="w-full">
            <RotateCcw className="mr-2 h-4 w-4" />
            Pick Another Judge ({maxRerolls - rerollCount} left)
        </Button>
      </CardFooter>
    </Card>
  );
}
