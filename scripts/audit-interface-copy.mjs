import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';

const root = path.resolve('frontend/src');
const ignoredAttributes = new Set([
  'className', 'href', 'to', 'src', 'id', 'key', 'name', 'type', 'method',
  'action', 'target', 'rel', 'value', 'data-testid', 'data-source-language',
]);
const technical = /(?:^|[\s"'`])(?:bg-|text-|border-|rounded-|hover:|focus:|sm:|md:|lg:|xl:|https?:\/\/|\/[a-z]|[a-z]+-[a-z]+:)/;

function filesIn(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const file = path.join(directory, entry.name);
    return entry.isDirectory() ? filesIn(file) : /\.(tsx|jsx)$/.test(entry.name) ? [file] : [];
  });
}

function clean(value) {
  return value.replace(/\s+/g, ' ').trim();
}

function isCopy(value) {
  return value.length > 1 && /[A-Za-z]{2}/.test(value) && !technical.test(value);
}

const found = [];
for (const file of filesIn(root)) {
  const source = ts.createSourceFile(file, fs.readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const visit = (node) => {
    if (ts.isJsxText(node)) {
      const value = clean(node.text);
      if (isCopy(value)) found.push({ file: path.relative(root, file).replaceAll('\\', '/'), line: source.getLineAndCharacterOfPosition(node.pos).line + 1, value });
    } else if (ts.isJsxAttribute(node) && node.initializer && !ignoredAttributes.has(node.name.text)) {
      if (ts.isStringLiteral(node.initializer)) {
        const value = clean(node.initializer.text);
        if (isCopy(value)) found.push({ file: path.relative(root, file).replaceAll('\\', '/'), line: source.getLineAndCharacterOfPosition(node.pos).line + 1, value });
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(source);
}

const unique = [...new Map(found.map((item) => [`${item.file}:${item.value}`, item])).values()];
console.log(JSON.stringify(unique, null, 2));
