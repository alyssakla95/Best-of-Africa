import { readFile } from 'node:fs/promises';

const baseUrl = (process.argv[2] || 'https://alyssa-boa-web.pages.dev').replace(/\/$/, '');
const port = process.argv[3] || '9224';
const viewportName = process.argv[4] || 'mobile';
const strict = process.argv.includes('--strict');
const viewport = viewportName === 'desktop'
  ? { width: 1440, height: 1000, mobile: false }
  : { width: 390, height: 844, mobile: true };
const routes = JSON.parse(await readFile(new URL('./public-route-inventory.json', import.meta.url), 'utf8'));

const tabs = await fetch(`http://127.0.0.1:${port}/json`).then(response => response.json());
const tab = tabs.find(item => item.type === 'page');
if (!tab?.webSocketDebuggerUrl) throw new Error(`No debuggable browser page on port ${port}`);

const socket = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((resolve, reject) => {
  socket.addEventListener('open', resolve, { once: true });
  socket.addEventListener('error', reject, { once: true });
});

let sequence = 0;
let browserErrors = [];
let responseErrors = [];
const pending = new Map();
socket.addEventListener('message', event => {
  const payload = JSON.parse(event.data);
  if (payload.method === 'Runtime.exceptionThrown') {
    browserErrors.push(payload.params?.exceptionDetails?.text || 'Uncaught browser exception');
  }
  if (payload.method === 'Network.responseReceived' && payload.params?.response?.status >= 400) {
    const response = payload.params.response;
    responseErrors.push({ status: response.status, url: response.url });
  }
  if (!payload.id || !pending.has(payload.id)) return;
  const task = pending.get(payload.id);
  pending.delete(payload.id);
  if (payload.error) task.reject(new Error(payload.error.message));
  else task.resolve(payload.result);
});
const command = (method, params = {}) => new Promise((resolve, reject) => {
  const id = ++sequence;
  pending.set(id, { resolve, reject });
  socket.send(JSON.stringify({ id, method, params }));
});
const delay = milliseconds => new Promise(resolve => setTimeout(resolve, milliseconds));

await command('Page.enable');
await command('Runtime.enable');
await command('Log.enable');
await command('Network.enable');
await command('Network.setCacheDisabled', { cacheDisabled: true });
await command('Emulation.setDeviceMetricsOverride', {
  width: viewport.width, height: viewport.height, deviceScaleFactor: 1,
  mobile: viewport.mobile, screenWidth: viewport.width, screenHeight: viewport.height,
});

const results = [];
for (const route of routes) {
  browserErrors = [];
  responseErrors = [];
  await command('Page.navigate', { url: `${baseUrl}${route}` });
  for (let attempt = 0; attempt < 40; attempt += 1) {
    await delay(250);
    const ready = await command('Runtime.evaluate', { expression: "document.readyState === 'complete' && document.body?.innerText.length > 120 && document.querySelectorAll('h1').length === 1", returnByValue: true });
    if (ready.result?.value) break;
  }
  await delay(350);
  const evaluated = await command('Runtime.evaluate', {
    returnByValue: true,
    expression: `(() => {
      const text = document.body?.innerText || '';
      const viewportWidth = document.documentElement.clientWidth;
      const visible = node => { const style=getComputedStyle(node); const rect=node.getBoundingClientRect(); return style.display!=='none' && style.visibility!=='hidden' && rect.width>0 && rect.height>0; };
      const label = node => (node.getAttribute('aria-label') || node.getAttribute('title') || node.textContent || node.querySelector('img')?.alt || '').trim();
      const brokenImages = [...document.images].filter(image => visible(image) && image.complete && image.currentSrc && image.naturalWidth === 0).map(image => image.currentSrc).slice(0,5);
      const unlabeledControls = [...document.querySelectorAll('button,a[href]')].filter(node => visible(node) && !label(node)).map(node => node.outerHTML.slice(0,160)).slice(0,8);
      const unlabeledInputs = [...document.querySelectorAll('input,select,textarea')].filter(node => visible(node) && node.getAttribute('aria-hidden') !== 'true' && !node.closest('label') && !node.getAttribute('aria-label') && !node.getAttribute('aria-labelledby') && !(node.id && document.querySelector('label[for="'+CSS.escape(node.id)+'"]'))).map(node => node.outerHTML.slice(0,160)).slice(0,8);
      const ids = [...document.querySelectorAll('[id]')].map(node => node.id).filter(Boolean);
      const duplicateIds = [...new Set(ids.filter((id,index) => ids.indexOf(id)!==index))].slice(0,8);
      const tableFailures = [...document.querySelectorAll('table')].filter(table => {
        if (table.scrollWidth <= viewportWidth + 2) return false;
        let parent=table.parentElement;
        while(parent && parent!==document.body){ const overflow=getComputedStyle(parent).overflowX; if(/auto|scroll/.test(overflow)) return false; parent=parent.parentElement; }
        return true;
      }).length;
      return {
        title: document.title,
        h1: document.querySelectorAll('h1').length,
        main: document.querySelectorAll('main').length,
        bodyLength: text.length,
        horizontalOverflow: document.documentElement.scrollWidth > viewportWidth + 2,
        brokenImages, unlabeledControls, unlabeledInputs, duplicateIds, tableFailures,
        visibleSkeletons: [...document.querySelectorAll('.animate-pulse')].filter(visible).length,
        malformedText: /(?:Ã[\\u0080-\\u00bf]|â€|Â·|\\uFFFD|\\[object Object\\])/.test(text),
        nullText: /(^|\\n)\\s*(?:null|undefined)\\s*(?=\\n|$)/i.test(text),
        markdownLeak: /(^|\\n)\\s{0,3}#{1,6}\\s+\\S|\\|\\s*:?-{3,}:?\\s*\\||\\*\\*[^*]+\\*\\*/m.test(text),
        notFound: /page not found|página não encontrada/i.test(text),
      };
    })()`,
  });
  const state = evaluated.result?.value || {};
  const failures = [];
  if (state.h1 !== 1) failures.push(`expected one h1, found ${state.h1}`);
  if (state.main < 1) failures.push('missing main landmark');
  if (state.bodyLength < 120) failures.push(`insufficient visible content (${state.bodyLength || 0})`);
  if (state.horizontalOverflow) failures.push('document-level horizontal overflow');
  if (state.brokenImages?.length) failures.push(`${state.brokenImages.length} broken images`);
  if (state.unlabeledControls?.length) failures.push(`${state.unlabeledControls.length} unlabeled controls`);
  if (state.unlabeledInputs?.length) failures.push(`${state.unlabeledInputs.length} unlabeled form fields`);
  if (state.duplicateIds?.length) failures.push(`duplicate ids: ${state.duplicateIds.join(', ')}`);
  if (state.tableFailures) failures.push(`${state.tableFailures} desktop-only tables`);
  if (state.malformedText) failures.push('malformed reader text');
  if (state.nullText) failures.push('visible null/undefined value');
  if (state.markdownLeak) failures.push('visible markdown formatting');
  if (state.notFound) failures.push('unexpected not-found state');
  const consequentialResponses = responseErrors.filter(({ status, url }) =>
    !(status === 429 && /\/analytics\/events(?:\?|$)/.test(url)) &&
    !(status === 404 && /\/articles\/[0-9a-f-]+\/image(?:\?|$)/i.test(url))
  );
  if (browserErrors.length) failures.push(`${browserErrors.length} browser exceptions`);
  if (consequentialResponses.length) failures.push(`${consequentialResponses.length} failed network responses`);
  results.push({ route, ...state, browserErrors: [...new Set(browserErrors)].slice(0, 5), responseErrors: consequentialResponses.slice(0, 8), failures });
  process.stdout.write(`${failures.length ? 'FAIL' : 'PASS'} ${viewportName} ${route}${failures.length ? ` — ${failures.join('; ')}` : ''}\n`);
}

socket.close();
const failed = results.filter(result => result.failures.length);
process.stdout.write(`${JSON.stringify({ viewport: viewportName, routes: results.length, passed: results.length - failed.length, failed: failed.length, failures: failed }, null, 2)}\n`);
if (strict && failed.length) process.exitCode = 1;
