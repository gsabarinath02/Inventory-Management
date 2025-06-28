#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');

console.log('🧪 Starting Frontend Test Suite...\n');

// Test configuration
const testConfig = {
  coverage: true,
  verbose: true,
  watchAll: false,
  maxWorkers: 2,
  testTimeout: 10000
};

// Build command
const command = 'npm';
const args = [
  'test',
  '--',
  '--coverage',
  '--verbose',
  '--watchAll=false',
  '--maxWorkers=2',
  '--testTimeout=10000',
  '--passWithNoTests'
];

console.log('📋 Test Configuration:');
console.log(`   Coverage: ${testConfig.coverage ? 'Enabled' : 'Disabled'}`);
console.log(`   Verbose: ${testConfig.verbose ? 'Enabled' : 'Disabled'}`);
console.log(`   Watch Mode: ${testConfig.watchAll ? 'Enabled' : 'Disabled'}`);
console.log(`   Max Workers: ${testConfig.maxWorkers}`);
console.log(`   Timeout: ${testConfig.testTimeout}ms`);
console.log('');

// Run tests
const testProcess = spawn(command, args, {
  stdio: 'inherit',
  shell: true,
  cwd: path.resolve(__dirname)
});

testProcess.on('close', (code) => {
  console.log('\n📊 Test Execution Summary:');
  
  if (code === 0) {
    console.log('✅ All tests passed successfully!');
    console.log('🎉 Test suite execution completed.');
  } else {
    console.log('❌ Some tests failed.');
    console.log('🔍 Please review the test output above for details.');
    process.exit(code);
  }
});

testProcess.on('error', (error) => {
  console.error('💥 Error running tests:', error.message);
  process.exit(1);
});

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n🛑 Test execution interrupted by user.');
  testProcess.kill('SIGINT');
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Test execution terminated.');
  testProcess.kill('SIGTERM');
}); 