const fs = require('fs');
const path = require('path');

const directory = path.join(__dirname, 'frontend', 'src');

const replacements = [
  { old: /1C1814/ig, new: '001F3F' }, // Charcoal -> Rich Navy Blue
  { old: /F5F0E8/ig, new: 'FFFFFF' }, // Parchment -> Pure White
  { old: /EDE8DF/ig, new: 'F0F4F8' }, // Parchment Deep -> Off-white
  { old: /0B0907/ig, new: '001226' }  // Charcoal Deep -> Deep Navy
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

console.log(`Successfully updated hardcoded colors in ${updatedCount} files.`);
