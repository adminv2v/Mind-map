import { copyFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const viteBin = process.platform === 'win32'
  ? resolve(rootDir, 'node_modules', '.bin', 'vite.cmd')
  : resolve(rootDir, 'node_modules', '.bin', 'vite');

copyFileSync(resolve(rootDir, 'index.source.html'), resolve(rootDir, 'index.html'));
execFileSync(viteBin, ['build'], {
  cwd: rootDir,
  stdio: 'inherit',
  shell: process.platform === 'win32',
});
