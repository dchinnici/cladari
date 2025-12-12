// Silence workspace root warnings in nested setups
const path = require('path')

/** @type {import('next').NextConfig} */
const nextConfig = {
  outputFileTracingRoot: path.join(__dirname),
  allowedDevOrigins: [
    'http://f1',
    'http://f1.tail2ea078.ts.net',
    'http://100.88.172.122',
  ],
}

module.exports = nextConfig
