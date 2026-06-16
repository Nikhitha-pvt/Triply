const path = require('path');

// Load environment variables from the project root .env file
// so NEXT_PUBLIC_* vars are available during both dev and build.
try {
  require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });
} catch (_) {
  // dotenv may not be available in all environments; Next.js will
  // still pick up system environment variables and frontend/.env.local.
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
}
module.exports = nextConfig
