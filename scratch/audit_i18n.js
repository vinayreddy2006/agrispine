const fs = require('fs');
const path = require('path');

function walk(dir, ext = ['.js', '.jsx']) {
  let results = [];
  const list = fs.readdirSync(dir);
  for (let file of list) {
    if (file === 'node_modules' || file === '.git' || file === 'build' || file === 'dist') continue;
    let filePath = path.join(dir, file);
    let stat = fs.statSync(filePath);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(filePath, ext));
    } else {
      if (ext.some(e => file.endsWith(e))) results.push(filePath);
    }
  }
  return results;
}

const frontendFiles = walk('frontend/src');
const appFiles = walk('app/src');

function countTUsage(files) {
  let usesT = 0;
  let total = files.length;
  let withTFiles = [];
  let withoutTFiles = [];
  for (let f of files) {
    let content = fs.readFileSync(f, 'utf8');
    if (content.includes('useTranslation') || content.includes('useI18n') || /t\(['"]/.test(content)) {
      usesT++;
      withTFiles.push(f);
    } else {
      withoutTFiles.push(f);
    }
  }
  return { total, usesT, withoutTFiles };
}

const feStats = countTUsage(frontendFiles);
const appStats = countTUsage(appFiles);

console.log('Frontend: Total files =', feStats.total, '| Using i18n =', feStats.usesT, '| Without i18n =', feStats.withoutTFiles.length);
console.log('App: Total files =', appStats.total, '| Using i18n =', appStats.usesT, '| Without i18n =', appStats.withoutTFiles.length);

console.log('\nTop Frontend files missing i18n:');
feStats.withoutTFiles.slice(0, 20).forEach(f => console.log('  -', f));

console.log('\nTop App files missing i18n:');
appStats.withoutTFiles.slice(0, 20).forEach(f => console.log('  -', f));

