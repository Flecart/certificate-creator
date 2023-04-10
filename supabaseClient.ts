import getConfig from 'next/config'

import { createClient } from '@supabase/supabase-js'

const { serverRuntimeConfig } = getConfig()


// Create a Supabase client with the Auth context of the logged in user.
const supabaseClient = createClient(

    // Supabase API URL - env var exported by default.
    serverRuntimeConfig.supabaseUrl,

    // Supabase API ANON KEY - env var exported by default.
    serverRuntimeConfig.supabaseAnonKey,

    // Create client with Auth context of the user that called the function.
    // This way your row-level-security (RLS) policies are applied.
    { global: { headers: { Authorization: serverRuntimeConfig.supabaseAUTHKey} } }
)

export default supabaseClient;