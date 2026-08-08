import { readFileSync, readdirSync } from 'node:fs';
import { join, relative } from 'node:path';
import ts from 'typescript';
import { PORTUGUESE_INTERFACE_PHRASES } from '../frontend/src/i18n/pt-PT-1945.ts';

const root = process.cwd();
const sourceRoot = join(root, 'frontend', 'src');
const catalogue = new Set(Object.keys(PORTUGUESE_INTERFACE_PHRASES));
const maintained = new Set();

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
  if (value.length < 3 || !/[A-Za-z]/.test(value) || ignored.test(value) || !englishMarkers.test(value)) return;
  const utilityMarkers = value.match(/(?:^|\s)(?:fixed|relative|absolute|flex|grid|hidden|block|rounded(?:-|$)|bg-|text-|data-\[|z-|w-|h-|p[trblxy]?-[\d[]|m[trblxy]?-[\d[]|top-|left-|right-|inset-|overflow-|transition)/g) || [];
  if (utilityMarkers.length >= 2) return;
  if (catalogue.has(value) || maintained.has(value)) return;
  const position = source.getLineAndCharacterOfPosition(node.getStart(source));
  results.push({ file: relative(root, file).replaceAll('\\', '/'), line: position.line + 1, value });
};

for (const file of files) {
  const source = ts.createSourceFile(file, readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true, file.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
  const visit = (node) => {
    if (ts.isJsxText(node)) record(file, source, node, node.text);
    if (ts.isJsxAttribute(node) && node.initializer && ts.isStringLiteral(node.initializer)) {
      const name = node.name.getText(source);
      const structural = /^(?:className|href|to|id|type|name|value|method|action|target|rel|src|key|variant|size|role|asChild|data-.+)$/;
      if (!structural.test(name)) record(file, source, node, node.initializer.text);
    }
    if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
      let parent = node.parent;
      while (parent && !ts.isSourceFile(parent) && !ts.isJsxAttribute(parent)) {
        if (ts.isJsxExpression(parent)) {
          record(file, source, node, node.text);
          break;
        }
        parent = parent.parent;
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(source);
}

const unique = [...new Map(results.map(item => [`${item.file}:${item.line}:${item.value}`, item])).values()];
console.log(JSON.stringify({ files: files.length, maintained: maintained.size, catalogue: catalogue.size, missing: unique.length, results: unique }, null, 2));
process.exitCode = unique.length ? 1 : 0;
