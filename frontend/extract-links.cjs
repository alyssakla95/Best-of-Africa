const fs = require('fs');
const path = require('path');
function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        file = path.resolve(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            results = results.concat(walk(file));
        } else {
            if (file.endsWith('.tsx') || file.endsWith('.ts')) results.push(file);
        }
    });
    return results;
}
const files = walk('./src');
const links = new Set();
files.forEach(f => {
    const content = fs.readFileSync(f, 'utf8');
    const regex = /to=["'\`]([^"'\`{}]+)["'\`]/g;
    let match;
    while((match = regex.exec(content)) !== null) {
        links.add(match[1]);
    }
});
console.log(Array.from(links).sort().join('\n'));
