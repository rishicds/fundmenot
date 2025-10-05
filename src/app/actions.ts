'use server';

import { transcribeAudioPitch } from '@/ai/flows/transcribe-audio-pitch';
import { generateAIJudgeResponse } from '@/ai/flows/generate-ai-judge-response';
import { createGlitchedJudgeEvent } from '@/ai/flows/create-glitched-judge-event';
import { generateReportCard as generateReportCardFlow } from '@/ai/flows/generate-report-card';
import { analyzeSentiment } from '@/ai/flows/analyze-sentiment';
import { generateTTS } from '@/ai/flows/generate-tts';
import type { Judge, JudgeFeedbackResponse, JudgePersonality, ReportCardData } from '@/lib/types';
import { JUDGES } from '@/lib/judges';
import { initializeFirebaseServer } from '@/firebase/server';
import { addDocumentNonBlockingServer } from '@/firebase/server-operations';
import { collection } from 'firebase/firestore';

const GLITCH_CHANCE = 0.15; // 15% chance of a glitched judge event

async function getSentiment(text: string) {
  try {
    const sentimentResult = await analyzeSentiment(text);
    return sentimentResult.sentiment.toLowerCase();
  } catch (e) {
    console.warn("Sentiment analysis failed, defaulting to 'neutral'.", e);
    return 'neutral';
  }
}

export async function getJudge(excludeJudgeId?: string): Promise<{ data: Judge | null; error: string | null; }> {
    try {
        let commonJudges = JUDGES.filter(j => j.rarity === 'common');
        let rareJudges = JUDGES.filter(j => j.rarity === 'rare');
        
        // Filter out the current judge if provided
        if (excludeJudgeId) {
            commonJudges = commonJudges.filter(j => j.id !== excludeJudgeId);
            rareJudges = rareJudges.filter(j => j.id !== excludeJudgeId);
        }
        
        // Glitch judge is no longer selected here
        const judgePool = Math.random() < 0.25 ? [...commonJudges, ...rareJudges] : commonJudges;
        
        // If judge pool is empty (shouldn't happen with current setup), fallback to all judges except excluded
        if (judgePool.length === 0) {
            const allNonGlitchJudges = JUDGES.filter(j => j.rarity !== 'glitch' && j.id !== excludeJudgeId);
            if (allNonGlitchJudges.length === 0) {
                // This should never happen, but fallback to any judge except glitch
                const fallbackJudges = JUDGES.filter(j => j.rarity !== 'glitch');
                const judge = fallbackJudges[Math.floor(Math.random() * fallbackJudges.length)];
                return { data: judge, error: null };
            }
            const judge = allNonGlitchJudges[Math.floor(Math.random() * allNonGlitchJudges.length)];
            return { data: judge, error: null };
        }
        
        const judge = judgePool[Math.floor(Math.random() * judgePool.length)];
        
        return { data: judge, error: null };
    } catch (error) {
        console.error('Error in getJudge:', error);
        const message = error instanceof Error ? error.message : 'An unknown error occurred';
        return { data: null, error: message };
    }
}


export async function getJudgeFeedback(pitchTranscript: string, judgeId: string): Promise<{ data: JudgeFeedbackResponse | null; error: string | null; }> {
  try {
    if (!pitchTranscript) {
      throw new Error("Pitch transcript is empty. Please record your pitch again.");
    }

    const judge = JUDGES.find(j => j.id === judgeId);
    if (!judge) {
        throw new Error("Invalid judge selected.");
    }
    
    // The glitch now happens *after* the pitch is submitted
    const isGlitched = Math.random() < GLITCH_CHANCE;
    let responseText: string;
    let reversedSpeech = false;
    let audioDataUri: string | null = null;
    let finalJudge = judge;

    if (isGlitched) {
      // The original judge gets "hacked" and replaced by the Broken Judge
      finalJudge = JUDGES.find(j => j.rarity === 'glitch')!;
      const glitchEvent = await createGlitchedJudgeEvent();
      responseText = glitchEvent.glitchedAdvice;
      reversedSpeech = glitchEvent.reversedSpeech;
    } else {
      const judgeResponse = await generateAIJudgeResponse({
        pitchTranscript: pitchTranscript,
        judgePersonality: judge.personality as JudgePersonality,
      });
      responseText = judgeResponse.judgeResponse;
    }

    // Don't generate audio for reversed speech, the client can handle it.
    if (!reversedSpeech) {
      try {
        // Use the finalJudge's ID for voice generation (could be the original or the glitched one)
        const ttsResult = await generateTTS({ text: responseText, judgeId: finalJudge.id });
        audioDataUri = ttsResult.audioDataUri;
      } catch(e) {
        console.warn("TTS generation failed.", e)
        // If TTS fails, we can still proceed without audio.
      }
    }

    const sentiment = await getSentiment(responseText) as JudgeFeedbackResponse['sentiment'];

    const feedbackResponse: JudgeFeedbackResponse = {
      judge: finalJudge,
      response: responseText,
      sentiment,
      isGlitched,
      reversedSpeech,
      audioDataUri,
    };
    
    return { data: feedbackResponse, error: null };
  } catch (error) {
    console.error('Error in getJudgeFeedback:', error);
    const message = error instanceof Error ? error.message : 'An unknown error occurred';
    return { data: null, error: message };
  }
}


export async function handleAudioTranscription(audioDataUri: string): Promise<{ transcript: string | null; error: string | null }> {
  try {
    if (!audioDataUri) {
      return { transcript: null, error: 'Audio data is missing.' };
    }
    const { transcription } = await transcribeAudioPitch({ audioDataUri });
    if (!transcription) {
        return { transcript: null, error: 'AI could not understand the audio. Please try again.' };
    }
    return { transcript: transcription, error: null };
  } catch (error) {
    console.error('Error in handleAudioTranscription:', error);
    return { transcript: null, error: 'Failed to transcribe audio.' };
  }
}

export async function generateReportCard(pitch: string, feedback: string): Promise<{ data: ReportCardData | null, error: string | null }> {
    try {
        const result = await generateReportCardFlow({ pitch, feedback });
        return { data: { ...result, pitchId: '' }, error: null }; // pitchId will be generated later
    } catch (error) {
        console.error('Error generating report card:', error);
        const message = error instanceof Error ? error.message : 'An unknown error occurred';
        return { data: null, error: message };
    }
}

export async function saveLeaderboardEntry(reportCard: ReportCardData, userId: string): Promise<{ error: string | null }> {
    try {
        const { firestore } = initializeFirebaseServer();
        const leaderboardCol = collection(firestore, 'leaderboard');
        
        // Use the server-side non-blocking Firestore update
        addDocumentNonBlockingServer(leaderboardCol, {
            userId,
            leaderboardName: reportCard.leaderboardName,
            overallRoastLevel: reportCard.overallRoastLevel,
            feedbackSummary: reportCard.feedbackSummary,
            createdAt: new Date().toISOString(),
        });

        return { error: null };
    } catch (error) {
        console.error('Error saving to leaderboard:', error);
        const message = error instanceof Error ? error.message : 'An unknown error occurred';
        return { error: message };
    }
}
