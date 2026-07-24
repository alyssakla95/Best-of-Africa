const fs = require('fs');
const path = require('path');

const directory = path.join(__dirname, 'frontend', 'src');

// Replacements map
const replacements = [
  // Primary (Navy)
  { old: /(bg|text|border|shadow|fill)-(\[#001F3F\]|\[#1C1814\])/ig, new: '$1-primary' },
  // Accent (Gold)
  { old: /(bg|text|border|shadow|fill|accent|ring)-(\[#C9A84C\]|\[#D4AF37\])/ig, new: '$1-accent' },
  // Background (White/Parchment)
  { old: /(bg|text|border|shadow)-(\[#FFFFFF\]|\[#F5F0E8\])/ig, new: '$1-background' },
  // Surface/Secondary (Off-white)
  { old: /(bg|text|border)-(\[#F0F4F8\]|\[#EDE8DF\])/ig, new: '$1-secondary' },
  // Deep (Deep Navy / Deep Charcoal)
  { old: /(bg|text|border)-(\[#001226\]|\[#0B0907\]|\[#0E0C0A\]|\[#1A1714\])/ig, new: '$1-card' },
  // Light Gold
  { old: /(bg|text|border)-(\[#E8C96A\]|\[#F3E5AB\])/ig, new: '$1-accent-light' },
];

function walkDir(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat && stat.isDirectory()) {
      results = results.concat(walkDir(filePath));
    } else if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
      results.push(filePath);
    }
  });
  return results;
}

const files = walkDir(directory);
let updatedCount = 0;

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let originalContent = content;
  
  replacements.forEach(r => {
    content = content.replace(r.old, r.new);
  });
  
  if (content !== originalContent) {
    fs.writeFileSync(file, content, 'utf8');
    updatedCount++;
  }
});

console.log(`Successfully refactored Tailwind classes in ${updatedCount} files.`);
