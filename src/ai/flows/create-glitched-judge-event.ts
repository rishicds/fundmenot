'use server';
/**
 * @fileOverview A flow that creates a glitched judge event with absurd advice and potentially reversed speech.
 *
 * - createGlitchedJudgeEvent - A function to trigger a glitched judge event.
 * - GlitchedJudgeEventOutput - The output type for the createGlitchedJudgeEvent function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GlitchedJudgeEventOutputSchema = z.object({
  glitchedAdvice: z.string().describe('Absurd advice from the broken judge.'),
  reversedSpeech: z.boolean().describe('Whether the speech should be reversed.'),
});
export type GlitchedJudgeEventOutput = z.infer<typeof GlitchedJudgeEventOutputSchema>;

export async function createGlitchedJudgeEvent(): Promise<GlitchedJudgeEventOutput> {
  return createGlitchedJudgeEventFlow();
}

const prompt = ai.definePrompt({
  name: 'glitchedJudgeEventPrompt',
  output: {schema: GlitchedJudgeEventOutputSchema},
  prompt: `You are an AI that generates absurd and humorous advice for a "Broken Judge" event in a startup pitch app.

  Generate a single piece of absurd advice.
  Determine whether the judge's speech should be reversed for added comedic effect. Return JSON.`,
});

const createGlitchedJudgeEventFlow = ai.defineFlow({
  name: 'createGlitchedJudgeEventFlow',
  outputSchema: GlitchedJudgeEventOutputSchema,
}, async () => {
  const {output} = await prompt({});
  return output!;
});
