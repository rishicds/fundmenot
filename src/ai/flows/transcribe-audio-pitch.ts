'use server';

/**
 * @fileOverview A flow that transcribes an audio pitch into text.
 *
 * - transcribeAudioPitch - A function that handles the audio transcription process.
 * - TranscribeAudioPitchInput - The input type for the transcribeAudioPitch function.
 * - TranscribeAudioPitchOutput - The return type for the transcribeAudioPitch function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const TranscribeAudioPitchInputSchema = z.object({
  audioDataUri: z
    .string()
    .describe(
      'The audio data of the pitch, as a data URI that must include a MIME type and use Base64 encoding. Expected format: \'data:<mimetype>;base64,<encoded_data>\'.'  
    ),
});
export type TranscribeAudioPitchInput = z.infer<
  typeof TranscribeAudioPitchInputSchema
>;

const TranscribeAudioPitchOutputSchema = z.object({
  transcription: z
    .string()
    .describe('The transcribed text of the audio pitch.'),
});
export type TranscribeAudioPitchOutput = z.infer<
  typeof TranscribeAudioPitchOutputSchema
>;

export async function transcribeAudioPitch(
  input: TranscribeAudioPitchInput
): Promise<TranscribeAudioPitchOutput> {
  return transcribeAudioPitchFlow(input);
}

const transcribeAudioPitchPrompt = ai.definePrompt({
  name: 'transcribeAudioPitchPrompt',
  input: {schema: TranscribeAudioPitchInputSchema},
  output: {schema: TranscribeAudioPitchOutputSchema},
  prompt: `Transcribe the following audio pitch to text. \n\nAudio: {{media url=audioDataUri}}`,
});

const transcribeAudioPitchFlow = ai.defineFlow(
  {
    name: 'transcribeAudioPitchFlow',
    inputSchema: TranscribeAudioPitchInputSchema,
    outputSchema: TranscribeAudioPitchOutputSchema,
  },
  async input => {
    const {output} = await transcribeAudioPitchPrompt(input);
    return output!;
  }
);
