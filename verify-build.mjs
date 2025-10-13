// Verify the MCP server build is correct
import { readFileSync } from 'fs';
import { existsSync } from 'fs';

console.log('🔍 Verifying websets-mcp-server build...\n');

const checks = [];

// Check 1: Built file exists
const builtFile = '.smithery/stdio/index.cjs';
if (existsSync(builtFile)) {
  const stats = (await import('fs')).statSync(builtFile);
  checks.push({
    name: 'Built file exists',
    passed: true,
    details: `${(stats.size / 1024).toFixed(1)} KB`
  });
} else {
  checks.push({name: 'Built file exists', passed: false});
}

// Check 2: Source files exist
const sourceFiles = [
  'src/index.ts',
  'src/types.ts',
  'src/tools/config.ts',
  'src/tools/createWebset.ts',
  'src/tools/listWebsets.ts',
  'src/tools/getWebset.ts',
  'src/tools/updateWebset.ts',
  'src/tools/deleteWebset.ts',
  'src/tools/listItems.ts',
  'src/tools/createEnrichment.ts',
  'src/tools/createMonitor.ts',
  'src/utils/logger.ts'
];

const allFilesExist = sourceFiles.every(f => existsSync(f));
checks.push({
  name: `${sourceFiles.length} source files exist`,
  passed: allFilesExist,
  details: sourceFiles.length + ' files'
});

// Check 3: Package.json is valid
try {
  const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
  checks.push({
    name: 'package.json valid',
    passed: true,
    details: `v${pkg.version}`
  });
} catch (e) {
  checks.push({name: 'package.json valid', passed: false});
}

// Check 4: TypeScript config exists
checks.push({
  name: 'tsconfig.json exists',
  passed: existsSync('tsconfig.json')
});

// Check 5: Documentation exists
const docs = ['README.md', 'EXAMPLES.md', 'LICENSE'];
const docsExist = docs.every(d => existsSync(d));
checks.push({
  name: 'Documentation files exist',
  passed: docsExist,
  details: docs.join(', ')
});

// Check 6: Built file has shebang
try {
  const builtContent = readFileSync(builtFile, 'utf8');
  const hasShebang = builtContent.startsWith('#!/usr/bin/env node');
  checks.push({
    name: 'Built file has shebang',
    passed: hasShebang
  });
} catch (e) {
  checks.push({name: 'Built file has shebang', passed: false});
}

// Print results
console.log('Build Verification Results:\n');
checks.forEach(check => {
  const icon = check.passed ? '✅' : '❌';
  const details = check.details ? ` (${check.details})` : '';
  console.log(`${icon} ${check.name}${details}`);
});

const allPassed = checks.every(c => c.passed);
console.log(`\n${allPassed ? '✅ All checks passed!' : '❌ Some checks failed'}`);

if (allPassed) {
  console.log('\n📦 The websets-mcp-server is ready to use!');
  console.log('\nYou can:');
  console.log('  1. Run it locally: npx websets-mcp-server');
  console.log('  2. Use with Claude Desktop (see README.md)');
  console.log('  3. Publish to npm: npm publish');
}

process.exit(allPassed ? 0 : 1);
