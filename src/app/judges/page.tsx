'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { JUDGES } from '@/lib/judges';
import LottieAnimation from '@/components/lottie-animation';
import Link from 'next/link';
import { ArrowLeft, Sparkles, Star, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

const rarityInfo = {
  common: { 
    icon: Star, 
    color: 'text-gray-500', 
    bgColor: 'bg-gray-100 dark:bg-gray-800',
    description: 'Your everyday startup critics'
  },
  rare: { 
    icon: Sparkles, 
    color: 'text-blue-500', 
    bgColor: 'bg-blue-100 dark:bg-blue-800',
    description: 'Seasoned veterans with unique perspectives'
  },
  glitch: { 
    icon: Zap, 
    color: 'text-red-500', 
    bgColor: 'bg-red-100 dark:bg-red-800',
    description: 'Something went wrong... or did it?'
  }
};

export default function JudgesPage() {
  const groupedJudges = JUDGES.reduce((acc, judge) => {
    if (!acc[judge.rarity]) {
      acc[judge.rarity] = [];
    }
    acc[judge.rarity].push(judge);
    return acc;
  }, {} as Record<string, typeof JUDGES>);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border/40 bg-background/60 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button asChild variant="ghost" size="sm">
                <Link href="/">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Home
                </Link>
              </Button>
              <div>
                <h1 className="text-3xl font-bold font-headline">Meet the Judges</h1>
                <p className="text-muted-foreground">Get to know our panel of brutally honest AI critics</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container max-w-6xl mx-auto px-4 py-8">
        {(Object.keys(groupedJudges) as Array<keyof typeof rarityInfo>).map((rarity) => {
          const RarityIcon = rarityInfo[rarity].icon;
          
          return (
            <div key={rarity} className="mb-12">
              <div className="flex items-center gap-3 mb-6">
                <div className={cn("p-2 rounded-full", rarityInfo[rarity].bgColor)}>
                  <RarityIcon className={cn("h-6 w-6", rarityInfo[rarity].color)} />
                </div>
                <div>
                  <h2 className="text-2xl font-bold font-headline capitalize">{rarity} Judges</h2>
                  <p className="text-muted-foreground">{rarityInfo[rarity].description}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {groupedJudges[rarity].map((judge) => {
                  const isGlitched = judge.rarity === 'glitch';
                  
                  return (
                    <Card 
                      key={judge.id} 
                      className={cn(
                        "transition-all duration-300 hover:shadow-lg hover:scale-[1.02]",
                        isGlitched && "bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-950/20 dark:to-orange-950/20 border-red-200 dark:border-red-800"
                      )}
                    >
                      <CardHeader className="text-center pb-4">
                        <div className="relative mx-auto mb-4">
                          <div className="w-24 h-24 rounded-full bg-background shadow-neumorphic-inset dark:shadow-neumorphic-inset-dark overflow-hidden">
                            {judge.lottieAnimation ? (
                              <LottieAnimation
                                animationPath={judge.lottieAnimation}
                                className="w-full h-full"
                                autoplay={true}
                                loop={true}
                                isGlitched={isGlitched}
                              />
                            ) : (
                              <div className="flex items-center justify-center w-full h-full text-2xl">
                                🎭
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex items-center justify-center gap-2">
                            <CardTitle className={cn("text-xl font-headline", isGlitched && "glitch-text")}>
                              {judge.name}
                            </CardTitle>
                            {judge.rarity !== 'common' && (
                              <Badge 
                                variant={isGlitched ? 'destructive' : 'secondary'} 
                                className={cn(
                                  "text-xs shadow-neumorphic-sm dark:shadow-neumorphic-sm-dark",
                                  isGlitched && "glitch-text"
                                )}
                              >
                                {judge.rarity.toUpperCase()}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </CardHeader>
                      
                      <CardContent className="pt-0">
                        <p className="text-sm text-muted-foreground text-center leading-relaxed">
                          {judge.description}
                        </p>
                        
                        <div className="mt-4 p-3 rounded-lg bg-muted/50 border border-border/50">
                          <p className="text-xs text-muted-foreground font-medium mb-1">Personality Type:</p>
                          <p className="text-sm font-mono">{judge.personality}</p>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          );
        })}
        
        {/* Call to Action */}
        <div className="text-center mt-16 p-8 rounded-lg bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10 border border-border/50">
          <h3 className="text-2xl font-bold font-headline mb-4">Ready to Face the Music?</h3>
          <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
            Now that you&apos;ve met our judges, are you brave enough to pitch your startup idea? 
            Remember, you only have 30 seconds to impress them!
          </p>
          <Button asChild size="lg" className="font-bold">
            <Link href="/">
              Start Your Pitch
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}