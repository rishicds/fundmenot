
'use client';

import { Button } from '@/components/ui/button';
import { MicrophoneIcon } from '@/components/icons';
import Link from 'next/link';
import { Trophy } from 'lucide-react';
import LandingAnimation from './landing-animation';

interface LandingProps {
  onStart: () => void;
}

export default function Landing({ onStart }: LandingProps) {
  return (
    <div className="relative flex flex-col items-center justify-center text-center space-y-10 p-4 w-full min-h-screen">
      {/* Background Lottie - placed behind content */}
      <div className="fixed inset-0 -z-10 overflow-hidden w-screen h-screen">
        <div className="w-full h-full ">
          <LandingAnimation url={'/lottie/Speak%20and%20talk.json'} fill={true} className="w-full h-full opacity-40" />
        </div>
        {/* subtle overlay to improve text contrast */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/20 to-white/40 dark:from-transparent dark:via-black/20 dark:to-black/40" />
      </div>

      <div className="w-64 h-64 pointer-events-none">
        <LandingAnimation />
      </div>
      <div className="space-y-4">
        <h1 className="text-5xl md:text-7xl font-bold font-headline tracking-tighter bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
          FundMeNot
        </h1>
        <p className="max-w-2xl text-lg md:text-xl text-muted-foreground">
          Got a startup idea? You have 30 seconds. Pitch it to our panel of brutally honest AI judges and see if it&apos;s fire... or if you just get fired.
        </p>
      </div>
      <div className="flex flex-col sm:flex-row gap-6">
          <Button
            size="lg"
            className="font-bold hover:scale-105 active:scale-95 transition-transform duration-200 ease-in-out"
            onClick={onStart}
          >
            <MicrophoneIcon className="mr-3 h-6 w-6" />
            Pitch Idea
          </Button>
          <Button asChild size="lg" variant="outline" className="font-bold hover:scale-105 active:scale-95 transition-transform duration-200 ease-in-out">
            <Link href="/leaderboard">
              <Trophy className="mr-3 h-6 w-6" />
              See Leaderboard
            </Link>
          </Button>
      </div>
    </div>
  );
}
