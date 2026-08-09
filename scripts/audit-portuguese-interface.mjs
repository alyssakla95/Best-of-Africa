import { readFileSync, readdirSync } from 'node:fs';
import { join, relative } from 'node:path';
import ts from 'typescript';

const root = process.cwd();
const scanAllLiterals = !process.argv.includes('--jsx-only');
const sourceRoot = join(root, 'frontend', 'src');
const catalogue = new Set();
const maintained = new Set();

// Parse the TypeScript catalogue instead of importing it at runtime. This keeps
// the audit executable on the Node 20 CI runner without experimental TS flags.
const portuguesePath = join(sourceRoot, 'i18n', 'pt-PT-1945.ts');
const portugueseSource = ts.createSourceFile(portuguesePath, readFileSync(portuguesePath, 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
const unwrap = (expression) => {
  let current = expression;
  while (ts.isAsExpression(current) || ts.isSatisfiesExpression(current) || ts.isParenthesizedExpression(current)) current = current.expression;
  return current;
};
const collectCatalogue = (node) => {
  if (ts.isVariableDeclaration(node) && node.name.getText(portugueseSource) === 'PORTUGUESE_INTERFACE_PHRASES' && node.initializer) {
    const initializer = unwrap(node.initializer);
    if (ts.isObjectLiteralExpression(initializer)) {
      for (const property of initializer.properties) {
        if (!ts.isPropertyAssignment(property)) continue;
        if (ts.isStringLiteral(property.name) || ts.isNumericLiteral(property.name)) catalogue.add(property.name.text.trim());
        else if (ts.isIdentifier(property.name)) catalogue.add(property.name.text.trim());
      }
    }
  }
  ts.forEachChild(node, collectCatalogue);
};
collectCatalogue(portugueseSource);

const hasDynamicPortugueseTranslation = (value) => [
  /^Audit complete: \d+ records checked and \d+ refresh tasks created\.$/i,
  /^.+ as reported by the named official provider\.$/i,
  /^Section \d+$/i,
  /^Prepared .+$/i,
  /^Last updated .+\.?$/i,
  /^Official snapshot retrieved .+$/i,
  /^Latest evidence .+$/i,
  /^Return to .+ hub$/i,
  /^Capital:\s*.+$/i,
  /^\d+ source-linked (?:record|records)$/i,
  /^\d+ recent country(?:-sector)? records plus \d+ official provider records from \d+ distinct attributed sources\.$/i,
  /^.+ country evidence snapshot$/i,
  /^The ledger combines \d+ dated official-provider snapshots with \d+ (?:sector-specific records|recent country records)\. Reporting coverage is supporting context, not a substitute for official market data\.$/i,
  /^(?:Projection|Observation)\s+.+$/i,
  /^Middle reading from \d+ countries\s*(?:·|-)\s*.+$/i,
].some(pattern => pattern.test(value));

const dictPath = join(sourceRoot, 'i18n', 'dict.ts');
const dictSource = ts.createSourceFile(dictPath, readFileSync(dictPath, 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
const collectMaintainedEnglish = (node) => {
  if (ts.isPropertyAssignment(node) && node.name.getText(dictSource) === 'en' && ts.isObjectLiteralExpression(node.initializer)) {
    for (const property of node.initializer.properties) {
      if (ts.isPropertyAssignment(property) && (ts.isStringLiteral(property.initializer) || ts.isNoSubstitutionTemplateLiteral(property.initializer))) {
        maintained.add(property.initializer.text.trim());
      }
    }
  }
  ts.forEachChild(node, collectMaintainedEnglish);
};
collectMaintainedEnglish(dictSource);

const files = [];
const walk = (directory) => {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) walk(path);
    else if (/\.(?:tsx|ts)$/.test(entry.name) && !/\.test\./.test(entry.name) && !path.includes(`${join('i18n', '')}`)) files.push(path);
  }
};
walk(sourceRoot);

const englishMarkers = /\b(?:the|and|for|with|from|your|this|that|what|how|which|use|source|market|country|countries|read|view|loading|available|official|report|story|stories|member|search|save|open|evidence|performance|page|access|submit|register|settings|privacy|terms|contact|business|investment|trade|updated|current|failed|error|next|previous|learn|explore|support|apply|select|required|optional|prepared|change|higher|lower|growth|coverage|account|service|definition|value|unit|comparison|timing|boundary|section|observation|projection|freshness|review|reporting)\b/i;
const ignored = /^(?:[A-Z0-9_./:@-]+|https?:|mailto:|tel:|[a-z]+(?:-[a-z0-9:[\]/.]+)+)$/i;
const results = [];

const record = (file, source, node, raw) => {
  const value = raw.replace(/\s+/g, ' ').trim();
  const languageSample = value.replace(/BOA-Story/g, '');
  if (value.length < 3 || !/[A-Za-z]/.test(value) || ignored.test(value) || /^(?:\/|\[data-|use client$)/.test(value) || !englishMarkers.test(languageSample)) return;
  const utilityMarkers = value.match(/(?:^|\s)(?:fixed|relative|absolute|flex|inline-flex|grid|hidden|block|items-|gap-|leading-|underline|hover:|page-|section-|content-|space-|opacity-|select-|pointer-|blur-|min-w-|max-w-|animate-|slide-|rounded(?:-|$)|bg-|text-|data-\[|z-|w-|h-|p[trblxy]?-[\d[]|m[trblxy]?-[\d[]|top-|left-|right-|inset-|overflow-|transition)/g) || [];
  if (utilityMarkers.length >= 2) return;
  if (catalogue.has(value) || maintained.has(value) || hasDynamicPortugueseTranslation(value)) return;
  const position = source.getLineAndCharacterOfPosition(node.getStart(source));
  results.push({ file: relative(root, file).replaceAll('\\', '/'), line: position.line + 1, value });
};

for (const file of files) {
  const auditRelativePath = relative(root, file).replaceAll('\\', '/');
  const skipAllLiteralAudit = /(?:\/components\/ui\/|\/components\/(?:CustomCursor|ErrorBoundary|InterfaceTranslator|SEO)\.tsx$|\/context\/LanguageContext\.tsx$)/.test(`/${auditRelativePath}`);
  const source = ts.createSourceFile(file, readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true, file.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
  const isDiagnosticLiteral = (node) => {
    let parent = node.parent;
    while (parent && !ts.isStatement(parent) && !ts.isSourceFile(parent)) {
      if (ts.isNewExpression(parent) && parent.expression.getText(source) === 'Error') return true;
      if (ts.isCallExpression(parent) && /^console\./.test(parent.expression.getText(source))) return true;
      parent = parent.parent;
    }
    return false;
  };
  const hasCodedPortugueseBranch = (node) => {
    let parent = node.parent;
    while (parent && !ts.isStatement(parent) && !ts.isSourceFile(parent)) {
      if (ts.isConditionalExpression(parent) && /language\s*===\s*['"]pt['"]/.test(parent.condition.getText(source))) return true;
      parent = parent.parent;
    }
    return false;
  };
  const visit = (node) => {
    if (ts.isJsxText(node)) record(file, source, node, node.text);
    if (ts.isJsxAttribute(node) && node.initializer && ts.isStringLiteral(node.initializer)) {
      const name = node.name.getText(source);
      const structural = /^(?:className|href|to|id|type|name|value|method|action|target|rel|src|key|variant|size|role|asChild|data-.+)$/;
      if (!structural.test(name)) record(file, source, node, node.initializer.text);
    }
    if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
      if (scanAllLiterals && !skipAllLiteralAudit && !isDiagnosticLiteral(node)
        && !ts.isImportDeclaration(node.parent) && !ts.isExportDeclaration(node.parent)) {
        record(file, source, node, node.text);
      }
      let parent = node.parent;
      while (parent && !ts.isSourceFile(parent) && !ts.isJsxAttribute(parent)) {
        if (ts.isJsxExpression(parent)) {
          record(file, source, node, node.text);
          break;
        }
        parent = parent.parent;
      }
    }
    if (scanAllLiterals && !skipAllLiteralAudit && ts.isTemplateExpression(node)
      && !isDiagnosticLiteral(node) && !hasCodedPortugueseBranch(node)) {
      const sample = `${node.head.text}${node.templateSpans.map(span => `1${span.literal.text}`).join('')}`;
      record(file, source, node, sample);
    }
    ts.forEachChild(node, visit);
  };
  visit(source);
}

const unique = [...new Map(results.map(item => [`${item.file}:${item.line}:${item.value}`, item])).values()];
console.log(JSON.stringify({ files: files.length, maintained: maintained.size, catalogue: catalogue.size, missing: unique.length, results: unique }, null, 2));
process.exitCode = unique.length ? 1 : 0;
