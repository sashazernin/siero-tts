const { spawn, spawnSync } = require('node:child_process');
const fs = require('node:fs');
const http = require('node:http');
const https = require('node:https');
const path = require('node:path');

const PYTHON_TAG = '20260901';
const PYTHON_VERSION = '3.12.14';
const TORCH_VERSION = '2.6.0';
const TORCHAUDIO_VERSION = '2.6.0';

const MODELS = [
  {
    name: 'v5_cis_base_nostress.pt',
    url: 'https://models.silero.ai/models/tts/ru/v5_cis_base_nostress.pt',
  },
  {
    name: 'v5_ru.pt',
    url: 'https://models.silero.ai/models/tts/ru/v5_ru.pt',
  },
  {
    name: 'v3_en.pt',
    url: 'https://models.silero.ai/models/tts/en/v3_en.pt',
  },
];

const CRT_NAMES = [
  'vcruntime140.dll',
  'vcruntime140_1.dll',
  'msvcp140.dll',
  'msvcp140_1.dll',
  'msvcp140_2.dll',
  'concrt140.dll',
  'vccorlib140.dll',
];

const workspaceRoot = path.join(__dirname, '..', '..', '..');
const destParent = path.join(workspaceRoot, 'dist', 'bundled-runtime');
const pythonRoot = path.join(destParent, 'python');
const cacheDir = path.join(workspaceRoot, 'tmp', 'siero-runtime-cache');
const requirementsPath = path.join(workspaceRoot, 'apps', 'api', 'python', 'requirements.txt');
const stampPath = path.join(destParent, '.stamp');

function log(message) {
  console.error(`[bundle-python] ${message}`);
}

function stampValue() {
  return [
    `${PYTHON_VERSION}+${PYTHON_TAG}`,
    `torch==${TORCH_VERSION}`,
    `torchaudio==${TORCHAUDIO_VERSION}`,
    ...MODELS.map((model) => model.name),
    process.platform,
    process.arch,
  ].join('|');
}

function platformTriple() {
  const arch = process.arch;

  if (process.platform === 'win32') {
    return arch === 'arm64' ? 'aarch64-pc-windows-msvc' : 'x86_64-pc-windows-msvc';
  }

  if (process.platform === 'darwin') {
    return arch === 'arm64' ? 'aarch64-apple-darwin' : 'x86_64-apple-darwin';
  }

  return arch === 'arm64' ? 'aarch64-unknown-linux-gnu' : 'x86_64-unknown-linux-gnu';
}

function archiveName() {
  return `cpython-${PYTHON_VERSION}+${PYTHON_TAG}-${platformTriple()}-install_only_stripped.tar.gz`;
}

function archiveUrl() {
  return `https://github.com/astral-sh/python-build-standalone/releases/download/${PYTHON_TAG}/${encodeURIComponent(archiveName())}`;
}

function pythonBinary(root) {
  const candidates =
    process.platform === 'win32'
      ? [path.join(root, 'python.exe')]
      : [path.join(root, 'bin', 'python3'), path.join(root, 'bin', 'python')];

  return candidates.find((candidate) => fs.existsSync(candidate)) ?? null;
}

function modelDir(root) {
  return path.join(root, 'Lib', 'site-packages', 'silero', 'model');
}

function modelsReady(root) {
  return MODELS.every((model) => fs.existsSync(path.join(modelDir(root), model.name)));
}

function pythonEnv(command) {
  const extra = [path.dirname(command), path.join(path.dirname(command), 'Scripts')];
  return {
    ...process.env,
    PYTHONUTF8: '1',
    PYTHONIOENCODING: 'utf-8',
    PIP_DISABLE_PIP_VERSION_CHECK: '1',
    PIP_PROGRESS_BAR: 'off',
    PATH: [...extra, process.env.PATH ?? ''].join(path.delimiter),
  };
}

function run(command, args, timeoutMs) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      windowsHide: true,
      stdio: ['ignore', 'pipe', 'pipe'],
      env: pythonEnv(command),
    });

    const timer = setTimeout(() => {
      child.kill();
      reject(new Error(`Команда зависла: ${command} ${args.join(' ')}`));
    }, timeoutMs);

    const onChunk = (chunk) => {
      const text = chunk.toString().trim();
      if (text) {
        log(text);
      }
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

function spawnOk(command, args) {
  const result = spawnSync(command, args, {
    windowsHide: true,
    encoding: 'utf8',
    env: pythonEnv(command),
    timeout: 120000,
  });
  return result.status === 0;
}

function packagesReady(command) {
  return spawnOk(command, [
    '-c',
    [
      'import numpy',
      'import torch',
      'from silero import silero_tts',
      'from silero_stress import load_accentor',
    ].join('; '),
  ]);
}

function followDownload(url, redirectCount = 0) {
  if (redirectCount > 8) {
    return Promise.reject(new Error(`Слишком много редиректов: ${url}`));
  }

  return new Promise((resolve, reject) => {
    const client = url.startsWith('http://') ? http : https;
    const request = client.get(url, { headers: { 'User-Agent': 'siero-tts' } }, (response) => {
      const location = response.headers.location;
      const status = response.statusCode ?? 0;

      if (status >= 300 && status < 400 && location) {
        response.resume();
        followDownload(new URL(location, url).toString(), redirectCount + 1).then(resolve, reject);
        return;
      }

      if (status !== 200) {
        response.resume();
        reject(new Error(`Не удалось скачать ${url}: HTTP ${status}`));
        return;
      }

      resolve(response);
    });

    request.on('error', reject);
  });
}

async function downloadFile(url, dest, label) {
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  const response = await followDownload(url);
  const total = Number(response.headers['content-length'] ?? 0);
  let received = 0;
  let lastPercent = -1;

  await new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    response.on('data', (chunk) => {
      received += chunk.length;
      if (total > 0) {
        const percent = Math.floor((received / total) * 100);
        if (percent !== lastPercent && percent % 10 === 0) {
          lastPercent = percent;
          log(`${label} ${percent}%`);
        }
      }
    });
    response.pipe(file);
    file.on('finish', () => file.close((error) => (error ? reject(error) : resolve())));
    file.on('error', reject);
    response.on('error', reject);
  });
}

function copyCrt(command) {
  if (process.platform !== 'win32') {
    return;
  }

  const torchLib = path.join(path.dirname(command), 'Lib', 'site-packages', 'torch', 'lib');
  if (!fs.existsSync(torchLib)) {
    return;
  }

  const sources = [
    process.env.SystemRoot ? path.join(process.env.SystemRoot, 'System32') : '',
    process.env.SystemRoot ? path.join(process.env.SystemRoot, 'SysWOW64') : '',
  ].filter(Boolean);

  for (const name of CRT_NAMES) {
    const dest = path.join(torchLib, name);
    if (fs.existsSync(dest)) {
      continue;
    }

    for (const sourceDir of sources) {
      const src = path.join(sourceDir, name);
      if (fs.existsSync(src)) {
        fs.copyFileSync(src, dest);
        log(`Copied ${name} -> torch/lib`);
        break;
      }
    }
  }
}

function folderSizeMb(dir) {
  let total = 0;
  const stack = [dir];

  while (stack.length > 0) {
    const current = stack.pop();
    let entries = [];
    try {
      entries = fs.readdirSync(current, { withFileTypes: true });
    } catch {
      continue;
    }

    for (const entry of entries) {
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) {
        stack.push(full);
        continue;
      }

      try {
        total += fs.statSync(full).size;
      } catch {
        // ignore locked files
      }
    }
  }

  return Math.round(total / (1024 * 1024));
}

function runtimeReady() {
  const binary = pythonBinary(pythonRoot);
  if (!binary || !fs.existsSync(stampPath)) {
    return false;
  }

  if (fs.readFileSync(stampPath, 'utf8') !== stampValue()) {
    return false;
  }

  return modelsReady(pythonRoot) && packagesReady(binary);
}

async function extractArchive(archivePath) {
  fs.mkdirSync(destParent, { recursive: true });
  const result = spawnSync('tar', ['-xf', archivePath, '-C', destParent], {
    windowsHide: true,
    encoding: 'utf8',
  });

  if (result.status !== 0) {
    throw new Error(result.stderr?.toString().trim() || 'Не удалось распаковать Python (нужен tar)');
  }
}

async function main() {
  if (!fs.existsSync(requirementsPath)) {
    throw new Error(`Не найден ${requirementsPath}`);
  }

  fs.mkdirSync(cacheDir, { recursive: true });

  if (runtimeReady()) {
    log(`Уже собрано (${folderSizeMb(pythonRoot)} МБ): ${pythonRoot}`);
    return;
  }

  const archivePath = path.join(cacheDir, archiveName());
  if (!fs.existsSync(archivePath)) {
    log(`Скачивание Python ${PYTHON_VERSION}...`);
    await downloadFile(archiveUrl(), archivePath, 'Python');
  }

  fs.rmSync(pythonRoot, { recursive: true, force: true });
  log('Распаковка Python...');
  await extractArchive(archivePath);

  const binary = pythonBinary(pythonRoot);
  if (!binary) {
    throw new Error('Python распаковался, но python.exe не найден');
  }

  log('Подготовка pip...');
  try {
    await run(binary, ['-m', 'ensurepip', '--upgrade'], 5 * 60 * 1000);
  } catch (error) {
    log(`ensurepip: ${error instanceof Error ? error.message : String(error)}`);
  }

  await run(binary, ['-m', 'pip', 'install', '--upgrade', 'pip'], 5 * 60 * 1000);

  log('Установка PyTorch (CPU)...');
  await run(
    binary,
    [
      '-m',
      'pip',
      'install',
      '--prefer-binary',
      `torch==${TORCH_VERSION}`,
      `torchaudio==${TORCHAUDIO_VERSION}`,
      '--index-url',
      'https://download.pytorch.org/whl/cpu',
    ],
    30 * 60 * 1000,
  );

  log('Установка Silero...');
  await run(binary, ['-m', 'pip', 'install', '--prefer-binary', '-r', requirementsPath], 20 * 60 * 1000);

  const modelsPath = modelDir(pythonRoot);
  fs.mkdirSync(modelsPath, { recursive: true });

  for (const model of MODELS) {
    const dest = path.join(modelsPath, model.name);
    if (fs.existsSync(dest) && fs.statSync(dest).size > 1024 * 1024) {
      log(`Модель уже есть: ${model.name}`);
      continue;
    }

    log(`Скачивание модели ${model.name}...`);
    await downloadFile(model.url, dest, model.name);
  }

  copyCrt(binary);

  if (!packagesReady(binary)) {
    throw new Error('Встроенный Python не импортирует torch/silero');
  }

  if (!modelsReady(pythonRoot)) {
    throw new Error('Модели Silero не лежат в site-packages/silero/model');
  }

  fs.writeFileSync(stampPath, stampValue());
  log(`Готово: ${pythonRoot} (${folderSizeMb(pythonRoot)} МБ)`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack || error.message : error);
  process.exit(1);
});
