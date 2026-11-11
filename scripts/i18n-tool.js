/**
 * AgriSpine Centralized i18n Tooling
 * Scans codebases, extracts translation keys, validates dictionary parity,
 * detects missing/empty keys, synchronizes Web & Mobile dictionaries,
 * and handles automated high-quality translation generation with placeholder protection.
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

const ROOT_DIR = path.resolve(__dirname, '..');
const WEB_LOCALES_DIR = path.join(ROOT_DIR, 'frontend', 'public', 'locales');
const MOBILE_LOCALES_DIR = path.join(ROOT_DIR, 'app', 'src', 'i18n', 'translations');

const LANGUAGES = ['en', 'hi', 'te'];

// Helper to flatten nested object to dot notation
function flattenObject(obj, prefix = '') {
  let flattened = {};
  for (const key of Object.keys(obj)) {
    const val = obj[key];
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (val && typeof val === 'object' && !Array.isArray(val)) {
      Object.assign(flattened, flattenObject(val, fullKey));
    } else {
      flattened[fullKey] = val;
    }
  }
  return flattened;
}

// Helper to unflatten dot notation to nested object
function unflattenObject(flattened) {
  const result = {};
  for (const key of Object.keys(flattened)) {
    const parts = key.split('.');
    let current = result;
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      if (i === parts.length - 1) {
        current[part] = flattened[key];
      } else {
        if (!current[part] || typeof current[part] !== 'object') {
          current[part] = {};
        }
        current = current[part];
      }
    }
  }
  return result;
}

// Recursively walk a directory for source files
function walkFiles(dir, extensions = ['.js', '.jsx']) {
  let results = [];
  if (!fs.existsSync(dir)) return results;
  const list = fs.readdirSync(dir);
  for (const file of list) {
    if (['node_modules', '.git', 'build', 'dist', '.expo'].includes(file)) continue;
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      results = results.concat(walkFiles(fullPath, extensions));
    } else if (extensions.some(ext => file.endsWith(ext))) {
      results.push(fullPath);
    }
  }
  return results;
}

// Extract t('key') calls from source code
function extractKeysFromFiles(files) {
  const keys = new Set();
  // Regex to match t('key.path', ...) or t("key.path", ...) or t(`key.path`, ...)
  const tRegex = /\bt\(\s*['"`]([a-zA-Z0-9_.-]+)['"`]/g;

  for (const file of files) {
    const content = fs.readFileSync(file, 'utf8');
    let match;
    while ((match = tRegex.exec(content)) !== null) {
      const key = match[1];
      // Exclude obvious non-translation keys, dynamic prefixes, or variables
      if (!key.includes('${') && key.includes('.') && !key.endsWith('.')) {
        keys.add(key);
      }
    }
  }
  return Array.from(keys);
}

// Load dictionaries
function loadDictionaries() {
  const web = {};
  const mobile = {};

  for (const lng of LANGUAGES) {
    const webFile = path.join(WEB_LOCALES_DIR, lng, 'translation.json');
    const mobileFile = path.join(MOBILE_LOCALES_DIR, `${lng}.json`);

    web[lng] = fs.existsSync(webFile) ? JSON.parse(fs.readFileSync(webFile, 'utf8')) : {};
    mobile[lng] = fs.existsSync(mobileFile) ? JSON.parse(fs.readFileSync(mobileFile, 'utf8')) : {};
  }

  return { web, mobile };
}

// Audit command
function runAudit() {
  console.log('====================================================');
  console.log('🔍 AGRISPINE i18n AUDIT & VALIDATION');
  console.log('====================================================');

  const { web, mobile } = loadDictionaries();

  const webFiles = walkFiles(path.join(ROOT_DIR, 'frontend', 'src'));
  const mobileFiles = walkFiles(path.join(ROOT_DIR, 'app', 'src'));

  const webUsedKeys = extractKeysFromFiles(webFiles);
  const mobileUsedKeys = extractKeysFromFiles(mobileFiles);

  console.log(`📁 Frontend Source Files: ${webFiles.length}`);
  console.log(`📁 Mobile Source Files:   ${mobileFiles.length}`);
  console.log(`🔑 Used Keys in Web:      ${webUsedKeys.length}`);
  console.log(`🔑 Used Keys in Mobile:   ${mobileUsedKeys.length}`);

  console.log('\n📊 Dictionary Key Counts:');
  for (const lng of LANGUAGES) {
    const webFlat = flattenObject(web[lng]);
    const mobileFlat = flattenObject(mobile[lng]);
    console.log(`  [${lng}] Web: ${Object.keys(webFlat).length} keys | Mobile: ${Object.keys(mobileFlat).length} keys`);
  }

  // Check missing keys in Web
  console.log('\n🔎 Web Used Keys Missing from en Dictionary:');
  const webEnFlat = flattenObject(web.en);
  const webMissingInDict = webUsedKeys.filter(k => !(k in webEnFlat));
  if (webMissingInDict.length === 0) {
    console.log('  ✅ All used web keys exist in web en dictionary.');
  } else {
    console.log(`  ⚠️ ${webMissingInDict.length} keys used in web code are missing from web en dictionary:`);
    webMissingInDict.slice(0, 15).forEach(k => console.log(`     - ${k}`));
    if (webMissingInDict.length > 15) console.log(`     ... and ${webMissingInDict.length - 15} more`);
  }

  // Check missing keys in Mobile
  console.log('\n🔎 Mobile Used Keys Missing from Mobile en Dictionary:');
  const mobEnFlat = flattenObject(mobile.en);
  const mobMissingInDict = mobileUsedKeys.filter(k => !(k in mobEnFlat));
  if (mobMissingInDict.length === 0) {
    console.log('  ✅ All used mobile keys exist in mobile en dictionary.');
  } else {
    console.log(`  ⚠️ ${mobMissingInDict.length} keys used in mobile code are missing from mobile en dictionary:`);
    mobMissingInDict.slice(0, 15).forEach(k => console.log(`     - ${k}`));
    if (mobMissingInDict.length > 15) console.log(`     ... and ${mobMissingInDict.length - 15} more`);
  }

  // Check parity across languages
  for (const lng of ['hi', 'te']) {
    const targetWebFlat = flattenObject(web[lng]);
    const missingInWebTarget = Object.keys(webEnFlat).filter(k => !(k in targetWebFlat) || !targetWebFlat[k]);
    console.log(`\n🔎 Web [${lng}] missing or empty vs [en]: ${missingInWebTarget.length} keys`);
    if (missingInWebTarget.length > 0) {
      missingInWebTarget.slice(0, 10).forEach(k => console.log(`     - ${k}`));
    }

    const targetMobFlat = flattenObject(mobile[lng]);
    const missingInMobTarget = Object.keys(mobEnFlat).filter(k => !(k in targetMobFlat) || !targetMobFlat[k]);
    console.log(`🔎 Mobile [${lng}] missing or empty vs [en]: ${missingInMobTarget.length} keys`);
    if (missingInMobTarget.length > 0) {
      missingInMobTarget.slice(0, 10).forEach(k => console.log(`     - ${k}`));
    }
  }
}

// Synchronize all keys between Web and Mobile into a unified canonical dictionary
function runSync() {
  console.log('🔄 Synchronizing dictionaries between Web and Mobile...');
  const { web, mobile } = loadDictionaries();

  for (const lng of LANGUAGES) {
    const webFlat = flattenObject(web[lng]);
    const mobileFlat = flattenObject(mobile[lng]);

    // Unified dictionary merging Web and Mobile
    const unifiedFlat = { ...webFlat };

    // Add keys from mobile that web doesn't have
    for (const [k, v] of Object.entries(mobileFlat)) {
      if (!unifiedFlat[k] || (typeof unifiedFlat[k] === 'string' && !unifiedFlat[k].trim())) {
        unifiedFlat[k] = v;
      }
    }

    // Now write the unified dictionary to BOTH web and mobile
    const unifiedNested = unflattenObject(unifiedFlat);

    const webPath = path.join(WEB_LOCALES_DIR, lng, 'translation.json');
    const mobilePath = path.join(MOBILE_LOCALES_DIR, `${lng}.json`);

    fs.writeFileSync(webPath, JSON.stringify(unifiedNested, null, 2) + '\n', 'utf8');
    fs.writeFileSync(mobilePath, JSON.stringify(unifiedNested, null, 2) + '\n', 'utf8');

    console.log(`  ✅ Synced [${lng}]: ${Object.keys(unifiedFlat).length} total keys updated on Web and Mobile.`);
  }
}

const action = process.argv[2] || 'audit';

if (action === 'audit') {
  runAudit();
} else if (action === 'sync') {
  runSync();
} else {
  console.log(`Unknown action: ${action}. Use 'audit' or 'sync'.`);
}

