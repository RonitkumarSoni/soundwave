# URI decoder compatibility package

Source: decode-uri-component 0.5.0 from npm, SHA-1 4592fa1e1d640ec5e2760e2e168ad2ab5f2c9da1. Upstream: https://github.com/SamVerschueren/decode-uri-component

The only source adaptation changes the ESM default export into module.exports, preserving the callable CommonJS interface required by query-string 7 / Expo Router 6. The upstream patched decoding algorithm and MIT license are preserved. Review this compatibility package when upgrading Expo Router; remove the override when the upstream dependency graph supports the patched ESM package.
