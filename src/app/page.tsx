
'use client';

import { useState, useCallback, useEffect } from 'react';
import type { AppState, Judge, JudgeFeedbackResponse, PanelFeedbackResponse, ReportCardData } from '@/lib/types';
import { getJudge, getJudgePanel, getJudgeFeedback, getPanelFeedback, generateReportCard, saveLeaderboardEntry } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import Landing from '@/components/landing';
import RecorderUI from '@/components/recorder-ui';
import FeedbackCard from '@/components/feedback-card';
import PanelFeedbackCard from '@/components/panel-feedback-card';
import { Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import JudgeIntro from '@/components/judge-intro';
import PanelIntro from '@/components/panel-intro';
import ReportCard from '@/components/report-card';
import { useAuth, useUser, initiateAnonymousSignIn } from '@/firebase';
import { Button } from '@/components/ui/button';

const MAX_REROLLS = 3;

export default function Home() {
  const [appState, setAppState] = useState<AppState>('idle');
  const [feedback, setFeedback] = useState<JudgeFeedbackResponse | null>(null);
  const [panelFeedback, setPanelFeedback] = useState<PanelFeedbackResponse | null>(null);
  const [judge, setJudge] = useState<Judge | null>(null);
  const [judges, setJudges] = useState<Judge[] | null>(null);
  const [reportCard, setReportCard] = useState<ReportCardData | null>(null);
  const [pitchTranscript, setPitchTranscript] = useState<string | null>(null);
  const [rerollCount, setRerollCount] = useState(0);
  const [isPanel, setIsPanel] = useState(false);
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
    setIsPanel(false);
    setAppState('processing');
    try {
      const excludeJudgeId = excludeCurrentJudge && judge ? judge.id : undefined;
      const result = await getJudge(excludeJudgeId);
       if (result.error || !result.data) {
        throw new Error(result.error || 'Could not select a judge.');
      }
      setJudge(result.data);
      setJudges(null);
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

  const handleGetJudgePanel = useCallback(async () => {
    setIsPanel(true);
    setAppState('processing');
    try {
      const result = await getJudgePanel();
      if (result.error || !result.data) {
        throw new Error(result.error || 'Could not select judge panel.');
      }
      setJudges(result.data);
      setJudge(null);
      setAppState('panel-selected');
    } catch (error) {
      console.error(error);
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
      toast({
        variant: 'destructive',
        title: 'Error',
        description: `Could not select judge panel. Please try again. Error: ${errorMessage}`,
      });
      setAppState('error');
    }
  }, [toast]);
  
  const handleReroll = useCallback(() => {
    if (rerollCount < MAX_REROLLS) {
        setRerollCount(rerollCount + 1);
        if (isPanel) {
          handleGetJudgePanel();
        } else {
          handleGetJudge(true); // true means exclude current judge
        }
    }
  }, [rerollCount, isPanel, handleGetJudge, handleGetJudgePanel]);


  const handleRecordingComplete = useCallback(async (transcript: string) => {
    if (isPanel && !judges) {
        toast({
            variant: 'destructive',
            title: 'Error',
            description: 'No judge panel was selected. Please restart.',
        });
        setAppState('error');
        return;
    }
    
    if (!isPanel && !judge) {
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
      if (isPanel && judges) {
        const result = await getPanelFeedback(transcript, judges);
        if (result.error || !result.data) {
          throw new Error(result.error || 'Could not get panel feedback.');
        }
        setPanelFeedback(result.data);
        setAppState('panel-feedback');
      } else if (judge) {
        const result = await getJudgeFeedback(transcript, judge.id);
        if (result.error || !result.data) {
          throw new Error(result.error || 'Could not get feedback.');
        }
        setFeedback(result.data);
        setAppState('feedback');
      }
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
  }, [toast, judge, judges, isPanel]);

  const handleShowReportCard = useCallback(async () => {
    if (!pitchTranscript) return;
    
    let combinedFeedback = '';
    if (isPanel && panelFeedback) {
      combinedFeedback = panelFeedback.responses.map(response => 
        `${response.judge.name}: ${response.response}`
      ).join('\n\n');
    } else if (feedback) {
      combinedFeedback = feedback.response;
    } else {
      return;
    }
    
    setAppState('processing');
    try {
      const result = await generateReportCard(pitchTranscript, combinedFeedback);
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
      // Go back to appropriate feedback screen
      setAppState(isPanel ? 'panel-feedback' : 'feedback');
    }
  }, [pitchTranscript, feedback, panelFeedback, isPanel, toast]);

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
    setPanelFeedback(null);
    setJudge(null);
    setJudges(null);
    setReportCard(null);
    setPitchTranscript(null);
    setRerollCount(0);
    setIsPanel(false);
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
      case 'panel-selected':
        return judges && <PanelIntro judges={judges} onStartRecording={() => setAppState('recording')} onReroll={handleReroll} rerollCount={rerollCount} maxRerolls={MAX_REROLLS} />;
      case 'recording':
        return <RecorderUI judge={judge} judges={judges} onRecordingComplete={handleRecordingComplete} setAppState={setAppState} />;
      case 'processing':
        return (
          <div className="flex flex-col items-center justify-center gap-4 text-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <h2 className="text-2xl font-headline font-bold">
              {isPanel ? 'Judge panel is deliberating...' : 'Judges are deliberating...'}
            </h2>
            <p className="text-muted-foreground">
              {isPanel ? 'Four judges are analyzing your pitch from different angles.' : 'Analyzing your groundbreaking (or ground-shaking) idea.'}
            </p>
          </div>
        );
      case 'feedback':
        return feedback && <FeedbackCard feedback={feedback} onNext={handleShowReportCard} />;
      case 'panel-feedback':
        return panelFeedback && <PanelFeedbackCard panelFeedback={panelFeedback} onNext={handleShowReportCard} />;
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
        return <Landing onStart={handleGetJudge} onStartPanel={handleGetJudgePanel} />;
    }
  };

  return (
    <div className="container mx-auto flex min-h-screen flex-col items-center justify-center p-4">
      {renderContent()}
    </div>
  );
}
