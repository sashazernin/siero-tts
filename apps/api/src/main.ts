import Fastify from 'fastify';
import cors from '@fastify/cors';
import { MODEL_ID, VOICE_IDS, VOICES } from '@siero-tts/shared';
import { SileroWorker } from './silero-worker';

const PORT = Number(process.env.PORT ?? 8000);
const HOST = process.env.HOST ?? '127.0.0.1';

interface TtsBody {
  text: string;
  speaker: string;
  sample_rate?: 8000 | 24000 | 48000;
}

const worker = new SileroWorker();

async function buildServer() {
  const app = Fastify({ logger: true });

  await app.register(cors, { origin: true });

  app.get('/api/health', async () => ({
    status: 'ok',
    model: MODEL_ID,
    ready: true,
  }));

  app.get('/api/voices', async () => {
    const availableSpeakers = worker.getSpeakers();
    if (availableSpeakers.size === 0) {
      return VOICES;
    }

    return VOICES.filter((voice) => availableSpeakers.has(voice.id));
  });

  app.post<{ Body: TtsBody }>('/api/tts', async (request, reply) => {
    const { text, speaker, sample_rate = 48000 } = request.body;
    const trimmedText = text?.trim();

    if (!trimmedText) {
      return reply.code(400).send({ detail: 'Text is empty' });
    }

    if (!VOICE_IDS.has(speaker)) {
      return reply.code(400).send({ detail: 'Unknown speaker' });
    }

    try {
      const audio = await worker.synthesize(trimmedText, speaker, sample_rate);
      return reply.type('audio/wav').send(audio);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Synthesis failed';
      return reply.code(500).send({ detail: message });
    }
  });

  return app;
}

async function start() {
  await worker.start();

  const app = await buildServer();

  const shutdown = async () => {
    worker.stop();
    await app.close();
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);

  await app.listen({ port: PORT, host: HOST });
}

start().catch((error) => {
  console.error(error);
  process.exit(1);
});
