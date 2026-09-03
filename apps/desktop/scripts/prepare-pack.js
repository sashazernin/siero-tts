const { execSync } = require('node:child_process');

try {
  execSync('taskkill /F /IM siero-tts.exe', { stdio: 'ignore' });
} catch {
  // process may not be running
}
