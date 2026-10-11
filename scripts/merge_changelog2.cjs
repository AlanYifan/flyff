const fs = require('fs');
const path = require('path');

const changelogPath = path.join(__dirname, '..', 'CHANGELOG.md');
const newEntryPath = path.join(__dirname, 'changelog_cloak_cd.txt');

const existingContent = fs.readFileSync(changelogPath, 'utf8');
const newEntry = fs.readFileSync(newEntryPath, 'utf8');

const combined = newEntry + '\n' + existingContent;
fs.writeFileSync(changelogPath, combined, 'utf8');

const lineCount = combined.split('\n').length;
console.log('CHANGELOG updated. Total lines: ' + lineCount);
