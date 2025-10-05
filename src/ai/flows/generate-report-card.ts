'use server';
/**
 * @fileOverview This file defines a Genkit flow for generating a report card based on a startup pitch and judge feedback.
 *
 * It exports:
 * - `generateReportCard`: An async function that takes a pitch and feedback, and returns a report card.
 * - `ReportCardInput`: The input type for the generateReportCard function.
 * - `ReportCardOutput`: The output type for the generateReportCard function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const ReportCardInputSchema = z.object({
  pitch: z.string().describe("The user's startup pitch transcript."),
  feedback: z.string().describe("The AI judge's feedback on the pitch."),
});
export type ReportCardInput = z.infer<typeof ReportCardInputSchema>;

const ScoreSchema = z.object({
    category: z.enum(['Originality', 'Viability', 'Clarity']),
    score: z.number().min(0).max(100).describe('The score for the category, from 0 to 100.'),
    grade: z.enum(['A', 'B', 'C', 'J']).describe('The grade for the category. A for Awesome, B for Boring, C for Meh, J for Joker.'),
    reasoning: z.string().describe('A short, witty reasoning for the score and grade.')
});

const ReportCardOutputSchema = z.object({
  overallRoastLevel: z.number().min(0).max(100).describe('A score from 0 to 100 indicating how badly the user was "roasted". 100 is a severe burn. This should be an average of how negative the feedback was across all categories.'),
  feedbackSummary: z.string().describe('A short, witty summary of the feedback, suitable for a report card.'),
  scores: z.array(ScoreSchema).describe('An array of scores for different categories.')
});
export type ReportCardOutput = z.infer<typeof ReportCardOutputSchema>;

export async function generateReportCard(input: ReportCardInput): Promise<ReportCardOutput> {
  return generateReportCardFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateReportCardPrompt',
  input: { schema: ReportCardInputSchema },
  output: { schema: ReportCardOutputSchema },
  prompt: `You are an AI that generates a "report card" for a startup pitch roasting session.
  
  Analyze the pitch and the judge's feedback to generate scores, grades, and a summary.
  
  **Pitch:**
  {{{pitch}}}
  
  **Judge's Feedback:**
  {{{feedback}}}

  Generate the report card with the following fields:
  - **scores**: An array of scores for three categories: 'Originality', 'Viability', and 'Clarity'.
    - For each category, provide:
      - **score**: A numerical score from 0-100.
      - **grade**: A letter grade. Use 'A' for Awesome (85+), 'B' for Boring (60-84), 'C' for Meh (40-59), and 'J' for Joker (0-39).
      - **reasoning**: A short, witty, and slightly humorous one-sentence explanation for the grade.
  - **overallRoastLevel**: A score from 0-100. A higher score means a more brutal roast. This should be based on the overall negativity and sarcasm of the judge's feedback. A purely positive feedback should be 0. A neutral but unenthusiastic feedback should be around 20-40. A slightly negative or sarcastic comment should be 40-70. A truly brutal, soul-crushing roast should be 80-100.
  - **feedbackSummary**: A short, witty, and slightly humorous summary of the judge's feedback. Keep it to one or two sentences.
  
  Generate the report card JSON output.
  `,
});


const generateReportCardFlow = ai.defineFlow(
  {
    name: 'generateReportCardFlow',
    inputSchema: ReportCardInputSchema,
    outputSchema: ReportCardOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
