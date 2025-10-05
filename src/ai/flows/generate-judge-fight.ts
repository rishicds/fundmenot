'use server';

/**
 * @fileOverview Generates a fight between judges where they roast each other instead of giving feedback.
 *
 * - generateJudgeFight - A function that generates roasts between panel judges.
 * - JudgeFightInput - The input type for the generateJudgeFight function.
 * - JudgeFightOutput - The return type for the generateJudgeFight function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const JudgeFightInputSchema = z.object({
  judges: z.array(z.object({
    name: z.string(),
    personality: z.string(),
  })).describe('The panel of judges who will fight.'),
});

export type JudgeFightInput = z.infer<typeof JudgeFightInputSchema>;

const JudgeFightOutputSchema = z.object({
  roasts: z.array(z.object({
    judgeIndex: z.number().describe('The index of the judge giving the roast (0-3).'),
    targetJudgeIndices: z.array(z.number()).describe('The indices of the judges being roasted (1-2 targets).'),
    roastText: z.string().describe('The roast text from this judge.'),
  })).describe('Array of roasts, one per judge.'),
});

export type JudgeFightOutput = z.infer<typeof JudgeFightOutputSchema>;

export async function generateJudgeFight(input: JudgeFightInput): Promise<JudgeFightOutput> {
  return generateJudgeFightFlow(input);
}

const judgeFightPrompt = ai.definePrompt({
  name: 'judgeFightPrompt',
  input: {schema: JudgeFightInputSchema},
  output: {schema: JudgeFightOutputSchema},
  prompt: `A fight has broken out between the judges! Instead of evaluating the pitch, they're roasting each other based on their personalities.

Here are the judges:
{{#each judges}}
- Judge {{@index}}: {{name}} (Personality: {{personality}})
{{/each}}

Generate a roast from EACH judge directed at 1-2 OTHER judges in the panel. Each roast should:
1. Be consistent with the judge's personality
2. Target at least 1 and at most 2 other judges
3. Be humorous, sarcastic, and personality-driven
4. Reference their contrasting personalities or typical behaviors
5. Be 2-3 sentences long

Make sure every judge roasts someone, creating a chaotic but entertaining fight scene!

Examples:
- VC Chad might roast Philosopher AI for being too abstract and not focused on profit
- TrollBot69 might mock Modern Dadu for being out of touch
- Hype Beast might call out Cosmic Coder for being too nerdy
- Modern Dadu might complain about everyone being too modern

IMPORTANT: Each judge (0-3) must have exactly ONE roast entry. The targetJudgeIndices array must contain 1-2 different judge indices (not including themselves).`,
});

const generateJudgeFightFlow = ai.defineFlow(
  {
    name: 'generateJudgeFightFlow',
    inputSchema: JudgeFightInputSchema,
    outputSchema: JudgeFightOutputSchema,
  },
  async input => {
    const {output} = await judgeFightPrompt(input);
    return output!;
  }
);
