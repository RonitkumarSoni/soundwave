const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const eas = require('../eas.json');
const source = readFileSync(path.join(__dirname, '../scripts/start-local.cjs'), 'utf8');
function start(args) {
  let launched;
  vm.runInNewContext(source, {
    __dirname: path.join(__dirname, '../scripts'),
    process: { execPath: process.execPath, argv: ['node', 'script', ...args], env: { EXPO_PUBLIC_API_URL: 'http://stale-localhost:3001/api' } },
    console: { log() {}, error() {} },
    require(name) {
      if (name === 'node:os') return { networkInterfaces: () => ({ WiFi: [{ family: 'IPv4', internal: false, address: '192.168.1.10' }] }) };
      if (name === 'node:child_process') return { spawn: (command, argv, options) => { launched = { command, argv, options }; return { on() {} }; } };
      if (name === '../eas.json') return eas;
      return require(name);
    },
  });
  return launched;
}
test('local testing uses the current LAN backend address', () => {
  assert.equal(start([]).options.env.EXPO_PUBLIC_API_URL, 'http://192.168.1.10:3001/api');
});
test('production phone testing uses the APK backend even when a local URL exists', () => {
  const launch = start(['--production-api', '--port', '8082']);
  assert.equal(launch.options.env.EXPO_PUBLIC_API_URL, eas.build.preview.env.EXPO_PUBLIC_API_URL);
  assert.equal(launch.options.env.REACT_NATIVE_PACKAGER_HOSTNAME, '192.168.1.10');
  assert.equal(launch.argv.includes('--production-api'), false);
  assert.deepEqual(Array.from(launch.argv.slice(-2)), ['--port', '8082']);
});
test('tunnel testing keeps the production API without conflicting LAN settings', () => {
  const launch = start(['--production-api', '--tunnel']);
  assert.equal(launch.options.env.EXPO_PUBLIC_API_URL, eas.build.preview.env.EXPO_PUBLIC_API_URL);
  assert.equal(launch.argv.includes('--tunnel'), true);
  assert.equal(launch.argv.includes('--lan'), false);
  assert.equal(launch.options.env.REACT_NATIVE_PACKAGER_HOSTNAME, undefined);
});
