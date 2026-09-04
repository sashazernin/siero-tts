import { copyFileSync, createWriteStream, existsSync, mkdirSync, rmSync } from 'node:fs';
import { spawn, spawnSync } from 'node:child_process';
import https from 'node:https';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import type { IncomingMessage } from 'node:http';

export interface PythonLaunch {
  command: string;
  prefixArgs: string[];
}

export type StatusFn = (message: string) => void;

const PYTHON_TAG = '20260901';
const PYTHON_VERSION = '3.12.14';
const IMPORT_CHECK = [
  'import traceback',
  'try:',
  '    import numpy',
  '    import torch',
  '    from silero import silero_tts',
  '    from silero_stress import load_accentor',
  'except Exception:',
  '    traceback.print_exc()',
  '    raise SystemExit(1)',
].join('\n');

function log(message: string): void {
  console.error(`[python-runtime] ${message}`);
}

export function getDataDir(): string {
  if (process.env.SIERO_DATA_DIR) {
    return process.env.SIERO_DATA_DIR;
  }

  if (process.platform === 'win32' && process.env.APPDATA) {
    return path.join(process.env.APPDATA, 'siero-tts');
  }

  return path.join(os.homedir(), '.siero-tts');
}

function runtimeRoot(): string {
  return path.join(getDataDir(), 'runtime', 'python');
}

function pythonBinary(root: string): string | null {
  const candidates =
    process.platform === 'win32'
      ? [path.join(root, 'python.exe')]
      : [path.join(root, 'bin', 'python3'), path.join(root, 'bin', 'python')];

  return candidates.find((candidate) => existsSync(candidate)) ?? null;
}

function launchFromBinary(command: string, prefixArgs: string[] = []): PythonLaunch {
  return { command, prefixArgs };
}

function pythonEnv(launch: PythonLaunch): NodeJS.ProcessEnv {
  const extra: string[] = [];

  extra.push(path.dirname(process.execPath));

  if (path.isAbsolute(launch.command)) {
    const dir = path.dirname(launch.command);
    extra.push(
      dir,
      path.join(dir, 'Scripts'),
      path.join(dir, 'Lib', 'site-packages', 'torch', 'lib'),
    );
  }

  return {
    ...process.env,
    PYTHONUTF8: '1',
    PYTHONIOENCODING: 'utf-8',
    PATH: [...extra, process.env.PATH ?? ''].join(path.delimiter),
  };
}

function isPython310(launch: PythonLaunch): boolean {
  const result = spawnSync(
    launch.command,
    [...launch.prefixArgs, '-c', 'import sys; raise SystemExit(0 if sys.version_info >= (3, 10) else 1)'],
    { windowsHide: true, timeout: 8000, encoding: 'utf8', env: pythonEnv(launch) },
  );

  return result.status === 0;
}

function packagesError(launch: PythonLaunch): string | null {
  const result = spawnSync(launch.command, [...launch.prefixArgs, '-c', IMPORT_CHECK], {
    windowsHide: true,
    timeout: 120000,
    encoding: 'utf8',
    env: pythonEnv(launch),
  });

  if (result.status === 0) {
    return null;
  }

  const detail = [result.stderr, result.stdout, result.error?.message]
    .filter(Boolean)
    .join('\n')
    .trim();

  if (detail) {
    log(detail);
  }

  return detail || `import check exited ${result.status ?? result.signal ?? 'unknown'}`;
}

function hasPackages(launch: PythonLaunch): boolean {
  return packagesError(launch) === null;
}

function needsVcRedist(error: string): boolean {
  return /WinError 126|Visual C\+\+ Redistributable|c10\.dll/i.test(error);
}

function copyCrtToTorch(launch: PythonLaunch): void {
  if (process.platform !== 'win32' || !path.isAbsolute(launch.command)) {
    return;
  }

  const torchLib = path.join(path.dirname(launch.command), 'Lib', 'site-packages', 'torch', 'lib');
  if (!existsSync(torchLib)) {
    return;
  }

  const sources = [
    process.env.SystemRoot ? path.join(process.env.SystemRoot, 'System32') : '',
    path.dirname(process.execPath),
  ].filter(Boolean);

  const names = [
    'vcruntime140.dll',
    'vcruntime140_1.dll',
    'msvcp140.dll',
    'msvcp140_1.dll',
    'msvcp140_2.dll',
    'concrt140.dll',
    'vccorlib140.dll',
  ];

  for (const name of names) {
    const dest = path.join(torchLib, name);
    if (existsSync(dest)) {
      continue;
    }

    for (const sourceDir of sources) {
      const src = path.join(sourceDir, name);
      if (existsSync(src)) {
        copyFileSync(src, dest);
        log(`Copied ${name} -> torch/lib`);
        break;
      }
    }
  }
}

async function installVcRedist(onStatus: StatusFn): Promise<void> {
  const tmpDir = path.join(getDataDir(), 'tmp');
  mkdirSync(tmpDir, { recursive: true });
  const installer = path.join(tmpDir, 'vc_redist.x64.exe');

  onStatus('Скачивание Visual C++ Redistributable...');
  await downloadFile('https://aka.ms/vs/17/release/vc_redist.x64.exe', installer, onStatus);

  onStatus('Установка Visual C++ Redistributable...');
  await new Promise<void>((resolve, reject) => {
    const child = spawn(installer, ['/install', '/quiet', '/norestart'], {
      windowsHide: true,
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    const timer = setTimeout(() => {
      child.kill();
      reject(new Error('Установка VC++ Redistributable зависла'));
    }, 5 * 60 * 1000);

    child.stdout?.on('data', (chunk) => log(chunk.toString()));
    child.stderr?.on('data', (chunk) => log(chunk.toString()));

    child.on('error', (error) => {
      clearTimeout(timer);
      reject(error);
    });

    child.on('exit', (code) => {
      clearTimeout(timer);
      if (code === 0 || code === 1638 || code === 1641 || code === 3010) {
        resolve();
        return;
      }

      reject(
        new Error(
          `VC++ Redistributable завершился с кодом ${code ?? 'unknown'}. Установите https://aka.ms/vs/17/release/vc_redist.x64.exe`,
        ),
      );
    });
  });
}

function findSystemPython(): PythonLaunch | null {
  const attempts: PythonLaunch[] =
    process.platform === 'win32'
      ? [
          { command: 'python', prefixArgs: [] },
          { command: 'py', prefixArgs: ['-3'] },
          { command: 'python3', prefixArgs: [] },
        ]
      : [
          { command: 'python3', prefixArgs: [] },
          { command: 'python', prefixArgs: [] },
        ];

  for (const attempt of attempts) {
    if (isPython310(attempt)) {
      return attempt;
    }
  }

  return null;
}

function platformTriple(): string {
  const arch = process.arch;

  if (process.platform === 'win32') {
    if (arch === 'arm64') {
      return 'aarch64-pc-windows-msvc';
    }

    return 'x86_64-pc-windows-msvc';
  }

  if (process.platform === 'darwin') {
    return arch === 'arm64' ? 'aarch64-apple-darwin' : 'x86_64-apple-darwin';
  }

  if (arch === 'arm64') {
    return 'aarch64-unknown-linux-gnu';
  }

  return 'x86_64-unknown-linux-gnu';
}

function archiveUrl(): string {
  const name = `cpython-${PYTHON_VERSION}+${PYTHON_TAG}-${platformTriple()}-install_only_stripped.tar.gz`;
  return `https://github.com/astral-sh/python-build-standalone/releases/download/${PYTHON_TAG}/${encodeURIComponent(name)}`;
}

function followDownload(url: string, redirectCount = 0): Promise<IncomingMessage> {
  if (redirectCount > 8) {
    return Promise.reject(new Error('Слишком много редиректов при скачивании Python'));
  }

  return new Promise((resolve, reject) => {
    const client = url.startsWith('http://') ? http : https;
    const request = client.get(
      url,
      {
        headers: { 'User-Agent': 'siero-tts' },
      },
      (response) => {
        const location = response.headers.location;
        const status = response.statusCode ?? 0;

        if (status >= 300 && status < 400 && location) {
          response.resume();
          followDownload(new URL(location, url).toString(), redirectCount + 1).then(resolve, reject);
          return;
        }

        if (status !== 200) {
          response.resume();
          reject(new Error(`Не удалось скачать Python: HTTP ${status}`));
          return;
        }

        resolve(response);
      },
    );

    request.on('error', reject);
  });
}

async function downloadFile(url: string, dest: string, onStatus: StatusFn): Promise<void> {
  const response = await followDownload(url);
  const total = Number(response.headers['content-length'] ?? 0);
  let received = 0;
  let lastPercent = -1;

  await new Promise<void>((resolve, reject) => {
    const file = createWriteStream(dest);

    response.on('data', (chunk: Buffer) => {
      received += chunk.length;

      if (total > 0) {
        const percent = Math.floor((received / total) * 100);
        if (percent !== lastPercent && percent % 5 === 0) {
          lastPercent = percent;
          onStatus(`Скачивание Python... ${percent}%`);
        }
      }
    });

    response.pipe(file);
    file.on('finish', () => file.close((error) => (error ? reject(error) : resolve())));
    file.on('error', reject);
    response.on('error', reject);
  });
}

function updatePipStatus(text: string, onStatus: StatusFn): void {
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    const collecting = line.match(/^Collecting (\S+)/i);
    const downloading = line.match(/^Downloading (\S+)/i);

    if (collecting) {
      onStatus(`Установка пакета: ${collecting[1]}`);
    } else if (downloading) {
      onStatus(`Скачивание: ${downloading[1]}`);
    }
  }
}

function run(command: string, args: string[], onStatus: StatusFn, timeoutMs: number): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      windowsHide: true,
      stdio: ['ignore', 'pipe', 'pipe'],
      env: {
        ...pythonEnv({ command, prefixArgs: [] }),
        PIP_DISABLE_PIP_VERSION_CHECK: '1',
        PIP_PROGRESS_BAR: 'off',
      },
    });

    const timer = setTimeout(() => {
      child.kill();
      reject(new Error(`Команда зависла: ${command}`));
    }, timeoutMs);

    const onChunk = (chunk: Buffer) => {
      const text = chunk.toString();
      log(text);
      updatePipStatus(text, onStatus);
    };

    child.stdout?.on('data', onChunk);
    child.stderr?.on('data', onChunk);

    child.on('error', (error) => {
      clearTimeout(timer);
      reject(error);
    });

    child.on('exit', (code) => {
      clearTimeout(timer);
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(`${command} завершился с кодом ${code ?? 'unknown'}`));
    });
  });
}

async function extractArchive(archivePath: string, destParent: string): Promise<void> {
  mkdirSync(destParent, { recursive: true });

  const result = spawnSync('tar', ['-xf', archivePath, '-C', destParent], {
    windowsHide: true,
    encoding: 'utf8',
  });

  if (result.status !== 0) {
    throw new Error(result.stderr?.toString().trim() || 'Не удалось распаковать Python (нужен tar)');
  }
}

async function downloadManagedPython(onStatus: StatusFn): Promise<PythonLaunch> {
  const destParent = path.join(getDataDir(), 'runtime');
  const dest = runtimeRoot();
  const tmpDir = path.join(getDataDir(), 'tmp');
  const archivePath = path.join(tmpDir, 'python.tar.gz');

  mkdirSync(tmpDir, { recursive: true });
  rmSync(dest, { recursive: true, force: true });

  onStatus('Скачивание Python...');
  log(`Downloading ${archiveUrl()}`);
  await downloadFile(archiveUrl(), archivePath, onStatus);

  onStatus('Распаковка Python...');
  await extractArchive(archivePath, destParent);
  rmSync(archivePath, { force: true });

  const binary = pythonBinary(dest);
  if (!binary) {
    throw new Error('Python скачался, но python.exe не найден');
  }

  const launch = launchFromBinary(binary);
  if (!isPython310(launch)) {
    throw new Error('Скачанный Python не запускается');
  }

  return launch;
}

async function ensurePackages(
  launch: PythonLaunch,
  requirementsPath: string,
  onStatus: StatusFn,
): Promise<void> {
  copyCrtToTorch(launch);
  let existingError = packagesError(launch);
  if (!existingError) {
    return;
  }

  if (process.platform === 'win32' && needsVcRedist(existingError)) {
    onStatus('Нужен Visual C++ Redistributable...');
    try {
      await installVcRedist(onStatus);
      copyCrtToTorch(launch);
      existingError = packagesError(launch);
      if (!existingError) {
        return;
      }
    } catch (error) {
      log(`VC++ Redistributable: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  onStatus('Подготовка pip...');
  try {
    await run(launch.command, [...launch.prefixArgs, '-m', 'ensurepip', '--upgrade'], onStatus, 5 * 60 * 1000);
  } catch (error) {
    log(`ensurepip: ${error instanceof Error ? error.message : String(error)}`);
  }

  onStatus('Установка pip...');
  await run(
    launch.command,
    [...launch.prefixArgs, '-m', 'pip', 'install', '--upgrade', 'pip'],
    onStatus,
    5 * 60 * 1000,
  );

  onStatus('Установка PyTorch (CPU)...');
  await run(
    launch.command,
    [
      ...launch.prefixArgs,
      '-m',
      'pip',
      'install',
      '--prefer-binary',
      'torch==2.6.0',
      'torchaudio==2.6.0',
      '--index-url',
      'https://download.pytorch.org/whl/cpu',
    ],
    onStatus,
    30 * 60 * 1000,
  );

  onStatus('Установка Silero...');
  await run(
    launch.command,
    [...launch.prefixArgs, '-m', 'pip', 'install', '--prefer-binary', '-r', requirementsPath],
    onStatus,
    20 * 60 * 1000,
  );

  copyCrtToTorch(launch);
  let importError = packagesError(launch);
  if (importError && process.platform === 'win32' && needsVcRedist(importError)) {
    try {
      await installVcRedist(onStatus);
      copyCrtToTorch(launch);
      importError = packagesError(launch);
    } catch (error) {
      log(`VC++ Redistributable: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  if (importError) {
    throw new Error(`Пакеты Python не импортируются:\n${importError}`);
  }
}

export async function resolvePython(requirementsPath: string, onStatus: StatusFn): Promise<PythonLaunch> {
  if (!existsSync(requirementsPath)) {
    throw new Error(`Не найден ${requirementsPath}`);
  }
  const envPython = process.env.SIERO_PYTHON;
  if (envPython && existsSync(envPython)) {
    const launch = launchFromBinary(envPython);
    if (!isPython310(launch)) {
      throw new Error(`SIERO_PYTHON не запускается: ${envPython}`);
    }

    onStatus('Проверка встроенного Python...');
    await ensurePackages(launch, requirementsPath, onStatus);
    return launch;
  }

  const managedBinary = pythonBinary(runtimeRoot());
  if (managedBinary) {
    const launch = launchFromBinary(managedBinary);
    if (isPython310(launch)) {
      onStatus('Проверка Python-пакетов...');
      await ensurePackages(launch, requirementsPath, onStatus);
      return launch;
    }
  }

  const systemPython = findSystemPython();
  if (systemPython && hasPackages(systemPython)) {
    onStatus('Используется системный Python');
    return systemPython;
  }

  const managed = await downloadManagedPython(onStatus);
  await ensurePackages(managed, requirementsPath, onStatus);
  return managed;
}
