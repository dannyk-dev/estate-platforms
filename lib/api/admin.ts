import { Database } from "@/database.types"
import { assertAdmin } from "@/lib/auth/helpers"
import { createClient as createAdminClient } from '@supabase/supabase-js'


export async function getSb() {
  const { sb, user } = await assertAdmin()
  return { sb, user }
}

export const storageAdmin = createAdminClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!, // server-only
  { auth: { persistSession: false } }
)
