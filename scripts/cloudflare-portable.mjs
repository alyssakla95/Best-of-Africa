import { randomBytes } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const generatedDir = join(root, '.cloudflare');
const configPath = join(generatedDir, 'wrangler.generated.toml');
const statePath = join(generatedDir, 'deployment.json');
const secretsPath = join(generatedDir, 'secrets.env');
const frontendEnvPath = join(root, 'frontend', '.env.production.local');
const templatePath = join(root, 'wrangler.portable.toml.example');
const wranglerCli = join(root, 'node_modules', 'wrangler', 'bin', 'wrangler.js');
const npmCli = process.env.npm_execpath || join(dirname(process.execPath), 'node_modules', 'npm', 'bin', 'npm-cli.js');

const argv = process.argv.slice(2);
const command = argv[0] && !argv[0].startsWith('--') ? argv.shift() : 'help';
const options = {};
for (let index = 0; index < argv.length; index += 1) {
  const token = argv[index];
  if (!token.startsWith('--')) throw new Error(`Unexpected argument: ${token}`);
  const key = token.slice(2);
  const next = argv[index + 1];
  if (!next || next.startsWith('--')) options[key] = true;
  else { options[key] = next; index += 1; }
}

const help = `
BOA-Story portable Cloudflare deployment

Plan without changing Cloudflare:
  npm run cloudflare:plan -- --prefix <unique-kebab-prefix>

Provision resources in the currently selected Cloudflare account:
  npm run cloudflare:setup -- --prefix <unique-kebab-prefix>

Provision and deploy the Worker, database and Pages frontend:
  npm run cloudflare:setup -- --prefix <unique-kebab-prefix> --deploy

Options:
  --account-id <id>     Select an account when the login has several accounts.
  --site-url <origin>   Public site origin; defaults to the Pages project URL.
  --api-url <origin>    Custom Worker origin; otherwise the workers.dev URL is detected.
  --pages-project <id>  Pages project name; defaults to <prefix>-web.
  --worker-name <id>    Worker name; defaults to <prefix>-api.
  --no-pages            Provision or deploy only the backend.
  --require-r2          Stop setup if R2 has not been enabled in the account.

Generated resource IDs and secrets stay under ignored .cloudflare/ files.
The script never deletes or replaces Cloudflare resources.
`;

const fail = message => { throw new Error(message); };
const normalizeOrigin = value => {
  if (!value) return '';
  let parsed;
  try { parsed = new URL(String(value)); }
  catch { fail(`Invalid public origin: ${value}`); }
  if (!['https:', 'http:'].includes(parsed.protocol) || parsed.username || parsed.password || parsed.search || parsed.hash || (parsed.pathname && parsed.pathname !== '/')) {
    fail(`Use an origin without credentials, path, query or fragment: ${value}`);
  }
  return parsed.origin;
};
const validatePrefix = value => {
  if (typeof value !== 'string' || !/^[a-z][a-z0-9-]{2,38}[a-z0-9]$/.test(value)) {
    fail('Use --prefix with 4-40 lowercase letters, numbers or hyphens; it must start with a letter and end with a letter or number.');
  }
  return value;
};
const validateResourceName = (value, optionName) => {
  if (typeof value !== 'string' || !/^[a-z][a-z0-9-]{2,62}[a-z0-9]$/.test(value)) fail(`Invalid ${optionName}: ${value}`);
  return value;
};
const childEnv = {
  ...process.env,
  ...(options['account-id'] ? { CLOUDFLARE_ACCOUNT_ID: options['account-id'] } : {}),
};
const run = (program, args, { cwd = root, input, quiet = false } = {}) => {
  if (!quiet) console.log(`\n> ${program} ${args.join(' ')}`);
  const result = spawnSync(program, args, { cwd, env: childEnv, encoding: 'utf8', input });
  if (!quiet && result.stdout) process.stdout.write(result.stdout);
  if (!quiet && result.stderr) process.stderr.write(result.stderr);
  if (result.error) fail(result.error.message);
  if (result.status !== 0) fail(`Command failed (${result.status}): ${program} ${args.join(' ')}`);
  return `${result.stdout || ''}\n${result.stderr || ''}`;
};
const wrangler = (args, settings) => run(process.execPath, [wranglerCli, ...args], settings);

const namesFor = prefix => ({
  prefix,
  workerName: validateResourceName(options['worker-name'] || `${prefix}-api`, '--worker-name'),
  pagesProject: validateResourceName(options['pages-project'] || `${prefix}-web`, '--pages-project'),
  database: `${prefix}-db`,
  cache: `${prefix}-cache`,
  rateLimit: `${prefix}-rate-limit`,
  media: `${prefix}-media`,
  mediaKv: `${prefix}-media-store`,
  vectors: `${prefix}-content`,
  contentQueue: `${prefix}-content-generation`,
  translationQueue: `${prefix}-article-translations`,
  optimizationQueue: `${prefix}-headline-optimization`,
  analytics: `${prefix}-events`,
});

const renderTemplate = (names, siteUrl, apiUrl = '') => readFileSync(templatePath, 'utf8')
  .replaceAll('__WORKER_NAME__', names.workerName)
  .replaceAll('__CONTENT_QUEUE__', names.contentQueue)
  .replaceAll('__TRANSLATION_QUEUE__', names.translationQueue)
  .replaceAll('__OPTIMIZATION_QUEUE__', names.optimizationQueue)
  .replaceAll('__ANALYTICS_DATASET__', names.analytics)
  .replaceAll('__PUBLIC_SITE_URL__', siteUrl)
  .replaceAll('__PUBLIC_API_URL__', apiUrl);

const ensureSecrets = () => {
  if (existsSync(secretsPath)) return;
  writeFileSync(secretsPath, [
    `JWT_SECRET=${randomBytes(32).toString('hex')}`,
    `ADMIN_API_KEY=${randomBytes(32).toString('hex')}`,
    `DEV_SECRET=${randomBytes(32).toString('hex')}`,
    '',
  ].join('\n'), { encoding: 'utf8', mode: 0o600 });
  console.log(`Created local deployment secrets: ${secretsPath}`);
};

const writeState = state => writeFileSync(statePath, `${JSON.stringify(state, null, 2)}\n`, 'utf8');
const readState = () => existsSync(statePath) ? JSON.parse(readFileSync(statePath, 'utf8')) : null;

const plan = names => {
  const siteUrl = normalizeOrigin(options['site-url'] || `https://${names.pagesProject}.pages.dev`);
  console.log(JSON.stringify({
    account: options['account-id'] || 'Wrangler current/default account',
    worker: names.workerName,
    pages: options['no-pages'] ? 'disabled' : names.pagesProject,
    siteUrl,
    resources: {
      d1: names.database, kv: [names.cache, names.rateLimit],
      r2: `${names.media} (optional; ${names.mediaKv} KV namespace is provisioned as the media fallback when R2 is unavailable)`,
      vectorize: names.vectors, queues: [names.contentQueue, names.translationQueue, names.optimizationQueue],
      analytics: names.analytics, durableObject: 'LiveCounter', workersAi: true,
    },
    writes: ['.cloudflare/wrangler.generated.toml', '.cloudflare/deployment.json', '.cloudflare/secrets.env', 'frontend/.env.production.local'],
    destructiveActions: [],
  }, null, 2));
};

const authenticate = () => {
  const args = ['whoami', '--json'];
  if (options['account-id']) args.push('--account', options['account-id']);
  wrangler(args);
};

const bootstrap = names => {
  const existing = readState();
  if (existing) {
    if (existing.prefix !== names.prefix) fail(`This checkout is already configured for prefix "${existing.prefix}". Remove only the ignored .cloudflare directory to start a separate local configuration; existing remote resources will not be deleted.`);
    console.log(`Reusing account configuration for ${existing.prefix}. No resources were recreated.`);
    return existing;
  }

  authenticate();
  mkdirSync(generatedDir, { recursive: true });
  const siteUrl = normalizeOrigin(options['site-url'] || `https://${names.pagesProject}.pages.dev`);
  const apiUrl = normalizeOrigin(options['api-url'] || '');
  writeFileSync(configPath, renderTemplate(names, siteUrl, apiUrl), 'utf8');
  ensureSecrets();
  const baseConfig = ['--config', configPath];

  wrangler(['d1', 'create', names.database, ...baseConfig, '--binding', 'DB', '--use-remote', '--update-config']);
  wrangler(['kv', 'namespace', 'create', names.cache, ...baseConfig, '--binding', 'CACHE', '--use-remote', '--update-config']);
  wrangler(['kv', 'namespace', 'create', names.rateLimit, ...baseConfig, '--binding', 'RATE_LIMIT', '--use-remote', '--update-config']);
  let r2Provisioned = false;
  try {
    wrangler(['r2', 'bucket', 'create', names.media, ...baseConfig, '--binding', 'MEDIA', '--use-remote', '--update-config']);
    r2Provisioned = true;
  } catch (error) {
    if (options['require-r2']) throw error;
    wrangler(['kv', 'namespace', 'create', names.mediaKv, ...baseConfig, '--binding', 'MEDIA_KV', '--use-remote', '--update-config']);
    console.warn(`\nR2 was not provisioned. Media storage falls back to the ${names.mediaKv} KV namespace (MEDIA_KV binding). Enable R2 later and add the MEDIA binding to upgrade.`);
  }
  wrangler(['vectorize', 'create', names.vectors, '--preset', '@cf/baai/bge-base-en-v1.5', ...baseConfig, '--binding', 'VECTORS', '--use-remote', '--update-config']);
  wrangler(['queues', 'create', names.contentQueue]);
  wrangler(['queues', 'create', names.translationQueue]);
  wrangler(['queues', 'create', names.optimizationQueue]);
  if (!options['no-pages']) wrangler(['pages', 'project', 'create', names.pagesProject, '--production-branch', 'main']);

  const generatedConfig = readFileSync(configPath, 'utf8')
    .replace('migrations_dir = "migrations"', 'migrations_dir = "../migrations"');
  writeFileSync(configPath, generatedConfig, 'utf8');

  const state = { ...names, siteUrl, apiUrl, r2Provisioned, configPath, createdAt: new Date().toISOString() };
  writeState(state);
  console.log('\nCloudflare resources provisioned. No application code has been deployed.');
  return state;
};

const deploy = state => {
  authenticate();
  ensureSecrets();
  const configArgs = ['--config', configPath];
  wrangler(['d1', 'migrations', 'apply', 'DB', '--remote', ...configArgs]);
  let output = wrangler(['deploy', ...configArgs, '--secrets-file', secretsPath]);
  let workerUrl = normalizeOrigin(options['api-url'] || state.apiUrl || '');
  if (!workerUrl) workerUrl = output.match(/https:\/\/[^\s]+\.workers\.dev/)?.[0] || '';
  if (!workerUrl) fail('Worker deployed, but its public URL could not be detected. Re-run with --api-url https://your-worker.example.com.');

  const currentConfig = readFileSync(configPath, 'utf8');
  if (currentConfig.includes('PUBLIC_API_URL = ""')) {
    writeFileSync(configPath, currentConfig.replace('PUBLIC_API_URL = ""', `PUBLIC_API_URL = "${workerUrl}"`), 'utf8');
    output = wrangler(['deploy', ...configArgs, '--secrets-file', secretsPath]);
  }

  const apiBase = `${workerUrl}/api/v1`;
  writeFileSync(frontendEnvPath, `VITE_API_URL=${apiBase}\nVITE_SITE_URL=${state.siteUrl}\n`, 'utf8');
  if (!options['no-pages']) {
    wrangler(['pages', 'secret', 'put', 'BACKEND_ORIGIN', '--project-name', state.pagesProject], { input: `${workerUrl}\n` });
    if (!existsSync(npmCli)) fail('npm CLI could not be located. Run the deployment through npm or install npm with Node.js.');
    run(process.execPath, [npmCli, 'run', 'build'], { cwd: join(root, 'frontend') });
    wrangler(['pages', 'deploy', 'dist', '--project-name', state.pagesProject, '--branch', 'main'], { cwd: join(root, 'frontend') });
  }
  writeState({ ...state, apiUrl: workerUrl, apiBase, deployedAt: new Date().toISOString() });
  console.log(`\nWorker: ${workerUrl}`);
  if (!options['no-pages']) console.log(`Site: ${state.siteUrl}`);
  console.log('Deployment complete. Add optional provider keys with Wrangler secrets when those integrations are required.');
};

try {
  if (command === 'help' || options.help) { console.log(help); process.exit(0); }
  const prefix = validatePrefix(options.prefix);
  const names = namesFor(prefix);
  if (command === 'plan') { plan(names); process.exit(0); }
  if (command === 'setup') {
    const state = bootstrap(names);
    if (options.deploy) deploy(state);
    else console.log(`To deploy later: npm run cloudflare:deploy -- --prefix ${prefix}`);
    process.exit(0);
  }
  if (command === 'deploy') {
    const state = readState();
    if (!state) fail('Run the setup command first so account-specific bindings can be generated safely.');
    if (state.prefix !== prefix) fail(`Configured prefix is "${state.prefix}", not "${prefix}".`);
    deploy(state);
    process.exit(0);
  }
  fail(`Unknown command: ${command}`);
} catch (error) {
  console.error(`\nCloudflare portability error: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
}
