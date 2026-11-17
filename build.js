// Bundler script: Combines modular source files into consolidated js/game.js
const fs = require('fs');

const files = [
  'js/modules/core.js',
  'js/utils.js',
  'js/modules/calculations.js',
  'js/modules/tax.js',
  'js/modules/business.js',
  'js/modules/invest.js',
  'js/modules/ui.js',
  'js/app.js'
];

const header = `// Business Empire: RichMan - Core Game Engine (Consolidated Distribution)\n`;
const bundle = header + files.map(f => `// --- BEGIN ${f} ---\n` + fs.readFileSync(f, 'utf8') + `\n// --- END ${f} ---`).join('\n\n');

fs.writeFileSync('js/game.js', bundle, 'utf8');
console.log('✅ Successfully compiled and bundled js/game.js from modular sources!');
