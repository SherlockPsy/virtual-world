/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  experimental: {
    serverComponentsExternalPackages: ['pg']
  },
  // Include data and prompts directories in the standalone output
  outputFileTracingIncludes: {
    '/api/world/chat': ['./data/**/*', './prompts/**/*'],
    '/api/world/state': ['./data/**/*', './prompts/**/*'],
  }
}

module.exports = nextConfig
