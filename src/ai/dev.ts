import { config } from 'dotenv';
config();

import '@/ai/flows/transcribe-audio-pitch.ts';
import '@/ai/flows/analyze-sentiment.ts';
import '@/ai/flows/generate-ai-judge-response.ts';
import '@/ai/flows/create-glitched-judge-event.ts';
import '@/ai/flows/generate-tts.ts';
import '@/ai/flows/generate-report-card.ts';