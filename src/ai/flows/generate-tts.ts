'use server';
/**
 * @fileOverview This file defines a Genkit flow for generating speech from text.
 *
 * It exports:
 * - `generateTTS`: An async function that takes text and a voice name, and returns audio data.
 * - `TTSInput`: The input type for the generateTTS function.
 * - `TTSOutput`: The output type for the generateTTS function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import wav from 'wav';
import { JUDGES } from '@/lib/judges';

const TTSInputSchema = z.object({
  text: z.string().describe('The text to be converted to speech.'),
  judgeId: z.string().describe('The ID of the judge to determine the voice.'),
});
export type TTSInput = z.infer<typeof TTSInputSchema>;

const TTSOutputSchema = z.object({
  audioDataUri: z.string().describe('The base64 encoded WAV audio data URI.'),
});
export type TTSOutput = z.infer<typeof TTSOutputSchema>;

export async function generateTTS(input: TTSInput): Promise<TTSOutput> {
  return generateTTSFlow(input);
}

async function toWav(
  pcmData: Buffer,
  channels = 1,
  rate = 24000,
  sampleWidth = 2
): Promise<string> {
  return new Promise((resolve, reject) => {
    const writer = new wav.Writer({
      channels,
      sampleRate: rate,
      bitDepth: sampleWidth * 8,
    });

    const bufs: Buffer[] = [];
    writer.on('error', reject);
    writer.on('data', (d) => bufs.push(d));
    writer.on('end', () => resolve(Buffer.concat(bufs).toString('base64')));

    writer.write(pcmData);
    writer.end();
  });
}

const generateTTSFlow = ai.defineFlow(
  {
    name: 'generateTTSFlow',
    inputSchema: TTSInputSchema,
    outputSchema: TTSOutputSchema,
  },
  async ({ text, judgeId }) => {
    const judge = JUDGES.find((j) => j.id === judgeId);
    const voiceName = judge?.voice?.name || 'gemini-pro-audio'; // A more natural default voice

    const { media } = await ai.generate({
      model: 'googleai/gemini-2.5-flash-preview-tts',
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            // Using higher quality, more natural prebuilt voices
            prebuiltVoiceConfig: { voiceName },
          },
        },
      },
      prompt: text,
    });

    if (!media?.url) {
      throw new Error('TTS generation failed: no media returned.');
    }

    const pcmData = Buffer.from(
      media.url.substring(media.url.indexOf(',') + 1),
      'base64'
    );
    const wavBase64 = await toWav(pcmData);

    return {
      audioDataUri: `data:audio/wav;base64,${wavBase64}`,
    };
  }
);
