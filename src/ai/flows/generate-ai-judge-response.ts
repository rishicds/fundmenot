'use server';

/**
 * @fileOverview Generates responses from AI judges with distinct personalities.
 *
 * - generateAIJudgeResponse - A function that generates AI judge responses.
 * - AIJudgeResponseInput - The input type for the generateAIJudgeResponse function.
 * - AIJudgeResponseOutput - The return type for the generateAIJudgeResponse function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AIJudgeResponseInputSchema = z.object({
  pitchTranscript: z.string().describe('The transcript of the user\'s startup pitch.'),
  judgePersonality: z.enum([
    'VC Chad',
    'Philosopher AI',
    'TrollBot69',
    'Modern Dadu',
    'Outdated GenZ',
    'Cosmic Coder',
    'Hype Beast',
  ]).describe('The personality of the AI judge.'),
});

export type AIJudgeResponseInput = z.infer<typeof AIJudgeResponseInputSchema>;

const AIJudgeResponseOutputSchema = z.object({
  judgeResponse: z.string().describe('The AI judge\'s response to the pitch.'),
});

export type AIJudgeResponseOutput = z.infer<typeof AIJudgeResponseOutputSchema>;

export async function generateAIJudgeResponse(input: AIJudgeResponseInput): Promise<AIJudgeResponseOutput> {
  return generateAIJudgeResponseFlow(input);
}

const judgePrompt = ai.definePrompt({
  name: 'judgePrompt',
  input: {schema: AIJudgeResponseInputSchema},
  output: {schema: AIJudgeResponseOutputSchema},
  prompt: `You are acting as an AI judge with the following personality: {{{judgePersonality}}}. Your task is to provide feedback on a startup pitch.

  Here is the pitch transcript:
  {{pitchTranscript}}

  Generate a response that is consistent with your assigned personality.
  VC Chad should be brutally honest and focused on financial viability.
  Philosopher AI should be philosophical and question the deeper meaning of the startup.
  TrollBot69 should be sarcastic and humorous.
  Modern Dadu should complain about modern tech.
  Outdated GenZ should use outdated GenZ slang.
  Cosmic Coder should speak in highly technical, almost divine, programming terms, viewing the idea as a simple algorithm.
  Hype Beast should be obsessed with trends, "drip", and social media clout.
  `,
});

const generateAIJudgeResponseFlow = ai.defineFlow(
  {
    name: 'generateAIJudgeResponseFlow',
    inputSchema: AIJudgeResponseInputSchema,
    outputSchema: AIJudgeResponseOutputSchema,
  },
  async input => {
    const {output} = await judgePrompt(input);
    return output!;
  }
);
