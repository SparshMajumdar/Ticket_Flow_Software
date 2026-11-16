/**
 * SupportFlow - Static Code & Asset Linting Utility
 * Validates JS syntax, HTML structure, and internal asset references.
 */
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const rootDir = path.resolve(__dirname, '..');
let hasErrors = false;

function error(msg) {
  console.error(`❌ [LINT ERROR] ${msg}`);
  hasErrors = true;
}

function success(msg) {
  console.log(`✅ [LINT OK] ${msg}`);
}

console.log('--- SupportFlow Code & Asset Linting ---');

// 1. Check JavaScript files for syntax errors
const jsFiles = [
  'frontend/js/state.js',
  'frontend/js/api.js',
  'frontend/js/customer.js',
  'frontend/js/admin.js',
  'frontend/js/notifications.js',
  'frontend/js/app.js',
  'frontend/js/main.js',
  'scripts/build-check.js',
  'scripts/lint.js',
  'tests/project-test.js'
];

for (const relPath of jsFiles) {
  const fullPath = path.join(rootDir, relPath);
  if (!fs.existsSync(fullPath)) {
    error(`Missing JavaScript file: ${relPath}`);
    continue;
  }
  const content = fs.readFileSync(fullPath, 'utf8');
  try {
    new vm.Script(content, { filename: relPath });
    success(`JS Syntax valid: ${relPath}`);
  } catch (err) {
    error(`Syntax error in ${relPath}: ${err.message}`);
  }
}

// 2. Check HTML files for structure and valid referenced local assets
const htmlFiles = [
  'frontend/index.html',
  'frontend/login.html',
  'frontend/signup.html',
  'frontend/staff-login.html'
];

for (const relPath of htmlFiles) {
  const fullPath = path.join(rootDir, relPath);
  if (!fs.existsSync(fullPath)) {
    error(`Missing HTML file: ${relPath}`);
    continue;
  }
  const content = fs.readFileSync(fullPath, 'utf8');

  // Verify basic required HTML structure
  if (!/<!doctype html>/i.test(content)) {
    error(`${relPath} is missing <!DOCTYPE html> declaration`);
  }
  if (!/<title>.*<\/title>/i.test(content)) {
    error(`${relPath} is missing a <title> tag`);
  }
  if (!/<meta\s+charset=/i.test(content)) {
    error(`${relPath} is missing a charset meta tag`);
  }

  // Check script src references
  const scriptMatches = [...content.matchAll(/<script[^>]+src=["']([^"']+)["']/gi)];
  for (const match of scriptMatches) {
    const src = match[1];
    if (!src.startsWith('http://') && !src.startsWith('https://') && !src.startsWith('//')) {
      const assetPath = path.join(rootDir, 'frontend', src);
      if (!fs.existsSync(assetPath)) {
        error(`${relPath} references non-existent script: ${src}`);
      }
    }
  }

  // Check stylesheet / icon link references
  const linkMatches = [...content.matchAll(/<link[^>]+href=["']([^"']+)["']/gi)];
  for (const match of linkMatches) {
    const href = match[1];
    if (!href.startsWith('http://') && !href.startsWith('https://') && !href.startsWith('//') && !href.startsWith('data:')) {
      const assetPath = path.join(rootDir, 'frontend', href);
      if (!fs.existsSync(assetPath)) {
        error(`${relPath} references non-existent asset link: ${href}`);
      }
    }
  }

  success(`HTML & asset references valid: ${relPath}`);
}

// 3. Check CSS file
const cssFile = path.join(rootDir, 'frontend/css/style.css');
if (fs.existsSync(cssFile) && fs.statSync(cssFile).size > 0) {
  success('CSS stylesheet present and non-empty: frontend/css/style.css');
} else {
  error('Missing or empty frontend/css/style.css');
}

console.log('----------------------------------------');
if (hasErrors) {
  console.error('Linting failed with errors.');
  process.exit(1);
} else {
  console.log('All lint checks passed successfully!');
  process.exit(0);
}

