# Expo asset compatibility

Vendored MIT image-size 2.0.3 CJS distribution, obtained from the npm package. The only runtime change converts a local filename to a Buffer at the start of imageSize in lib/cjs/lookup.js. Metro passes filenames in both its host and worker processes; version 2 accepts binary data. All patched upstream format handlers are preserved. Remove this adapter after upgrading Metro to support the binary API. Upstream: https://github.com/image-size/image-size
