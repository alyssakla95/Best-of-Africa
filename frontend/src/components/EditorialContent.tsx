import React, { Fragment, useMemo } from 'react';
import { cn, stripProcessLeakage } from '@/lib/utils';

type EditorialBlock =
  | { kind: 'heading'; level: number; text: string }
  | { kind: 'paragraph'; text: string }
  | { kind: 'list'; ordered: boolean; items: Array<{ text: string; value?: number }> }
  | { kind: 'quote'; text: string }
  | { kind: 'callout'; paragraphs: string[] }
  | { kind: 'table'; headers: string[]; rows: string[][] }
  | { kind: 'divider' };

interface EditorialContentProps {
  content: string;
  className?: string;
  variant?: 'brief' | 'article';
}

const splitTableRow = (line: string) => line.trim().replace(/^\|/, '').replace(/\|$/, '')
  .split('|').map(cell => cell.trim());

const isTableDivider = (line: string) => {
  const cells = splitTableRow(line);
  return cells.length > 1 && cells.every(cell => /^:?-{3,}:?$/.test(cell));
};

const isPipeRow = (line: string) => {
  const trimmed = line.trim();
  return (trimmed.startsWith('|') || /\s\|\s/.test(trimmed)) && splitTableRow(trimmed).length > 1;
};

const nextContentIndex = (lines: string[], start: number) => {
  let index = start;
  while (index < lines.length && !lines[index].trim()) index += 1;
  return index;
};

const startsTable = (lines: string[], index: number) => {
  const next = nextContentIndex(lines, index + 1);
  if (!isPipeRow(lines[index] || '') || !isPipeRow(lines[next] || '')) return false;
  return splitTableRow(lines[index]).length === splitTableRow(lines[next]).length;
};

const startsBlock = (lines: string[], index: number) => {
  const line = lines[index] || '';
  return /^#{1,6}\s+/.test(line) || /^\s*[-*+]\s+/.test(line)
    || /^\s*\d+[.)]\s+/.test(line) || /^>\s?/.test(line)
    || /^\s*(---+|___+|\*\*\*+)\s*$/.test(line) || /^```/.test(line)
    || startsTable(lines, index);
};

function parseEditorialContent(content: string): EditorialBlock[] {
  const lines = stripProcessLeakage(content)
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\r\n?/g, '\n')
    .split('\n');
  const blocks: EditorialBlock[] = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index];
    if (!line.trim() || /^\s*(?:\*{1,2}|_{1,2}|#{1,6}|`{1,3})\s*$/.test(line)) {
      index += 1;
      continue;
    }

    if (/^```/.test(line)) {
      index += 1;
      const paragraphs: string[] = [];
      while (index < lines.length && !/^```/.test(lines[index])) {
        const value = lines[index++].trim();
        if (value) paragraphs.push(value);
      }
      if (index < lines.length) index += 1;
      if (paragraphs.length) blocks.push({ kind: 'callout', paragraphs });
      continue;
    }

    const heading = line.match(/^(#{1,6})\s+(.+)$/);
    if (heading) {
      blocks.push({ kind: 'heading', level: Math.min(heading[1].length, 3), text: heading[2] });
      index += 1;
      continue;
    }

    if (/^\s*(---+|___+|\*\*\*+)\s*$/.test(line)) {
      blocks.push({ kind: 'divider' });
      index += 1;
      continue;
    }

    if (startsTable(lines, index)) {
      const headers = splitTableRow(line);
      index = nextContentIndex(lines, index + 1);
      if (isTableDivider(lines[index] || '')) index = nextContentIndex(lines, index + 1);
      const rows: string[][] = [];
      while (index < lines.length && isPipeRow(lines[index]) && lines[index].trim()) {
        const row = splitTableRow(lines[index++]);
        if (!isTableDivider(row.join('|'))) rows.push(row);
        index = nextContentIndex(lines, index);
      }
      blocks.push({ kind: 'table', headers, rows });
      continue;
    }

    const listMatch = line.match(/^\s*([-*+]|\d+[.)])\s+(.+)$/);
    if (listMatch) {
      const ordered = /^\d/.test(listMatch[1]);
      const items: Array<{ text: string; value?: number }> = [];
      const pattern = ordered ? /^\s*(\d+)[.)]\s+(.+)$/ : /^\s*[-*+]\s+(.+)$/;
      while (index < lines.length) {
        const match = lines[index].match(pattern);
        if (!match) break;
        items.push(ordered ? { value: Number(match[1]), text: match[2] } : { text: match[1] });
        index += 1;
        let next = index;
        while (next < lines.length && !lines[next].trim()) next += 1;
        if (next > index && next < lines.length && pattern.test(lines[next])) index = next;
      }
      blocks.push({ kind: 'list', ordered, items });
      continue;
    }

    if (/^>\s?/.test(line)) {
      const quote: string[] = [];
      while (index < lines.length && /^>\s?/.test(lines[index])) quote.push(lines[index++].replace(/^>\s?/, ''));
      blocks.push({ kind: 'quote', text: quote.join(' ') });
      continue;
    }

    const paragraph = [line.trim()];
    index += 1;
    while (index < lines.length && lines[index].trim() && !startsBlock(lines, index)) {
      paragraph.push(lines[index++].trim());
    }
    blocks.push({ kind: 'paragraph', text: paragraph.join(' ') });
  }

  return blocks;
}

const inlinePattern = /(\[[^\]]+\]\((?:https?:\/\/|\/)[^\s)]+\)|\*\*[^*]+\*\*|__[^_]+__|`[^`]+`|(?<!\*)\*[^*\n]+\*(?!\*))/g;

function InlineText({ text }: { text: string }) {
  const parts = text.split(inlinePattern).filter(Boolean);
  return <>{parts.map((part, index) => {
    const link = part.match(/^\[([^\]]+)\]\(((?:https?:\/\/|\/)[^\s)]+)\)$/);
    if (link) return <a key={index} href={link[2]} target="_blank" rel="noopener noreferrer">{link[1]}</a>;
    if ((part.startsWith('**') && part.endsWith('**')) || (part.startsWith('__') && part.endsWith('__'))) {
      return <strong key={index}>{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith('*') && part.endsWith('*')) return <em key={index}>{part.slice(1, -1)}</em>;
    if (part.startsWith('`') && part.endsWith('`')) return <span key={index} className="editorial-term">{part.slice(1, -1)}</span>;
    return <Fragment key={index}>{part.replace(/\*\*|__|`/g, '')}</Fragment>;
  })}</>;
}

export const EditorialContent: React.FC<EditorialContentProps> = ({ content, className, variant = 'brief' }) => {
  const blocks = useMemo(() => parseEditorialContent(content || ''), [content]);

  return (
    <div className={cn('editorial-content', `editorial-content--${variant}`, className)}>
      {blocks.map((block, index) => {
        if (block.kind === 'heading') {
          const Heading = (block.level <= 1 ? 'h2' : block.level === 2 ? 'h3' : 'h4') as 'h2' | 'h3' | 'h4';
          return <Heading key={index}><InlineText text={block.text} /></Heading>;
        }
        if (block.kind === 'paragraph') return <p key={index}><InlineText text={block.text} /></p>;
        if (block.kind === 'quote') return <blockquote key={index}><InlineText text={block.text} /></blockquote>;
        if (block.kind === 'divider') return <hr key={index} />;
        if (block.kind === 'callout') return (
          <aside key={index} className="editorial-callout" aria-label="Additional context">
            {block.paragraphs.map((paragraph, paragraphIndex) => <p key={paragraphIndex}><InlineText text={paragraph} /></p>)}
          </aside>
        );
        if (block.kind === 'list') {
          const items = block.items.map((item, itemIndex) => (
            <li key={itemIndex} value={block.ordered ? item.value : undefined}><InlineText text={item.text} /></li>
          ));
          return block.ordered
            ? <ol key={index} start={block.items[0]?.value || 1}>{items}</ol>
            : <ul key={index}>{items}</ul>;
        }
        return (
          <div key={index} className="editorial-data" role="region" aria-label="Evidence table" tabIndex={0}>
            <table>
              <thead><tr>{block.headers.map((header, headerIndex) => <th key={headerIndex} scope="col"><InlineText text={header} /></th>)}</tr></thead>
              <tbody>{block.rows.map((row, rowIndex) => (
                <tr key={rowIndex}>{block.headers.map((header, cellIndex) => (
                  <td key={cellIndex} data-label={header}><InlineText text={row[cellIndex] || ''} /></td>
                ))}</tr>
              ))}</tbody>
            </table>
          </div>
        );
      })}
    </div>
  );
};
