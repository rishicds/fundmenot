'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { Progress } from '@/components/ui/progress';
import { RotateCcw, Send, Sparkles, Lightbulb, TrendingUp } from 'lucide-react';
import type { ReportCardData, Grade, Score, ScoreCategory } from '@/lib/types';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import LottieAnimation from '@/components/lottie-animation';

const leaderboardFormSchema = z.object({
  name: z.string().min(2, {
    message: 'Name must be at least 2 characters.',
  }).max(20, {
      message: 'Name must be less than 20 characters.'
  }),
});

interface ReportCardProps {
  reportCard: ReportCardData;
  onSubmit: (name: string) => Promise<void>;
  onReset: () => void;
}

const gradeStyles: Record<Grade, { bg: string; text: string; label: string }> = {
    A: { bg: 'bg-green-500', text: 'text-white', label: 'Awesome' },
    B: { bg: 'bg-blue-500', text: 'text-white', label: 'Boring' },
    C: { bg: 'bg-yellow-500', text: 'text-white', label: 'Meh' },
    J: { bg: 'bg-red-600', text: 'text-white', label: 'Joker' },
};

const categoryIcons: Record<ScoreCategory, React.ComponentType<{className?: string}>> = {
    'Originality': Lightbulb,
    'Viability': TrendingUp,
    'Clarity': Sparkles,
};

function ScoreDisplay({ category, score, grade, reasoning }: Score) {
    const gradeInfo = gradeStyles[grade];
    const Icon = categoryIcons[category];

    return (
        <div className="flex items-start space-x-4">
            <div className="flex flex-col items-center gap-1 w-12">
                 <div className={cn("flex items-center justify-center h-10 w-10 rounded-full text-lg font-bold", gradeInfo.bg, gradeInfo.text)}>
                    {grade}
                </div>
                <div className="text-xs font-bold text-muted-foreground">{gradeInfo.label}</div>
            </div>
            <div className="flex-1 space-y-1 text-left">
                <div className="flex items-center gap-2">
                     <Icon className="h-5 w-5 text-primary"/>
                     <h4 className="font-semibold text-foreground">{category}</h4>
                </div>
                <p className="text-sm text-muted-foreground italic">&ldquo;{reasoning}&rdquo;</p>
            </div>
        </div>
    );
}


export default function ReportCard({ reportCard, onSubmit, onReset }: ReportCardProps) {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { overallRoastLevel, feedbackSummary, scores } = reportCard;

  const form = useForm<z.infer<typeof leaderboardFormSchema>>({
    resolver: zodResolver(leaderboardFormSchema),
    defaultValues: {
      name: '',
    },
  });

  async function handleSubmit(values: z.infer<typeof leaderboardFormSchema>) {
    await onSubmit(values.name);
    setIsSubmitted(true);
  }
  
  const getRoastColor = (level: number) => {
    if (level > 80) return 'bg-red-600';
    if (level > 60) return 'bg-orange-500';
    if (level > 40) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  return (
    <Card className="w-full max-w-md text-center">
      <CardHeader>
        <div className="flex flex-col items-center gap-4">
          <LottieAnimation 
            animationPath="/lottie/Results.json"
            className="w-24 h-24"
            autoplay={true}
            loop={true}
          />
          <div>
            <CardTitle className="text-4xl font-headline">Your Report Card</CardTitle>
            <CardDescription>How well did your startup survive the roast?</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4 p-4 rounded-xl shadow-neumorphic-inset dark:shadow-neumorphic-inset-dark">
            {scores.map(score => <ScoreDisplay key={score.category} {...score} />)}
        </div>

        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-muted-foreground">Overall Roast Level</h3>
          <div className="flex items-center gap-4">
            <div className='flex-grow p-1 rounded-full shadow-neumorphic-inset dark:shadow-neumorphic-inset-dark'>
                <Progress value={overallRoastLevel} indicatorClassName={cn(getRoastColor(overallRoastLevel))} className="h-4" />
            </div>
            <span className="text-3xl font-bold font-headline">{overallRoastLevel}</span>
          </div>
           <p className="text-sm italic text-muted-foreground">&ldquo;{feedbackSummary}&rdquo;</p>
        </div>
        
        {isSubmitted ? (
            <div className="p-4 rounded-lg bg-secondary/70">
                <p className="text-primary font-bold">Your score has been submitted!</p>
                <Button asChild variant="link" className="mt-2">
                    <Link href="/leaderboard">
                        Check the Leaderboard
                    </Link>
                </Button>
            </div>
        ) : (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 pt-4">
            <p className="text-sm text-muted-foreground">Enter the leaderboard of the most roasted!</p>
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem className='w-full'>
                  <div className="flex items-center justify-center gap-2">
                    <FormControl>
                      <Input placeholder="Your Leaderboard Name" {...field} className="max-w-xs shadow-neumorphic-inset-sm dark:shadow-neumorphic-inset-sm-dark" />
                    </FormControl>
                    <Button type="submit" disabled={form.formState.isSubmitting} variant="outline" size="icon">
                      <Send />
                    </Button>
                  </div>
                  <FormMessage className="text-center">{form.formState.errors.name?.message}</FormMessage>
                </FormItem>
              )}
            />
          </form>
        </Form>
        )}
      </CardContent>
      <CardFooter>
        <Button onClick={onReset} variant="outline" size="lg" className="w-full">
          <RotateCcw className="mr-2" />
          Pitch Again
        </Button>
      </CardFooter>
    </Card>
  );
}
