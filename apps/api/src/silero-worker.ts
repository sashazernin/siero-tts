import { existsSync } from 'node:fs';
import { EventEmitter } from 'node:events';
import { spawn, type ChildProcessWithoutNullStreams } from 'node:child_process';
import { createInterface } from 'node:readline';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import type { ModelId } from '@siero-tts/shared';

interface WorkerResponse {
  id?: string;
  ok?: boolean;
  ready?: boolean;
  audio_base64?: string;
  error?: string;
  event?: string;
  model?: string;
  models?: Record<string, string[]>;
  speakers?: string[];
}

interface PendingRequest {
  resolve: (buffer: Buffer) => void;
  reject: (error: Error) => void;
}

export class SileroWorker extends EventEmitter {
  private process: ChildProcessWithoutNullStreams | null = null;
  private ready = false;
  private speakersByModel = new Map<ModelId, Set<string>>();
  private readonly pending = new Map<string, PendingRequest>();

  async start(): Promise<void> {
    if (this.process) {
      return;
    }

    const pythonCommand = process.platform === 'win32' ? 'python' : 'python3';
    const workerCandidates = [
      path.join(__dirname, 'python', 'worker.py'),
      path.join(__dirname, '..', 'python', 'worker.py'),
    ];
    const workerPath = workerCandidates.find((candidate) => existsSync(candidate));

    if (!workerPath) {
      throw new Error('Silero worker.py not found');
    }

    this.process = spawn(pythonCommand, [workerPath], {
      cwd: path.dirname(workerPath),
      stdio: ['pipe', 'pipe', 'pipe'],
      windowsHide: true,
      env: {
        ...process.env,
        PYTHONIOENCODING: 'utf-8',
        PYTHONUTF8: '1',
      },
    });

    const rl = createInterface({ input: this.process.stdout });

    rl.on('line', (line) => {
      try {
        const message = JSON.parse(line) as WorkerResponse;

        if (message.event === 'ready') {
          this.ready = true;
          this.speakersByModel.clear();

          Object.entries(message.models ?? {}).forEach(([modelId, speakers]) => {
            this.speakersByModel.set(modelId as ModelId, new Set(speakers));
          });

          this.emit('ready', message.models);
          return;
        }

        if (message.event === 'model_loaded' && message.model && message.speakers) {
          this.speakersByModel.set(message.model as ModelId, new Set(message.speakers));
          return;
        }

        if (!message.id) {
          return;
        }

        const pending = this.pending.get(message.id);
        if (!pending) {
          return;
        }

        this.pending.delete(message.id);

        if (!message.ok || !message.audio_base64) {
          pending.reject(new Error(message.error ?? 'Synthesis failed'));
          return;
        }

        pending.resolve(Buffer.from(message.audio_base64, 'base64'));
      } catch (error) {
        this.emit('error', error);
      }
    });

    this.process.stderr.on('data', (chunk) => {
      console.error('[silero-worker]', chunk.toString());
    });

    this.process.on('exit', (code) => {
      this.ready = false;
      this.process = null;
      this.pending.forEach((pending) => {
        pending.reject(new Error(`Silero worker exited with code ${code ?? 'unknown'}`));
      });
      this.pending.clear();
    });

    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Silero worker startup timeout')), 120000);

      this.once('ready', () => {
        clearTimeout(timeout);
        resolve();
      });

      this.once('error', (error) => {
        clearTimeout(timeout);
        reject(error);
      });
    });
  }

  async synthesize(
    text: string,
    speaker: string,
    sampleRate: number,
    model: ModelId,
  ): Promise<Buffer> {
    if (!this.process || !this.ready) {
      throw new Error('Silero worker is not ready');
    }

    const id = randomUUID();

    return new Promise<Buffer>((resolve, reject) => {
      this.pending.set(id, { resolve, reject });

      const payload = JSON.stringify({
        id,
        command: 'synthesize',
        text,
        speaker,
        model,
        sample_rate: sampleRate,
      });

      this.process?.stdin.write(`${payload}\n`, 'utf8');
    });
  }

  getSpeakers(modelId?: ModelId): ReadonlySet<string> {
    if (modelId) {
      return this.speakersByModel.get(modelId) ?? new Set();
    }

    const allSpeakers = new Set<string>();
    this.speakersByModel.forEach((speakers) => {
      speakers.forEach((speaker) => allSpeakers.add(speaker));
    });

    return allSpeakers;
  }

  getLoadedModels(): ReadonlyMap<ModelId, ReadonlySet<string>> {
    return this.speakersByModel;
  }

  stop(): void {
    if (!this.process) {
      return;
    }

    this.process.kill();
    this.process = null;
    this.ready = false;
  }
}
