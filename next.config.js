
const uuid4 = require('uuid4');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  serverRuntimeConfig: {
    supabaseUrl: process.env.SUPABASE_URL,
    supabaseAnonKey: process.env.SUPABASE_ANON_KEY,
    supabaseAUTHKey: process.env.SUPABASE_AUTH_KEY,
    supabaseBucket: process.env.SUPABASE_BUCKET,
    defaultListName: process.env.DEFAULT_LIST_NAME || "lead-the-future",
    APICreateSuperUserKey: process.env.API_CREATE_SUPER_USER_KEY || uuid4(), // putting a uuid here so that it will never be guessable
  }
}

module.exports = nextConfig
