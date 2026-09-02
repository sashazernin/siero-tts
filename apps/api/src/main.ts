import Fastify from 'fastify';
import cors from '@fastify/cors';
import {
  DEFAULT_MODEL_ID,
  MODELS,
  VOICES,
  findVoice,
  isModelId,
} from '@siero-tts/shared';
import { SileroWorker } from './silero-worker';
import type { ModelId } from '@siero-tts/shared';

const PORT = Number(process.env.PORT ?? 8000);
const HOST = process.env.HOST ?? '127.0.0.1';

interface TtsBody {
  text: string;
  speaker: string;
  model?: ModelId;
  sample_rate?: 8000 | 24000 | 48000;
}

const worker = new SileroWorker();

function filterAvailableVoices() {
  const loadedModels = worker.getLoadedModels();

  if (loadedModels.size === 0) {
    return VOICES;
  }

  return VOICES.filter((voice) => {
    const speakers = loadedModels.get(voice.modelId);
    if (!speakers || speakers.size === 0) {
      return true;
    }

    return speakers.has(voice.id);
  });
}

async function buildServer() {
  const app = Fastify({ logger: true });

  await app.register(cors, { origin: true });

  app.get('/api/health', async () => ({
    status: 'ok',
    models: Object.values(MODELS).map((model) => ({
      id: model.id,
      commercialAllowed: model.commercialAllowed,
      loaded: worker.getSpeakers(model.id).size > 0,
    })),
    ready: true,
  }));

  app.get('/api/voices', async () => filterAvailableVoices());

  app.post<{ Body: TtsBody }>('/api/tts', async (request, reply) => {
    const { text, speaker, model, sample_rate = 48000 } = request.body;
    const trimmedText = text?.trim();

    if (!trimmedText) {
      return reply.code(400).send({ detail: 'Text is empty' });
    }

    const modelId = model ?? DEFAULT_MODEL_ID;
    if (!isModelId(modelId)) {
      return reply.code(400).send({ detail: 'Unknown model' });
    }

    const resolvedVoice = findVoice(VOICES, modelId, speaker);
    if (!resolvedVoice) {
      return reply.code(400).send({ detail: 'Unknown speaker' });
    }

    try {
      const audio = await worker.synthesize(
        trimmedText,
        speaker,
        sample_rate,
        resolvedVoice.modelId,
      );
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
