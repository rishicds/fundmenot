'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import type { Judge } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Badge } from './ui/badge';
import { RotateCcw, Users } from 'lucide-react';
import dynamic from 'next/dynamic';
import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';

const LottieAnimation = dynamic(() => import('@/components/lottie-animation'), {
  ssr: false,
  loading: () => (
    <div className="w-24 h-24 rounded-full bg-background shadow-neumorphic-inset dark:shadow-neumorphic-inset-dark flex items-center justify-center">
      <Loader2 className="h-6 w-6 animate-spin text-primary" />
    </div>
  ),
});

interface PanelIntroProps {
  judges: Judge[];
  onStartRecording: () => void;
  onReroll: () => void;
  rerollCount: number;
  maxRerolls: number;
}

export default function PanelIntro({ judges, onStartRecording, onReroll, rerollCount, maxRerolls }: PanelIntroProps) {
  const canReroll = rerollCount < maxRerolls;

  const cardContent = (
    <>
      <div className="flex justify-center mb-6">
        <div className="flex items-center gap-2 text-primary">
          <Users className="h-6 w-6" />
          <span className="text-lg font-semibold">Judge Panel</span>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4 mb-6">
        {judges.map((judge, index) => (
          <div key={judge.id} className="flex flex-col items-center gap-2">
            <div className="relative w-24 h-24 rounded-full bg-background shadow-neumorphic-inset dark:shadow-neumorphic-inset-dark overflow-hidden">
              <Suspense fallback={
                <div className="flex items-center justify-center w-full h-full">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              }>
                <LottieAnimation 
                  animationPath={judge.lottieAnimation || '/lottie/Businessman Giving Presentation.json'}
                  className="w-full h-full"
                  autoplay={true}
                  loop={true}
                />
              </Suspense>
            </div>
            <div className="text-center">
              <h4 className="font-semibold text-sm">{judge.name}</h4>
              <Badge 
                variant={judge.rarity === 'rare' ? 'default' : 'secondary'} 
                className="text-xs mt-1"
              >
                {judge.rarity}
              </Badge>
            </div>
          </div>
        ))}
      </div>

      <div className="text-center space-y-2">
        <p className="text-sm text-muted-foreground">
          Four judges will evaluate your pitch from different perspectives
        </p>
        <div className="flex flex-wrap justify-center gap-1">
          {judges.map((judge) => (
            <span key={judge.id} className="text-xs px-2 py-1 bg-muted rounded-full">
              {judge.name}
            </span>
          ))}
        </div>
      </div>
    </>
  );

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader className="text-center pb-4">
        <CardTitle className="text-2xl font-headline">
          Your Judge Panel is Ready!
        </CardTitle>
        <CardDescription>
          Get ready to face the panel. They&apos;re not holding back.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-6">
        {cardContent}
      </CardContent>
      <CardFooter className="flex justify-center gap-3">
        <Button 
          variant="outline" 
          onClick={onReroll}
          disabled={!canReroll}
          className="gap-2"
        >
          <RotateCcw className="h-4 w-4" />
          Reroll Panel ({maxRerolls - rerollCount} left)
        </Button>
        <Button 
          onClick={onStartRecording}
          className="gap-2 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
        >
          Face the Panel
        </Button>
      </CardFooter>
    </Card>
  );
}