const { networkInterfaces } = require('node:os');
const { spawn } = require('node:child_process');
const path = require('node:path');

const interfaces = Object.entries(networkInterfaces());
const usable = interfaces.filter(([name]) => !/virtual|vEthernet|loopback|local area connection/i.test(name));
usable.sort(([a], [b]) => Number(/wi-?fi|wireless/i.test(b)) - Number(/wi-?fi|wireless/i.test(a)));
const address = usable.flatMap(([, entries]) => entries || []).find(entry => entry.family === 'IPv4' && !entry.internal)?.address;
if (!address) {
  console.error('Connect this PC to Wi-Fi or Ethernet before starting local phone testing.');
  process.exit(1);
}
const args = process.argv.slice(2);
const productionTest = args.includes('--production-api');
const tunnel = args.includes('--tunnel');
const apiUrl = productionTest
  ? require('../eas.json').build.preview.env.EXPO_PUBLIC_API_URL
  : `http://${address}:3001/api`;
console.log(productionTest
  ? `Production backend: ${apiUrl}\nThis tests the same backend as the preview APK. Connect the phone to the same network for Expo.`
  : `Local backend: ${apiUrl}\nKeep the backend terminal running; connect the phone to the same network.`);
const env = { ...process.env, EXPO_PUBLIC_API_URL: apiUrl };
if (tunnel) delete env.REACT_NATIVE_PACKAGER_HOSTNAME;
else env.REACT_NATIVE_PACKAGER_HOSTNAME = address;
const child = spawn(process.execPath, [path.join(__dirname, '..', 'node_modules', 'expo', 'bin', 'cli'), 'start', '--go', ...(tunnel ? [] : ['--lan']), '--clear', ...args.filter(arg => arg !== '--production-api')], {
  cwd: path.join(__dirname, '..'),
  stdio: 'inherit',
  env,
});
child.on('error', error => { console.error(error.message); process.exitCode = 1; });
child.on('exit', code => { process.exitCode = code || 0; });
