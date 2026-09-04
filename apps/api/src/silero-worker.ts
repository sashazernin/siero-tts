import { appendFileSync, existsSync } from 'node:fs';
import { EventEmitter } from 'node:events';
import { spawn, type ChildProcessWithoutNullStreams } from 'node:child_process';
import { createInterface } from 'node:readline';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import type { ModelId } from '@siero-tts/shared';
import { resolvePython, type PythonLaunch } from './ensure-python';

interface WorkerResponse {
  id?: string;
  ok?: boolean;
  ready?: boolean;
  audio_base64?: string;
  error?: string;
  event?: string;
  detail?: string;
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
  private status = 'Запуск...';
  private speakersByModel = new Map<ModelId, Set<string>>();
  private readonly pending = new Map<string, PendingRequest>();

  getStatus(): string {
    return this.status;
  }

  async start(): Promise<void> {
    if (this.process) {
      return;
    }

    const workerCandidates = [
      path.join(__dirname, 'python', 'worker.py'),
      path.join(__dirname, '..', 'python', 'worker.py'),
    ];
    const workerPath = workerCandidates.find((candidate) => existsSync(candidate));

    if (!workerPath) {
      throw new Error('Silero worker.py not found');
    }

    const requirementsPath = path.join(path.dirname(workerPath), 'requirements.txt');
    this.status = 'Поиск Python...';
    const python: PythonLaunch = await resolvePython(requirementsPath, (message) => {
      this.status = message;
    });

    this.status = 'Запуск...';
    const pythonDir = path.isAbsolute(python.command) ? path.dirname(python.command) : null;
    this.process = spawn(python.command, [...python.prefixArgs, workerPath], {
      cwd: path.dirname(workerPath),
      stdio: ['pipe', 'pipe', 'pipe'],
      windowsHide: true,
      env: {
        ...process.env,
        PATH: pythonDir ? `${pythonDir}${path.delimiter}${process.env.PATH ?? ''}` : process.env.PATH,
        PYTHONIOENCODING: 'utf-8',
        PYTHONUTF8: '1',
      },
    });

    const rl = createInterface({ input: this.process.stdout });

    rl.on('line', (line) => {
      const trimmed = line.trim();
      if (!trimmed) {
        return;
      }

      let message: WorkerResponse;
      try {
        message = JSON.parse(trimmed) as WorkerResponse;
      } catch {
        console.error('[silero-worker] non-json stdout:', trimmed);
        return;
      }

      if (message.event === 'status' && message.detail) {
        this.status = message.detail;
        return;
      }

      if (message.event === 'failed') {
        this.emit('startup-error', new Error(message.error ?? 'Silero worker failed'));
        return;
      }

      if (message.event === 'ready') {
        this.ready = true;
        this.status = 'Готово';
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
    });

    this.process.stderr.on('data', (chunk) => {
      const text = chunk.toString();
      console.error('[silero-worker]', text);
      const logFile = process.env.SIERO_LOG_FILE;
      if (logFile) {
        appendFileSync(logFile, `[silero-worker] ${text}`);
      }
    });

    this.process.on('exit', (code) => {
      const wasReady = this.ready;
      this.ready = false;
      this.process = null;
      this.pending.forEach((pending) => {
        pending.reject(new Error(`Silero worker exited with code ${code ?? 'unknown'}`));
      });
      this.pending.clear();

      if (!wasReady) {
        this.emit(
          'startup-error',
          new Error(`Процесс Silero завершился с кодом ${code ?? 'unknown'} до загрузки моделей`),
        );
      }
    });

    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(
        () =>
          reject(
            new Error(
              'Silero не загрузил модели за 15 минут. При первом запуске нужен интернет (models.silero.ai). Если модели уже качались — подождите или проверьте лог: зависшая загрузка не повторяется, пока файл .pt на диске есть.',
            ),
          ),
        15 * 60 * 1000,
      );

      this.once('ready', () => {
        clearTimeout(timeout);
        resolve();
      });

      this.once('startup-error', (error) => {
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

  isReady(): boolean {
    return this.ready;
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
