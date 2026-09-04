const fs = require('node:fs');
const path = require('node:path');

function resourcesDir(context) {
  if (context.electronPlatformName === 'darwin') {
    return path.join(
      context.appOutDir,
      `${context.packager.appInfo.productFilename}.app`,
      'Contents',
      'Resources',
    );
  }

  return path.join(context.appOutDir, 'resources');
}

function copyRequired(from, to, requiredFile) {
  const requiredPath = path.join(from, requiredFile);
  if (!fs.existsSync(requiredPath)) {
    throw new Error(`Не найден ${requiredPath}. Сначала выполните npm run build`);
  }

  fs.cpSync(from, to, { recursive: true, force: true });
}

module.exports = {
  appId: 'com.siero-tts.app',
  productName: 'siero-tts',
  directories: {
    output: 'dist_electron',
  },
  extraMetadata: {
    name: 'siero-tts',
    main: 'apps/desktop/src/main.js',
  },
  files: ['apps/desktop/src/**/*', 'apps/desktop/assets/**/*', 'package.json'],
  extraResources: [
    {
      from: 'dist/bundled-runtime/python',
      to: 'python',
      filter: ['**/*', '!**/*.pyc', '!**/__pycache__', '!**/__pycache__/**'],
    },
  ],
  afterPack: async (context) => {
    const resources = resourcesDir(context);
    copyRequired(path.join(__dirname, 'dist/apps/api'), path.join(resources, 'bin', 'api'), 'main.js');
    copyRequired(path.join(__dirname, 'dist/apps/web'), path.join(resources, 'web'), 'index.html');

    const pythonExe =
      context.electronPlatformName === 'win32'
        ? path.join(resources, 'python', 'python.exe')
        : path.join(resources, 'python', 'bin', 'python3');

    if (!fs.existsSync(pythonExe)) {
      throw new Error(
        `Не найден встроенный Python: ${pythonExe}. Сначала: node apps/desktop/scripts/prepare-python-runtime.js`,
      );
    }
  },
  win: {
    target: [
      { target: 'nsis', arch: ['x64'] },
      { target: 'zip', arch: ['x64'] },
    ],
    icon: 'apps/desktop/assets/icon.ico',
  },
  mac: {
    icon: 'apps/desktop/assets/icon.ico',
  },
  linux: {
    icon: 'apps/desktop/assets/icon.ico',
  },
};
