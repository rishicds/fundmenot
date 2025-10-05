
'use client';

import { Button } from '@/components/ui/button';
import { MicrophoneIcon } from '@/components/icons';
import Link from 'next/link';
import { Trophy, Users } from 'lucide-react';
import LandingAnimation from './landing-animation';
import LottieAnimation from './lottie-animation';

interface LandingProps {
  onStart: () => void;
}

export default function Landing({ onStart }: LandingProps) {
  return (
  <div className="relative flex flex-col items-center justify-center text-center p-4 md:p-6 w-full min-h-screen overflow-hidden">
      {/* Background Lottie - placed behind content */}
      <div className="fixed inset-0 -z-10 overflow-hidden w-screen h-screen">
        <div className="w-full h-full ">
          <LandingAnimation url={'/lottie/Speak%20and%20talk.json'} fill={true} className="w-full h-full opacity-30 md:opacity-40" />
        </div>
        {/* subtle overlay to improve text contrast */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/30 to-white/50 dark:from-transparent dark:via-black/30 dark:to-black/50 md:via-white/20 md:to-white/40 dark:md:via-black/20 dark:md:to-black/40" />
      </div>

      {/* Floating decorative animations */}
      {/* Top left - Businessman Presentation animation */}
      <div className="absolute top-8 left-8 w-32 h-32 opacity-60 hidden md:block">
        <LottieAnimation 
          animationPath="/lottie/Businessman Giving Presentation.json"
          className="w-full h-full"
        />
      </div>

      {/* Top right - Share an idea animation */}
      <div className="absolute top-16 right-8 w-28 h-28 opacity-50 animate-pulse hidden lg:block">
        <LottieAnimation 
          animationPath="/lottie/Share an idea.json"
          className="w-full h-full"
        />
      </div>

      {/* Mobile floating animations - repositioned for better mobile experience */}
      <div className="absolute top-6 right-3 w-12 h-12 opacity-40 animate-pulse md:hidden">
        <LottieAnimation 
          animationPath="/lottie/Share an idea.json"
          className="w-full h-full"
        />
      </div>

      <div className="absolute bottom-20 left-3 w-10 h-10 opacity-35 animate-bounce md:hidden">
        <LottieAnimation 
          animationPath="/lottie/Businessman Giving Presentation.json"
          className="w-full h-full"
        />
      </div>

      {/* Central main animation - responsive sizing */}
      <div className="w-40 h-40 sm:w-48 sm:h-48 md:w-64 md:h-64 pointer-events-none z-10 flex-shrink-0">
        <LandingAnimation />
      </div>
      
      {/* Title and description section */}
      <div className="space-y-4 md:space-y-6 z-10 px-2 max-w-4xl mx-auto">
        <h1 className="text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-bold font-headline tracking-tighter bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent leading-tight">
          FundMeNot
        </h1>
        <p className="max-w-xs sm:max-w-sm md:max-w-2xl text-sm sm:text-base md:text-lg lg:text-xl text-muted-foreground leading-relaxed mx-auto">
          Got a startup idea? You have 30 seconds. Pitch it to our panel of brutally honest AI judges and see if it&apos;s fire... or if you just get fired.
        </p>
      </div>
      
      {/* Buttons section */}
      <div className="flex flex-col sm:flex-row justify-center items-center gap-3 md:gap-4 z-10 w-full max-w-xs sm:max-w-lg md:max-w-xl px-2 pb-6 md:pb-8 mx-auto mt-4">
          <Button
            size="lg"
            className="w-full sm:w-auto font-bold hover:scale-105 active:scale-95 transition-transform duration-200 ease-in-out text-sm md:text-base py-3 md:py-4"
            onClick={onStart}
          >
            <MicrophoneIcon className="mr-2 md:mr-3 h-4 w-4 md:h-5 md:w-5" />
            Pitch Idea
          </Button>
          <Button asChild size="lg" variant="outline" className="w-full sm:w-auto font-bold hover:scale-105 active:scale-95 transition-transform duration-200 ease-in-out text-sm md:text-base py-3 md:py-4">
            <Link href="/judges">
              <Users className="mr-2 md:mr-3 h-4 w-4 md:h-5 md:w-5" />
              Meet the Judges
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="w-full sm:w-auto font-bold hover:scale-105 active:scale-95 transition-transform duration-200 ease-in-out text-sm md:text-base py-3 md:py-4">
            <Link href="/leaderboard">
              <Trophy className="mr-2 md:mr-3 h-4 w-4 md:h-5 md:w-5" />
              See Leaderboard
            </Link>
          </Button>
      </div>
    </div>
  );
}
