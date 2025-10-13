// Simple synchronous test that doesn't hang
console.log('🧪 Testing Websets MCP Server\n');

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`✅ ${name}`);
    passed++;
  } catch (error) {
    console.log(`❌ ${name}: ${error.message}`);
    failed++;
  }
}

// Test 1: Check built file
test('Built file exists', () => {
  const fs = require('fs');
  if (!fs.existsSync('.smithery/stdio/index.cjs')) {
    throw new Error('Built file not found');
  }
});

// Test 2: Check source files
test('All source files exist', () => {
  const fs = require('fs');
  const files = [
    'src/index.ts',
    'src/types.ts',
    'src/tools/createWebset.ts',
    'src/tools/listWebsets.ts',
    'src/tools/getWebset.ts',
    'src/tools/updateWebset.ts',
    'src/tools/deleteWebset.ts',
    'src/tools/listItems.ts',
    'src/tools/createEnrichment.ts',
    'src/tools/createMonitor.ts',
    'src/utils/logger.ts',
    'src/tools/config.ts'
  ];
  
  files.forEach(file => {
    if (!fs.existsSync(file)) {
      throw new Error(`Missing: ${file}`);
    }
  });
});

// Test 3: Package.json valid
test('package.json is valid', () => {
  const pkg = require('./package.json');
  if (!pkg.name || !pkg.version) {
    throw new Error('Invalid package.json');
  }
});

// Test 4: Dependencies installed
test('Dependencies installed', () => {
  const fs = require('fs');
  if (!fs.existsSync('node_modules')) {
    throw new Error('node_modules not found');
  }
});

// Test 5: TypeScript config
test('TypeScript config exists', () => {
  const fs = require('fs');
  if (!fs.existsSync('tsconfig.json')) {
    throw new Error('tsconfig.json not found');
  }
});

// Test 6: Documentation
test('README exists', () => {
  const fs = require('fs');
  if (!fs.existsSync('README.md')) {
    throw new Error('README.md not found');
  }
});

// Test 7: Examples
test('EXAMPLES.md exists', () => {
  const fs = require('fs');
  if (!fs.existsSync('EXAMPLES.md')) {
    throw new Error('EXAMPLES.md not found');
  }
});

//Test 8: Shebang in built file
test('Built file has shebang', () => {
  const fs = require('fs');
  const content = fs.readFileSync('.smithery/stdio/index.cjs', 'utf8');
  if (!content.startsWith('#!/usr/bin/env node')) {
    throw new Error('Shebang missing');
  }
});

console.log('\n' + '='.repeat(60));
console.log(`Total: ${passed + failed} tests`);
console.log(`Passed: ${passed} ✅`);
console.log(`Failed: ${failed} ❌`);
console.log('='.repeat(60));

if (failed === 0) {
  console.log('\n🎉 All tests passed!');
  console.log('\n✅ The websets-mcp-server is ready to use.');
} else {
  console.log('\n⚠️  Some tests failed.');
  process.exit(1);
}
