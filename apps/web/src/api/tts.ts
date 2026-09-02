import { getApiBaseUrl } from '../config/api';
import type { TtsRequest, Voice } from '@siero-tts/shared';

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchWithRetry(
  url: string,
  options?: RequestInit,
  maxAttempts = 30,
  delayMs = 1000,
): Promise<Response> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      return await fetch(url, options);
    } catch (error) {
      lastError = error;
      if (attempt === maxAttempts) {
        break;
      }

      await sleep(delayMs);
    }
  }

  throw lastError instanceof Error ? lastError : new Error('Request failed');
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let message = `Request failed with status ${response.status}`;

    try {
      const data = await response.json();
      if (typeof data.detail === 'string') {
        message = data.detail;
      }
    } catch {
      // ignore JSON parse errors
    }

    throw new Error(message);
  }

  return response.json() as Promise<T>;
}

export async function fetchVoices(): Promise<Voice[]> {
  const response = await fetchWithRetry(`${getApiBaseUrl()}/api/voices`);
  return handleResponse<Voice[]>(response);
}

export async function synthesizeSpeech(request: TtsRequest): Promise<Blob> {
  const response = await fetch(`${getApiBaseUrl()}/api/tts`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      text: request.text,
      speaker: request.speaker,
      sample_rate: request.sample_rate ?? 48000,
    }),
  });

  if (!response.ok) {
    let message = `Request failed with status ${response.status}`;

    try {
      const data = await response.json();
      if (typeof data.detail === 'string') {
        message = data.detail;
      }
    } catch {
      // ignore JSON parse errors
    }

    throw new Error(message);
  }

  return response.blob();
}

export async function checkHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${getApiBaseUrl()}/api/health`);
    if (!response.ok) {
      return false;
    }

    const data = await response.json();
    return data.ready === true;
  } catch {
    return false;
  }
}
