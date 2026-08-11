import { spawnSync } from 'node:child_process';

const result = spawnSync('git', ['status', '--porcelain=v1', '--untracked-files=all'], {
  cwd: process.cwd(),
  encoding: 'utf8',
  shell: false,
  maxBuffer: 16 * 1024 * 1024,
});

if (result.error || result.status !== 0) {
  console.error(result.error?.message || result.stderr || 'Unable to inspect the Git working tree.');
  process.exit(1);
}

const changes = result.stdout.split(/\r?\n/).filter(Boolean);
if (changes.length && !process.argv.includes('--allow-dirty')) {
  console.error(`Release blocked: ${changes.length} uncommitted working-tree entr${changes.length === 1 ? 'y' : 'ies'} detected.`);
  console.error('Commit the intended release and remove or ignore local artifacts before deployment.');
  console.error(changes.slice(0, 20).join('\n'));
  if (changes.length > 20) console.error(`...and ${changes.length - 20} more.`);
  process.exit(1);
}

if (changes.length) {
  console.warn(`Release override accepted with ${changes.length} uncommitted working-tree entries.`);
} else {
  console.log('Release source is clean and reproducible.');
}
