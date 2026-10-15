import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const srcDir = path.resolve(__dirname, '../src');

const disallowedClassPatterns = [
  /\bbg-white\b/,
  /\btext-white\b/,
  /\bbg-black\b/,
  /\btext-black\b/,
  /\b(bg|text|border|ring)-(gray|slate|zinc|neutral|stone|red|blue|indigo|violet|purple|pink)-[0-9]+\b/,
];

const hexPattern = /#[0-9a-fA-F]{3,8}\b/;

let violations = [];
let filesScanned = 0;

function scanDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      scanDir(fullPath);
    } else if (/\.(tsx|ts|jsx|js|css|html)$/.test(file)) {
      filesScanned++;
      // tokens.css is the ONLY permitted source of raw color values
      const isTokensFile = fullPath.replace(/\\/g, '/').endsWith('src/styles/tokens.css');
      const content = fs.readFileSync(fullPath, 'utf8');
      const lines = content.split('\n');

      lines.forEach((line, idx) => {
        if (!isTokensFile) {
          const hexMatch = line.match(hexPattern);
          if (hexMatch) {
            violations.push({
              file: path.relative(srcDir, fullPath),
              line: idx + 1,
              type: 'Raw Hex Color',
              detail: hexMatch[0],
              snippet: line.trim(),
            });
          }
        }

        for (const pattern of disallowedClassPatterns) {
          const classMatch = line.match(pattern);
          if (classMatch) {
            violations.push({
              file: path.relative(srcDir, fullPath),
              line: idx + 1,
              type: 'Disallowed Tailwind Color Class',
              detail: classMatch[0],
              snippet: line.trim(),
            });
          }
        }
      });
    }
  }
}

scanDir(srcDir);

console.log('='.repeat(60));
console.log(`🎨 COLOR AUDIT: Scanned ${filesScanned} files across frontend/src/`);
console.log('='.repeat(60));

if (violations.length === 0) {
  console.log('✅ 100% TOKEN COMPLIANCE: No raw hex codes or disallowed legacy classes found outside src/styles/tokens.css');
  process.exit(0);
} else {
  console.error(`❌ Found ${violations.length} color violation(s):`);
  violations.forEach(v => {
    console.error(`  [${v.type}] ${v.file}:${v.line} -> "${v.detail}"`);
    console.error(`    Line: ${v.snippet}`);
  });
  process.exit(1);
}
