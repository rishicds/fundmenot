
'use client';

import { useEffect, useState } from 'react';
import Lottie from 'lottie-react';

interface LandingAnimationProps {
  /** optional url to a lottie json in the public folder (e.g. /lottie/Speak%20and%20talk.json) */
  url?: string;
  /** when true, make the animation fill its container (useful for backgrounds) */
  fill?: boolean;
  className?: string;
}

export default function LandingAnimation({ url, fill = false, className }: LandingAnimationProps) {
  const [animationData, setAnimationData] = useState<unknown | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        if (url) {
          const res = await fetch(url);
          const json = await res.json();
          if (!cancelled) setAnimationData(json);
        } else {
          // If no url provided, try to dynamically import the default landing animation
          const mod = await import('@/lib/lottie/landing-animation.json');
          if (!cancelled) setAnimationData(mod.default ?? mod);
        }
      } catch {
        // swallow errors; animation will simply not render
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [url]);

  if (!animationData) return null;

  const style = fill
    ? { width: '100%', height: '100%', minWidth: 0, minHeight: 0 }
    : undefined;

  return (
    <div className={className} style={fill ? { width: '100%', height: '100%' } : undefined}>
      <Lottie animationData={animationData} loop={true} style={style} />
    </div>
  );
};
