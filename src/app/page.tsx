
'use client';

import { useState, useCallback, useEffect } from 'react';
import type { AppState, Judge, JudgeFeedbackResponse, ReportCardData } from '@/lib/types';
import { getJudge, getJudgeFeedback, generateReportCard, saveLeaderboardEntry } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import Landing from '@/components/landing';
import RecorderUI from '@/components/recorder-ui';
import FeedbackCard from '@/components/feedback-card';
import { Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import JudgeIntro from '@/components/judge-intro';
import ReportCard from '@/components/report-card';
import { useAuth, useUser, initiateAnonymousSignIn } from '@/firebase';
import { Button } from '@/components/ui/button';

const MAX_REROLLS = 3;

export default function Home() {
  const [appState, setAppState] = useState<AppState>('idle');
  const [feedback, setFeedback] = useState<JudgeFeedbackResponse | null>(null);
  const [judge, setJudge] = useState<Judge | null>(null);
  const [reportCard, setReportCard] = useState<ReportCardData | null>(null);
  const [pitchTranscript, setPitchTranscript] = useState<string | null>(null);
  const [rerollCount, setRerollCount] = useState(0);
  const { toast } = useToast();
  const { user, isUserLoading } = useUser();
  const auth = useAuth();

  useEffect(() => {
    // Automatically sign in the user anonymously if not already signed in and not loading.
    if (!user && !isUserLoading && auth) {
      initiateAnonymousSignIn(auth);
    }
  }, [user, isUserLoading, auth]);

  const handleGetJudge = useCallback(async (excludeCurrentJudge = false) => {
    setAppState('processing');
    try {
      const excludeJudgeId = excludeCurrentJudge && judge ? judge.id : undefined;
      const result = await getJudge(excludeJudgeId);
       if (result.error || !result.data) {
        throw new Error(result.error || 'Could not select a judge.');
      }
      setJudge(result.data);
      setAppState('judge-selected');
    } catch (error) {
       console.error(error);
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
      toast({
        variant: 'destructive',
        title: 'Error',
        description: `Could not select a judge. Please try again. Error: ${errorMessage}`,
      });
      setAppState('error');
    }
  }, [toast, judge]);
  
  const handleReroll = useCallback(() => {
    if (rerollCount < MAX_REROLLS) {
        setRerollCount(rerollCount + 1);
        handleGetJudge(true); // true means exclude current judge
    }
  }, [rerollCount, handleGetJudge]);


  const handleRecordingComplete = useCallback(async (transcript: string) => {
    if (!judge) {
        toast({
            variant: 'destructive',
            title: 'Error',
            description: 'No judge was selected. Please restart.',
        });
        setAppState('error');
        return;
    }
    setPitchTranscript(transcript);
    setAppState('processing');
    try {
      const result = await getJudgeFeedback(transcript, judge.id);
      if (result.error || !result.data) {
        throw new Error(result.error || 'Could not get feedback.');
      }
      setFeedback(result.data);
      setAppState('feedback');
    } catch (error) {
      console.error(error);
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
      toast({
        variant: 'destructive',
        title: 'Error Processing Pitch',
        description: `Your pitch couldn't be processed. Please try again. Error: ${errorMessage}`,
      });
      setAppState('error');
    }
  }, [toast, judge]);

  const handleShowReportCard = useCallback(async () => {
    if (!pitchTranscript || !feedback) return;
    setAppState('processing');
    try {
      const result = await generateReportCard(pitchTranscript, feedback.response);
       if (result.error || !result.data) {
        throw new Error(result.error || 'Could not generate report card.');
      }
      setReportCard(result.data);
      setAppState('report-card');
    } catch (error) {
      console.error(error);
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
      toast({
        variant: 'destructive',
        title: 'Error Generating Report Card',
        description: `We couldn't generate your report card. Please try again. Error: ${errorMessage}`,
      });
      setAppState('feedback'); // Go back to feedback screen
    }
  }, [pitchTranscript, feedback, toast]);

  const handleLeaderboardSubmit = useCallback(async (name: string) => {
    if (!user || !reportCard) return;
    setAppState('processing');
    try {
      const result = await saveLeaderboardEntry({ ...reportCard, leaderboardName: name }, user.uid);
       if (result.error) {
        throw new Error(result.error);
      }
      toast({
        title: 'Leaderboard Submitted!',
        description: 'You are now on the Most Roasted leaderboard!',
      });
      // After successful submission, go back to idle state
      handleReset();
    } catch (error) {
       console.error(error);
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
      toast({
        variant: 'destructive',
        title: 'Error Submitting to Leaderboard',
        description: `We couldn't submit your score. Please try again. Error: ${errorMessage}`,
      });
       // If submission fails, stay on the report card screen
       setAppState('report-card');
    }
  }, [reportCard, user, toast]);

  const handleReset = () => {
    setAppState('idle');
    setFeedback(null);
    setJudge(null);
    setReportCard(null);
    setPitchTranscript(null);
    setRerollCount(0);
  };
  
  const renderContent = () => {
    if (isUserLoading && appState !== 'idle') {
        return (
             <div className="flex flex-col items-center justify-center gap-4 text-center">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                <h2 className="text-2xl font-headline font-bold">Waking up the judges...</h2>
             </div>
        )
    }

    switch (appState) {
      case 'judge-selected':
        return judge && <JudgeIntro judge={judge} onStartRecording={() => setAppState('recording')} onReroll={handleReroll} rerollCount={rerollCount} maxRerolls={MAX_REROLLS} />;
      case 'recording':
        return judge && <RecorderUI judge={judge} onRecordingComplete={handleRecordingComplete} setAppState={setAppState} />;
      case 'processing':
        return (
          <div className="flex flex-col items-center justify-center gap-4 text-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <h2 className="text-2xl font-headline font-bold">Judges are deliberating...</h2>
            <p className="text-muted-foreground">Analyzing your groundbreaking (or ground-shaking) idea.</p>
          </div>
        );
      case 'feedback':
        return feedback && <FeedbackCard feedback={feedback} onNext={handleShowReportCard} />;
      case 'report-card':
        return reportCard && <ReportCard reportCard={reportCard} onSubmit={handleLeaderboardSubmit} onReset={handleReset} />;
       case 'error':
        return (
           <Card className="w-full max-w-md text-center">
            <CardContent className="p-8">
              <h2 className='text-2xl font-bold font-headline mb-4 text-destructive'>Something went wrong</h2>
              <p className="text-muted-foreground mb-6">We hit a snag. Please try again from the beginning.</p>
              <Button onClick={handleReset}>
                Start Over
              </Button>
            </CardContent>
          </Card>
        )
      case 'idle':
      default:
        return <Landing onStart={handleGetJudge} />;
    }
  };

  return (
    <div className="container mx-auto flex min-h-screen flex-col items-center justify-center p-4">
      {renderContent()}
    </div>
  );
}
