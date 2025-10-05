'use client';

import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

// Import Lottie dynamically to avoid SSR issues
import dynamic from 'next/dynamic';

const Lottie = dynamic(() => import('lottie-react'), {
  ssr: false,
});

interface LottieAnimationProps {
  animationData?: object;
  animationPath?: string;
  className?: string;
  autoplay?: boolean;
  loop?: boolean;
  isGlitched?: boolean;
}

export default function LottieAnimation({ 
  animationData, 
  animationPath, 
  className, 
  autoplay = true, 
  loop = true, 
  isGlitched = false
}: LottieAnimationProps) {
  const animationRef = useRef(null);

  // If we have animationPath, we need to fetch the JSON
  const [animationJson, setAnimationJson] = useState<object | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (animationPath && !animationData) {
      setLoading(true);
      fetch(animationPath)
        .then(response => response.json())
        .then(data => {
          setAnimationJson(data);
          setLoading(false);
        })
        .catch(error => {
          console.error('Failed to load Lottie animation:', error);
          setLoading(false);
        });
    }
  }, [animationPath, animationData]);

  if (loading) {
    return (
      <div className={cn("flex items-center justify-center", className)}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const animation = animationData || animationJson;

  if (!animation) {
    return (
      <div className={cn("flex items-center justify-center bg-muted rounded-full", className)}>
        <span className="text-muted-foreground">🎭</span>
      </div>
    );
  }

  return (
    <div className={cn(
      "relative bg-white rounded-full",
      isGlitched && "animate-pulse filter hue-rotate-180 contrast-150",
      className
    )}>
      <Lottie
        lottieRef={animationRef}
        animationData={animation}
        autoplay={autoplay}
        loop={loop}
        className="w-full h-full"
      />
    </div>
  );
}