/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  serverRuntimeConfig: {
    supabaseUrl: process.env.SUPABASE_URL,
    supabaseAnonKey: process.env.SUPABASE_ANON_KEY,
    supabaseAUTHKey: process.env.SUPABASE_AUTH_KEY,
    supabaseBucket: process.env.SUPABASE_BUCKET
  }
}

module.exports = nextConfig
