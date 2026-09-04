const { execSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

try {
  execSync('taskkill /F /IM siero-tts.exe', { stdio: 'ignore' });
} catch {
  // process may not be running
}

const apiDir = path.join('dist', 'apps', 'api');
const apiCjs = path.join(apiDir, 'main.cjs');
const apiMain = path.join(apiDir, 'main.js');
const webIndex = path.join('dist', 'apps', 'web', 'index.html');

if (fs.existsSync(apiCjs) && !fs.existsSync(apiMain)) {
  fs.copyFileSync(apiCjs, apiMain);
}

if (!fs.existsSync(apiMain)) {
  throw new Error(`Не найден ${apiMain}. Сначала выполните npm run build`);
}

if (!fs.existsSync(webIndex)) {
  throw new Error(`Не найден ${webIndex}. Сначала выполните npm run build`);
}

require('node:child_process').execFileSync(process.execPath, [path.join(__dirname, 'prepare-python-runtime.js')], {
  stdio: 'inherit',
});
